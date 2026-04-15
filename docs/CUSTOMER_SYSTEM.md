# Customer System Documentation

This document describes the customer system in BizneAI: local storage, CRUD operations, server sync, API endpoints, data flow, and integrations with the cart (payment modal) and waitlist modal.

---

## 1. Overview

The customer system manages customer records for sales, invoicing (CFDI), and waitlist. Data is stored locally first (offline-first), then **pushed to MCP** when the shop is registered, and **pulled** when opening the Customers screen. Ecommerce gating applies to products/sales sync, not to customers.

---

## 2. Customer Interface

### Core Interface (`src/services/customerDatabase.ts`)

```typescript
export interface Customer {
  id: string;                    // Client ID (e.g., "01", "plaza_a1b2c3d4")
  name: string;
  rfc: string;                   // RFC for invoices (e.g., "XAXX010101000")
  status: 'active' | 'inactive';
  allowCredit: boolean;           // Whether this customer can have credit
  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
  notes?: string;
  taxData?: CustomerTaxData;     // Advanced CFDI tax data
  priceType?: string;
  priceTypeCustomLabel?: string;
  commercialConditions?: CustomerCommercialConditions | null;
  salesStats?: {                 // Computed from sales (not persisted to server)
    totalSales: number;
    totalRevenue: number;
    lastSaleDate?: string;
    averageOrderValue: number;
  };
}
```

### Tax Data (CFDI Invoicing)

```typescript
export interface CustomerTaxData {
  rfc: string;
  legalName: string;
  cfdiUse: CFDIUse;              // e.g., "G01 Acquisition of goods"
  taxRegime?: TaxRegime;          // e.g., "601 General de Ley Personas Morales"
  postalCode?: string;
  fiscalAddress?: string;
  email?: string;                 // For invoice delivery
  phone?: string;
}
```

---

## 3. Local Storage

### Storage Keys

| Platform | Key | Purpose |
|----------|-----|---------|
| Web | `customers_data` | `localStorage` |
| React Native | `@BizneAI_customers` | `AsyncStorage` |

### Storage Implementation

- **Web**: Uses `window.localStorage` when available.
- **React Native**: Uses `@react-native-async-storage/async-storage`.
- **In-memory cache**: All operations use an in-memory array (`inMemoryCustomers`) that is persisted to storage on each write.

### Initialization

- Storage initializes on module load via `initStorage()`.
- `ensureStorageInitialized()` is called before every operation.
- Default customer `"01"` (Publico General Nal) is created on first run via `initCustomerDatabase()`.

---

## 4. CRUD Operations

### Create

```typescript
createCustomer(customer: Omit<Customer, 'createdAt' | 'updatedAt' | 'salesStats'>): Promise<Customer>
```

- Validates that the ID does not already exist.
- Sets `createdAt` and `updatedAt`.
- Persists to local storage.
- Emits CRUD event for server sync (non-blocking).
- Rolls back in-memory state if save fails.

### Read

| Function | Description |
|----------|-------------|
| `getCustomers()` | Returns all customers |
| `getCustomerById(id)` | Returns customer by ID or `null` |
| `getCustomerByName(name)` | Returns customer by name (case-insensitive) or `null` |
| `getCustomersWithStats()` | Returns all customers with computed `salesStats` from sales database |

### Update

```typescript
updateCustomer(id: string, updates: Partial<Omit<Customer, 'id' | 'createdAt' | 'salesStats'>>): Promise<Customer>
```

- Updates in-memory and persists.
- Emits CRUD event for server sync.
- Rolls back on save failure.

### Delete (Soft Delete)

```typescript
deleteCustomer(id: string): Promise<boolean>
```

- **Soft delete**: Sets `status: 'inactive'` via `updateCustomer()`.
- Default customer `"01"` cannot be deleted.
- Does **not** emit a `delete` CRUD event; the server receives an `update` with `status: 'inactive'`.

---

## 5. Category and ID Generation Logic

### Format

`categoryName_randomId` (e.g., `plaza_a1b2c3d4`, `mayorista_f3e2d1c0`)

### Algorithm (`app/customers.tsx`)

```typescript
function generateCustomerId(categoryName: string): string {
  const sanitized = (categoryName.trim() || 'general')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    || 'general';
  const randomId = generateUUID().replace(/-/g, '').slice(0, 8);
  return `${sanitized}_${randomId}`;
}
```

