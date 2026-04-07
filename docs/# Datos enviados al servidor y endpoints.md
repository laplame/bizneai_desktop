# Datos enviados al servidor y endpoints utilizados

Documento que lista todos los endpoints a los que la app envía datos, el método HTTP, y la estructura del payload.

**Base URL:** `https://www.bizneai.com/api` (o `EXPO_PUBLIC_API_BASE_URL` si está configurada)

---

## 1. Shop (Tienda)

### POST /shop
**Crear tienda**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| storeName | string | Nombre de la tienda (obligatorio) |
| storeLocation | string | Ubicación |
| streetAddress | string | Dirección |
| city | string | Ciudad |
| state | string | Estado |
| zip | string | Código postal |
| storeType | string | Tipo de tienda (default: GroceryStore) |
| whatsapp | string | Teléfono/WhatsApp (10-15 dígitos) |
| gpsLocation | object | `{ latitude, longitude }` |
| paymentMethods | object | `{ cash, card, crypto, luxae }` |
| locationSettings | object | `{ allowStockTransfer, requireLocationSelection, autoAllocateStock, lowStockAlerts }` |

**Servicio:** `shopService.createShop()`

---

### GET /shop/:shopId
**Obtener tienda por ID**

Sin body. Parámetro en path: `shopId`.

**Servicio:** `shopService.getShopById()`

---

### PUT /shop/:shopId
**Actualizar tienda**

Mismo body que POST /shop (campos a actualizar).

**Servicio:** `shopService.updateShop()`

---

### GET /shop/store-types
**Obtener tipos de tienda**

Sin body.

**Servicio:** `shopService.getStoreTypes()`, `api.testApiConnection()`

---

## 2. MCP - Productos

### GET /mcp/:shopId
**Obtener datos completos del negocio (productos, inventario, etc.)**

Query params opcionales: `includeProducts`, `includeInventory`, `includeTransactions`, `includeAnalytics`, `limit`

**Servicio:** `businessSyncService.syncWithBusiness()`, `productSyncApiService`, `unifiedProductSyncService`

---

### GET /mcp/:shopId/products
**Listar productos (con búsqueda opcional)**

Query params: `search`, `limit`, `page`, etc.

**Servicio:** `crudEventListenerService`, `ecommerceUploadService`, `productSyncApiService`

---

### POST /mcp/:shopId/products
**Crear producto**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| name | string | Nombre |
| description | string | Descripción |
| price | number | Precio |
| cost | number | Costo |
| sku | string | SKU |
| barcode | string | Código de barras |
| category | string | Categoría |
| stock | number | Stock |
| images | array | URLs de imágenes |
| imageMetadata | array | Metadatos de imágenes |
| variantGroups | array | Grupos de variantes |
| primaryVariantGroup | string | ID del grupo principal |
| hasVariants | boolean | Si tiene variantes |
| preparationTime | number | Tiempo de preparación (min) |

**Servicio:** `crudEventListenerService`, `ecommerceUploadService`, `ProductSyncModal`

---

### PUT /mcp/:shopId/products/:productId
**Actualizar producto**

Mismo body que POST. Parámetro en path: `productId` (serverId/_id).

**Servicio:** `crudEventListenerService`, `ProductSyncModal`, `mcpInventoryService`

---

### DELETE /mcp/:shopId/products/:productId
**Eliminar producto**

Sin body.

**Servicio:** `crudEventListenerService`

---

### POST /mcp/:shopId/products/bulk
**Crear productos en lote**

Body: `{ products: Product[] }` - array de productos en formato MCP.

**Servicio:** `ecommerceUploadService.uploadProductsBulk()`, `resyncProductsWithVariantsService`

---

### POST /mcp/:shopId/products/:productId/images
**Subir imagen de producto**

Body: `FormData` con archivo(s) de imagen.

**Servicio:** `imageUploader.uploadProductImage()`

---

## 3. MCP - Inventario

### POST /mcp/:shopId/inventory/adjust
**Ajustar inventario**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| adjustments | array | Lista de ajustes |
| adjustments[].productId | string | ID del producto (serverId) |
| adjustments[].quantity | number | Cantidad |
| adjustments[].operation | string | 'set' \| 'increment' \| 'decrement' |
| adjustments[].adjustmentType | string | Tipo de ajuste |
| adjustments[].reason | string | Motivo |
| adjustments[].reference | string | Referencia |

