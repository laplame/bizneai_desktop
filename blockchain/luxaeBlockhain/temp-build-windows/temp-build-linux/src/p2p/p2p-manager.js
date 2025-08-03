import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { bootstrap } from '@libp2p/bootstrap'
import { mplex } from '@libp2p/mplex'
import { noise } from '@chainsafe/libp2p-noise'
import { createFromJSON } from '@libp2p/peer-id-factory'
import { config } from './config.js'

class P2PManager {
    constructor(blockchain) {
        this.blockchain = blockchain
        this.peers = new Map()
        this.node = null
        this.isRunning = false
    }

    async init() {
        try {
            // Intentar diferentes puertos si el principal está ocupado
            const ports = [30303, 30304, 30305, 30306]
            let error = null

            for (const port of ports) {
                try {
                    console.log(`Intentando iniciar nodo P2P en puerto ${port}...`)
                    
                    const node = await createLibp2p({
                        addresses: {
                            listen: [`/ip4/0.0.0.0/tcp/${port}`]
                        },
                        transports: [tcp()],
                        streamMuxers: [mplex()],
                        connectionEncryption: [noise()],
                        peerDiscovery: [
                            bootstrap({
                                list: config.p2p.bootstrapNodes
                            })
                        ],
                        nat: {
                            enabled: true,
                            description: 'Luxae Node'
                        },
                        relay: {
                            enabled: true,
                            hop: {
                                enabled: true
                            }
                        },
                        identify: {
                            host: {
                                agentVersion: 'luxae/1.0.0',
                                protocolVersion: '1.0.0'
                            }
                        }
                    })

                    this.node = node
                    await this.setupProtocolHandlers()
                    await this.node.start()
                    
                    // Mostrar información de conexión
                    const multiaddrs = this.node.getMultiaddrs()
                    console.log('Nodo P2P iniciado con las siguientes direcciones:')
                    multiaddrs.forEach(addr => {
                        console.log(addr.toString())
                    })
                    console.log('PeerId:', this.node.peerId.toString())
                    
                    // Intentar conectar a nodos bootstrap
                    if (config.p2p.bootstrapNodes.length > 0) {
                        console.log('Intentando conectar a nodos bootstrap...')
                        for (const addr of config.p2p.bootstrapNodes) {
                            try {
                                await this.node.dial(addr)
                                console.log('Conectado a:', addr)
                            } catch (err) {
                                console.warn('No se pudo conectar a:', addr, err.message)
                            }
                        }
                    }

                    // Marcar el nodo como running
                    this.isRunning = true
                    console.log('✅ Nodo P2P iniciado y funcionando')

                    return // Si llegamos aquí, el nodo se inició correctamente
                } catch (e) {
                    error = e
                    console.log(`Error al iniciar en puerto ${port}:`, e.message)
                }
            }

            throw error || new Error('No se pudo iniciar el nodo P2P en ningún puerto')

        } catch (error) {
            console.error('Error al inicializar nodo P2P:', error)
            throw error
        }
    }

    async setupProtocolHandlers() {
        await this.node.handle('/blockchain/sync', this.handleSync.bind(this))
        await this.node.handle('/blockchain/tx', this.handleTransaction.bind(this))
        await this.node.handle('/blockchain/block', this.handleNewBlock.bind(this))
        await this.node.handle('/blockchain/participants', this.handleParticipantsSync.bind(this))
    }

    setupEventHandlers() {
        this.node.addEventListener('peer:connect', (evt) => {
            const peerId = evt.detail.remotePeer.toString()
            console.log('Connected to peer:', peerId)
            this.peers.set(peerId, evt.detail)
            
            // Sincronizar cadena y participantes
            Promise.all([
                this.syncWithPeer(evt.detail),
                this.syncParticipants(evt.detail)
            ]).catch(err => console.error('Failed to sync with peer:', err))
        })

        this.node.addEventListener('peer:disconnect', (evt) => {
            const peerId = evt.detail.remotePeer.toString()
            console.log('Disconnected from peer:', peerId)
            this.peers.delete(peerId)
        })
    }

