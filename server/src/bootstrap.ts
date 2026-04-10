import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer, type Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { getBizneaiDataDir } from './dataPaths.js';

import shopRoutes from './routes/shopRoutes.js';
import productRoutes from './routes/productRoutes.js';
import kitchenRoutes from './routes/kitchenRoutes.js';
import waitlistRoutes from './routes/waitlistRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import mcpProxyRoutes from './routes/mcpProxyRoutes.js';
import localActivityRoutes from './routes/localActivityRoutes.js';
import posKvRoutes from './routes/posKvRoutes.js';
import posProductImageRoutes from './routes/posProductImageRoutes.js';
import localDbConsoleRoutes from './routes/localDbConsoleRoutes.js';

import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { posKvPutRawParser } from './middleware/posKvPutRaw.js';

const embedded = process.env.BIZNEAI_EMBEDDED === '1';
const isProd = process.env.NODE_ENV === 'production';

function buildBizneaiApp(): { app: express.Express; server: HttpServer; io: Server } {
  const app = express();
  const server = createServer(app);

  const socketCors =
    embedded || !isProd
      ? { origin: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], credentials: true }
      : {
          origin: ['https://bizneai.com', 'https://www.bizneai.com'],
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          credentials: true,
        };

  const io = new Server(server, { cors: socketCors });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", 'https:', 'http:'],
        },
      },
      /** Permite <img> desde Vite (5173) / Electron hacia API en :3000 */
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  const corsOpts = embedded
    ? { origin: true, credentials: true }
    : isProd
      ? { origin: ['https://bizneai.com', 'https://www.bizneai.com'], credentials: true }
      : { origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'], credentials: true };

  app.use(cors(corsOpts));
  app.use(morgan('combined'));
  const jsonParser = express.json({ limit: '10mb' });
  app.use((req, res, next) => {
    if (req.method === 'PUT' && req.path === '/api/pos/kv') {
      return posKvPutRawParser(req, res, next);
    }
    return jsonParser(req, res, next);
  });
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  const uploadsDir = path.join(getBizneaiDataDir(), 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(uploadsDir));

  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      embedded: embedded || undefined,
    });
  });

  app.get('/', (req, res) => {
    res.json({
      message: 'BizneAI API v2.0.0',
      documentation: '/api/docs',
      health: '/health',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/proxy', mcpProxyRoutes);
  app.use('/api/local-activity', localActivityRoutes);
  app.use('/api/pos', posKvRoutes);
  app.use('/api/pos', posProductImageRoutes);
  app.use('/api/local-db/console', localDbConsoleRoutes);
  app.use('/api/shop', shopRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/kitchen', kitchenRoutes);
  app.use('/api/waitlist', waitlistRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api', imageRoutes);

  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (_req, res) => {
    res.json({ received: true });
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('join-shop', (shopId: string) => {
      socket.join(`shop-${shopId}`);
    });
    socket.on('leave-shop', (shopId: string) => {
      socket.leave(`shop-${shopId}`);
    });
    socket.on('kitchen-order-update', (data) => {
      socket.to(`shop-${data.shopId}`).emit('kitchen-order-updated', data);
    });
    socket.on('waitlist-update', (data) => {
      socket.to(`shop-${data.shopId}`).emit('waitlist-updated', data);
    });
    socket.on('chat-message', (data) => {
      socket.to(`shop-${data.shopId}`).emit('new-chat-message', data);
    });
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  app.use(notFound);
  app.use(errorHandler);
  app.set('io', io);

  return { app, server, io };
}

export async function startBizneaiServer(port = Number(process.env.PORT) || 3000): Promise<void> {
  const { server } = buildBizneaiApp();
  await new Promise<void>((resolve, reject) => {
    const onErr = (err: NodeJS.ErrnoException) => {
      server.off('error', onErr);
      if (err.code === 'EADDRINUSE') {
        console.warn(`BizneAI: puerto ${port} ya en uso, no se abre un segundo servidor`);
        resolve();
        return;
      }
      reject(err);
    };
    server.once('error', onErr);
    server.listen(port, () => {
      server.off('error', onErr);
      resolve();
    });
  });
  console.log(`BizneAI API Server on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health: http://127.0.0.1:${port}/health`);
}

export { buildBizneaiApp };
