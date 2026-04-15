# Sistema de Actualización de Stock MCP

## Resumen
Sistema simplificado para actualizar el stock de un producto específico usando el endpoint MCP (`POST /api/mcp/:shopId/inventory/adjust`).

## Ubicación
**Archivo**: `src/services/mcpInventoryService.ts`

## Función Principal

### `updateProductStockMCP()`

Función simplificada para actualizar el stock de un producto específico usando MCP.

#### Firma
```typescript
export async function updateProductStockMCP(
  productId: string | number,
  quantity: number,
  operation: 'add' | 'subtract' | 'set' = 'set',
  options: UpdateProductStockOptions = {}
): Promise<UpdateProductStockResult>
```

#### Parámetros

1. **productId** (`string | number`)
   - ID local del producto o serverId (MongoDB ObjectId)
   - Si es un ObjectId válido (24 caracteres hex), se usa directamente
   - Si no, busca el producto localmente para obtener el serverId

2. **quantity** (`number`)
   - Si `operation = 'set'`: establece el stock a este valor
   - Si `operation = 'add'`: suma esta cantidad al stock actual
   - Si `operation = 'subtract'`: resta esta cantidad al stock actual

3. **operation** (`'add' | 'subtract' | 'set'`)
   - `'set'`: Establece el stock a un valor específico (default)
   - `'add'`: Suma cantidad al stock actual
   - `'subtract'`: Resta cantidad del stock actual

4. **options** (`UpdateProductStockOptions`)
   ```typescript
   {
     reason?: string;                    // Razón del ajuste
     adjustmentType?: 'sale' | 'return' | 'damage' | 'theft' | 'expired' | 'adjustment' | 'purchase' | 'transfer';
     adjustedBy?: string;                // Quién hizo el ajuste (default: 'Mobile App')
     notes?: string;                     // Notas adicionales
     skipServerIdLookup?: boolean;      // Si true, asume que productId es ya un serverId
   }
   ```

#### Retorno

```typescript
{
  success: boolean;
  productId?: string;        // serverId del producto
  productName?: string;      // Nombre del producto
  previousStock?: number;     // Stock anterior
  newStock?: number;          // Stock nuevo
  operation?: string;         // Operación realizada
  error?: string;             // Mensaje de error si falla
}
```

## Ejemplos de Uso

### 1. Establecer stock a un valor específico
```typescript
import { updateProductStockMCP } from '../src/services/mcpInventoryService';

// Establecer stock a 50 unidades
const result = await updateProductStockMCP(
  '1766519139645',  // productId local
  50,               // cantidad
  'set',            // operación
  {
    reason: 'Ajuste manual de inventario',
    notes: 'Stock corregido después de conteo físico'
  }
);

if (result.success) {
  console.log(`Stock actualizado: ${result.previousStock} → ${result.newStock}`);
} else {
  console.error('Error:', result.error);
}
```

### 2. Agregar stock (restock)
```typescript
// Agregar 10 unidades al stock actual
const result = await updateProductStockMCP(
  '1766519139645',
  10,
  'add',
  {
    reason: 'Restock de proveedor',
    adjustmentType: 'purchase',
    notes: 'Compra #12345'
  }
);
```

### 3. Restar stock (venta/ajuste)
```typescript
// Restar 5 unidades del stock actual
const result = await updateProductStockMCP(
  '1766519139645',
  5,
  'subtract',
  {
    reason: 'Venta realizada',
    adjustmentType: 'sale',
    notes: 'Venta #67890'
  }
);
```

### 4. Usar serverId directamente
```typescript
// Si ya tienes el serverId (MongoDB ObjectId)
const result = await updateProductStockMCP(
  '6941a9085c9919df521c6742',  // serverId directamente
  25,
  'set',
  {
    skipServerIdLookup: true,  // No busca en BD local
    reason: 'Actualización directa'
  }
);
```

### 5. Uso en el Chat BizneAI
```typescript
// Ejemplo de integración en el chat
const handleUpdateStock = async (productId: string, newStock: number) => {
  try {
    const result = await updateProductStockMCP(
      productId,
      newStock,
      'set',
      {
        reason: 'Actualización desde Chat BizneAI',
        adjustedBy: 'Usuario',
        notes: `Stock actualizado a ${newStock} unidades`
      }
    );

    if (result.success) {
      return `✅ Stock actualizado: ${result.productName} ahora tiene ${result.newStock} unidades`;
    } else {
      return `❌ Error: ${result.error}`;
    }
  } catch (error) {
    return `❌ Error al actualizar stock: ${error.message}`;
  }
};
```

## Flujo de Funcionamiento

