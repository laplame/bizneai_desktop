# 📋 Ejemplo de JSON de Ticket - Después de las Correcciones

Este documento muestra el formato del JSON que se envía al servidor cuando se crea un ticket desde una venta.

---

## 📤 JSON Enviado al Servidor

### Endpoint
```
POST https://www.bizneai.com/api/{shopId}/tickets
```

### Ejemplo de JSON (con datos corregidos)

```json
{
  "shopId": "691a59f9529b1c88366b342c",
  "saleId": "1764959798888",
  "ticketNumber": "TKT-1764959798888-001",
  "customerName": "Walk-in Customer",
  "items": [
    {
      "productId": "1764873302554",
      "name": "Tijera maped escolar",
      "price": 25.00,
      "quantity": 2,
      "total": 50.00,
      "notes": null
    },
    {
      "productId": "1764880000000",
      "name": "Lápiz HB",
      "price": 22.50,
      "quantity": 2,
      "total": 45.00,
      "notes": null
    }
  ],
  "subtotal": 95.00,
  "tax": 15.20,
  "total": 110.20,
  "paymentMethod": "cash",
  "status": "pending",
  "orderType": "dine-in",
  "tableNumber": null,
  "deliveryAddress": null,
  "customerPhone": null,
  "customerEmail": null,
  "notes": "",
  "createdAt": "2025-12-05T12:38:00.000Z",
  "updatedAt": "2025-12-05T12:38:00.000Z",
  "mixedPayments": {
    "cash": 0,
    "card": 0,
    "crypto": 0
  }
}
```

---

## 🔍 Comparación: Antes vs Después

### ❌ ANTES (con errores)

```json
{
  "shopId": "691a59f9529b1c88366b342c",
  "saleId": "undefined",                    // ❌ Error: saleId undefined
  "customerName": "Walk-in Customer",
  "items": [...],
  "subtotal": 15.999999999999998,          // ❌ Error: precisión incorrecta
  "tax": 2.56,
  "total": 18.56,
  "paymentMethod": "cash",
  "status": "pending",
  "orderType": "dine-in",
  "createdAt": "2025-11-25T17:55:42.852Z",  // ❌ Error: fecha incorrecta
  "updatedAt": "2025-11-25T17:55:42.852Z"   // ❌ Error: fecha incorrecta
}
```

### ✅ DESPUÉS (corregido)

```json
{
  "shopId": "691a59f9529b1c88366b342c",
  "saleId": "1764959798888",                // ✅ Correcto: saleId válido
  "customerName": "Walk-in Customer",
  "items": [...],
  "subtotal": 95.00,                        // ✅ Correcto: subtotal exacto
  "tax": 15.20,
  "total": 110.20,
  "paymentMethod": "cash",
  "status": "pending",
  "orderType": "dine-in",
  "createdAt": "2025-12-05T12:38:00.000Z",  // ✅ Correcto: fecha de la venta
  "updatedAt": "2025-12-05T12:38:00.000Z", // ✅ Correcto: fecha de la venta
  "mixedPayments": {
    "cash": 0,
    "card": 0,
    "crypto": 0
  }
}
```

---

## 📝 Estructura Completa del JSON

### Campos Requeridos

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `shopId` | string | ID de la tienda (MongoDB ObjectId) | `"691a59f9529b1c88366b342c"` |
| `saleId` | string | ID de la venta (requerido, no puede ser "undefined") | `"1764959798888"` |
| `customerName` | string | Nombre del cliente | `"Walk-in Customer"` |
| `items` | array | Array de items de la venta | Ver abajo |
| `subtotal` | number | Subtotal exacto (sin errores de precisión) | `95.00` |
| `tax` | number | Impuestos | `15.20` |
| `total` | number | Total de la venta | `110.20` |
| `paymentMethod` | string | Método de pago: `cash`, `card`, `crypto`, `transfer` | `"cash"` |
| `status` | string | Estado: `pending`, `completed`, `cancelled`, `refunded` | `"pending"` |
| `orderType` | string | Tipo de orden: `dine-in`, `takeaway`, `delivery`, `online` | `"dine-in"` |
| `createdAt` | string (ISO 8601) | Fecha/hora de la venta (no del ticket) | `"2025-12-05T12:38:00.000Z"` |
| `updatedAt` | string (ISO 8601) | Fecha/hora de la venta (no del ticket) | `"2025-12-05T12:38:00.000Z"` |

