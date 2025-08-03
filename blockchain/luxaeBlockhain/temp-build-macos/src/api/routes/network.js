import express from 'express';
import os from 'os';

export default function networkRoutes(blockchain, p2pManager) {
    const router = express.Router();

    /**
     * @swagger
     * /api/network/connections:
     *   get:
     *     summary: Obtener todas las conexiones de red activas
     */
    router.get('/connections', async (req, res) => {
        try {
            const connections = Array.from(p2pManager.peers.entries()).map(([peerId, peer]) => ({
                id: peerId,
                address: peer.remotePeer?.toString(),
                latency: peer.latency || 0,
                connected: true,
                lastSeen: Date.now(),
                status: 'active',
                deviceType: peer.metadata?.deviceType || 'unknown',
                platform: peer.metadata?.platform || 'unknown',
                version: peer.metadata?.version || 'unknown'
            }));

            res.json({
                total: connections.length,
                connections,
                nodeInfo: {
                    address: p2pManager.node?.peerId?.toString(),
                    platform: os.platform(),
                    deviceType: detectDeviceType()
                }
            });
        } catch (error) {
            console.error('Error getting network connections:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/network/stats:
     *   get:
     *     summary: Obtener estadísticas de red
     */
    router.get('/stats', async (req, res) => {
        try {
            const stats = {
                totalConnections: p2pManager.peers.size,
                activeNodes: blockchain.participants?.getActiveNodes()?.length || 0,
                networkLatency: calculateAverageLatency(p2pManager.peers),
                discoveryEnabled: true,
                lastUpdate: Date.now(),
                nodeTypes: calculateNodeTypes(p2pManager.peers),
                networkHealth: calculateNetworkHealth(p2pManager.peers)
            };
            
            res.json(stats);
        } catch (error) {
            console.error('Error getting network stats:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/network/peers:
     *   get:
     *     summary: Obtener información de los peers
     */
    router.get('/peers', async (req, res) => {
        try {
            const peers = await p2pManager.getPeerInfo();
            res.json(peers);
        } catch (error) {
            console.error('Error getting peers:', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}

function detectDeviceType() {
    const platform = os.platform();
    const arch = os.arch();
    
    if (platform === 'android' || platform === 'ios') return 'mobile';
    if (platform === 'darwin' && arch === 'arm64') return 'mobile';
    return 'desktop';
}

function getNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const result = {};
    
    for (const [name, addrs] of Object.entries(interfaces)) {
        result[name] = addrs.filter(addr => addr.family === 'IPv4');
    }
    
    return result;
}

function calculateNodeTypes(peers) {
    const types = {
        desktop: 0,
        mobile: 0,
        unknown: 0
    };
    
    peers.forEach(peer => {
        const type = peer.metadata?.deviceType || 'unknown';
        types[type] = (types[type] || 0) + 1;
    });
    
    return types;
}

function calculateGeographicDistribution(peers) {
    // Implementar lógica para determinar la distribución geográfica
    // basada en las IPs de los peers
    return {};
}

function calculateNetworkHealth(peers) {
    const totalPeers = peers.size;
    if (totalPeers === 0) return 'unknown';
    
    const avgLatency = calculateAverageLatency(peers);
    if (avgLatency < 100) return 'excellent';
    if (avgLatency < 300) return 'good';
    if (avgLatency < 1000) return 'fair';
    return 'poor';
}

function calculateAverageLatency(peers) {
    if (peers.size === 0) return 0;
    const totalLatency = Array.from(peers.values())
        .reduce((sum, peer) => sum + (peer.latency || 0), 0);
    return Math.round(totalLatency / peers.size);
} 