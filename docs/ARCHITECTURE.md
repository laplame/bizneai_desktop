# BizneAI Desktop — Architecture & Data Flow

> **Read this first if you are about to touch persistence, sync, or a `/api/*` route.**
> The one thing that trips people up: the REST routes that *look* like a backend
> (`/api/products`, `/api/orders`, `/api/tickets`, …) are **mock/legacy stubs**, not
> the source of truth. The real data lives in the browser's `localStorage`, mirrored
> to local SQLite. This document explains which is which.

---

## 1. Process topology

The desktop app is three cooperating processes:

```
┌─────────────────────────────────────────────────────────────┐
│ Electron main process  (electron/main.js)                    │
│  • creates the BrowserWindow (renderer)                      │
│  • spawns the embedded API as a CHILD node process           │
│  • IPC: printing, DB-console window, ticket-logo, CSV backup │
└───────────────┬───────────────────────────┬─────────────────┘
                │ loads                       │ spawns
                ▼                             ▼
┌────────────────────────────┐   ┌───────────────────────────────┐
│ Renderer (React + Vite)    │   │ Embedded API (Express + SQLite)│
│  src/**                    │   │  server/src/** → :3000         │
│  • localStorage = truth    │◀─▶│  • posKv / activity / merkle   │
│  • calls :3000 and cloud   │   │  • better-sqlite3 (native)     │
└────────────────────────────┘   └───────────────────────────────┘
```

`better-sqlite3` is a native module that must match the **child node**'s ABI, which
is why the API runs as a separate process (bundled `embedded-node`), not inside
Electron. See `ensureEmbeddedBackend()` in [electron/main.js](../electron/main.js).

The same Express bundle also ships standalone (see [standalone-local-api/](../standalone-local-api/))
for running the local API without Electron.

---

## 2. Where data actually lives (the real path)

**`localStorage` in the renderer is the source of truth.** Keys are prefixed
`bizneai-*` (e.g. `bizneai-products`, `bizneai-customers-registry`, `bizneai-waitlist`,
`bizneai-store-config`). Selected keys are mirrored to SQLite for durability and
fast local queries.

| Concern | Client entry point | Server route | SQLite file |
|---|---|---|---|
| Key/value mirror of `localStorage` | [posPersistService.ts](../src/services/posPersistService.ts) (`KEYS_TO_MIRROR`) | `PUT/GET /api/pos/kv` → [posKvRoutes.ts](../server/src/routes/posKvRoutes.ts) | `pos-local-store.sqlite` |
| Catalog & stock (remote master) | [shopIdHelper.ts](../src/utils/shopIdHelper.ts) (`getProductsFromMcp`, …) | `/api/proxy/*` → [mcpProxyRoutes.ts](../server/src/routes/mcpProxyRoutes.ts) | (proxied to remote MCP) |
| MCP snapshots → relational cache | [mcpSnapshotMirror.ts](../src/services/mcpSnapshotMirror.ts) | `/api/pos/*` | `pos-local-store.sqlite` |
| Sales ledger integrity (Merkle) | [merkleTreeService.ts](../src/services/merkleTreeService.ts), [merkleSyncService.ts](../src/services/merkleSyncService.ts) | `/api/merkle-ledger/*` → [merkleLedgerRoutes.ts](../server/src/routes/merkleLedgerRoutes.ts) | local activity / ledger DB |
| Local activity log (audit) | [localActivityLog.ts](../src/services/localActivityLog.ts) | `/api/local-activity/*` | `local-activity.db` |
| Product images on disk | [productImageLocalCache.ts](../src/services/productImageLocalCache.ts) | `/api/pos/product-image/*` → [posProductImageRoutes.ts](../server/src/routes/posProductImageRoutes.ts) | files under `userData/` |
| Read-only SQL console | [DbConsole.tsx](../src/components/DbConsole.tsx) | `/api/local-db/console/*` → [localDbConsoleRoutes.ts](../server/src/routes/localDbConsoleRoutes.ts) | all of the above |

Legacy `bizneai.db` (schema in [server/src/legacyDb.ts](../server/src/legacyDb.ts)) is only used
by the SQL console / metadata. It is **not** the primary store.