1. **Validación de Shop ID**
   - Verifica que exista un shopId válido
   - Si no existe, retorna error

2. **Obtención de serverId**
   - Si `skipServerIdLookup = true` y productId es ObjectId válido → usa directamente
   - Si no, busca el producto en BD local por `productId`
   - Si encuentra `serverId` → lo usa
   - Si productId es ObjectId válido → lo usa directamente
   - Si no, busca en servidor por SKU o nombre
   - Si encuentra producto en servidor → obtiene `_id` (serverId)

3. **Validación de serverId**
   - Verifica que serverId sea un ObjectId válido (24 caracteres hex)
   - Si no es válido, retorna error

4. **Creación de Adjustment**
   - Crea un `InventoryAdjustment` con los parámetros
   - Llama a `adjustInventoryOnMCP([adjustment])`

5. **Respuesta**
   - Retorna información del ajuste realizado
   - Incluye stock anterior y nuevo

## Endpoint del Servidor

**POST** `/api/mcp/:shopId/inventory/adjust`

**Body**:
```json
{
  "adjustments": [
    {
      "productId": "6941a9085c9919df521c6742",
      "operation": "set",
      "quantity": 50,
      "reason": "Stock set via MCP",
      "adjustmentType": "adjustment",
      "adjustedBy": "Mobile App",
      "notes": "Updated stock: set 50"
    }
  ]
}
```

**Respuesta**:
```json
{
  "success": true,
  "adjustments": [
    {
      "success": true,
      "productId": "6941a9085c9919df521c6742",
      "productName": "Tijera maped",
      "operation": "set",
      "quantity": 50,
      "previousStock": 10,
      "newStock": 50,
      "reason": "Stock set via MCP"
    }
  ]
}
```

## Manejo de Errores

La función maneja los siguientes casos de error:

1. **No hay shopId válido**
   - Error: `"No valid shop ID found. Please sync your shop settings first."`

2. **Producto no encontrado en servidor**
   - Error: `"Product not found on server. Please sync the product first."`

3. **Producto sin serverId, SKU o nombre**
   - Error: `"Product has no serverId, SKU, or name. Cannot update stock without server connection."`

4. **serverId inválido**
   - Error: `"Invalid serverId. Product must be synced with server first."`

5. **Error del servidor**
   - Retorna el error del servidor en `result.error`

## Logs

La función genera logs detallados:
- `[MCPInventory] Starting product stock update`
- `[MCPInventory] ✅ Found serverId from local product`
- `[MCPInventory] 📤 Updating product stock via MCP`
- `[MCPInventory] ✅ Product stock updated successfully`
- `[MCPInventory] ❌ Failed to update product stock`

## Ventajas sobre `adjustInventoryOnMCP()`

1. **Más simple**: Solo necesita productId local, maneja la búsqueda de serverId internamente
2. **Un solo producto**: Enfocado en actualizar un producto a la vez
3. **Búsqueda automática**: Busca serverId automáticamente si no está disponible
4. **Mejor manejo de errores**: Mensajes de error más descriptivos
5. **Retorno estructurado**: Retorna información completa del ajuste realizado

## Integración con Chat BizneAI

Esta función es ideal para usar en el Chat BizneAI cuando el usuario quiere actualizar el stock de un producto:

```typescript
// En app/bizne-ai.tsx
import { updateProductStockMCP } from '../src/services/mcpInventoryService';

// Ejemplo de uso en una acción del chat
const handleStockUpdate = async (productName: string, newStock: number) => {
  // Buscar producto por nombre
  const products = await getProducts();
  const product = products.find(p => 
    p.name.toLowerCase() === productName.toLowerCase()
  );

  if (!product) {
    return 'Producto no encontrado';
  }

  const result = await updateProductStockMCP(
    product.id,
    newStock,
    'set',
    {
      reason: 'Actualización desde Chat BizneAI',
      adjustedBy: 'Usuario',
      notes: `Stock actualizado a ${newStock} unidades`
    }
  );

  if (result.success) {
    return `✅ Stock de ${result.productName} actualizado: ${result.previousStock} → ${result.newStock} unidades`;
  } else {
    return `❌ Error: ${result.error}`;
  }
};
```

## Notas Importantes

1. **ServerId requerido**: El producto debe tener un serverId (estar sincronizado con el servidor) para poder actualizar el stock
2. **Operación 'set'**: Establece el stock exacto, no suma ni resta
3. **Operación 'add'**: Suma la cantidad al stock actual del servidor
4. **Operación 'subtract'**: Resta la cantidad del stock actual del servidor (no puede ser negativo)
5. **Búsqueda automática**: Si el producto no tiene serverId, intenta buscarlo en el servidor por SKU o nombre

