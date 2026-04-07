# Merkle Tree Sales – Lógica Completa y Despliegue (Desktop / Online)

Documento de referencia para entender toda la lógica del Merkle Tree en la sección Sales y desplegarla en versión desktop y online.

---

## 1. Resumen ejecutivo

El **Merkle Tree Sales History System** proporciona:

- Historial inmutable de operaciones de venta (crear, editar, eliminar)
- Validación criptográfica con SHA-256 y árboles Merkle
- Bloques diarios que consolidan transacciones
- Recompensa de 50 LUX por bloque generado con ventas
- Sincronización con API (ventas con datos Merkle, bloques)

**Plataformas soportadas:** Mobile (iOS/Android), Web, Desktop (Electron/Tauri si se usa).

---

## 2. Arquitectura general

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUJO DE VENTAS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Carrito / Chat / POS]                                                     │
│         │                                                                   │
│         ▼                                                                   │
│  salesHistoryService.createSale(sale)                                        │
│         │                                                                   │
│         ├──► salesDatabase.saveSale()     [Fuente de verdad: ventas]        │
│         │                                                                   │
│         └──► merkleTreeService.recordSaleCreation(sale)                     │
│                    │                                                        │
│                    ├── createTransaction() → hash SHA-256                   │
│                    ├── transactions.push()                                 │
│                    ├── salesHistory.push()                                 │
│                    └── saveData() → AsyncStorage / localStorage             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      GENERACIÓN DE BLOQUE DIARIO                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Usuario pulsa "Generar Bloque" (o auto-generación)                         │
│         │                                                                   │
│         ▼                                                                   │
│  merkleTreeService.generateDailyBlock(date)                                  │
│         │                                                                   │
│         ├── Filtrar transacciones del día no bloqueadas                     │
│         ├── buildMerkleTree(transactions) → merkleRoot                      │
│         ├── generateMerkleProof(tx, root) → merkleProof por tx               │
│         ├── Crear DailyBlock (merkleRoot, blockHash, previousBlockHash)     │
│         │                                                                   │
│         └── saveData() → AsyncStorage / localStorage                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes y responsabilidades

### 3.1 merkleTreeService (`src/services/merkleTreeService.ts`)

| Método | Descripción |
|--------|-------------|
| `recordSaleCreation(sale)` | Registra venta nueva → transacción con hash |
| `recordSaleUpdate(saleId, updatedSale, previousSale)` | Registra edición |
| `recordSaleDeletion(saleId, deletedSale)` | Registra eliminación |
| `generateDailyBlock(date?)` | Genera bloque diario con Merkle root y proofs |
| `getMerkleDataForSale(saleId)` | Devuelve datos Merkle para sync con API |
| `getDailyBlocks()` | Lista de bloques generados |
| `verifyTransaction(transactionId)` | Verifica una transacción contra su bloque |
| `verifyChainIntegrity()` | Verifica toda la cadena de bloques |

**Almacenamiento:** AsyncStorage (usa `localStorage` en web).

### 3.2 salesHistoryService (`src/services/salesHistoryService.ts`)

| Método | Descripción |
|--------|-------------|
| `createSale(sale)` | Guarda venta + llama `merkleTreeService.recordSaleCreation()` |
| `updateSale(saleId, updatedSale)` | Actualiza + `recordSaleUpdate()` |
| `deleteSale(saleId)` | Elimina + `recordSaleDeletion()` |
| `generateDailyBlock(date?)` | Delega a `merkleTreeService.generateDailyBlock()` |
| `getDailyBlocks()` | Delega a `merkleTreeService.getDailyBlocks()` |
| `getActiveSales()` | Combina salesDatabase + cache |

### 3.3 blockApiService (`src/services/blockApiService.ts`)

| Función | Descripción |
|---------|-------------|
| `sendBlockToServer(block)` | POST /api/mcp/:shopId/blocks |
| `syncUnsentBlocksToServer()` | Envía bloques no enviados al abrir Sales |

### 3.4 mcpSalesService (`src/services/mcpSalesService.ts`)

| Función | Descripción |
|---------|-------------|
| `convertSaleToMCP(sale)` | Añade `merkleTransactionId`, `merkleTransactionHash`, `merkleProof`, `blockId`, `blockHash`, `merkleRoot` al payload de venta |

