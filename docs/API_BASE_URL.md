# Base URL de la API – Referencia única

Documento de referencia para que código y documentación usen la misma base URL.

## Producción

| Uso | URL |
|-----|-----|
| **API (todas las llamadas backend)** | `https://www.bizneai.com/api` |
| **Tienda pública (eCommerce)** | `https://www.bizneai.com/shop/{shopId}` |

## Dónde está definido en código

- **`src/services/api.ts`** – `API_BASE_URL` (getApiBaseUrl, makeApiRequest, etc.)
- **`src/services/shopService.ts`** – misma base para shop endpoints
- **`src/services/crudEventListenerService.ts`** – MCP productos (PUT/POST)
- **`src/services/ecommerceUploadService.ts`** – subida eCommerce
- **`src/services/ecommerceService.ts`** – `generateEcommerceUrl()` usa `https://www.bizneai.com`
- **`src/services/aiService.ts`** – bizneai-chat, ai-history, URL MCP
- **`src/services/mcpSalesService.ts`**, **mcpInventoryService.ts**, **roleSyncService.ts** – www

Usar **`www`** evita redirects en POST y mantiene consistencia con el resto del backend.

## Local

- **API:** `http://localhost:3000/api` (cuando se usa backend local)

## Documentación

Los siguientes docs deben usar **`https://www.bizneai.com/api`** en ejemplos de API:

- SHOP_ENDPOINTS.md
- MCP_CRUD_VERIFICATION.md
- REVISION_SUBIDA_IMAGENES_CHAT.md
- TICKET_JSON_EXAMPLE.md
- CONFIGURATION_ARCHITECTURE.md (URL de shop)
- FEATURES_CONFIGURATION_COMPLETE.md (URL de shop)
