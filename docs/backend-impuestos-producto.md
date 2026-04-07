# Especificación backend: impuestos por producto

Documento para implementar en el **API/backend de BizneAI** (servidor remoto) los mismos campos de impuesto por producto que ya consume el **desktop POS** (`mapMcpProductToLocal`, cálculo de carrito).

---

## Objetivo

1. Persistir en el documento/recurso de **producto** dos banderas opcionales.
2. Devolverlas en **GET** de productos, **MCP** (`/mcp/:shopId`, listados de productos) y cualquier **sync** que serialice productos.
3. Permitir **crear y actualizar** productos con estos campos (body JSON).

Sin estos campos en el backend remoto, el POS solo puede usarlos si vienen en la respuesta; si el servidor los ignora o los elimina al guardar, se pierden al editar desde el panel.

---

## Campos (schema de producto)**Nombre JSON** | **Tipo** | **Obligatorio** | **Descripción**
---|---|---|---
`priceIncludesTax` | `boolean` | No | Si es `true`, el **precio de venta** de ese SKU **ya incluye** impuesto (ej. IVA). El POS calcula base imponible e impuesto **a partir del total de línea**. Si no se envía, aplica la **regla de tienda** (configuración global de impuestos).
`taxExempt` | `boolean` | No | Si es `true`, la línea **no genera impuesto** (producto exento). Tiene **prioridad** sobre `priceIncludesTax` y sobre la regla de tienda.

### Reglas de negocio

- Si `taxExempt === true` → impuesto de línea = 0.
- Si no es exento y `priceIncludesTax === true` → el importe de línea (precio × cantidad, con variantes según aplique) se trata como **total con impuesto**; el POS desglosa IVA con la tasa configurada en tienda.
- Si no es exento y `priceIncludesTax === false` o **ausente** → se usa la regla global de la tienda (precios con o sin impuesto por defecto).
- Valores inválidos no enviados: no definir el campo; no usar `null` si el stack lo confunde con “falso” — preferir omitir o boolean estricto.

---

## Ejemplos JSON

### Crear / actualizar producto (POST, PUT, PATCH según convención del API)

```json
{
  "name": "Artículo con IVA incluido en precio",
  "price": 116,
  "priceIncludesTax": true,
  "taxExempt": false
}
```

```json
{
  "name": "Medicamento exento",
  "price": 50,
  "taxExempt": true
}
```

Quitar override y volver a heredar solo de tienda (según convención del API):

- Omitir ambos campos en updates parciales, **o**
- Documentar explícitamente si usáis `null` para “revertir a default” (el desktop hoy solo mapea booleanos definidos).

---

## Respuesta GET / serialización

Cada producto devuelto debe incluir los campos cuando existan en base de datos, por ejemplo:

```json
{
  "_id": "…",
  "name": "…",
  "price": 100,
  "priceIncludesTax": true,
  "taxExempt": false,
  "category": "…",
  "stock": 10
}
```

Si el producto nunca tuvo estos campos guardados, pueden omitirse en JSON (equivalente a “usar solo regla de tienda”).

---

## Integración MCP y sync

- Incluir `priceIncludesTax` y `taxExempt` en el objeto producto dentro de la respuesta de **`GET /mcp/:shopId`** (o sub-recurso de productos), igual que otros metadatos (`isWeightBased`, `hasVariants`, etc.).
- Cualquier **webhook** o **export** de catálogo que use el desktop debe preservar estos campos.

---

## Modelo de datos sugerido

- En esquema de producto (Mongo/SQL/Prisma): dos columnas/campos opcionales booleanos, por defecto no definidos o `false` según ORM.
- **Migración**: añadir columnas nullable o con default `false`; productos existentes sin migración explícita se comportan como hoy (solo regla de tienda).

---

## Validación servidor

- Si `taxExempt === true`, se puede **aceptar** `priceIncludesTax` pero el cliente POS **ignora** `priceIncludesTax` (comportamiento ya alineado en `src/utils/taxSettings.ts`).
- Opcional: rechazar body con `taxExempt` y `priceIncludesTax` ambos `true` si queréis simplificar datos; el desktop no lo exige.

---

## Referencia en este repo (desktop)

| Ubicación | Uso |
|-----------|-----|
| `src/utils/taxSettings.ts` | `ProductTaxFields`, `computeCartTaxBreakdownFromCartItems` |
| `src/utils/shopIdHelper.ts` | `mapMcpProductToLocal` lee `priceIncludesTax` y `taxExempt` del JSON MCP |
| `src/types/api.ts` | Tipos TypeScript `Product`, `CreateProductRequest` |
| `server/src/routes/productRoutes.ts` | API **local** de desarrollo con Zod (misma forma de campos) |

La implementación en **producción** debe replicar estos campos en el backend real que sirve `bizneai.com` / MCP.

---

## Checklist backend

- [ ] Modelo + migración de `priceIncludesTax`, `taxExempt`
- [ ] CRUD producto: aceptar y persistir campos
- [ ] Listados y detalle: serializar campos
- [ ] MCP / sync: incluir campos en payload de productos
- [ ] Documentación pública de API (OpenAPI/README interno) actualizada
- [ ] Pruebas: producto exento, precio con IVA incluido, herencia de regla de tienda sin campos

---

*Última alineación con desktop: campos opcionales booleanos; cálculo de impuesto en cliente usa la tasa global de tienda y aplica overrides solo por línea.*
