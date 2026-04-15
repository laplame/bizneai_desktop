# 📋 Plan de API de Chat con Tracking de Tokens y Facturación

## 🎯 Objetivo
Crear un sistema completo para enviar preguntas y respuestas al servidor, almacenar historial de conversaciones, trackear tokens y llamados a la API, y habilitar facturación basada en uso.

---

## 📊 Estado Actual

### ✅ Lo que ya tenemos:
1. **Modelo ChatMessage en servidor**: `server/src/models/ChatMessage.ts`
2. **Servicio AI local**: `src/services/aiService.ts` (llama directamente a Gemini)
3. **Almacenamiento local**: `src/services/chatStorageService.ts` (AsyncStorage)
4. **Estructura de mensajes**: Ya definida en el frontend

### ❌ Lo que falta:
1. **API endpoints** para enviar/recibir mensajes desde el servidor
2. **Tracking de tokens** en el modelo de datos
3. **Tracking de costos** por mensaje
4. **Historial centralizado** en MongoDB
5. **Métricas y analytics** de uso
6. **Sistema de facturación** basado en tokens/llamados

---

## 🏗️ Arquitectura Propuesta

### Flujo Actual vs Nuevo Flujo

#### **Flujo Actual (Local):**
```
App → aiService.ts → Gemini API → Respuesta → AsyncStorage (local)
```

#### **Flujo Nuevo (Centralizado):**
```
App → API Server → Gemini API → Respuesta → MongoDB Atlas
                ↓
         Tracking: tokens, costos, llamados
```

---

## 📦 Modelo de Datos

### 1. **Actualizar ChatMessage Model**

#### Ubicación: `server/src/models/ChatMessage.ts`

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface ITokenUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

export interface IChatMessage extends Document {
  shopId: mongoose.Types.ObjectId;
  sessionId: string;  // ID único de la sesión de chat
  messageId: string;  // ID único del mensaje (generado en frontend)
  
  // Contenido del mensaje
  content: string;
  role: 'user' | 'assistant' | 'system';
  
  // Contexto
  context?: {
    businessType?: string;
    customerId?: string;
    sessionId?: string;
    mcpContext?: {
      shopName?: string;
      productsCount?: number;
      hasInventory?: boolean;
    };
  };
  
  // Metadata del mensaje
  senderType: 'customer' | 'staff' | 'ai';
  messageType: 'text' | 'image' | 'file';
  metadata?: Record<string, any>;
  
  // Tracking de tokens y costos (solo para mensajes AI)
  tokenUsage?: ITokenUsage;
  model?: string;  // 'gemini-3-pro-preview', etc.
  cost?: {
    inputCost: number;   // Costo de tokens de entrada (por 1M tokens)
    outputCost: number;  // Costo de tokens de salida (por 1M tokens)
    totalCost: number;   // Costo total del mensaje en USD
    currency: string;    // 'USD'
  };
  
  // Tracking de API
  apiCall?: {
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;  // ms
    timestamp: Date;
  };
  
  // Estado y timestamps
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  shopId: {
    type: Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
    index: true
  },
  context: {
    businessType: String,
    customerId: String,
    sessionId: String,
    mcpContext: {
      shopName: String,
      productsCount: Number,
      hasInventory: Boolean
    }
  },
  senderType: {
    type: String,
    enum: ['customer', 'staff', 'ai'],
    default: 'customer',
    index: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  tokenUsage: {
    promptTokens: { type: Number, default: 0 },
    candidatesTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 }
  },
  model: {
    type: String,
    default: 'gemini-3-pro-preview'
  },
  cost: {
    inputCost: { type: Number, default: 0 },
    outputCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' }
  },
  apiCall: {
    endpoint: String,
    method: String,
    statusCode: Number,
    responseTime: Number,
    timestamp: Date
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent',
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'chat_messages'
});

// Índices para búsqueda y analytics
chatMessageSchema.index({ shopId: 1, timestamp: -1 });
chatMessageSchema.index({ shopId: 1, sessionId: 1, timestamp: -1 });
chatMessageSchema.index({ shopId: 1, role: 1 });
chatMessageSchema.index({ shopId: 1, status: 1 });
chatMessageSchema.index({ sessionId: 1, timestamp: -1 });
chatMessageSchema.index({ 'tokenUsage.totalTokens': 1 });
chatMessageSchema.index({ 'cost.totalCost': 1 });
chatMessageSchema.index({ timestamp: 1 }); // Para analytics por fecha

