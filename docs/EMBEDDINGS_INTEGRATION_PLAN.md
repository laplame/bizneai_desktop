# 📋 Plan de Integración de Embeddings para RAG en BizneAI

## 🎯 Objetivo
Integrar embeddings vectoriales en MongoDB Atlas para mejorar el sistema RAG (Retrieval Augmented Generation) del chat BizneAI, permitiendo búsquedas semánticas más precisas y respuestas contextualizadas.

---

## 📊 Estado Actual

### ✅ Lo que ya tenemos:
1. **Conexión a MongoDB Atlas**: El servidor se conecta vía `MONGODB_URI` en `server/src/index.ts`
2. **Modelos existentes**: Product, ChatMessage, Ticket, ShopTransaction, etc.
3. **Sistema RAG básico**: Carga datos del MCP endpoint y los incluye en el system prompt
4. **API de Gemini**: Configurada para generar respuestas

### ❌ Lo que falta:
1. **Generación de embeddings**: No hay servicio para generar embeddings
2. **Almacenamiento de embeddings**: No hay campo en los modelos para guardar vectores
3. **Búsqueda vectorial**: No hay capacidad de búsqueda semántica
4. **Sincronización de embeddings**: No hay proceso para actualizar embeddings cuando cambian los datos

---

## 🏗️ Arquitectura Propuesta

### 1. **Modelo de Datos para Embeddings**

#### Opción A: Embeddings en el mismo documento (Recomendado)
```typescript
// Agregar campo embedding a modelos existentes
interface ProductWithEmbedding {
  // ... campos existentes
  embedding?: number[];  // Vector de embeddings (ej: 768 dimensiones)
  embeddingModel?: string;  // "text-embedding-004" o "gemini-embedding"
  embeddingUpdatedAt?: Date;
}

interface ChatMessageWithEmbedding {
  // ... campos existentes
  embedding?: number[];
  embeddingModel?: string;
  embeddingUpdatedAt?: Date;
}
```

#### Opción B: Colección separada para embeddings
```typescript
// Nueva colección: embeddings
interface Embedding {
  _id: ObjectId;
  entityType: 'product' | 'chat_message' | 'ticket' | 'sale';
  entityId: ObjectId;
  shopId: ObjectId;
  text: string;  // Texto original que se embedió
  embedding: number[];
  model: string;
  metadata?: {
    category?: string;
    tags?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Recomendación**: Opción A para productos, Opción B para mensajes de chat (más flexible)

---

### 2. **Servicio de Generación de Embeddings**

#### Ubicación: `server/src/services/embeddingService.ts`

```typescript
// Opciones de proveedores:
1. Google Gemini Embeddings API
   - URL: https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent
   - Dimensiones: 768
   - Gratis hasta cierto límite

2. OpenAI Embeddings API
   - Modelo: text-embedding-3-small (1536 dims) o text-embedding-3-large (3072 dims)
   - Requiere API key de OpenAI

3. MongoDB Atlas Vector Search (nativo)
   - Usa modelos pre-entrenados
   - Integración directa con Atlas
```

**Recomendación**: Google Gemini Embeddings (ya tenemos API key configurada)

---

### 3. **Estructura de Datos para Embedding**

#### Para Productos:
```typescript
// Texto a embedear:
const productText = `
Producto: ${product.name}
Descripción: ${product.description}
Categoría: ${product.category}
Precio: $${product.price}
SKU: ${product.sku}
Stock: ${product.stock}
`.trim();
```

#### Para Mensajes de Chat:
```typescript
// Texto a embedear:
const messageText = message.content; // Ya es texto plano
```

#### Para Ventas/Transacciones:
```typescript
// Texto a embedear:
const transactionText = `
Venta #${transaction.transactionId}
Cliente: ${transaction.customerName}
Productos: ${transaction.items.map(i => i.name).join(', ')}
Total: $${transaction.total}
Método de pago: ${transaction.paymentMethod}
Fecha: ${transaction.createdAt}
`.trim();
```

---

### 4. **Endpoints API Necesarios**

#### En el servidor (`server/src/routes/shop.ts` o nueva ruta):

```typescript
// POST /api/:shopId/embeddings/generate
// Genera embeddings para un producto/mensaje específico

// POST /api/:shopId/embeddings/bulk-generate
// Genera embeddings para múltiples entidades

// POST /api/:shopId/embeddings/search
// Búsqueda semántica usando embeddings
// Body: { query: "bolsa mediana", limit: 5, entityType: "product" }

// GET /api/:shopId/embeddings/status
// Estado de embeddings (cuántos tienen, cuántos faltan)
```

---

### 5. **Flujo de Sincronización**

```
┌─────────────────┐
│  App Móvil      │
│  (React Native) │
└────────┬────────┘
         │
         │ 1. Usuario crea/actualiza producto
         │
         ▼
┌─────────────────┐
│  API Server     │
│  POST /products │
└────────┬────────┘
         │
         │ 2. Guardar producto en MongoDB
         │
         ▼
┌─────────────────┐
│  MongoDB Atlas  │
│  (Product saved)│
└────────┬────────┘
         │
         │ 3. Trigger o job para generar embedding
         │
         ▼
┌─────────────────┐
│ Embedding       │
│ Service         │
│ (Gemini API)    │
└────────┬────────┘
         │
         │ 4. Generar embedding del texto del producto
         │
         ▼
