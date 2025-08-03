import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BlockchainService {
    constructor() {
        this.blockchainProcess = null;
        this.apiProcess = null;
        this.isRunning = false;
        this.blockchainPath = path.join(__dirname, '../blockchain/luxaeBlockhain');
    }

    async startBlockchain() {
        try {
            console.log('🚀 Starting Luxae Blockchain...');
            
            // Start the blockchain validator
            this.blockchainProcess = spawn('node', ['scripts/start-validator.js'], {
                cwd: this.blockchainPath,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            this.blockchainProcess.stdout.on('data', (data) => {
                console.log(`Blockchain: ${data.toString()}`);
            });

            this.blockchainProcess.stderr.on('data', (data) => {
                console.error(`Blockchain Error: ${data.toString()}`);
            });

            this.blockchainProcess.on('close', (code) => {
                console.log(`Blockchain process exited with code ${code}`);
                this.isRunning = false;
            });

            // Wait a bit for blockchain to initialize
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Start the API server
            this.apiProcess = spawn('node', ['scripts/start-api-v2.js'], {
                cwd: this.blockchainPath,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            this.apiProcess.stdout.on('data', (data) => {
                console.log(`API: ${data.toString()}`);
            });

            this.apiProcess.stderr.on('data', (data) => {
                console.error(`API Error: ${data.toString()}`);
            });

            this.apiProcess.on('close', (code) => {
                console.log(`API process exited with code ${code}`);
            });

            this.isRunning = true;
            console.log('✅ Blockchain services started successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Error starting blockchain:', error);
            return false;
        }
    }

    async stopBlockchain() {
        try {
            console.log('🛑 Stopping blockchain services...');
            
            if (this.apiProcess) {
                this.apiProcess.kill('SIGINT');
                this.apiProcess = null;
            }
            
            if (this.blockchainProcess) {
                this.blockchainProcess.kill('SIGINT');
                this.blockchainProcess = null;
            }
            
            this.isRunning = false;
            console.log('✅ Blockchain services stopped');
            
            return true;
        } catch (error) {
            console.error('❌ Error stopping blockchain:', error);
            return false;
        }
    }

    async getBlockchainStatus() {
        try {
            const response = await fetch('http://localhost:3001/health');
            if (response.ok) {
                const data = await response.json();
                return {
                    status: 'running',
                    api: data,
                    blockchain: this.isRunning
                };
            }
        } catch (error) {
            // API not responding
        }
        
        return {
            status: 'stopped',
            api: null,
            blockchain: this.isRunning
        };
    }

    async getMiningInfo() {
        try {
            const response = await fetch('http://localhost:3001/api/v2/mining/status');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error getting mining info:', error);
        }
        
        return {
            isMining: false,
            currentBlock: 0,
            difficulty: 0,
            hashrate: 0
        };
    }

    async startMining() {
        try {
            const response = await fetch('http://localhost:3001/api/v2/mining/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error starting mining:', error);
        }
        
        return { success: false, message: 'Failed to start mining' };
    }

    async stopMining() {
        try {
            const response = await fetch('http://localhost:3001/api/v2/mining/stop', {
                method: 'POST'
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error stopping mining:', error);
        }
        
        return { success: false, message: 'Failed to stop mining' };
    }

    async getBlockchainData() {
        try {
            const response = await fetch('http://localhost:3001/api/v2/blockchain/status');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error getting blockchain data:', error);
        }
        
        return {
            chainLength: 0,
            lastBlock: null,
            pendingTransactions: 0,
            totalTransactions: 0
        };
    }

    async getWalletInfo(address) {
        try {
            const response = await fetch(`http://localhost:3001/api/v2/wallet/${address}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error getting wallet info:', error);
        }
        
        return {
            address: address,
            balance: 0,
            transactions: []
        };
    }

    async sendTransaction(fromAddress, toAddress, amount) {
        try {
            const response = await fetch('http://localhost:3001/api/v2/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fromAddress,
                    toAddress,
                    amount: parseFloat(amount)
                })
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error sending transaction:', error);
        }
        
        return { success: false, message: 'Failed to send transaction' };
    }
}

export default BlockchainService; 