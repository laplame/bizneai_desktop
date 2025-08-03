# 🚀 BizneAI Complete API Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Base Configuration](#base-configuration)
- [Authentication & Headers](#authentication--headers)
- [Response Format](#response-format)
- [Shops Management](#shops-management)
- [Products Management](#products-management)
- [Kitchen Management](#kitchen-management)
- [Waitlist Management](#waitlist-management)
- [Payments Management](#payments-management)
- [Chat Management](#chat-management)
- [Inventory Management](#inventory-management)
- [Tickets Management](#tickets-management)
- [Sales & POS](#sales--pos)
- [Users & Roles](#users--roles)
- [Crypto Payments](#crypto-payments)
- [Image Upload](#image-upload)
- [Testing Examples](#testing-examples)
- [Error Handling](#error-handling)

---

## 📖 Overview

Complete REST API documentation for BizneAI platform. This document covers all endpoints, data models, and examples for the comprehensive business management system.

### 🔧 Base URL
```
Development: http://localhost:3000/api
Production: https://bizneai.com/api
```

### 📊 API Status
- ✅ **Shops Management**: Fully implemented
- ✅ **Products Management**: Fully implemented with image upload
- ✅ **Kitchen Management**: Fully implemented
- ✅ **Waitlist Management**: Fully implemented with shop-specific endpoints
- ✅ **Payments Management**: New implementation with validation
- ✅ **Chat Management**: New implementation with AI response simulation
- ✅ **Inventory Management**: New implementation with bulk operations
- ✅ **Tickets Management**: New implementation for dynamic ticket creation
- ✅ **Sales & POS**: Fully implemented
- ✅ **Users & Roles**: Fully implemented
- ✅ **Crypto Payments**: Fully implemented
- ✅ **Image Upload**: Fully implemented with Cloudinary

---

## 🔐 Authentication & Headers

### Required Headers
```http
Content-Type: application/json
Accept: application/json
```

### Optional Headers
```http
Accept-Language: en|es
Authorization: Bearer <token> (future implementation)
```

---

## 📤 Response Format

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["fieldName"],
      "message": "Field is required"
    }
  ]
}
```

---

## 🏪 Shops Management

### 1. Get All Shops
**`GET /api/shop`**

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `storeType` (optional): Filter by store type
- `status` (optional): Filter by status (active|inactive)
- `city` (optional): Filter by city
- `state` (optional): Filter by state
- `search` (optional): Search by store name
- `ecommerceEnabled` (optional): Filter by ecommerce status
- `kitchenEnabled` (optional): Filter by kitchen status
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): Sort order (asc|desc, default: desc)
- `language` (optional): Language for response

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/shop?storeType=CoffeeShop&status=active&page=1&limit=12"
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6",
      "storeName": "Mi Tienda",
      "storeType": "CoffeeShop",
      "storeLocation": "Centro Comercial",
      "streetAddress": "Av. Principal 123",
      "city": "Ciudad",
      "state": "Estado",
      "zip": "12345",
      "clientId": "client-001",
      "ecommerceEnabled": true,
      "kitchenEnabled": true,
      "crypto": true,
      "acceptedCryptocurrencies": ["bitcoin", "ethereum", "luxae"],
      "status": "active",
      "createdAt": "2025-07-26T19:30:00.000Z",
      "updatedAt": "2025-07-26T19:30:00.000Z"
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 100,
    "limit": 12
  }
}
```

### 2. Create Shop
**`POST /api/shop`**

#### Request Body
```json
{
  "storeName": "Mi Tienda",
  "storeType": "CoffeeShop",
  "storeLocation": "Centro Comercial",
  "streetAddress": "Av. Principal 123",
  "city": "Ciudad",
  "state": "Estado",
  "zip": "12345",
  "clientId": "client-001",
  "ecommerceEnabled": true,
  "kitchenEnabled": true,
  "crypto": true,
  "acceptedCryptocurrencies": ["bitcoin", "ethereum", "luxae"]
}
```

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/shop" \
  -H "Content-Type: application/json" \
  -d '{
    "storeName": "Mi Tienda",
    "storeType": "CoffeeShop",
    "storeLocation": "Centro Comercial",
    "streetAddress": "Av. Principal 123",
    "city": "Ciudad",
    "state": "Estado",
    "zip": "12345",
    "clientId": "client-001",
    "ecommerceEnabled": true,
    "kitchenEnabled": true,
    "crypto": true,
    "acceptedCryptocurrencies": ["bitcoin", "ethereum", "luxae"]
  }'
```

### 3. Get Shop by ID
**`GET /api/shop/:id`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/shop/64f8a1b2c3d4e5f6"
```

### 4. Update Shop
**`PUT /api/shop/:id`**

#### Example Request
```bash
curl -X PUT "https://bizneai.com/api/shop/64f8a1b2c3d4e5f6" \
  -H "Content-Type: application/json" \
  -d '{
    "storeName": "Mi Tienda Actualizada",
    "status": "active"
  }'
```

### 5. Delete Shop
**`DELETE /api/shop/:id`**

#### Example Request
```bash
curl -X DELETE "https://bizneai.com/api/shop/64f8a1b2c3d4e5f6"
```

### 6. Get Store Types
**`GET /api/shop/store-types`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/shop/store-types"
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "CoffeeShop",
      "name": "Coffee Shop",
      "description": "Cafeterías y tiendas de café",
      "icon": "☕"
    },
    {
      "id": "Restaurant",
      "name": "Restaurant",
      "description": "Restaurantes y establecimientos de comida",
      "icon": "🍽️"
    }
  ]
}
```

### 7. Test Shop Endpoint
**`GET /api/shop/test`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/shop/test"
```

---

## 🛍️ Products Management

### 1. Get All Products
**`GET /api/products`**

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (active|inactive)
- `search` (optional): Search by product name
- `category` (optional): Filter by category
- `mainCategory` (optional): Filter by main category
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): Sort order (asc|desc, default: desc)

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/products?mainCategory=coffee_shop&status=active&page=1&limit=12"
```

### 2. Create Product
**`POST /api/products`**

#### Request Body (with image upload)
```json
{
  "name": "Cappuccino Grande",
  "description": "Café espresso con leche espumosa",
  "price": 4.50,
  "cost": 2.25,
  "category": "Bebidas Calientes",
  "mainCategory": "coffee_shop",
  "businessId": "64f8a1b2c3d4e5f6",
  "stock": 100,
  "sku": "CAP-GRD-001",
  "status": "active",
  "brand": "Café Premium"
}
```

#### Example Request (with images)
```bash
curl -X POST "https://bizneai.com/api/products" \
  -F "name=Cappuccino Grande" \
  -F "price=4.50" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

### 3. Get Product by ID
**`GET /api/products/:id`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/products/64f8a1b2c3d4e5f6"
```

### 4. Update Product
**`PUT /api/products/:id`**

#### Example Request
```bash
curl -X PUT "https://bizneai.com/api/products/64f8a1b2c3d4e5f6" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cappuccino Grande Actualizado",
    "price": 5.00
  }'
```

### 5. Delete Product
**`DELETE /api/products/:id`**

#### Example Request
```bash
curl -X DELETE "https://bizneai.com/api/products/64f8a1b2c3d4e5f6"
```

### 6. Upload Product Images
**`POST /api/products/upload-images`**

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/products/upload-images" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

### 7. Add Images to Product
**`POST /api/products/:id/images`**

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/products/64f8a1b2c3d4e5f6/images" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

### 8. Delete Product Image
**`DELETE /api/products/:id/images/:imageIndex`**

#### Example Request
```bash
curl -X DELETE "https://bizneai.com/api/products/64f8a1b2c3d4e5f6/images/0"
```

### 9. Get Categories
**`GET /api/products/categories`**

#### Query Parameters
- `language` (optional): Language for response (en|es)

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/products/categories?language=es"
```

### 10. Get Main Categories
**`GET /api/products/main-categories`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/products/main-categories"
```

### 11. Get Category Statistics
**`GET /api/products/categories/stats`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/products/categories/stats"
```

### 12. Get Products by Category
**`GET /api/products/by-category/:category`**

#### Query Parameters
- `mainCategory` (optional): Filter by main category
- `businessId` (optional): Filter by business ID
- `page` (optional): Page number
- `limit` (optional): Items per page
- `sortBy` (optional): Sort field
- `sortOrder` (optional): Sort order

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/products/by-category/anillos?mainCategory=jewelry&page=1&limit=20"
```

### 13. Test Products Endpoint
**`GET /api/products/test`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/products/test"
```

---

## 👨‍🍳 Kitchen Management

### 1. Get Kitchen Orders
**`GET /api/kitchen/orders`**

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (pending|preparing|ready|completed)
- `priority` (optional): Filter by priority (low|normal|high|urgent)
- `search` (optional): Search by customer name
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): Sort order (asc|desc, default: desc)
- `dateFrom` (optional): Start date filter
- `dateTo` (optional): End date filter
- `shopId` (optional): Filter by shop ID

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/kitchen/orders?shopId=64f8a1b2c3d4e5f6&status=pending&priority=high"
```

### 2. Create Kitchen Order
**`POST /api/kitchen/orders`**

#### Request Body
```json
{
  "shopId": "64f8a1b2c3d4e5f6",
  "customerName": "Juan Pérez",
  "tableNumber": "A5",
  "waiterName": "María García",
  "items": [
    {
      "name": "Cappuccino Grande",
      "quantity": 2,
      "notes": "Sin azúcar"
    }
  ],
  "priority": "normal",
  "estimatedTime": 15,
  "status": "pending"
}
```

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/kitchen/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "64f8a1b2c3d4e5f6",
    "customerName": "Juan Pérez",
    "tableNumber": "A5",
    "waiterName": "María García",
    "items": [
      {
        "name": "Cappuccino Grande",
        "quantity": 2,
        "notes": "Sin azúcar"
      }
    ],
    "priority": "normal",
    "estimatedTime": 15,
    "status": "pending"
  }'
```

### 3. Get Kitchen Order by ID
**`GET /api/kitchen/orders/:id`**

#### Query Parameters
- `shopId` (required): Shop ID

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/kitchen/orders/64f8a1b2c3d4e5f6?shopId=64f8a1b2c3d4e5f6"
```

### 4. Update Kitchen Order
**`PUT /api/kitchen/orders/:id`**

#### Query Parameters
- `shopId` (required): Shop ID

#### Example Request
```bash
curl -X PUT "https://bizneai.com/api/kitchen/orders/64f8a1b2c3d4e5f6?shopId=64f8a1b2c3d4e5f6" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "preparing",
    "estimatedTime": 10
  }'
```

### 5. Partial Update Kitchen Order
**`PATCH /api/kitchen/orders/:id`**

#### Query Parameters
- `shopId` (required): Shop ID

#### Example Request
```bash
curl -X PATCH "https://bizneai.com/api/kitchen/orders/64f8a1b2c3d4e5f6?shopId=64f8a1b2c3d4e5f6" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

### 6. Delete Kitchen Order
**`DELETE /api/kitchen/orders/:id`**

#### Query Parameters
- `shopId` (required): Shop ID

#### Example Request
```bash
curl -X DELETE "https://bizneai.com/api/kitchen/orders/64f8a1b2c3d4e5f6?shopId=64f8a1b2c3d4e5f6"
```

---

## 📋 Waitlist Management

### 1. Add Item to Shop Waitlist
**`POST /api/waitlist/shop/:shopId`**

#### Request Body
```json
{
  "name": "John Doe",
  "items": [
    {
      "product": {
        "id": "prod_123",
        "name": "Cappuccino",
        "price": 4.50,
        "category": "beverages"
      },
      "quantity": 2
    }
  ],
  "total": 9.00,
  "source": "local",
  "status": "waiting",
  "notes": "Extra hot please",
  "customerInfo": {
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com"
  }
}
```

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/waitlist/shop/688526630b5dfbfe4fabacea" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "items": [{
      "product": {
        "id": "1",
        "name": "Test Item",
        "price": 12,
        "category": "test"
      },
      "quantity": 1
    }],
    "total": 12,
    "source": "local"
  }'
```

### 2. Get Waitlist Entries
**`GET /api/waitlist/entries?shopId=:shopId`**

#### Query Parameters
- `shopId` (required): Shop identifier
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `source` (optional): Filter by source (local|online)
- `status` (optional): Filter by status (waiting|preparing|ready|completed)
- `search` (optional): Search by customer name
- `sortBy` (optional): Sort field (default: timestamp)
- `sortOrder` (optional): Sort order (asc|desc, default: desc)

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/waitlist/entries?shopId=688526630b5dfbfe4fabacea&status=waiting"
```

### 3. Add Customer to Waitlist (Legacy)
**`POST /api/waitlist`**

#### Request Body
```json
{
  "customerName": "Ana López",
  "phoneNumber": "+1234567890",
  "partySize": 4,
  "estimatedWaitTime": 20,
  "shopId": "64f8a1b2c3d4e5f6"
}
```

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/waitlist" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Ana López",
    "phoneNumber": "+1234567890",
    "partySize": 4,
    "estimatedWaitTime": 20,
    "shopId": "64f8a1b2c3d4e5f6"
  }'
```

### 4. Get All Waitlist Entries
**`GET /api/waitlist`**

#### Query Parameters
- `shopId` (optional): Filter by shop ID
- `status` (optional): Filter by status
- `page` (optional): Page number
- `limit` (optional): Items per page

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/waitlist?shopId=64f8a1b2c3d4e5f6&status=waiting"
```

### 5. Add Item to Waitlist with Details
**`POST /api/waitlist/entries`**

#### Request Body
```json
{
  "customerName": "Carlos Ruiz",
  "phoneNumber": "+1234567890",
  "partySize": 2,
  "estimatedWaitTime": 15,
  "shopId": "64f8a1b2c3d4e5f6",
  "notes": "Mesa cerca de la ventana"
}
```

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/waitlist/entries" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Carlos Ruiz",
    "phoneNumber": "+1234567890",
    "partySize": 2,
    "estimatedWaitTime": 15,
    "shopId": "64f8a1b2c3d4e5f6",
    "notes": "Mesa cerca de la ventana"
  }'
