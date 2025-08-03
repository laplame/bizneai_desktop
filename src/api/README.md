# BizneAI API Client Implementation

This directory contains the complete API client implementation for the BizneAI platform, providing TypeScript interfaces and services for all backend endpoints.

## 📁 File Structure

```
src/api/
├── client.ts          # Core API client utilities
├── index.ts           # Main exports for all services
├── examples.ts        # Usage examples
├── README.md          # This documentation
├── store.ts           # Legacy store API (backward compatibility)
├── shops.ts           # Shop management API
├── products.ts        # Product management API
├── kitchen.ts         # Kitchen order management API
├── waitlist.ts        # Waitlist management API
├── payments.ts        # Payment processing API
├── chat.ts            # Chat management API
├── inventory.ts       # Inventory management API
├── tickets.ts         # Ticket management API
├── orders.ts          # Order management API
├── users.ts           # User management API
└── crypto.ts          # Cryptocurrency API
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { shopsAPI, productsAPI } from './api';

// Get all active coffee shops
const shops = await shopsAPI.getShops({
  storeType: 'CoffeeShop',
  status: 'active'
});

// Create a new product
const product = await productsAPI.createProduct({
  name: "Cappuccino Grande",
  price: 4.50,
  // ... other fields
});
```

### Import All Services

```typescript
import {
  shopsAPI,
  productsAPI,
  kitchenAPI,
  waitlistAPI,
  paymentsAPI,
  chatAPI,
  inventoryAPI,
  ticketsAPI,
  ordersAPI,
  usersAPI,
  cryptoAPI
} from './api';
```

## 🔧 Configuration

### Environment Variables

Set the API base URL in your environment:

```bash
# .env
VITE_API_URL=http://localhost:3000/api
```

Default: `http://localhost:3000/api`

### Headers

All requests automatically include:
- `Content-Type: application/json`
- `Accept: application/json`

## 📚 API Services

### 1. Shops API (`shopsAPI`)

Manage shop configurations and settings.

```typescript
// Get all shops with filtering
const shops = await shopsAPI.getShops({
  storeType: 'CoffeeShop',
  status: 'active',
  page: 1,
  limit: 20
});

// Create a new shop
const shop = await shopsAPI.createShop({
  storeName: "Mi Cafetería",
  storeType: "CoffeeShop",
  // ... other fields
});

// Get store types
const storeTypes = await shopsAPI.getStoreTypes();
```

### 2. Products API (`productsAPI`)

Manage product catalog and inventory.

```typescript
// Get products by category
const products = await productsAPI.getProducts({
  mainCategory: 'coffee_shop',
  status: 'active'
});

// Create a new product
const product = await productsAPI.createProduct({
  name: "Cappuccino Grande",
  price: 4.50,
  // ... other fields
});

// Upload product images
const images = await productsAPI.uploadImages([file1, file2]);
```

### 3. Kitchen API (`kitchenAPI`)

Manage kitchen orders and workflow.

```typescript
// Get pending orders
const orders = await kitchenAPI.getOrders({
  shopId: 'shop_123',
  status: 'pending'
});

// Create kitchen order
const order = await kitchenAPI.createOrder({
  shopId: 'shop_123',
  customerName: "Juan Pérez",
  items: [{ name: "Cappuccino", quantity: 2 }],
  // ... other fields
});

// Update order status
await kitchenAPI.partialUpdateOrder(orderId, shopId, {
  status: 'preparing'
});
```

### 4. Waitlist API (`waitlistAPI`)

Manage customer waitlist and queue.

```typescript
// Add to waitlist
const entry = await waitlistAPI.addToShopWaitlist(shopId, {
  name: "Test Customer",
  items: [{ product: { id: "1", name: "Coffee", price: 4.50 }, quantity: 1 }],
  total: 4.50,
  source: "local"
});

// Get waitlist entries
const entries = await waitlistAPI.getWaitlistEntries(shopId, {
  status: 'waiting'
});
```

### 5. Payments API (`paymentsAPI`)

Process payments and manage transactions.

```typescript
// Process payment
const payment = await paymentsAPI.processPayment(shopId, {
  type: "sale",
  amount: 25.50,
  currency: "USD",
  paymentMethod: "card",
  status: "completed"
});

// Get payment statistics
const stats = await paymentsAPI.getPaymentStats(shopId, '30d');
```

### 6. Chat API (`chatAPI`)

Manage customer chat interactions.

```typescript
// Send chat message
const chat = await chatAPI.sendMessage(shopId, {
  content: "Hello, I have a question",
  context: { businessType: "restaurant" },
  senderType: "customer"
});

// Get chat history
const history = await chatAPI.getChatHistory(shopId);
```

### 7. Inventory API (`inventoryAPI`)

Manage product inventory and stock levels.