### Campos Opcionales

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `ticketNumber` | string | Número de ticket generado | `"TKT-1764959798888-001"` |
| `tableNumber` | string | Número de mesa | `"5"` o `null` |
| `deliveryAddress` | string | Dirección de entrega | `null` |
| `customerPhone` | string | Teléfono del cliente | `"+52 55 1234 5678"` o `null` |
| `customerEmail` | string | Email del cliente | `"cliente@example.com"` o `null` |
| `notes` | string | Notas adicionales | `""` o `"Cliente especial"` |
| `mixedPayments` | object | Detalles de pagos mixtos | Ver abajo |

### Estructura de `items`

```json
{
  "productId": "1764873302554",  // ID del producto (string)
  "name": "Tijera maped escolar", // Nombre del producto
  "price": 25.00,                 // Precio unitario
  "quantity": 2,                   // Cantidad
  "total": 50.00,                  // Total del item (price * quantity)
  "notes": null                    // Notas opcionales del item
}
```

### Estructura de `mixedPayments`

```json
{
  "cash": 50.00,    // Monto pagado en efectivo
  "card": 30.00,    // Monto pagado con tarjeta
  "crypto": 20.00   // Monto pagado con cripto
}
```

---

## 🔄 Flujo de Datos

### 1. Venta en `app/cart.tsx`

```typescript
const sale: Sale = {
  items: saleItems,
  subtotal: 95.00,              // ✅ Subtotal exacto
  tax: 15.20,
  total: 110.20,
  paymentType: 'cash',
  date: "2025-12-05T12:38:00.000Z",      // ✅ Fecha de la venta
  createdAt: "2025-12-05T12:38:00.000Z", // ✅ Fecha de la venta
  // ...
};
const saleId = await salesHistoryService.createSale(sale);
```

### 2. Creación del Ticket en `ticketService.ts`

```typescript
const ticket = await createTicketFromSale({
  items: saleItems,
  subtotal: 95.00,              // ✅ Pasa subtotal directamente
  total: 110.20,
  taxAmount: 15.20,
  date: sale.date,               // ✅ Pasa fecha de la venta
  createdAt: sale.createdAt,     // ✅ Pasa createdAt de la venta
  paymentType: 'cash',
  // ...
}, String(saleId));              // ✅ saleId válido
```

### 3. JSON Enviado al Servidor

```typescript
const ticketData = {
  ...ticket,
  createdAt: ticket.createdAt.toISOString(), // ✅ Convierte a ISO string
  updatedAt: ticket.updatedAt.toISOString(), // ✅ Convierte a ISO string
  saleId: ticket.saleId || ticket.id        // ✅ Asegura saleId válido
};
```

### 4. Servidor Recibe y Guarda

El servidor ahora:
- ✅ Respeta las fechas enviadas (`createdAt`, `updatedAt`)
- ✅ Usa el `saleId` proporcionado (no genera uno nuevo)
- ✅ Guarda el subtotal exacto (sin errores de precisión)

---

## ✅ Validaciones Implementadas

1. **saleId válido**: Se valida que no sea `"undefined"` o `"null"`
2. **Subtotal exacto**: Se pasa directamente desde la venta (no se calcula)
3. **Fechas correctas**: Se usan las fechas de la venta, no la fecha actual
4. **Formato ISO 8601**: Las fechas se envían en formato ISO string

---

## 📊 Ejemplo Real Completo

Basado en tu venta del 05/12/2025 12:38:

```json
{
  "shopId": "691a59f9529b1c88366b342c",
  "saleId": "1764959798888",
  "ticketNumber": "TKT-1764959798888-001",
  "customerName": "Walk-in Customer",
  "items": [
    {
      "productId": "1764873302554",
      "name": "Tijera maped escolar",
      "price": 25.00,
      "quantity": 2,
      "total": 50.00,
      "notes": null
    }
  ],
  "subtotal": 95.00,
  "tax": 15.20,
  "total": 110.20,
  "paymentMethod": "cash",
  "status": "pending",
  "orderType": "dine-in",
  "notes": "",
  "createdAt": "2025-12-05T12:38:00.000Z",
  "updatedAt": "2025-12-05T12:38:00.000Z",
  "mixedPayments": {
    "cash": 0,
    "card": 0,
    "crypto": 0
  }
}
```

---

**Última actualización:** 2025-12-05  
**Versión:** 1.0.0