```

### 6. Load Waitlist Item to Cart
**`POST /api/waitlist/entries/:id/load`**

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/waitlist/entries/64f8a1b2c3d4e5f6/load"
```

### 7. Receive Online Order
**`POST /api/waitlist/online-orders`**

#### Request Body
```json
{
  "customerName": "Laura Martínez",
  "phoneNumber": "+1234567890",
  "items": [
    {
      "name": "Cappuccino Grande",
      "quantity": 2,
      "price": 4.50
    }
  ],
  "totalAmount": 9.00,
  "orderType": "pickup",
  "shopId": "64f8a1b2c3d4e5f6"
}
```

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/waitlist/online-orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Laura Martínez",
    "phoneNumber": "+1234567890",
    "items": [
      {
        "name": "Cappuccino Grande",
        "quantity": 2,
        "price": 4.50
      }
    ],
    "totalAmount": 9.00,
    "orderType": "pickup",
    "shopId": "64f8a1b2c3d4e5f6"
  }'
```

### 8. Get Waitlist Statistics
**`GET /api/waitlist/stats?shopId=:shopId`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/waitlist/stats?shopId=688526630b5dfbfe4fabacea"
```

---

## 💳 Payments Management

### 1. Process Payment
**`POST /api/payments/shop/:shopId`**

