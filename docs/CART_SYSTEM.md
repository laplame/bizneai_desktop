# Shopping Cart Management System

**Last Updated:** November 2025  
**Version:** 1.18.0  
**Status:** ✅ Production Ready

## 📋 Table of Contents

1. [Overview](#overview)
2. [Cart Architecture](#cart-architecture)
3. [Adding Items to Cart](#adding-items-to-cart)
4. [Cart Management](#cart-management)
5. [Cart Calculations](#cart-calculations)
6. [Weight-Based Products](#weight-based-products)
7. [Product Variants](#product-variants)
8. [Payment Processing](#payment-processing)
9. [Waitlist Integration](#waitlist-integration)
10. [Kitchen Integration](#kitchen-integration)
11. [Inventory Integration](#inventory-integration)
12. [Cart Persistence](#cart-persistence)
13. [Technical Architecture](#technical-architecture)
14. [Internationalization](#internationalization)

---

## Overview

The Shopping Cart Management System is a comprehensive solution for managing customer orders in the POS system. It provides:

- **Item Management**: Add, remove, and modify items in the cart
- **Multiple Product Types**: Support for regular, weight-based, and variant products
- **Payment Processing**: Multiple payment methods including cash, card, crypto, and mixed payments
- **Order Options**: Direct payment, waitlist, or kitchen orders
- **Inventory Integration**: Real-time inventory checks and updates
- **Cart Persistence**: Save and restore cart across sessions
- **Internationalization**: Full support for English and Spanish

---

## Cart Architecture

### Core Components

#### CartContext (`src/context/CartContext.tsx`)
- Global cart state management
- Cart operations (add, remove, update, clear)
- Inventory validation
- Cart persistence

#### CartScreen (`app/cart.tsx`)
- Cart UI and display
- Payment processing
- Checkout options
- Customer information capture

### Data Structures

#### CartProduct Interface
```typescript
interface CartProduct {
  id: string;
  name: string;
  price: number; // Base price
  quantity: number;
  image?: string;
  category?: string;
  isWeightBased?: boolean; // Enable decimal quantities for weight-based products
  hasVariants?: boolean;
  selectedVariants?: {
    [groupId: string]: {
      groupId: string;
      groupLabel: string; // e.g., "Color", "Size"
      variantId: string;
      variantName: string; // e.g., "Red", "Large"
      variantValue: string; // e.g., "red", "L"
      priceModifier?: number;
    };
  };
  variantDisplayName?: string; // e.g., "T-Shirt (Red, Large, Premium)"
  finalPrice?: number; // Calculated price with all variant modifiers
}
```

#### CartItem Interface
```typescript
interface CartItem {
  product: CartProduct;
  quantity: number;
}
```

#### Cart State
```typescript
const [cart, setCart] = useState<{ [id: string]: CartItem }>({});
```

---

## Adding Items to Cart

### Basic Item Addition

#### Single Item
- Tap product on POS screen
- Product added to cart
- Cart count increases
- Product appears in cart summary

#### Multiple Quantities
- Tap product multiple times
- Quantity increases for that item
- Cart count reflects total items
- Item total = quantity × price

#### Different Items
- Add multiple different products
- Each product appears as separate line item
- Cart count shows total items
- Cart total = sum of all items

### Weight-Based Products

#### Weight Selection Flow
1. User taps weight-based product
2. Weight selection modal opens
3. User selects weight (presets or custom)
4. Product added with decimal quantity
5. Price calculated: weight × unit price

#### Weight Presets
- Quick select options: 0.25kg, 0.5kg, 1kg, 1.5kg, 2kg
- Custom weight input
- Total amount input (calculates weight)

### Product Variants

#### Variant Selection Flow
1. User taps product with variants
2. Variant selection modal opens (multi-step)
3. User selects variants for each group
4. Primary variant shown first
5. Product added with variant information
6. Price includes variant modifiers

#### Combined Variants and Weight
1. Select variants first
2. Then select weight
3. Product added with both variant and weight info

### Inventory Validation

#### Stock Checking
- Check inventory before adding to cart
- Prevent adding more than available stock
- Show low stock alerts
- Allow adding up to available quantity

#### Inventory Check Logic
```typescript
// For weight-based products, round up to check inventory
const inventoryCheckQuantity = product.isWeightBased 
  ? Math.ceil(newQuantity) 
  : newQuantity;

const available = await isInStock(productId, inventoryCheckQuantity);
```

---

## Cart Management

### Viewing Cart

#### Cart Display
- List of all cart items
- Each item shows:
  - Product name
  - Quantity
  - Unit price
  - Item total
- Cart totals (subtotal, tax, total)
- Cart count badge

#### Empty Cart State
- "Your cart is empty" message
- "Start to Sell" button
- No checkout options visible

### Modifying Items

#### Quantity Controls
- **Increase**: Tap "+" button
  - Quantity increases by 1
  - Item total updates
  - Cart total recalculates

- **Decrease**: Tap "-" button
  - Quantity decreases by 1
  - If quantity becomes 0, item is removed
  - Item total updates
  - Cart total recalculates

#### Remove Item
- Direct remove button
- Item removed from cart
- Cart count decreases
- Cart total updates

#### Clear Cart
- "Clear Cart" button
- Confirmation dialog
- All items removed
- Cart count becomes zero
- Return to product catalog

---

## Cart Calculations

### Totals Calculation

#### Subtotal
```typescript
const subtotal = cartItems.reduce((sum, item) => {
  const price = item.product.finalPrice || item.product.price || 0;
  const quantity = item.quantity || 0;
  return sum + (price * quantity);
}, 0);
```

#### Tax Calculation
```typescript
const taxRateValue = taxRate || 0;
const tax = subtotal * (taxRateValue / 100);
```

#### Total
```typescript
const total = subtotal + tax;
```

### Item Totals
- Unit price × quantity = item total
- For weight-based: price × weight (decimal)
- For variants: finalPrice (with modifiers) × quantity

### Tax Handling
- Tax calculated on subtotal
- Configurable tax rate
- Zero tax rate supported
- Tax included in total

---

## Weight-Based Products

### Features

#### Decimal Quantities
- Support for decimal quantities (e.g., 1.5 kg)
- Decimal-pad keyboard for input
- Display with 2 decimal places
- Format: "X.XX kg" or similar

#### Quick Add Weight
- Quick weight presets
- Custom weight input
- Total amount input (calculates weight)
- Add to existing quantity

#### Price Calculation
- Price per unit × weight
- Decimal quantity support
- Accurate calculations

### Display

#### Cart Display
- Weight information shown
- Price per unit displayed
- Calculated total price
- Visual distinction from regular products

#### Quantity Adjustment
- Decimal values allowed
- Decimal-pad keyboard
- Total recalculates on change

---

## Product Variants

### Features

#### Variant Display
- Variant information in cart
- Product name includes variant details
- Price reflects variant modifiers
- Primary variant highlighted

#### Variant Editing
- Edit variant selection in cart
- Change variants
- Price updates automatically
- Cart total recalculates

### Price Calculation
- Base price + variant modifiers
- Primary variant: Full price impact
- Other variants: 50% price impact
- Final price = basePrice + primaryModifier + (otherModifiers × 0.5)

---

## Payment Processing

### Payment Methods

#### Cash Payment
- Select "Cash" payment method
- Process payment
- Sale recorded
- Cart cleared
- Return to POS

#### Card Payment
- Select "Card" payment method
- Process payment
- Sale recorded
- Cart cleared
- Return to POS

#### Crypto Payment
- Select "Crypto" payment method
- Select cryptocurrency (Bitcoin, Ethereum, Solana)
- QR code generated
- Crypto address displayed
- Scan to pay
- Sale recorded after confirmation

#### Mixed Payment
- Select "Mixed" payment method
- Enter amounts for:
  - Cash
  - Card
  - Crypto
- Total must equal cart total
- Fill buttons for quick entry
- Validation before processing

### Payment Flow

```
Cart → Checkout Options →
├── Pay Now → Payment Modal →
│   ├── Select Payment Method
│   ├── Enter Customer Info (optional)
│   ├── Add Notes (optional)
│   ├── Process Payment
│   ├── Record Sale
│   ├── Create Ticket
│   ├── Update Inventory
│   └── Clear Cart
└── Add to Waitlist → Waitlist Modal
```

### Payment Validation

#### Pre-Payment Checks
- Cart not empty
- All items have valid prices
- Quantities are positive
- Cart total calculated correctly
- Inventory available

#### Mixed Payment Validation
- Sum of all payment amounts = cart total
- All amounts non-negative
- At least one payment method has amount > 0

### Error Handling

#### Payment Processing Errors
- Error message displayed
- Cart preserved
- Retry option available
- No duplicate processing

#### Sale Recording Errors
- Error message displayed
- Cart preserved
- Retry option available

#### Inventory Update Errors
- Sale still recorded
- Warning message displayed
- Manual inventory update option

---

## Waitlist Integration

### Features

#### Add to Waitlist
- "Add to Waitlist" option in checkout
- Customer information capture
- Order notes support
- Order queued for later processing

#### Waitlist Flow
```
Cart → Add to Waitlist →
├── Enter Customer Name
├── Add Order Notes (optional)
├── Confirm
├── Order Added to Waitlist
└── Cart Cleared
```

### Customer Information
- Customer name (required)
- Table number (optional)
- Order notes (optional)
- Saved with waitlist order

---

## Kitchen Integration

### Features

#### Send to Kitchen
- "Send to Kitchen" option
- Order sent to kitchen system
- Cart cleared
- Confirmation message

---

## Inventory Integration

### Real-Time Inventory Checks

#### Before Adding to Cart
- Check available stock
- Prevent over-ordering
- Show low stock alerts
- Allow up to available quantity

#### During Checkout
- Final inventory check
- Alert if inventory changed
- Option to adjust or cancel

#### After Sale
- Inventory updated automatically
- Stock levels decreased
- Changes reflected immediately

### Quick Add Inventory

#### From Cart
- Quick add inventory option
- Add stock to product
- Inventory updated
- Cart reflects updated availability

---

## Cart Persistence

### Features

#### Save Cart
- Cart preserved when navigating away
- Persists across app sessions
- Restored on return to POS

#### Load Cart
- Cart restored on app start
- All items displayed correctly
- Quantities preserved
- State maintained

### Storage
- AsyncStorage for persistence
- In-memory cache for performance
- Automatic save/restore

---

## Technical Architecture

### CartContext Service

#### Core Functions
```typescript
// Add product to cart
addToCart(product: CartProduct, quantity: number): Promise<boolean>

// Update quantity
updateQuantity(id: string, change: number): Promise<boolean>

// Remove from cart
removeFromCart(id: string): void

// Clear cart
clearCart(): void

// Get cart items
getCartItems(): CartItem[]

// Get cart total
getCartTotal(): number
```

#### Inventory Integration
- `isInStock(productId, quantity)`: Check inventory
- `updateInventoryAfterSale()`: Update after sale
- Real-time stock validation

### CartScreen Component

#### State Management
```typescript
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [showWaitlistModal, setShowWaitlistModal] = useState(false);
const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'crypto' | 'mixed'>('cash');
const [notes, setNotes] = useState('');
const [customerName, setCustomerName] = useState('');
const [mixedPayments, setMixedPayments] = useState({ cash: 0, card: 0, crypto: 0 });
```

#### Payment Processing
```typescript
const handlePayment = async () => {
  // Prevent duplicate processing
  if (isProcessingPayment) return;
  
  setIsProcessingPayment(true);
  
  try {
    // Convert cart to sale items
    const saleItems = cartItems.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.finalPrice || item.product.price,
      quantity: item.quantity,
      total: (item.product.finalPrice || item.product.price) * item.quantity
    }));
    
    // Create sale
    const sale = {
      items: saleItems,
      total: finalTotal,
      paymentType: paymentMethod,
      // ... other fields
    };
    
    // Save sale
    const saleId = await salesHistoryService.createSale(sale);
    
    // Create ticket
    await createTicketFromSale(saleData, saleId);
    
    // Update inventory
    for (const item of saleItems) {
      await updateInventoryAfterSale(item.productId, item.quantity);
    }
    
    // Clear cart
    clearCart();
    
    // Show success
    Alert.alert('Success', 'Payment processed successfully');
  } catch (error) {
    // Handle error
  } finally {
    setIsProcessingPayment(false);
  }
};
```

---

## Internationalization

### Supported Languages
- **English**: Default language
- **Spanish**: Full translation support

### Translation Keys

#### Cart Section
```json
{
  "cart": {
    "title": "Shopping Cart",
    "empty": "Your cart is empty",
    "emptyMessage": "Add items from the POS screen",
    "backToPOS": "Back to POS",
    "addItems": "Start to Sell",
    "clear": "Clear Cart",
    "remove": "Remove Item",
    "price": "Price",
    "quantity": "Quantity",
    "itemTotal": "Item Total",
    "subtotal": "Subtotal (excl. tax)",
    "tax": "Tax",
    "total": "Total (incl. tax)",
    "checkout": "Proceed to Checkout",
    "paymentMethod": "Payment Method",
    "cash": "Cash",
    "card": "Card",
    "crypto": "Crypto",
    "mixed": "Mixed"
  }
}
```

### Language Switching
- Cart labels update on language change
- All text properly translated
- Consistent UI across languages

---

## Best Practices

### Cart Management
1. Always validate inventory before adding items
2. Check stock availability during checkout
3. Handle errors gracefully
4. Provide clear feedback to users
5. Preserve cart state across navigation

### Payment Processing
1. Prevent duplicate payment processing
2. Validate payment amounts
3. Handle errors gracefully
4. Provide loading states
5. Clear cart only after successful sale

### Inventory Integration
1. Check inventory before adding to cart
2. Final inventory check during checkout
3. Update inventory immediately after sale
4. Handle inventory update errors
5. Provide manual inventory update options

### User Experience
1. Show loading states during processing
2. Provide success/error feedback
3. Display clear order summaries
4. Support responsive layouts
5. Maintain cart persistence

---

## Troubleshooting

### Common Issues

#### Items Not Adding to Cart
- Check product ID format
- Verify inventory availability
- Review error logs
- Check cart state

#### Cart Not Persisting
- Check AsyncStorage permissions
- Verify storage keys
- Review persistence logic
- Check app state management

#### Payment Processing Fails
- Check network connectivity
- Verify payment method configuration
- Review error messages
- Check sale recording logic

#### Inventory Not Updating
- Verify inventory service connection
- Check update logic
- Review error logs
- Validate inventory data

---

## Future Enhancements

### Planned Features
- Cart sharing between devices
- Saved cart templates
- Cart analytics
- Advanced discount system
- Loyalty program integration
- Multi-currency support
- Advanced reporting
- Cart abandonment tracking

### Technical Improvements
- Performance optimization
- Advanced caching
- Real-time sync
- Offline support enhancement
- Advanced validation
- Machine learning recommendations

---

## Related Documentation

- `features/cart.feature`: Gherkin feature file
- `docs/PRODUCTS_INVENTORY_SYSTEM.md`: Products and inventory system
- `docs/SALES_SYSTEM.md`: Sales system documentation
- `src/context/CartContext.tsx`: Cart context implementation
- `app/cart.tsx`: Cart screen implementation

---

**Documentation Version**: 1.0  
**Last Updated**: November 2025  
**Maintained By**: BizneAI Development Team

