# Kitchen Order Management System

**Last Updated:** November 2025  
**Version:** 1.18.0  
**Status:** ✅ Production Ready

## 📋 Table of Contents

1. [Overview](#overview)
2. [Kitchen Architecture](#kitchen-architecture)
3. [Viewing Kitchen Orders](#viewing-kitchen-orders)
4. [Order Status Management](#order-status-management)
5. [Order Deletion](#order-deletion)
6. [Server Synchronization](#server-synchronization)
7. [Order Creation](#order-creation)
8. [Data Persistence](#data-persistence)
9. [Order Filtering and Sorting](#order-filtering-and-sorting)
10. [Priority Management](#priority-management)
11. [Elapsed Time Tracking](#elapsed-time-tracking)
12. [Technical Architecture](#technical-architecture)
13. [API Documentation](#api-documentation)
14. [Internationalization](#internationalization)

---

## Overview

The Kitchen Order Management System is a comprehensive solution for managing kitchen orders in restaurant, coffee shop, and bakery environments. It provides:

- **Order Management**: Create, view, update, and delete kitchen orders
- **Status Tracking**: Track orders through pending → preparing → ready → served workflow
- **Priority Management**: Assign and display order priorities (low, normal, high, urgent)
- **Real-Time Updates**: Elapsed time tracking with visual indicators
- **Server Sync**: Synchronize orders with backend server
- **Data Persistence**: Save and restore orders across app sessions
- **Filtering**: Filter orders by status (pending, preparing, ready, history)
- **Internationalization**: Full support for English and Spanish

---

## Kitchen Architecture

### Core Components

#### KitchenContext (`src/context/KitchenContext.tsx`)
- Global kitchen order state management
- Order operations (add, update, remove, sync)
- Server synchronization
- Data persistence

#### KitchenScreen (`app/screens/KitchenScreen.tsx`)
- Kitchen UI and display
- Order filtering by status
- Status updates
- Order deletion
- Server sync

### Data Structures

#### KitchenOrder Interface
```typescript
interface KitchenOrder {
  id: string;
  tableNumber?: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  orderTime: string; // ISO string
  status: 'pending' | 'preparing' | 'ready' | 'served';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  waiterName?: string;
  specialInstructions?: string;
  estimatedTime?: number; // in minutes
}
```

#### OrderItem Interface
```typescript
interface OrderItem {
  product: CartProduct;
  quantity: number;
  notes?: string;
}
```

#### KitchenContextType Interface
```typescript
interface KitchenContextType {
  orders: KitchenOrder[];
  addOrder: (order: Omit<KitchenOrder, 'id' | 'orderTime'>) => Promise<string>;
  updateOrderStatus: (orderId: string, status: KitchenOrder['status']) => Promise<void>;
  removeOrder: (orderId: string) => void;
  getOrdersByStatus: (status: KitchenOrder['status']) => KitchenOrder[];
  getElapsedTime: (orderTime: string) => string;
  createOrderOnServer: (order: Omit<KitchenOrder, 'id' | 'orderTime'>) => Promise<KitchenOrder>;
  syncOrdersFromServer: () => Promise<void>;
  syncOrderStatusToServer: (orderId: string, status: KitchenOrder['status']) => Promise<boolean>;
  deleteOrderOnServer: (orderId: string) => Promise<boolean>;
  createTestOrders: () => Promise<void>;
}
```

---

## Viewing Kitchen Orders

### Kitchen Screen

#### Tabs
- **All**: Shows all active orders (pending, preparing, ready)
- **Pending**: Shows only pending orders
- **Preparing**: Shows only preparing orders
- **Ready**: Shows only ready orders
- **History**: Shows only served/completed orders

#### Tab Badges
- Each tab displays a badge with the count of orders
- Counts update in real-time as orders change
- Badge shows red background with white text

#### Order Display
Each order card shows:
- Customer name
- Table number (if available)
- Waiter name (if available)
- Order items with quantities and prices
- Item notes (if any)
- Special instructions (if any)
- Total amount
- Order status with icon
- Priority level with color coding
- Elapsed time timer

### Empty States
- Different messages for each tab
- Appropriate icons
- Clear indication of no orders

---

## Order Status Management

### Status Workflow

#### Status Flow
```
pending → preparing → ready → served
```

#### Status Transitions
- **pending → preparing**: Tap "Start" button
- **preparing → ready**: Tap "Ready" button
- **ready → served**: Tap "Served" button
- **served**: No further transitions, order moves to history

### Status Icons
- **pending**: `hourglass-outline`
- **preparing**: `restaurant`
- **ready**: `checkmark-circle`
- **served**: `checkmark-done`

### Status Update Flow
1. User taps status button
2. Status updates locally immediately
3. Status syncs to server in background
4. UI updates with new status
5. Order moves to appropriate tab

### Button Text
- **pending**: "Start"
- **preparing**: "Ready"
- **ready**: "Served"
- **served**: No button (order completed)

---

## Order Deletion

### Deletion Flow
1. User taps delete button
2. Confirmation dialog appears
3. User confirms
4. Order deleted from server (if exists)
5. Order removed locally
6. Order count decreases

### Delete Button Visibility
- Visible for: pending, preparing, ready
- Hidden for: served (completed orders)

### Error Handling
- If server deletion fails, order still removed locally
- Errors logged but don't block deletion

---

## Server Synchronization

### Sync from Server

#### Flow
1. User taps "Sync from Server" button
2. Button shows "Syncing..." state
3. System fetches orders from server
4. Order states updated from server
5. Success message displayed
6. Button returns to normal state

#### Sync Logic
- Only updates states of existing orders
- Matches orders by ID or by customer name + table + time
- Updates status and priority from server
- Maintains local order data

### Sync Order Status to Server

#### Flow
1. User updates order status locally
2. Status updates immediately in UI
3. Status syncs to server in background
4. If sync fails, local status remains updated
5. Sync retries automatically

### Error Handling

#### Shop ID Not Configured
- Error message indicates shop ID needs configuration
- Clear user guidance

#### Network Errors
- Network error message displayed
- User can retry when connection available

#### Server Errors
- Error logged
- Local state maintained
- User can retry

---

## Order Creation

### From Waitlist

#### Flow
1. Order added to waitlist
2. Check store type (Restaurant, CoffeeShop, Bakery)
3. If kitchen-enabled, create kitchen order
4. Kitchen order includes:
   - Customer name
   - All order items
   - Special instructions (from notes)
   - Status: 'pending'
   - Priority: 'normal'

#### Store Types
- **Restaurant**: Kitchen orders enabled
- **CoffeeShop**: Kitchen orders enabled
- **Bakery**: Kitchen orders enabled
- **Retail/Other**: Kitchen orders disabled

### From Online Orders

#### Flow
1. Online order received
2. Order added to waitlist
3. If kitchen-enabled, create kitchen order
4. Kitchen order marked with source: 'online'

### Order Creation on Server

#### Flow
1. Create order on server first
2. Server returns order ID
3. Add order locally with server ID
4. If server creation fails, create locally with temporary ID
5. Order appears in Kitchen screen

### Duplicate Prevention
- System detects duplicate orders
- Duplicates prevented by ID or customer name + table + time
- Warnings logged, duplicates skipped

---

## Data Persistence

### Storage

#### AsyncStorage
- Key: `bizneai_kitchen_orders`
- Format: JSON array of KitchenOrder objects
- Automatic save on changes
- Automatic load on app start

#### Persistence Flow
```typescript
// Save
useEffect(() => {
  saveOrdersToStorage();
}, [orders]);

// Load
useEffect(() => {
  loadOrdersFromStorage();
}, []);
```

### Sample Order Filtering
- Sample orders (John Smith, Emily Johnson, David Wilson) filtered on load
- Only real orders displayed
- Filtered orders saved back to storage

---

## Order Filtering and Sorting

### Filtering by Status
- Filter orders by status using tabs
- Real-time filtering
- Orders move between tabs as status changes

### Sorting
- Orders sorted by most recent first
- Based on `orderTime` field
- Descending order (newest first)

### Tab Counts
- Each tab shows count badge
- Counts update in real-time
- Accurate counts maintained

---

## Priority Management

### Priority Levels
- **urgent**: Red (#FF3B30)
- **high**: Orange (#FF9500)
- **normal**: Blue (#007AFF)
- **low**: Gray (#8E8E93)

### Priority Display
- Priority shown in order card
- Order card border color matches priority
- Priority text displayed

---

## Elapsed Time Tracking

### Timer Component

#### Features
- Real-time updates every second
- Color coding based on duration
- Pulse animation for urgent orders (>15 minutes pending)

#### Timer Format
- Under 1 hour: `MM:SS` (e.g., "15:30")
- Over 1 hour: `Xh Ym` (e.g., "1h 30m")

#### Timer Colors
- Under 10 minutes: Green (#34C759)
- 10-15 minutes: Yellow (#FFCC00)
- 15-20 minutes: Orange (#FF9500)
- Over 20 minutes: Red (#FF3B30)

#### Pulse Animation
- Orders pending >15 minutes get pulse animation
- Animation draws attention to urgent orders
- Smooth animation effect

---

## Technical Architecture

### KitchenContext Service

#### Core Functions
```typescript
// Add order
addOrder(order: Omit<KitchenOrder, 'id' | 'orderTime'>): Promise<string>

// Update status
updateOrderStatus(orderId: string, status: KitchenOrder['status']): Promise<void>

// Remove order
removeOrder(orderId: string): void

// Get orders by status
getOrdersByStatus(status: KitchenOrder['status']): KitchenOrder[]

// Get elapsed time
getElapsedTime(orderTime: string): string

// Server sync
syncOrdersFromServer(): Promise<void>
syncOrderStatusToServer(orderId: string, status: KitchenOrder['status']): Promise<boolean>
deleteOrderOnServer(orderId: string): Promise<boolean>
```

#### State Management
```typescript
const [orders, setOrders] = useState<KitchenOrder[]>([]);

useEffect(() => {
  loadOrdersFromStorage();
}, []);

useEffect(() => {
  saveOrdersToStorage();
}, [orders]);
```

### KitchenScreen Component

#### State Management
```typescript
const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'history'>('all');
const [isSyncing, setIsSyncing] = useState(false);
```

#### Filtering Logic
```typescript
const getFilteredOrders = (): KitchenOrder[] => {
  if (selectedTab === 'all') {
    return orders.filter(order => order.status !== 'served');
  }
  if (selectedTab === 'history') {
    return orders.filter(order => order.status === 'served');
  }
  return getOrdersByStatus(selectedTab);
};
```

---

## API Documentation

### Base URL
```
/api/kitchen
```

### Endpoints

#### 1. GET - List Orders
**Endpoint:** `GET /api/kitchen/orders`

**Query Parameters:**
- `shopId` (required) - Shop ID
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page
- `status` (optional) - Filter by status
- `priority` (optional) - Filter by priority
- `search` (optional) - Search in customer name, table, waiter
- `sortBy` (optional, default: `orderTime`) - Sort field
- `sortOrder` (optional, default: `desc`) - Sort order
- `dateFrom` (optional) - Date from (ISO format)
- `dateTo` (optional) - Date to (ISO format)

#### 2. GET - Get Order
**Endpoint:** `GET /api/kitchen/orders/:id`

**Query Parameters:**
- `shopId` (required) - Shop ID

#### 3. POST - Create Order
**Endpoint:** `POST /api/kitchen/orders`

**Body:**
```json
{
  "shopId": "string",
  "customerName": "string",
  "tableNumber": "string",
  "waiterName": "string",
  "items": [
    {
      "product": {
        "id": "string",
        "name": "string",
        "price": 0,
        "image": "string",
        "category": "string"
      },
      "quantity": 0,
      "notes": "string"
    }
  ],
  "total": 0,
  "status": "pending",
  "priority": "normal",
  "specialInstructions": "string",
  "estimatedTime": 0,
  "source": "local"
}
```

#### 4. PATCH - Update Order Status
**Endpoint:** `PATCH /api/kitchen/orders/:id/status`

**Query Parameters:**
- `shopId` (required) - Shop ID

**Body:**
```json
{
  "status": "preparing"
}
```

#### 5. PATCH - Update Order Priority
**Endpoint:** `PATCH /api/kitchen/orders/:id/priority`

**Query Parameters:**
- `shopId` (required) - Shop ID

**Body:**
```json
{
  "priority": "urgent"
}
```

#### 6. DELETE - Delete Order
**Endpoint:** `DELETE /api/kitchen/orders/:id`

**Query Parameters:**
- `shopId` (required) - Shop ID

#### 7. GET - Get Statistics
**Endpoint:** `GET /api/kitchen/stats`

**Query Parameters:**
- `shopId` (required) - Shop ID
- `dateFrom` (optional) - Date from (ISO format)
- `dateTo` (optional) - Date to (ISO format)

### Data Model

#### KitchenOrder Schema
```typescript
{
  customerName: string; // Required, max 100 chars
  tableNumber: string; // Required, max 20 chars
  waiterName: string; // Required, max 100 chars
  items: Array<{
    product: {
      id: string;
      name: string;
      price: number;
      image?: string;
      category: string;
    };
    quantity: number; // Required, min 1
    notes?: string;
  }>; // Required, min 1 item
  total: number; // Required, min 0
  status: 'pending' | 'preparing' | 'ready' | 'served'; // Default: 'pending'
  priority: 'low' | 'normal' | 'high' | 'urgent'; // Default: 'normal'
  specialInstructions?: string;
  estimatedTime?: number; // Min 1 (minutes)
  orderTime: Date; // Default: now
  updatedAt: Date; // Default: now
  shopId: string; // Required
  source: 'local' | 'online'; // Default: 'local'
}
```

### Socket.IO Events

The API emits the following Socket.IO events:

1. **`newOrder`** - When a new order is created
2. **`kitchenUpdate`** - When an order is updated or deleted
3. **`orderStatusUpdate`** - When order status is updated
4. **`orderPriorityUpdate`** - When order priority is updated

All events include `shopId` for filtering.

---

## Internationalization

### Supported Languages
- **English**: Default language
- **Spanish**: Full translation support

### Translation Keys

#### Kitchen Section
```json
{
  "pos": {
    "kitchen": "Kitchen",
    "kitchenOrders": "Kitchen Orders ({{count}})",
    "kitchenAll": "All",
    "kitchenPending": "Pending",
    "kitchenPreparing": "Preparing",
    "kitchenReady": "Ready",
    "kitchenHistory": "History",
    "kitchenTable": "Table",
    "kitchenWaiter": "Waiter",
    "kitchenPriority": "Priority",
    "kitchenNote": "Note",
    "kitchenTotal": "Total",
    "kitchenButtonStart": "Start",
    "kitchenButtonReady": "Ready",
    "kitchenButtonServed": "Served",
    "kitchenButtonComplete": "Complete",
    "kitchenStatusPending": "Pending",
    "kitchenStatusPreparing": "Preparing",
    "kitchenStatusReady": "Ready",
    "kitchenStatusServed": "Served",
    "kitchenPriorityLow": "Low",
    "kitchenPriorityNormal": "Normal",
    "kitchenPriorityHigh": "High",
    "kitchenPriorityUrgent": "Urgent",
    "kitchenNoOrdersActive": "No active orders",
    "kitchenNoHistoryOrders": "No completed orders",
    "kitchenNoOrders": "No {{status}} orders",
    "kitchenNewOrdersMessage": "New orders will appear here when added from waitlist",
    "kitchenSyncFromServer": "Sync from Server",
    "kitchenSyncing": "Syncing...",
    "kitchenAlerts": {
      "syncSuccess": "Synced {{count}} orders",
      "syncError": "Sync error: {{error}}",
      "failedToSync": "Failed to sync orders",
      "shopIdNotConfigured": "Shop ID not configured. Please configure your shop ID in settings.",
      "networkError": "Network error. Please check your connection and try again.",
      "deleteOrderTitle": "Delete Order",
      "deleteOrderMessage": "Are you sure you want to delete this order?"
    }
  }
}
```

### Language Switching
- Kitchen labels update on language change
- Status names translated
- Priority names translated
- All messages properly translated
- Consistent UI across languages

---

## Best Practices

### Order Management
1. Update status immediately for responsive UI
2. Sync to server in background (non-blocking)
3. Handle errors gracefully
4. Maintain local state even if sync fails
5. Provide clear visual feedback

### Server Sync
1. Sync in background (non-blocking)
2. Handle errors gracefully
3. Retry failed syncs automatically
4. Maintain local state as source of truth
5. Match orders by ID or criteria

### Data Persistence
1. Save on every change
2. Load on app start
3. Filter sample orders
4. Handle storage errors
5. Maintain data integrity

### Performance
1. Efficient filtering and sorting
2. Optimize re-renders
3. Background processing
4. Smooth scrolling
5. Handle large order lists

---

## Troubleshooting

### Common Issues

#### Orders Not Appearing
- Check AsyncStorage permissions
- Verify storage keys
- Review load logic
- Check filter settings

#### Orders Not Syncing
- Check network connectivity
- Verify shop ID configuration
- Review API endpoint
- Check error logs

#### Status Not Updating
- Verify state updates
- Check persistence logic
- Review UI refresh
- Validate status values

#### Timer Not Updating
- Check interval cleanup
- Verify date calculations
- Review component lifecycle
- Check performance issues

---

## Future Enhancements

### Planned Features
- Order priority editing
- Estimated time editing
- Order notes editing
- Bulk status updates
- Order search functionality
- Order filtering by priority
- Order filtering by waiter
- Order filtering by table
- Order statistics dashboard
- Order preparation time analytics
- Kitchen display mode (large screen)
- Printer integration
- Sound notifications
- Push notifications

### Technical Improvements
- Real-time updates via Socket.IO
- Advanced filtering options
- Order templates
- Performance optimization
- Enhanced error handling
- Better conflict resolution
- Offline queue management
- Advanced caching

---

## Related Documentation

- `features/kitchen.feature`: Gherkin feature file
- `docs/WAITLIST_SYSTEM.md`: Waitlist system documentation (kitchen integration)
- `src/context/KitchenContext.tsx`: Kitchen context implementation
- `app/screens/KitchenScreen.tsx`: Kitchen screen implementation
- `features/Sistema_Kitchen.md`: API documentation (to be consolidated)

---

**Documentation Version**: 1.0  
**Last Updated**: November 2025  
**Maintained By**: BizneAI Development Team