#### Request Body
```json
{
  "type": "sale",
  "amount": 25.50,
  "currency": "USD",
  "paymentMethod": "card",
  "status": "completed",
  "description": "Coffee and pastry order",
  "transactionId": "txn_123456789",
  "metadata": {
    "customerId": "cust_123",
    "orderId": "order_456"
  }
}
```

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/payments/shop/688526630b5dfbfe4fabacea" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sale",
    "amount": 25,
    "currency": "USD",
    "paymentMethod": "cash",
    "status": "completed"
  }'
```

### 2. Get Payment History
**`GET /api/payments/shop/:shopId`**

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status
- `paymentMethod` (optional): Filter by payment method
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/payments/shop/688526630b5dfbfe4fabacea?status=completed"
```

### 3. Get Payment Statistics
**`GET /api/payments/shop/:shopId/stats`**

#### Query Parameters
- `period` (optional): Time period (default: 30d)

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/payments/shop/688526630b5dfbfe4fabacea/stats?period=30d"
```

#### Response
```json
{
  "success": true,
  "data": {
    "totalAmount": 1250.75,
    "totalTransactions": 45,
    "averageAmount": 27.79,
    "byPaymentMethod": {
      "card": 30,
      "cash": 10,
      "crypto": 5
    },
    "byStatus": {
      "completed": 40,
      "pending": 3,
      "failed": 2
    },
    "period": "30d"
  }
}
```

---

## 💬 Chat Management

### 1. Send Chat Message
**`POST /api/chat/shop/:shopId`**

#### Request Body
```json
{
  "content": "Hello, I have a question about your menu",
  "context": {
    "businessType": "restaurant",
    "customerId": "cust_123",
    "sessionId": "session_456"
  },
  "senderType": "customer",
  "messageType": "text",
  "metadata": {
    "device": "mobile",
    "location": "customer_location"
  }
}
```

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/chat/shop/688526630b5dfbfe4fabacea" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, this is a test message",
    "context": {
      "businessType": "restaurant"
    }
  }'
```

