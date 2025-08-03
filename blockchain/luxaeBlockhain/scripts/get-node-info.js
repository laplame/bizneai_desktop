import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import chalk from 'chalk';
import os from 'os';

async function getNodeInfo() {
    console.log(chalk.cyan('\n=== Luxae Node Information ==='));
    
    // Obtener información del sistema
    console.log(chalk.yellow('\n📱 Sistema:'));
    console.log('OS:', os.platform(), os.release());
    console.log('CPU:', os.cpus()[0].model);
    console.log('Memoria Total:', formatBytes(os.totalmem()));
    console.log('Memoria Libre:', formatBytes(os.freemem()));

    // Obtener información de red
    console.log(chalk.yellow('\n🌐 Interfaces de Red:'));
    const networkInterfaces = os.networkInterfaces();
    Object.keys(networkInterfaces).forEach(interfaceName => {
        const interfaces = networkInterfaces[interfaceName];
        interfaces.forEach(interface_ => {
            if (interface_.family === 'IPv4') {
                console.log(`${interfaceName}:`, interface_.address);
            }
        });
    });

    try {
        // Inicializar nodo temporal para obtener información
        const node = await createLibp2p({
            addresses: {
                listen: ['/ip4/0.0.0.0/tcp/0'] // Puerto aleatorio para prueba
            },
            transports: [tcp()],
            streamMuxers: [mplex()],
            connectionEncryption: [noise()]
        });

        await node.start();

        // Mostrar información del nodo
        console.log(chalk.yellow('\n🔑 Información del Nodo:'));
        console.log('PeerId:', chalk.green(node.peerId.toString()));
        
        console.log(chalk.yellow('\n📍 Direcciones Multiaddr:'));
        node.getMultiaddrs().forEach(addr => {
            console.log(chalk.green(addr.toString()));
        });

        // Generar string de conexión para otros nodos
        console.log(chalk.yellow('\n🔗 String de Conexión para Otros Nodos:'));
        const mainAddr = node.getMultiaddrs()[0];
        const connectionString = `${mainAddr}/p2p/${node.peerId.toString()}`;
        console.log(chalk.green(connectionString));

        // Instrucciones de uso
        console.log(chalk.yellow('\n📝 Instrucciones:'));
        console.log('1. Copia el string de conexión anterior');
        console.log('2. En el archivo src/p2p/config.js del otro nodo, añade el string a bootstrapNodes:');
        console.log(chalk.cyan(`
    bootstrapNodes: [
        '${connectionString}'
    ],`));

        await node.stop();

        // Información adicional
        console.log(chalk.yellow('\n💡 Puertos Recomendados:'));
        console.log('- P2P: 30303 (por defecto)');
        console.log('- API: 3000');

        console.log(chalk.yellow('\n🔍 Verificación:'));
        console.log('Para verificar la conexión, ejecuta en ambos nodos:');
        console.log(chalk.cyan('pnpm monitor'));

    } catch (error) {
        console.error(chalk.red('\n❌ Error obteniendo información del nodo:'), error.message);
    }
}

function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

// Ejecutar y manejar errores
getNodeInfo().catch(error => {
    console.error(chalk.red('\nError fatal:'), error);
    process.exit(1);
}); 