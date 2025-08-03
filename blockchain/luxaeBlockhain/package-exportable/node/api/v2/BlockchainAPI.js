import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

class BlockchainAPI {
    constructor(blockchain, p2pManager) {
        this.app = express();
        this.blockchain = blockchain;
        this.p2pManager = p2pManager;
        this.isRunning = false;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSwagger();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // CORS configuration for frontend
        this.app.use(cors({
            origin: [
                'http://localhost:5173', // Vite dev server
                'http://localhost:3001', // Legacy dashboard
                'http://localhost:3000', // API itself
                'http://127.0.0.1:5173',
                'http://127.0.0.1:3001',
                'http://127.0.0.1:3000'
            ],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // limit each IP to 1000 requests per windowMs
            message: {
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use('/api/', limiter);

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupSwagger() {
        const options = {
            definition: {
                openapi: '3.0.0',
                info: {
                    title: 'Luxae Blockchain API v2',
                    version: '2.0.0',
                    description: 'API moderna para interactuar con la blockchain Luxae P2P',
                    contact: {
                        name: 'Luxae Team',
                        email: 'support@luxae.com'
                    }
                },
                servers: [
                    {
                        url: 'http://localhost:3000',
                        description: 'Development server'
                    }
                ],
                components: {
                    schemas: {
                        Block: {
                            type: 'object',
                            properties: {
                                block: { type: 'number' },
                                hash: { type: 'string' },
                                previousHash: { type: 'string' },
                                timestamp: { type: 'string' },
                                transactions: { type: 'array' },
                                validator: { type: 'string' }
                            }
                        },
                        Transaction: {
                            type: 'object',
                            properties: {
                                fromAddress: { type: 'string' },
                                toAddress: { type: 'string' },
                                amount: { type: 'number' },
                                timestamp: { type: 'string' },
                                hash: { type: 'string' }
                            }
                        },
                        Validator: {
                            type: 'object',
                            properties: {
                                address: { type: 'string' },
                                stake: { type: 'number' },
                                status: { type: 'string' },
                                lastBlock: { type: 'number' }
                            }
                        }
                    }
                }
            },
            apis: ['./src/api/v2/routes/*.js']
        };
        
        const specs = swaggerJsdoc(options);
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '2.0.0',
                services: {
                    blockchain: this.blockchain ? 'available' : 'not available',
                    p2p: this.p2pManager ? 'available' : 'not available'
                }
            });
        });

        // API v2 routes
        this.app.use('/api/v2/blockchain', this.createBlockchainRoutes());
        this.app.use('/api/v2/transactions', this.createTransactionRoutes());
        this.app.use('/api/v2/validators', this.createValidatorRoutes());
        this.app.use('/api/v2/network', this.createNetworkRoutes());
        this.app.use('/api/v2/status', this.createStatusRoutes());
        this.app.use('/api/v2/contracts', this.createContractRoutes());

        // Legacy API compatibility (redirect to v2)
        this.app.use('/api/blockchain', this.createBlockchainRoutes());
        this.app.use('/api/transactions', this.createTransactionRoutes());
        this.app.use('/api/validators', this.createValidatorRoutes());
        this.app.use('/api/network', this.createNetworkRoutes());
        this.app.use('/api/status', this.createStatusRoutes());
        this.app.use('/api/contracts', this.createContractRoutes());
    }

    createBlockchainRoutes() {
        const router = express.Router();

        /**
         * @swagger
         * /api/v2/blockchain:
         *   get:
         *     summary: Get blockchain information
         *     tags: [Blockchain]
         *     responses:
         *       200:
         *         description: Blockchain information
         */
        router.get('/', (req, res) => {
            try {
                const info = {
                    chain: this.blockchain?.chain || [],
                    pendingTransactions: this.blockchain?.pendingTransactions || [],
                    consensus: this.blockchain?.consensus || 'PoS',
                    totalBlocks: this.blockchain?.chain?.length || 0,
                    totalTransactions: this.getTotalTransactions(),
                    miningReward: this.blockchain?.miningReward || 100,
                    minimumStake: this.blockchain?.getMinimumStake?.() || 1000
                };
                res.json(info);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get blockchain info', details: error.message });
            }
        });

        /**
         * @swagger
         * /api/v2/blockchain/blocks:
         *   get:
         *     summary: Get latest blocks
         *     tags: [Blockchain]
         *     parameters:
         *       - in: query
         *         name: limit
         *         schema:
         *           type: integer
         *           default: 10
         *         description: Number of blocks to return
         */
        router.get('/blocks', (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 10;
                const blocks = this.blockchain?.chain?.slice(-limit) || [];
                res.json(blocks);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get blocks', details: error.message });
            }
        });

        /**
         * @swagger
         * /api/v2/blockchain/blocks/{hash}:
         *   get:
         *     summary: Get block by hash
         *     tags: [Blockchain]
         *     parameters:
         *       - in: path
         *         name: hash
         *         required: true
         *         schema:
         *           type: string
         */
        router.get('/blocks/:hash', (req, res) => {
            try {
                const { hash } = req.params;
                const block = this.blockchain?.chain?.find(b => b.hash === hash);
                if (!block) {
                    return res.status(404).json({ error: 'Block not found' });
                }
                res.json(block);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get block', details: error.message });
            }
        });

        return router;
    }