┌─────────────────┐
│  MongoDB Atlas  │
│  (Update product│
│   with embedding)│
└─────────────────┘
```

---

### 6. **Índices Vectoriales en MongoDB Atlas**

MongoDB Atlas soporta búsqueda vectorial nativa. Necesitamos crear un índice:

```javascript
// En MongoDB Atlas UI o via código:
db.products.createSearchIndex({
  name: "product_embedding_index",
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        embedding: {
          type: "knnVector",
          dimensions: 768,  // Dimensiones del embedding
          similarity: "cosine"  // o "euclidean", "dotProduct"
        },
        shopId: { type: "objectId" },
        name: { type: "string" },
        category: { type: "string" }
      }
    }
  }
});
```

---

### 7. **Integración con RAG Actual**

#### Modificar `src/services/aiService.ts`:

```typescript
// En lugar de cargar todos los productos del MCP,
// hacer búsqueda semántica cuando el usuario pregunta:

async searchRelevantProducts(query: string, shopId: string): Promise<Product[]> {
  // 1. Generar embedding de la query del usuario
  const queryEmbedding = await generateEmbedding(query);
  
  // 2. Buscar productos similares en MongoDB
  const response = await fetch(
    `https://www.bizneai.com/api/${shopId}/embeddings/search`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        queryEmbedding: queryEmbedding,
        entityType: 'product',
        limit: 5
      })
    }
  );
  
  return response.json();
}
```

---

## 📦 Dependencias Necesarias

### En el servidor (`server/package.json`):
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.2.0",  // Para embeddings de Gemini
    // O
    "openai": "^4.0.0"  // Si usamos OpenAI
  }
}
```

---

## 🔄 Proceso de Implementación (Fases)

### **Fase 1: Infraestructura Base**
1. ✅ Crear servicio de embeddings (`server/src/services/embeddingService.ts`)
2. ✅ Agregar campo `embedding` a modelos existentes (Product, ChatMessage)
3. ✅ Crear índices vectoriales en MongoDB Atlas
4. ✅ Endpoint para generar embeddings individuales

### **Fase 2: Generación Masiva**
1. ✅ Endpoint para generar embeddings en bulk
2. ✅ Script de migración para productos existentes
3. ✅ Job/cron para actualizar embeddings cuando cambian productos

### **Fase 3: Búsqueda Semántica**
1. ✅ Endpoint de búsqueda vectorial
2. ✅ Integrar búsqueda en el RAG del chat
3. ✅ Reemplazar carga completa del MCP por búsqueda semántica

### **Fase 4: Optimización**
1. ✅ Cache de embeddings frecuentes
2. ✅ Actualización incremental (solo productos modificados)
3. ✅ Métricas y monitoreo

---

## 🎯 Casos de Uso

### 1. **Búsqueda de Productos por Descripción**
```
Usuario: "¿Tienes bolsas medianas?"
→ Buscar productos con embedding similar a "bolsas medianas"
→ Encontrar: "Bolsa Mediana bond lisa" (aunque no coincida exactamente)
```

### 2. **Búsqueda de Mensajes de Chat Relevantes**
```
Usuario: "¿Qué me dijiste sobre inventario?"
→ Buscar mensajes anteriores con embedding similar
→ Encontrar conversaciones relevantes sobre inventario
```

### 3. **Recomendaciones Inteligentes**
```
Usuario: "Necesito algo para envolver regalos"
→ Buscar productos semánticamente relacionados
→ Encontrar: "Bolsa chica bond patrones", "Metalustre Rollo"
```

---

## ⚠️ Consideraciones

### 1. **Costo de Embeddings**
- Gemini Embeddings: Gratis hasta cierto límite
- Considerar cache para evitar regenerar embeddings
- Actualizar solo cuando cambia el contenido

### 2. **Dimensiones del Vector**
- Gemini: 768 dimensiones
- Cada embedding ocupa ~3KB en MongoDB
- Para 1000 productos: ~3MB adicionales

### 3. **Rendimiento**
- Búsqueda vectorial es más lenta que búsqueda por texto
- Usar índices vectoriales de Atlas
- Limitar resultados (top 5-10)

### 4. **Sincronización**
- ¿Cuándo generar embeddings?
  - Opción A: Al crear/actualizar producto (síncrono)
  - Opción B: Job asíncrono cada X minutos
  - Opción C: Híbrido (críticos síncrono, resto asíncrono)

---

## 📝 Checklist de Implementación

### Backend (Server):
- [ ] Instalar dependencias de embeddings
- [ ] Crear `embeddingService.ts`
- [ ] Agregar campo `embedding` a modelos
- [ ] Crear índices vectoriales en Atlas
- [ ] Endpoint POST `/api/:shopId/embeddings/generate`
- [ ] Endpoint POST `/api/:shopId/embeddings/search`
- [ ] Script de migración para productos existentes

### Frontend (App):
- [ ] Modificar `aiService.ts` para usar búsqueda semántica
- [ ] Integrar búsqueda en lugar de cargar todo el MCP
- [ ] Manejar casos donde no hay embeddings aún

### Testing:
- [ ] Probar generación de embeddings
- [ ] Probar búsqueda semántica
- [ ] Validar que encuentra productos relevantes
- [ ] Medir rendimiento

---

## 🔗 Referencias

- [MongoDB Atlas Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/)
- [Google Gemini Embeddings](https://ai.google.dev/docs/embeddings)
- [MongoDB Vector Search Index](https://www.mongodb.com/docs/atlas/atlas-vector-search/create-index/)

---

## 📅 Estimación

- **Fase 1**: 2-3 días
- **Fase 2**: 1-2 días
- **Fase 3**: 2-3 días
- **Fase 4**: 1-2 días

**Total**: ~6-10 días de desarrollo

---

**Última actualización**: 2025-01-26
**Estado**: 📋 Planificación - Listo para implementación

