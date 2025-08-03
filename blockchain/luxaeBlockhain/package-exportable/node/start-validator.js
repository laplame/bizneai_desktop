import Blockchain from '../src/blockchain/Blockchain.js'
import P2PManager from '../src/network/P2PManager.js'
import APIServer from '../src/api/server.js'
import NetworkMonitor from '../src/monitoring/NetworkMonitor.js'
import LuxaeToken from '../src/token/LuxaeToken.js'

async function main() {
    console.log('Iniciando nodo Luxae...');
    let blockchain, p2pManager, apiServer, monitor;
    
    try {
        // Inicializar blockchain
        blockchain = new Blockchain();
        await blockchain.init();
        console.log('✓ Blockchain inicializada');
        
        // Inicializar P2P
        p2pManager = new P2PManager(blockchain);
        await p2pManager.init();
        console.log('✓ P2P Manager inicializado');
        
        // Iniciar API server
        apiServer = new APIServer(blockchain, p2pManager);
        await apiServer.start();
        console.log('✓ API Server iniciado');
        
        // Iniciar monitor de red
        monitor = new NetworkMonitor(blockchain, p2pManager);
        monitor.startMonitoring();
        console.log('✓ Monitor de red iniciado');
        
        // Manejar cierre graceful
        process.on('SIGINT', async () => {
            console.log('\n\nDeteniendo servicios Luxae...');
            
            try {
                // Detener servicios en orden inverso
                console.log('Deteniendo monitor...');
                monitor?.stopMonitoring();
                
                console.log('Deteniendo API server...');
                await apiServer?.stop();
                
                console.log('Deteniendo P2P manager...');
                await p2pManager?.stop();
                
                console.log('Guardando estado de blockchain...');
                await blockchain?.stop();
                
                console.log('✓ Todos los servicios detenidos correctamente');
                process.exit(0);
            } catch (error) {
                console.error('Error durante el apagado:', error);
                process.exit(1);
            }
        });
        
        console.log('\nNodo Luxae iniciado correctamente');
        console.log('Presiona Ctrl+C para detener todos los servicios');
        
    } catch (error) {
        console.error('Error iniciando nodo:', error);
        // Intentar detener servicios que se hayan iniciado
        monitor?.stopMonitoring();
        await apiServer?.stop();
        await p2pManager?.stop();
        await blockchain?.stop();
        process.exit(1);
    }
}

main(); 