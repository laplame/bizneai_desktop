// API Usage Examples
// Comprehensive examples of how to use all BizneAI API services

import {
  shopsAPI,
  kitchenAPI,
  waitlistAPI,
  paymentsAPI,
  chatAPI,
  inventoryAPI,
  ticketsAPI,
  ordersAPI,
  usersAPI,
  cryptoAPI,
  type Shop,
  type Product,
  type KitchenOrder,
  type WaitlistEntry,
  type Payment,
  type ChatMessage,
  type InventoryUpdate,
  type Ticket,
  type Order,
  type User
} from './index';

// Import the new product upload functions
import {
  getProducts,
  createProduct,
  uploadImages,
  checkSimilarProducts,
  uploadImage,
  searchProductsByImage,
  getProductCategories,
  getMainCategories,
  type CreateProductRequest,
  type SimilarityCheckRequest
} from './index';

// ===== PRODUCT UPLOAD EXAMPLES =====

/**
 * Example: Complete Product Upload Workflow
 * This demonstrates the full product upload process including:
 * 1. Image upload
 * 2. Similarity checking
 * 3. Product creation
 */
export const productUploadWorkflow = async () => {
  try {
    console.log('🚀 Starting Product Upload Workflow...');
    
    // Step 1: Upload Product Images
    console.log('📸 Step 1: Uploading product images...');
    const imageFiles = [
      new File(['image1'], 'product1.jpg', { type: 'image/jpeg' }),
      new File(['image2'], 'product2.jpg', { type: 'image/jpeg' })
    ];
    
    const uploadResponse = await uploadImages(imageFiles, 'products');
    if (!uploadResponse.success) {
      throw new Error('Failed to upload images');
    }
    
    console.log('✅ Images uploaded successfully:', uploadResponse.data.urls);
    
    // Step 2: Check for Similar Products
    console.log('🔍 Step 2: Checking for similar products...');
    const similarityData = {
      name: 'Premium Coffee Blend',
      description: 'High-quality coffee blend with rich flavor and smooth finish',
      category: 'coffee_beans',
      mainCategory: 'coffee_shop',
      brand: 'CoffeeCo',
      specifications: {
        roastLevel: 'medium',
        origin: 'Colombia',
        weight: '250g'
      },
      imageUrls: uploadResponse.data.urls,
      businessId: 'your-business-id',
      threshold: 0.90
    };
    
    const similarityResponse = await checkSimilarProducts(similarityData);
    if (similarityResponse.success) {
      console.log('✅ Similarity check completed');
      console.log('Recommendation:', similarityResponse.data.recommendation);
      console.log('Similar products found:', similarityResponse.data.similarProducts.length);
      
      if (similarityResponse.data.recommendation === 'use_existing') {
        console.log('⚠️ Similar product found! Consider using existing product.');
        return;
      }
    }
    
    // Step 3: Create Product
    console.log('📝 Step 3: Creating product...');
    const productData = {
      name: 'Premium Coffee Blend',
      description: 'High-quality coffee blend with rich flavor and smooth finish',
      price: 12.99,
      cost: 8.50,
      stock: 50,
      category: 'coffee_beans',
      mainCategory: 'coffee_shop',
      businessId: 'your-business-id',
      sku: 'COFFEE-BLEND-001',
      status: 'active' as const,
      images: uploadResponse.data.urls,
      brand: 'CoffeeCo',
      specifications: {
        roastLevel: 'medium',
        origin: 'Colombia',
        weight: '250g'
      },
      weight: 0.25,
      dimensions: {
        length: 15,
        width: 10,
        height: 5
      },
      tags: ['coffee', 'premium', 'blend'],
      metadata: {
        supplier: 'CoffeeCo',
        batchNumber: 'BATCH-2024-001'
      }
    };
    
    const createResponse = await createProduct(productData);
    if (createResponse.success) {
      console.log('✅ Product created successfully:', createResponse.data);
    } else {
      throw new Error('Failed to create product');
    }
    
    console.log('🎉 Product upload workflow completed successfully!');
    
  } catch (error) {
    console.error('❌ Product upload workflow failed:', error);
    throw error;
  }
};

