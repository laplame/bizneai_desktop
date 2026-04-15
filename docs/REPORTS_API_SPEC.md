# Especificación: API de Reportes

Documento para enviar datos de la sección de reportes a la API y arquitectura del backend.

---

## 1. Resumen

La app BizneAI tiene una sección de reportes con:
- **Activos, Pasivos, Capital** (balance)
- **Cuentas por pagar / por cobrar**
- **Estado de resultados**
- **Rotación de productos** (mayor y menor venta)

Este documento define:
1. El payload que el cliente envía a la API
2. La arquitectura de endpoints y modelos en el servidor
3. Flujos de sincronización

---

## 2. Base URL

| Entorno | URL |
|---------|-----|
| Producción | `https://www.bizneai.com/api` |
| Local | `http://localhost:3000/api` |

---

## 3. Payload del cliente (enviar datos)

### 3.1 Endpoint dedicado de reportes

```
POST /api/reports/:shopId
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <api_key>   (opcional)
```

**Body (JSON):**

```json
{
  "timestamp": "2025-03-10T14:30:00.000Z",
  "sourceDeviceId": "device-uuid",
  "clientTimestampUnixMs": 1741612200000,
  "sections": {
    "assets": [
      {
        "id": "1739123456789",
        "concept": "Caja chica",
        "amount": 5000.00,
        "date": "2025-03-10",
        "notes": "Fondo inicial"
      }
    ],
    "liabilities": [],
    "accountsPayable": [
      {
        "id": "1739123456790",
        "concept": "Proveedor X - mercancía",
        "amount": 2000.00,
        "date": "2025-03-01",
        "dueDate": "2025-03-15",
        "notes": "Pago mensual"
      }
    ],
    "accountsReceivable": [],
    "incomeStatement": [],
    "capital": []
  },
  "calculations": {
    "totalAssets": 15000.00,
    "totalLiabilities": 5000.00,
    "capital": 10000.00,
    "inventoryEstimate": 8500.00,
    "totalAccountsPayable": 2000.00,
    "totalAccountsReceivable": 1500.00,
    "calculationFlow": "totalAssets = Σ(activos) = 3 entradas → 15000.00\n..."
  },
  "paymentSchedule": [
    {
      "id": "1739123456790",
      "type": "payable",
      "concept": "Proveedor X - mercancía",
      "amount": 2000.00,
      "dueDate": "2025-03-15",
      "entryDate": "2025-03-01",
      "notes": "Pago mensual",
      "daysUntilDue": 5
    }
  ]
}
```

### 3.2 Esquema del payload (Zod)

```typescript
const reportEntrySchema = z.object({
  id: z.string(),
  concept: z.string(),
  amount: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const reportSectionKeySchema = z.enum([
  'assets', 'liabilities', 'accountsPayable', 'accountsReceivable',
  'incomeStatement', 'capital'
]);

const reportsPayloadSchema = z.object({
  timestamp: z.string().datetime(),
  sourceDeviceId: z.string().optional(),
  clientTimestampUnixMs: z.number().optional(),
  sections: z.record(reportSectionKeySchema, z.array(reportEntrySchema)),
  calculations: z.object({
    totalAssets: z.number(),
    totalLiabilities: z.number(),
    capital: z.number(),
    inventoryEstimate: z.number(),
    totalAccountsPayable: z.number(),
    totalAccountsReceivable: z.number(),
    calculationFlow: z.string(),
  }),
  paymentSchedule: z.array(z.object({
    id: z.string(),
    type: z.enum(['payable', 'receivable']),
    concept: z.string(),
    amount: z.number(),
    dueDate: z.string(),
    entryDate: z.string(),
    notes: z.string().optional(),
    daysUntilDue: z.number().optional(),
  })),
});
```

### 3.3 Payload dentro del export completo

Si el cliente usa `sendDataToServer` (export genérico), el payload incluye:

```json
{
  "timestamp": "...",
  "app_version": "1.0.0",
  "platform": "ios",
  "device_id": "...",
  "data": {
    "metadata": { ... },
    "core_data": { "products": [...], "sales": [...], ... },
    "reports_data": {
      "sections": { ... },
      "calculations": { ... },
      "paymentSchedule": [ ... ]
    }
  }
}
```

El servidor puede extraer `data.reports_data` para procesar reportes.

---

## 4. Arquitectura de la API

### 4.1 Diagrama de flujo

