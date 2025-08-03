import express from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/products'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Product schemas
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive('Price must be positive'),
  cost: z.number().positive().optional(),
  category: z.string().min(1, 'Category is required').max(100),
  mainCategory: z.enum(['coffee_shop', 'restaurant', 'retail', 'jewelry', 'other']),
  businessId: z.string().min(1, 'Business ID is required'),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  sku: z.string().max(50).optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  brand: z.string().max(100).optional()
});

const updateProductSchema = createProductSchema.partial();

const productQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  status: z.enum(['active', 'inactive']).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  mainCategory: z.enum(['coffee_shop', 'restaurant', 'retail', 'jewelry', 'other']).optional(),
  minPrice: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  maxPrice: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Mock data for development
let products = [
  {
    _id: '64f8a1b2c3d4e5f6',
    name: 'Cappuccino Grande',
    description: 'Café espresso con leche espumosa',
    price: 4.50,
    cost: 2.25,
    category: 'Bebidas Calientes',
    mainCategory: 'coffee_shop',
    businessId: '64f8a1b2c3d4e5f6',
    stock: 100,
    sku: 'CAP-GRD-001',
    status: 'active',
    brand: 'Café Premium',
    images: [],
    createdAt: '2025-07-26T19:30:00.000Z',
    updatedAt: '2025-07-26T19:30:00.000Z'
  }
];

// 1. Get All Products
router.get('/', async (req, res) => {
  try {
    const query = productQuerySchema.parse(req.query);
    
    let filteredProducts = [...products];
    
    // Apply filters
    if (query.status) {
      filteredProducts = filteredProducts.filter(product => product.status === query.status);
    }
    
    if (query.search) {
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(query.search!.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.search!.toLowerCase())
      );
    }
    
    if (query.category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase().includes(query.category!.toLowerCase())
      );
    }
    
    if (query.mainCategory) {
      filteredProducts = filteredProducts.filter(product => product.mainCategory === query.mainCategory);
    }
    
    if (query.minPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => product.price >= query.minPrice!);
    }
    
    if (query.maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => product.price <= query.maxPrice!);
    }
    
    // Apply sorting
    filteredProducts.sort((a, b) => {
      const aValue = a[query.sortBy as keyof typeof a];
      const bValue = b[query.sortBy as keyof typeof b];
      
      if (query.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Apply pagination
    const startIndex = (query.page - 1) * query.limit;
    const endIndex = startIndex + query.limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    const total = filteredProducts.length;
    const pages = Math.ceil(total / query.limit);
    
    res.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        current: query.page,
        pages,
        total,
        limit: query.limit
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

// 2. Create Product
router.post('/', async (req, res) => {
  try {
    const productData = createProductSchema.parse(req.body);
    
    const newProduct = {
      _id: Date.now().toString(16),
      ...productData,
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    
    res.status(201).json({
      success: true,
      data: newProduct,
      message: 'Product created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    });
  }
});

// 3. Get Product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    
    const product = products.find(p => p._id === id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
});

// 4. Update Product
router.put('/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const updateData = updateProductSchema.parse(req.body);
    
    const productIndex = products.findIndex(p => p._id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    products[productIndex] = {
      ...products[productIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: products[productIndex],
      message: 'Product updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    });
  }
});

// 5. Delete Product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    
    const productIndex = products.findIndex(p => p._id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    products.splice(productIndex, 1);
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
});

// 6. Upload Product Images
router.post('/upload-images', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images uploaded'
      });
    }
    
    const uploadedFiles = (req.files as Express.Multer.File[]).map(file => ({
      url: `/uploads/products/${file.filename}`,
      publicId: `products/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));
    
    res.json({
      success: true,
      data: {
        urls: uploadedFiles.map(file => file.url),
        publicIds: uploadedFiles.map(file => file.publicId)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to upload images'
    });
  }
});

// 7. Add Images to Product
router.post('/:id/images', upload.array('images', 5), async (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images uploaded'
      });
    }
    
    const productIndex = products.findIndex(p => p._id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    const uploadedFiles = (req.files as Express.Multer.File[]).map(file => ({
      url: `/uploads/products/${file.filename}`,
      publicId: `products/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));
    
    products[productIndex].images = [
      ...products[productIndex].images,
      ...uploadedFiles.map(file => file.url)
    ];
    
    products[productIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: products[productIndex],
      message: 'Images added successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to add images'
    });
  }
});

// 8. Delete Product Image
router.delete('/:id/images/:imageIndex', async (req, res) => {
  try {
    const { id, imageIndex } = z.object({ 
      id: z.string(),
      imageIndex: z.string().transform(Number)
    }).parse(req.params);
    
    const productIndex = products.findIndex(p => p._id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    if (imageIndex < 0 || imageIndex >= products[productIndex].images.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image index'
      });
    }
    
    products[productIndex].images.splice(imageIndex, 1);
    products[productIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: products[productIndex],
      message: 'Image deleted successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete image'
    });
  }
});

// 9. Get Categories
router.get('/categories', async (req, res) => {
  const { language = 'en' } = req.query;
  
  const categories = {
    en: [
      { id: 'beverages', name: 'Beverages', icon: '🥤' },
      { id: 'food', name: 'Food', icon: '🍽️' },
      { id: 'desserts', name: 'Desserts', icon: '🍰' },
      { id: 'accessories', name: 'Accessories', icon: '🛍️' }
    ],
    es: [
      { id: 'bebidas', name: 'Bebidas', icon: '🥤' },
      { id: 'comida', name: 'Comida', icon: '🍽️' },
      { id: 'postres', name: 'Postres', icon: '🍰' },
      { id: 'accesorios', name: 'Accesorios', icon: '🛍️' }
    ]
  };
  
  res.json({
    success: true,
    data: categories[language as keyof typeof categories] || categories.en
  });
});

