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
        this.nodeId = null;
        this.port = process.env.P2P_PORT || 30303;
        this.apiPort = process.env.API_PORT || 3000;
        
        // Configuración para red local
        this.isMainNode = this.checkIfMainNode();
        this.bootstrapNodes = this.getBootstrapNodes();
        
        console.log(`P2P Manager inicializado - Puerto: ${this.port}, API: ${this.apiPort}`);
    }

    checkIfMainNode() {
        // En desarrollo local, el primer nodo será el principal
        return this.port === '30303' && this.apiPort === '3000';
    }

    getBootstrapNodes() {
        // Nodos bootstrap para red distribuida
        const distributedBootstrapNodes = [
            // Nodo local (desarrollo)
            '/ip4/127.0.0.1/tcp/30303/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
            
            // Nodos de producción (servidores)
            '/ip4/TU_SERVIDOR_IP/tcp/30303/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
            '/ip4/SERVIDOR2_IP/tcp/30303/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
            '/ip4/SERVIDOR3_IP/tcp/30303/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
            '/ip4/SERVIDOR4_IP/tcp/30303/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
            '/ip4/SERVIDOR5_IP/tcp/30303/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N'
        ];
        
        return distributedBootstrapNodes;
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
            const response = await axios.get(`http://127.0.0.1:3000/health`, {
                timeout: 5000
            });

            if (response.data.status === 'ok') {
                console.log('✓ Nodo principal activo');
                try {
                    const peersResponse = await axios.get(
                        `http://127.0.0.1:3000/api/network/peers`
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
            const mainNodeInfo = await this.checkMainNode();

            // Configuración base de libp2p
            const config = {
                addresses: {
                    listen: [
                        `/ip4/0.0.0.0/tcp/${this.port}`,
                        `/ip4/127.0.0.1/tcp/${this.port}`
                    ]
                },
                transports: [tcp()],
                streamMuxers: [mplex()],
                connectionEncryption: [noise()],
                services: {}
            };

            // Agregar bootstrap para todos los nodos
            config.services.bootstrap = bootstrap({
                list: this.bootstrapNodes,
                timeout: 5000,
                tagTTL: 120000
            });

            // Crear instancia de libp2p
            this.libp2p = await createLibp2p(config);

            // Configurar event listeners
            this.setupEventListeners();
            
            // Iniciar libp2p
            await this.libp2p.start();
            this.nodeId = this.libp2p.peerId.toString();
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
        console.log('\n🌐 Información del Nodo P2P:');
        console.log('Tipo:', this.isMainNode ? 'Principal' : 'Validador');
        console.log('PeerId:', this.nodeId);
        console.log('Puerto P2P:', this.port);
        console.log('Puerto API:', this.apiPort);
        console.log('Direcciones:');
        addresses.forEach(addr => console.log(`- ${addr.toString()}`));
        console.log('');
    }

    // Manejadores de eventos
    async handlePeerDiscovery(evt) {
        const remotePeer = evt.detail;
        console.log('🔍 Peer descubierto:', remotePeer.id.toString());
        
        // Intentar conectar automáticamente
        try {
            await this.libp2p.dial(remotePeer.id);
        } catch (error) {
            console.log('❌ Error conectando con peer:', error.message);
        }
    }

    async handlePeerConnect(evt) {
        const connection = evt.detail;
        const remotePeer = connection.remotePeer;
        console.log('✅ Peer conectado:', remotePeer.toString());
        
        this.peers.set(remotePeer.toString(), {
            id: remotePeer.toString(),
            connection: connection,
            connectedAt: Date.now(),
            latency: 0
        });
        
        // Broadcast del estado del nodo
        await this.broadcastNodeInfo();
    }

    async handlePeerDisconnect(evt) {
        const connection = evt.detail;
        const remotePeer = connection.remotePeer;
        console.log('❌ Peer desconectado:', remotePeer.toString());
        this.peers.delete(remotePeer.toString());
    }

    async init() {
        await this.setupLibp2p();
        this.isRunning = true;
        
        // Intentar conectar con nodos conocidos
        await this.connectToKnownPeers();
    }

    async connectToKnownPeers() {
        // Intentar conectar con otros nodos locales
        const knownPeers = [
            '/ip4/127.0.0.1/tcp/30303/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
            '/ip4/127.0.0.1/tcp/30304/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
            '/ip4/127.0.0.1/tcp/30305/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N'
        ];
        
        for (const peerAddr of knownPeers) {
            try {
                const ma = multiaddr(peerAddr);
                await this.libp2p.dial(ma);
                console.log('✅ Conectado a peer conocido:', peerAddr);
            } catch (error) {
                console.log('⚠️ No se pudo conectar a:', peerAddr);
            }
        }
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
        return this.libp2p?.isStarted() || false;
    }

    getNodeId() {
        return this.nodeId || 'initializing';
    }

    // Métodos para interactuar con la red P2P
    async broadcast(message) {
        if (!this.libp2p || !this.isRunning) {
            console.log('⚠️ P2P no está ejecutándose');
            return;
        }
        
        const peers = this.libp2p.getConnections();
        for (const connection of peers) {
            try {
                // Implementar protocolo de mensajes
                console.log('📡 Broadcast a:', connection.remotePeer.toString());
            } catch (error) {
                console.log('❌ Error en broadcast:', error.message);
            }
        }
    }

    async broadcastNodeInfo() {
        const nodeInfo = {
            type: 'node_info',
            nodeId: this.nodeId,
            port: this.port,
            apiPort: this.apiPort,
            isMainNode: this.isMainNode,
            timestamp: Date.now()
        };
        
        await this.broadcast(nodeInfo);
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