    async handleSync({ stream }) {
        try {
            const chainData = JSON.stringify(this.blockchain.chain)
            await stream.sink([Buffer.from(chainData)])
        } catch (err) {
            console.error('Error handling sync:', err)
        } finally {
            await stream.close()
        }
    }

    async handleTransaction({ stream }) {
        try {
            const chunks = []
            for await (const chunk of stream.source) {
                chunks.push(chunk)
            }
            const data = Buffer.concat(chunks).toString()
            const transaction = JSON.parse(data)
            
            // Validar y añadir transacción al pool
            this.blockchain.createTransaction(transaction)
            
            // Broadcast a otros peers
            await this.broadcastTransaction(transaction)
        } catch (err) {
            console.error('Error handling transaction:', err)
        } finally {
            await stream.close()
        }
    }

    async handleNewBlock({ stream }) {
        try {
            const chunks = []
            for await (const chunk of stream.source) {
                chunks.push(chunk)
            }
            const data = Buffer.concat(chunks).toString()
            const block = JSON.parse(data)
            
            // Validar y añadir bloque
            if (this.blockchain.isValidBlock(block)) {
                this.blockchain.chain.push(block)
                // Broadcast a otros peers
                await this.broadcastBlock(block)
            }
        } catch (err) {
            console.error('Error handling new block:', err)
        } finally {
            await stream.close()
        }
    }

    async handleParticipantsSync({ stream }) {
        try {
            const activeNodes = this.blockchain.participants.getActiveNodes();
            const participantsData = JSON.stringify(activeNodes);
            await stream.sink([Buffer.from(participantsData)]);
        } catch (err) {
            console.error('Error handling participants sync:', err);
        } finally {
            await stream.close();
        }
    }

    async syncParticipants(peer) {
        try {
            const { stream } = await this.node.dialProtocol(peer.remotePeer, '/blockchain/participants');
            const chunks = [];
            for await (const chunk of stream.source) {
                chunks.push(chunk);
            }
            const remoteParticipants = JSON.parse(Buffer.concat(chunks).toString());
            
            // Actualizar participantes locales
            remoteParticipants.forEach(participant => {
                this.blockchain.registerParticipant({
                    address: participant.address,
                    balance: participant.balance,
                    type: 'node',
                    data: participant
                });
            });
        } catch (err) {
            console.error('Error syncing participants:', err);
        }
    }

    async syncWithPeer(peer) {
        try {
            const { stream } = await this.node.dialProtocol(peer.remotePeer, '/blockchain/sync')
            const chunks = []
            for await (const chunk of stream.source) {
                chunks.push(chunk)
            }
            const remoteChain = JSON.parse(Buffer.concat(chunks).toString())
            
            if (remoteChain.length > this.blockchain.chain.length) {
                if (this.blockchain.isValidChain(remoteChain)) {
                    this.blockchain.chain = remoteChain
                    console.log('Chain synchronized with peer')
                }
            }
        } catch (err) {
            console.error('Error syncing with peer:', err)
        }
    }

    async broadcastTransaction(transaction) {
        const message = Buffer.from(JSON.stringify(transaction))
        const promises = []

        for (const [peerId, peer] of this.peers) {
            promises.push((async () => {
                try {
                    const { stream } = await this.node.dialProtocol(peer.remotePeer, '/blockchain/tx')
                    await stream.sink([message])
                    await stream.close()
                } catch (err) {
                    console.error(`Failed to broadcast transaction to peer ${peerId}:`, err)
                }
            })())
        }

        await Promise.allSettled(promises)
    }

    async broadcastBlock(block) {
        const message = Buffer.from(JSON.stringify(block))
        const promises = []

        for (const [peerId, peer] of this.peers) {
            promises.push((async () => {
                try {
                    const { stream } = await this.node.dialProtocol(peer.remotePeer, '/blockchain/block')
                    await stream.sink([message])
                    await stream.close()
                } catch (err) {
                    console.error(`Failed to broadcast block to peer ${peerId}:`, err)
                }
            })())
        }

        await Promise.allSettled(promises)
    }

    async stop() {
        if (this.node) {
            await this.node.stop()
            this.isRunning = false
            console.log('P2P Node stopped')
        }
    }
}

export default P2PManager 