**Servicio:** `mcpInventoryService.syncInventoryAdjustments()`, `crudEventListenerService`

---

### GET /mcp/:shopId/inventory/low-stock
**Productos con bajo stock**

Query params: `threshold`

**Servicio:** `mcpInventoryService.getLowStockProducts()`

---

### GET /mcp/:shopId/inventory/status
**Estado del inventario**

Sin body.

**Servicio:** `mcpInventoryService.getInventoryStatus()`

---

## 4. MCP - Ventas (Sales)

### POST /mcp/:shopId/sales
**Registrar venta**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| customerName | string | Nombre del cliente |
| items | array | Items de la venta |
| items[].productName | string | Nombre del producto |
| items[].productId | string | ID producto (serverId) |
| items[].quantity | number | Cantidad |
| items[].unitPrice | number | Precio unitario |
| items[].totalPrice | number | Total del item |
| items[].category | string | Categoría |
| subtotal | number | Subtotal |
| tax | number | IVA |
| total | number | Total |
| paymentMethod | string | cash, card, crypto, mixed, etc. |
| paymentStatus | string | completed, pending |
| orderType | string | dine-in, takeaway, delivery |
| customerPhone | string | Teléfono |
| customerEmail | string | Email |
| discount | number | Descuento |
| notes | string | Notas |
| tableNumber | string | Mesa |
| waiterName | string | Mesero |
| clientEventId | string | UUID para idempotencia |
| sourcePlatform | string | 'mobile' |
| sourceDeviceId | string | ID del dispositivo |
| clientTimestampUnixMs | number | Timestamp cliente |
| merkleTransactionId | string | ID transacción Merkle (opcional) |
| merkleTransactionHash | string | Hash transacción (opcional) |
| merkleProof | array | Prueba Merkle (opcional) |
| blockId | string | ID bloque (opcional) |
| blockHash | string | Hash bloque (opcional) |
| merkleRoot | string | Raíz Merkle (opcional) |
| mixedPayments | object | `{ cash, card, crypto }` si paymentMethod=mixed |

**Servicio:** `mcpSalesService.syncSaleToMCP()`, `crudEventListenerService`

---

### PUT /:shopId/sales/:saleId
**Actualizar venta** (CRUD Event Listener)

Mismo body que POST. Parámetros en path: `shopId`, `saleId`.

**Servicio:** `crudEventListenerService`

---

### DELETE /:shopId/sales/:saleId
**Eliminar venta** (CRUD Event Listener)

Sin body.

**Servicio:** `crudEventListenerService`

---

## 5. MCP - Bloques (Merkle Tree)

### POST /mcp/:shopId/blocks
**Enviar bloque diario**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | BLOCK-YYYY-MM-DD-timestamp |
| date | string | YYYY-MM-DD |
| merkleRoot | string | Raíz del árbol Merkle |
| blockHash | string | Hash del bloque |
| previousBlockHash | string | Hash del bloque anterior |
| transactionCount | number | Cantidad de transacciones |
| unixTime | number | Timestamp Unix |
| createdAt | string | ISO 8601 |
| transactions | array | Transacciones |
| transactions[].id | string | ID transacción |
| transactions[].type | string | create, update, delete |
| transactions[].saleId | string | ID venta |
| transactions[].hash | string | Hash SHA-256 |
| transactions[].merkleProof | array | Prueba Merkle |
| transactions[].timestamp | string | ISO 8601 |

**Servicio:** `blockApiService.sendBlockToServer()`

---

## 6. Kitchen (Cocina)

### GET /kitchen/orders
**Listar órdenes**

Query params: `shopId`, `status`, `limit`, etc.

**Servicio:** `kitchenApiService.getKitchenOrders()`

---

### POST /kitchen/orders
**Crear orden de cocina**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| shopId | string | ID tienda |
| customerName | string | Cliente |
| items | array | Items con product, quantity, price |
| total | number | Total |
| status | string | waiting, preparing, ready, completed |
| priority | string | normal, high, urgent |
| notes | string | Notas |
| tableNumber | string | Mesa |
| orderType | string | dine-in, takeaway, delivery |

