import NetworkMonitor from '../monitoring/NetworkMonitor.js';
import Blockchain from '../Blockchain.js';
import P2PManager from '../p2p/p2p-manager.js';

async function main() {
    try {
        // Inicializar blockchain
        const blockchain = new Blockchain('pos');
        
        // Inicializar P2P Manager
        const p2pManager = new P2PManager(blockchain);
        await p2pManager.init();
        
        // Inicializar y comenzar el monitor
        const monitor = new NetworkMonitor(blockchain, p2pManager);
        monitor.startMonitoring();
        
        // Manejar el cierre graceful
        process.on('SIGINT', async () => {
            console.log('\nDeteniendo el monitor...');
            monitor.stopMonitoring();
            await p2pManager.stop();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('Error iniciando el monitor:', error);
        process.exit(1);
    }
}

main().catch(console.error); 