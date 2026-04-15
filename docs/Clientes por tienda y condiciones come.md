# Clientes por tienda y condiciones comerciales (opcional)

## Resumen

Los **clientes** (`Customer` en MongoDB) están **acotados por `shopId`**: cada tienda tiene su propio catálogo de clientes (datos fiscales y metadatos comerciales opcionales).

No es obligatorio completar tipo de precio ni condiciones comerciales; el POS y la facturación pueden seguir operando solo con nombre y RFC cuando aplique.

## App móvil (BizneAI)

- Los clientes se guardan en **AsyncStorage** (`customerDatabase`) y se **suben al MCP** con `POST`/`PUT` cuando la tienda tiene `shopId` real (no provisional), **sin depender del flag de ecommerce**.
- Al abrir la pantalla **Clientes**, la app hace `GET /api/mcp/:shopId/customers` y **fusiona** en local (sin borrar clientes solo-locales; conflicto por `updatedAt`).
- Campos opcionales `priceType`, `priceTypeCustomLabel`, `commercialConditions` se persisten en API y local cuando existan en el modelo.

## Rutas

| Uso | Ruta |
|-----|------|
| UI de gestión | `GET /shop/:shopId/customers` (SPA React) |
| API listado | `GET /api/mcp/:shopId/customers?status=active\|inactive` |
| API alta | `POST /api/mcp/:shopId/customers` |
| API actualización | `PUT /api/mcp/:shopId/customers/:customerId` |

`customerId` en la URL es el campo lógico `id` del documento (no el `_id` de MongoDB, salvo que coincidan en integraciones legacy).

## Modelo (campos nuevos / opcionales)

Además de `name`, `rfc`, `status`, `allowCredit`, `notes`, `taxData`:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `priceType` | string opcional | Clave de lista de precios / tier (ej. `general`, `wholesale`, `distributor`, `negotiated`, `custom`). La tienda puede acordar valores; no hay enumeración rígida en BD. |
| `priceTypeCustomLabel` | string opcional | Etiqueta visible cuando el tipo es `custom` o para anotar un alias comercial. |
| `commercialConditions` | objeto opcional | Condiciones de referencia; la aplicación estricta en cobro/POS puede evolucionar después. |

### `commercialConditions` (todas opcionales)

| Campo | Tipo | Notas |
|-------|------|--------|
| `minPurchaseAmount` | number | Monto mínimo de pedido acordado (referencia). |
| `minPurchaseCurrency` | string | Código ISO 4217 (ej. `MXN`). |
| `paymentTermsDays` | number | Plazo de pago en días (ej. 30 = net-30). |
| `creditLimitAmount` | number | Límite de crédito de referencia. |
| `agreedDiscountPercent` | number | Descuento % acordado sobre la lista base. |
| `volumePurchaseNotes` | string | Texto libre: rebates por volumen, escalas según compras, etc. |
| `additionalTerms` | string | Cualquier otra condición. |

Para **borrar** condiciones comerciales ya guardadas, `PUT` puede enviar `"commercialConditions": null`.

## Comportamiento no restrictivo

- Si no envías `priceType` ni `commercialConditions`, el cliente es válido igualmente.
- Los campos son **metadatos** útiles para CRM, facturación y futuras reglas de precio; la lógica de descuentos automáticos en checkout puede integrarse después leyendo estos campos.

## Gherkin

Ver `features/customers_shop_commercial.feature` (escenarios de listado, alta mínima y actualización con condiciones opcionales).