---

## 4. Lógica del árbol Merkle

### 4.1 Transacción (SalesTransaction)

```typescript
interface SalesTransaction {
  id: string;           // TXN-{timestamp}-{random}
  type: 'create' | 'update' | 'delete';
  saleId: string;
  saleData?: Sale;
  previousData?: Sale;  // Para update/delete: datos anteriores
  timestamp: string;   // ISO 8601
  hash: string;       // SHA-256
  merkleProof?: string[];  // Vacío hasta generar bloque
}
```

**Hash:** SHA-256 de `JSON.stringify({ id, type, saleId, timestamp, saleData, previousData })` (sanitizado).

**Campos sanitizados:** `id`, `items`, `subtotal`, `tax`, `total`, `paymentType`, `paymentStatus`, `transactionId`, `date`, `createdAt`, `platform`, `cashierName`, `notes`, `customerName`, etc.

### 4.2 Construcción del árbol Merkle

1. Cada transacción es una hoja (su hash).
2. Se combinan pares: `hash(left.hash + right.hash)`.
3. Si hay número impar de nodos, el último se duplica.
4. Se repite hasta obtener un solo nodo raíz → **merkleRoot**.

### 4.3 Merkle Proof

Para cada transacción se genera una **prueba Merkle**: secuencia de hashes hermanos necesaria para reconstruir la raíz desde el hash de la transacción.

**Verificación:** `hash(txHash + proof[0] + proof[1] + ...) === merkleRoot`

### 4.4 Bloque diario (DailyBlock)

```typescript
interface DailyBlock {
  id: string;              // BLOCK-{YYYY-MM-DD}-{timestamp}
  date: string;            // YYYY-MM-DD
  merkleRoot: string;
  transactions: SalesTransaction[];
  previousBlockHash?: string;
  blockHash: string;
  createdAt: string;
  transactionCount: number;
  unixTime?: number;
}
```

**blockHash:** SHA-256 de `JSON.stringify(blockData) + unixTime.toString()`.

---

## 5. Almacenamiento

### 5.1 Claves AsyncStorage / localStorage

| Clave | Contenido |
|-------|-----------|
| `@BizneAI_merkle_tree` | Lista de transacciones (SalesTransaction[]) |
| `@BizneAI_daily_blocks` | Lista de bloques diarios (DailyBlock[]) |
| `@BizneAI_sales_history` | Historial de ventas (SalesHistoryEntry[]) |
| `@BizneAI_lastBlockGeneration` | Timestamp última generación (cooldown 1h) |
| `@BizneAI_blocks_sent_to_server` | IDs de bloques ya enviados al servidor |

### 5.2 Compatibilidad web / desktop

- **AsyncStorage** en React Native usa `localStorage` bajo el capa en web.
- Las mismas claves se usan en mobile y web.
- **Desktop (Electron/Tauri):** Si se usa React Native para desktop, AsyncStorage funciona igual. Si se usa web embebido, se usa localStorage.

---

## 6. Flujo completo por operación

### 6.1 Crear venta

```
1. Usuario completa pago (carrito, chat, POS)
2. salesHistoryService.createSale(sale)
   a. salesDatabase.saveSale(sale)  → venta guardada
   b. merkleTreeService.recordSaleCreation(sale)
      - createTransaction('create', saleId, sale)
      - hash = SHA256(JSON.stringify(transactionData))
      - transactions.push(transaction)
      - salesHistory.push(historyEntry)
      - saveData()
   c. salesHistoryService cache actualizado
3. Emit CRUD event (non-blocking)
```

### 6.2 Editar / eliminar venta

- Similar: `recordSaleUpdate(saleId, updatedSale, previousSale)` o `recordSaleDeletion(saleId, deletedSale)`.

### 6.3 Generar bloque

```
1. Usuario pulsa "Generar Bloque" (o auto-generación)
2. Verificación humana (modal anti-abuso)
3. Cooldown 1h (verificar @BizneAI_lastBlockGeneration)
4. Transacciones del día sin bloquear
5. merkleTreeService.generateDailyBlock(date)
   - Filtrar transacciones del día no bloqueadas
   - buildMerkleTree(transactions) → merkleRoot
   - generateMerkleProof(tx, root) para cada tx
   - Crear DailyBlock con merkleRoot, blockHash, previousBlockHash
   - dailyBlocks.push(block)
   - saveData()
6. Modal 50 LUX si transactionCount > 0
7. syncUnsentBlocksToServer() (opcional, al abrir Sales)
```