**Servicio:** `kitchenApiService.createKitchenOrder()`

---

### GET /kitchen/orders/:orderId
**Obtener orden**

Query params: `shopId`

**Servicio:** `kitchenApiService.getKitchenOrder()`

---

### PUT /kitchen/orders/:orderId
**Actualizar orden**

Body: orden completa.

**Servicio:** `kitchenApiService.updateKitchenOrder()`

---

### PATCH /kitchen/orders/:orderId/status
**Actualizar estado**

Body: `{ status: string }`

**Servicio:** `kitchenApiService.updateOrderStatus()`

---

### PATCH /kitchen/orders/:orderId/priority
**Actualizar prioridad**

Body: `{ priority: string }`

**Servicio:** `kitchenApiService.updateOrderPriority()`

---

### DELETE /kitchen/orders/:orderId
**Eliminar orden**

Query params: `shopId`

**Servicio:** `kitchenApiService.deleteKitchenOrder()`

---

### GET /kitchen/stats
**Estadísticas de cocina**

Query params: `shopId`, `period`

**Servicio:** `kitchenApiService.getKitchenStats()`

---

## 7. Waitlist (Lista de espera)

### GET /waitlist/orders
**Obtener órdenes de waitlist**

Query params: `shopId`, `source`, `status`, `page`, `limit`, `sortBy`, `sortOrder`

**Servicio:** `waitlistSyncService.syncWaitlistFromServer()`

---

### POST /waitlist/shop/:shopId
**Crear orden en waitlist**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| orderName | string | Nombre del pedido |
| items | array | Items |
| total | number | Total |
| notes | string | Notas |
| source | string | Origen |
| status | string | waiting, etc. |

**Servicio:** `WaitlistContext` (al agregar orden desde app)

---

### PUT /waitlist/orders/:orderId
**Actualizar estado de orden**

Body: `{ status, shopId }`

**Servicio:** `waitlistSyncService.updateWaitlistOrderStatus()`

---

### GET /waitlist/shop/:shopId
**Obtener waitlist por tienda**

**Servicio:** `WaitlistContext`

---

## 8. Tickets

### GET /:shopId/tickets
**Obtener tickets**

Query params: `page`, `limit`, etc.

**Servicio:** `ticketService`, `unifiedProductSyncService`

---

### POST /:shopId/tickets
**Crear ticket** (sincronización de ventas como tickets)

Body: datos del ticket/venta.

**Servicio:** `unifiedProductSyncService` (sync tickets)

---

## 9. Roles

### POST /shops/:shopId/roles/sync
**Sincronizar roles**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| shopId | string | ID tienda |
| roles | array | Lista de roles con usuarios |
| timestamp | string | ISO 8601 |

**Servicio:** `roleSyncService.syncRolesToServer()`

**Nota:** Usa `https://www.bizneai.com/api` como base (no makeApiRequest).

---

## 10. Discount QR (Cupones)

### POST /discount-qr/verify
**Verificar código de descuento**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| qrValue | string | Valor del código QR decodificado |

**Servicio:** `discountQrService.verifyDiscountQr()`

---

## 11. AI / Chat

### POST (externo - Gemini/Groq)
**Enviar mensaje al modelo de IA**

La app envía a APIs externas (Google Gemini, Groq) para el chat de BizneAI. No es el servidor bizneai.com.

**Servicio:** `aiService.sendMessage()`

---

### POST (bizneai.com - si existe)
**Historial de chat / interacciones**

Posibles endpoints: `/bizneai-chat`, `/:shopId/ai-history` (verificar en aiService).

**Servicio:** `aiService`

---

## 12. Otros endpoints (solo lectura / GET)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| /products | GET | Productos (fallback, sin shopId) |
| /products/grocery-categories | GET | Categorías por storeType |
| /products/:productId/inventory | GET | Inventario de producto |
| /shop/:mainCategory/products | GET | Productos por categoría (GetQuickDataModal) |

---

## Reglas de los servicios CRUD con las APIs