#### Response
```json
{
  "success": true,
  "data": {
    "message": {
      "_id": "msg_1753557547767",
      "content": "Hello, I have a question about your menu",
      "context": {
        "businessType": "restaurant",
        "customerId": "cust_123"
      },
      "shopId": "shop_456",
      "senderType": "customer",
      "messageType": "text",
      "timestamp": "2025-07-26T19:19:07.767Z",
      "status": "sent"
    },
    "aiResponse": {
      "_id": "ai_1753557547767",
      "content": "Gracias por tu mensaje: \"Hello, I have a question about your menu\". Un representante de la tienda te responderá pronto.",
      "context": {
        "businessType": "restaurant"
      },
      "shopId": "shop_456",
      "senderType": "ai",
      "messageType": "text",
      "timestamp": "2025-07-26T19:19:07.767Z",
      "status": "sent"
    }
  },
  "message": "Message sent successfully"
}
```

### 2. Get Chat History
**`GET /api/chat/shop/:shopId`**

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `sessionId` (optional): Filter by session
- `customerId` (optional): Filter by customer
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/chat/shop/688526630b5dfbfe4fabacea?limit=50"
```

### 3. Get Active Sessions
**`GET /api/chat/shop/:shopId/sessions`**

#### Query Parameters
- `status` (optional): Filter by status (default: active)

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/chat/shop/688526630b5dfbfe4fabacea/sessions?status=active"
```

### 4. Close Chat Session
**`POST /api/chat/shop/:shopId/sessions/:sessionId/close`**

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/chat/shop/688526630b5dfbfe4fabacea/sessions/session_123/close"
```

---

## 📦 Inventory Management

### 1. Update Inventory
**`POST /api/inventory/shop/:shopId`**

#### Request Body
```json
{
  "productId": "prod_123",
  "quantity": 10,
  "action": "add",
  "reason": "Restock from supplier",
  "locationId": "loc_456",
  "notes": "Fresh batch received",
  "metadata": {
    "supplierId": "supp_789",
    "batchNumber": "BATCH_2025_001"
  }
}
```

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/inventory/shop/688526630b5dfbfe4fabacea" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "1",
    "quantity": 10,
    "action": "add",
    "reason": "Test restock"
  }'
```

### 2. Get Inventory Status
**`GET /api/inventory/shop/:shopId`**

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `locationId` (optional): Filter by location
- `lowStock` (optional): Filter low stock items (true|false)
- `outOfStock` (optional): Filter out of stock items (true|false)

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/inventory/shop/688526630b5dfbfe4fabacea?lowStock=true"
```

### 3. Get Inventory Alerts
**`GET /api/inventory/shop/:shopId/alerts`**

#### Query Parameters
- `type` (optional): Filter by alert type (default: all)

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/inventory/shop/688526630b5dfbfe4fabacea/alerts?type=all"
```

