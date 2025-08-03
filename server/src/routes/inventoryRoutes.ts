import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Inventory schemas
const createInventoryUpdateSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int('Quantity must be an integer'),
  action: z.enum(['add', 'remove', 'set']),
  reason: z.string().min(1, 'Reason is required'),
  locationId: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const inventoryQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  locationId: z.string().optional(),
  lowStock: z.enum(['true', 'false']).optional(),
  outOfStock: z.enum(['true', 'false']).optional()
});

// Mock inventory data
let inventoryUpdates: any[] = [];

// 1. Update Inventory
router.post('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = z.object({ shopId: z.string() }).parse(req.params);
    const updateData = createInventoryUpdateSchema.parse(req.body);
    
    const newUpdate = {
      _id: Date.now().toString(16),
      shopId,
      ...updateData,
      createdAt: new Date().toISOString()
    };
    
    inventoryUpdates.push(newUpdate);
    
    res.status(201).json({
      success: true,
      data: newUpdate,
      message: 'Inventory updated successfully'
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
      error: 'Failed to update inventory'
    });
  }
});

// 2. Get Inventory Status
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = z.object({ shopId: z.string() }).parse(req.params);
    const query = inventoryQuerySchema.parse(req.query);
    
    // Mock inventory status
    const inventoryStatus = [
      {
        productId: 'prod_123',
        productName: 'Cappuccino Grande',
        currentStock: 25,
        minStock: 10,
        maxStock: 100,
        locationId: 'loc_001',
        lastUpdated: new Date().toISOString()
      },
      {
        productId: 'prod_456',
        productName: 'Espresso Shot',
        currentStock: 5,
        minStock: 10,
        maxStock: 50,
        locationId: 'loc_001',
        lastUpdated: new Date().toISOString()
      }
    ];
    
    let filteredStatus = inventoryStatus;
    
    // Apply filters
    if (query.locationId) {
      filteredStatus = filteredStatus.filter(item => item.locationId === query.locationId);
    }
    
    if (query.lowStock === 'true') {
      filteredStatus = filteredStatus.filter(item => item.currentStock <= item.minStock);
    }
    
    if (query.outOfStock === 'true') {
      filteredStatus = filteredStatus.filter(item => item.currentStock === 0);
    }
    
    // Apply pagination
    const startIndex = (query.page - 1) * query.limit;
    const endIndex = startIndex + query.limit;
    const paginatedStatus = filteredStatus.slice(startIndex, endIndex);
    
    const total = filteredStatus.length;
    const pages = Math.ceil(total / query.limit);
    
    res.json({
      success: true,
      data: paginatedStatus,
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
      error: 'Failed to fetch inventory status'
    });
  }
});

// 3. Get Inventory Alerts
router.get('/shop/:shopId/alerts', async (req, res) => {
  try {
    const { shopId } = z.object({ shopId: z.string() }).parse(req.params);
    const { type = 'all' } = req.query;
    
    // Mock inventory alerts
    const alerts = [
      {
        type: 'low_stock',
        productId: 'prod_456',
        productName: 'Espresso Shot',
        currentStock: 5,
        threshold: 10,
        message: 'Low stock alert: Espresso Shot has only 5 units remaining',
        createdAt: new Date().toISOString()
      }
    ];
    
    let filteredAlerts = alerts;
    
    if (type !== 'all') {
      filteredAlerts = alerts.filter(alert => alert.type === type);
    }
    
    res.json({
      success: true,
      data: filteredAlerts
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
      error: 'Failed to fetch inventory alerts'
    });
  }
});

// 4. Get Inventory Statistics
router.get('/shop/:shopId/stats', async (req, res) => {
  try {
    const { shopId } = z.object({ shopId: z.string() }).parse(req.params);
    
    // Mock inventory statistics
    const stats = {
      totalProducts: 150,
      lowStockItems: 12,
      outOfStockItems: 3,
      totalValue: 25000.75,
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: stats
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
      error: 'Failed to fetch inventory statistics'
    });
  }
});

// 5. Bulk Inventory Update
router.post('/shop/:shopId/bulk-update', async (req, res) => {
  try {
    const { shopId } = z.object({ shopId: z.string() }).parse(req.params);
    const { updates } = z.object({
      updates: z.array(createInventoryUpdateSchema)
    }).parse(req.body);
    
    const results = [];
    
    for (const update of updates) {
      const newUpdate = {
        _id: Date.now().toString(16),
        shopId,
        ...update,
        createdAt: new Date().toISOString()
      };
      
      inventoryUpdates.push(newUpdate);
      results.push(newUpdate);
    }
    
    res.json({
      success: true,
      data: results,
      message: `Bulk update completed: ${results.length} items updated`
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
      error: 'Failed to perform bulk inventory update'
    });
  }
});

export default router; 