### Steps

1. Sanitize category: trim, lowercase, replace non-alphanumeric with `_`, trim leading/trailing `_`.
2. Fallback to `"general"` if empty.
3. Generate 8-character random ID from UUID (hyphens removed).
4. Combine as `sanitized_randomId`.

### Examples

| Category Input | Output |
|---------------|--------|
| `"Plaza"` | `plaza_a1b2c3d4` |
| `"Tienda, Mayorista"` | `tienda_mayorista_f3e2d1c0` |
| `""` | `general_x9y8z7w6` |

---

## 6. Sync to Server via crudEventListenerService

### When sync runs (customers)

- **Customers** push to MCP whenever the shop has a **real `shopId`** (not `provisional-*`). This is **independent of ecommerce**, so fiscal/CRM clients stay on the server per `docs/Clientes por tienda y condiciones come.md`.
- **Products, sales, inventory, …** still require **ecommerce enabled** (unchanged).

### Pull from API (merge local)

- `customerSyncService.syncCustomersFromMcpServer()` calls `GET /mcp/:shopId/customers` and merges rows with `customerDatabase.upsertCustomerFromServerSilently()` (no CRUD emit; last-write-wins by `updatedAt`).
- Invoked when opening the **Customers** screen (`app/customers.tsx`) so local + server stay aligned when online.

### Flow (push)

1. `customerDatabase` calls `emitCRUDEvent('customer', operation, id, payload)` after local persistence.
2. `crudEventListenerService` allows send if `shopId` is registered (see above).
3. Sends `POST` / `PUT` to `/mcp/:shopId/customers`.
4. On failure, the event is queued for retry (`@BizneAI_crud_event_queue`). The queue processes **customer** events even when ecommerce is off, as long as `shopId` is valid.

### Events Emitted

| Operation | When | Payload |
|-----------|------|---------|
| `create` | After `createCustomer()` | Full customer (without `salesStats`) |
| `update` | After `updateCustomer()` | Full customer (without `salesStats`) |
| `delete` | **Not emitted** | Soft delete uses `update` with `status: 'inactive'` |

### Event Queue

- Failed events are stored in AsyncStorage.
- `processEventQueue()` retries on app init or when sync resumes.
- Max 5 retries per event.
- Queue processed in batches of 20.

---

## 7. API Endpoints

**Base URL:** `https://www.bizneai.com/api` (or `EXPO_PUBLIC_API_BASE_URL`)

### POST /mcp/:shopId/customers

Create customer.

| Field | Type | Required |
|-------|------|----------|
| id | string | Yes |
| name | string | Yes |
| rfc | string | Yes |
| status | string | Yes (`active` \| `inactive`) |
| allowCredit | boolean | Yes |
| notes | string | No |
| taxData | object | No |
| priceType | string | No |
| priceTypeCustomLabel | string | No |
| commercialConditions | object \| null | No; send `null` on PUT to clear |

**Service:** `crudEventListenerService` (on create), `customerSyncService` (pull)

---

### GET /mcp/:shopId/customers

Optional query: `?status=active` or `?status=inactive` to filter; omit for all.

**Service:** `customerSyncService.syncCustomersFromMcpServer`

---

### PUT /mcp/:shopId/customers/:customerId

Update customer. Same body as create (partial updates allowed).

**Service:** `crudEventListenerService` (on update, including soft delete)

---

### DELETE /mcp/:shopId/customers/:customerId

Hard delete customer. **Not used by the app**; the app uses soft delete (update to `inactive`).

---

## 8. Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CUSTOMER DATA FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     CRUD      ┌─────────────────────┐
  │   Customers  │ ────────────► │  customerDatabase    │
  │   Screen     │   (create,    │  (in-memory +        │
  │  (customers) │    update,    │   AsyncStorage/      │
  │              │    delete)    │   localStorage)      │
  └──────────────┘               └──────────┬──────────┘
                                            │
                                            │ emitCRUDEvent (non-blocking)
                                            ▼
  ┌──────────────┐               ┌─────────────────────┐
  │    Cart      │  getCustomers  │ crudEventListener   │
  │  (payment &  │ ◄─────────────│ Service             │
  │   waitlist   │               │                     │
  │   modals)    │               │ • ecommerce check    │
  └──────────────┘               │ • shopId check      │
        │                         │ • POST/PUT to API   │
        │                         │ • queue on failure  │
        │                         └──────────┬──────────┘
        │                                    │
        │                                    ▼
        │                         ┌─────────────────────┐
        │                         │  API Server          │
        │                         │  /mcp/:shopId/       │
        │                         │  customers           │
        │                         │  (MongoDB)           │
        │                         └─────────────────────┘
        │
        │  selectedCustomer / customerName
        ▼
  ┌──────────────┐
  │  Sale /      │  customerName, customerEmail, customerPhone
  │  Waitlist    │  from selected Customer or manual input
  └──────────────┘
