# Especificación: Envío de Merkle Tree y Bloques a la API

> **Contrato de recepción en el backend MCP (Zod, idempotencia, summary, ventas):** [`MERKLE_MCP_BACKEND_RECEPCION.md`](./MERKLE_MCP_BACKEND_RECEPCION.md).  
> **Sincronización POS ↔ API (ledger dev, `blocks/summary`, widget):** [`MERKLE_SYNC_POS_API.md`](./MERKLE_SYNC_POS_API.md).

## 1. Estado actual (cliente vs API de referencia)

En **este monorepo (POS)** el cliente **sí genera** hash de transacción, pruebas Merkle al cerrar bloque, `blockHash` y `merkleRoot` por bloque (`merkleTreeService.ts`), y puede **enviar** bloques con `blockApiService.ts` hacia `POST /api/mcp/:shopId/blocks`.

En el **API BizneAI** (fuera de este repo), la recepción de esos datos y de los campos Merkle opcionales en ventas está descrita en **`MERKLE_MCP_BACKEND_RECEPCION.md`**: el backend valida con Zod, aplica idempotencia en bloques y persiste `merkleProof: []` en ventas si el cliente lo envía.

| Dato | Cliente (este repo) | Servidor (API MCP de referencia) |
|------|---------------------|----------------------------------|
| Hash de transacción | ✅ `recordSaleCreation()` | ✅ Recibido en `POST …/blocks` y opcional en `POST …/sales` |
| Merkle proof | ✅ Al generar bloque | ✅ En transacciones del bloque; ventas opcionales |
| Block hash / root | ✅ `generateDailyBlock()` | ✅ `POST …/blocks` |

El POS **puede** ampliar `POST /api/mcp/:shopId/sales` con los campos Merkle opcionales (sección 3.1 más abajo); hasta que el checkout los rellene, el body puede ir sin ellos.

---

## 2. Datos disponibles en el cliente

### 2.1 Transacción (inmediata al crear venta)

Cada venta genera una transacción con hash SHA-256:

```typescript
interface SalesTransaction {
  id: string;           // TXN-{timestamp}-{random}
  type: 'create' | 'update' | 'delete';
  saleId: string;
  saleData?: Sale;
  timestamp: string;    // ISO 8601
  hash: string;        // SHA-256 del contenido
  merkleProof?: string[];  // Vacío hasta generar bloque
}
```

- **Disponible:** Inmediatamente al crear/editar/eliminar venta
- **Hash:** SHA-256 de `{id, type, saleId, timestamp, saleData, previousData}`

### 2.2 Bloque diario (al ejecutar "Generar Bloque")

```typescript
interface DailyBlock {
  id: string;              // BLOCK-{YYYY-MM-DD}-{timestamp}
  date: string;            // YYYY-MM-DD
  merkleRoot: string;      // Raíz del árbol Merkle
  transactions: SalesTransaction[];
  previousBlockHash?: string;
  blockHash: string;
  createdAt: string;
  transactionCount: number;
  unixTime?: number;
}
```

- **Disponible:** Solo cuando el usuario genera el bloque (manual, fin del día)
- **merkleProof:** Se rellena para cada transacción al crear el bloque

---

## 3. Propuesta de implementación

### 3.1 Extensión del payload de ventas (POST /api/mcp/:shopId/sales)

Añadir campos **opcionales** al body existente:

```json
{
  "customerName": "Walk-in Customer",
  "items": [...],
  "subtotal": 45,
  "tax": 0,
  "total": 45,
  "paymentMethod": "cash",
  "clientEventId": "uuid",
  "sourcePlatform": "mobile",
  "sourceDeviceId": "mobile-xxx",
  "clientTimestampUnixMs": 1772732801856,

  "merkleTransactionId": "TXN-1772732801856-abc123",
  "merkleTransactionHash": "a1b2c3d4e5f6...",
  "merkleProof": [],
  "blockId": null,
  "blockHash": null,
  "merkleRoot": null
}
```

| Campo | Tipo | Cuándo se envía | Descripción |
|-------|------|-----------------|-------------|
| `merkleTransactionId` | string | Siempre (si existe) | ID de la transacción en el Merkle tree |
| `merkleTransactionHash` | string | Siempre (si existe) | Hash SHA-256 de la transacción |
| `merkleProof` | string[] | Si bloque ya generado | Prueba Merkle para verificar contra raíz |
| `blockId` | string \| null | Si bloque ya generado | ID del bloque que contiene la transacción |
| `blockHash` | string \| null | Si bloque ya generado | Hash del bloque completo |
| `merkleRoot` | string \| null | Si bloque ya generado | Raíz Merkle del bloque |

**Nota:** Al sincronizar una venta recién creada, `merkleProof`, `blockId`, `blockHash`, `merkleRoot` suelen ser `null` o `[]` porque el bloque se genera al final del día.

---

### 3.2 Nuevo endpoint: bloques diarios

```
POST /api/mcp/:shopId/blocks
```

**Body:**

