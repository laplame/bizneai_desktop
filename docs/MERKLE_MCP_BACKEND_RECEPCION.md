# Recepción de bloques Merkle y datos Merkle en ventas (MCP)

Este documento resume **cómo el backend recibe** la información de bloques diarios, resúmenes y campos Merkle asociados a ventas, para alinear apps web/POS con `server/src/routes/mcp.ts` (código del API BizneAI, fuera de este monorepo salvo proxy local).

**Implementación en el POS (este repo):** `src/services/blockApiService.ts`, `src/services/merkleTreeService.ts`, `src/services/merkleSyncService.ts`.  
**Sincronización y ledger dev:** [`MERKLE_SYNC_POS_API.md`](./MERKLE_SYNC_POS_API.md).  
**Payload y flujos extendidos en el cliente:** [`MERKLE_TREE_API_SPEC.md`](./MERKLE_TREE_API_SPEC.md).

---

## 1. `POST /api/mcp/:shopId/blocks` — Bloque diario (árbol Merkle)

- **URL:** `shopId` = ObjectId MongoDB de **24 caracteres**.
- **Body:** JSON con la forma que genera el cliente (p. ej. `src/services/blockApiService.ts` → `sendBlockToServer`).

### Campos que valida el servidor (Zod)

| Campo | Tipo | Notas |
|--------|------|--------|
| `id` | string | ID del bloque (ej. `BLOCK-2026-03-05-…`). |
| `date` | string | Fecha `YYYY-MM-DD`. |
| `merkleRoot` | string | Raíz Merkle (hex). |
| `blockHash` | string | Hash del bloque. |
| `transactionCount` | number **o string numérico** | Se coerciona a entero ≥ 0. |
| `previousBlockHash` | string, `null` u omitido | Cadena o ausencia. |
| `unixTime` | number, string numérico u omitido | Opcional. |
| `createdAt` | string | Opcional (no se persiste en el modelo `Block` si no está en el schema; se ignora tras validar el resto). |
| `transactions` | array opcional | Cada ítem: `id`, `type`, `saleId`, `hash` (strings); `merkleProof` array de strings, `null` u omitido → se guarda `[]`; `timestamp` opcional. |

### Idempotencia

- Si ya existe un documento con el mismo **`shopId` + `blockId`** (`id` del body), responde **200** con `stored: false` y mensaje de bloque ya almacenado.

### Referencia extendida y ejemplo JSON

En el repositorio del API, si existe el archivo `API_MCP_BLOCKS_POST.md`, enlázalo desde allí. En este monorepo, el ejemplo de body alineado está en [`MERKLE_TREE_API_SPEC.md`](./MERKLE_TREE_API_SPEC.md) (sección bloques diarios).

---

## 2. `POST /api/mcp/:shopId/blocks/summary` — Resumen + LUX

Body con `totalBlocks`, `totalSalesInBlocks`, `totalLuxae` (enteros o **strings numéricos**), `blocks[]` con `id`, `date`, `transactionCount`, `luxaeEarned`, y opcionales `sourceDeviceId`, `clientTimestampUnixMs`.

Detalle de campos y respuesta esperada: [`MERKLE_TREE_API_SPEC.md`](./MERKLE_TREE_API_SPEC.md) (sección «Resumen de bloques y Luxae»).

---

## 3. `GET /api/mcp/:shopId/blocks/summary`

Devuelve totales y lista de bloques desde `BlockSummary` o, si no hay resumen, **calcula** desde la colección `Block`.

El POS puede usar esta respuesta para **reconciliar conteos** (y `id` de punta si viene en `blocks[]`) con los bloques locales; si el resumen no incluye `merkleRoot` / `blockHash` por bloque, la reconciliación criptográfica completa sigue dependiendo del ledger local de dev o de ampliar el DTO del summary en el API.

---

## 4. `POST /api/mcp/:shopId/sales` — Campos Merkle opcionales

El esquema `MCPSaleSchema` (`server/src/models/MCPShop.ts` en el API) acepta opcionalmente:

| Campo | Descripción |
|--------|-------------|
| `merkleTransactionId` | ID lógico de la transacción en el árbol. |
| `merkleTransactionHash` | Hash de la transacción. |
| `merkleProof` | Array de strings (puede ser **vacío** `[]`; se persiste si viene en el body). |
| `blockId` | Bloque al que pertenece la venta. |
| `blockHash` | Hash del bloque. |
| `merkleRoot` | Raíz Merkle asociada. |

Si el cliente envía `merkleProof: []`, el servidor **guarda** el array vacío (no lo descarta por falsy).

---

## 5. Flujo en el frontend (este monorepo)

| Pieza | Archivo / componente |
|--------|----------------------|
| Construcción local del árbol y bloques | `src/services/merkleTreeService.ts` |
| Envío al servidor | `src/services/blockApiService.ts` (`POST …/blocks`, sincronización de no enviados) |
| Pull de cabecera / resumen MCP | `src/services/merkleSyncService.ts` (`GET …/blocks/summary` vía `buildMcpResourceUrl`) |
| Widget POS | `src/components/MerkleBlocksWidget.tsx` |
| Panel / dashboard (referencia app web) | `src/pages/ShopDashboardPage.tsx` (`MerklePosPanel`, fetch a `GET …/blocks/summary`) — ruta típica en la app Next/React del API, no necesariamente en este repo |

---

## 6. `shopId` en el POS

El cliente debe enviar el mismo **ObjectId de 24 caracteres** que usa la tienda en MCP. Si en desarrollo se usa un `shopId` distinto, el servidor puede rechazar la ruta o no persistir; el ledger local de dev (`/api/merkle-ledger/…` en Express del monorepo) acepta cualquier string de carpeta solo para pruebas offline.
