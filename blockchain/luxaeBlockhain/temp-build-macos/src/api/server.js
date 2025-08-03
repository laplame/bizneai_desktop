import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { blockchainRoutes } from './routes/blockchain.js';
import { transactionRoutes } from './routes/transactions.js';
import { validatorRoutes } from './routes/validators.js';
import { statusRoutes } from './routes/status.js';
import { contractRoutes } from './routes/contracts.js';
import ContractManager from '../contracts/ContractManager.js';
import networkRoutes from './routes/network.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class APIServer {
    constructor(blockchain, p2pManager, token) {
        this.app = express();
        this.blockchain = blockchain;
        this.p2pManager = p2pManager;
        this.token = token;
        
        // Inicializar ContractManager
        this.contractManager = new ContractManager();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSwagger();
    }

    setupMiddleware() {
        this.app.use(cors({
            origin: ['http://localhost:3001', 'http://localhost:5173'], // Permitir el dashboard y el entorno de desarrollo
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            credentials: true
        }));
        this.app.use(express.json());
        this.app.use(helmet());

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 100 // límite por IP
        });
        this.app.use(limiter);
    }

    setupSwagger() {
        const options = {
            definition: {
                openapi: '3.0.0',
                info: {
                    title: 'Blockchain PoS API',
                    version: '1.0.0',
                    description: 'API para interactuar con el nodo blockchain'
                },
            },
            apis: ['./src/api/routes/*.js']
        };
        const specs = swaggerJsdoc(options);
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    }

    setupRoutes() {
        // Rutas principales
        this.app.use('/api/blockchain', blockchainRoutes(this.blockchain));
        this.app.use('/api/transactions', transactionRoutes(this.blockchain, this.p2pManager));
        this.app.use('/api/validators', validatorRoutes(this.blockchain));
        this.app.use('/api/status', statusRoutes(this.blockchain, this.token));

        // Añadir rutas de contratos si está disponible
        if (this.contractManager) {
            this.app.use('/api/contracts', contractRoutes(this.contractManager));
        }

        // Nueva ruta de red
        this.app.use('/api/network', networkRoutes(this.blockchain, this.p2pManager));

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                services: {
                    blockchain: this.blockchain?.isRunning ? 'running' : 'not available',
                    p2p: this.p2pManager?.isRunning ? 'running' : 'not available',
                    contracts: this.contractManager ? 'running' : 'not available'
                }
            });
        });

        // Error handling
        this.app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).json({ error: 'Something went wrong!' });
        });

        // Servir archivos estáticos si es necesario
        this.app.use(express.static(path.join(__dirname, 'public')));
    }

    async start(port = 3000) {
        try {
            // Verificar y iniciar servicios
            if (this.blockchain && !this.blockchain.isRunning) {  // Usar como propiedad
                await this.blockchain.start();
            } else {
                console.warn('Blockchain no disponible o ya está iniciada');
            }
            
            if (this.p2pManager && !this.p2pManager.isRunning) {  // Usar como propiedad
                await this.p2pManager.start();
            } else {
                console.warn('P2P Manager no disponible o ya está iniciado');
            }
            
            // Iniciar servidor
            return new Promise((resolve) => {
                this.server = this.app.listen(port, () => {
                    console.log(`API server running on port ${port}`);
                    resolve();
                });
            });
        } catch (error) {
            console.error('Error starting API server:', error);
            throw error;
        }
    }

    async stop() {
        try {
            await this.blockchain?.stop();
            await this.p2pManager?.stop();
            if (this.server) {
                return new Promise((resolve) => {
                    this.server.close(() => {
                        console.log('API server stopped');
                        resolve();
                    });
                });
            }
        } catch (error) {
            console.error('Error stopping API server:', error);
            throw error;
        }
    }
}

export default APIServer; 