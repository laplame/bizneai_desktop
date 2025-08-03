import { Router } from 'express';

export const statusRoutes = (blockchain, p2pManager) => {
    const router = Router();

    router.get('/status', (req, res) => {
        try {
            const status = {
                blockchain: {
                    height: blockchain.chain.length,
                    pendingTransactions: blockchain.pendingTransactions.length,
                    activeValidators: blockchain.validators ? blockchain.validators.size : 0,
                    consensus: blockchain.consensus,
                    lastBlock: blockchain.getLatestBlock(),
                    syncing: blockchain.isSyncing || false
                },
                network: {
                    connections: p2pManager?.peers?.size || 0,
                    peers: p2pManager?.peers ? Array.from(p2pManager.peers.entries()).map(([id, peer]) => ({
                        id,
                        latency: peer.latency || 0,
                        connected: true,
                        address: peer.remotePeer?.toString()
                    })) : [],
                    localAddress: p2pManager?.node?.peerId?.toString() || 'not available',
                    discoveryEnabled: true,
                    port: process.env.P2P_PORT || 30303
                },
                node: {
                    version: '1.0.0',
                    platform: process.platform,
                    uptime: process.uptime(),
                    memory: process.memoryUsage()
                }
            };
            res.json(status);
        } catch (error) {
            console.error('Error getting status:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Endpoint de salud básico
    router.get('/health', (req, res) => {
        try {
            const status = {
                status: 'ok',
                timestamp: Date.now(),
                services: {
                    api: true,
                    blockchain: blockchain?.isRunning || false,
                    p2p: p2pManager?.isRunning || false
                },
                node: {
                    id: p2pManager?.getNodeId() || 'initializing',
                    type: p2pManager?.isMainNode ? 'main' : 'validator',
                    peers: p2pManager?.getPeerCount() || 0,
                    uptime: process.uptime(),
                    state: blockchain?.getState() || 'running'
                },
                system: {
                    memory: process.memoryUsage(),
                    platform: process.platform,
                    version: process.version
                }
            };

            // Verificar que todos los servicios estén realmente funcionando
            if (!blockchain?.isRunning) {
                status.status = 'partial';
                status.services.blockchain = false;
            }
            
            if (!p2pManager?.isRunning) {
                status.status = 'partial';
                status.services.p2p = false;
            }

            res.json(status);
        } catch (error) {
            console.error('Health check error:', error);
            res.status(500).json({
                status: 'error',
                error: error.message,
                services: {
                    api: true,
                    blockchain: false,
                    p2p: false
                }
            });
        }
    });

    return router;
}; 