# Waitlist Management System

**Last Updated:** November 2025  
**Version:** 1.18.0  
**Status:** ✅ Production Ready

## 📋 Table of Contents

1. [Overview](#overview)
2. [Waitlist Architecture](#waitlist-architecture)
3. [Adding Orders to Waitlist](#adding-orders-to-waitlist)
4. [Viewing Waitlist Orders](#viewing-waitlist-orders)
5. [Processing Waitlist Orders](#processing-waitlist-orders)
6. [Online Orders](#online-orders)
7. [Kitchen Integration](#kitchen-integration)
8. [Server Sync](#server-sync)
9. [Data Persistence](#data-persistence)
10. [Technical Architecture](#technical-architecture)
11. [Internationalization](#internationalization)

---

## Overview

The Waitlist Management System is a comprehensive solution for managing customer orders that are queued for later processing. It provides:

- **Order Queuing**: Add orders to waitlist without immediate payment
- **Customer Tracking**: Track customer information and order details
- **Flexible Processing**: Load orders back to cart for payment processing
- **Online Orders**: Support for receiving and managing online orders
- **Kitchen Integration**: Automatic kitchen order creation for restaurant-type stores
- **Server Sync**: Synchronize waitlist orders with backend server
- **Data Persistence**: Save and restore waitlist across app sessions
- **Internationalization**: Full support for English and Spanish

---

## Waitlist Architecture

### Core Components

#### WaitlistContext (`src/context/WaitlistContext.tsx`)
- Global waitlist state management
- Waitlist operations (add, remove, load, update status)
- Cart integration
- Kitchen integration
- Server sync

#### WaitlistScreen (`app/screens/WaitlistScreen.tsx`)
- Waitlist UI and display
- Order management
- Status updates
- Online order simulation

### Data Structures

#### WaitlistItem Interface
```typescript
interface WaitlistItem {
  id: string;
  name: string; // Customer name
  items: {
    product: CartProduct;
    quantity: number;
  }[];
  total: number;
  timestamp: string; // ISO timestamp
  source: 'local' | 'online';
  status?: 'waiting' | 'preparing' | 'ready' | 'completed';
  notes?: string;
}
```

#### WaitlistContextType Interface
```typescript
interface WaitlistContextType {
  waitlistItems: WaitlistItem[];
  addToWaitlist: (name: string, source?: 'local' | 'online', notes?: string) => Promise<boolean>;
  removeWaitlistItem: (id: string) => void;
  loadCart: (id: string) => Promise<boolean>;
  receiveOnlineOrder: (order: Omit<WaitlistItem, 'id' | 'timestamp' | 'source'>) => Promise<boolean>;
  updateWaitlistItemStatus: (id: string, status: WaitlistItem['status']) => void;
}
```

---

## Adding Orders to Waitlist

### From Cart

#### Basic Flow
1. User has items in cart
2. User taps "Waitlist" button or selects "Add to Waitlist" from checkout options
3. Waitlist modal opens
4. User enters customer name (required)
5. User adds notes (optional)
6. User confirms
7. Order added to waitlist
8. Cart cleared
9. Success message displayed

#### Validation
- **Customer Name**: Required, cannot be empty
- **Cart Items**: Must have at least one valid item
- **Item Validation**: All items must have:
  - Valid product ID
  - Valid product name
  - Valid price (positive number)
  - Valid quantity (positive number)

#### Order Creation
```typescript
const newWaitlistItem: WaitlistItem = {
  id: generateUniqueId(),
  name: customerName,
  items: savedItems,
  total: calculatedTotal,
  timestamp: new Date().toISOString(),
  source: 'local',
  status: 'waiting',
  notes: optionalNotes
};
```

### Checkout Options

#### Available Options
- **Pay Now**: Process payment immediately
- **Add to Waitlist**: Queue order for later processing
- **Cancel**: Return to cart

### Error Handling

#### Empty Cart
- Error message displayed
- Waitlist modal does not open
- User prompted to add items first

#### Missing Customer Name
- Validation error displayed
- Order not added
- Modal remains open
- User prompted to enter name

#### Duplicate Processing Prevention
- Processing flag prevents duplicate submissions
- Only one order created per action
- UI feedback during processing

---

## Viewing Waitlist Orders

### Waitlist Screen

#### Display Features
- **Order List**: All waitlist orders displayed
- **Order Details**: Each order shows:
  - Customer name
  - Number of items
  - Total amount
  - Timestamp
  - Status (with color coding)
  - Source (local/online)
  - Notes (if any)
  - Elapsed time

#### Sorting
- Orders sorted by timestamp (newest first)
- Most recent orders appear at top
- Scrollable list for many orders

#### Status Display
- **waiting**: Yellow/Orange badge
- **preparing**: Blue badge
- **ready**: Green badge
- **completed**: Gray badge

#### Elapsed Time
- Real-time updates every second
- Format: `MM:SS` for orders under 1 hour
- Format: `Xh Ym` for orders over 1 hour
- Updates automatically

### Filtering

#### Tabs
- **Tables**: Shows only local orders (`source: 'local'`)
- **Online Orders**: Shows only online orders (`source: 'online'`)

#### Empty States
- Different messages for each tab
- Appropriate icons
- Clear indication of no orders

### Order Details

#### Detailed View
- All order items listed
- Quantities for each item
- Prices for each item
- Item totals
- Customer information
- Order notes
- Full order summary

---

## Processing Waitlist Orders

### Load to Cart

#### Flow
1. User selects order in waitlist
2. User taps "Load Cart"
3. Confirmation dialog appears
4. User confirms
5. Current cart cleared
6. Order items added to cart
7. Order removed from waitlist
8. User navigated to cart screen

#### Confirmation
- Warning about replacing current cart
- Option to cancel
- Clear action buttons

### Update Status

#### Status Options
- **waiting**: Order is waiting to be processed
- **preparing**: Order is being prepared
- **ready**: Order is ready
- **completed**: Order is completed

#### Status Update
- Status changes immediately
- Color coding updates
- Changes persisted to storage

### Remove Order

#### Removal Flow
1. User selects order
2. User taps "Remove"
3. Confirmation dialog appears
4. User confirms
5. Order removed from waitlist
6. Waitlist updated

---

## Online Orders

### Receiving Online Orders

#### Flow
1. Online order received (from server/API)
2. Order validated
3. Order added to waitlist with `source: 'online'`
4. Order appears in "Online Orders" tab
5. Kitchen order created (if applicable)

#### Order Structure
```typescript
const onlineOrder: WaitlistItem = {
  id: generateUniqueId(),
  name: customerName,
  items: orderItems,
  total: orderTotal,
  timestamp: new Date().toISOString(),
  source: 'online',
  status: 'waiting',
  notes: orderNotes
};
```

### Online Order Simulation

#### Testing Feature
- "Simulate Online Order" button in "Online Orders" tab
- Creates test order with real products
- Random quantities
- Useful for testing and development

#### Simulation Logic
```typescript
const simulateOnlineOrder = async () => {
  const products = await getProducts();
  const randomProducts = selectRandomProducts(products);
  const orderItems = randomProducts.map(product => ({
    product,
    quantity: randomQuantity()
  }));
  
  await receiveOnlineOrder({
    name: `Test Customer ${Date.now()}`,
    items: orderItems,
    total: calculateTotal(orderItems),
    notes: 'Simulated order'
  });
};
```

---

## Kitchen Integration

### Automatic Kitchen Order Creation

#### Supported Store Types
- **Restaurant**: Kitchen orders enabled
- **CoffeeShop**: Kitchen orders enabled
- **Bakery**: Kitchen orders enabled
- **Retail/Other**: Kitchen orders disabled

#### Flow
1. Order added to waitlist
2. Check store type
3. If kitchen-enabled, create kitchen order automatically
4. Kitchen order sent to kitchen system
5. Waitlist order still created successfully

#### Background Processing
- Kitchen order creation runs in background (non-blocking)
- Does not block waitlist creation
- Errors logged but don't prevent waitlist addition
- Parallel processing with server sync

**Note:** For detailed kitchen order management features (status tracking, priority management, etc.), see `docs/KITCHEN_SYSTEM.md`.

---

## Server Sync

### Synchronization

#### When Enabled
- Ecommerce enabled
- Valid shop ID (not provisional)
- Server available

#### Sync Flow
1. Order added to waitlist
2. Background sync process starts
3. Order data sent to server
4. Server validates and stores
5. Success/failure logged (non-blocking)

#### Sync Data Structure
```typescript
const waitlistData = {
  name: waitlistItem.name,
  items: waitlistItem.items.map(item => ({
    product: {
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      category: item.product.category,
      image: item.product.image // Only if valid URL
    },
    quantity: item.quantity
  })),
  total: waitlistItem.total,
  source: waitlistItem.source,
  status: waitlistItem.status,
  notes: waitlistItem.notes
};
```

### Error Handling

#### Graceful Degradation
- Server sync failures don't block waitlist creation
- Errors logged but not shown to user
- Local waitlist continues to function
- Retry possible on next sync

---

## Data Persistence

### Storage

#### AsyncStorage
- Key: `bizneai_waitlist`
- Format: JSON array of WaitlistItem objects
- Automatic save on changes
- Automatic load on app start

#### Persistence Flow
```typescript
// Save
useEffect(() => {
  saveWaitlistToStorage();
}, [waitlistItems]);

// Load
useEffect(() => {
  loadWaitlistFromStorage();
}, []);
```

### Data Integrity

#### Preserved Data
- All order items
- Customer information
- Timestamps
- Statuses
- Notes
- Source (local/online)

#### Restoration
- Orders restored on app start
- All data intact
- Functionality maintained
- No data loss

---

## Technical Architecture

### WaitlistContext Service

#### Core Functions
```typescript
// Add order to waitlist
addToWaitlist(
  name: string, 
  source?: 'local' | 'online', 
  notes?: string
): Promise<boolean>

// Remove order from waitlist
removeWaitlistItem(id: string): void

// Load order to cart
loadCart(id: string): Promise<boolean>

// Receive online order
receiveOnlineOrder(
  order: Omit<WaitlistItem, 'id' | 'timestamp' | 'source'>
): Promise<boolean>

// Update order status
updateWaitlistItemStatus(
  id: string, 
  status: WaitlistItem['status']
): void
```

#### State Management
```typescript
const [waitlistItems, setWaitlistItems] = useState<WaitlistItem[]>([]);
const [isProcessing, setIsProcessing] = useState(false);
```

### WaitlistScreen Component

#### Features
- Order list display
- Filtering by source (tables/online)
- Status updates
- Order removal
- Cart loading
- Online order simulation
- Elapsed time display

#### State Management
```typescript
const [activeTab, setActiveTab] = useState<'tables' | 'online'>('tables');
const filteredItems = waitlistItems.filter(item => 
  activeTab === 'tables' ? item.source === 'local' : item.source === 'online'
);
```

### Integration Points

#### Cart Integration
- `useCart()` hook for cart operations
- `clearCart()` before loading waitlist order
- `addToCart()` to restore order items

#### Kitchen Integration
- `useKitchen()` hook for kitchen operations
- `createOrderOnServer()` for kitchen order creation
- Conditional based on store type

#### Server Integration
- `makeApiRequest()` for API calls
- `getShopId()` for shop identification
- Background processing

---

## Internationalization

### Supported Languages
- **English**: Default language
- **Spanish**: Full translation support

### Translation Keys

#### Waitlist Section
```json
{
  "waitlist": {
    "title": "Waitlist",
    "tables": "Tables",
    "onlineOrders": "Online Orders",
    "addToWaitlist": "Add to Waitlist",
    "customerName": "Customer Name",
    "notes": "Notes",
    "loadCart": "Load Cart",
    "remove": "Remove",
    "status": {
      "waiting": "Waiting",
      "preparing": "Preparing",
      "ready": "Ready",
      "completed": "Completed"
    },
    "emptyState": {
      "tables": "No tables or waitlist items",
      "online": "No online orders"
    }
  }
}
```

### Language Switching
- Waitlist labels update on language change
- All text properly translated
- Status names translated
- Consistent UI across languages

---

## Best Practices

### Waitlist Management
1. Always validate customer name before adding
2. Filter invalid items before saving
3. Prevent duplicate processing
4. Provide clear feedback to users
5. Handle errors gracefully

### Order Processing
1. Confirm before loading cart (replaces current cart)
2. Update status appropriately
3. Remove orders after processing
4. Track elapsed time accurately
5. Maintain data integrity

### Kitchen Integration
1. Create kitchen orders in background
2. Don't block waitlist creation
3. Handle errors gracefully
4. Support all kitchen-enabled store types
5. Include special instructions

### Server Sync
1. Sync in background (non-blocking)
2. Handle failures gracefully
3. Don't show errors to user
4. Retry on next opportunity
5. Validate data before sending

### Data Persistence
1. Save on every change
2. Load on app start
3. Preserve all order data
4. Handle storage errors
5. Maintain data integrity

---

## Troubleshooting

### Common Issues

#### Orders Not Appearing
- Check AsyncStorage permissions
- Verify storage keys
- Review load logic
- Check filter settings

#### Orders Not Persisting
- Check AsyncStorage save logic
- Verify JSON serialization
- Review error logs
- Check storage permissions

#### Kitchen Orders Not Creating
- Verify store type
- Check kitchen context
- Review error logs
- Validate order data

#### Server Sync Failing
- Check network connectivity
- Verify shop ID
- Review API endpoint
- Check error logs

#### Status Not Updating
- Verify state updates
- Check persistence logic
- Review UI refresh
- Validate status values

---

## Future Enhancements

### Planned Features
- Order priority levels
- Estimated completion times
- Customer notifications
- Order history
- Analytics and reporting
- Multi-location support
- Advanced filtering
- Search functionality
- Order templates
- Bulk operations

### Technical Improvements
- Real-time sync
- Offline queue management
- Advanced caching
- Performance optimization
- Enhanced error handling
- Better status tracking
- Notification system
- Integration with external systems

---

## Related Documentation

- `features/waitlist.feature`: Gherkin feature file
- `docs/CART_SYSTEM.md`: Cart system documentation
- `docs/SALES_SYSTEM.md`: Sales system documentation
- `src/context/WaitlistContext.tsx`: Waitlist context implementation
- `app/screens/WaitlistScreen.tsx`: Waitlist screen implementation

---

**Documentation Version**: 1.0  
**Last Updated**: November 2025  
**Maintained By**: BizneAI Development Team