/**
 * Example: Bulk Product Upload
 * Upload multiple products with image processing
 */
export const bulkProductUpload = async (products: Array<{
  name: string;
  description: string;
  price: number;
  category: string;
  mainCategory: string;
  images: File[];
}>) => {
  console.log('🚀 Starting Bulk Product Upload...');
  
  const results = [];
  
  for (const product of products) {
    try {
      console.log(`📦 Processing product: ${product.name}`);
      
      // Upload images for this product
      const uploadResponse = await uploadImages(product.images, 'products');
      if (!uploadResponse.success) {
        throw new Error(`Failed to upload images for ${product.name}`);
      }
      
      // Create product with uploaded images
      const productData = {
        ...product,
        businessId: 'your-business-id',
        sku: `${product.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
        status: 'active' as const,
        images: uploadResponse.data.urls,
        stock: 0,
        cost: product.price * 0.7 // 30% margin
      };
      
      const createResponse = await createProduct(productData);
      if (createResponse.success) {
        results.push({
          name: product.name,
          status: 'success',
          product: createResponse.data
        });
        console.log(`✅ Created product: ${product.name}`);
      } else {
        results.push({
          name: product.name,
          status: 'failed',
          error: 'Failed to create product'
        });
      }
      
    } catch (error) {
      console.error(`❌ Failed to process ${product.name}:`, error);
      results.push({
        name: product.name,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  console.log('📊 Bulk upload results:', results);
  return results;
};

/**
 * Example: Image Search and Product Creation
 * Search for existing products by image and create similar ones
 */
export const imageSearchAndCreate = async (imageFile: File, productInfo: {
  name: string;
  description: string;
  price: number;
  category: string;
  mainCategory: string;
}) => {
  console.log('🔍 Starting Image Search and Create...');
  
  try {
    // Step 1: Upload the image
    const uploadResponse = await uploadImage(imageFile, 'products');
    if (!uploadResponse.success) {
      throw new Error('Failed to upload image');
    }
    
    const imageUrl = uploadResponse.data.urls[0];
    
    // Step 2: Search for similar products by image
    console.log('🔍 Searching for similar products by image...');
    const searchResponse = await searchProductsByImage(imageUrl, productInfo.mainCategory, 5);
    
    if (searchResponse.success && searchResponse.data.length > 0) {
      console.log('📋 Found similar products:', searchResponse.data.length);
      
      // Show similar products to user
      searchResponse.data.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - $${product.price}`);
      });
      
      // Ask user if they want to create a new product or use existing
      const shouldCreateNew = true; // This would be user input in real app
      
      if (!shouldCreateNew) {
        console.log('✅ Using existing product');
        return searchResponse.data[0];
      }
    }
    
    // Step 3: Create new product
    console.log('📝 Creating new product...');
    const productData = {
      ...productInfo,
      businessId: 'your-business-id',
      sku: `${productInfo.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
      status: 'active' as const,
      images: [imageUrl],
      stock: 0
    };
    
    const createResponse = await createProduct(productData);
    if (createResponse.success) {
      console.log('✅ New product created:', createResponse.data);
      return createResponse.data;
    } else {
      throw new Error('Failed to create product');
    }
    
  } catch (error) {
    console.error('❌ Image search and create failed:', error);
    throw error;
  }
};

/**
 * Example: Category-based Product Upload
 * Upload products with automatic category assignment
 */
export const categoryBasedUpload = async () => {
  console.log('📂 Starting Category-based Upload...');
  
  try {
    // Get available categories
    const [categoriesResponse, mainCategoriesResponse] = await Promise.all([
      getProductCategories(),
      getMainCategories()
    ]);
    
    if (!categoriesResponse.success || !mainCategoriesResponse.success) {
      throw new Error('Failed to load categories');
    }
    
    console.log('📂 Available main categories:', mainCategoriesResponse.data.map(cat => cat.name));
    console.log('📂 Available categories:', categoriesResponse.data.map(cat => cat.name));
    
    // Example: Upload coffee products
    const coffeeProducts = [
      {
        name: 'Espresso Blend',
        description: 'Strong espresso blend for coffee shops',
        price: 15.99,
        category: 'coffee_beans',
        mainCategory: 'coffee_shop',
        images: [new File(['espresso'], 'espresso.jpg', { type: 'image/jpeg' })]
      },
      {
        name: 'Cappuccino Cup',
        description: 'Premium ceramic cup for cappuccino',
        price: 8.50,
        category: 'cups',
        mainCategory: 'coffee_shop',
        images: [new File(['cup'], 'cup.jpg', { type: 'image/jpeg' })]
      }
    ];
    
    const results = await bulkProductUpload(coffeeProducts);
    console.log('✅ Category-based upload completed:', results);
    
    return results;
    
  } catch (error) {
    console.error('❌ Category-based upload failed:', error);
    throw error;
  }
};

/**
 * Example: Advanced Product Upload with Validation
 * Upload products with comprehensive validation and error handling
 */
export const advancedProductUpload = async (productData: {
  name: string;
  description: string;
  price: number;
  category: string;
  mainCategory: string;
  images: File[];
  specifications?: Record<string, any>;
}) => {
  console.log('🔧 Starting Advanced Product Upload...');
  
  try {
    // Validation
    if (!productData.name || productData.name.length < 3) {
      throw new Error('Product name must be at least 3 characters long');
    }
    
    if (!productData.description || productData.description.length < 10) {
      throw new Error('Product description must be at least 10 characters long');
    }
    
    if (productData.price <= 0) {
      throw new Error('Product price must be greater than 0');
    }
    
    if (productData.images.length === 0) {
      throw new Error('At least one product image is required');
    }
    
    if (productData.images.length > 5) {
      throw new Error('Maximum 5 images allowed per product');
    }
    
    // Check file sizes
    const maxSize = 10 * 1024 * 1024; // 10MB
    for (const image of productData.images) {
      if (image.size > maxSize) {
        throw new Error(`Image ${image.name} is too large. Maximum size is 10MB`);
      }
      
      if (!image.type.startsWith('image/')) {
        throw new Error(`File ${image.name} is not an image`);
      }
    }
    
    console.log('✅ Validation passed');
    
    // Upload images
    console.log('📸 Uploading images...');
    const uploadResponse = await uploadImages(productData.images, 'products');
    if (!uploadResponse.success) {
      throw new Error('Failed to upload images');
    }
    
    // Check for similar products
    console.log('🔍 Checking for similar products...');
    const similarityData = {
      name: productData.name,
      description: productData.description,
      category: productData.category,
      mainCategory: productData.mainCategory,
      imageUrls: uploadResponse.data.urls,
      businessId: 'your-business-id',
      threshold: 0.85
    };
    
    const similarityResponse = await checkSimilarProducts(similarityData);
    let similarityWarning = '';
    
    if (similarityResponse.success) {
      if (similarityResponse.data.recommendation === 'use_existing') {
        similarityWarning = '⚠️ Very similar product found. Consider using existing product.';
      } else if (similarityResponse.data.recommendation === 'review_required') {
        similarityWarning = '⚠️ Similar products found. Please review before creating.';
      }
    }
    
    // Create product
    console.log('📝 Creating product...');
    const finalProductData = {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      cost: productData.price * 0.7, // 30% margin
      stock: 0,
      category: productData.category,
      mainCategory: productData.mainCategory,
      businessId: 'your-business-id',
      sku: `${productData.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
      status: 'active' as const,
      images: uploadResponse.data.urls,
      specifications: productData.specifications || {},
      metadata: {
        uploadedAt: new Date().toISOString(),
        similarityWarning
      }
    };
    
    const createResponse = await createProduct(finalProductData);
    if (!createResponse.success) {
      throw new Error('Failed to create product');
    }
    
    console.log('✅ Advanced product upload completed successfully');
    console.log('📊 Product created:', createResponse.data);
    
    if (similarityWarning) {
      console.log(similarityWarning);
    }
    
    return {
      product: createResponse.data,
      similarityWarning,
      uploadedImages: uploadResponse.data.urls
    };
    
  } catch (error) {
    console.error('❌ Advanced product upload failed:', error);
    throw error;
  }
};