### 1. CRUD Event Listener Service (`crudEventListenerService`)

**Propósito:** Escucha operaciones CRUD locales (productos, ventas, inventario, etc.) y las sincroniza con el servidor.

#### Condiciones para enviar al servidor

| Regla | Descripción |
|-------|-------------|
| **ecommerceEnabled** | Solo envía si `ecommerceEnabled === true` (local o servidor). Si está deshabilitado, los eventos se descartan (no se encolan). |
| **shopId válido** | Requiere `shopId` real (no provisional). Si no hay shopId, el evento se encola para reintento. |
| **Cache ecommerce** | El estado de ecommerce se cachea 5 minutos. Fuentes: `bizneai_ecommerce_enabled` (AsyncStorage), `getShopById().ecommerceEnabled`, o local si hubo sync desde URL. |

#### Entidades y mapeo a endpoints

| Entidad | Operación | Endpoint | Método |
|---------|------------|----------|--------|
| product | create | `/mcp/:shopId/products` | POST |
| product | update | `/mcp/:shopId/products/:serverId` | PUT |
| product | delete | `/mcp/:shopId/products/:serverId` | DELETE |
| sale | create | `/mcp/:shopId/sales` | POST |
| sale | update | `/:shopId/sales/:saleId` | PUT |
| sale | delete | `/:shopId/sales/:saleId` | DELETE |
| inventory | adjust | `/mcp/:shopId/inventory/adjust` | POST |

#### Reglas de productos

- **UPDATE sin serverId:** Si el producto no tiene `serverId`, se busca en el servidor por SKU o nombre. Si se encuentra → PUT. Si no → se convierte a CREATE (POST).
- **DELETE sin serverId:** Se busca por SKU/nombre. Si no existe en servidor → se considera éxito (ya eliminado).
- **Similitud (409):** Si el servidor devuelve `EXACT_DUPLICATE` o `HIGH_SIMILARITY`, no se reencola. Se puede intentar actualizar el producto existente si se encuentra en la respuesta.

#### Cola de eventos

- **Clave:** `@BizneAI_crud_event_queue`
- **Cuándo se encola:** Si el envío falla (red, 429, etc.) y no es error de similitud.
- **Procesamiento:** `processEventQueue()` — se invoca al iniciar sync (unifiedProductSyncService, startupSyncService).
- **Orden:** Antes de procesar la cola, se sincronizan productos e inventario al servidor.

---

### 2. Rate Limiter Service (`rateLimiterService`)

**Propósito:** Evitar errores 429 (Too Many Requests) limitando la frecuencia de llamadas.

| Parámetro | Valor | Descripción |
|----------|-------|-------------|
| maxRequestsPerMinute | 15 | Máximo de requests por minuto |
| maxRequestsPerHour | 200 | Máximo de requests por hora |
| minDelayBetweenRequests | 200 ms | Mínimo entre requests |
| backoffMultiplier | 2 | Multiplicador en backoff exponencial |
| maxBackoffDelay | 30 s | Máximo tiempo de espera en backoff |

**Comportamiento:**
- Si se recibe 429, se pausa el sync (`isSyncPaused`).
- `processEventQueue()` no procesa si el sync está pausado.
- El sync se reanuda cuando hay un cambio real (venta, producto, stock) que dispara el rate limiter a verificar de nuevo.

---

### 3. Offline Sync Queue Service (`offlineSyncQueueService`)

**Propósito:** Encolar ventas y ajustes de inventario cuando no hay conexión y sincronizarlos al recuperarla.

| Cola | Clave | Contenido |
|------|-------|-----------|
| Ventas | `@BizneAI_offline_sales_queue` | `QueuedSale[]` |
| Inventario | `@BizneAI_offline_inventory_queue` | `QueuedInventoryAdjustment[]` |

**Reglas:**
- **Detección de red:** Cada 30 s se hace un GET ligero a `/mcp/:shopId?limit=1` para comprobar conectividad.
- **Al recuperar conexión:** Se ejecuta `processQueues()` automáticamente.
- **Prioridades:** `high`, `normal`, `low` para ordenar el procesamiento.

