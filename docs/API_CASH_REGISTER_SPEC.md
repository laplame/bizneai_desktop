# Especificación: Caja Registradora (Cash Register) – API para el servidor

## 1. Resumen

Documento para implementar en el servidor el modelo y endpoints de la caja registradora (Point of Sale – Cashier). La app actualmente guarda sesiones y movimientos solo en local; este documento define cómo sincronizar con el servidor.

---

## 2. Flujo en la app (cliente)

### 2.1 Abrir caja (Open Cashier)

- **Nombre del cajero** (`openedBy` / `_name__`)
- **Monto inicial** (Enter Amount) – con cuánto se empieza
- **Notas** (Notes) – opcional

### 2.2 Estado de la caja

- **Balance actual** – cuánto hay en caja (openingAmount + suma de movimientos)
- **Monto de apertura** – con cuánto se empezó

### 2.3 Movimientos

- **Cash In** – ingreso de efectivo
- **Cash Out** – retiro de efectivo
- **Sale Cash** – venta en efectivo (automático al cobrar)
- **Refund Cash** – devolución en efectivo
- **Adjustment** – ajuste manual

### 2.4 Cerrar caja (Close Cashier)

- **Monto de cierre** (closingAmount)
- **Notas** (Notes)

---

## 3. Modelos de datos

### 3.1 CashierSession (Sesión de caja)

```typescript
interface CashierSession {
  id: string;                    // CS-{timestamp} o ObjectId del servidor
  shopId: string;                // ID de la tienda (servidor)
  
  // Apertura
  openedAt: string;             // ISO 8601
  openedBy?: string;            // Nombre del cajero o userId
  openingAmount: number;        // Monto inicial (con cuánto se empieza)
  notes?: string;               // Notas de apertura
  
  // Estado
  status: 'open' | 'closed' | 'archived';
  
  // Cierre (cuando status === 'closed')
  closedAt?: string;
  closedBy?: string;
  closingAmount?: number;       // Monto contado al cerrar
  expectedAmount?: number;      // openingAmount + suma de movimientos
  variance?: number;            // closingAmount - expectedAmount (diferencia)
  
  // Sync
  sourceDeviceId?: string;
  clientTimestampUnixMs?: number;
}
```

### 3.2 CashMovement (Movimiento de efectivo)

```typescript
type CashMovementType = 'saleCash' | 'refundCash' | 'cashIn' | 'cashOut' | 'adjustment';

interface CashMovement {
  id: string;                   // CM-{timestamp}-{random} o ObjectId
  sessionId: string;            // ID de la sesión
  shopId?: string;              // ID de la tienda (servidor)
  
  timestamp: string;            // ISO 8601
  type: CashMovementType;
  amount: number;               // Positivo = ingreso, negativo = egreso
  
  referenceId?: string;        // saleId, ticketId, etc.
  userId?: string;
  notes?: string;
  
  // Sync
  sourceDeviceId?: string;
  clientTimestampUnixMs?: number;
}
```

---

## 4. Endpoints propuestos

### 4.1 POST /api/mcp/:shopId/cash-register/open

Abre una sesión de caja.

**Body:**

```json
{
  "openedBy": "Juan Pérez",
  "openingAmount": 500.00,
  "notes": "Apertura turno mañana",
  "sourceDeviceId": "mobile-cc75c941",
  "clientTimestampUnixMs": 1772733389234
}
```

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `openedBy` | string | No | Nombre del cajero o userId |
| `openingAmount` | number | Sí | Monto inicial (con cuánto se empieza) |
| `notes` | string | No | Notas de apertura |
| `sourceDeviceId` | string | No | ID del dispositivo |
| `clientTimestampUnixMs` | number | No | Timestamp del cliente |

**Respuesta esperada:**

```json
{
  "success": true,
  "data": {
    "sessionId": "675a1234567890abcdef1234",
    "openedAt": "2026-03-05T10:00:00.000Z",
    "openingAmount": 500,
    "status": "open",
    "balance": 500
  },
  "message": "Cash register opened successfully"
}
```

---

### 4.2 POST /api/mcp/:shopId/cash-register/close

Cierra la sesión de caja activa.

**Body:**

```json
{
  "closingAmount": 1250.50,
  "closedBy": "Juan Pérez",
  "notes": "Cierre turno - conteo correcto",
  "sourceDeviceId": "mobile-cc75c941",
  "clientTimestampUnixMs": 1772733989234
}
```

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `closingAmount` | number | Sí | Monto contado al cerrar |
| `closedBy` | string | No | Quién cerró |
| `notes` | string | No | Notas de cierre |
| `sourceDeviceId` | string | No | ID del dispositivo |
| `clientTimestampUnixMs` | number | No | Timestamp del cliente |

