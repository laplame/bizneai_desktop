# Product Upload Component

## Overview

The `ProductUpload` component provides a comprehensive interface for uploading products to the BizneAI system. It includes advanced features like AI-powered similarity checking, image upload with drag-and-drop, and comprehensive form validation.

## Features

### 🖼️ Image Upload
- **Drag & Drop**: Drag images directly onto the upload area
- **Multiple Images**: Upload up to 5 images per product
- **File Validation**: Automatic validation of file types and sizes
- **Preview**: Real-time preview of uploaded images with remove functionality
- **Progress Indicators**: Visual feedback during upload process

### 🤖 AI Similarity Checking
- **Smart Detection**: AI-powered similarity detection using product name, description, and images
- **Recommendations**: Three types of recommendations:
  - `use_existing`: Very similar product found
  - `review_required`: Similar products found, review needed
  - `create_new`: No similar products found, safe to create
- **Similarity Scores**: Detailed similarity scores with reasons
- **Visual Alerts**: Color-coded alerts for different recommendation types

### 📝 Comprehensive Form
- **Basic Information**: Name, description, price, cost, stock, SKU
- **Categories**: Hierarchical category selection (Main Category → Category)
- **Advanced Fields**: Weight, dimensions, brand, specifications
- **Status Management**: Active/Inactive status control
- **Auto-Generation**: Automatic SKU generation if not provided

### 🔍 Image Search
- **Visual Search**: Search for existing products using uploaded images
- **Category Filtering**: Filter search results by main category
- **Similarity Matching**: Find visually similar products

## Usage

### Basic Usage

```tsx
import ProductUpload from './components/ProductUpload';

function App() {
  const [showUpload, setShowUpload] = useState(false);

  const handleProductCreated = (product) => {
    console.log('Product created:', product);
    // Refresh your products list
  };

  return (
    <div>
      <button onClick={() => setShowUpload(true)}>
        Add Product
      </button>

      {showUpload && (
        <ProductUpload
          businessId="your-business-id"
          onProductCreated={handleProductCreated}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
```

### Integration with POS System

The component is already integrated into the main POS system. To access it:

1. Navigate to the "Products" section in the sidebar
2. Click the "Add Product" button
3. Fill out the form and upload images
4. Use the AI similarity check before creating
5. Submit the form to create the product

## API Integration

The component uses the following API endpoints:

### Image Upload
```typescript
// Upload multiple images
const response = await uploadImages(files, 'products');

// Upload single image
const response = await uploadImage(file, 'products');
```

### Similarity Checking
```typescript
const similarityData = {
  name: 'Product Name',
  description: 'Product description',
  category: 'category_id',
  mainCategory: 'main_category_id',
  brand: 'Brand Name',
  specifications: { /* product specs */ },
  imageUrls: ['url1', 'url2'],
  businessId: 'business_id',
  threshold: 0.90
};

const response = await checkSimilarProducts(similarityData);
```

### Product Creation
```typescript
const productData = {
  name: 'Product Name',
  description: 'Product description',
  price: 29.99,
  cost: 20.00,
  stock: 100,
  category: 'category_id',
  mainCategory: 'main_category_id',
  businessId: 'business_id',
  sku: 'PRODUCT-SKU-001',
  status: 'active',
  images: ['image_url1', 'image_url2'],
  brand: 'Brand Name',
  specifications: { /* product specs */ },
  weight: 0.5,
  dimensions: {
    length: 10,
    width: 5,
    height: 3
  },
  tags: ['tag1', 'tag2'],
  metadata: { /* custom metadata */ }
};

const response = await createProduct(productData);
```

## Form Fields

### Required Fields
- **Product Name**: Minimum 3 characters
- **Description**: Minimum 10 characters
- **Price**: Must be greater than 0
- **Main Category**: Select from available main categories
- **Category**: Select from categories filtered by main category

### Optional Fields
- **Cost**: Product cost for margin calculation
- **Stock**: Initial stock quantity
- **SKU**: Auto-generated if not provided
- **Brand**: Product brand name
- **Weight**: Product weight in kg
- **Dimensions**: Length, width, height in cm
- **Status**: Active or inactive
- **Specifications**: Custom product specifications
- **Tags**: Product tags for categorization
- **Metadata**: Custom metadata object

## Validation Rules

### Image Validation
- **File Type**: Only image files (JPEG, PNG, GIF, etc.)
- **File Size**: Maximum 10MB per image
- **Count**: Maximum 5 images per product
- **Required**: At least 1 image required

### Form Validation
- **Name**: 3-100 characters
- **Description**: 10-1000 characters
- **Price**: Positive number
- **Cost**: Positive number (optional)
- **Stock**: Non-negative integer
- **Categories**: Must select both main category and category

## Error Handling

The component includes comprehensive error handling:

- **Upload Errors**: Network errors, file size limits, invalid file types
- **Validation Errors**: Form validation with specific error messages
- **API Errors**: Server errors, network timeouts, authentication issues
- **Similarity Check Errors**: AI service errors, timeout handling

## Styling

The component uses CSS classes that can be customized:

```css
.product-upload-overlay     /* Modal overlay */
.product-upload-modal       /* Modal container */
.upload-area               /* Drag & drop area */
.upload-placeholder        /* Upload placeholder text */
.uploaded-images          /* Image preview section */
.image-grid               /* Image preview grid */
.similarity-section       /* AI similarity section */
.similarity-alert         /* Similarity result alerts */
.form-grid               /* Form layout grid */
.form-section            /* Form section containers */
```

## Responsive Design

The component is fully responsive and works on:

- **Desktop**: Full feature set with multi-column layout
- **Tablet**: Optimized layout with stacked sections
- **Mobile**: Single-column layout with touch-friendly controls

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **File API**: Drag & drop file upload
- **FormData**: Multipart form data for image upload
- **CSS Grid**: Modern layout system
- **ES6+**: Modern JavaScript features

## Performance Considerations

- **Image Optimization**: Images are compressed before upload
- **Lazy Loading**: Categories loaded on demand
- **Debounced Search**: Similarity checking with debouncing
- **Memory Management**: Proper cleanup of file references
- **Network Optimization**: Efficient API calls with proper error handling

## Security Features

- **File Validation**: Server-side and client-side file validation
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Proper API authentication
- **File Size Limits**: Prevents abuse of upload system
- **Type Checking**: TypeScript for type safety

## Future Enhancements

- **Bulk Upload**: Upload multiple products at once
- **Template System**: Pre-defined product templates
- **Advanced AI**: More sophisticated similarity detection
- **Image Editing**: Basic image editing capabilities
- **Import/Export**: CSV/Excel import/export functionality
- **Barcode Integration**: Automatic barcode generation
- **Inventory Sync**: Real-time inventory synchronization 