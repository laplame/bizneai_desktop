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
import { promotionRoutes } from './routes/promotions.js';
import ContractManager from '../contracts/ContractManager.js';
import PromotionContract from '../contracts/PromotionContract.js';
import networkRoutes from './routes/network.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class APIServer {
    constructor(blockchain, p2pManager, token) {
        this.app = express();
        this.blockchain = blockchain;
        this.p2pManager = p2pManager;
        this.token = token;
        this.wss = null;
        this.clients = new Set();
        
        // Inicializar ContractManager
        this.contractManager = new ContractManager();
        
        // Inicializar PromotionContract
        this.promotionContract = new PromotionContract();
        
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
            max: 1000 // límite por IP - aumentado para desarrollo
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

        // Añadir rutas de promociones
        if (this.promotionContract) {
            this.app.use('/api/promotions', promotionRoutes(this.promotionContract));
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
                    contracts: this.contractManager ? 'running' : 'not available',
                    promotions: this.promotionContract ? 'running' : 'not available',
                    websocket: this.wss ? 'running' : 'not available'
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

    setupWebSocket() {
        this.wss = new WebSocketServer({ 
            server: this.server,
            path: '/ws'
        });

        this.wss.on('connection', (ws, req) => {
            console.log('🔗 Cliente WebSocket conectado');
            this.clients.add(ws);

            // Enviar estado inicial
            this.sendNetworkUpdate(ws);

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    console.log('📨 Mensaje WebSocket recibido:', data);
                    
                    // Manejar diferentes tipos de mensajes
                    switch (data.type) {
                        case 'ping':
                            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                            break;
                        case 'subscribe':
                            // Suscribir a actualizaciones específicas
                            ws.subscriptions = data.subscriptions || [];
                            break;
                        default:
                            console.log('Mensaje no reconocido:', data);
                    }
                } catch (error) {
                    console.error('Error procesando mensaje WebSocket:', error);
                }
            });

            ws.on('close', () => {
                console.log('🔌 Cliente WebSocket desconectado');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('❌ Error en WebSocket:', error);
                this.clients.delete(ws);
            });
        });

        console.log('✅ WebSocket Server configurado en /ws');
    }

    sendNetworkUpdate(client = null) {
        const networkData = {
            type: 'network_update',
            timestamp: Date.now(),
            nodes: this.p2pManager?.peers ? Array.from(this.p2pManager.peers.values()) : [],
            totalNodes: this.p2pManager?.peers?.size || 0,
            activeConnections: this.p2pManager?.peers?.size || 0,
            blockchain: {
                height: this.blockchain?.chain?.length || 0,
                pendingTransactions: this.blockchain?.pendingTransactions?.length || 0
            }
        };

        if (client) {
            // Enviar a un cliente específico
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(JSON.stringify(networkData));
            }
        } else {
            // Broadcast a todos los clientes
            this.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify(networkData));
                }
            });
        }
    }

    // Método para enviar actualizaciones periódicas
    startWebSocketUpdates() {
        setInterval(() => {
            this.sendNetworkUpdate();
        }, 5000); // Actualizar cada 5 segundos
    }

    async start(port = process.env.API_PORT || 3000) {
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
            
            // Iniciar servidor HTTP
            return new Promise((resolve) => {
                this.server = createServer(this.app);
                
                // Configurar WebSocket después de crear el servidor HTTP
                this.setupWebSocket();
                
                this.server.listen(port, () => {
                    console.log(`API server running on port ${port}`);
                    console.log(`WebSocket server running on ws://localhost:${port}/ws`);
                    
                    // Iniciar actualizaciones periódicas
                    this.startWebSocketUpdates();
                    
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
            // Cerrar WebSocket server
            if (this.wss) {
                this.wss.close();
                console.log('WebSocket server stopped');
            }
            
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