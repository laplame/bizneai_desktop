import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SimpleBlockchainService {
    constructor() {
        this.isRunning = false;
        this.apiServer = null;
        this.blockchainData = {
            chain: [],
            pendingTransactions: [],
            miningReward: 100,
            difficulty: 2,
            isMining: false,
            isDiscreteMining: false,
            networkHashrate: 2500,
            averageBlockTime: 12.5
        };
        this.port = 3001;
        this.discreteMiningInterval = null;
        this.posIntegrationEnabled = true;
    }

    async startBlockchain() {
        try {
            console.log('🚀 Starting Simple Blockchain Service...');
            
            // Create a simple blockchain API server
            this.apiServer = express();
            
            // Middleware
            this.apiServer.use(helmet());
            this.apiServer.use(cors());
            this.apiServer.use(express.json());
            
            // Health check endpoint
            this.apiServer.get('/health', (req, res) => {
                res.json({
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    blockchain: {
                        chainLength: this.blockchainData.chain.length,
                        pendingTransactions: this.blockchainData.pendingTransactions.length,
                        isMining: this.blockchainData.isMining,
                        isDiscreteMining: this.blockchainData.isDiscreteMining
                    }
                });
            });

            // Blockchain status endpoint
            this.apiServer.get('/api/v2/blockchain/status', (req, res) => {
                res.json({
                    chainLength: this.blockchainData.chain.length,
                    lastBlock: this.blockchainData.chain.length > 0 ? this.blockchainData.chain[this.blockchainData.chain.length - 1] : null,
                    pendingTransactions: this.blockchainData.pendingTransactions.length,
                    totalTransactions: this.blockchainData.chain.reduce((total, block) => total + block.transactions.length, 0),
                    networkHashrate: this.blockchainData.networkHashrate,
                    averageBlockTime: this.blockchainData.averageBlockTime
                });
            });

            // Mining status endpoint
            this.apiServer.get('/api/v2/mining/status', (req, res) => {
                res.json({
                    isMining: this.blockchainData.isMining,
                    currentBlock: this.blockchainData.chain.length,
                    difficulty: this.blockchainData.difficulty,
                    hashrate: this.blockchainData.isMining ? Math.floor(Math.random() * 1000) + 100 : 0,
                    isDiscreteMining: this.blockchainData.isDiscreteMining
                });
            });

            // Start mining endpoint
            this.apiServer.post('/api/v2/mining/start', (req, res) => {
                this.blockchainData.isMining = true;
                console.log('⛏️ Mining started');
                
                // Simulate mining process
                this.startMiningSimulation();
                
                res.json({
                    success: true,
                    message: 'Mining started successfully'
                });
            });

            // Stop mining endpoint
            this.apiServer.post('/api/v2/mining/stop', (req, res) => {
                this.blockchainData.isMining = false;
                console.log('⛏️ Mining stopped');
                
                res.json({
                    success: true,
                    message: 'Mining stopped successfully'
                });
            });

            // Start discrete mining endpoint
            this.apiServer.post('/api/v2/mining/discrete/start', (req, res) => {
                this.blockchainData.isDiscreteMining = true;
                console.log('👁️ Discrete mining started');
                
                // Start discrete mining for POS transactions
                this.startDiscreteMining();
                
                res.json({
                    success: true,
                    message: 'Discrete mining started successfully'
                });
            });

            // Stop discrete mining endpoint
            this.apiServer.post('/api/v2/mining/discrete/stop', (req, res) => {
                this.blockchainData.isDiscreteMining = false;
                console.log('👁️ Discrete mining stopped');
                
                if (this.discreteMiningInterval) {
                    clearInterval(this.discreteMiningInterval);
                    this.discreteMiningInterval = null;
                }
                
                res.json({
                    success: true,
                    message: 'Discrete mining stopped successfully'
                });
            });

            // Network status endpoint
            this.apiServer.get('/api/v2/network/status', (req, res) => {
                res.json({
                    totalNodes: 15,
                    onlineNodes: 12,
                    totalStake: 50000,
                    averageBlockTime: this.blockchainData.averageBlockTime,
                    networkHashrate: this.blockchainData.networkHashrate,
                    consensus: 'active'
                });
            });

            // Network nodes endpoint
            this.apiServer.get('/api/v2/network/nodes', (req, res) => {
                const mockNodes = [
                    {
                        id: 'node-001',
                        address: '192.168.1.100:30303',
                        status: 'online',
                        lastSeen: new Date().toISOString(),
                        version: '1.0.0',
                        isValidator: true,
                        stake: 10000
                    },
                    {
                        id: 'node-002',
                        address: '192.168.1.101:30303',
                        status: 'online',
                        lastSeen: new Date().toISOString(),
                        version: '1.0.0',
                        isValidator: true,
                        stake: 8500
                    },
                    {
                        id: 'node-003',
                        address: '192.168.1.102:30303',
                        status: 'syncing',
                        lastSeen: new Date().toISOString(),
                        version: '1.0.0',
                        isValidator: false,
                        stake: 0
                    }
                ];
                
                res.json(mockNodes);
            });

            // Wallet info endpoint
            this.apiServer.get('/api/v2/wallet/:address', (req, res) => {
                const address = req.params.address;
                const balance = this.calculateBalance(address);
                const transactions = this.getTransactionsForAddress(address);
                const stakedAmount = this.calculateStakedAmount(address);
                const rewards = this.calculateRewards(address);
                
                res.json({
                    address: address,
                    balance: balance,
                    transactions: transactions,
                    stakedAmount: stakedAmount,
                    rewards: rewards
                });
            });

            // Send transaction endpoint
            this.apiServer.post('/api/v2/transactions', (req, res) => {
                const { fromAddress, toAddress, amount } = req.body;
                
                if (!fromAddress || !toAddress || !amount) {
                    return res.status(400).json({
                        success: false,
                        message: 'Missing required fields'
                    });
                }

                const transaction = {
                    fromAddress,
                    toAddress,
                    amount: parseFloat(amount),
                    timestamp: Date.now(),
                    id: Math.random().toString(36).substr(2, 9)
                };

                this.blockchainData.pendingTransactions.push(transaction);
                
                // If discrete mining is enabled, mine immediately for POS transactions
                if (this.blockchainData.isDiscreteMining && this.posIntegrationEnabled) {
                    console.log('🛒 POS transaction detected, mining immediately...');
                    setTimeout(() => {
                        this.mineNewBlock();
                    }, 1000);
                }
                
                res.json({
                    success: true,
                    message: 'Transaction added to pending transactions',
                    transaction: transaction
                });
            });

            // POS integration endpoint
            this.apiServer.post('/api/v2/pos/transaction', (req, res) => {
                const { saleId, amount, items } = req.body;
                
                const posTransaction = {
                    fromAddress: 'pos-system',
                    toAddress: 'pos-wallet',
                    amount: parseFloat(amount),
                    timestamp: Date.now(),
                    id: Math.random().toString(36).substr(2, 9),
                    saleId: saleId,
                    items: items,
                    type: 'pos-sale'
                };

                this.blockchainData.pendingTransactions.push(posTransaction);
                
                // If discrete mining is enabled, mine immediately
                if (this.blockchainData.isDiscreteMining) {
                    console.log('🛒 POS sale detected, mining immediately...');
                    setTimeout(() => {
                        this.mineNewBlock();
                    }, 1000);
                }
                
                res.json({
                    success: true,
                    message: 'POS transaction added and mining triggered',
                    transaction: posTransaction
                });
            });

            // Create genesis block if chain is empty
            if (this.blockchainData.chain.length === 0) {
                this.createGenesisBlock();
            }

            // Start the server
            this.apiServer.listen(this.port, () => {
                console.log(`✅ Blockchain API server running on port ${this.port}`);
                console.log(`🌐 Health check: http://localhost:${this.port}/health`);
                console.log(`📚 API endpoints: http://localhost:${this.port}/api/v2/`);
            });

            this.isRunning = true;
            return true;
        } catch (error) {
            console.error('❌ Error starting blockchain service:', error);
            return false;
        }
    }

    async stopBlockchain() {
        try {
            console.log('🛑 Stopping blockchain service...');
            
            if (this.apiServer && this.apiServer.close) {
                this.apiServer.close();
                this.apiServer = null;
            }
            
            if (this.discreteMiningInterval) {
                clearInterval(this.discreteMiningInterval);
                this.discreteMiningInterval = null;
            }
            
            this.blockchainData.isMining = false;
            this.blockchainData.isDiscreteMining = false;
            this.isRunning = false;
            
            console.log('✅ Blockchain service stopped');
            return true;
        } catch (error) {
            console.error('❌ Error stopping blockchain service:', error);
            return false;
        }
    }

    createGenesisBlock() {
        const genesisBlock = {
            index: 0,
            timestamp: Date.now(),
            transactions: [],
            previousHash: "0",
            hash: "genesis",
            validator: "genesis",
            signature: "genesis"
        };
        
        this.blockchainData.chain.push(genesisBlock);
        console.log('🌱 Genesis block created');
    }

    startMiningSimulation() {
        if (!this.blockchainData.isMining) return;

        // Simulate mining a new block every 10 seconds
        setTimeout(() => {
            if (this.blockchainData.isMining) {
                this.mineNewBlock();
                this.startMiningSimulation(); // Continue mining
            }
        }, 10000);
    }

    startDiscreteMining() {
        if (this.discreteMiningInterval) {
            clearInterval(this.discreteMiningInterval);
        }

        // Check for POS transactions every 5 seconds
        this.discreteMiningInterval = setInterval(() => {
            if (this.blockchainData.isDiscreteMining && this.blockchainData.pendingTransactions.length > 0) {
                console.log('👁️ Discrete mining: Processing pending transactions...');
                this.mineNewBlock();
            }
        }, 5000);
    }

    mineNewBlock() {
        const lastBlock = this.blockchainData.chain[this.blockchainData.chain.length - 1];
        const newBlock = {
            index: lastBlock.index + 1,
            timestamp: Date.now(),
            transactions: [...this.blockchainData.pendingTransactions],
            previousHash: lastBlock.hash,
            hash: this.calculateHash(lastBlock.index + 1, Date.now(), this.blockchainData.pendingTransactions, lastBlock.hash),
            validator: "miner-" + Math.random().toString(36).substr(2, 9),
            signature: "signature-" + Math.random().toString(36).substr(2, 9)
        };

        this.blockchainData.chain.push(newBlock);
        
        // Add mining reward transaction
        this.blockchainData.pendingTransactions = [
            {
                fromAddress: null,
                toAddress: "miner-" + Math.random().toString(36).substr(2, 9),
                amount: this.blockchainData.miningReward,
                timestamp: Date.now(),
                id: Math.random().toString(36).substr(2, 9)
            }
        ];

        console.log(`⛏️ Mined block ${newBlock.index} with ${newBlock.transactions.length} transactions`);
    }

    calculateHash(index, timestamp, transactions, previousHash) {
        return crypto.createHash('sha256')
            .update(index + timestamp + JSON.stringify(transactions) + previousHash)
            .digest('hex');
    }

    calculateBalance(address) {
        let balance = 0;
        
        for (const block of this.blockchainData.chain) {
            for (const transaction of block.transactions) {
                if (transaction.fromAddress === address) {
                    balance -= transaction.amount;
                }
                if (transaction.toAddress === address) {
                    balance += transaction.amount;
                }
            }
        }
        
        return balance;
    }

    calculateStakedAmount(address) {
        // Simulate staked amount
        return Math.floor(Math.random() * 1000) + 100;
    }

    calculateRewards(address) {
        // Simulate mining rewards
        return Math.floor(Math.random() * 50) + 10;
    }

    getTransactionsForAddress(address) {
        const transactions = [];
        
        for (const block of this.blockchainData.chain) {
            for (const transaction of block.transactions) {
                if (transaction.fromAddress === address || transaction.toAddress === address) {
                    transactions.push({
                        ...transaction,
                        blockIndex: block.index
                    });
                }
            }
        }
        
        return transactions;
    }

    async getBlockchainStatus() {
        if (!this.isRunning) {
            return {
                status: 'stopped',
                api: null,
                blockchain: this.isRunning
            };
        }
        
        return {
            status: 'running',
            api: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                blockchain: {
                    chainLength: this.blockchainData.chain.length,
                    pendingTransactions: this.blockchainData.pendingTransactions.length,
                    isMining: this.blockchainData.isMining,
                    isDiscreteMining: this.blockchainData.isDiscreteMining
                }
            },
            blockchain: this.isRunning
        };
    }

    async getMiningInfo() {
        return {
            isMining: this.blockchainData.isMining,
            currentBlock: this.blockchainData.chain.length,
            difficulty: this.blockchainData.difficulty,
            hashrate: this.blockchainData.isMining ? Math.floor(Math.random() * 1000) + 100 : 0,
            isDiscreteMining: this.blockchainData.isDiscreteMining
        };
    }

    async startMining() {
        this.blockchainData.isMining = true;
        console.log('⛏️ Mining started');
        
        // Simulate mining process
        this.startMiningSimulation();
        
        return {
            success: true,
            message: 'Mining started successfully'
        };
    }

    async stopMining() {
        this.blockchainData.isMining = false;
        console.log('⛏️ Mining stopped');
        
        return {
            success: true,
            message: 'Mining stopped successfully'
        };
    }

    async startDiscreteMining() {
        this.blockchainData.isDiscreteMining = true;
        console.log('👁️ Discrete mining started');
        
        // Start discrete mining interval for POS transactions
        this.discreteMiningInterval = setInterval(() => {
            if (this.blockchainData.pendingTransactions.length > 0) {
                console.log('🛒 Processing pending POS transactions...');
                this.mineNewBlock();
            }
        }, 5000); // Check every 5 seconds
        
        return {
            success: true,
            message: 'Discrete mining started successfully'
        };
    }

    async stopDiscreteMining() {
        this.blockchainData.isDiscreteMining = false;
        console.log('👁️ Discrete mining stopped');
        
        if (this.discreteMiningInterval) {
            clearInterval(this.discreteMiningInterval);
            this.discreteMiningInterval = null;
        }
        
        return {
            success: true,
            message: 'Discrete mining stopped successfully'
        };
    }

    async getBlockchainData() {
        return {
            chainLength: this.blockchainData.chain.length,
            lastBlock: this.blockchainData.chain.length > 0 ? this.blockchainData.chain[this.blockchainData.chain.length - 1] : null,
            pendingTransactions: this.blockchainData.pendingTransactions.length,
            totalTransactions: this.blockchainData.chain.reduce((total, block) => total + block.transactions.length, 0),
            networkHashrate: this.blockchainData.networkHashrate,
            averageBlockTime: this.blockchainData.averageBlockTime
        };
    }

    async getNetworkStatus() {
        return {
            totalNodes: 15,
            onlineNodes: 12,
            totalStake: 50000,
            averageBlockTime: this.blockchainData.averageBlockTime,
            networkHashrate: this.blockchainData.networkHashrate,
            consensus: 'active'
        };
    }

    async getNetworkNodes() {
        return [
            {
                id: 'node-001',
                address: '192.168.1.100:30303',
                status: 'online',
                lastSeen: new Date().toISOString(),
                version: '1.0.0',
                isValidator: true,
                stake: 10000
            },
            {
                id: 'node-002',
                address: '192.168.1.101:30303',
                status: 'online',
                lastSeen: new Date().toISOString(),
                version: '1.0.0',
                isValidator: true,
                stake: 8500
            },
            {
                id: 'node-003',
                address: '192.168.1.102:30303',
                status: 'syncing',
                lastSeen: new Date().toISOString(),
                version: '1.0.0',
                isValidator: false,
                stake: 0
            }
        ];
    }

    async getWalletInfo(address) {
        const balance = this.calculateBalance(address);
        const transactions = this.getTransactionsForAddress(address);
        const stakedAmount = this.calculateStakedAmount(address);
        const rewards = this.calculateRewards(address);
        
        return {
            address: address,
            balance: balance,
            transactions: transactions,
            stakedAmount: stakedAmount,
            rewards: rewards
        };
    }

    async sendTransaction(fromAddress, toAddress, amount) {
        if (!fromAddress || !toAddress || !amount) {
            return { success: false, message: 'Missing required fields' };
        }

        const transaction = {
            fromAddress,
            toAddress,
            amount: parseFloat(amount),
            timestamp: Date.now(),
            id: Math.random().toString(36).substr(2, 9)
        };

        this.blockchainData.pendingTransactions.push(transaction);
        
        // If discrete mining is enabled, mine immediately for POS transactions
        if (this.blockchainData.isDiscreteMining && this.posIntegrationEnabled) {
            console.log('🛒 POS transaction detected, mining immediately...');
            setTimeout(() => {
                this.mineNewBlock();
            }, 1000);
        }
        
        return {
            success: true,
            message: 'Transaction added to pending transactions',
            transaction: transaction
        };
    }

    async sendPosTransaction(saleId, amount, items) {
        const posTransaction = {
            fromAddress: 'pos-system',
            toAddress: 'pos-wallet',
            amount: parseFloat(amount),
            timestamp: Date.now(),
            id: Math.random().toString(36).substr(2, 9),
            saleId: saleId,
            items: items,
            type: 'pos-sale'
        };

        this.blockchainData.pendingTransactions.push(posTransaction);
        
        // If discrete mining is enabled, mine immediately
        if (this.blockchainData.isDiscreteMining) {
            console.log('🛒 POS sale detected, mining immediately...');
            setTimeout(() => {
                this.mineNewBlock();
            }, 1000);
        }
        
        return {
            success: true,
            message: 'POS transaction added and mining triggered',
            transaction: posTransaction
        };
    }
}

export default SimpleBlockchainService; 