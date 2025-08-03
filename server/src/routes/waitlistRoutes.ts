import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Waitlist schemas
const addToWaitlistSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  items: z.array(z.object({
    product: z.object({
      id: z.string().min(1, 'Product ID is required'),
      name: z.string().min(1, 'Product name is required'),
      price: z.number().positive('Price must be positive'),
      category: z.string().min(1, 'Category is required')
    }),
    quantity: z.number().int().positive('Quantity must be positive')
  })).min(1, 'At least one item is required'),
  total: z.number().positive('Total must be positive'),
  source: z.enum(['local', 'online']).default('local'),
  status: z.enum(['waiting', 'preparing', 'ready', 'completed']).default('waiting'),
  notes: z.string().max(500).optional(),
  customerInfo: z.object({
    name: z.string().min(1, 'Customer name is required'),
    phone: z.string().optional(),
    email: z.string().email().optional()
  }).optional()
});

const legacyWaitlistSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(100),
  phoneNumber: z.string().min(1, 'Phone number is required').max(20),
  partySize: z.number().int().positive('Party size must be positive'),
  estimatedWaitTime: z.number().int().positive('Estimated wait time must be positive'),
  shopId: z.string().min(1, 'Shop ID is required')
});

const onlineOrderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(100),
  phoneNumber: z.string().min(1, 'Phone number is required').max(20),
  items: z.array(z.object({
    name: z.string().min(1, 'Item name is required'),
    quantity: z.number().int().positive('Quantity must be positive'),
    price: z.number().positive('Price must be positive')
  })).min(1, 'At least one item is required'),
  totalAmount: z.number().positive('Total amount must be positive'),
  orderType: z.enum(['pickup', 'delivery', 'dine-in']).default('pickup'),
  shopId: z.string().min(1, 'Shop ID is required')
});

const waitlistQuerySchema = z.object({
  shopId: z.string().min(1, 'Shop ID is required'),
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  source: z.enum(['local', 'online']).optional(),
  status: z.enum(['waiting', 'preparing', 'ready', 'completed']).optional(),
  search: z.string().optional(),
  sortBy: z.string().default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Mock data for development
let waitlistEntries = [
  {
    _id: '64f8a1b2c3d4e5f6',
    shopId: '688526630b5dfbfe4fabacea',
    name: 'Test Customer',
    items: [{
      product: {
        id: '1',
        name: 'Test Item',
        price: 12,
        category: 'test'
      },
      quantity: 1
    }],
    total: 12,
    source: 'local',
    status: 'waiting',
    timestamp: '2025-07-26T19:30:00.000Z',
    createdAt: '2025-07-26T19:30:00.000Z',
    updatedAt: '2025-07-26T19:30:00.000Z'
  }
];

// 1. Add Item to Shop Waitlist
router.post('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = z.object({ shopId: z.string() }).parse(req.params);
    const waitlistData = addToWaitlistSchema.parse(req.body);
    
    const newEntry = {
      _id: Date.now().toString(16),
      shopId,
      ...waitlistData,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    waitlistEntries.push(newEntry);
    
    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`shop-${shopId}`).emit('waitlist-entry-added', newEntry);
    }
    
    res.status(201).json({
      success: true,
      data: newEntry,
      message: 'Added to waitlist successfully'
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
      error: 'Failed to add to waitlist'
    });
  }
});

// 2. Get Waitlist Entries
router.get('/entries', async (req, res) => {
  try {
    const query = waitlistQuerySchema.parse(req.query);
    
    let filteredEntries = waitlistEntries.filter(entry => entry.shopId === query.shopId);
    
    // Apply filters
    if (query.source) {
      filteredEntries = filteredEntries.filter(entry => entry.source === query.source);
    }
    
    if (query.status) {
      filteredEntries = filteredEntries.filter(entry => entry.status === query.status);
    }
    
    if (query.search) {
      filteredEntries = filteredEntries.filter(entry => 
        entry.name.toLowerCase().includes(query.search!.toLowerCase())
      );
    }
    
    // Apply sorting
    filteredEntries.sort((a, b) => {
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
    const paginatedEntries = filteredEntries.slice(startIndex, endIndex);
    
    const total = filteredEntries.length;
    const pages = Math.ceil(total / query.limit);
    
    res.json({
      success: true,
      data: paginatedEntries,
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
      error: 'Failed to fetch waitlist entries'
    });
  }
});

// 3. Add Customer to Waitlist (Legacy)
router.post('/', async (req, res) => {
  try {
    const waitlistData = legacyWaitlistSchema.parse(req.body);
    
    const newEntry = {
      _id: Date.now().toString(16),
      ...waitlistData,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    waitlistEntries.push(newEntry);
    
    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`shop-${waitlistData.shopId}`).emit('waitlist-entry-added', newEntry);
    }
    
    res.status(201).json({
      success: true,
      data: newEntry,
      message: 'Customer added to waitlist successfully'
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
      error: 'Failed to add customer to waitlist'
    });
  }
});

// 4. Get All Waitlist Entries
router.get('/', async (req, res) => {
  try {
    const { shopId, status, page = '1', limit = '20' } = req.query;
    
    let filteredEntries = [...waitlistEntries];
    
    if (shopId) {
      filteredEntries = filteredEntries.filter(entry => entry.shopId === shopId);
    }
    
    if (status) {
      filteredEntries = filteredEntries.filter(entry => entry.status === status);
    }
    
    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedEntries = filteredEntries.slice(startIndex, endIndex);
    
    const total = filteredEntries.length;
    const pages = Math.ceil(total / limitNum);
    
    res.json({
      success: true,
      data: paginatedEntries,
      pagination: {
        current: pageNum,
        pages,
        total,
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch waitlist entries'
    });
  }
});

// 5. Add Item to Waitlist with Details
router.post('/entries', async (req, res) => {
  try {
    const entryData = legacyWaitlistSchema.parse(req.body);
    
    const newEntry = {
      _id: Date.now().toString(16),
      ...entryData,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    waitlistEntries.push(newEntry);
    
    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`shop-${entryData.shopId}`).emit('waitlist-entry-added', newEntry);
    }
    
    res.status(201).json({
      success: true,
      data: newEntry,
      message: 'Waitlist entry created successfully'
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
      error: 'Failed to create waitlist entry'
    });
  }
});

// 6. Load Waitlist Item to Cart
router.post('/entries/:id/load', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    
    const entry = waitlistEntries.find(e => e._id === id);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Waitlist entry not found'
      });
    }
    
    // Update status to preparing
    entry.status = 'preparing';
    entry.updatedAt = new Date().toISOString();
    
    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`shop-${entry.shopId}`).emit('waitlist-entry-updated', entry);
    }
    
    res.json({
      success: true,
      data: entry,
      message: 'Waitlist item loaded to cart successfully'
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
      error: 'Failed to load waitlist item'
    });
  }
});

