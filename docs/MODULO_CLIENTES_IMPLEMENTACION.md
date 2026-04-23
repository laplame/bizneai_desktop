# Módulo de clientes — implementación, esquemas y endpoints

Documento de referencia para lo implementado en el POS desktop relacionado con **clientes**, **cuenta corriente**, **venta a crédito** y el **ciclo de venta con lista de espera** (incluye tipos compartidos con POS/waitlist).

---

## 1. Alcance del módulo “clientes” en la app

| Área | Descripción |
|------|-------------|
| **Registro local** | Lista de clientes en `localStorage` + espejo SQLite vía KV (`bizneai-customers-registry`). |
| **UI** | `CustomerManagement.tsx` — listado, filtros, alta/edición/baja, detalle, sincronización MCP manual. |
| **Cuenta corriente** | Libro de movimientos por cliente (`bizneai-customer-account-ledger`) y formulario en el modal de detalle. |
| **Crédito en POS** | Campo `allowCredit` (y condiciones comerciales) en el cliente; en checkout, tarjeta **Diferir pago** (historial de crédito / cuenta corriente) visible si el carrito tiene `customerId` del registro; con `allowCredit` en false la tarjeta se muestra atenuada y un clic dispara **toast** con el mensaje de `disabledMessage`; el flujo se completa solo si `allowCredit` es true. |
| **Tipos de ajuste** | `cobranza`, `anticipo`, `cobro_sobre_nota` (este último exige `notaId`). |

Los estados de **fulfillment** de pedido (`waitlist_reserved` → `pending_settlement` → `completed`) viven en entradas de **lista de espera** y en el **Merkle** de ventas; el inventario reservado se describe en la sección 4.

---

## 2. Modelo de datos (TypeScript / almacenamiento)

### 2.1 Cliente del registro — `RegistryCustomer`

**Archivo:** `src/types/customerRegistry.ts`  
**Persistencia:** `localStorage` clave `bizneai-customers-registry` (array JSON).

Campos relevantes para crédito y MCP:

| Campo | Tipo | Uso |
|-------|------|-----|
| `id` | `number` | ID local único en UI. |
| `firstName`, `lastName`, … | string | Datos de contacto y CRM. |
| `mcpCustomerId` | `string?` | ID remoto MCP tras alta/sync. |
| `allowCredit` | `boolean?` | Si el POS permite **completar** el diferido en checkout; la tarjeta **Diferir pago** puede mostrarse igualmente con cliente vinculado para descubrir la función. |
| `commercialConditions` | objeto opcional | Incluye `creditLimitAmount`, `paymentTermsDays`, etc. (paridad con MCP). |

### 2.2 Cuenta corriente — movimientos

**Archivo:** `src/types/saleWaitlistCredit.ts`  
**Persistencia:** `localStorage` clave `bizneai-customer-account-ledger` (array JSON de entradas).

```ts
// Tipos (resumen)
type CustomerAccountAdjustmentKind = 'cobranza' | 'anticipo' | 'cobro_sobre_nota';

interface CustomerAccountLedgerEntry {
  id: string;
  customerId: number;
  kind: CustomerAccountAdjustmentKind;
  amount: number;        // siempre > 0; el signo contable lo da kind
  note?: string;
  notaId?: string;       // obligatorio si kind === 'cobro_sobre_nota'
  createdAt: string;
}
```

**Cálculo de saldo** (`getCustomerAccountBalance` en `src/services/customerAccountLedger.ts`):

- `cobranza` → **suma** al adeudo.
- `anticipo` y `cobro_sobre_nota` → **restan** del adeudo.

**Venta a crédito / diferir pago en checkout:** el modal (`CheckoutModal`) recibe `deferPayment` desde `App` (`checkoutDeferPayment`): `show` si hay `customerInfo.customerId`, `canComplete` si el cliente cargado tiene `allowCredit`, más `subtitle` / `disabledMessage`. Al confirmar, el método interno sigue siendo **`credit`**; el POS agrega una **cobranza** por el total (además del flujo de venta habitual).

### 2.3 Ciclo de venta / lista de espera — `SaleFulfillmentState`