export default mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
```

---

### 2. **Nuevo Modelo: ChatSession**

#### Ubicación: `server/src/models/ChatSession.ts`

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IChatSession extends Document {
  shopId: mongoose.Types.ObjectId;
  sessionId: string;  // ID único de la sesión
  userId?: string;     // ID del usuario (opcional)
  
  // Estadísticas de la sesión
  stats: {
    totalMessages: number;
    userMessages: number;
    aiMessages: number;
    totalTokens: number;
    totalCost: number;
    averageResponseTime: number;  // ms
  };
  
  // Estado
  status: 'active' | 'completed' | 'archived';
  startedAt: Date;
  lastMessageAt: Date;
  endedAt?: Date;
  
  // Metadata
  metadata?: {
    deviceType?: string;
    appVersion?: string;
    platform?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const chatSessionSchema = new Schema<IChatSession>({
  shopId: {
    type: Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    index: true
  },
  stats: {
    totalMessages: { type: Number, default: 0 },
    userMessages: { type: Number, default: 0 },
    aiMessages: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active',
    index: true
  },
  startedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true,
  collection: 'chat_sessions'
});

chatSessionSchema.index({ shopId: 1, status: 1, startedAt: -1 });
chatSessionSchema.index({ shopId: 1, lastMessageAt: -1 });

export default mongoose.model<IChatSession>('ChatSession', chatSessionSchema);
```

---

### 3. **Nuevo Modelo: UsageMetrics**

#### Ubicación: `server/src/models/UsageMetrics.ts`

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IUsageMetrics extends Document {
  shopId: mongoose.Types.ObjectId;
  date: Date;  // Fecha del día (solo fecha, sin hora)
  
  // Métricas diarias
  metrics: {
    totalMessages: number;
    totalApiCalls: number;
    totalTokens: {
      input: number;
      output: number;
      total: number;
    };
    totalCost: number;
    averageResponseTime: number;
    errorCount: number;
  };
  
  // Desglose por modelo (si usan múltiples modelos)
  byModel?: {
    [modelName: string]: {
      calls: number;
      tokens: number;
      cost: number;
    };
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const usageMetricsSchema = new Schema<IUsageMetrics>({
  shopId: {
    type: Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  metrics: {
    totalMessages: { type: Number, default: 0 },
    totalApiCalls: { type: Number, default: 0 },
    totalTokens: {
      input: { type: Number, default: 0 },
      output: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    totalCost: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 }
  },
  byModel: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true,
  collection: 'usage_metrics'
});

// Índice único por shop y fecha
usageMetricsSchema.index({ shopId: 1, date: 1 }, { unique: true });
usageMetricsSchema.index({ date: -1 });

export default mongoose.model<IUsageMetrics>('UsageMetrics', usageMetricsSchema);
```

---

## 🔌 Endpoints API

### Ubicación: `server/src/routes/chat.ts` (nuevo archivo)

```typescript
import express from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import ChatMessage from '../models/ChatMessage';
import ChatSession from '../models/ChatSession';
import UsageMetrics from '../models/UsageMetrics';

const router = express.Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const sendMessageSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  messageId: z.string().min(1, "Message ID is required"),
  content: z.string().min(1, "Message content is required"),
  role: z.enum(['user', 'assistant', 'system']).default('user'),
  context: z.object({
    businessType: z.string().optional(),
    customerId: z.string().optional(),
    mcpContext: z.object({
      shopName: z.string().optional(),
      productsCount: z.number().optional(),
      hasInventory: z.boolean().optional()
    }).optional()
  }).optional(),
  metadata: z.record(z.any()).optional()
});

const aiResponseSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  messageId: z.string().min(1, "Message ID is required"),
  content: z.string().min(1, "Response content is required"),
  tokenUsage: z.object({
    promptTokens: z.number(),
    candidatesTokens: z.number(),
    totalTokens: z.number()
  }),
  model: z.string().default('gemini-3-pro-preview'),
  cost: z.object({
    inputCost: z.number(),
    outputCost: z.number(),
    totalCost: z.number(),
    currency: z.string().default('USD')
  }),
  apiCall: z.object({
    endpoint: z.string(),
    method: z.string(),
    statusCode: z.number(),
    responseTime: z.number(),
    timestamp: z.string().datetime()
  }),
  context: z.record(z.any()).optional()
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

const validateShopId = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { shopId } = req.params;
  if (!shopId || !mongoose.Types.ObjectId.isValid(shopId)) {
    return res.status(400).json({
      success: false,
      error: "Valid Shop ID is required"
    });
  }
  next();
};