### 6.4 Sincronizar venta con API

```
1. mcpSalesService.convertSaleToMCP(sale)
2. merkleData = merkleTreeService.getMerkleDataForSale(saleId)
3. Si merkleData.transactionId existe:
   - apiSale.merkleTransactionId = merkleData.transactionId
   - apiSale.merkleTransactionHash = merkleData.transactionHash
   - apiSale.merkleProof = merkleData.merkleProof
   - apiSale.blockId = merkleData.blockId
   - apiSale.blockHash = merkleData.blockHash
   - apiSale.merkleRoot = merkleData.merkleRoot
4. POST /api/mcp/:shopId/sales con payload completo
```

---

## 7. Despliegue Desktop

### 7.1 Requisitos

- **Expo / React Native para Desktop:** La lógica es idéntica. AsyncStorage usa el backend nativo del entorno.
- **Electron + Web:** Si la app desktop es una web app embebida, AsyncStorage usa `localStorage` del navegador.

### 7.2 Verificaciones

1. **expo-crypto:** Disponible en web (Web Crypto API). Compatible con desktop.
2. **AsyncStorage:** En web usa `localStorage`. Mismas claves.
3. **makeApiRequest:** Debe apuntar a la API correcta (producción o staging).

### 7.3 Pasos de despliegue

1. Asegurar que `salesHistoryService` se use en todos los puntos de creación/edición/eliminación de ventas.
2. En la UI de Sales (Historial), mostrar botón "Generar Bloque" y modal de reconciliación.
3. En la inicialización de Sales, llamar `syncUnsentBlocksToServer()`.
4. Configurar `API_BASE_URL` para el entorno desktop.

---

## 8. Despliegue Online (Web)

### 8.1 Consideraciones

- **localStorage:** Persistente por origen. Si el usuario limpia datos del navegador, se pierde.
- **Sincronización:** Importante enviar ventas y bloques al servidor para no perder datos.
- **expo-crypto:** En web usa `crypto.subtle` o polyfill. Expo lo maneja.

### 8.2 Multi-dispositivo

- El Merkle tree es **local por dispositivo**. Cada navegador/dispositivo tiene su propio árbol.
- Las ventas se sincronizan al servidor con datos Merkle si el bloque ya fue generado en ese dispositivo.
- Los bloques se envían con `syncUnsentBlocksToServer()` al abrir Sales.
- Si el usuario usa varios dispositivos (mobile + web), cada uno genera sus propios bloques. El servidor puede consolidar por shopId.

### 8.3 Pasos de despliegue web

1. Verificar que la build web incluya `merkleTreeService`, `salesHistoryService`, `blockApiService`.
2. Asegurar que `salesHistoryService.createSale()` se use en el flujo de checkout web.
3. Mostrar la sección Historial con bloques y Merkle proofs.
4. Llamar `syncUnsentBlocksToServer()` al cargar Sales.
5. Configurar CORS y API_BASE_URL para el dominio web.

---

## 9. Resumen de archivos

| Archivo | Rol |
|---------|-----|
| `src/services/merkleTreeService.ts` | Árbol Merkle, hashes, bloques, verificación |
| `src/services/salesHistoryService.ts` | Orquestación, createSale/updateSale/deleteSale, generateDailyBlock |
| `src/services/blockApiService.ts` | Envío de bloques a POST /api/mcp/:shopId/blocks |
| `src/services/mcpSalesService.ts` | Añade datos Merkle al payload de ventas |
| `src/services/salesDatabase.ts` | Fuente de verdad de ventas |

---

## 10. API endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/mcp/:shopId/sales` | POST | Envía venta con campos merkle opcionales |
| `/api/mcp/:shopId/blocks` | POST | Envía bloque diario |

---

## 11. Referencias

- `docs/MERKLE_TREE_API_SPEC.md` – Especificación de la API
- `docs/SALES_HASH_CHAIN.md` – Cadena de hash y recompensa LUX
- `docs/SALES_SYSTEM.md` – Sistema de ventas general
