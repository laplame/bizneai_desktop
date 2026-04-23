# Sincronización Merkle: POS ↔ API (monorepo + contrato MCP)

Este documento enlaza la **implementación en `bizneai_desktop`** con el contrato de recepción del backend MCP descrito en **[`MERKLE_MCP_BACKEND_RECEPCION.md`](./MERKLE_MCP_BACKEND_RECEPCION.md)** (`mcp.ts` en el API BizneAI).

Otros documentos:

- [`MERKLE_TREE_API_SPEC.md`](./MERKLE_TREE_API_SPEC.md) — payloads de ejemplo, ventas con campos Merkle opcionales, `blocks/summary`.

---

## 1. Modelo conceptual (sin P2P)

| Capa | Rol |
|------|-----|
| **POS (localStorage)** | Transacciones (`@BizneAI_merkle_tree`), bloques (`@BizneAI_daily_blocks`), envío pendiente (`@BizneAI_blocks_sent_to_server`). |
| **Push** | `POST /api/mcp/:shopId/blocks` — cuerpo según Zod en recepción MCP; idempotencia `shopId` + `id` → **200** `stored: false` si ya existe. |
| **Resumen** | `POST/GET /api/mcp/:shopId/blocks/summary` — totales LUX + lista de bloques (ids, fechas, conteos). |
| **Ventas** | `POST /api/mcp/:shopId/sales` con campos Merkle opcionales (`merkleTransactionId`, `merkleTransactionHash`, `merkleProof`, `blockId`, …). |
| **Ledger local (solo dev en este repo)** | `server/data/merkle-ledger/{shopId}.json` + `GET /api/merkle-ledger/...` para pruebas offline y reconciliación con **raíz/hash** cuando el summary MCP no los trae por bloque. |

**`shopId`:** en MCP debe ser ObjectId **24 caracteres** hex. El ledger de desarrollo acepta cualquier string de ruta; en producción el POS debe usar el mismo id que la tienda.

---

## 2. Implementación en este monorepo

### 2.1 Servidor Express (`server/`)

| Ruta | Uso |
|------|-----|
| `POST /api/proxy/blocks/:shopId` | Reenvía a `https://www.bizneai.com/api/mcp/:shopId/blocks` y **duplica** el body en el ledger local (`appendMerkleLedgerBlock`). |
| `GET /api/merkle-ledger/:shopId/head` | Cabecera desde disco (hashes completos tras un POST por el proxy). |
| `GET /api/merkle-ledger/:shopId/blocks?after=` | Auditoría local. |

Archivos: `server/src/services/merkleLedgerStore.ts`, `server/src/routes/merkleLedgerRoutes.ts`, `server/src/routes/mcpProxyRoutes.ts`, `server/src/bootstrap.ts`.

### 2.2 Cliente

| Módulo | Uso |
|--------|-----|
| `src/services/blockApiService.ts` | Push: `sendBlockToServer` → `POST …/blocks` (mismo shape que valida el servidor). |
| `src/services/merkleSyncService.ts` | `fetchRemoteMerkleHead`: primero ledger local (si proxy), si no hay datos → **`GET …/blocks/summary`** (`buildMcpResourceUrl`). `reconcileMerkleHead` + `runFullMerkleSync`. |
| `src/components/MerkleBlocksWidget.tsx` | Ejecuta `runFullMerkleSync` (push + reconciliación). |

**Reconciliación:** si el summary incluye `merkleRoot`/`blockHash` en cada ítem de `blocks[]`, se comparan; si no, basta **mismo último `id` y mismo `totalBlocks`** que bloques locales para estado `ok` (mensaje indica summary sin hashes).

---

## 3. Qué debe cumplir el API (referencia única)

No duplicar aquí la tabla Zod: está en **[`MERKLE_MCP_BACKEND_RECEPCION.md`](./MERKLE_MCP_BACKEND_RECEPCION.md)**.

Resumen:

1. **`POST …/blocks`** — validación e idempotencia descritas allí.  
2. **`POST …/blocks/summary`** y **`GET …/blocks/summary`** — resumen + LUX.  
3. **`POST …/sales`** — campos Merkle opcionales; `merkleProof: []` se persiste.

Extensiones opcionales futuras (no requeridas por el doc de recepción): `GET …/merkle/blocks?after=` solo para auditoría profunda si el producto las añade.

---

## 4. Proxy CORS (`mcpProxyRoutes`)

Ya existe proxy GET para `blocks/summary` en la lista `MCP_GET_SUBPATHS` → `GET /api/proxy/mcp/:shopId/blocks/summary`.

---

## 5. Prueba manual (dev)

1. `npm run dev` (Vite + Express :3000).  
2. Shop ID **24 hex** si se prueba contra BizneAI real; para solo ledger local puede usarse otro string.  
3. Generar bloque en el POS y **Sincronizar** en el widget Merkle.  
4. Comprobar `server/data/merkle-ledger/<shopId>.json` y/o `curl` al ledger `head`.  
5. Con shopId válido: `GET /api/proxy/mcp/<shopId>/blocks/summary` debe alimentar la reconciliación cuando el ledger aún está vacío.

---

## 6. Archivos relevantes

- `docs/MERKLE_MCP_BACKEND_RECEPCION.md`  
- `docs/MERKLE_TREE_API_SPEC.md`  
- `src/services/blockApiService.ts`  
- `src/services/merkleSyncService.ts`  
- `src/utils/mcpResourceUrl.ts`  
- `server/src/services/merkleLedgerStore.ts`  
- `server/src/routes/mcpProxyRoutes.ts`