**Archivo:** `src/types/saleWaitlistCredit.ts`  
**Persistencia:** campo opcional `fulfillmentState` en cada objeto del array `bizneai-waitlist`.

| Estado | Significado |
|--------|-------------|
| `waitlist_reserved` | Pedido en lista de espera; **stock reservado** (descontado del catálogo). |
| `pending_settlement` | Pedido **cargado al carrito** para cobrar. |
| `completed` | Venta **cerrada**; reserva de inventario consumida sin devolver stock. |

### 2.4 Historial de ventas (Merkle) — extensión opcional

**Archivo:** `src/services/merkleTreeService.ts` — interface `SaleRecord` incluye:

- `saleFulfillmentState?: string` — p. ej. `completed` cuando la venta cierra un pedido que venía de lista de espera.

---

## 3. Servicios (archivos clave)

| Servicio | Archivo | Función |
|----------|---------|---------|
| Registro CRUD local | `src/services/customerRegistry.ts` | `loadCustomers`, `saveCustomers`, `recordPurchaseForCustomer`, etc. |
| Sync MCP | `src/services/customerMcpSync.ts` | `pullCustomersFromMcp`, `syncCustomerToMcpAfterSave`, `canSyncCustomersToMcp`, merge remoto → local. |
| Libro de cuenta | `src/services/customerAccountLedger.ts` | `appendLedgerEntry`, `getCustomerAccountBalance`, `listLedgerForCustomer`. |
| Reserva inventario / waitlist | `src/services/waitlistInventory.ts` | `reserveStockForWaitlist`, `releaseWaitlistReservation`, `consumeWaitlistReservation`. |
| Transiciones waitlist | `src/services/waitlistLifecycle.ts` | `updateWaitlistEntryFields`, `markWaitlistEntryCompleted`. |

**Eventos DOM útiles:**

- `customers-updated` — cambió el registro de clientes.
- `customer-ledger-updated` — cambió el libro de cuenta (detalle cliente puede refrescar).
- `waitlist-updated` — cambió la lista de espera.

**Espejo SQLite (POS local):**  
En `src/services/posPersistService.ts`, las claves `KEYS_TO_MIRROR` incluyen entre otras:

- `bizneai-customers-registry`
- `bizneai-customer-account-ledger`
- `bizneai-waitlist`
- `bizneai-waitlist-inventory-reservations`

---

## 4. Lista de espera + inventario (relación con clientes)

- Al **enviar carrito a lista de espera**, si el cliente del carrito tiene `customerId`, puede guardarse en la entrada (`customerId` / `customerInfo.customerId`) para restaurar vínculo al **cargar al carrito**.
- **Reserva:** `reserveStockForWaitlist` descuenta stock en `bizneai-products` (productos por peso o por unidad según `isWeightBased`) y `bizneai-waitlist-inventory-reservations` guarda líneas `{ productId, quantity }` por `_id` de entrada. Si alguna línea no tiene stock suficiente, **no** se modifica catálogo ni se crea la entrada local (toast de error).
- **Sincronización remota:** tras reservar en local, `App` intenta `waitlistAPI.addToShopWaitlist`; si falla, el pedido sigue solo en `localStorage` (comportamiento tolerante a fallos de red).
- **Eliminar tarjeta:** `releaseWaitlistReservation` en `Waitlist.tsx` devuelve stock y actualiza productos.
- **Referencia al pedido en cobro:** `pendingWaitlistEntryIdRef` en `App.tsx` guarda el `_id` al **cargar al carrito** (`fulfillmentState` → `pending_settlement`). Se **limpia** al cerrar el modal de checkout sin pagar, al **vaciar el carrito** (`clearCart`) y tras un cobro exitoso que cierra la entrada.
- **Cobrar tras “Cargar al carrito”:** `consumeWaitlistReservation` elimina la reserva sin tocar stock otra vez; `markWaitlistEntryCompleted` pone `status` y `fulfillmentState` en `completed`. Aplica a **cualquier** método de pago confirmado en checkout (incluido **crédito** si el flujo lo permite).

---

