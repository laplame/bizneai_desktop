# BizneAI Desktop — Code Quality & Architecture Audit

**Date:** 2026-07-10
**Scope:** Code quality & architecture (not security or dependencies)

> **Implementation status (updated 2026-07-10):** First remediation pass landed.
> ✅ Vitest added — 30 tests across tax math, Merkle ledger, sale mapping (rec. #1).
> ✅ Dead code removed: `databaseRoutes.ts`, `useDatabase` hook, `api/examples.ts`,
>    stray `Untitled`/`debug.html`; `.gitignore` now covers SQLite WAL/SHM (rec. #3).
> ✅ Boundary A2 fixed: `src/database/database.ts` → [server/src/legacyDb.ts](../server/src/legacyDb.ts) (rec. #5).
> ✅ A1 dual data model **documented + labeled** (not deleted): every mock route now
>    carries a banner, mount site is grouped in `bootstrap.ts`, and the real flow is
>    written up in [ARCHITECTURE.md](ARCHITECTURE.md) (rec. #2, conservative path).
> ✅ C2 type dedup (#4): canonical `PosProduct` / `CartItem` / `CustomerInfo` / `ManagedProduct`
>    in [src/types/domain.ts](../src/types/domain.ts); inline copies removed from App, Cart,
>    ProductManagement, InventoryManagement, VirtualTicket. (API DTO in `types/api.ts` and the
>    SQLite row in `legacyDb.ts` intentionally stay separate — different layers.)
> 🟡 C1 `App.tsx` decomposition (#6): **two slices done** — (a) product hydration →
>    [src/utils/posCatalog.ts](../src/utils/posCatalog.ts); (b) cart logic → pure
>    [src/utils/cartOperations.ts](../src/utils/cartOperations.ts) (13 characterization tests)
>    behind a [useCart](../src/hooks/useCart.ts) hook. App.tsx **2,969 → 2,552** lines.
>    Verified live via `electron:dev` (app boots, cart persistence paths run clean).
>    Remaining: extract checkout/sync/screen-lock concerns similarly.
> ⏳ Still open: rest of #6, `electron/main.js` split (#7), logging (#4/C4).

**Codebase:** ~38K LOC — `src` (107 files, 31K), `server` (30 files, 6K), `electron` (3 files, 800), `standalone-local-api`, `scripts`
**Version audited:** 1.0.28

---

## 1. Executive Summary

The app works and ships, but it carries significant **architectural debt** from being forked off a cloud product. The two biggest structural problems are: (1) a **god-component `App.tsx` at 2,969 lines** holding the core POS logic, and (2) **two parallel, competing data models** — a real SQLite/KV persistence path and a set of leftover in-memory "mock" REST routes that never persist. On top of that there is **no automated test coverage at all**, which makes any refactor of the above high-risk.

None of this is a fire — the product runs. But the trajectory is unsustainable: the largest files keep absorbing new features, and there is no safety net to change them.

### Scorecard

| Area | Grade | Note |
|---|---|---|
| Module boundaries | 🔴 Poor | `server/` imports from `src/` renderer code; dual data models |
| Component structure | 🔴 Poor | 6 components > 1,000 lines; `App.tsx` at ~3,000 |
| Type safety | 🟡 Fair | `strict` on, but 4+ duplicate `Product` definitions, 53 `: any`, 14 `as any` |
| Server code | 🟡 Fair | Clean Express setup + Zod, but ~10 routes are non-persisting mocks |
| Electron layer | 🟢 Good | `contextIsolation` on, `nodeIntegration` off, narrow preload surface |
| Error handling | 🟡 Fair | Consistent try/catch, but 227 `console.*` and swallowed errors |
| Testing | 🔴 None | Zero test files in the repo |
| Repo hygiene | 🟡 Fair | Tracked SQLite WAL/SHM files, stray `Untitled`/`debug.html` |

---

## 2. Architecture Findings

### A1 — 🔴 Two competing data models (the central issue)
The codebase has **two unrelated persistence stories** and it is not obvious which is authoritative:

- **Real path:** client `localStorage` is the source of truth (213 direct `localStorage.*` calls across 35 files), mirrored into SQLite through `/api/pos/kv` — see [posPersistService.ts](src/services/posPersistService.ts) (`KEYS_TO_MIRROR`) and [posKvRoutes.ts](server/src/routes/posKvRoutes.ts). MCP snapshots, local activity, and the Merkle ledger are also real SQLite tables.
- **Mock path:** ~10 REST route files keep in-memory arrays that reset on restart — e.g. [productRoutes.ts:75](server/src/routes/productRoutes.ts) (`let products = [...]`), plus `orderRoutes`, `ticketRoutes`, `kitchenRoutes`, `waitlistRoutes`, `shopRoutes`, `inventoryRoutes`, `paymentRoutes`, `chatRoutes`, `uploadRoutes` all contain "Mock data for development" arrays.

**Impact:** A new contributor reading `GET /api/products` reasonably assumes it's the product store — it isn't. This is the single most confusing thing in the repo.
**Recommendation:** Decide per-resource whether the REST route is (a) a real endpoint, (b) a proxy to the cloud API, or (c) dead. Delete or clearly quarantine the mock arrays (e.g. move to `routes/__mocks__/` or guard behind an explicit `MOCK=1`). Document the real data flow (localStorage → posKv → SQLite) in `DATABASE_SYSTEM.md`.

### A2 — 🔴 Layer boundary violation: `server/` imports from `src/`
[posKvRoutes.ts](server/src/routes/posKvRoutes.ts) does `import { getDatabase } from '../../../src/database/database.js'`. Server (Node) code reaches across into the renderer source tree. This couples two build targets that have separate tsconfigs and lifecycles, and it's why `src/database/database.ts` (which loads native `better-sqlite3`) exists in `src/` at all.
**Recommendation:** Move the shared SQLite/`better-sqlite3` access into `server/src/` (or a small shared package) and have the server own it. `src/` should never import native Node modules.

### A3 — 🟡 Overlapping sync/ledger services
Eight services cover sync/mirror/ledger with unclear division of labor: `merkleTreeService`, `merkleSyncService`, `merkleLuxaeService`, `mcpBatchSync`, `mcpSnapshotMirror`, `customerMcpSync`, `pendingSalesSync`, `fullBackupSyncService` (see [src/services/](src/services/)). There is real risk of duplicated logic and competing write paths.
**Recommendation:** Draw one diagram of what each service owns and when it fires. Collapse any that overlap; give the survivors a single documented entry point.

### A4 — 🟡 `electron/main.js` mixes 5 responsibilities
[main.js](electron/main.js) (767 lines) handles window lifecycle, thermal-printer resolution, receipt HTML building, all IPC handlers, and the embedded-backend child process in one file. The renderer `console.error` override via `executeJavaScript` ([main.js:177](electron/main.js:177)) is a hack to suppress DevTools noise.
**Recommendation:** Split into `windows.js`, `printing.js`, `ipc.js`, `backend.js`. Drop the injected console override in favor of the existing `console-message` filter.

---

## 3. Code Quality Findings

### C1 — 🔴 God components
| File | Lines |
|---|---|
| [App.tsx](src/App.tsx) | 2,969 |
| [Settings.tsx](src/components/Settings.tsx) | 2,579 |
| [SalesReports.tsx](src/components/SalesReports.tsx) | 1,523 |
| [InventoryManagement.tsx](src/components/InventoryManagement.tsx) | 1,385 |
| [ProductManagement.tsx](src/components/ProductManagement.tsx) | 1,245 |
| [CustomerManagement.tsx](src/components/CustomerManagement.tsx) | 1,151 |

`App.tsx` alone holds **36 `useState`, 20 `useEffect`, and 228 inline functions**. It imports ~40 modules and defines domain types inline. This is the hardest file in the repo to change safely.
**Recommendation:** Extract cart, sale/checkout, sync-orchestration, and screen-lock concerns into hooks (`useCart`, `useCheckout`, `useCatalogSync`) and/or a reducer. Target: no component over ~400 lines. Do this *after* adding characterization tests (see T1).

### C2 — 🟡 Duplicated domain types
`interface Product` is defined **at least 5 times** with differing shapes: [App.tsx:116](src/App.tsx), [database.ts:17](src/database/database.ts), [api.ts:66](src/types/api.ts), [Cart.tsx:23](src/components/Cart.tsx), [ProductManagement.tsx:38](src/components/ProductManagement.tsx), [InventoryManagement.tsx:51](src/components/InventoryManagement.tsx). Same for `CartItem`, `Sale`, `Customer`. These drift independently, and `as any` casts (14 of them) paper over the mismatches.
**Recommendation:** One canonical set of domain types in `src/types/`, imported everywhere. Delete the inline copies.

### C3 — 🟡 Type-safety leaks
`strict: true` is set (good), but there are **53 `: any`** and **14 `as any`** in `src`. `apiRequest<T>` in [client.ts:54](src/api/client.ts) returns unvalidated `response.json()` cast to the expected type — server responses are trusted blindly on the client even though Zod is available.
**Recommendation:** Replace `any` at module boundaries with real types; validate critical API responses with Zod schemas (the server already uses Zod — share them).

### C4 — 🟡 Logging & error handling
227 `console.log/warn/error` calls in `src`; many `catch {}` blocks silently swallow errors (e.g. throughout `main.js` and the API client). There's an `ErrorBoundary` component but no structured logger.
**Recommendation:** Introduce a tiny logger with levels, gate debug logs behind a dev flag, and stop swallowing errors silently — at minimum log with context.

### C5 — 🟡 Outstanding TODO/FIXME/HACK: 49 occurrences across `src`/`server`/`electron`. Triage into issues; delete stale ones.

---

## 4. Dead / Unreachable Code

- **[src/server/databaseRoutes.ts](src/server/databaseRoutes.ts)** — imports `getDatabase` but is **imported by nothing**. Dead.
- **[src/hooks/useDatabase.ts](src/hooks/useDatabase.ts)** — the `useDatabase` hook is **never consumed**. Dead.
- **[validateApiKey.ts](server/src/middleware/validateApiKey.ts)** — auth middleware defined but **never mounted** in `bootstrap.ts`. The local API has no auth (it binds to 127.0.0.1, so acceptable — but the middleware is misleading dead code).
- **[api/examples.ts](src/api/examples.ts)** (1,210 lines) — verify this is used; the name and size suggest sample/scaffolding code.
- **Stray files:** `Untitled` (contains the text `npm run dist:win`), `debug.html` at repo root.

**Recommendation:** Delete the above (or wire up `validateApiKey` if auth is actually wanted). Removing `databaseRoutes.ts` also helps sever the `server → src` coupling in A2.

---

## 5. Testing — 🔴

**There are zero test files** (`*.test.*` / `*.spec.*`) in the repo, and no test runner in `package.json`. For a POS system handling money, tax math, and inventory, this is the highest-leverage gap.
**Recommendation:** Add Vitest. Start with pure logic that's easy to pin and business-critical:
- tax math — `computeCartTaxBreakdownFromCartItems`, `loadTaxSettings` ([taxSettings.ts](src/utils/taxSettings.ts))
- sale creation & recovery ([salesRecovery.ts](src/utils/salesRecovery.ts), [api/sales.ts](src/api/sales.ts))
- merkle/ledger integrity ([merkleTree.ts](src/utils/merkleTree.ts))
These have no UI and give immediate ROI, and they become the safety net for the C1 refactor.

---

## 6. Repo Hygiene

- **Tracked SQLite sidecars:** `server/data/local-activity.db-wal` and `.db-shm` are committed. `.gitignore` has `*.db` / `*.sqlite` but **not** `*.db-wal` / `*.db-shm`, so the WAL/SHM slip through and show up churning in `git status`.
  **Fix:** add `*.db-wal`, `*.db-shm`, `*.sqlite-wal`, `*.sqlite-shm` to `.gitignore` and `git rm --cached` the tracked ones.
- **`eslint.config.js`** sets `ecmaVersion: 2020` while `tsconfig` targets ES2022 — minor inconsistency.
- Remove stray `Untitled` and `debug.html`.

---

## 7. Prioritized Recommendations

| # | Action | Effort | Payoff |
|---|---|---|---|
| 1 | Add Vitest + tests for tax/sales/merkle logic | M | 🔴 Critical — safety net for everything else |
| 2 | Resolve the dual data model (A1): delete/quarantine mock routes, document real flow | M | 🔴 Removes the biggest source of confusion |
| 3 | Delete dead code (§4) & fix `.gitignore` WAL/SHM | S | 🟢 Fast win, shrinks surface |
| 4 | Consolidate duplicate domain types into `src/types/` (C2) | M | 🟡 Kills a class of `as any` bugs |
| 5 | Break the `server → src` import (A2) | S–M | 🟡 Clean build boundary |
| 6 | Extract hooks/reducer from `App.tsx` (C1) — after #1 | L | 🟡 Long-term maintainability |
| 7 | Split `electron/main.js` (A4) + add a logger (C4) | M | 🟢 Readability |

**Suggested first sprint:** #1 + #3 + #5 (all low-risk, high-clarity), which then unblocks #2 and #6.
