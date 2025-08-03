import express from 'express';
import { z } from 'zod';
import { 
  createShopSchema, 
  updateShopSchema, 
  shopQuerySchema, 
  shopIdSchema,
  cryptoSettingsSchema 
} from '../schemas/shopSchemas';

const router = express.Router();

// Mock data for development
let shops = [
  {
    _id: '64f8a1b2c3d4e5f6',
    storeName: 'Mi Tienda',
    storeType: 'CoffeeShop',
    storeLocation: 'Centro Comercial',
    streetAddress: 'Av. Principal 123',
    city: 'Ciudad',
    state: 'Estado',
    zip: '12345',
    clientId: 'client-001',
    ecommerceEnabled: true,
    kitchenEnabled: true,
    crypto: true,
    acceptedCryptocurrencies: ['bitcoin', 'ethereum', 'luxae'],
    status: 'active',
    createdAt: '2025-07-26T19:30:00.000Z',
    updatedAt: '2025-07-26T19:30:00.000Z'
  }
];

// 1. Get All Shops
router.get('/', async (req, res) => {
  try {
    const query = shopQuerySchema.parse(req.query);
    
    let filteredShops = [...shops];
    
    // Apply filters
    if (query.storeType) {
      filteredShops = filteredShops.filter(shop => shop.storeType === query.storeType);
    }
    
    if (query.status) {
      filteredShops = filteredShops.filter(shop => shop.status === query.status);
    }
    
    if (query.city) {
      filteredShops = filteredShops.filter(shop => 
        shop.city.toLowerCase().includes(query.city!.toLowerCase())
      );
    }
    
    if (query.state) {
      filteredShops = filteredShops.filter(shop => 
        shop.state.toLowerCase().includes(query.state!.toLowerCase())
      );
    }
    
    if (query.search) {
      filteredShops = filteredShops.filter(shop => 
        shop.storeName.toLowerCase().includes(query.search!.toLowerCase()) ||
        shop.storeLocation.toLowerCase().includes(query.search!.toLowerCase())
      );
    }
    
    if (query.ecommerceEnabled !== undefined) {
      filteredShops = filteredShops.filter(shop => shop.ecommerceEnabled === query.ecommerceEnabled);
    }
    
    if (query.kitchenEnabled !== undefined) {
      filteredShops = filteredShops.filter(shop => shop.kitchenEnabled === query.kitchenEnabled);
    }
    
    // Apply sorting
    filteredShops.sort((a, b) => {
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
    const paginatedShops = filteredShops.slice(startIndex, endIndex);
    
    const total = filteredShops.length;
    const pages = Math.ceil(total / query.limit);
    
    res.json({
      success: true,
      data: paginatedShops,
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
      error: 'Failed to fetch shops'
    });
  }
});

// 2. Create Shop
router.post('/', async (req, res) => {
  try {
    const shopData = createShopSchema.parse(req.body);
    
    const newShop = {
      _id: Date.now().toString(16),
      ...shopData,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    shops.push(newShop);
    
    res.status(201).json({
      success: true,
      data: newShop,
      message: 'Shop created successfully'
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
      error: 'Failed to create shop'
    });
  }
});

// 3. Get Shop by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = shopIdSchema.parse(req.params);
    
    const shop = shops.find(s => s._id === id);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }
    
    res.json({
      success: true,
      data: shop
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
      error: 'Failed to fetch shop'
    });
  }
});

// 4. Update Shop
router.put('/:id', async (req, res) => {
  try {
    const { id } = shopIdSchema.parse(req.params);
    const updateData = updateShopSchema.parse(req.body);
    
    const shopIndex = shops.findIndex(s => s._id === id);
    
    if (shopIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }
    
    shops[shopIndex] = {
      ...shops[shopIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: shops[shopIndex],
      message: 'Shop updated successfully'
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
      error: 'Failed to update shop'
    });
  }
});

// 5. Delete Shop
router.delete('/:id', async (req, res) => {
  try {
    const { id } = shopIdSchema.parse(req.params);
    
    const shopIndex = shops.findIndex(s => s._id === id);
    
    if (shopIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }
    
    shops.splice(shopIndex, 1);
    
    res.json({
      success: true,
      message: 'Shop deleted successfully'
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
      error: 'Failed to delete shop'
    });
  }
});

// 6. Get Store Types
router.get('/store-types', async (req, res) => {
  const storeTypes = [
    {
      id: 'CoffeeShop',
      name: 'Coffee Shop',
      description: 'Cafeterías y tiendas de café',
      icon: '☕'
    },
    {
      id: 'Restaurant',
      name: 'Restaurant',
      description: 'Restaurantes y establecimientos de comida',
      icon: '🍽️'
    },
    {
      id: 'Retail',
      name: 'Retail',
      description: 'Tiendas minoristas y comercio',
      icon: '🛍️'
    },
    {
      id: 'Service',
      name: 'Service',
      description: 'Servicios y consultoría',
      icon: '🔧'
    },
    {
      id: 'Other',
      name: 'Other',
      description: 'Otros tipos de negocio',
      icon: '🏢'
    }
  ];
  
  res.json({
    success: true,
    data: storeTypes
  });
});

// 7. Test Shop Endpoint
router.get('/test', async (req, res) => {
  res.json({
    success: true,
    message: 'Shop API is working correctly',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// 8. Get Shop Crypto Settings
router.get('/:id/crypto', async (req, res) => {
  try {
    const { id } = shopIdSchema.parse(req.params);
    
    const shop = shops.find(s => s._id === id);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        crypto: shop.crypto,
        cryptoAddress: shop.cryptoAddress || null,
        acceptedCryptocurrencies: shop.acceptedCryptocurrencies
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
      error: 'Failed to fetch crypto settings'
    });
  }
});

// 9. Update Shop Crypto Settings
router.put('/:id/crypto', async (req, res) => {
  try {
    const { id } = shopIdSchema.parse(req.params);
    const cryptoData = cryptoSettingsSchema.parse(req.body);
    
    const shopIndex = shops.findIndex(s => s._id === id);
    
    if (shopIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }
    
    shops[shopIndex] = {
      ...shops[shopIndex],
      ...cryptoData,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: shops[shopIndex],
      message: 'Crypto settings updated successfully'
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
      error: 'Failed to update crypto settings'
    });
  }
});

export default router; 