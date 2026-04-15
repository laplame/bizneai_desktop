# Verificación: Envío de Códigos de Productos al API MCP Server

## 📋 Resumen

Este documento verifica si los **códigos de productos** (`productCode`) se están enviando correctamente al API MCP server.

## ✅ Resultado de la Verificación

**SÍ, los códigos se están enviando correctamente.**

### Mapeo de Campos

- **Campo Local:** `productCode` (definido en `src/types/index.ts`)
- **Campo en JSON enviado:** `barcode` 
- **Ubicación del mapeo:** `src/services/ecommerceUploadService.ts` líneas 831-848

### Código de Mapeo

```typescript
// Map productCode to barcode (productCode is the local field, barcode is the server field)
if (product.productCode && product.productCode.trim() !== '') {
  mcpProduct.barcode = product.productCode.trim();
  console.log('[EcommerceUpload] 📝 Mapping productCode to barcode:', {
    productCode: product.productCode,
    barcode: mcpProduct.barcode,
    productName: product.name
  });
} else if (product.barcode && product.barcode.trim() !== '') {
  mcpProduct.barcode = product.barcode.trim();
}
```

### Endpoint del Servidor

El servidor acepta el campo `barcode` como opcional en:
- **POST** `/api/mcp/:shopId/products` (crear producto)
- **PUT** `/api/mcp/:shopId/products/:productId` (actualizar producto)

**Ubicación en servidor:** `server/src/routes/shop.ts` línea 1622

```typescript
barcode: req.body.barcode ? String(req.body.barcode).trim() : undefined,
```

## 🧪 Cómo Verificar

### Opción 1: Script Automatizado

Ejecutar el script de prueba:

```bash
# Editar el script y reemplazar SHOP_ID con tu shopId válido
nano scripts/test-product-code-curl.sh

# Ejecutar
./scripts/test-product-code-curl.sh
```

### Opción 2: Curl Manual

Reemplazar `YOUR_SHOP_ID` con un shopId válido (24 caracteres hexadecimales):

```bash
curl -X POST "https://www.bizneai.com/api/mcp/YOUR_SHOP_ID/products" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Producto Test con Código",
    "description": "Producto de prueba para verificar campo barcode",
    "price": 99.99,
    "category": "Other",
    "mainCategory": "general",
    "stock": 10,
    "sku": "TEST-SKU-001",
    "barcode": "1234567890123",
    "status": "active",
    "isWeightBased": false
  }'
```

### Respuesta Esperada

**Éxito (201 Created o 200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Producto Test con Código",
    "barcode": "1234567890123",
    "sku": "TEST-SKU-001",
    "price": 99.99,
    ...
  },
  "message": "Product created successfully"
}
```

**Si el producto ya existe (mismo SKU o nombre):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Producto Test con Código",
    "barcode": "1234567890123",
    ...
  },
  "message": "Product updated successfully",
  "wasUpdated": true
}
```

## 📝 Notas Importantes

1. **El campo `productCode` local se mapea automáticamente a `barcode`** en el JSON enviado al servidor
2. **El servidor acepta `barcode` como campo opcional** - no es requerido
3. **Si un producto tiene tanto `productCode` como `barcode`**, se prioriza `productCode`
4. **El servidor valida y guarda el `barcode`** si se proporciona

## 🔍 Logs de Verificación

En la aplicación, puedes verificar los logs cuando se envía un producto:

```
[EcommerceUpload] 📝 Mapping productCode to barcode: {
  productCode: "1234567890123",
  barcode: "1234567890123",
  productName: "Nombre del Producto"
}
```

O si no tiene productCode:

```
[EcommerceUpload] ⚠️ No productCode or barcode found for product: Nombre del Producto
```

## ✅ Conclusión

Los códigos de productos (`productCode`) **SÍ se están enviando** al API MCP server correctamente, mapeados al campo `barcode` en el JSON. El servidor acepta y procesa este campo sin problemas.