```typescript
// Update inventory
const update = await inventoryAPI.updateInventory(shopId, {
  productId: "prod_123",
  quantity: 10,
  action: "add",
  reason: "Restock"
});

// Get inventory status
const status = await inventoryAPI.getInventoryStatus(shopId, {
  lowStock: true
});
```

### 8. Tickets API (`ticketsAPI`)

Generate and manage sales tickets.

```typescript
// Create ticket
const ticket = await ticketsAPI.createTicket(shopId, saleId, {
  customerName: "John Doe",
  items: [{ productId: "prod_123", name: "Coffee", quantity: 2, price: 4.50, total: 9.00 }],
  subtotal: 9.00,
  tax: 0.90,
  total: 9.90,
  paymentMethod: "card"
});

// Get ticket statistics
const stats = await ticketsAPI.getTicketStats(shopId, '30d');
```

### 9. Orders API (`ordersAPI`)

Manage e-commerce orders and POS operations.

```typescript
// Create order
const order = await ordersAPI.createOrder({
  userId: "user123",
  items: [{ productId: "prod_123", name: "Coffee", quantity: 2, price: 4.50 }],
  totalAmount: 9.00,
  shippingAddress: { street: "123 Main St", city: "City", state: "State", country: "Country", zipCode: "12345" },
  paymentMethod: "card"
});

// Update order status
await ordersAPI.updateOrderStatus(orderNumber, {
  status: 'completed',
  paymentStatus: 'paid'
});
```

### 10. Users API (`usersAPI`)

Manage user accounts and distributor applications.

```typescript
// Create user
const user = await usersAPI.createUser({
  firstName: "Juan",
  lastName: "Pérez",
  email: "juan@example.com",
  companyName: "Mi Empresa",
  businessType: "CoffeeShop",
  // ... other fields
});

// Get users with filtering
const users = await usersAPI.getUsers({
  businessType: 'CoffeeShop',
  page: 1,
  limit: 20
});
```

### 11. Crypto API (`cryptoAPI`)

Manage cryptocurrency payments and exchange rates.

```typescript
// Get exchange rates
const rates = await cryptoAPI.getExchangeRates();

// Process crypto payment
const payment = await cryptoAPI.processCryptoPayment({
  orderId: "order_123",
  cryptocurrency: "bitcoin",
  amount: 0.001,
  walletAddress: "bc1q...",
  transactionHash: "0x..."
});
```

## 🔄 Response Format

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}
```

### Success Response
```json
{
  "success": true,
  "data": { ... },
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

## 📝 Error Handling

All API functions throw errors on failure. Use try-catch blocks:

```typescript
try {
  const shops = await shopsAPI.getShops();
  console.log('Shops:', shops.data);
} catch (error) {
  console.error('API Error:', error.message);
}
```

## 🔍 Query Parameters

Most list endpoints support filtering, pagination, and sorting:

```typescript
// Pagination
{ page: 1, limit: 20 }

// Sorting
{ sortBy: 'createdAt', sortOrder: 'desc' }

// Filtering
{ status: 'active', storeType: 'CoffeeShop' }

// Search
{ search: 'coffee' }
```

## 📸 File Upload

For file uploads (e.g., product images):

```typescript
// Upload multiple images
const files = [file1, file2, file3];
const result = await productsAPI.uploadImages(files);

// Add images to existing product
await productsAPI.addImagesToProduct(productId, files);
```

## 🧪 Testing

Use the examples in `examples.ts` for testing:

```typescript
import { completeWorkflowExample } from './api/examples';

// Run complete workflow test
const result = await completeWorkflowExample.runCompleteWorkflow();
console.log('Workflow result:', result);
```

## 🔗 Backend Integration

This API client connects to the backend routes defined in:
- `server/src/routes/shopRoutes.ts`
- `server/src/routes/productRoutes.ts`
- `server/src/routes/kitchenRoutes.ts`
- `server/src/routes/waitlistRoutes.ts`
- And other route files in the server directory

## 📋 TypeScript Support

All API functions are fully typed with TypeScript interfaces:

```typescript
import type { Shop, Product, KitchenOrder } from './api';

// Type-safe API calls
const shop: Shop = await shopsAPI.getShopById('shop_123');
const products: Product[] = await productsAPI.getProducts();
const orders: KitchenOrder[] = await kitchenAPI.getOrders();
```

## 🔄 Migration from Legacy API

The legacy `storeAPI` is still available for backward compatibility:

```typescript
import { storeAPI } from './api';

// Legacy usage still works
const config = await storeAPI.getConfig();
```

## 📞 Support

For questions or issues:
1. Check the API documentation in the root directory
2. Review the examples in `examples.ts`
3. Test with the provided workflow examples
4. Verify backend server is running and accessible

---

*Last updated: July 26, 2025*
*API Version: 2.0.0* 