**Respuesta esperada:**

```json
{
  "success": true,
  "data": {
    "sessionId": "675a1234567890abcdef1234",
    "status": "closed",
    "closingAmount": 1250.50,
    "expectedAmount": 1250.00,
    "variance": 0.50,
    "closedAt": "2026-03-05T18:00:00.000Z"
  },
  "message": "Cash register closed successfully"
}
```

---

### 4.3 GET /api/mcp/:shopId/cash-register/status

Obtiene el estado actual de la caja (sesión activa y balance).

**Respuesta esperada (caja abierta):**

```json
{
  "success": true,
  "data": {
    "hasActiveSession": true,
    "sessionId": "675a1234567890abcdef1234",
    "openedAt": "2026-03-05T10:00:00.000Z",
    "openedBy": "Juan Pérez",
    "openingAmount": 500,
    "balance": 1250.50,
    "status": "open"
  }
}
```

**Respuesta esperada (caja cerrada):**

```json
{
  "success": true,
  "data": {
    "hasActiveSession": false,
    "lastSession": {
      "sessionId": "675a1234567890abcdef1234",
      "closedAt": "2026-03-05T18:00:00.000Z",
      "closingAmount": 1250.50
    }
  }
}
```

---

### 4.4 POST /api/mcp/:shopId/cash-register/movements

Registra un movimiento de efectivo (cash in, cash out, sale, refund, adjustment).

**Body:**

```json
{
  "type": "cashIn",
  "amount": 100.00,
  "referenceId": null,
  "notes": "Ingreso para cambio",
  "sourceDeviceId": "mobile-cc75c941",
  "clientTimestampUnixMs": 1772733589234
}
```

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `type` | string | Sí | `saleCash` \| `refundCash` \| `cashIn` \| `cashOut` \| `adjustment` |
| `amount` | number | Sí | Monto (positivo para ingreso, negativo para egreso) |
| `referenceId` | string | No | saleId, ticketId, etc. |
| `notes` | string | No | Notas del movimiento |
| `sourceDeviceId` | string | No | ID del dispositivo |
| `clientTimestampUnixMs` | number | No | Timestamp del cliente |

**Respuesta esperada:**

```json
{
  "success": true,
  "data": {
    "movementId": "675a1234567890abcdef5678",
    "sessionId": "675a1234567890abcdef1234",
    "type": "cashIn",
    "amount": 100,
    "balance": 600,
    "timestamp": "2026-03-05T12:00:00.000Z"
  },
  "message": "Movement recorded"
}
```

---

### 4.5 GET /api/mcp/:shopId/cash-register/sessions

Lista sesiones de caja (historial) con paginación.

**Query params:**

- `page` (default: 1)
- `limit` (default: 20)
- `status` (opcional): `open` \| `closed` \| `all`
- `dateFrom` (opcional): YYYY-MM-DD
- `dateTo` (opcional): YYYY-MM-DD

