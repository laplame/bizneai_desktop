/**
 * Chat del asistente de IA (BizneAIChat) para la app de escritorio.
 *
 * El historial de mensajes se mantiene en memoria (RESETEA en cada reinicio del
 * servidor) — el cliente conserva su propio historial en localStorage
 * ('bizneai-chat-history') como fuente persistente real. Esta ruta solo sirve
 * para generar la respuesta de IA y devolver un historial reciente en la sesión actual.
 *
 * La respuesta de IA sí es real: usa Gemini (geminiChatService.ts) con el mismo
 * cálculo de tokens/costo que la app móvil, y reporta el uso a
 * POST https://www.bizneai.com/api/bizneai-chat para el dashboard de AI Interactions.
 *
 * Real desktop data flow (para todo lo demás):
 *   localStorage  →  PUT/GET /api/pos/kv (posKvRoutes)  →  SQLite (pos-local-store)
 *   catalog/stock →  MCP proxy /api/proxy (mcpProxyRoutes)
 *   sales ledger  →  /api/merkle-ledger (merkleLedgerRoutes)  +  local-activity DB
 * See docs/ARCHITECTURE.md for the full picture.
 */

import express from 'express';
import { z } from 'zod';
import {
  DESKTOP_CHAT_SESSION_ID,
  calculateGeminiCost,
  generateGeminiReply,
  saveChatUsage
} from '../services/geminiChatService.js';

const router = express.Router();

// Chat schemas
const chatHistoryTurnSchema = z.object({
  senderType: z.enum(['customer', 'ai', 'staff']),
  content: z.string()
});

const createChatMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  // z.record() en Zod v4 requiere (keySchema, valueSchema); con un solo argumento el
  // valueSchema queda undefined y el parse truena en cuanto el objeto trae alguna key.
  context: z.record(z.string(), z.any()).optional(),
  senderType: z.enum(['customer', 'ai', 'staff']).default('customer'),
  messageType: z.enum(['text', 'image', 'file']).default('text'),
  metadata: z.record(z.string(), z.any()).optional(),
  geminiApiKey: z.string().optional(),
  history: z.array(chatHistoryTurnSchema).optional()
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
      content: messageData.content,
      context: messageData.context || {},
      senderType: messageData.senderType,
      messageType: messageData.messageType,
      metadata: messageData.metadata,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    chatMessages.push(customerMessage);

    const apiKey = messageData.geminiApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return res.status(422).json({
        success: false,
        error: 'GEMINI_API_KEY_MISSING',
        message: 'Configura tu API key de Gemini en Configuración → IA para usar el asistente.'
      });
    }

    const history = (messageData.history || [])
      .slice(-10)
      .map((h) => ({ role: (h.senderType === 'ai' ? 'model' : 'user') as 'model' | 'user', text: h.content }));

    let aiResponse;
    try {
      const context = messageData.context || {};
      const result = await generateGeminiReply({
        apiKey,
        shopId,
        storeName: typeof context.storeName === 'string' ? context.storeName : undefined,
        storeType: typeof context.businessType === 'string' ? context.businessType : undefined,
        history,
        userMessage: messageData.content
      });

      const cost = calculateGeminiCost(result.usageMetadata);
      // Fire-and-forget: no bloquea la respuesta al usuario aunque falle el tracking.
      void saveChatUsage({
        chatId: DESKTOP_CHAT_SESSION_ID,
        shopId,
        usageMetadata: result.usageMetadata,
        cost,
        model: result.model
      });

      aiResponse = {
        _id: `ai_${Date.now()}`,
        shopId,
        content: result.text,
        context,
        senderType: 'ai' as const,
        messageType: 'text' as const,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
    } catch (aiError) {
      console.error('[Chat] Error llamando a Gemini:', aiError);
      return res.status(502).json({
        success: false,
        error: 'GEMINI_REQUEST_FAILED',
        message: aiError instanceof Error ? aiError.message : 'No se pudo obtener respuesta de Gemini.'
      });
    }

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