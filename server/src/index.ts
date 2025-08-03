import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

// Import routes
import shopRoutes from './routes/shopRoutes';
import productRoutes from './routes/productRoutes';
import kitchenRoutes from './routes/kitchenRoutes';
import waitlistRoutes from './routes/waitlistRoutes';
import paymentRoutes from './routes/paymentRoutes';
import chatRoutes from './routes/chatRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import ticketRoutes from './routes/ticketRoutes';
import orderRoutes from './routes/orderRoutes';
import userRoutes from './routes/userRoutes';
import cryptoRoutes from './routes/cryptoRoutes';
import imageRoutes from './routes/imageRoutes';
import databaseRoutes from './routes/databaseRoutes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { validateApiKey } from './middleware/validateApiKey';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://bizneai.com', 'https://www.bizneai.com']
      : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://bizneai.com', 'https://www.bizneai.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'BizneAI API v2.0.0',
    documentation: '/api/docs',
    health: '/health',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/shop', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api', imageRoutes);
app.use('/api/database', databaseRoutes);

// Stripe webhook (no body parsing for webhooks)
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  // Stripe webhook handling will be implemented in paymentRoutes
  res.json({ received: true });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join shop room
  socket.on('join-shop', (shopId: string) => {
    socket.join(`shop-${shopId}`);
    console.log(`Client ${socket.id} joined shop ${shopId}`);
  });

  // Leave shop room
  socket.on('leave-shop', (shopId: string) => {
    socket.leave(`shop-${shopId}`);
    console.log(`Client ${socket.id} left shop ${shopId}`);
  });

  // Kitchen order updates
  socket.on('kitchen-order-update', (data) => {
    socket.to(`shop-${data.shopId}`).emit('kitchen-order-updated', data);
  });

  // Waitlist updates
  socket.on('waitlist-update', (data) => {
    socket.to(`shop-${data.shopId}`).emit('waitlist-updated', data);
  });

  // Chat messages
  socket.on('chat-message', (data) => {
    socket.to(`shop-${data.shopId}`).emit('new-chat-message', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Make io available to routes
app.set('io', io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 BizneAI API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Base: http://localhost:${PORT}/api`);
});

export { app, io }; 