```json
{
  "id": "BLOCK-2026-03-05-1772732800000",
  "date": "2026-03-05",
  "merkleRoot": "e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
  "blockHash": "f1e2d3c4b5a6978...",
  "previousBlockHash": "a0b1c2d3e4f5...",
  "transactionCount": 15,
  "unixTime": 1772732800,
  "createdAt": "2026-03-05T23:59:59.000Z",
  "transactions": [
    {
      "id": "TXN-1772732801856-abc123",
      "type": "create",
      "saleId": "1772732806308",
      "hash": "a1b2c3d4...",
      "merkleProof": ["h1", "h2", "h3"],
      "timestamp": "2026-03-05T17:41:32.524Z"
    }
  ]
}
```

**Respuesta esperada:**

```json
{
  "success": true,
  "data": {
    "blockId": "BLOCK-2026-03-05-1772732800000",
    "stored": true,
    "rewardEligible": true
  },
  "message": "Block stored successfully"
}
```

---

### 3.3 Resumen de bloques y Luxae (Block Summary)

El cliente mantiene un resumen local que incluye:

- **Total de bloques generados:** cantidad de bloques
- **Ventas por bloque:** `transactionCount` de cada bloque
- **Total LUX generados:** 50 LUX por cada bloque con transacciones (`transactionCount > 0`)

Para sincronizar este resumen con el servidor, se propone:

#### POST /api/mcp/:shopId/blocks/summary

Envía el resumen completo de bloques y Luxae del cliente al servidor.

**Body:**