```
┌─────────────────┐                    ┌─────────────────────┐
│   App (cliente) │                    │   Servidor (API)    │
└────────┬────────┘                    └──────────┬──────────┘
         │                                         │
         │ 1. Usuario exporta / envía reportes     │
         │    POST /api/reports/:shopId            │
         │─────────────────────────────────────────>│
         │                                         │
         │                    2. Validar shopId     │
         │                    3. Validar payload    │
         │                    4. Guardar/actualizar │
         │                                         │
         │ 201 OK { success, reportId }            │
         │<─────────────────────────────────────────│
         │                                         │
         │  GET /api/reports/:shopId?page=1&limit=20
         │─────────────────────────────────────────>│
         │                                         │
         │ 200 OK { reports, pagination }           │
         │<─────────────────────────────────────────│
```

### 4.2 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/reports/:shopId` | Recibe reportes |
| GET | `/api/reports/:shopId` | Lista reportes (paginado) |

### 4.3 POST /api/reports/:shopId

**Request:** Ver sección 3.1 o 3.3 (payload completo con data.metadata, data.core_data, data.reports_data)

**Response 201:**
```json
{
  "success": true,
  "data": {
    "reportId": "report_abc123",
    "timestamp": "2025-03-10T14:30:00.000Z",
    "stored": true
  }
}
```

**Response 400:**
```json
{
  "success": false,
  "error": "Invalid payload",
  "details": { ... }
}
```

### 4.4 GET /api/reports/:shopId (paginado)

**Query params:** `page` (default 1), `limit` (default 20, max 100)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "reportId": "...",
        "timestamp": "...",
        "appVersion": "1.0.0",
        "platform": "ios",
        "deviceId": "...",
        "metadata": { ... },
        "coreData": { ... },
        "reportsData": { "sections", "calculations", "paymentSchedule" },
        "createdAt": "..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

## 5. Modelos de datos (servidor)

### 5.1 ShopReport (MongoDB)

```typescript
interface ShopReport {
  _id: ObjectId;
  shopId: ObjectId;
  timestamp: string;
  appVersion: string;
  platform: string;
  deviceId: string;
  metadata: Record<string, unknown>;
  coreData: Record<string, unknown>;
  reportsData: {
    sections: Record<string, ReportEntry[]>;
    calculations: { totalAssets, totalLiabilities, capital, ... };
    paymentSchedule: PaymentScheduleItem[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.2 Estrategia de almacenamiento

- Cada `POST` crea un nuevo documento ShopReport (historial completo).
- `GET` con paginación devuelve los reportes ordenados por `createdAt` descendente.

---

## 6. Integración en el cliente (app)

### 6.1 Servicio para enviar solo reportes

Crear `src/services/reportsApiService.ts`:

```typescript
export async function sendReportsToServer(shopId: string, reportsData: ReportsExportData): Promise<{ success: boolean; error?: string }> {
  const payload = {
    timestamp: new Date().toISOString(),
    sourceDeviceId: await getDeviceId(),
    clientTimestampUnixMs: Date.now(),
    sections: reportsData.sections,
    calculations: reportsData.calculations,
    paymentSchedule: reportsData.paymentSchedule,
  };
  
  const result = await makeApiRequest(`/reports/${shopId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  
  return result.success ? { success: true } : { success: false, error: result.error };
}
```

### 6.2 Cuándo enviar

1. **Manual:** Botón "Enviar reportes" en la sección de reportes.
2. **Con export general:** Ya incluido en `sendDataToServer` dentro de `data.reports_data`.
3. **Automático:** Al cerrar la app o cada X minutos (opcional).

---

## 7. Autenticación y validación

- **shopId:** Debe existir en la base de datos y corresponder a una tienda válida.
- **API Key:** Si el backend exige `Authorization: Bearer <key>`, el cliente debe enviarlo.
- **Validación:** Usar Zod (o similar) para validar el payload antes de persistir.

---

## 8. Extensiones futuras (opcional)

| Extensión | Descripción |
|-----------|-------------|
| Rotación de productos | Incluir `productRotation: { highest: [...], lowest: [...] }` calculado desde ventas |
| Filtro por fecha | `GET /reports?from=2025-03-01&to=2025-03-31` |
| Webhooks | Notificar cuando hay pagos próximos a vencer |
| Export PDF | `GET /reports/latest?format=pdf` |

---

## 9. Resumen de archivos

| Archivo | Rol |
|---------|-----|
| `docs/REPORTS_API_SPEC.md` | Este documento |
| `docs/REPORTS_EXPORT_SPEC.md` | Especificación del formato de export (cliente) |
| `src/services/reportsExportService.ts` | Genera el payload en el cliente |
| `src/services/dataExportService.ts` | Incluye `reports_data` en export completo |
| `server/src/models/ShopReport.ts` | Modelo Mongoose (shopId, timestamp, appVersion, platform, deviceId, metadata, coreData, reportsData) |
| `server/src/routes/shop.ts` | Rutas POST (recibe) y GET (lista paginada) en `/reports/:shopId` |
