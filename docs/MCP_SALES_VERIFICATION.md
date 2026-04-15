# Verificación API MCP Sales - Crear ventas

## Resumen de implementación actual

| Aspecto | MCP Sales | Sales API principal |
|---------|------------|---------------------|
| **URL** | `POST /api/mcp/:shopId/sales` | `POST /api/:shopId/sales` |
| **Schema** | `saleSchema` (compartido) | `saleSchema` (compartido) |
| **Stock** | ✅ Se descuenta automáticamente | ✅ Se descuenta automáticamente |
| **WebSocket** | No | No (ninguno emite `sales:created`) |
| **Idempotencia** | ✅ Sí (`clientEventId`) | ✅ Sí (`clientEventId`) |
| **Respuesta** | `{ data: { sale: {...} } }` | `{ data: { _id, id, ... } }` (formato plano) |

> **Nota:** En el código actual, **ambos endpoints descuentan stock** si el ítem tiene `productId` válido. La tabla de diseño original indicaba que la Sales API principal no descuenta; la implementación actual sí lo hace en ambos.

---

## Schema de validación (`saleSchema`)

Ubicación: `server/src/routes/shop.ts` líneas 2466-2503

### Campos obligatorios

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `customerName` | string | Mínimo 1 carácter |
| `items` | array | Al menos 1 ítem |
| `subtotal` | number | ≥ 0 |
| `total` | number | > 0 |
| `paymentMethod` | enum | `cash`, `card`, `crypto`, `mobile`, `mixed`, `other`, `transfer` |

### Por cada ítem en `items`

| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| `productName` | string | Sí |
| `quantity` | number | Sí (positivo) |
| `unitPrice` | number | Sí (≥ 0) |
| `totalPrice` | number | Sí (≥ 0) |
| `productId` | string (ObjectId) | No (opcional; si existe y es válido, se descuenta stock) |
| `category` | string | No |

### Campos opcionales (valores por defecto)

| Campo | Default |
|-------|---------|
| `tax` | 0 |
| `discount` | 0 |
| `paymentStatus` | `completed` |
| `orderType` | `takeaway` |
| `source` | `local` |
| `sourcePlatform` | `mobile` |

### Idempotencia (Sales Sync Model)

| Campo | Descripción |
|-------|-------------|
| `clientEventId` | UUID único; si ya existe venta con mismo `clientEventId` para la tienda, devuelve 200 con venta existente |
| `sourceDeviceId` | ID del dispositivo |
| `clientTimestampUnixMs` | Timestamp unix (ms) del cliente |

---

## Ejemplo mínimo (curl)

```bash
# Requiere SHOP_ID válido (ObjectId 24 caracteres)
SHOP_ID="64f8a1b2c3d4e5f6a7b8c9d0"

curl -X POST "https://www.bizneai.com/api/mcp/$SHOP_ID/sales" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Cliente Test",
    "items": [
      {
        "productName": "Producto A",
        "quantity": 2,
        "unitPrice": 25.50,
        "totalPrice": 51.00
      }
    ],
    "subtotal": 51.00,
    "tax": 0,
    "discount": 0,
    "total": 51.00,
    "paymentMethod": "cash"
  }'
```

## Script de prueba

```bash
SHOP_ID="<tu-shop-id>" ./scripts/test-mcp-sales-curl.sh
```

Con servidor local:

```bash
API_BASE="http://localhost:3000/api" SHOP_ID="<tu-shop-id>" ./scripts/test-mcp-sales-curl.sh
```

---

## Flujo desde la app móvil

1. **mcpSalesService.syncSaleToMCP()** convierte la venta local a formato API con `convertSaleToMCP()`.
2. Envía a `POST /api/mcp/:shopId/sales` (endpoint `/mcp/${shopId}/sales`).
3. Incluye `clientEventId` (generado con UUID si no existe) para idempotencia.
4. Mapea `productId` local → `serverId` (ObjectId) cuando hay productos sincronizados.
5. Si hay error de red, encola la venta para sync offline.

---

## Diferencias de respuesta

### MCP Sales (`POST /api/mcp/:shopId/sales`)

```json
{
  "success": true,
  "data": {
    "sale": {
      "_id": "...",
      "transactionId": "...",
      "receiptNumber": "TKT-...",
      "customerName": "...",
      "items": [...],
      "subtotal": 66,
      "tax": 0,
      "total": 66,
      "paymentMethod": "cash",
      "paymentStatus": "completed",
      "orderType": "takeaway",
      "createdAt": "...",
      "updatedAt": "..."
    }
  },
  "message": "Sale created successfully"
}
```

### Sales API principal (`POST /api/:shopId/sales`)

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "id": "...",
    "transactionId": "...",
    "receiptNumber": "TKT-...",
    "customerName": "...",
    "items": [...],
    "subtotal": 66,
    "tax": 0,
    "total": 66,
    "paymentMethod": "cash",
    "paymentStatus": "completed",
    "orderType": "takeaway",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "Sale created successfully"
}
```

La diferencia principal es que MCP envuelve la venta en `data.sale`, mientras que la API principal la devuelve directamente en `data`.