    createTransactionRoutes() {
        const router = express.Router();

        /**
         * @swagger
         * /api/v2/transactions:
         *   get:
         *     summary: Get transactions
         *     tags: [Transactions]
         *     parameters:
         *       - in: query
         *         name: limit
         *         schema:
         *           type: integer
         *           default: 20
         */
        router.get('/', (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 20;
                const allTransactions = this.getAllTransactions();
                const transactions = allTransactions.slice(-limit);
                res.json(transactions);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get transactions', details: error.message });
            }
        });

        /**
         * @swagger
         * /api/v2/transactions:
         *   post:
         *     summary: Create a new transaction
         *     tags: [Transactions]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - fromAddress
         *               - toAddress
         *               - amount
         *             properties:
         *               fromAddress:
         *                 type: string
         *               toAddress:
         *                 type: string
         *               amount:
         *                 type: number
         */
        router.post('/', (req, res) => {
            try {
                const { fromAddress, toAddress, amount } = req.body;
                
                if (!fromAddress || !toAddress || !amount) {
                    return res.status(400).json({ error: 'Missing required fields' });
                }

                if (amount <= 0) {
                    return res.status(400).json({ error: 'Amount must be positive' });
                }

                // Create transaction
                const transaction = {
                    fromAddress,
                    toAddress,
                    amount: parseFloat(amount),
                    timestamp: Date.now()
                };

                // Add to pending transactions
                if (this.blockchain) {
                    this.blockchain.createTransaction(transaction);
                }

                // Broadcast to P2P network
                if (this.p2pManager) {
                    this.p2pManager.broadcastTransaction(transaction);
                }

                res.status(201).json({
                    message: 'Transaction created successfully',
                    transaction
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to create transaction', details: error.message });
            }
        });

        return router;
    }

    createValidatorRoutes() {
        const router = express.Router();

        /**
         * @swagger
         * /api/v2/validators:
         *   get:
         *     summary: Get validators
         *     tags: [Validators]
         */
        router.get('/', (req, res) => {
            try {
                const validators = this.blockchain?.getActiveValidators?.() || [];
                res.json(validators);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get validators', details: error.message });
            }
        });

        return router;
    }

    createContractRoutes() {
        const router = express.Router();

        /**
         * @swagger
         * /api/v2/contracts:
         *   get:
         *     summary: Get smart contracts
         *     tags: [Contracts]
         */
        router.get('/', (req, res) => {
            try {
                // For now, return empty array since contracts are not implemented yet
                const contracts = [];
                res.json(contracts);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get contracts', details: error.message });
            }
        });

        /**
         * @swagger
         * /api/v2/contracts:
         *   post:
         *     summary: Deploy a new smart contract
         *     tags: [Contracts]
         */
        router.post('/', (req, res) => {
            try {
                const { name, source, abi, bytecode } = req.body;
                
                if (!name || !source) {
                    return res.status(400).json({ error: 'Missing required fields' });
                }

                // For now, return a mock response
                const contract = {
                    address: `0x${Math.random().toString(16).substr(2, 40)}`,
                    name,
                    source,
                    abi: abi || [],
                    bytecode: bytecode || '',
                    deployed: true,
                    deployedAt: new Date().toISOString(),
                    methods: abi ? JSON.parse(abi).length : 0
                };

                res.status(201).json({
                    message: 'Contract deployed successfully',
                    contract
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to deploy contract', details: error.message });
            }
        });

        return router;
    }

    createNetworkRoutes() {
        const router = express.Router();

        /**
         * @swagger
         * /api/v2/network/status:
         *   get:
         *     summary: Get network status
         *     tags: [Network]
         */
        router.get('/status', (req, res) => {
            try {
                const status = {
                    isConnected: this.p2pManager?.isRunning || false,
                    peers: this.p2pManager?.peers ? Array.from(this.p2pManager.peers.keys()) : [],
                    peerCount: this.p2pManager?.peers?.size || 0,
                    uptime: this.p2pManager?.uptime || 0,
                    nodeId: this.p2pManager?.node?.peerId?.toString() || null
                };
                res.json(status);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get network status', details: error.message });
            }
        });

        /**
         * @swagger
         * /api/v2/network/peers:
         *   get:
         *     summary: Get connected peers
         *     tags: [Network]
         */
        router.get('/peers', (req, res) => {
            try {
                const peers = this.p2pManager?.peers ? Array.from(this.p2pManager.peers.entries()).map(([id, peer]) => ({
                    id: id.toString(),
                    addresses: peer.addresses || [],
                    protocols: peer.protocols || []
                })) : [];
                res.json(peers);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get peers', details: error.message });
            }
        });

        /**
         * @swagger
         * /api/v2/network/nodes:
         *   get:
         *     summary: Get all nodes in the network
         *     tags: [Network]
         */
        router.get('/nodes', (req, res) => {
            try {
                // Get own node info - check if P2P manager is running
                const isP2PRunning = this.p2pManager?.isRunning || false;
                const ownNode = {
                    id: this.p2pManager?.node?.peerId?.toString() || 'unknown',
                    name: 'Nodo Principal',
                    type: 'Validator',
                    status: isP2PRunning ? 'online' : 'offline',
                    uptime: this.p2pManager?.uptime || 0,
                    location: 'Local',
                    isOwn: true,
                    version: 'v2.0.0',
                    lastSeen: new Date().toISOString(),
                    blocksMined: this.blockchain?.chain?.length || 1,
                    stake: '10,000 LXA',
                    addresses: this.p2pManager?.node?.getMultiaddrs?.()?.map(addr => addr.toString()) || []
                };

                // Get connected peers info
                const peerNodes = this.p2pManager?.peers ? Array.from(this.p2pManager.peers.entries()).map(([id, peer]) => ({
                    id: id.toString(),
                    name: `Peer ${id.toString().substring(0, 8)}`,
                    type: 'Full Node',
                    status: 'online',
                    uptime: 'N/A',
                    location: 'Remote',
                    isOwn: false,
                    version: 'v2.0.0',
                    lastSeen: new Date().toISOString(),
                    blocksMined: 0,
                    stake: '0 LXA',
                    addresses: peer.addresses || []
                })) : [];

                // Combine own node and peers
                const allNodes = [ownNode, ...peerNodes];
                res.json(allNodes);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get nodes', details: error.message });
            }
        });

        return router;
    }

    createStatusRoutes() {
        const router = express.Router();

        /**
         * @swagger
         * /api/v2/status:
         *   get:
         *     summary: Get system status
         *     tags: [Status]
         */
        router.get('/', (req, res) => {
            try {
                const status = {
                    timestamp: new Date().toISOString(),
                    version: '2.0.0',
                    blockchain: {
                        isRunning: !!this.blockchain,
                        totalBlocks: this.blockchain?.chain?.length || 0,
                        pendingTransactions: this.blockchain?.pendingTransactions?.length || 0,
                        consensus: this.blockchain?.consensus || 'PoS'
                    },
                    p2p: {
                        isRunning: this.p2pManager?.isRunning || false,
                        peerCount: this.p2pManager?.peers?.size || 0,
                        nodeId: this.p2pManager?.node?.peerId?.toString() || null
                    },
                    system: {
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        platform: process.platform,
                        nodeVersion: process.version
                    }
                };
                res.json(status);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get status', details: error.message });
            }
        });

        return router;
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.originalUrl,
                method: req.method,
                availableEndpoints: [
                    'GET /health',
                    'GET /api/v2/blockchain',
                    'GET /api/v2/transactions',
                    'GET /api/v2/validators',
                    'GET /api/v2/network/status',
                    'GET /api/v2/status'
                ]
            });
        });