### Typical write (a sale)
```
Cart checkout (App.tsx)
  → write bizneai-* keys in localStorage        (immediate source of truth)
  → recordSaleCreation() appends to Merkle tree  (merkleTreeService)
  → scheduleMirrorKeyToSqlite() debounces a       (posPersistService)
     PUT /api/pos/kv  → SQLite mirror
  → recordSaleCashier() → /api/local-activity     (audit trail)
  → (online) pendingSalesSync flushes to cloud/MCP
```

---

## 3. The mock / legacy REST routes (NOT the source of truth)

These routers were inherited when the desktop app was forked from the BizneAI
**cloud** API. Each keeps a module-level array that **resets on every restart**.
They are still mounted (a browser hitting them gets a plausible-looking response),
but the desktop app does **not** rely on them for persistence.

Mounted but mock — each file carries a `⚠️ MOCK / LEGACY ROUTE` banner:

| Route | File | Backing store |
|---|---|---|
| `/api/products` | [productRoutes.ts](../server/src/routes/productRoutes.ts) | `let products = [...]` (in-memory) |
| `/api/orders` | [orderRoutes.ts](../server/src/routes/orderRoutes.ts) | `let orders = []` |
| `/api/tickets` | [ticketRoutes.ts](../server/src/routes/ticketRoutes.ts) | `let tickets = []` |
| `/api/kitchen` | [kitchenRoutes.ts](../server/src/routes/kitchenRoutes.ts) | `let kitchenOrders = [...]` |
| `/api/waitlist` | [waitlistRoutes.ts](../server/src/routes/waitlistRoutes.ts) | `let waitlistEntries = []` |
| `/api/shop` | [shopRoutes.ts](../server/src/routes/shopRoutes.ts) | `let shops = [...]` |
| `/api/inventory` | [inventoryRoutes.ts](../server/src/routes/inventoryRoutes.ts) | `let inventoryUpdates = []` |
| `/api/payments` | [paymentRoutes.ts](../server/src/routes/paymentRoutes.ts) | `let payments = []` |
| `/api/chat` | [chatRoutes.ts](../server/src/routes/chatRoutes.ts) | `let chatMessages = []` |

`/api/upload` ([uploadRoutes.ts](../server/src/routes/uploadRoutes.ts)) is a partial
exception: it writes real files to disk via multer, but its Cloudinary integration
is a `MockCloudinaryService` stub.

**Client side:** the matching client modules ([src/api/products.ts](../src/api/products.ts),
`orders.ts`, `tickets.ts`, `inventory.ts`, `shops.ts`, `payments.ts`) resolve their base
URL from `getApiBaseUrl()` ([src/api/client.ts](../src/api/client.ts)), which defaults to the
**cloud** (`https://www.bizneai.com/api`) — not the local mock. Most of these modules
have no importers today; `products.ts` helpers (`checkSimilarProducts`,
`getProductCategories`, `getMainCategories`) are reached via the `src/api/index.ts`
barrel from [ProductUpload.tsx](../src/components/ProductUpload.tsx) and hit the cloud.

### If you are adding a feature
- **Need durable local data?** Add a `bizneai-*` key, add it to `KEYS_TO_MIRROR`, and
  read/write via `localStorage` + `posPersistService`. Do **not** extend a mock route.
- **Need remote catalog/stock?** Go through the MCP proxy (`/api/proxy`, `shopIdHelper`).
- **Deleting a mock route?** Safe candidates are the in-memory routers above, but confirm
  no fallback calls them first (see the client barrel usage note). Tracked as audit item
  A1 in [CODE_QUALITY_AUDIT.md](CODE_QUALITY_AUDIT.md).

---

## 4. Module boundaries

- `src/**` — renderer only. Must **not** import native Node modules (`better-sqlite3`,
  `fs`, `path` for disk I/O). Server-only DB code lives in `server/src/`
  (e.g. `legacyDb.ts`, moved out of `src/` in the boundary cleanup).
- `server/src/**` — the embedded API. Owns all SQLite access.
- `electron/**` — main process: windows, IPC, printing, spawning the API child.

---

## 5. Related docs
- [DATABASE_SYSTEM.md](../DATABASE_SYSTEM.md) — SQLite files and schema details
- [CODE_QUALITY_AUDIT.md](CODE_QUALITY_AUDIT.md) — findings this document addresses (A1, A2)
- [SETUP_FLOW.md](../SETUP_FLOW.md) — first-run configuration