// 7. Receive Online Order
router.post('/online-orders', async (req, res) => {
  try {
    const orderData = onlineOrderSchema.parse(req.body);
    
    const newEntry = {
      _id: Date.now().toString(16),
      shopId: orderData.shopId,
      name: orderData.customerName,
      items: orderData.items.map(item => ({
        product: {
          id: item.name,
          name: item.name,
          price: item.price,
          category: 'online'
        },
        quantity: item.quantity
      })),
      total: orderData.totalAmount,
      source: 'online',
      status: 'waiting',
      customerInfo: {
        name: orderData.customerName,
        phone: orderData.phoneNumber
      },
      orderType: orderData.orderType,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    waitlistEntries.push(newEntry);
    
    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`shop-${orderData.shopId}`).emit('online-order-received', newEntry);
    }
    
    res.status(201).json({
      success: true,
      data: newEntry,
      message: 'Online order received successfully'
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
      error: 'Failed to receive online order'
    });
  }
});

// 8. Get Waitlist Statistics
router.get('/stats', async (req, res) => {
  try {
    const { shopId } = z.object({ shopId: z.string() }).parse(req.query);
    
    const shopEntries = waitlistEntries.filter(entry => entry.shopId === shopId);
    
    const stats = {
      totalEntries: shopEntries.length,
      byStatus: shopEntries.reduce((acc, entry) => {
        acc[entry.status] = (acc[entry.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySource: shopEntries.reduce((acc, entry) => {
        acc[entry.source] = (acc[entry.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageWaitTime: 15, // Mock average wait time
      currentWaitTime: 20, // Mock current wait time
      waitingEntries: shopEntries.filter(entry => entry.status === 'waiting').length,
      preparingEntries: shopEntries.filter(entry => entry.status === 'preparing').length,
      readyEntries: shopEntries.filter(entry => entry.status === 'ready').length
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
      error: 'Failed to fetch waitlist statistics'
    });
  }
});

// 9. Update Waitlist Entry Status
router.patch('/entries/:id/status', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const { status } = z.object({ 
      status: z.enum(['waiting', 'preparing', 'ready', 'completed']) 
    }).parse(req.body);
    
    const entryIndex = waitlistEntries.findIndex(e => e._id === id);
    
    if (entryIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Waitlist entry not found'
      });
    }
    
    waitlistEntries[entryIndex].status = status;
    waitlistEntries[entryIndex].updatedAt = new Date().toISOString();
    
    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`shop-${waitlistEntries[entryIndex].shopId}`).emit('waitlist-entry-updated', waitlistEntries[entryIndex]);
    }
    
    res.json({
      success: true,
      data: waitlistEntries[entryIndex],
      message: 'Waitlist entry status updated successfully'
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
      error: 'Failed to update waitlist entry status'
    });
  }
});

// 10. Delete Waitlist Entry
router.delete('/entries/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    
    const entryIndex = waitlistEntries.findIndex(e => e._id === id);
    
    if (entryIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Waitlist entry not found'
      });
    }
    
    const deletedEntry = waitlistEntries[entryIndex];
    waitlistEntries.splice(entryIndex, 1);
    
    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`shop-${deletedEntry.shopId}`).emit('waitlist-entry-deleted', deletedEntry);
    }
    
    res.json({
      success: true,
      message: 'Waitlist entry deleted successfully'
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
      error: 'Failed to delete waitlist entry'
    });
  }
});

export default router; 