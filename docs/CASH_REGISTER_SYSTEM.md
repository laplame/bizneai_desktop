# Cash Register System (Caja Registradora)

Documentación del sistema de caja registradora: almacenamiento local, operaciones, sincronización vía CRUD Event Listener y endpoints MCP.

---

## 1. Resumen

El sistema de caja gestiona sesiones y movimientos de efectivo. Los datos se guardan primero en local (offline-first) y se sincronizan al servidor cuando `ecommerceEnabled` es true, mediante el CRUD Event Listener Service.

---

## 2. Modelos locales

### CashierSession (`src/services/cashierDatabase.ts`)

```typescript
interface CashierSession {
  id: string;              // CS-{timestamp}
  openedAt: string;        // ISO 8601
  openedBy?: string;
  openingAmount: number;
  status: 'open' | 'closed' | 'archived';
  closedAt?: string;
  closedBy?: string;
  closingAmount?: number;
  expectedAmount?: number;
  variance?: number;
  notes?: string;
}
```

### CashMovement

```typescript
type CashMovementType = 'saleCash' | 'refundCash' | 'cashIn' | 'cashOut' | 'adjustment';

interface CashMovement {
  id: string;              // CM-{timestamp}-{random}
  sessionId: string;
  timestamp: string;
  type: CashMovementType;
  amount: number;          // positivo = ingreso, negativo = egreso
  referenceId?: string;    // saleId, ticketId
  userId?: string;
  notes?: string;
}
```

---

## 3. Almacenamiento local

| Clave | Contenido |
|-------|-----------|
| `@BizneAI_cashier_active_session` | Sesión activa (objeto o null) |
| `@BizneAI_cashier_sessions` | Array de sesiones |
| `@BizneAI_cashier_movements_{sessionId}` | Movimientos por sesión |

---

## 4. Operaciones y emisión CRUD

| Operación | Función | Evento CRUD | Endpoint MCP |
|-----------|---------|--------------|--------------|
| Abrir caja | `openSession()` | cashier_session create | POST /cash-register/open |
| Cerrar caja | `closeSession()` | cashier_session update | POST /cash-register/close |
| Registrar movimiento | `addMovement()` | cashier_movement create | POST /cash-register/movements |

---

## 5. Flujo de datos

```
┌─────────────────┐     open/close/movement     ┌─────────────────────┐
│  POS / Cart     │ ──────────────────────────► │  cashierDatabase    │
│  (POSSCreen,    │                              │  (AsyncStorage)     │
│   cart.tsx)     │                              └──────────┬──────────┘
└─────────────────┘                                         │
                                                             │ emitCRUDEvent
                                                             ▼
                                                    ┌─────────────────────┐
                                                    │ crudEventListener   │
                                                    │ Service             │
                                                    │ • ecommerce check   │
                                                    │ • POST to MCP API   │
                                                    │ • queue on failure  │
                                                    └──────────┬──────────┘
                                                               │
                                                               ▼
                                                    ┌─────────────────────┐
                                                    │  API Server         │
                                                    │  /mcp/:shopId/      │
                                                    │  cash-register/*    │
                                                    │  (MongoDB)          │
                                                    └─────────────────────┘
```

---

## 6. Endpoints MCP

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/mcp/:shopId/cash-register/open` | Abrir caja |
| POST | `/mcp/:shopId/cash-register/close` | Cerrar caja |
| POST | `/mcp/:shopId/cash-register/movements` | Registrar movimiento |
| GET | `/mcp/:shopId/cash-register/status` | Estado y balance |
| GET | `/mcp/:shopId/cash-register/sessions` | Historial de sesiones |

---

## 7. Archivos relacionados

| Archivo | Propósito |
|---------|-----------|
| `src/services/cashierDatabase.ts` | Almacenamiento local, emisión CRUD |
| `src/services/cashierService.ts` | API de alto nivel |
| `src/services/crudEventListenerService.ts` | Envío al servidor |
| `server/src/models/CashierSession.ts` | Modelo MongoDB |
| `server/src/models/CashMovement.ts` | Modelo MongoDB |
| `server/src/routes/shop.ts` | Rutas MCP cash-register |
| `docs/API_CASH_REGISTER_SPEC.md` | Especificación detallada |