/**
 * Example: How to use the product upload functionality
 */
export const demonstrateProductUpload = async () => {
  console.log('🎯 Product Upload Demonstration');
  console.log('================================');
  
  try {
    // Example 1: Simple product upload
    console.log('\n1️⃣ Simple Product Upload');
    await productUploadWorkflow();
    
    // Example 2: Bulk upload
    console.log('\n2️⃣ Bulk Product Upload');
    const sampleProducts = [
      {
        name: 'Coffee Mug',
        description: 'Ceramic coffee mug with handle',
        price: 12.99,
        category: 'cups',
        mainCategory: 'coffee_shop',
        images: [new File(['mug'], 'mug.jpg', { type: 'image/jpeg' })]
      },
      {
        name: 'Coffee Beans',
        description: 'Premium coffee beans',
        price: 18.99,
        category: 'coffee_beans',
        mainCategory: 'coffee_shop',
        images: [new File(['beans'], 'beans.jpg', { type: 'image/jpeg' })]
      }
    ];
    
    await bulkProductUpload(sampleProducts);
    
    // Example 3: Image search
    console.log('\n3️⃣ Image Search and Create');
    const sampleImage = new File(['sample'], 'sample.jpg', { type: 'image/jpeg' });
    await imageSearchAndCreate(sampleImage, {
      name: 'Sample Product',
      description: 'Product found by image search',
      price: 25.99,
      category: 'accessories',
      mainCategory: 'coffee_shop'
    });
    
    // Example 4: Category-based upload
    console.log('\n4️⃣ Category-based Upload');
    await categoryBasedUpload();
    
    // Example 5: Advanced upload with validation
    console.log('\n5️⃣ Advanced Upload with Validation');
    await advancedProductUpload({
      name: 'Premium Coffee Maker',
      description: 'High-end coffee maker with advanced features',
      price: 299.99,
      category: 'coffee_machines',
      mainCategory: 'coffee_shop',
      images: [new File(['maker'], 'maker.jpg', { type: 'image/jpeg' })],
      specifications: {
        power: '1200W',
        capacity: '12 cups',
        warranty: '2 years'
      }
    });
    
    console.log('\n🎉 All product upload examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Product upload demonstration failed:', error);
  }
};

