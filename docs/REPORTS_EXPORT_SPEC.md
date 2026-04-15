# Especificación de Exportación de Reportes

Los datos de la sección de reportes se envían al servidor dentro del payload de exportación general (`sendDataToServer`). El objeto `reports_data` contiene todo el contexto de reportes con totales calculados y calendario de pagos.

## Estructura del payload

```json
{
  "timestamp": "2025-03-10T...",
  "app_version": "1.0.0",
  "platform": "ios",
  "device_id": "...",
  "data": {
    "metadata": { ... },
    "core_data": { ... },
    "reports_data": {
      "sections": { ... },
      "calculations": { ... },
      "paymentSchedule": [ ... ]
    }
  }
}
```

## reports_data

### sections

Entradas por sección del balance:

| Sección | Descripción |
|---------|-------------|
| `assets` | Activos |
| `liabilities` | Pasivos |
| `accountsPayable` | Cuentas por pagar (compras a crédito, deudas) |
| `accountsReceivable` | Cuentas por cobrar (ventas a crédito, por cobrar) |
| `incomeStatement` | Estado de resultados |
| `capital` | Capital |

Cada entrada tiene: `id`, `concept`, `amount`, `date`, `notes?`, `dueDate?` (solo en payable/receivable).

### calculations

Totales calculados y flujo de cálculo:

```json
{
  "totalAssets": 15000.00,
  "totalLiabilities": 5000.00,
  "capital": 10000.00,
  "inventoryEstimate": 8500.00,
  "totalAccountsPayable": 2000.00,
  "totalAccountsReceivable": 1500.00,
  "calculationFlow": "totalAssets = Σ(activos) = 3 entradas → 15000.00\n..."
}
```

- **totalAssets**: Suma de todas las entradas en activos
- **totalLiabilities**: Suma de todas las entradas en pasivos
- **capital**: `totalAssets - totalLiabilities`
- **inventoryEstimate**: Σ(cantidad × precio de venta) por producto en inventario
- **totalAccountsPayable**: Suma de cuentas por pagar
- **totalAccountsReceivable**: Suma de cuentas por cobrar
- **calculationFlow**: Texto con el flujo de cálculo para contexto/AI

### paymentSchedule

Calendario de pagos ordenado por fecha de vencimiento. Incluye:

- **Cuentas por pagar** (compras a crédito, deudas a pagar)
- **Cuentas por cobrar** (ventas a crédito, por cobrar)

Cada ítem:

```json
{
  "id": "entry-id",
  "type": "payable" | "receivable",
  "concept": "Proveedor X - mercancía",
  "amount": 500.00,
  "dueDate": "2025-03-15",
  "entryDate": "2025-03-01",
  "notes": "Pago mensual",
  "daysUntilDue": 5
}
```

- `daysUntilDue`: días hasta vencimiento (negativo = vencido)
- Se usa `dueDate` si existe, sino `date` de la entrada

## API y arquitectura

Para la especificación completa de la API (endpoints, modelos, integración), ver **[REPORTS_API_SPEC.md](./REPORTS_API_SPEC.md)**.

---

## Flujo de datos

1. Usuario agrega entradas en Activos, Pasivos, Cuentas por pagar, Cuentas por cobrar, etc.
2. En Cuentas por pagar/cobrar puede indicar **fecha de vencimiento** (dueDate).
3. Al exportar/enviar al servidor, se incluye:
   - Todas las entradas por sección
   - Totales calculados (activos, pasivos, capital, inventario)
   - Calendario de pagos con fechas de vencimiento