### 4. Get Inventory Statistics
**`GET /api/inventory/shop/:shopId/stats`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/inventory/shop/688526630b5dfbfe4fabacea/stats"
```

#### Response
```json
{
  "success": true,
  "data": {
    "totalProducts": 150,
    "lowStockItems": 12,
    "outOfStockItems": 3,
    "totalValue": 25000.75,
    "lastUpdated": "2025-07-26T19:19:11.510Z"
  }
}
```

### 5. Bulk Inventory Update
**`POST /api/inventory/shop/:shopId/bulk-update`**

#### Request Body
```json
{
  "updates": [
    {
      "productId": "prod_123",
      "quantity": 10,
      "action": "add",
      "reason": "Restock"
    },
    {
      "productId": "prod_456",
      "quantity": 5,
      "action": "remove",
      "reason": "Damaged items"
    }
  ]
}
```

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/inventory/shop/688526630b5dfbfe4fabacea/bulk-update" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      {
        "productId": "prod_123",
        "quantity": 10,
        "action": "add",
        "reason": "Restock"
      },
      {
        "productId": "prod_456",
        "quantity": 5,
        "action": "remove",
        "reason": "Damaged items"
      }
    ]
  }'
```

---

## 🎫 Tickets Management

### 1. Get Ticket
**`GET /api/tickets/:shopId/:saleId`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/tickets/688526630b5dfbfe4fabacea/sale_123"
```

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "ticket_1753557547767",
    "shopId": "688526630b5dfbfe4fabacea",
    "saleId": "sale_123",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+1234567890",
    "items": [
      {
        "productId": "prod_123",
        "name": "Cappuccino Grande",
        "quantity": 2,
        "price": 4.50,
        "total": 9.00
      }
    ],
    "subtotal": 9.00,
    "tax": 0.90,
    "total": 9.90,
    "paymentMethod": "card",
    "status": "completed",
    "createdAt": "2025-07-26T19:19:07.767Z",
    "updatedAt": "2025-07-26T19:19:07.767Z"
  }
}
```

### 2. Create Ticket
**`POST /api/tickets/:shopId/:saleId`**

#### Request Body
```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "items": [
    {
      "productId": "prod_123",
      "name": "Cappuccino Grande",
      "quantity": 2,
      "price": 4.50,
      "total": 9.00
    }
  ],
  "subtotal": 9.00,
  "tax": 0.90,
  "total": 9.90,
  "paymentMethod": "card",
  "status": "completed",
  "notes": "Extra hot please",
  "metadata": {
    "orderType": "dine-in",
    "tableNumber": "A5"
  }
}
```

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/tickets/688526630b5dfbfe4fabacea/sale_123" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+1234567890",
    "items": [
      {
        "productId": "prod_123",
        "name": "Cappuccino Grande",
        "quantity": 2,
        "price": 4.50,
        "total": 9.00
      }
    ],
    "subtotal": 9.00,
    "tax": 0.90,
    "total": 9.90,
    "paymentMethod": "card",
    "status": "completed"
  }'
```

### 3. Update Ticket
**`PUT /api/tickets/:shopId/:saleId`**

#### Example Request
```bash
curl -X PUT "https://bizneai.com/api/tickets/688526630b5dfbfe4fabacea/sale_123" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "refunded",
    "notes": "Customer requested refund"
  }'
```

### 4. Delete Ticket
**`DELETE /api/tickets/:shopId/:saleId`**

#### Example Request
```bash
curl -X DELETE "https://bizneai.com/api/tickets/688526630b5dfbfe4fabacea/sale_123"
```

### 5. Get All Shop Tickets
**`GET /api/tickets/shop/:shopId`**

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter
- `customerName` (optional): Search by customer name

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/tickets/shop/688526630b5dfbfe4fabacea?status=completed"
```

### 6. Get Ticket Statistics
**`GET /api/tickets/shop/:shopId/stats`**

