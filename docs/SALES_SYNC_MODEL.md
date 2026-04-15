# Sales Sync Model (Desktop + Mobile)

Modelo de sincronización de ventas (ShopTransaction) implementado en BizneAI.

## Endpoints

- `GET /api/mcp/:shopId/sales` - Listar ventas (soporta `sinceUnixMs` para sync incremental)
- `POST /api/mcp/:shopId/sales` - Crear venta (idempotencia vía `clientEventId`)
- `PUT /api/:shopId/sales/:saleId` - Actualizar venta

## Campos de sync

| Campo | Descripción |
|-------|-------------|
| `clientEventId` | UUID único del evento. Índice único `{ shopId, clientEventId }` para idempotencia |
| `clientTimestampUnixMs` | Timestamp unix (ms) cuando el cliente creó el evento |
| `serverTimestampUnixMs` | Timestamp cuando el servidor aceptó la venta |
| `lastMutationUnixMs` | Timestamp de última modificación. Base para sync incremental |
| `sourcePlatform` | desktop \| mobile \| web \| server \| unknown |
| `sourceDeviceId` | Identificador del dispositivo |

## Idempotencia (POST)

Al crear venta, enviar:

```json
{
  "clientEventId": "uuid-v4",
  "sourcePlatform": "mobile",
  "sourceDeviceId": "mobile-abc12345",
  "clientTimestampUnixMs": 1739559999123,
  ...
}
```

Si la API recibe un `clientEventId` duplicado para la misma tienda, devuelve la venta existente (200) en lugar de crear duplicado.

## Sync incremental (GET)

```http
GET /api/mcp/:shopId/sales?sinceUnixMs=1739559999000&sortBy=lastMutationUnixMs&sortOrder=asc
```

- `sinceUnixMs`: Trae registros con `lastMutationUnixMs >= sinceUnixMs`
- `sortBy`: `serverTimestampUnixMs` | `lastMutationUnixMs` | `clientTimestampUnixMs` | `createdAt`
- `sortOrder`: `asc` | `desc`

## Cliente (app móvil)

1. **Al crear venta**: Generar y persistir `clientEventId` (UUID) antes del primer sync
2. **Al enviar POST**: Incluir `clientEventId`, `sourcePlatform`, `sourceDeviceId`, `clientTimestampUnixMs`
3. **Al hacer GET**: Usar `useIncrementalSync: true` para traer solo cambios desde `lastSyncedUnixMs`
4. **Tras GET exitoso**: Actualizar `lastSyncedUnixMs` con el máximo `lastMutationUnixMs` recibido

## Storage local (cliente)

- `@BizneAI_sales_lastSyncedUnixMs` - Último `lastMutationUnixMs` sincronizado
- `@BizneAI_sales_sourceDeviceId` - ID del dispositivo (generado una vez)