## 5. Endpoints (red)

### 5.1 Origen remoto (bizneai.com)

El cliente desktop usa (directo o vía proxy) la API MCP de BizneAI:

| Método | Ruta remota | Uso clientes |
|--------|-------------|--------------|
| `GET` | `https://www.bizneai.com/api/mcp/:shopId/customers` | Listar / sincronizar clientes. |
| `POST` | `https://www.bizneai.com/api/mcp/:shopId/customers` | Alta de cliente. |
| `PUT` | `https://www.bizneai.com/api/mcp/:shopId/customers/:customerId` | Actualización. |

La construcción de URL en app: `src/utils/mcpResourceUrl.ts` → `buildMcpResourceUrl(shopId, 'customers', …)`.

### 5.2 Proxy local (Electron / dev — evita CORS)

**Archivo:** `server/src/routes/mcpProxyRoutes.ts`  
Base típica: `http://127.0.0.1:3000` (según `getLocalApiOrigin()`).

| Método | Ruta proxy | Destino |
|--------|------------|---------|
| `GET` | `/api/proxy/mcp/:shopId/customers` | `GET https://www.bizneai.com/api/mcp/:shopId/customers` |
| `POST` | `/api/proxy/mcp/:shopId/customers` | `POST …/customers` |
| `PUT` | `/api/proxy/mcp/:shopId/customers/:customerId` | `PUT …/customers/:customerId` |

Otros `GET` MCP genéricos registrados en el mismo router incluyen `products`, `sales`, etc.; el listado completo está en `MCP_GET_SUBPATHS` en ese archivo.

### 5.3 Ventas (crédito y notas)

- Creación de venta: `POST /api/proxy/sales/:shopId` → `POST https://www.bizneai.com/api/:shopId/sales` (según `shouldUseSalesMcpProxy` / configuración en `src/api/sales.ts`).
- El método de pago interno **`credit`** (UI: “Diferir pago”) se conserva en el payload hacia `createSale` como `credit` en el registro local/Merkle; en `normalizePaymentMethod` (`src/api/sales.ts`) se mapea a **`other`** para la API remota, con **notas** que incluyen el matiz de venta a crédito (p. ej. `Venta a crédito (cuenta cliente)`).

### 5.4 Persistencia KV local (SQLite vía API POS)

No son REST “de dominio cliente” dedicados, pero el cliente persiste blobs por clave:

- `PUT /api/pos/kv?key=bizneai-customers-registry`
- `PUT /api/pos/kv?key=bizneai-customer-account-ledger`
- (y análogos para waitlist y reservas cuando aplica el mirror)

---

## 6. Gherkin

Escenarios en formato Gherkin (español):

[modulo-clientes-pos-credito-waitlist.feature](./features/modulo-clientes-pos-credito-waitlist.feature)

---

## 7. Limitaciones y notas

- La **cuenta corriente** y el **libro** son **100 % locales** (localStorage + mirror KV); no hay endpoint REST propio en este repo solo para “ledger” salvo lo que refleje el mirror genérico `/api/pos/kv`.
- El **límite de crédito** (`creditLimitAmount`) se muestra en el subtítulo de la tarjeta “Diferir pago” cuando aplica; la **validación estricta** contra saldo + venta puede añadirse en una iteración posterior.
- Cerrar el **modal de checkout** sin pagar o **vaciar el carrito** **limpia** `pendingWaitlistEntryIdRef`; para cobrar un pedido que venía de lista de espera hay que **volver a “Cargar al carrito”** desde la tarjeta si se perdió la referencia.
- Tras `handleCheckoutComplete`, el cierre de entrada waitlist + consumo de reserva ocurre cuando había `_id` pendiente, **independientemente** del éxito inmediato de la sincronización remota de la venta (la venta puede quedar registrada localmente igualmente).

---

*Última actualización (2026-04-16): Gherkin alineado con reserva por stock, sync remota best-effort de waitlist, cierre de ciclo con cualquier método de pago, limpieza de referencia waitlist al cerrar checkout o vaciar carrito; `deferPayment` + método `credit` en checkout y ventas.*
