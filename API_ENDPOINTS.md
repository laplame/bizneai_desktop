# 📡 BizneAI API Endpoints Documentation

Documentación completa de los endpoints disponibles en la API de BizneAI.

## 🔗 URLs Base

- **Producción:** `https://www.bizneai.com`
- **API Base:** `https://www.bizneai.com/api`
- **MCP Base:** `https://www.bizneai.com/api/mcp/{shopId}`

### Tipos de URLs Soportadas

El sistema soporta tres tipos de URLs para identificar el negocio:

1. **URL MCP Directa:**
   ```
   https://www.bizneai.com/api/mcp/691a59f9529b1c88366b342c
   ```

2. **URL de Shop:**
   ```
   https://www.bizneai.com/shop/691a59f9529b1c88366b342c/products
   ```

3. **URL de Restaurant:**
   ```
   https://www.bizneai.com/restaurant/688a83b458e5b457505e70ae/menu
   ```

Todas estas URLs extraen el mismo Shop ID y construyen la URL MCP: `https://www.bizneai.com/api/mcp/{shopId}`

---

## 🏪 MCP (Model Context Protocol) Endpoints

### Base URL
```
https://www.bizneai.com/api/mcp/{shopId}
```

Donde `{shopId}` es el ID del negocio (24 caracteres hexadecimales).

### Obtener Métodos Disponibles
```http
GET /api/mcp/{shopId}/methods
```

**Respuesta:**
```json
{
  "success": true,
  "methods": [
    "getShopData",
    "getProducts",
    "getInventory",
    "getTransactions",
    "getAnalytics"
  ]
}
```

### Obtener Datos Completos del Negocio
```http
GET /api/mcp/{shopId}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "shop": {
      "_id": "691a59f9529b1c88366b342c",
      "storeName": "Papelería Centro Histórico",
      "storeLocation": "Regina",
      "streetAddress": "Regina 96",
      "city": "CDMX",
      "state": "Cuahutemoc",
      "zip": "06000",
      "storeType": "StationeryStore",
      "ecommerceEnabled": true,
      "kitchenEnabled": false,
      "menuSystemEnabled": false,
      "status": "active",
      "customCategories": [],
      "createdAt": "2025-11-16T23:10:49.558Z",
      "updatedAt": "2025-12-02T16:50:11.492Z"
    },
    "metadata": {
      "generatedAt": "2026-01-02T23:21:58.106Z",
      "dataVersion": "1.0.0",
      "includedSections": ["shop", "products", "inventory", "transactions", "analytics"],
      "totalRecords": 17
    },
    "products": [...],
    "inventory": {...},
    "transactions": [...],
    "analytics": {...}
  },
  "message": "Shop data retrieved successfully for MCP integration"
}
```

---

## 🛍️ Shop Endpoints

### Obtener Información de la Tienda
```http
GET /shop/{shopId}
```

### Obtener Productos de la Tienda
```http
GET /shop/{shopId}/products
```

**Parámetros de Query:**
- `page` (opcional): Número de página
- `limit` (opcional): Cantidad de resultados por página
- `category` (opcional): Filtrar por categoría
- `status` (opcional): Filtrar por estado (active, inactive)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "6958499bbb98da0d652f53e9",
        "name": "Bolsa chica c/10",
        "description": "Bolsa chica c/10",
        "price": 72,
        "category": "Other",
        "mainCategory": "general",
        "stock": 0,
        "sku": "SKU_1767393720991_8s4v7jjfd",
        "barcode": "821BEDB5D16D5",
        "status": "active",
        "images": ["https://res.cloudinary.com/..."],
        "isWeightBased": false,
        "salesMethod": "unit",
        "unitOfMeasure": "piece",
        "preparationTime": 0,
        "createdAt": "2026-01-02T22:41:31.907Z",
        "updatedAt": "2026-01-02T22:41:31.907Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 17,
      "pages": 1
    }
  }
}
```

---

## 📦 Product Endpoints

### Crear Producto
```http
POST /api/products
Content-Type: application/json

{
  "name": "Producto Ejemplo",
  "description": "Descripción del producto",
  "price": 100,
  "category": "General",
  "stock": 50,
  "sku": "SKU-001",
  "barcode": "1234567890123"
}
```

### Actualizar Producto
```http
PUT /api/products/{productId}
Content-Type: application/json

{
  "name": "Producto Actualizado",
  "price": 120,
  "stock": 45
}
```

### Eliminar Producto
```http
DELETE /api/products/{productId}
```

---

## 💰 Transaction Endpoints

### Crear Transacción
```http
POST /api/transactions
Content-Type: application/json

