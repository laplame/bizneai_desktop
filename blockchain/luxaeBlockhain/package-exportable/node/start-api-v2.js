import BlockchainAPI from '../src/api/v2/BlockchainAPI.js';
import Blockchain from '../src/Blockchain.js';
import P2PManager from '../src/p2p/p2p-manager.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startAPI() {
    try {
        console.log('🚀 Iniciando Luxae Blockchain API v2...');

        // Initialize blockchain
        console.log('📦 Inicializando blockchain...');
        const blockchain = new Blockchain('pos'); // Use PoS consensus
        
        // Initialize P2P manager
        console.log('🌐 Inicializando P2P manager...');
        const p2pManager = new P2PManager(blockchain);
        
        // Try to initialize P2P (but don't fail if it doesn't work)
        try {
            await p2pManager.init();
            console.log('✅ P2P manager inicializado correctamente');
        } catch (error) {
            console.warn('⚠️ P2P manager no pudo inicializarse:', error.message);
            console.log('🔄 Continuando sin P2P...');
        }

        // Create and start API
        console.log('🔧 Creando API v2...');
        const api = new BlockchainAPI(blockchain, p2pManager);
        
        const port = process.env.PORT || 3001; // Changed to 3001 to avoid conflicts
        await api.start(port);

        console.log('✅ API v2 iniciada correctamente');
        console.log(`🌐 Servidor corriendo en: http://localhost:${port}`);
        console.log(`📚 Documentación: http://localhost:${port}/api-docs`);
        console.log(`🏥 Health check: http://localhost:${port}/health`);

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Recibida señal de interrupción, cerrando servidor...');
            await api.stop();
            if (p2pManager) {
                await p2pManager.stop();
            }
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\n🛑 Recibida señal de terminación, cerrando servidor...');
            await api.stop();
            if (p2pManager) {
                await p2pManager.stop();
            }
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Error iniciando API v2:', error);
        process.exit(1);
    }
}

// Start the API
startAPI(); 