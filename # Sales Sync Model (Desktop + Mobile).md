# Sales Sync Model (Desktop + Mobile)

Este documento describe el modelo final de `Sales` usado por el CRUD de:

- `GET /api/:shopId/sales`
- `GET /api/:shopId/sales/:transactionId`
- `POST /api/:shopId/sales`
- `PUT /api/:shopId/sales/:transactionId`
- `PATCH /api/:shopId/sales/:transactionId`
- `DELETE /api/:shopId/sales/:transactionId` (soft delete)

> Importante: el CRUD de ventas usa `ShopTransaction` (no `Sale`).

---

## Modelo final (payload + persistencia)

```json
{
  "_id": "mongo_object_id",
  "shopId": "string",

  "transactionId": "string",
  "receiptNumber": "string",
  "clientEventId": "string",

  "customerName": "string",
  "customerPhone": "string",
  "customerEmail": "string",

  "items": [
    {
      "productId": "string",
      "productName": "string",
      "quantity": 1,
      "unitPrice": 100,
      "totalPrice": 100,
      "category": "string"
    }
  ],

  "subtotal": 100,
  "tax": 0,
  "discount": 0,
  "total": 100,

  "paymentMethod": "cash|card|crypto|mobile|other",
  "paymentStatus": "pending|completed|failed|refunded",
  "transactionType": "sale|refund|exchange",
  "orderType": "dine-in|takeaway|delivery",
  "tableNumber": "string",
  "waiterName": "string",
  "notes": "string",
  "source": "local|online|phone",
  "status": "active|cancelled|archived",

  "sourcePlatform": "desktop|mobile|web|server|unknown",
  "sourceDeviceId": "string",
  "clientTimestampUnixMs": 1739559999123,
  "serverTimestampUnixMs": 1739559999456,
  "lastMutationUnixMs": 1739559999456,

  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

---

## Campos de sync y orden

- `clientEventId`:
  - ID único del evento generado en cliente (UUID recomendado).
  - Idempotencia por tienda: índice único `{ shopId, clientEventId }` (sparse).
  - Si llega duplicado en `POST`, la API devuelve la venta ya creada.

- `clientTimestampUnixMs`:
  - Timestamp unix (ms) cuando el cliente creó el evento.
  - Si no se envía, servidor lo completa con `Date.now()`.

- `serverTimestampUnixMs`:
  - Timestamp unix (ms) cuando el servidor acepta la venta.
  - Es la referencia principal para orden cross-device.

- `lastMutationUnixMs`:
  - Timestamp unix (ms) de la última modificación de la venta.
  - Se actualiza en `PUT`, `PATCH` y `DELETE` (soft delete).
  - Base para sync incremental.

- `sourcePlatform` y `sourceDeviceId`:
  - Trazabilidad del origen del evento.

---

## Regla recomendada de orden en apps

Para una cola coherente de sucesos (inventario / timeline):

1. Ordenar por `serverTimestampUnixMs` DESC (o ASC para replay cronológico).
2. Como desempate, usar `_id`.

Para sincronización incremental:

- usar `GET /api/:shopId/sales?sinceUnixMs=<lastSeenLastMutationUnixMs>&sortBy=lastMutationUnixMs&sortOrder=asc`
- persistir el mayor `lastMutationUnixMs` recibido.

---

## Query params nuevos/útiles

`GET /api/:shopId/sales` ahora soporta:

- `sinceUnixMs` (number, unix ms): trae registros con `lastMutationUnixMs >= sinceUnixMs`
- `sortBy` incluye:
  - `serverTimestampUnixMs`
  - `lastMutationUnixMs`
  - `clientTimestampUnixMs`

Default actual:

- `sortBy=serverTimestampUnixMs`
- `sortOrder=desc`

---

## Recomendación de implementación en Desktop/Mobile

Al crear venta (`POST`), enviar siempre:

```json
{
  "clientEventId": "uuid-v4",
  "sourcePlatform": "desktop",
  "sourceDeviceId": "device-abc-123",
  "clientTimestampUnixMs": 1739559999123
}
```

Y guardar localmente:

- `lastSyncedUnixMs` = max(`lastMutationUnixMs`) recibido.

Esto reduce duplicados, mejora orden y mantiene consistente la actualización de inventario en múltiples dispositivos.
