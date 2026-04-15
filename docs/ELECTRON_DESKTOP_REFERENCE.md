# Punto de referencia: POS Electron (desktop) vs documentación móvil

Los archivos en `docs/` mezclan el **producto móvil** (React Native / Expo), el **backend** compartido y, en menor medida, el **cliente Electron**. Este documento fija **qué aplica al escritorio** y cómo evitar romper el comportamiento offline-first del POS de escritorio.

## Principios (Electron)

1. **Sin shop / sin red:** el POS debe seguir funcionando con datos en `localStorage` (y réplica KV/SQLite local si el API en `:3000` está activo). Nada de sync remota puede ser obligatorio para abrir pantallas o cobrar.
2. **`shopId` provisional o placeholder:** no llamar a MCP para datos de negocio que requieran tienda real (p. ej. prefijos `provisional-`, `local-unconfigured`).
3. **Modelo de datos:** el registro de clientes en desktop usa **`RegistryCustomer`** (`bizneai-customers-registry`), con `id` **numérico** para la UI y ventas locales. La API MCP usa **`id` string** lógico; en escritorio se enlaza con el campo opcional **`mcpCustomerId`**.
4. **Proxy en desarrollo:** en `localhost` / `file://`, las peticiones a `https://www.bizneai.com` pasan por **`/api/proxy/...`** del servidor local (`mcpProxyRoutes.ts`) para CORS.
5. **Paridad documental:** los flujos descritos en `CUSTOMER_SYSTEM.md` (AsyncStorage, `customerDatabase.ts`) son la **referencia de negocio**; la implementación en Electron vive en `src/services/customerRegistry.ts` + `customerMcpSync.ts`.

## Tabla rápida: doc móvil → código desktop

| Tema en docs | Dónde está en Electron |
|--------------|-------------------------|
| Registro local | `customerRegistry.ts`, clave `bizneai-customers-registry` |
| Pull MCP | `customerMcpSync.ts` → `pullCustomersFromMcp()` |
| Push al guardar | `customerMcpSync.ts` → `syncCustomerToMcpAfterSave()` |
| Proxy GET/POST/PUT customers | `server/src/routes/mcpProxyRoutes.ts` |
| Backup snapshot (lote) | `mcpBatchSync.ts` → lote `localCustomers` (solo copia local; no sustituye al pull) |

## Qué no cubre aún esta capa

- Cola persistente de reintentos tipo móvil (`@BizneAI_crud_event_queue`).
- Eliminación remota fuerte (desktop mantiene filas locales si el servidor deja de devolverlas, para no borrar datos offline sin criterio explícito).

## Referencias

- [CUSTOMERS_SHOP_AND_SYNC.md](./CUSTOMERS_SHOP_AND_SYNC.md) — contrato API y campos opcionales.
- [LOCAL_DATABASE_AND_API_SYNC.md](./LOCAL_DATABASE_AND_API_SYNC.md) — capas locales.