#### Query Parameters
- `period` (optional): Time period (default: 30d)

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/tickets/shop/688526630b5dfbfe4fabacea/stats?period=30d"
```

#### Response
```json
{
  "success": true,
  "data": {
    "totalTickets": 150,
    "totalSales": 2500.75,
    "averageTicketValue": 16.67,
    "byStatus": {
      "completed": 140,
      "pending": 5,
      "cancelled": 3,
      "refunded": 2
    },
    "byPaymentMethod": {
      "card": 100,
      "cash": 30,
      "crypto": 15,
      "mobile": 5
    },
    "period": "30d"
  }
}
```

---

## 💰 Sales & POS

### 1. Create Order
**`POST /api/orders`**

#### Request Body
```json
{
  "userId": "user123",
  "items": [
    {
      "productId": "64f8a1b2c3d4e5f6",
      "name": "Cappuccino Grande",
      "quantity": 2,
      "price": 4.50,
      "shippingAddress": {
        "street": "123 Main St",
        "city": "Ciudad",
        "state": "Estado",
        "country": "País",
        "zipCode": "12345"
      },
      "paymentMethod": "card"
    }
  ],
  "totalAmount": 9.00,
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Ciudad",
    "state": "Estado",
    "country": "País",
    "zipCode": "12345"
  },
  "paymentMethod": "card"
}
```

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "items": [
      {
        "productId": "64f8a1b2c3d4e5f6",
        "name": "Cappuccino Grande",
        "quantity": 2,
        "price": 4.50,
        "shippingAddress": {
          "street": "123 Main St",
          "city": "Ciudad",
          "state": "Estado",
          "country": "País",
          "zipCode": "12345"
        },
        "paymentMethod": "card"
      }
    ],
    "totalAmount": 9.00,
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Ciudad",
      "state": "Estado",
      "country": "País",
      "zipCode": "12345"
    },
    "paymentMethod": "card"
  }'
```

### 2. Get User Orders
**`GET /api/orders/:userId`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/orders/user123"
```

### 3. Get Order by Order Number
**`GET /api/orders/order/:orderNumber`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/orders/order/ORD-1234567890-ABC12"
```

### 4. Update Order Status
**`PATCH /api/orders/:orderNumber`**

#### Request Body
```json
{
  "status": "completed",
  "paymentStatus": "paid"
}
```

#### Example Request
```bash
curl -X PATCH "https://bizneai.com/api/orders/ORD-1234567890-ABC12" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "paymentStatus": "paid"
  }'
```

### 5. Cancel Order
**`DELETE /api/orders/:orderNumber`**

#### Example Request
```bash
curl -X DELETE "https://bizneai.com/api/orders/ORD-1234567890-ABC12"
```

### 6. Create Stripe Checkout Session
**`POST /api/stripe/create-checkout-session`**

#### Request Body
```json
{
  "items": [
    {
      "price": "price_H5ggYwtDq4fbrJ",
      "quantity": 2
    }
  ],
  "success_url": "https://example.com/success",
  "cancel_url": "https://example.com/cancel"
}
```

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/stripe/create-checkout-session" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "price": "price_H5ggYwtDq4fbrJ",
        "quantity": 2
      }
    ],
    "success_url": "https://example.com/success",
    "cancel_url": "https://example.com/cancel"
  }'
```

### 7. Handle Stripe Webhooks
**`POST /api/stripe/webhook`**

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/stripe/webhook" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## 👥 Users & Roles

### 1. Create User
**`POST /api/users`**

#### Request Body
```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "companyName": "Mi Empresa",
  "businessType": "CoffeeShop",
  "message": "Interesado en el sistema",
  "userId": "user123",
  "userLocation": "Ciudad, Estado"
}
```

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "companyName": "Mi Empresa",
    "businessType": "CoffeeShop",
    "message": "Interesado en el sistema",
    "userId": "user123",
    "userLocation": "Ciudad, Estado"
  }'
```

### 2. Get All Users
**`GET /api/users`**

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search by name or email
- `businessType` (optional): Filter by business type
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): Sort order (asc|desc, default: desc)

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/users?businessType=CoffeeShop&page=1&limit=20"
```

### 3. Get User by ID
**`GET /api/users/:id`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/users/64f8a1b2c3d4e5f6"
```

### 4. Check User by Email
**`GET /api/users/email/:email`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/users/email/juan@example.com"
```

### 5. Check User by User ID
**`GET /api/users/userId/:userId`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/users/userId/user123"
```

### 6. Get User Statistics
**`GET /api/users/stats/overview`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/users/stats/overview"
```

### 7. Create Distributor Application
**`POST /api/distributors/signup`**

#### Request Body
```json
{
  "firstName": "María",
  "lastName": "García",
  "email": "maria@example.com",
  "phone": "+1234567890",
  "companyName": "Distribuidora ABC",
  "businessType": "Technology",
  "territory": "Norte",
  "experience": "5+ años",
  "message": "Interesada en distribuir BizneAI"
}
```

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/distributors/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "María",
    "lastName": "García",
    "email": "maria@example.com",
    "phone": "+1234567890",
    "companyName": "Distribuidora ABC",
    "businessType": "Technology",
    "territory": "Norte",
    "experience": "5+ años",
    "message": "Interesada en distribuir BizneAI"
  }'
```

### 8. Distributor Login
**`POST /api/distributors/login`**

#### Request Body
```json
{
  "username": "maria_garcia",
  "password": "securepassword123"
}
```

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/distributors/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "maria_garcia",
    "password": "securepassword123"
  }'
```

### 9. Get Distributor Dashboard
**`GET /api/distributors/dashboard/:id`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/distributors/dashboard/64f8a1b2c3d4e5f6"
```

---

## 📊 User Stats