// Export all examples including the new product upload examples
export const productUploadExamples = {
  productUploadWorkflow,
  bulkProductUpload,
  imageSearchAndCreate,
  categoryBasedUpload,
  advancedProductUpload,
  demonstrateProductUpload
};

// ===== SHOP MANAGEMENT EXAMPLES =====

export const shopExamples = {
  // Get all active coffee shops
  async getActiveCoffeeShops() {
    try {
      const response = await shopsAPI.getShops({
        storeType: 'CoffeeShop',
        status: 'active',
        page: 1,
        limit: 20
      });
      
      if (response.success) {
        console.log('Active coffee shops:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching coffee shops:', error);
    }
  },

  // Create a new shop
  async createNewShop() {
    try {
      const shopData = {
        storeName: "Mi Cafetería",
        storeType: "CoffeeShop",
        storeLocation: "Centro Comercial",
        streetAddress: "Av. Principal 123",
        city: "Ciudad",
        state: "Estado",
        zip: "12345",
        clientId: "client-001",
        ecommerceEnabled: true,
        kitchenEnabled: true,
        crypto: true,
        acceptedCryptocurrencies: ["bitcoin", "ethereum", "luxae"]
      };

      const response = await shopsAPI.createShop(shopData);
      
      if (response.success) {
        console.log('Shop created:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error creating shop:', error);
    }
  },

  // Get store types
  async getStoreTypes() {
    try {
      const response = await shopsAPI.getStoreTypes();
      
      if (response.success) {
        console.log('Available store types:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching store types:', error);
    }
  }
};

// ===== PRODUCT MANAGEMENT EXAMPLES =====

export const productExamples = {
  // Get products by category
  async getCoffeeProducts() {
    try {
      const response = await getProducts({
        mainCategory: 'coffee_shop',
        status: 'active',
        page: 1,
        limit: 20
      });
      
      if (response.success) {
        console.log('Coffee products:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  },

  // Create a new product
  async createNewProduct() {
    try {
      const productData = {
        name: "Cappuccino Grande",
        description: "Café espresso con leche espumosa",
        price: 4.50,
        cost: 2.25,
        category: "Bebidas Calientes",
        mainCategory: "coffee_shop",
        businessId: "64f8a1b2c3d4e5f6",
        stock: 100,
        sku: "CAP-GRD-001",
        status: "active" as const,
        brand: "Café Premium",
        images: []
      };

      const response = await createProduct(productData);
      
      if (response.success) {
        console.log('Product created:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error creating product:', error);
    }
  },

  // Upload product images
  async uploadProductImages(files: File[]) {
    try {
      const response = await uploadImages(files);
      
      if (response.success) {
        console.log('Images uploaded:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error uploading images:', error);
    }
  }
};

// ===== KITCHEN MANAGEMENT EXAMPLES =====

export const kitchenExamples = {
  // Get pending kitchen orders
  async getPendingOrders(shopId: string) {
    try {
      const response = await kitchenAPI.getOrders({
        shopId,
        status: 'pending',
        priority: 'high',
        page: 1,
        limit: 20
      });
      
      if (response.success) {
        console.log('Pending orders:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  },

  // Create a new kitchen order
  async createKitchenOrder(shopId: string) {
    try {
      const orderData = {
        shopId: "shop_123",
        customerName: "Juan Pérez",
        tableNumber: "A5",
        waiterName: "María García",
        items: [
          {
            name: "Cappuccino Grande",
            quantity: 2,
            notes: "Sin azúcar"
          }
        ],
        priority: "normal" as const,
        estimatedTime: 15,
        status: "pending" as const
      };

      const response = await kitchenAPI.createOrder(orderData);
      
      if (response.success) {
        console.log('Kitchen order created:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error creating kitchen order:', error);
    }
  },

  // Update order status
  async updateOrderStatus(orderId: string, shopId: string) {
    try {
      const response = await kitchenAPI.partialUpdateOrder(orderId, shopId, {
        status: 'preparing',
        estimatedTime: 10
      });
      
      if (response.success) {
        console.log('Order updated:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  }
};

// ===== WAITLIST MANAGEMENT EXAMPLES =====

export const waitlistExamples = {
  // Add customer to waitlist
  async addToWaitlist(shopId: string) {
    try {
      const entryData = {
        name: "Test Customer",
        items: [{
          product: {
            id: "1",
            name: "Test Item",
            price: 12,
            category: "test"
          },
          quantity: 1
        }],
        total: 12,
        source: "local" as const,
        customerInfo: {
          name: "Test Customer",
          phone: "+1234567890"
        }
      };

      const response = await waitlistAPI.addToShopWaitlist(shopId, entryData);
      
      if (response.success) {
        console.log('Added to waitlist:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error adding to waitlist:', error);
    }
  },

  // Get waitlist entries
  async getWaitlistEntries(shopId: string) {
    try {
      const response = await waitlistAPI.getWaitlistEntries(shopId, {
        status: 'waiting',
        page: 1,
        limit: 20
      });
      
      if (response.success) {
        console.log('Waitlist entries:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    }
  }
};

// ===== PAYMENT MANAGEMENT EXAMPLES =====

export const paymentExamples = {
  // Process a payment
  async processPayment(shopId: string) {
    try {
      const paymentData = {
        type: "sale" as const,
        amount: 25.50,
        currency: "USD",
        paymentMethod: "card" as const,
        status: "completed" as const,
        description: "Coffee and pastry order",
        transactionId: "txn_123456789"
      };

      const response = await paymentsAPI.processPayment(shopId, paymentData);
      
      if (response.success) {
        console.log('Payment processed:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  },

  // Get payment statistics
  async getPaymentStats(shopId: string) {
    try {
      const response = await paymentsAPI.getPaymentStats(shopId, '30d');
      
      if (response.success) {
        console.log('Payment stats:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  }
};

// ===== CHAT MANAGEMENT EXAMPLES =====

export const chatExamples = {
  // Send a chat message
  async sendChatMessage(shopId: string) {
    try {
      const messageData = {
        content: "Hello, I have a question about your menu",
        context: {
          businessType: "restaurant",
          customerId: "cust_123"
        },
        senderType: "customer" as const,
        messageType: "text" as const
      };

      const response = await chatAPI.sendMessage(shopId, messageData);
      
      if (response.success) {
        console.log('Message sent:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  },

  // Get chat history
  async getChatHistory(shopId: string) {
    try {
      const response = await chatAPI.getChatHistory(shopId, {
        page: 1,
        limit: 50
      });
      
      if (response.success) {
        console.log('Chat history:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  }
};

// ===== INVENTORY MANAGEMENT EXAMPLES =====

export const inventoryExamples = {
  // Update inventory
  async updateInventory(shopId: string) {
    try {
      const updateData = {
        productId: "prod_123",
        quantity: 10,
        action: "add" as const,
        reason: "Restock from supplier",
        notes: "Fresh batch received"
      };

      const response = await inventoryAPI.updateInventory(shopId, updateData);
      
      if (response.success) {
        console.log('Inventory updated:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  },

  // Get inventory status
  async getInventoryStatus(shopId: string) {
    try {
      const response = await inventoryAPI.getInventoryStatus(shopId, {
        lowStock: true
      });
      
      if (response.success) {
        console.log('Inventory status:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching inventory status:', error);
    }
  }
};

// ===== TICKET MANAGEMENT EXAMPLES =====

export const ticketExamples = {
  // Create a ticket
  async createTicket(shopId: string, saleId: string) {
    try {
      const ticketData = {
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "+1234567890",
        items: [
          {
            productId: "prod_123",
            name: "Cappuccino Grande",
            quantity: 2,
            price: 4.50,
            total: 9.00
          }
        ],
        subtotal: 9.00,
        tax: 0.90,
        total: 9.90,
        paymentMethod: "card",
        status: "completed" as const
      };

      const response = await ticketsAPI.createTicket(shopId, saleId, ticketData);
      
      if (response.success) {
        console.log('Ticket created:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  }
};

// ===== ORDER MANAGEMENT EXAMPLES =====

export const orderExamples = {
  // Create an order
  async createOrder() {
    try {
      const orderData = {
        userId: "user123",
        items: [
          {
            productId: "64f8a1b2c3d4e5f6",
            name: "Cappuccino Grande",
            quantity: 2,
            price: 4.50,
            shippingAddress: {
              street: "123 Main St",
              city: "Ciudad",
              state: "Estado",
              country: "País",
              zipCode: "12345"
            },
            paymentMethod: "card"
          }
        ],
        totalAmount: 9.00,
        shippingAddress: {
          street: "123 Main St",
          city: "Ciudad",
          state: "Estado",
          country: "País",
          zipCode: "12345"
        },
        paymentMethod: "card"
      };

      const response = await ordersAPI.createOrder(orderData);
      
      if (response.success) {
        console.log('Order created:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  }
};

// ===== USER MANAGEMENT EXAMPLES =====

export const userExamples = {
  // Create a new user
  async createUser() {
    try {
      const userData = {
        firstName: "Juan",
        lastName: "Pérez",
        email: "juan@example.com",
        companyName: "Mi Empresa",
        businessType: "CoffeeShop",
        message: "Interesado en el sistema",
        userId: "user123",
        userLocation: "Ciudad, Estado"
      };

      const response = await usersAPI.createUser(userData);
      
      if (response.success) {
        console.log('User created:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  }
};

// ===== CRYPTO MANAGEMENT EXAMPLES =====

export const cryptoExamples = {
  // Get crypto exchange rates
  async getCryptoRates() {
    try {
      const response = await cryptoAPI.getExchangeRates();
      
      if (response.success) {
        console.log('Crypto rates:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching crypto rates:', error);
    }
  },

  // Process crypto payment
  async processCryptoPayment() {
    try {
      const paymentData = {
        orderId: "64f8a1b2c3d4e5f6",
        cryptocurrency: "bitcoin",
        amount: 0.001,
        walletAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        transactionHash: "0x1234567890abcdef..."
      };

      const response = await cryptoAPI.processCryptoPayment(paymentData);
      
      if (response.success) {
        console.log('Crypto payment processed:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error processing crypto payment:', error);
    }
  }
};

// ===== COMPREHENSIVE WORKFLOW EXAMPLE =====

export const completeWorkflowExample = {
  // Complete workflow: Create shop -> Add products -> Process order -> Generate ticket
  async runCompleteWorkflow() {
    try {
      // 1. Create a shop
      const shopData = {
        storeName: "Test Coffee Shop",
        storeType: "CoffeeShop",
        storeLocation: "Test Location",
        streetAddress: "123 Test St",
        city: "Test City",
        state: "Test State",
        zip: "12345",
        clientId: "test-001",
        ecommerceEnabled: true,
        kitchenEnabled: true,
        crypto: true,
        acceptedCryptocurrencies: ["bitcoin", "ethereum"]
      };

      const shopResponse = await shopsAPI.createShop(shopData);
      if (!shopResponse.success) throw new Error('Failed to create shop');
      
      const shopId = shopResponse.data._id;
      console.log('Shop created with ID:', shopId);

      // 2. Create a product
      const productData = {
        name: "Test Cappuccino",
        description: "Test coffee product",
        price: 4.50,
        cost: 2.25,
        category: "Beverages",
        mainCategory: "coffee_shop",
        businessId: shopId,
        stock: 100,
        sku: "TEST-CAP-001",
        status: "active" as const,
        brand: "Test Brand",
        images: []
      };

      const productResponse = await createProduct(productData);
      if (!productResponse.success) throw new Error('Failed to create product');
      
      const productId = productResponse.data._id;
      console.log('Product created with ID:', productId);

      // 3. Create a kitchen order
      const orderData = {
        shopId,
        customerName: "Test Customer",
        tableNumber: "T1",
        waiterName: "Test Waiter",
        items: [
          {
            name: "Test Cappuccino",
            quantity: 2,
            notes: "Test order"
          }
        ],
        priority: "normal" as const,
        estimatedTime: 10,
        status: "pending" as const
      };

      const orderResponse = await kitchenAPI.createOrder(orderData);
      if (!orderResponse.success) throw new Error('Failed to create kitchen order');
      
      console.log('Kitchen order created:', orderResponse.data);

      // 4. Process payment
      const paymentData = {
        type: "sale" as const,
        amount: 9.00,
        currency: "USD",
        paymentMethod: "card" as const,
        status: "completed" as const,
        description: "Test order payment"
      };

      const paymentResponse = await paymentsAPI.processPayment(shopId, paymentData);
      if (!paymentResponse.success) throw new Error('Failed to process payment');
      
      console.log('Payment processed:', paymentResponse.data);

      // 5. Create ticket
      const saleId = `sale_${Date.now()}`;
      const ticketData = {
        customerName: "Test Customer",
        customerEmail: "test@example.com",
        items: [
          {
            productId,
            name: "Test Cappuccino",
            quantity: 2,
            price: 4.50,
            total: 9.00
          }
        ],
        subtotal: 9.00,
        tax: 0.90,
        total: 9.90,
        paymentMethod: "card",
        status: "completed" as const
      };

      const ticketResponse = await ticketsAPI.createTicket(shopId, saleId, ticketData);
      if (!ticketResponse.success) throw new Error('Failed to create ticket');
      
      console.log('Ticket created:', ticketResponse.data);

      return {
        shop: shopResponse.data,
        product: productResponse.data,
        order: orderResponse.data,
        payment: paymentResponse.data,
        ticket: ticketResponse.data
      };

    } catch (error) {
      console.error('Workflow failed:', error);
      throw error;
    }
  }
}; 