**Respuesta esperada:**

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "675a1234567890abcdef1234",
        "openedAt": "2026-03-05T10:00:00.000Z",
        "openedBy": "Juan Pérez",
        "openingAmount": 500,
        "closedAt": "2026-03-05T18:00:00.000Z",
        "closingAmount": 1250.50,
        "expectedAmount": 1250.00,
        "variance": 0.50,
        "status": "closed"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45
    }
  }
}
```

---

## 5. Schemas sugeridos (MongoDB / Zod)

### 5.1 CashierSession (Mongoose)

```typescript
const CashierSessionSchema = new Schema({
  shopId: { type: Schema.Types.ObjectId, required: true, ref: 'Shop' },
  
  openedAt: { type: Date, required: true },
  openedBy: { type: String },
  openingAmount: { type: Number, required: true },
  notes: { type: String },
  
  status: { type: String, enum: ['open', 'closed', 'archived'], default: 'open' },
  
  closedAt: { type: Date },
  closedBy: { type: String },
  closingAmount: { type: Number },
  expectedAmount: { type: Number },
  variance: { type: Number },
  
  sourceDeviceId: { type: String },
  clientTimestampUnixMs: { type: Number }
}, { timestamps: true });
```

### 5.2 CashMovement (Mongoose)

```typescript
const CashMovementSchema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, required: true, ref: 'CashierSession' },
  shopId: { type: Schema.Types.ObjectId, required: true, ref: 'Shop' },
  
  type: { type: String, enum: ['saleCash', 'refundCash', 'cashIn', 'cashOut', 'adjustment'], required: true },
  amount: { type: Number, required: true },
  
  referenceId: { type: String },
  userId: { type: String },
  notes: { type: String },
  
  sourceDeviceId: { type: String },
  clientTimestampUnixMs: { type: Number }
}, { timestamps: true });
```

### 5.3 Validación Zod (POST open)

```typescript
const OpenCashRegisterSchema = z.object({
  openedBy: z.string().optional(),
  openingAmount: z.number().min(0),
  notes: z.string().optional(),
  sourceDeviceId: z.string().optional(),
  clientTimestampUnixMs: z.number().optional()
});
```

### 5.4 Validación Zod (POST close)

```typescript
const CloseCashRegisterSchema = z.object({
  closingAmount: z.number().min(0),
  closedBy: z.string().optional(),
  notes: z.string().optional(),
  sourceDeviceId: z.string().optional(),
  clientTimestampUnixMs: z.number().optional()
});
```

### 5.5 Validación Zod (POST movements)

```typescript
const CashMovementSchema = z.object({
  type: z.enum(['saleCash', 'refundCash', 'cashIn', 'cashOut', 'adjustment']),
  amount: z.number(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
  sourceDeviceId: z.string().optional(),
  clientTimestampUnixMs: z.number().optional()
});
```

---

## 6. Reglas de negocio

1. **Una sola sesión abierta por tienda**: no permitir abrir otra sesión si ya hay una activa.
2. **Balance**: `balance = openingAmount + Σ(movements.amount)`.
3. **Variance**: `variance = closingAmount - expectedAmount`.
4. **Movimientos con sesión cerrada**: rechazar si no hay sesión activa.
5. **Idempotencia**: usar `clientTimestampUnixMs` + `sourceDeviceId` para evitar duplicados.

---

## 7. Uso desde la app (cliente)

### 7.1 Al abrir caja

1. Usuario ingresa: **Nombre** (openedBy), **Monto** (openingAmount), **Notas** (notes).
2. Llamar `POST /api/mcp/:shopId/cash-register/open`.
3. Guardar `sessionId` en local para asociar movimientos.

### 7.2 Al registrar venta en efectivo

1. Llamar `POST /api/mcp/:shopId/cash-register/movements` con `type: 'saleCash'`, `amount`, `referenceId: saleId`.

### 7.3 Al cerrar caja

1. Usuario ingresa: **Monto de cierre** (closingAmount), **Notas** (notes).
2. Llamar `POST /api/mcp/:shopId/cash-register/close`.

### 7.4 Al cargar POS

1. Llamar `GET /api/mcp/:shopId/cash-register/status` para mostrar balance y estado.

---

## 8. Integración con CRUD Event Listener

La app emite eventos CRUD automáticamente al abrir/cerrar sesión y al registrar movimientos. El `crudEventListenerService` los envía al servidor cuando `ecommerceEnabled` es true.

### 8.1 Entidades y mapeo

| Entidad | Operación | Endpoint | Cuándo se emite |
|---------|------------|----------|-----------------|
| cashier_session | create | `POST /mcp/:shopId/cash-register/open` | Al abrir caja (`openSession`) |
| cashier_session | update | `POST /mcp/:shopId/cash-register/close` | Al cerrar caja (`closeSession`) |
| cashier_movement | create | `POST /mcp/:shopId/cash-register/movements` | Al registrar movimiento (`addMovement`) |

### 8.2 Servicios que emiten

- **cashierDatabase** (`src/services/cashierDatabase.ts`): llama a `emitCRUDEvent` después de `openSession`, `closeSession`, `addMovement`.
- **crudEventListenerService**: procesa la cola y envía a la API. Si falla, encola para reintento.

### 8.3 Cola de eventos

- Clave: `@BizneAI_crud_event_queue`
- Se procesa al iniciar sync (`processEventQueue`) o cuando se reanuda.

---

## 9. Resumen de endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/mcp/:shopId/cash-register/open` | Abrir caja (Open Cashier) |
| POST | `/api/mcp/:shopId/cash-register/close` | Cerrar caja |
| GET | `/api/mcp/:shopId/cash-register/status` | Estado y balance actual |
| POST | `/api/mcp/:shopId/cash-register/movements` | Registrar movimiento |
| GET | `/api/mcp/:shopId/cash-register/sessions` | Historial de sesiones |