### 1. Get User Statistics
**`GET /api/:userId/stats`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/USER_ID/stats"
```

#### Response
```json
{
  "success": true,
  "data": {
    "userId": "USER_ID",
    "totalOrders": 5,
    "totalSales": 1234.56,
    "products": [
      {
        "productId": "...",
        "name": "...",
        "category": "...",
        "mainCategory": "...",
        "totalPurchased": 10,
        "totalSpent": 200,
        "currentStock": 15,
        "status": "in_stock"
      }
    ]
  }
}
```

---

## ₿ Crypto Payments

### 1. Get Shop Crypto Settings
**`GET /api/shop/:id/crypto`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/shop/64f8a1b2c3d4e5f6/crypto"
```

### 2. Update Shop Crypto Settings
**`PUT /api/shop/:id/crypto`**

#### Request Body
```json
{
  "crypto": true,
  "cryptoAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "acceptedCryptocurrencies": ["bitcoin", "ethereum", "solana", "tether", "xrp", "worldcoin", "luxae"]
}
```

#### Example Request
```bash
curl -X PUT "https://bizneai.com/api/shop/64f8a1b2c3d4e5f6/crypto" \
  -H "Content-Type: application/json" \
  -d '{
    "crypto": true,
    "cryptoAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "acceptedCryptocurrencies": ["bitcoin", "ethereum", "solana", "tether", "xrp", "worldcoin", "luxae"]
  }'
```

### 3. Process Crypto Payment
**`POST /api/orders/crypto-payment`**

#### Request Body
```json
{
  "orderId": "64f8a1b2c3d4e5f6",
  "cryptocurrency": "bitcoin",
  "amount": 0.001,
  "walletAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "transactionHash": "0x1234567890abcdef..."
}
```

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/orders/crypto-payment" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "64f8a1b2c3d4e5f6",
    "cryptocurrency": "bitcoin",
    "amount": 0.001,
    "walletAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "transactionHash": "0x1234567890abcdef..."
  }'
```

### 4. Get Crypto Exchange Rates
**`GET /api/crypto/rates`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/crypto/rates"
```

### 5. Get Supported Cryptocurrencies
**`GET /api/crypto/supported`**

#### Example Request
```bash
curl -X GET "https://bizneai.com/api/crypto/supported"
```

---

## 📸 Image Upload

### 1. Upload Product Images
**`POST /api/products/upload-images`**

#### Request Body (multipart/form-data)
- `images` (required): Array of image files (max 5, 10MB each)

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/products/upload-images" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

#### Response
```json
{
  "success": true,
  "data": {
    "urls": [
      "https://res.cloudinary.com/cloud-name/image/upload/v1234567890/products/image1.jpg",
      "https://res.cloudinary.com/cloud-name/image/upload/v1234567890/products/image2.jpg"
    ],
    "publicIds": [
      "products/image1",
      "products/image2"
    ]
  }
}
```

### 2. Add Images to Product
**`POST /api/products/:id/images`**

#### Example Request
```bash
curl -X POST "https://bizneai.com/api/products/64f8a1b2c3d4e5f6/images" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

### 3. Delete Product Image
**`DELETE /api/products/:id/images/:imageIndex`**

#### Example Request
```bash
curl -X DELETE "https://bizneai.com/api/products/64f8a1b2c3d4e5f6/images/0"
```

---

## 🧪 Testing Examples

### Using cURL

#### Test Shops
```bash
# Get all shops
curl -X GET "https://bizneai.com/api/shop?storeType=CoffeeShop&status=active"

# Create shop
curl -X POST "https://bizneai.com/api/shop" \
  -H "Content-Type: application/json" \
  -d '{
    "storeName": "Test Shop",
    "storeType": "CoffeeShop",
    "storeLocation": "Test Location",
    "streetAddress": "123 Test St",
    "city": "Test City",
    "state": "Test State",
    "zip": "12345",
    "clientId": "test-001",
    "ecommerceEnabled": true,
    "kitchenEnabled": true
  }'
```

#### Test Products
```bash
# Get products
curl -X GET "https://bizneai.com/api/products?mainCategory=coffee_shop&status=active"

# Create product
curl -X POST "https://bizneai.com/api/products" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "Test description",
    "price": 10.00,
    "category": "Test Category",
    "mainCategory": "coffee_shop",
    "businessId": "64f8a1b2c3d4e5f6",
    "stock": 100,
    "status": "active"
  }'
```

#### Test Waitlist
```bash
# Add to waitlist
curl -X POST "https://bizneai.com/api/waitlist/shop/688526630b5dfbfe4fabacea" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "items": [{
      "product": {
        "id": "1",
        "name": "Test Item",
        "price": 12,
        "category": "test"
      },
      "quantity": 1
    }],
    "total": 12,
    "source": "local"
  }'
```

#### Test Payments
```bash
# Process payment
curl -X POST "https://bizneai.com/api/payments/shop/688526630b5dfbfe4fabacea" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sale",
    "amount": 25,
    "currency": "USD",
    "paymentMethod": "cash",
    "status": "completed"
  }'
```

#### Test Chat
```bash
# Send chat message
curl -X POST "https://bizneai.com/api/chat/shop/688526630b5dfbfe4fabacea" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, this is a test message",
    "context": {
      "businessType": "restaurant"
    }
  }'
