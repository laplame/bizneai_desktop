import Blockchain from '../src/blockchain/Blockchain.js';

async function initBlockchain() {
    console.log('Inicializando blockchain...');
    try {
        const blockchain = new Blockchain();
        await blockchain.init();
        console.log('Blockchain inicializada correctamente');
    } catch (error) {
        console.error('Error inicializando blockchain:', error);
        process.exit(1);
    }
}

initBlockchain(); 