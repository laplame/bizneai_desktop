import chalk from 'chalk';

class NetworkMonitor {
    constructor(blockchain, p2pManager) {
        this.blockchain = blockchain;
        this.p2pManager = p2pManager;
        this.isMonitoring = false;
        this.monitoringInterval = null;
    }

    async displayNetworkSummary() {
        console.clear();
        console.log(chalk.blue('=== Estado de la Red Luxae ==='));
        await this.printNodesSummary();
        await this.printBlockchainSummary();
    }

    async printNodesSummary() {
        try {
            const peerCount = await this.p2pManager.getPeerCount();
            const peers = await this.p2pManager.getPeers();
            
            console.log(chalk.yellow('\nNodos Conectados:'), chalk.green(peerCount));
            
            if (peers.length > 0) {
                console.log(chalk.yellow('\nDetalles de Peers:'));
                peers.forEach(peer => {
                    console.log(chalk.cyan(`  - ID: ${peer.id}`));
                    console.log(`    Conectado desde: ${new Date(peer.connectedAt).toLocaleString()}`);
                });
            } else {
                console.log(chalk.yellow('\nNo hay peers conectados actualmente'));
            }
        } catch (error) {
            console.error(chalk.red('Error obteniendo información de nodos:', error.message));
        }
    }

    async printBlockchainSummary() {
        try {
            console.log(chalk.yellow('\nEstado de la Blockchain:'));
            console.log(chalk.cyan(`  - Bloques: ${this.blockchain.chain.length}`));
            console.log(chalk.cyan(`  - Validadores: ${this.blockchain.validators.size}`));
            
            const lastBlock = this.blockchain.chain[this.blockchain.chain.length - 1];
            if (lastBlock) {
                console.log(chalk.cyan(`  - Último Bloque: ${lastBlock.hash.substring(0, 10)}...`));
                console.log(chalk.cyan(`  - Altura: ${lastBlock.index}`));
                console.log(chalk.cyan(`  - Timestamp: ${new Date(lastBlock.timestamp).toLocaleString()}`));
            }
        } catch (error) {
            console.error(chalk.red('Error obteniendo información de la blockchain:', error.message));
        }
    }

    startMonitoring(interval = 5000) {
        if (this.isMonitoring) {
            console.log(chalk.yellow('El monitoreo ya está activo'));
            return;
        }

        this.isMonitoring = true;
        console.log(chalk.green('Iniciando monitoreo de red...'));

        // Mostrar estado inicial
        this.displayNetworkSummary();

        // Configurar actualización periódica
        this.monitoringInterval = setInterval(() => {
            this.displayNetworkSummary();
        }, interval);

        // Manejar señales de terminación
        process.on('SIGINT', () => {
            this.stopMonitoring();
            process.exit(0);
        });
    }

    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        console.log(chalk.yellow('\nMonitoreo detenido'));
    }
}

export default NetworkMonitor; 