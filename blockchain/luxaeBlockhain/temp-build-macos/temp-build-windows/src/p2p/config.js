export const config = {
    p2p: {
        mainNode: {
            address: '161.22.47.84',
            apiPort: 3000,
            p2pPort: 30303,
            peerId: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N'
        },
        bootstrapNodes: [
            '/ip4/161.22.47.84/tcp/30303/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N'
        ],
        port: process.env.P2P_PORT || 30303,
        discovery: {
            enabled: true,
            interval: 5000,
            bootstrap: {
                enabled: true,
                timeout: 5000
            },
            mdns: {
                enabled: true
            }
        },
        addresses: {
            listen: [
                '/ip4/0.0.0.0/tcp/30303',
                '/ip4/127.0.0.1/tcp/30303'
            ]
        },
        connectionManager: {
            minConnections: 3,
            maxConnections: 50,
            pollInterval: 5000
        }
    }
} 