{
  "customerName": "Walk-in Customer",
  "items": [
    {
      "productId": "6941a9085c9919df521c6742",
      "productName": "Tijera maped",
      "quantity": 1,
      "unitPrice": 8.5,
      "totalPrice": 8.5
    }
  ],
  "subtotal": 14.5,
  "tax": 0,
  "discount": 0,
  "total": 14.5,
  "paymentMethod": "cash",
  "paymentStatus": "completed",
  "transactionType": "sale",
  "orderType": "dine-in"
}
```

### Obtener Transacciones
```http
GET /api/transactions?shopId={shopId}&page=1&limit=20
```

### Obtener Transacción por ID
```http
GET /api/transactions/{transactionId}
```

---

## 📊 Analytics Endpoints

### Obtener Analytics del Negocio
```http
GET /api/mcp/{shopId}
```

Incluye en la respuesta:
- `analytics.totalSales`: Total de ventas
- `analytics.totalTransactions`: Total de transacciones
- `analytics.averageOrderValue`: Valor promedio de orden
- `analytics.topProducts`: Productos más vendidos
- `analytics.salesByCategory`: Ventas por categoría
- `analytics.salesByPaymentMethod`: Ventas por método de pago

---

## 🔐 Autenticación

### Headers Requeridos
```http
Content-Type: application/json
Accept: application/json
```

### API Key (si es requerido)
```http
X-API-Key: your-api-key-here
```

---

## 🔧 Funciones Helper

### Obtener Shop ID
```typescript
import { getShopId } from '../config/api';

const shopId = getShopId();
if (shopId) {
  // Usar shopId para peticiones
  console.log('Shop ID:', shopId);
} else {
  console.warn('Shop ID no configurado');
}
```

### Obtener URL MCP
```typescript
import { getMcpUrl } from '../config/api';

const mcpUrl = getMcpUrl();
if (mcpUrl) {
  // Usar mcpUrl para peticiones MCP
  const response = await fetch(mcpUrl);
}
```

### Verificar si Shop ID está configurado
```typescript
import { isShopIdConfigured } from '../config/api';

if (isShopIdConfigured()) {
  // Proceder con peticiones que requieren shopId
}
```

### Obtener Datos del Shop desde MCP
```typescript
import { getShopDataFromMcp } from '../config/api';

const shopData = await getShopDataFromMcp();
if (shopData) {
  console.log('Shop:', shopData.shop);
  console.log('Products:', shopData.products);
  console.log('Analytics:', shopData.analytics);
}
```

## 📝 Ejemplos de Uso

### Extraer Shop ID de URL
```javascript
// El sistema soporta tres tipos de URLs:

// 1. URL de Shop
const shopUrl = "https://www.bizneai.com/shop/691a59f9529b1c88366b342c/products";
const shopId1 = shopUrl.match(/\/shop\/([a-f0-9]{24})/)[1];

// 2. URL MCP Directa
const mcpUrl = "https://www.bizneai.com/api/mcp/691a59f9529b1c88366b342c";
const shopId2 = mcpUrl.match(/\/api\/mcp\/([a-f0-9]{24})/)[1];

// 3. URL de Restaurant
const restaurantUrl = "https://www.bizneai.com/restaurant/688a83b458e5b457505e70ae/menu";
const shopId3 = restaurantUrl.match(/\/restaurant\/([a-f0-9]{24})/)[1];

// Todas construyen la misma URL MCP
const mcpBaseUrl = `https://www.bizneai.com/api/mcp/${shopId1}`;
```

### Obtener Métodos MCP
```javascript
const response = await fetch(`${mcpUrl}/methods`);
const data = await response.json();
console.log(data.methods); // ["getShopData", "getProducts", ...]
```

### Obtener Datos Completos
```javascript
const response = await fetch(mcpUrl);
const data = await response.json();
console.log(data.data.shop); // Información de la tienda
console.log(data.data.products); // Lista de productos
console.log(data.data.analytics); // Analytics
```

### Usar Shop ID en Peticiones
```typescript
import { getShopId, getMcpUrl } from '../config/api';

// Ejemplo: Obtener productos usando shopId
const shopId = getShopId();
if (shopId) {
  const response = await fetch(`https://www.bizneai.com/api/mcp/${shopId}`);
  const data = await response.json();
  // Usar data...
}

// Ejemplo: Crear transacción con shopId
const createTransaction = async (transactionData: any) => {
  const shopId = getShopId();
  if (!shopId) {
    throw new Error('Shop ID no configurado');
  }
  
  const response = await fetch(`https://www.bizneai.com/api/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...transactionData,
      shopId
    })
  });
  
  return response.json();
};
```

---

## 🚨 Códigos de Estado HTTP

- `200` - Éxito
- `201` - Creado exitosamente
- `400` - Solicitud inválida
- `401` - No autorizado
- `404` - No encontrado
- `500` - Error del servidor

---

## 📅 Última Actualización

**Fecha:** 2026-01-02  
**Versión:** 1.0.0

---

## 🔗 Referencias

- [BizneAI Website](https://www.bizneai.com)
- [MCP Documentation](https://www.bizneai.com/api/mcp/{shopId}/methods)

---

**Mantenido por:** BizneAI Team

