import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Chat schemas
const createChatMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  context: z.record(z.any()).optional(),
  senderType: z.enum(['customer', 'ai', 'staff']).default('customer'),
  messageType: z.enum(['text', 'image', 'file']).default('text'),
  metadata: z.record(z.any()).optional()
});

const chatQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('50'),
  sessionId: z.string().optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

// Mock chat data
let chatMessages: any[] = [];

// 1. Send Chat Message
router.post('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = z.object({ shopId: z.string() }).parse(req.params);
    const messageData = createChatMessageSchema.parse(req.body);
    
    const customerMessage = {
      _id: `msg_${Date.now()}`,
      shopId,
      ...messageData,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
    
    chatMessages.push(customerMessage);
    
    // Simulate AI response
    const aiResponse = {
      _id: `ai_${Date.now()}`,
      shopId,
      content: `Gracias por tu mensaje: "${messageData.content}". Un representante de la tienda te responderá pronto.`,
      context: messageData.context || {},
      senderType: 'ai' as const,
      messageType: 'text' as const,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
    
    chatMessages.push(aiResponse);
    
    res.json({
      success: true,
      data: {
        message: customerMessage,
        aiResponse
      },
      message: 'Message sent successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// 2. Get Chat History
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = z.object({ shopId: z.string() }).parse(req.params);
    const query = chatQuerySchema.parse(req.query);
    
    let filteredMessages = chatMessages.filter(message => message.shopId === shopId);
    
    // Apply filters
    if (query.sessionId) {
      filteredMessages = filteredMessages.filter(message => 
        message.context?.sessionId === query.sessionId
      );
    }
    
    if (query.customerId) {
      filteredMessages = filteredMessages.filter(message => 
        message.context?.customerId === query.customerId
      );
    }
    
    if (query.startDate) {
      filteredMessages = filteredMessages.filter(message => 
        new Date(message.timestamp) >= new Date(query.startDate!)
      );
    }
    
    if (query.endDate) {
      filteredMessages = filteredMessages.filter(message => 
        new Date(message.timestamp) <= new Date(query.endDate!)
      );
    }
    
    // Sort by timestamp (newest first)
    filteredMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Apply pagination
    const startIndex = (query.page - 1) * query.limit;
    const endIndex = startIndex + query.limit;
    const paginatedMessages = filteredMessages.slice(startIndex, endIndex);
    
    const total = filteredMessages.length;
    const pages = Math.ceil(total / query.limit);
    
    res.json({
      success: true,
      data: paginatedMessages,
      pagination: {
        current: query.page,
        pages,
        total,
        limit: query.limit
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat history'
    });
  }
});

// 3. Get Active Sessions
router.get('/shop/:shopId/sessions', async (req, res) => {
  try {
    const { shopId } = z.object({ shopId: z.string() }).parse(req.params);
    const { status = 'active' } = req.query;
    
    // Mock active sessions
    const activeSessions = [
      {
        sessionId: 'session_123',
        customerId: 'customer_456',
        status: 'active',
        lastMessage: 'Hello, I have a question about your menu',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: activeSessions
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active sessions'
    });
  }
});

// 4. Close Chat Session
router.post('/shop/:shopId/sessions/:sessionId/close', async (req, res) => {
  try {
    const { shopId, sessionId } = z.object({ 
      shopId: z.string(),
      sessionId: z.string()
    }).parse(req.params);
    
    res.json({
      success: true,
      message: 'Session closed successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to close session'
    });
  }
});

export default router; 