        // Global error handler
        this.app.use((err, req, res, next) => {
            console.error('API Error:', err);
            res.status(500).json({
                error: 'Internal server error',
                message: err.message,
                timestamp: new Date().toISOString()
            });
        });
    }

    // Helper methods
    getTotalTransactions() {
        if (!this.blockchain?.chain) return 0;
        return this.blockchain.chain.reduce((total, block) => {
            return total + (block.transactions?.length || 0);
        }, 0);
    }

    getAllTransactions() {
        if (!this.blockchain?.chain) return [];
        const transactions = [];
        this.blockchain.chain.forEach(block => {
            if (block.transactions) {
                // Handle genesis block transactions (string) vs regular transactions (array)
                if (typeof block.transactions === 'string') {
                    // Genesis block - create a proper transaction object
                    transactions.push({
                        hash: block.hash,
                        from: 'Genesis',
                        to: 'Genesis',
                        amount: 0,
                        timestamp: block.timestamp,
                        type: 'genesis',
                        blockHash: block.hash
                    });
                } else if (Array.isArray(block.transactions)) {
                    // Regular block - add all transactions
                    transactions.push(...block.transactions);
                }
            }
        });
        return transactions;
    }

    async start(port = 3000) {
        try {
            this.server = this.app.listen(port, () => {
                console.log(`🚀 Blockchain API v2 running on port ${port}`);
                console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
                console.log(`🏥 Health Check: http://localhost:${port}/health`);
                this.isRunning = true;
            });

            return this.server;
        } catch (error) {
            console.error('Failed to start API server:', error);
            throw error;
        }
    }

    async stop() {
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    console.log('🛑 Blockchain API v2 stopped');
                    this.isRunning = false;
                    resolve();
                });
            });
        }
    }
}

export default BlockchainAPI; 