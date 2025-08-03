import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import Blockchain from '../src/Blockchain.js';
import P2PManager from '../src/p2p/p2p-manager.js';
import APIServer from '../src/api/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startAPI() {
    try {
        // Cargar configuración
        const port = process.env.API_PORT || 3000;
        
        // Inicializar blockchain
        const blockchain = new Blockchain('pos');
        console.log('Blockchain initialized');

        // Inicializar P2P
        const p2pManager = new P2PManager(blockchain);
        await p2pManager.init();
        console.log('P2P network initialized');

        // Inicializar API Server
        const apiServer = new APIServer(blockchain, p2pManager);
        await apiServer.start(port);
        console.log(`API Server running on port ${port}`);

        // Configurar graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\nShutting down API server...');
            await apiServer.stop();
            await p2pManager.stop();
            process.exit(0);
        });

        // Mantener proceso vivo
        process.stdin.resume();
        
        console.log('\nAPI is running and ready for requests');
        console.log('Documentation available at: http://localhost:3000/api-docs');
        console.log('Press Ctrl+C to stop');

    } catch (error) {
        console.error('Failed to start API server:', error);
        process.exit(1);
    }
}

startAPI().catch(console.error); 