// 10. Get Main Categories
router.get('/main-categories', async (req, res) => {
  const mainCategories = [
    { id: 'coffee_shop', name: 'Coffee Shop', icon: '☕' },
    { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
    { id: 'retail', name: 'Retail', icon: '🛍️' },
    { id: 'jewelry', name: 'Jewelry', icon: '💎' },
    { id: 'other', name: 'Other', icon: '🏢' }
  ];
  
  res.json({
    success: true,
    data: mainCategories
  });
});

// 11. Get Category Statistics
router.get('/categories/stats', async (req, res) => {
  const stats = {
    totalProducts: products.length,
    byCategory: products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byMainCategory: products.reduce((acc, product) => {
      acc[product.mainCategory] = (acc[product.mainCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byStatus: products.reduce((acc, product) => {
      acc[product.status] = (acc[product.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
  
  res.json({
    success: true,
    data: stats
  });
});

// 12. Get Products by Category
router.get('/by-category/:category', async (req, res) => {
  try {
    const { category } = z.object({ category: z.string() }).parse(req.params);
    const query = productQuerySchema.parse(req.query);
    
    let filteredProducts = products.filter(product => 
      product.category.toLowerCase().includes(category.toLowerCase())
    );
    
    if (query.mainCategory) {
      filteredProducts = filteredProducts.filter(product => 
        product.mainCategory === query.mainCategory
      );
    }
    
    if (query.businessId) {
      filteredProducts = filteredProducts.filter(product => 
        product.businessId === query.businessId
      );
    }
    
    // Apply sorting and pagination
    filteredProducts.sort((a, b) => {
      const aValue = a[query.sortBy as keyof typeof a];
      const bValue = b[query.sortBy as keyof typeof b];
      
      if (query.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    const startIndex = (query.page - 1) * query.limit;
    const endIndex = startIndex + query.limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    const total = filteredProducts.length;
    const pages = Math.ceil(total / query.limit);
    
    res.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        current: query.page,
        pages,
        total,
        limit: query.limit
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products by category'
    });
  }
});

// 13. Test Products Endpoint
router.get('/test', async (req, res) => {
  res.json({
    success: true,
    message: 'Products API is working correctly',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// 14. Check Product Similarity (AI-powered)
router.post('/check-similarity', async (req, res) => {
  try {
    const similaritySchema = z.object({
      name: z.string().min(1, 'Product name is required'),
      description: z.string().min(1, 'Description is required'),
      category: z.string().min(1, 'Category is required'),
      mainCategory: z.string().min(1, 'Main category is required'),
      brand: z.string().optional(),
      specifications: z.record(z.any()).optional(),
      imageUrls: z.array(z.string()).optional(),
      businessId: z.string().min(1, 'Business ID is required'),
      threshold: z.number().min(0).max(1).default(0.90)
    });

    const similarityData = similaritySchema.parse(req.body);
    
    // Mock similarity check (in real implementation, this would use Qdrant + embeddings)
    const mockSimilarProducts = products.filter(product => {
      // Simple text-based similarity check
      const nameSimilarity = product.name.toLowerCase().includes(similarityData.name.toLowerCase()) ||
                           similarityData.name.toLowerCase().includes(product.name.toLowerCase());
      
      const categoryMatch = product.category.toLowerCase() === similarityData.category.toLowerCase() ||
                           product.mainCategory === similarityData.mainCategory;
      
      const brandMatch = similarityData.brand && product.brand && 
                        product.brand.toLowerCase() === similarityData.brand.toLowerCase();
      
      return nameSimilarity || (categoryMatch && brandMatch);
    });

    const hasSimilarProducts = mockSimilarProducts.length > 0;
    
    // Calculate similarity scores (mock)
    const similarityScores = mockSimilarProducts.map(product => ({
      productId: product._id,
      score: Math.random() * 0.3 + 0.7, // Random score between 0.7 and 1.0
      reason: 'Text-based similarity match'
    }));

    // Determine recommendation based on highest similarity score
    const maxScore = similarityScores.length > 0 ? Math.max(...similarityScores.map(s => s.score)) : 0;
    let recommendation: 'use_existing' | 'review_required' | 'create_new';
    let searchMethod: 'vector-based' | 'text-based' | 'text-based-fallback';

    if (maxScore >= 0.95) {
      recommendation = 'use_existing';
      searchMethod = 'vector-based';
    } else if (maxScore >= 0.90) {
      recommendation = 'review_required';
      searchMethod = 'text-based';
    } else {
      recommendation = 'create_new';
      searchMethod = 'text-based-fallback';
    }

    res.json({
      success: true,
      data: {
        hasSimilarProducts,
        similarProducts: mockSimilarProducts,
        recommendation,
        searchMethod,
        totalFound: mockSimilarProducts.length,
        similarityScores
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to check product similarity'
    });
  }
});

// 15. Search Products by Image
router.post('/search-by-image', async (req, res) => {
  try {
    const searchSchema = z.object({
      imageUrl: z.string().url('Valid image URL is required'),
      mainCategory: z.string().optional(),
      limit: z.number().min(1).max(50).default(10)
    });

    const searchData = searchSchema.parse(req.body);
    
    // Mock image-based search (in real implementation, this would use image embeddings)
    const mockImageResults = products.filter(product => {
      if (searchData.mainCategory && product.mainCategory !== searchData.mainCategory) {
        return false;
      }
      
      // Simulate image similarity based on category
      return product.mainCategory === searchData.mainCategory || 
             Math.random() > 0.7; // 30% chance of match
    }).slice(0, searchData.limit);

    res.json({
      success: true,
      data: mockImageResults
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to search products by image'
    });
  }
});

export default router; 