```

#### Test Inventory
```bash
# Update inventory
curl -X POST "https://bizneai.com/api/inventory/shop/688526630b5dfbfe4fabacea" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "1",
    "quantity": 10,
    "action": "add",
    "reason": "Test restock"
  }'
```

#### Test Tickets
```bash
# Create ticket
curl -X POST "https://bizneai.com/api/tickets/688526630b5dfbfe4fabacea/sale_123" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "items": [
      {
        "productId": "prod_123",
        "name": "Cappuccino Grande",
        "quantity": 2,
        "price": 4.50,
        "total": 9.00
      }
    ],
    "subtotal": 9.00,
    "tax": 0.90,
    "total": 9.90,
    "paymentMethod": "card",
    "status": "completed"
  }'
```

### Using JavaScript/Fetch

```javascript
// Example: Process payment
const processPayment = async (shopId, paymentData) => {
  try {
    const response = await fetch(`https://bizneai.com/api/payments/shop/${shopId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Payment processed:', result.data);
      return result.data;
    } else {
      console.error('Payment failed:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
};

// Usage
const paymentData = {
  type: 'sale',
  amount: 25.50,
  currency: 'USD',
  paymentMethod: 'card',
  status: 'completed',
  description: 'Coffee order'
};

processPayment('shop_123', paymentData);
```

---

## ⚠️ Error Handling

### Common Error Codes

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid payment data",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["amount"],
      "message": "Required"
    }
  ]
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Shop not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to process payment"
}
```

### Validation Errors

The API uses Zod for validation. Common validation errors include:

- **Missing required fields**
- **Invalid data types**
- **Invalid enum values**
- **String length violations**
- **Number range violations**

---

## 🔧 Development Notes

### Current Implementation Status

#### ✅ Fully Implemented
- **Shops Management**: Complete with MongoDB integration
- **Products Management**: Complete with image upload and Cloudinary
- **Kitchen Management**: Complete with real-time updates
- **Waitlist Management**: Complete with shop-specific endpoints
- **Sales & POS**: Complete with Stripe integration
- **Users & Roles**: Complete with distributor management
- **Crypto Payments**: Complete with multiple cryptocurrency support
- **Image Upload**: Complete with Cloudinary optimization

#### ⚠️ Partially Implemented (Simulated)
- **Payments Routes**: Validation and response structure complete, payment processing simulated
- **Chat Routes**: Message handling complete, AI response simulated
- **Inventory Routes**: Validation complete, database operations simulated
- **Tickets Routes**: Validation complete, database operations simulated

### Database Integration

#### Current Models
- `Shop`: Fully integrated with MongoDB
- `Product`: Fully integrated with MongoDB
- `KitchenOrder`: Fully integrated with MongoDB
- `WaitlistEntry`: Fully integrated with MongoDB
- `User`: Fully integrated with MongoDB
- `Payment`: Not yet created (simulated responses)
- `ChatMessage`: Not yet created (simulated responses)
- `InventoryUpdate`: Not yet created (simulated responses)
- `Ticket`: Not yet created (simulated responses)

#### Next Steps for Full Implementation
1. Create MongoDB models for Payment, ChatMessage, InventoryUpdate, and Ticket
2. Replace simulated logic with actual database operations
3. Add indexes for performance optimization
4. Implement real-time notifications using Socket.IO

### Performance Considerations

#### Pagination
All list endpoints support pagination with configurable limits:
- Default page size: 20 items
- Maximum recommended: 100 items per page
- Use `page` and `limit` parameters for efficient data loading

#### Filtering
Most endpoints support filtering by:
- Date ranges
- Status values
- Source types
- Custom metadata

### Security Considerations

#### Input Validation
- All inputs validated using Zod schemas
- SQL injection protection through Mongoose
- XSS protection through input sanitization

#### Rate Limiting
- Not yet implemented
- Recommended: Add rate limiting middleware

#### Authentication
- Not yet implemented
- Recommended: Add JWT authentication

---

## 📚 Additional Resources

### API Documentation
- **Health Check**: `GET /health`
- **Root Endpoint**: `GET /`
- **Database Management**: `POST /api/database/*`

### Development Tools
- **TypeScript**: All routes written in TypeScript
- **ESLint**: Code linting configured
- **Hot Reload**: Development server with auto-restart

### Testing
- **Unit Tests**: Not yet implemented
- **Integration Tests**: Manual testing with cURL examples above
- **Load Testing**: Not yet implemented

---

## 🤝 Contributing

### Code Style
- Use TypeScript for all new routes
- Follow existing validation patterns with Zod
- Include comprehensive error handling
- Add detailed logging for debugging

### Adding New Routes
1. Create route file in `server/src/routes/`
2. Define Zod schema for validation
3. Implement route handlers with proper error handling
4. Add route to `server/src/index.ts`
5. Test with provided examples
6. Update this documentation

---

## 📞 Support

For questions or issues:
- Check the health endpoint: `GET /health`
- Review server logs for detailed error information
- Test with provided cURL examples
- Verify database connection status

---

*Last updated: July 26, 2025*
*API Version: 2.0.0*