// ============================================================================
// ROUTES
// ============================================================================

// POST /api/chat/:shopId/message
// Enviar mensaje del usuario y obtener respuesta del AI
router.post('/chat/:shopId/message', validateShopId, async (req: express.Request, res: express.Response) => {
  const startTime = Date.now();
  const { shopId } = req.params;
  
  try {
    // Validar request
    const validationResult = sendMessageSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid message data",
        details: validationResult.error.errors
      });
    }
    
    const { sessionId, messageId, content, role, context, metadata } = validationResult.data;
    
    // 1. Guardar mensaje del usuario
    const userMessage = new ChatMessage({
      shopId,
      sessionId,
      messageId: `${messageId}_user`,
      content,
      role: 'user',
      senderType: 'customer',
      context,
      metadata,
      status: 'sent',
      timestamp: new Date()
    });
    await userMessage.save();
    
    // 2. Actualizar o crear sesión
    let session = await ChatSession.findOne({ shopId, sessionId });
    if (!session) {
      session = new ChatSession({
        shopId,
        sessionId,
        status: 'active',
        startedAt: new Date(),
        lastMessageAt: new Date(),
        stats: {
          totalMessages: 0,
          userMessages: 0,
          aiMessages: 0,
          totalTokens: 0,
          totalCost: 0,
          averageResponseTime: 0
        }
      });
    }
    session.stats.totalMessages += 1;
    session.stats.userMessages += 1;
    session.lastMessageAt = new Date();
    await session.save();
    
    // 3. Llamar a Gemini API (desde el servidor)
    // TODO: Mover lógica de aiService.ts al servidor
    const geminiResponse = await callGeminiAPI(content, sessionId, shopId);
    
    // 4. Guardar respuesta del AI con tokens y costos
    const aiMessageId = `${messageId}_ai`;
    const aiMessage = new ChatMessage({
      shopId,
      sessionId,
      messageId: aiMessageId,
      content: geminiResponse.content,
      role: 'assistant',
      senderType: 'ai',
      tokenUsage: geminiResponse.tokenUsage,
      model: geminiResponse.model,
      cost: geminiResponse.cost,
      apiCall: {
        endpoint: geminiResponse.apiCall.endpoint,
        method: 'POST',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      },
      context: geminiResponse.context,
      status: 'delivered',
      timestamp: new Date()
    });
    await aiMessage.save();
    
    // 5. Actualizar sesión con estadísticas
    session.stats.totalMessages += 1;
    session.stats.aiMessages += 1;
    session.stats.totalTokens += geminiResponse.tokenUsage.totalTokens;
    session.stats.totalCost += geminiResponse.cost.totalCost;
    const avgResponseTime = (session.stats.averageResponseTime * (session.stats.aiMessages - 1) + (Date.now() - startTime)) / session.stats.aiMessages;
    session.stats.averageResponseTime = avgResponseTime;
    await session.save();
    
    // 6. Actualizar métricas diarias
    await updateDailyMetrics(shopId, {
      tokens: geminiResponse.tokenUsage.totalTokens,
      cost: geminiResponse.cost.totalCost,
      responseTime: Date.now() - startTime
    });
    
    // 7. Retornar respuesta
    res.json({
      success: true,
      data: {
        userMessage: {
          id: userMessage.messageId,
          content: userMessage.content,
          timestamp: userMessage.timestamp
        },
        aiMessage: {
          id: aiMessage.messageId,
          content: aiMessage.content,
          timestamp: aiMessage.timestamp,
          tokenUsage: aiMessage.tokenUsage,
          cost: aiMessage.cost
        },
        session: {
          id: session.sessionId,
          stats: session.stats
        }
      }
    });
    
  } catch (error) {
    console.error('[Chat API] Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to process chat message",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/chat/:shopId/history
// Obtener historial de mensajes
router.get('/chat/:shopId/history', validateShopId, async (req: express.Request, res: express.Response) => {
  try {
    const { shopId } = req.params;
    const { sessionId, page = 1, limit = 50, startDate, endDate } = req.query;
    
    const query: any = { shopId };
    if (sessionId) query.sessionId = sessionId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    const messages = await ChatMessage.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await ChatMessage.countDocuments(query);
    
    res.json({
      success: true,
      data: messages,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
        limit: Number(limit)
      }
    });
    
  } catch (error) {
    console.error('[Chat API] Error getting history:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get chat history"
    });
  }
});

