# Sales Management System

**Last Updated:** November 2025  
**Version:** 1.18.0  
**Status:** ✅ Production Ready

## 📋 Table of Contents

1. [Overview](#overview)
2. [Sales & Tickets Integration](#sales--tickets-integration)
3. [Sales Statistics](#sales-statistics)
4. [Sales Reporting](#sales-reporting)
5. [Merkle Tree Sales History](#merkle-tree-sales-history)
6. [Ticket System](#ticket-system)
7. [Waitlist Integration](#waitlist-integration)
8. [Technical Architecture](#technical-architecture)
9. [API Documentation](#api-documentation)

---

## Overview

The Sales Management System is a comprehensive solution for managing sales transactions, generating tickets, tracking sales history, and providing business analytics. The system includes:

- **Sales & Tickets Integration**: Automatic ticket creation for every sale
- **Sales Statistics**: Real-time business metrics and analytics
- **Sales Reporting**: Comprehensive reporting with multiple time periods and filters
- **Merkle Tree History**: Immutable transaction history with cryptographic verification
- **Ticket Management**: Complete ticket lifecycle management
- **Waitlist Support**: Order queuing and delayed processing

---

## Sales & Tickets Integration

### Core Features

#### Automatic Ticket Creation
- Every completed sale automatically creates a ticket
- Tickets include all sale information
- Real-time synchronization between sales and tickets

#### Transaction Flow
```
POS Screen → Add Products → Cart → Checkout →
├── Payment Modal → Complete Sale →
│   ├── Save Sale to Database
│   ├── Create Ticket
│   ├── Update Inventory
│   └── Clear Cart
└── Waitlist Option → Add to Waitlist
```

#### Data Synchronization
- Sales and tickets are synchronized in real-time
- Changes in one system reflect in the other
- Automatic refresh when returning to Sales & Tickets screen

### Sales Data Structure

```typescript
interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  subtotal: number;
  tax: number;
  paymentType: 'cash' | 'card' | 'crypto' | 'mixed';
  paymentStatus: 'completed' | 'pending' | 'refunded';
  transactionId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  tableNumber?: string;
  orderType?: 'dine-in' | 'takeaway' | 'delivery' | 'online';
  createdAt: string;
  updatedAt: string;
}

interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  notes?: string;
}
```

### Features

#### Filtering & Search
- Filter by payment type (cash, card, crypto)
- Search by transaction ID
- Search by product name
- Filter by date range
- Filter by status

#### E-Invoice Generation
- Generate electronic invoices for each sale
- Include business information
- Include customer information
- Include item details and tax calculations
- Export in multiple formats

---

## Sales Statistics

### Statistics Tab Features

#### Key Metrics
- **Total Sales**: Count of all completed sales
- **Total Revenue**: Sum of all sale totals
- **Average Order Value**: Total revenue divided by sales count
- **Total Tickets**: Number of order tickets

#### Payment Method Analytics
- Breakdown by payment type:
  - Cash transactions count
  - Card transactions count
  - Crypto transactions count
- Color-coded indicators
- Percentage calculations

#### Top Products Performance
- Top 5 products by quantity sold
- Revenue generated per product
- Product name and details
- Sorted by quantity (highest first)

### Statistics Features

#### Auto-loading
- Statistics load automatically when switching to Stats tab
- Loading indicator during data fetch
- Cached data for subsequent visits

#### Real-time Updates
- Statistics refresh after new sales
- Automatic updates when returning to tab
- Accurate data based on actual sales records

#### Performance
- Efficient data aggregation
- Fast loading times
- Responsive interface
- Smooth scrolling

---

## Sales Reporting

### Report Types

#### Daily Reports
- Sales by hour
- Payment method breakdown
- Product sales summary
- Customer count
- Revenue total
- Date selection

#### Weekly Reports
- Sales by day of week
- Weekly trends
- Top performing days
- Product performance
- Revenue comparison
- Week selection

#### Monthly Reports
- Sales by day
- Monthly trends
- Growth indicators
- Seasonal patterns
- Revenue summary
- Month selection

#### Custom Date Range
- Select start and end dates
- Sales summary for selected period
- Daily breakdown
- Trends and patterns
- Comparison with previous period

### Report Categories

#### Payment Method Reports
- Cash sales total and percentage
- Card sales total and percentage
- Crypto sales total and percentage
- Payment method trends
- Drill-down capabilities

#### Product Reports
- Top selling products
- Product name and details
- Quantity sold
- Revenue generated
- Percentage of total sales
- Growth trends
- Sortable by different metrics

#### Category Reports
- Sales by product category
- Category performance
- Category trends
- Revenue distribution
- Category drill-down

#### Hourly Analysis
- Sales by hour of day
- Peak hours identification
- Hourly trends
- Staffing recommendations
- Day comparison

#### Customer Analytics
- Customer count
- Average transaction value
- Customer frequency
- New vs returning customers
- Customer trends
- Customer segmentation

#### Staff Performance
- Sales by staff member
- Transaction count
- Average transaction value
- Performance trends
- Staff comparison

### Export Capabilities

#### Export Formats
- PDF export
- Excel export
- CSV export

#### Export Options
- Select date range
- Include/exclude specific data
- Customize report content
- Download file

### Advanced Features

#### Sales Trends
- Sales growth trends
- Seasonal patterns
- Peak performance periods
- Decline indicators
- Multiple time period views

#### Period Comparison
- Period-over-period comparison
- Year-over-year comparison
- Revenue comparison
- Transaction count comparison
- Product performance comparison
- Growth/decline percentages

#### Real-time Sales
- Live sales updates
- Current hour performance
- Today's progress
- Live transaction feed
- Automatic updates

#### Sales Forecasts
- Predicted sales for next period
- Forecast accuracy
- Trend projections
- Seasonal adjustments
- Adjustable forecast parameters

#### Sales Alerts
- Unusual sales patterns
- Low sales periods
- High sales periods
- Goal achievements
- Configurable alert thresholds

#### Sales Goals
- Current goal progress
- Goal vs actual performance
- Remaining target
- Goal achievement timeline
- Set and modify goals

#### Location Sales
- Sales by location
- Location performance comparison
- Location-specific trends
- Revenue distribution
- Location drill-down

#### Sales Summary
- Total revenue
- Total transactions
- Average transaction value
- Key performance indicators
- Executive summary
- Customizable summary

#### Sales History
- Historical sales data
- Long-term trends
- Year-over-year comparisons
- Seasonal analysis
- Multiple time period views

#### Sales Insights
- AI-generated insights
- Performance recommendations
- Opportunity identification
- Risk indicators
- Actionable insights

#### Sales Breakdown
- Detailed sales breakdown
- Item-level analysis
- Transaction details
- Revenue components
- Item drill-down

---

## Merkle Tree Sales History

### Overview

The Merkle Tree Sales History System provides immutable transaction records, data integrity verification, and comprehensive audit trails for all sales operations.

### Key Features

#### Immutable Transaction History
- Every sale operation (create, update, delete) is recorded as a transaction
- Each transaction has a unique hash for integrity verification
- Complete audit trail of all changes to sales data

#### Merkle Tree Structure
- Daily blocks containing all transactions for that day
- Merkle root hash for each block ensures data integrity
- Merkle proofs for individual transaction verification

#### Data Integrity Verification
- Chain integrity verification across all blocks
- Individual transaction verification using Merkle proofs
- Automatic integrity checking and reporting

### Data Structures

#### SalesTransaction Interface
```typescript
interface SalesTransaction {
  id: string;                    // Unique transaction ID
  type: 'create' | 'update' | 'delete';
  saleId: string;                 // Reference to sale
  saleData?: Sale;               // Sale data (for create/update)
  previousData?: Sale;           // Previous data (for update/delete)
  timestamp: string;             // ISO timestamp
  hash: string;                  // SHA-256 hash of transaction
  merkleProof?: string[];        // Merkle proof for verification
}
```

#### DailyBlock Interface
```typescript
interface DailyBlock {
  id: string;                    // Unique block ID
  date: string;                  // YYYY-MM-DD format
  merkleRoot: string;            // Merkle root hash
  transactions: SalesTransaction[]; // All transactions for the day
  previousBlockHash?: string;    // Hash of previous block
  blockHash: string;             // Hash of entire block
  createdAt: string;             // Block creation timestamp
  transactionCount: number;      // Number of transactions
  unixTime: number;              // Unix timestamp for uniqueness
}
```

#### SalesHistoryEntry Interface
```typescript
interface SalesHistoryEntry {
  id: string;                    // History entry ID
  saleId: string;                // Reference to sale
  action: 'create' | 'update' | 'delete';
  timestamp: string;             // When action occurred
  data: Sale | null;            // Sale data (null for delete)
  previousData?: Sale;           // Previous data (for updates)
  hash: string;                  // Transaction hash
  merkleProof: string[];         // Merkle proof
  blockId?: string;              // Block containing this transaction
}
```

### Transaction Flow

#### Sale Creation Flow
```
1. User creates sale in cart
2. salesHistoryService.createSale() called
3. MerkleTreeService.recordSaleCreation() creates transaction
4. Transaction added to daily transactions
5. Sale stored in cache with history tracking
6. Success response returned
```

#### Sale Update Flow
```
1. User edits sale in sales view
2. salesHistoryService.updateSale() called
3. Previous sale data retrieved
4. MerkleTreeService.recordSaleUpdate() creates transaction
5. Transaction added to daily transactions
6. Sale updated in cache
7. Success response returned
```

#### Sale Deletion Flow
```
1. User deletes sale in sales view
2. salesHistoryService.deleteSale() called
3. MerkleTreeService.recordSaleDeletion() creates transaction
4. Sale marked as deleted (soft deletion)
5. Transaction added to daily transactions
6. Success response returned
```

#### Daily Block Generation
```
1. End of day trigger (manual or automatic)
2. salesHistoryService.generateDailyBlock() called
3. All transactions for the day collected
4. Merkle tree built from transactions
5. Merkle proofs generated for each transaction
6. Block created with Merkle root
7. Block added to chain
8. Success response with block details
```

### Security & Integrity

#### Hash Generation
- **SHA-256** used for all hash calculations
- Transaction data sanitized before hashing
- Consistent hash generation across all operations

#### Merkle Tree Verification
- Each transaction has a Merkle proof
- Proofs verified against Merkle root
- Chain integrity verified across all blocks

#### Integrity Checks
```typescript
// Verify individual transaction
const isValid = await merkleTreeService.verifyTransaction(transactionId);

// Verify entire chain
const integrity = await salesHistoryService.verifyIntegrity();
if (!integrity.isValid) {
  console.error('Chain integrity compromised:', integrity.errors);
}
```

### User Interface

#### History Tab
- View all sales history transactions
- Generate daily blocks manually
- View Merkle proofs and hashes
- Transaction integrity status

#### CRUD Operations
- **Edit Button**: Modify sale details with history tracking
- **Delete Button**: Soft delete with history preservation
- **History Button**: View complete transaction history
- **Restore Button**: Restore deleted sales

#### Modals
- **Edit Sale Modal**: Form for updating sale details
- **History Modal**: Complete transaction history viewer
- **Confirmation Dialogs**: Safe deletion with history preservation

---

## Ticket System

### Ticket Model

#### TicketItem Interface
```typescript
interface TicketItem {
  productId: string;      // ID del producto
  name: string;           // Nombre del producto
  price: number;          // Precio unitario
  quantity: number;       // Cantidad
  total: number;         // Total del item (price * quantity)
  notes?: string;         // Notas opcionales del item
}
```

#### Ticket Interface
```typescript
interface Ticket {
  // Identificadores
  id?: string;                    // ID único del ticket
  shopId?: string;                // ID de la tienda
  saleId: string;                 // ID de la venta (requerido)
  ticketNumber?: string;           // Número de ticket
  
  // Información del cliente
  customerName: string;            // Nombre del cliente
  customerPhone?: string;         // Teléfono del cliente
  customerEmail?: string;          // Email del cliente
  
  // Items de la venta
  items: TicketItem[];            // Array de items
  
  // Totales
  subtotal: number;               // Subtotal
  tax: number;                    // Impuestos
  total: number;                  // Total
  
  // Método de pago
  paymentMethod: 'cash' | 'card' | 'crypto' | 'transfer';
  
  // Estado
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  
  // Tipo de orden
  orderType: 'dine-in' | 'takeaway' | 'delivery' | 'online';
  
  // Información adicional
  tableNumber?: string;           // Número de mesa
  deliveryAddress?: string;       // Dirección de entrega
  notes?: string;                 // Notas generales
  
  // Timestamps
  createdAt?: Date;              // Fecha de creación
  updatedAt?: Date;              // Fecha de última actualización
  printedAt?: Date;              // Fecha de impresión
  completedAt?: Date;            // Fecha de completado
}
```

### Ticket Creation

#### createTicketFromSale Function
```typescript
export async function createTicketFromSale(
  saleData: {
    items: any[];
    total: number;
    paymentType: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    tableNumber?: string;
    orderType?: 'dine-in' | 'takeaway' | 'delivery' | 'online';
    notes?: string;
    taxAmount?: number;
    mixedPayments?: {
      cash: number;
      card: number;
      crypto: number;
    };
  },
  saleId: string
): Promise<Ticket>
```

#### Creation Process
1. **Get Shop ID**: Obtain or initialize shop ID
2. **Calculate Taxes**: Calculate if not provided
3. **Transform Items**: Convert sale items to TicketItem format
4. **Determine Order Type**: Default to 'dine-in' if not specified
5. **Handle Payment Method**: Map payment types, handle mixed payments
6. **Create Ticket Object**: Build Ticket object with all data
7. **Save Locally**: Store in AsyncStorage
8. **Upload to Backend**: Attempt server upload (non-critical)

### Ticket Functions

#### Core Functions
- `createTicketFromSale(saleData, saleId)`: Create ticket from sale
- `getTickets()`: Get all tickets
- `getTicketById(ticketId)`: Get ticket by ID
- `getTicketBySaleId(saleId)`: Get ticket by sale ID
- `updateTicketStatus(ticketId, status, notes?)`: Update ticket status
- `markTicketAsPrinted(ticketId)`: Mark ticket as printed
- `deleteTicket(ticketId)`: Delete ticket
- `loadTicketsFromShop()`: Load tickets from backend
- `clearAllTickets()`: Clear all tickets

### Storage

#### Local Storage (AsyncStorage)
- **Key**: `'bizneai_tickets'`
- **Format**: JSON array of tickets
- **Limit**: Last 1000 tickets
- **In-memory**: Array for fast access

#### Backend Endpoints
- `POST /api/tickets/shop/:shopId`: Create ticket
- `GET /api/tickets/shop/:shopId`: Get tickets
- `PUT /api/tickets/:shopId/:saleId`: Update ticket
- `DELETE /api/tickets/:shopId/:saleId`: Delete ticket

### Mixed Payments

When payment type is `'mixed'`:
1. Determine primary method based on highest amount
2. Add detailed mixed payment info to ticket notes

---

## Waitlist Integration

### Features

#### Order Queuing
- Queue orders for delayed processing
- Customer information tracking
- Flexible checkout options

#### Checkout Options
- **Pay Now**: Immediate payment processing
- **Add to Waitlist**: Queue order for later processing

#### Order Management
- Complete order tracking
- Status management
- Customer information capture

### Integration Flow

```
Cart → Checkout Options →
├── Pay Now → Payment Modal → Complete Sale
└── Add to Waitlist → Waitlist Modal → Queue Order
```

---

## Technical Architecture

### Core Services

#### SalesHistoryService (`src/services/salesHistoryService.ts`)
- CRUD operations with history tracking
- Soft deletion and restore
- History queries
- Integrity monitoring

#### MerkleTreeService (`src/services/merkleTreeService.ts`)
- Merkle tree construction
- Hash generation
- Merkle proof generation
- Daily block creation
- Chain integrity verification

#### TicketService (`src/services/ticketService.ts`)
- Ticket creation from sales
- Ticket management
- Status updates
- Backend synchronization

#### SalesDatabase (`src/services/salesDatabase.ts`)
- Sale storage and retrieval
- Query operations
- Data persistence

### Storage Strategy

#### AsyncStorage
- Persistent data storage
- In-memory cache for fast access
- Automatic backup and restore

#### Error Handling
- Comprehensive error logging
- Graceful fallbacks
- User-friendly error messages

#### Performance Optimization
- Lazy loading of history data
- Pagination for large datasets
- Efficient Merkle tree construction

---

## API Documentation

### Sales Endpoints

#### Create Sale
```
POST /api/sales
Body: {
  items: SaleItem[],
  total: number,
  paymentType: string,
  ...
}
Response: { success: boolean, saleId: string }
```

#### Get Sales
```
GET /api/sales?shopId=:shopId&dateFrom=:dateFrom&dateTo=:dateTo
Response: { success: boolean, sales: Sale[] }
```

#### Update Sale
```
PUT /api/sales/:saleId
Body: { ...updatedSale }
Response: { success: boolean, saleId: string }
```

#### Delete Sale
```
DELETE /api/sales/:saleId
Response: { success: boolean }
```

### Ticket Endpoints

#### Create Ticket
```
POST /api/tickets/shop/:shopId
Body: { ...ticketData }
Response: { success: boolean, ticket: Ticket }
```

#### Get Tickets
```
GET /api/tickets/shop/:shopId
Response: { success: boolean, tickets: Ticket[] }
```

#### Update Ticket
```
PUT /api/tickets/:shopId/:saleId
Body: { status: string, ... }
Response: { success: boolean, ticket: Ticket }
```

#### Delete Ticket
```
DELETE /api/tickets/:shopId/:saleId
Response: { success: boolean }
```

---

## Best Practices

### Sales Management
1. Always verify sale data before saving
2. Use transaction IDs for tracking
3. Keep complete audit trails
4. Regular integrity verification
5. Backup sales data regularly

### Ticket Management
1. Create tickets for every sale
2. Update ticket status promptly
3. Track ticket lifecycle
4. Maintain customer information
5. Handle mixed payments correctly

### History Tracking
1. Generate daily blocks regularly
2. Verify chain integrity periodically
3. Monitor transaction counts
4. Review integrity reports
5. Maintain backup copies

### Performance
1. Use pagination for large datasets
2. Cache frequently accessed data
3. Optimize database queries
4. Monitor performance metrics
5. Implement lazy loading

---

## Troubleshooting

### Common Issues

#### Sales Not Saving
- Check database connection
- Verify sale data format
- Review error logs
- Check storage permissions

#### Tickets Not Creating
- Verify sale completion
- Check ticket service connection
- Review error messages
- Validate ticket data

#### History Not Tracking
- Check Merkle tree service
- Verify transaction creation
- Review integrity status
- Check daily block generation

#### Statistics Not Loading
- Verify sales data exists
- Check statistics calculation
- Review loading errors
- Validate data sources

---

## Future Enhancements

### Planned Features
- Automatic daily block generation
- Blockchain integration
- Multi-shop synchronization
- Advanced analytics dashboard
- Export/import functionality
- Real-time notifications
- Advanced reporting
- API integration
- Mobile app synchronization

### Technical Improvements
- Performance optimization
- Advanced caching
- Real-time sync
- Conflict resolution UI
- Incremental sync
- Sync scheduling
- Advanced analytics
- Machine learning integration

---

## Related Documentation

- `features/sales.feature`: Gherkin feature file
- `docs/PRODUCTS_INVENTORY_SYSTEM.md`: Products and inventory system
- `src/services/merkleTreeService.ts`: Merkle tree implementation
- `src/services/salesHistoryService.ts`: Sales history service

---

**Documentation Version**: 1.0  
**Last Updated**: November 2025  
**Maintained By**: BizneAI Development Team

