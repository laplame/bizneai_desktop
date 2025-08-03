import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { bootstrap } from '@libp2p/bootstrap';
import { createFromJSON } from '@libp2p/peer-id-factory';
import { multiaddr } from '@multiformats/multiaddr';
import axios from 'axios';
import os from 'os';

class P2PManager {
    constructor(blockchain) {
        this.blockchain = blockchain;
        this.peers = new Map();
        this.isRunning = false;
        this.libp2p = null;
        this.mainNodeAddress = '161.22.47.84';
        this.mainNodeApiPort = '3000';
        this.mainNodeP2PPort = '30303';
        this.isMainNode = this.checkIfMainNode();
        
        // Lista de nodos bootstrap por defecto
        this.bootstrapNodes = [
            `/ip4/${this.mainNodeAddress}/tcp/${this.mainNodeP2PPort}/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N`
        ];
    }

    checkIfMainNode() {
        // Verificar si este nodo es el nodo principal
        const networkInterfaces = os.networkInterfaces();
        return Object.values(networkInterfaces)
            .flat()
            .some(interface_ => interface_.address === this.mainNodeAddress);
    }

    async checkMainNode() {
        // Si es el nodo principal, no necesita verificar
        if (this.isMainNode) {
            console.log('✓ Ejecutando como nodo principal');
            return {
                mainNodeActive: true,
                peers: []
            };
        }

        try {
            // Verificar si el nodo principal está activo
            const response = await axios.get(`http://${this.mainNodeAddress}:${this.mainNodeApiPort}/health`, {
                timeout: 5000
            });

            if (response.data.status === 'ok') {
                console.log('✓ Nodo principal activo');
                try {
                    const peersResponse = await axios.get(
                        `http://${this.mainNodeAddress}:${this.mainNodeApiPort}/api/network/peers`
                    );
                    return {
                        mainNodeActive: true,
                        peers: peersResponse.data
                    };
                } catch (peerError) {
                    console.log('⚠️ No se pudieron obtener peers del nodo principal');
                    return {
                        mainNodeActive: true,
                        peers: []
                    };
                }
            }
        } catch (error) {
            console.log('⚠️ Nodo principal no disponible, iniciando en modo autónomo');
            return {
                mainNodeActive: false,
                peers: []
            };
        }
    }

    async setupLibp2p() {
        try {
            const port = process.env.P2P_PORT || 30303;
            const mainNodeInfo = await this.checkMainNode();

            // Configuración base de libp2p
            const config = {
                addresses: {
                    listen: [
                        '/ip4/0.0.0.0/tcp/30303',  // Escuchar en todas las interfaces
                        '/ip4/127.0.0.1/tcp/30303' // También escuchar en localhost
                    ]
                },
                transports: [tcp()],
                streamMuxers: [mplex()],
                connectionEncryption: [noise()],
                services: {}
            };

            // Si no es el nodo principal, agregar bootstrap
            if (!this.isMainNode) {
                config.services.bootstrap = bootstrap({
                    list: this.bootstrapNodes,
                    timeout: 5000,
                    tagTTL: 120000
                });
            }

            // Crear instancia de libp2p
            this.libp2p = await createLibp2p(config);

            // Configurar event listeners
            this.setupEventListeners();
            
            // Iniciar libp2p
            await this.libp2p.start();
            this.logNodeInfo();

            return true;
        } catch (error) {
            console.error('Error configurando libp2p:', error);
            throw error;
        }
    }

    setupEventListeners() {
        this.libp2p.addEventListener('peer:discovery', this.handlePeerDiscovery.bind(this));
        this.libp2p.addEventListener('peer:connect', this.handlePeerConnect.bind(this));
        this.libp2p.addEventListener('peer:disconnect', this.handlePeerDisconnect.bind(this));
    }

    logNodeInfo() {
        const addresses = this.libp2p.getMultiaddrs();
        console.log('\nInformación del Nodo:');
        console.log('Tipo:', this.isMainNode ? 'Principal' : 'Validador');
        console.log('PeerId:', this.libp2p.peerId.toString());
        console.log('Direcciones:');
        addresses.forEach(addr => console.log(`- ${addr.toString()}`));
    }

    // Manejadores de eventos
    async handlePeerDiscovery(evt) {
        const remotePeer = evt.detail;
        console.log('Peer descubierto:', remotePeer.id.toString());
    }

    async handlePeerConnect(evt) {
        const connection = evt.detail;
        const remotePeer = connection.remotePeer;
        console.log('Peer conectado:', remotePeer.toString());
        
        this.peers.set(remotePeer.toString(), {
            id: remotePeer.toString(),
            connection: connection,
            connectedAt: Date.now()
        });
    }

    async handlePeerDisconnect(evt) {
        const connection = evt.detail;
        const remotePeer = connection.remotePeer;
        console.log('Peer desconectado:', remotePeer.toString());
        this.peers.delete(remotePeer.toString());
    }

    async init() {
        await this.setupLibp2p();
        this.isRunning = true;
    }

    async start() {
        if (!this.isRunning) {
            await this.init();
        }
        return true;
    }

    async stop() {
        if (this.libp2p) {
            await this.libp2p.stop();
        }
        this.isRunning = false;
    }

    isRunning() {
        return this.libp2p?.isStarted() && this.peers.size > 0;
    }

    getNodeId() {
        return this.libp2p?.peerId?.toString() || 'initializing';
    }

    // Métodos para interactuar con la red P2P
    async broadcast(message) {
        // Implementar broadcast de mensajes
    }

    async getPeers() {
        return Array.from(this.peers.values());
    }

    async getPeerCount() {
        return this.peers.size;
    }

    async getPeerInfo() {
        return Array.from(this.peers.values()).map(peer => ({
            id: peer.id,
            multiaddr: peer.connection.remoteAddr.toString(),
            connectedAt: peer.connectedAt,
            latency: peer.latency || 0,
            direction: peer.connection.direction,
            status: 'connected'
        }));
    }
}

export default P2PManager; 