**Quién encola:**
- `mcpSalesService`: ventas cuando hay error de red.
- `mcpInventoryService`: ajustes de inventario cuando hay error de red.

---

### 4. MCP Sales Service (`mcpSalesService`)

| Regla | Descripción |
|-------|-------------|
| **shopId real** | Solo sincroniza si `getRealShopId()` devuelve ID válido (no provisional). |
| **Pre-sync** | Antes de enviar una venta, asegura que productos e inventario estén sincronizados (`ensureProductsAndStocksSynced`). |
| **clientEventId** | Genera y persiste UUID para idempotencia en reintentos. |
| **Offline** | Si falla por red, encola en `offlineSyncQueueService.queueSale()`. |
| **Rate limit** | Usa `rateLimitedApiRequest` para evitar 429. |

---

### 5. MCP Inventory Service (`mcpInventoryService`)

| Regla | Descripción |
|-------|-------------|
| **Batch** | Agrupa ajustes y los envía en lotes (delay configurable) para reducir requests. |
| **shopId real** | Requiere shopId válido. |
| **Offline** | Si falla por red, encola cada ajuste en `offlineSyncQueueService.queueInventoryAdjustment()`. |

---

### 6. Ecommerce Upload Service (`ecommerceUploadService`)

| Regla | Descripción |
|-------|-------------|
| **ecommerceEnabled** | Verifica `isEcommerceEnabled()` antes de subir productos. |
| **Bulk vs individual** | Intenta primero `POST /mcp/:shopId/products/bulk`. Si falla, sube producto por producto. |
| **Similitud** | El servidor puede rechazar por duplicado/similitud. El cliente puede buscar producto existente y hacer PUT. |
| **skipCRUDEvent** | La base de datos puede usar `skipCRUDEvent: true` para evitar duplicar eventos cuando el upload es manual. |

---

### 7. Origen de eventos CRUD

| Origen | Entidad | Operación | Cuándo |
|--------|---------|-----------|--------|
| database.ts | product | create, update, delete | addProduct, updateProduct, deleteProduct (salvo skipCRUDEvent) |
| salesHistoryService | sale | create, update | recordSaleCreation, updateSaleInHistory |
| inventoryDatabase | inventory | adjust | Tras ajuste de stock (vía mcpInventoryService) |

---

### 8. Flujo de sincronización (unifiedProductSyncService)

1. **Procesar cola CRUD** (`processEventQueue`) — eventos pendientes.
2. **Sincronizar productos** — subir productos locales al servidor.
3. **Sincronizar imágenes** — subir imágenes faltantes.
4. **Sincronizar ventas** — enviar ventas pendientes.
5. **Sincronizar tickets** — `POST /:shopId/tickets`.
6. **Sincronizar inventario** — ya cubierto por cola CRUD o upload de productos.

---

## Resumen por servicio

| Servicio | Endpoints que envía datos (POST/PUT/PATCH/DELETE) |
|----------|---------------------------------------------------|
| shopService | POST /shop, PUT /shop/:id |
| blockApiService | POST /mcp/:shopId/blocks |
| mcpSalesService | POST /mcp/:shopId/sales |
| mcpInventoryService | POST /mcp/:shopId/inventory/adjust |
| crudEventListenerService | POST/PUT/DELETE /mcp/:shopId/products, POST /mcp/:shopId/sales, PUT/DELETE /:shopId/sales/:id, POST /mcp/:shopId/inventory/adjust |
| ecommerceUploadService | POST /mcp/:shopId/products, PUT /mcp/:shopId/products/:id, POST /mcp/:shopId/products/bulk |
| kitchenApiService | POST /kitchen/orders, PUT/PATCH/DELETE /kitchen/orders/:id |
| waitlistSyncService | POST /waitlist/shop/:id, PUT /waitlist/orders/:id |
| roleSyncService | POST /shops/:shopId/roles/sync |
| discountQrService | POST /discount-qr/verify |
| imageUploader | POST /mcp/:shopId/products/:productId/images |
| unifiedProductSyncService | POST /:shopId/tickets |

---

*Documento generado a partir del análisis del código en `src/services/` y componentes que usan `makeApiRequest` o `fetch`.*