```

---

## 9. Integration with Cart (Payment Modal)

### Location

`app/cart.tsx` — payment modal (`renderPaymentModal`)

### Behavior

1. **Load customers** when the payment modal opens:
   ```typescript
   useEffect(() => {
     if (showPaymentModal) {
       getCustomers().then(setCustomersForSale).catch(() => setCustomersForSale([]));
     } else {
       setSelectedCustomerForSale(null);
     }
   }, [showPaymentModal]);
   ```

2. **Customer selection**:
   - "Walk-in Customer" chip (no customer selected).
   - Horizontal scroll of customer chips.
   - `selectedCustomerForSale` holds the chosen customer.

3. **Sale creation** uses:
   - `customerName`: `selectedCustomerForSale?.name ?? 'Walk-in Customer'`
   - `customerEmail`: `selectedCustomerForSale?.taxData?.email`
   - `customerPhone`: `selectedCustomerForSale?.taxData?.phone`

4. **UI**: `customerSection`, `customerChip`, `customerChipSelected` styles.

---

## 10. Integration with Waitlist Modal

### Location

`app/cart.tsx` — waitlist modal (`renderWaitlistModal`)

### Behavior

1. **Load customers** when the waitlist modal opens:
   ```typescript
   useEffect(() => {
     if (showWaitlistModal) {
       getCustomers().then(setCustomersForWaitlist).catch(() => setCustomersForWaitlist([]));
     } else {
       setSelectedCustomerForWaitlist(null);
     }
   }, [showWaitlistModal]);
   ```

2. **Customer selection**:
   - "Walk-in Customer" chip (no customer selected).
   - Horizontal scroll of customer chips.
   - Selecting a customer sets `customerName` to `c.name`.

3. **Final customer name**:
   - If table selected: table name (e.g., "Mesa 5").
   - Else: `customerName` (from selected customer or manual input).
   - `customerName` is required when no table is selected.

4. **Waitlist entry** stores `customerInfo` (name, phone, email) for display and future use.

---

## 11. Other Integrations

### TicketTabs (WhatsApp Customer Selector)

`src/components/TicketTabs.tsx` — modal to pick a customer for WhatsApp ticket delivery.

- Uses `getCustomers()` and filters by `taxData?.phone`.
- Search by name or phone.
- Sends ticket to `customer.taxData.phone` via WhatsApp.

### CFDI Invoice Modal

`src/components/CFDIInvoiceModal.tsx` — uses `Customer` for fiscal data when generating CFDI invoices.

---

## 12. Server Model (MongoDB)

`server/src/models/Customer.ts`

```typescript
interface ICustomer {
  shopId: ObjectId;
  id: string;           // App client ID (e.g. plaza_a1b2c3d4)
  name: string;
  rfc: string;
  status: 'active' | 'inactive';
  allowCredit: boolean;
  notes?: string;
  taxData?: { rfc, legalName, cfdiUse, taxRegime, postalCode, fiscalAddress, email, phone };
  createdAt: Date;
  updatedAt: Date;
}
```

- Unique index: `{ shopId: 1, id: 1 }`
- Text index: `{ shopId: 1, name: 'text' }` for search

---

## 13. Related Files

| File | Purpose |
|------|---------|
| `src/services/customerDatabase.ts` | Local storage, CRUD, stats |
| `src/services/crudEventListenerService.ts` | Server sync, event queue |
| `app/customers.tsx` | Customers UI, ID generation |
| `app/cart.tsx` | Payment and waitlist modals |
| `server/src/models/Customer.ts` | MongoDB model |
| `server/src/routes/shop.ts` | MCP customer endpoints |
| `src/utils/uuid.ts` | UUID generation for IDs |