```json
{
  "totalBlocks": 5,
  "totalSalesInBlocks": 47,
  "totalLuxae": 250,
  "blocks": [
    {
      "id": "BLOCK-2026-03-05-1772732800000",
      "date": "2026-03-05",
      "transactionCount": 12,
      "luxaeEarned": 50
    },
    {
      "id": "BLOCK-2026-03-04-1772646400000",
      "date": "2026-03-04",
      "transactionCount": 8,
      "luxaeEarned": 50
    }
  ],
  "sourceDeviceId": "mobile-cc75c941",
  "clientTimestampUnixMs": 1772733389234
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `totalBlocks` | number | Total de bloques generados por la tienda |
| `totalSalesInBlocks` | number | Suma de `transactionCount` de todos los bloques |
| `totalLuxae` | number | Total LUX generados (50 por bloque con ventas) |
| `blocks` | array | Lista de bloques con fecha y ventas por bloque |
| `blocks[].id` | string | ID del bloque |
| `blocks[].date` | string | Fecha YYYY-MM-DD |
| `blocks[].transactionCount` | number | Ventas/transacciones en ese bloque |
| `blocks[].luxaeEarned` | number | LUX ganados por ese bloque (50 si tiene ventas, 0 si no) |
| `sourceDeviceId` | string | Identificador del dispositivo que envía |
| `clientTimestampUnixMs` | number | Timestamp del cliente |

**Respuesta esperada:**

```json
{
  "success": true,
  "data": {
    "stored": true,
    "totalBlocks": 5,
    "totalLuxae": 250
  },
  "message": "Block summary synced successfully"
}
```

#### GET /api/mcp/:shopId/blocks/summary

Obtiene el resumen de bloques y Luxae almacenado en el servidor (calculado desde los bloques recibidos o desde el último sync de summary).

**Respuesta esperada:**

```json
{
  "success": true,
  "data": {
    "totalBlocks": 5,
    "totalSalesInBlocks": 47,
    "totalLuxae": 250,
    "blocks": [
      {
        "id": "BLOCK-2026-03-05-1772732800000",
        "date": "2026-03-05",
        "transactionCount": 12,
        "luxaeEarned": 50
      }
    ]
  }
}
```

**Uso desde la app:**
- Tras generar un bloque: enviar `POST /blocks` (bloque individual) y opcionalmente `POST /blocks/summary` para actualizar el resumen.
- Al abrir Sales: llamar `GET /blocks/summary` para mostrar datos del servidor o combinar con datos locales.

---

## 4. Flujo de envío recomendado

### 4.1 Al sincronizar una venta (inmediato)

1. Obtener la transacción del Merkle tree por `saleId`.
2. Incluir en el payload:
   - `merkleTransactionId`
   - `merkleTransactionHash`
3. Si la venta ya está en un bloque generado:
   - `merkleProof`
   - `blockId`
   - `blockHash`
   - `merkleRoot`

### 4.2 Al generar un bloque (fin del día)

1. El usuario pulsa "Generar Bloque" en la app.
2. Se llama a `merkleTreeService.generateDailyBlock()`.
3. Enviar el bloque completo a `POST /api/mcp/:shopId/blocks`.
4. Enviar el resumen actualizado a `POST /api/mcp/:shopId/blocks/summary` (Block Summary + Luxae).

### 4.3 Al abrir la sección Sales / Reconciliación

1. Cargar datos locales: `getDailyBlocks()`, calcular totalBlocks, totalSalesInBlocks, totalLuxae.
2. Opcional: llamar `GET /api/mcp/:shopId/blocks/summary` para obtener datos del servidor.
3. Mostrar Block Summary y LUX generados en la UI.

---

## 5. Validación en el servidor (opcional)

Si el servidor quiere validar:

1. **Hash de transacción:** Recalcular SHA-256 de los datos de la venta con el mismo formato que el cliente y comparar con `merkleTransactionHash`.
2. **Merkle proof:** Reconstruir la raíz desde el hash de la transacción + `merkleProof` y comparar con `merkleRoot`.
3. **Cadena de bloques:** Verificar que `block.previousBlockHash === hash del bloque anterior`.

---

## 6. Schema sugerido para el servidor

### 6.1 Extensión del schema de venta (Zod)

```typescript
// Campos opcionales para Merkle
merkleTransactionId: z.string().optional(),
merkleTransactionHash: z.string().optional(),
merkleProof: z.array(z.string()).optional(),
blockId: z.string().nullable().optional(),
blockHash: z.string().nullable().optional(),
merkleRoot: z.string().nullable().optional(),
```

### 6.2 Modelo de bloque (MongoDB)

```typescript
const BlockSchema = new Schema({
  shopId: { type: Schema.Types.ObjectId, required: true },
  blockId: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  merkleRoot: { type: String, required: true },
  blockHash: { type: String, required: true },
  previousBlockHash: { type: String },
  transactionCount: { type: Number, required: true },
  unixTime: { type: Number },
  createdAt: { type: Date, default: Date.now },
  transactions: [{
    id: String,
    type: String,
    saleId: String,
    hash: String,
    merkleProof: [String],
    timestamp: String
  }]
});
```

### 6.3 Modelo de resumen de bloques (BlockSummary)

```typescript
const BlockSummarySchema = new Schema({
  shopId: { type: Schema.Types.ObjectId, required: true },
  totalBlocks: { type: Number, required: true, default: 0 },
  totalSalesInBlocks: { type: Number, required: true, default: 0 },
  totalLuxae: { type: Number, required: true, default: 0 },
  lastSyncedAt: { type: Date, default: Date.now },
  sourceDeviceId: { type: String },
  blocks: [{
    id: String,
    date: String,
    transactionCount: Number,
    luxaeEarned: Number
  }]
});
```

---

## 7. Resumen de cambios necesarios

| Componente | Cambio |
|------------|--------|
| **Cliente – mcpSalesService** | Usar `merkleTreeService.getMerkleDataForSale(saleId)` y añadir campos al payload |
| **Cliente – blockApiService** | Tras generar bloque, llamar POST /blocks y POST /blocks/summary |
| **Cliente – salesHistoryService** | Tras generar bloque, llamar a API de bloques |
| **Servidor – shop.ts** | Aceptar campos merkle opcionales en POST sales |
| **Servidor – shop.ts** | Crear POST /mcp/:shopId/blocks |
| **Servidor – shop.ts** | Crear POST /mcp/:shopId/blocks/summary (Block Summary + Luxae) |
| **Servidor – shop.ts** | Crear GET /mcp/:shopId/blocks/summary |
| **Servidor – modelo** | Crear modelo Block si se persisten bloques |
| **Servidor – modelo** | Crear modelo BlockSummary o similar para totalBlocks, totalLuxae por shop |

---

## 8. Helpers en el cliente (ya disponibles)

### 8.1 Merkle data por venta

`merkleTreeService.getMerkleDataForSale(saleId)` devuelve:

```typescript
{
  transactionId: string | null,
  transactionHash: string | null,
  merkleProof: string[],
  blockId: string | null,
  blockHash: string | null,
  merkleRoot: string | null,
}
```

Uso en `convertSaleToMCP` o antes de enviar:

```typescript
const merkleData = merkleTreeService.getMerkleDataForSale(String(sale.id));
if (merkleData.transactionId) {
  apiSale.merkleTransactionId = merkleData.transactionId;
  apiSale.merkleTransactionHash = merkleData.transactionHash;
  apiSale.merkleProof = merkleData.merkleProof;
  apiSale.blockId = merkleData.blockId;
  apiSale.blockHash = merkleData.blockHash;
  apiSale.merkleRoot = merkleData.merkleRoot;
}
```

### 8.2 Block Summary para POST /blocks/summary

El cliente puede construir el payload desde `getDailyBlocks()`:

```typescript
const blocks = await salesHistoryService.getDailyBlocks();
const LUX_PER_BLOCK = 50;

const summary = {
  totalBlocks: blocks.length,
  totalSalesInBlocks: blocks.reduce((sum, b) => sum + (b.transactionCount || 0), 0),
  totalLuxae: blocks.filter(b => (b.transactionCount || 0) > 0).length * LUX_PER_BLOCK,
  blocks: blocks.map(b => ({
    id: b.id,
    date: b.date,
    transactionCount: b.transactionCount || 0,
    luxaeEarned: (b.transactionCount || 0) > 0 ? LUX_PER_BLOCK : 0
  })),
  sourceDeviceId: await getOrCreateSourceDeviceId(),
  clientTimestampUnixMs: Date.now()
};
```
