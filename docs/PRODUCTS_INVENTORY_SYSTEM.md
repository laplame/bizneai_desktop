# Products & Inventory Management System

**Last Updated:** November 2025  
**Version:** 1.18.0  
**Status:** ✅ Production Ready

## 📋 Table of Contents

1. [Overview](#overview)
2. [Product Management](#product-management)
3. [Inventory Management](#inventory-management)
4. [Product Code System](#product-code-system)
5. [Weight-Based Products](#weight-based-products)
6. [Product Variants](#product-variants)
7. [Product Sync & API Integration](#product-sync--api-integration)
8. [Internationalization (i18n)](#internationalization-i18n)
9. [Image Upload & Management](#image-upload--management)
10. [Store Types & Product Counts](#store-types--product-counts)
11. [Technical Architecture](#technical-architecture)
12. [API Documentation](#api-documentation)

---

## Overview

The Products & Inventory Management System is a comprehensive solution for managing product catalogs, inventory levels, and product synchronization across multiple platforms. The system supports:

- **Product Management**: Create, edit, delete, and organize products
- **Inventory Tracking**: Real-time stock level monitoring and alerts
- **Product Codes**: Unique 13-character hexadecimal codes for product identification
- **Weight-Based Sales**: Support for products sold by weight with decimal quantities
- **Product Variants**: Support for products with multiple variant types (color, size, model, etc.)
- **Synchronization**: Bidirectional sync with backend servers
- **Internationalization**: Full support for English and Spanish
- **Image Management**: Cloudinary and local image storage with optimization

---

## Product Management

### Core Features

#### Product Creation
- **Required Fields**: Name, Price
- **Optional Fields**: Description, Category, Image, Cost, SKU, Barcode
- **Special Features**: Weight-based flag, Variants support
- **Validation**: Comprehensive validation for all fields

#### Product Editing
- Edit all product fields
- Update images
- Change availability status
- Modify pricing and costs

#### Product Organization
- **Categories**: Organize products by category
- **Search**: Full-text search across names, categories, descriptions
- **Filtering**: Filter by category, stock status, availability
- **Sorting**: Sort by name, price, category, date added

#### Bulk Operations
- Bulk delete
- Bulk category changes
- Bulk price updates
- Bulk export/import

### Product Data Structure

```typescript
interface Product {
  id?: number | string;
  name: string;
  price: number;
  cost?: number;
  description?: string;
  category?: string;
  productCode?: string; // 13-character hex code
  sku?: string;
  barcode?: string;
  isWeightBased?: boolean;
  hasVariants?: boolean;
  variantGroups?: ProductVariantGroup[];
  primaryVariantGroup?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  images?: {
    main?: string;
    thumbnail?: string;
    filename?: string;
  };
  stock?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## Inventory Management

### Core Features

#### Stock Operations
- **Add Stock**: Increase inventory levels
- **Remove Stock**: Decrease inventory levels
- **Set Stock**: Set exact stock level
- **Adjust Stock**: Make adjustments with reason tracking

#### Stock Monitoring
- **Current Stock**: Real-time stock levels
- **Minimum Stock**: Set minimum thresholds
- **Maximum Stock**: Set maximum thresholds
- **Low Stock Alerts**: Automatic alerts when stock is low
- **Out of Stock**: Automatic alerts when stock is zero

#### Inventory Tracking
- **Movement History**: Track all inventory changes
- **Change Types**: Add, Remove, Sale, Adjustment
- **User Tracking**: Track who made changes
- **Notes**: Add notes to inventory changes

#### Inventory Reports
- Current stock levels
- Inventory movements
- Low stock alerts
- Stock value calculations
- Category-based reports

### Inventory Refresh System

#### Automatic Refresh
- Refreshes after sales transactions
- Refreshes on screen focus
- Updates stock levels in real-time

#### Manual Refresh
- Debug mode refresh button
- Force refresh capability
- Refresh logging

#### Performance
- Efficient batch processing
- Non-blocking operations
- Error recovery

---

## Product Code System

### Code Generation

#### Automatic Generation
- **Format**: 13-character hexadecimal (0-9, A-F)
- **Uniqueness**: Guaranteed unique codes
- **Case**: Uppercase format
- **Auto-assignment**: Automatically assigned to new products

#### Manual Generation
- Generate codes for existing products
- Batch code generation
- Code validation

### Code Usage

#### POS Integration
- Search products by code
- Partial code matching
- Case-insensitive search
- Code display in search suggestions

#### Code Display
- Product details view
- PDF code gallery generation
- Barcode scanning support

### Code Validation

- Format validation (13 hex characters)
- Uniqueness validation
- Database indexing for fast search

---

## Weight-Based Products

### Features

#### Product Configuration
- Enable weight-based sales per product
- Decimal quantity support
- Weight unit configuration

#### POS Integration
- Weight selection modal
- Quick weight presets (0.25kg, 0.5kg, 1kg, etc.)
- Custom weight input
- Total amount input (calculates weight)

#### Cart Integration
- Decimal quantity display (e.g., "1.50 kg")
- Decimal quantity editing
- Decimal-pad keyboard
- Price calculation with decimals

#### Inventory Check
- Uses `Math.ceil(quantity)` for inventory validation
- Supports decimal quantities in stock
- Low stock warnings for weight-based products

### Implementation Details

#### Database Storage
- `isWeightBased` field: boolean flag
- Quantity stored as number (supports decimals)
- Normalized to boolean in code (handles 0/1/true/false)

#### Cart Display
- Separate render function for weight-based products
- Visual distinction from regular products
- Decimal formatting (2 decimal places)

---

## Product Variants

### Variant System Architecture

#### Variant Groups
- Multiple variant types per product (Color, Size, Model, etc.)
- Primary variant group (most important for pricing)
- Variant ordering and display

#### Variant Structure
```typescript
interface ProductVariantGroup {
  id: string;
  type: 'color' | 'size' | 'model' | 'custom';
  label: string;
  isPrimary?: boolean;
  variants: ProductVariant[];
  order?: number;
}

interface ProductVariant {
  id: string;
  name: string;
  value: string;
  priceModifier?: number;
  imageUrl?: string;
  sku?: string;
  inStock?: boolean;
  order?: number;
}
```

#### Price Calculation
- Base price + variant modifiers
- Primary variant: Full price impact
- Other variants: 50% price impact
- Formula: `finalPrice = basePrice + primaryModifier + (otherModifiers × 0.5)`

### POS Integration

#### Variant Selection Modal
- Multi-step selection (one group per step)
- Primary variant group shown first
- Price preview as variants are selected
- Navigation (Next/Back buttons)

#### Cart Display
- Variant display name: "Product (Variant1, Variant2, ...)"
- Final price with modifiers
- Variant badges/indicators

---

## Product Sync & API Integration

### Sync Architecture

#### Sync Directions
- **TO Server**: Upload local products to server
- **FROM Server**: Download products from server
- **Smart Sync**: Bidirectional intelligent sync

#### Sync Status Tracking
- Individual product sync status
- Service-specific status (ecommerce vs shop)
- Sync queue for offline operations
- Retry mechanisms with exponential backoff

#### Sync Operations
- **Fetch from Server**: Get product data from server
- **Send to Server**: Upload product to server
- **Upload Image**: Upload product image to Cloudinary
- **Get Image**: Download image from server
- **Sync Inventory**: Synchronize inventory levels
- **Update Price/Cost**: Update pricing information
- **Update Details**: Update product description

### Error Handling

#### Retry Mechanisms
- Configurable retry attempts (default: 3)
- Exponential backoff (1s, 2s, 4s delays)
- Error categorization
- Intelligent retry logic

#### Batch Processing
- Batch upload with progress tracking
- Configurable batch sizes
- Error recovery
- Progress callbacks

### Shop ID Management

#### Unified Shop ID Service
- Standardized storage keys
- Provisional vs real shop ID handling
- Automatic fallback mechanisms

---

## Internationalization (i18n)

### Supported Languages
- **English**: Default language
- **Spanish**: Full translation support

### Translated Components

#### Main Screen
- Screen title
- Tab labels (Products, Inventory, Codes)
- Search placeholders
- Empty state messages
- Category filters

#### Modals
- Get Quick Data modal
- Product Sync modal
- Quick Add Inventory modal
- Edit Product modal
- Restock modal

#### Components
- Sync Status card
- Product Codes view
- All alert messages
- Button labels

### Translation Keys

#### Products Section
```json
{
  "products": {
    "title": "Products & Inventory",
    "tabs": {
      "products": "Products",
      "inventory": "Inventory",
      "codes": "Codes"
    },
    "allCategories": "All",
    "search": {
      "products": "Search products...",
      "inventory": "Search inventory..."
    }
  }
}
```

### Implementation Details

#### Tab Re-rendering
- Dynamic key prop for language changes
- Direct calculation (no useMemo caching)
- useEffect for language change detection

#### Category Filter Translation
- Conditional rendering for "All" category
- Translation key: `products.allCategories`

#### Button Text Overflow
- Adjusted font sizes
- Flex properties for text wrapping
- Max width constraints

---

## Image Upload & Management

### Upload Process

#### Two Upload Modes

**Mode 1: FormData (File Upload)**
- Multipart form data
- Files saved temporarily in `/uploads/temp`
- Processed and optimized
- Cleaned up after processing

**Mode 2: JSON (Pre-uploaded URLs)**
- Direct URL submission
- Assumes images already in Cloudinary
- No file processing

### Image Storage

#### Cloudinary Integration
- **Primary Storage**: Cloudinary CDN
- **Optimization**: Automatic resizing (max 1200x1200px)
- **Formats**: JPEG, PNG, WebP
- **Thumbnails**: 300x300px thumbnails
- **Quality**: 80% default quality

#### Local Storage
- **Fallback**: Local storage if Cloudinary fails
- **Optimization**: Sharp library for local optimization
- **Directory**: `/public/images/`
- **Formats**: JPEG, WebP, Thumbnails

### Image Metadata

```typescript
interface ImageMetadata {
  cloudinaryUrls: string[];
  localUrls: string[];
  totalImages: number;
  primarySource: 'cloudinary' | 'local';
}
```

### Image Limits
- **Maximum Images**: 5 per product
- **Maximum Size**: 10MB per image
- **Formats**: JPEG, PNG, WebP
- **Dimensions**: Auto-resized to max 1200x1200px

---

## Store Types & Product Counts

### Store Type Categories

#### Large Stores (1000+ products)
- **Department Store**: 1,250 products
- **Groceries**: 2,230 products
- **Supermarket**: 870 products

#### Medium Stores (500-999 products)
- **Pharmacy**: 850 products
- **Bookstore**: 850 products
- **Clothing Store**: 750 products
- **Hardware Store**: 570 products
- **Garden Center**: 530 products

#### Small Stores (200-499 products)
- **Convenience Store**: 490 products
- **Furniture Store**: 450 products
- **Beauty Salon**: 450 products
- **Electronics Store**: 390 products
- **Vegetable Market**: 380 products
- **Coffee Shop**: 380 products
- **Jewelry Store**: 360 products
- **Bakery**: 360 products
- **Pet Store**: 410 products
- **Butcher**: 340 products
- **Gym**: 300 products

#### Specialized Stores (Under 300 products)
- **Spa**: 240 products
- **Fish Market**: 260 products
- **Barbershop**: 180 products

### Product Count Summary
- **Total Store Types**: 24
- **Total Categories**: 200+
- **Total Products**: 15,000+
- **Average Products per Store**: 625

---

## Technical Architecture

### Database Structure

#### SQLite (Primary)
- Products table with all fields
- Inventory table linked to products
- Indexes for fast search
- Normalized data types

#### AsyncStorage (Fallback)
- JSON storage for web/mobile
- Product array structure
- Inventory object structure

### Services

#### Core Services
- `database.ts`: Product CRUD operations
- `inventoryDatabase.ts`: Inventory operations
- `productSyncService.ts`: Sync status tracking
- `ecommerceUploadService.ts`: Server upload
- `productSyncApiService.ts`: Server download

#### Specialized Services
- `validation.ts`: Product validation
- `parameterExtractionService.ts`: AI intent parameter extraction
- `roleMenuVisibilityService.ts`: Role-based menu visibility

### Components

#### Main Components
- `app/products.tsx`: Main products screen
- `app/add-product.tsx`: Product creation/editing
- `lib/components/QuickAddInventoryModal.tsx`: Quick inventory addition
- `src/components/ProductSyncModal.tsx`: Product synchronization
- `src/components/ProductCodesView.tsx`: Code management
- `src/components/SyncStatusCard.tsx`: Sync status display

---

## API Documentation

### Product API Endpoint

#### POST `/api/products`

**Request Body (FormData)**
```typescript
{
  name: string; // Required
  description?: string;
  price: number | string; // Required
  category?: string;
  mainCategory?: string;
  businessId?: string;
  stock?: number | string;
  cost?: number | string;
  sku?: string;
  barcode?: string;
  isWeightBased?: boolean;
  images?: File[]; // Max 5 files, 10MB each
}
```

**Request Body (JSON)**
```typescript
{
  name: string; // Required
  description?: string;
  price: number; // Required
  category?: string;
  mainCategory?: string;
  businessId?: string;
  stock?: number;
  cost?: number;
  sku?: string;
  barcode?: string;
  isWeightBased?: boolean;
  images?: string[]; // Pre-uploaded URLs
}
```

**Response (Success)**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Product Name",
    "price": 10.99,
    "images": ["https://res.cloudinary.com/..."],
    "imageMetadata": {
      "cloudinaryUrls": ["https://..."],
      "localUrls": ["/images/..."],
      "totalImages": 1,
      "primarySource": "cloudinary"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "1 image(s) uploaded successfully"
}
```

**Response (Error)**
```json
{
  "success": false,
  "error": "Validation errors found",
  "details": [
    "name: Product name is required"
  ],
  "message": "Please review marked fields and complete required information"
}
```

### Sync API Endpoints

#### POST `/api/shops/:shopId/roles/sync`
- Sync active roles to server
- Validate against contract limits
- Return blocked routes if exceeded

#### GET `/api/products/:productId`
- Fetch product from server
- Convert to local format

#### POST `/api/products/:productId/sync`
- Upload product to server
- Handle image uploads
- Sync inventory

---

## Best Practices

### Product Management
1. Always validate product data before saving
2. Use product codes for efficient searching
3. Set appropriate stock thresholds
4. Keep product images optimized
5. Regular backup of product data

### Inventory Management
1. Monitor low stock alerts regularly
2. Track inventory movements for auditing
3. Set realistic minimum/maximum stock levels
4. Use bulk operations for efficiency
5. Regular inventory reconciliation

### Sync Operations
1. Sync products regularly to avoid conflicts
2. Monitor sync status for errors
3. Use batch sync for multiple products
4. Handle offline scenarios gracefully
5. Retry failed syncs automatically

### Performance
1. Use batch operations for bulk changes
2. Optimize images before upload
3. Index product codes for fast search
4. Cache frequently accessed data
5. Monitor database performance

---

## Troubleshooting

### Common Issues

#### Product Not Saving
- Check required fields (name, price)
- Validate data types
- Check database connection
- Review error logs

#### Inventory Not Updating
- Check inventory refresh triggers
- Verify database writes
- Check for concurrent modifications
- Review inventory logs

#### Sync Failures
- Check network connectivity
- Verify shop ID configuration
- Review API credentials
- Check error messages

#### Image Upload Issues
- Verify file size (max 10MB)
- Check file format (JPEG, PNG, WebP)
- Verify Cloudinary configuration
- Check local storage permissions

---

## Future Enhancements

### Planned Features
- Advanced variant management
- Product templates
- Bulk variant operations
- Variant-specific inventory
- Product analytics
- Advanced reporting
- Multi-location inventory
- Barcode scanning
- Product recommendations
- AI-powered product suggestions

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

- `features/products-inventory.feature`: Gherkin feature file
- `docs/BACKEND_ROLE_SYNC_MODEL.md`: Role sync documentation
- `docs/INTENT_AUTO_EXECUTION_GUIDE.md`: AI intent system
- `lib/i18n/translations/`: Translation files

---

**Documentation Version**: 1.0  
**Last Updated**: November 2025  
**Maintained By**: BizneAI Development Team