// GET /api/chat/:shopId/sessions
// Obtener sesiones de chat
router.get('/chat/:shopId/sessions', validateShopId, async (req: express.Request, res: express.Response) => {
  try {
    const { shopId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    
    const query: any = { shopId };
    if (status) query.status = status;
    
    const skip = (Number(page) - 1) * Number(limit);
    const sessions = await ChatSession.find(query)
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await ChatSession.countDocuments(query);
    
    res.json({
      success: true,
      data: sessions,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
        limit: Number(limit)
      }
    });
    
  } catch (error) {
    console.error('[Chat API] Error getting sessions:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get chat sessions"
    });
  }
});

// GET /api/chat/:shopId/metrics
// Obtener métricas de uso
router.get('/chat/:shopId/metrics', validateShopId, async (req: express.Request, res: express.Response) => {
  try {
    const { shopId } = req.params;
    const { startDate, endDate, period = 'daily' } = req.query;
    
    let query: any = { shopId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }
    
    const metrics = await UsageMetrics.find(query)
      .sort({ date: -1 })
      .limit(period === 'daily' ? 30 : period === 'weekly' ? 12 : 12);
    
    // Calcular totales
    const totals = metrics.reduce((acc, m) => {
      acc.totalMessages += m.metrics.totalMessages;
      acc.totalApiCalls += m.metrics.totalApiCalls;
      acc.totalTokens += m.metrics.totalTokens.total;
      acc.totalCost += m.metrics.totalCost;
      return acc;
    }, {
      totalMessages: 0,
      totalApiCalls: 0,
      totalTokens: 0,
      totalCost: 0
    });
    
    res.json({
      success: true,
      data: {
        metrics,
        totals,
        period
      }
    });
    
  } catch (error) {
    console.error('[Chat API] Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get usage metrics"
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function callGeminiAPI(content: string, sessionId: string, shopId: string) {
  // TODO: Implementar llamada a Gemini API desde el servidor
  // Mover lógica de src/services/aiService.ts aquí
  // Retornar: { content, tokenUsage, model, cost, apiCall, context }
  throw new Error('Not implemented yet');
}

async function updateDailyMetrics(shopId: string, data: { tokens: number; cost: number; responseTime: number }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const metrics = await UsageMetrics.findOneAndUpdate(
    { shopId, date: today },
    {
      $inc: {
        'metrics.totalMessages': 1,
        'metrics.totalApiCalls': 1,
        'metrics.totalTokens.input': data.tokens, // Aproximación
        'metrics.totalTokens.total': data.tokens,
        'metrics.totalCost': data.cost
      },
      $set: {
        'metrics.averageResponseTime': data.responseTime // Simplificado
      }
    },
    { upsert: true, new: true }
  );
  
  return metrics;
}

export default router;
```

---

## 💰 Cálculo de Costos

### Precios de Gemini API (ejemplo - verificar precios actuales)

```typescript
// server/src/services/pricingService.ts

export const GEMINI_PRICING = {
  'gemini-3-pro-preview': {
    input: 0.000125,   // $0.125 por 1M tokens de entrada
    output: 0.000375,  // $0.375 por 1M tokens de salida
  },
  'gemini-1.5-flash': {
    input: 0.000075,   // $0.075 por 1M tokens
    output: 0.00030,   // $0.30 por 1M tokens
  }
};

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): { inputCost: number; outputCost: number; totalCost: number } {
  const pricing = GEMINI_PRICING[model as keyof typeof GEMINI_PRICING];
  if (!pricing) {
    throw new Error(`Unknown model: ${model}`);
  }
  
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + outputCost;
  
  return {
    inputCost: Math.round(inputCost * 10000) / 10000, // 4 decimales
    outputCost: Math.round(outputCost * 10000) / 10000,
    totalCost: Math.round(totalCost * 10000) / 10000
  };
}
```

---

## 📱 Cambios en el Frontend

### Modificar `src/services/aiService.ts`

```typescript
// En lugar de llamar directamente a Gemini, llamar al servidor:

async sendMessage(userMessage: string, mediaFiles?: ChatMessage['mediaFiles']): Promise<BizneAIResponse> {
  const shopId = await getRealShopId();
  if (!shopId) {
    throw new Error('Shop ID not found');
  }
  
  const sessionId = this.getOrCreateSessionId();
  const messageId = Date.now().toString();
  
  // Llamar al servidor en lugar de Gemini directamente
  const response = await fetch(`https://www.bizneai.com/api/chat/${shopId}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      messageId,
      content: userMessage,
      role: 'user',
      context: {
        mcpContext: {
          shopName: this.mcp.mcpData?.shop?.storeName,
          productsCount: this.mcp.mcpData?.products?.length || 0,
          hasInventory: !!this.mcp.mcpData?.inventory
        }
      },
      metadata: {
        mediaFiles: mediaFiles?.length || 0
      }
    })
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to send message');
  }
  
  // Retornar respuesta formateada
  return {
    message: result.data.aiMessage.content,
    context: result.data.aiMessage.context,
    suggestions: [],
    actions: [],
    confidence: 0.85,
    tokenUsage: result.data.aiMessage.tokenUsage,
    cost: result.data.aiMessage.cost
  };
}
```

---

## 📊 Dashboard de Métricas

### Endpoints adicionales para dashboard:

```typescript
// GET /api/chat/:shopId/stats
// Estadísticas resumidas
router.get('/chat/:shopId/stats', validateShopId, async (req, res) => {
  // Total de mensajes, tokens, costos
  // Por día/semana/mes
  // Gráficos de uso
});

// GET /api/chat/:shopId/billing
// Información de facturación
router.get('/chat/:shopId/billing', validateShopId, async (req, res) => {
  // Costos por período
  // Proyección de costos
  // Límites y alertas
});
```

---

## 🔄 Proceso de Implementación

### **Fase 1: Modelos y Estructura** (2-3 días)
- [ ] Actualizar modelo `ChatMessage` con campos de tokens y costos
- [ ] Crear modelo `ChatSession`
- [ ] Crear modelo `UsageMetrics`
- [ ] Crear índices necesarios

### **Fase 2: Servicio de Gemini en Servidor** (2-3 días)
- [ ] Mover lógica de `aiService.ts` al servidor
- [ ] Crear `server/src/services/geminiService.ts`
- [ ] Implementar cálculo de costos
- [ ] Extraer tokens de respuesta de Gemini

### **Fase 3: API Endpoints** (2-3 días)
- [ ] Crear `server/src/routes/chat.ts`
- [ ] Implementar `POST /api/chat/:shopId/message`
- [ ] Implementar `GET /api/chat/:shopId/history`
- [ ] Implementar `GET /api/chat/:shopId/sessions`
- [ ] Implementar `GET /api/chat/:shopId/metrics`

### **Fase 4: Integración Frontend** (1-2 días)
- [ ] Modificar `aiService.ts` para usar API del servidor
- [ ] Mantener compatibilidad con almacenamiento local
- [ ] Sincronizar historial local con servidor

### **Fase 5: Dashboard y Analytics** (2-3 días)
- [ ] Crear endpoints de estadísticas
- [ ] Implementar agregaciones de métricas
- [ ] Crear vistas de facturación

---

## 📝 Checklist de Implementación

### Backend:
- [ ] Modelos actualizados con tracking de tokens
- [ ] Servicio de Gemini en servidor
- [ ] Cálculo de costos por mensaje
- [ ] Endpoints API completos
- [ ] Actualización de métricas diarias
- [ ] Manejo de errores y logging

### Frontend:
- [ ] Modificar `aiService.ts` para usar API
- [ ] Mantener sincronización local/servidor
- [ ] Manejo de errores de red
- [ ] Mostrar tokens y costos en UI (opcional)

### Testing:
- [ ] Probar envío de mensajes
- [ ] Validar tracking de tokens
- [ ] Verificar cálculo de costos
- [ ] Probar historial y sesiones
- [ ] Validar métricas diarias

---

## 🎯 Beneficios

1. **Centralización**: Todos los datos en MongoDB Atlas
2. **Tracking preciso**: Tokens, costos, llamados por mensaje
3. **Facturación**: Datos listos para cobrar por uso
4. **Analytics**: Métricas detalladas de uso
5. **Escalabilidad**: Servidor maneja carga de API
6. **Historial completo**: Todas las conversaciones guardadas

---

**Última actualización**: 2025-01-26
**Estado**: 📋 Planificación - Listo para implementación

