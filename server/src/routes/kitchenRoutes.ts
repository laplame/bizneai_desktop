import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Kitchen order schemas
const createKitchenOrderSchema = z.object({
  shopId: z.string().min(1, 'Shop ID is required'),
  customerName: z.string().min(1, 'Customer name is required').max(100),
  tableNumber: z.string().max(20).optional(),
  waiterName: z.string().max(100).optional(),
  items: z.array(z.object({
    name: z.string().min(1, 'Item name is required'),
    quantity: z.number().int().positive('Quantity must be positive'),
    notes: z.string().max(500).optional()
  })).min(1, 'At least one item is required'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  estimatedTime: z.number().int().positive().optional(),
  status: z.enum(['pending', 'preparing', 'ready', 'completed']).default('pending')
});

const updateKitchenOrderSchema = createKitchenOrderSchema.partial();

const kitchenOrderQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  status: z.enum(['pending', 'preparing', 'ready', 'completed']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  search: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  shopId: z.string().optional()
});

// Mock data for development
let kitchenOrders = [
  {
    _id: '64f8a1b2c3d4e5f6',
    shopId: '64f8a1b2c3d4e5f6',
    customerName: 'Juan Pérez',
    tableNumber: 'A5',
    waiterName: 'María García',
    items: [
      {
        name: 'Cappuccino Grande',
        quantity: 2,
        notes: 'Sin azúcar'
      }
    ],
    priority: 'normal',
    estimatedTime: 15,
    status: 'pending',
    createdAt: '2025-07-26T19:30:00.000Z',
    updatedAt: '2025-07-26T19:30:00.000Z'
  }
];

// 1. Get Kitchen Orders
router.get('/orders', async (req, res) => {
  try {
    const query = kitchenOrderQuerySchema.parse(req.query);
    
    let filteredOrders = [...kitchenOrders];
    
    // Apply filters
    if (query.status) {
      filteredOrders = filteredOrders.filter(order => order.status === query.status);
    }
    
    if (query.priority) {
      filteredOrders = filteredOrders.filter(order => order.priority === query.priority);
    }
    
    if (query.search) {
      filteredOrders = filteredOrders.filter(order => 
        order.customerName.toLowerCase().includes(query.search!.toLowerCase()) ||
        order.waiterName?.toLowerCase().includes(query.search!.toLowerCase())
      );
    }
    
    if (query.shopId) {
      filteredOrders = filteredOrders.filter(order => order.shopId === query.shopId);
    }
    
    if (query.dateFrom) {
      const dateFrom = new Date(query.dateFrom);
      filteredOrders = filteredOrders.filter(order => new Date(order.createdAt) >= dateFrom);
    }
    
    if (query.dateTo) {
      const dateTo = new Date(query.dateTo);
      filteredOrders = filteredOrders.filter(order => new Date(order.createdAt) <= dateTo);
    }
    
    // Apply sorting
    filteredOrders.sort((a, b) => {
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
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    
    const total = filteredOrders.length;
    const pages = Math.ceil(total / query.limit);
    
    res.json({
      success: true,
      data: paginatedOrders,
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
      error: 'Failed to fetch kitchen orders'
    });
  }
});

// 2. Create Kitchen Order
router.post('/orders', async (req, res) => {
  try {
    const orderData = createKitchenOrderSchema.parse(req.body);
    
    const newOrder = {
      _id: Date.now().toString(16),
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    kitchenOrders.push(newOrder);
    
    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`shop-${orderData.shopId}`).emit('kitchen-order-created', newOrder);
    }
    
    res.status(201).json({
      success: true,
      data: newOrder,
      message: 'Kitchen order created successfully'
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
      error: 'Failed to create kitchen order'
    });
  }
});

// 3. Get Kitchen Order by ID
router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const { shopId } = z.object({ shopId: z.string() }).parse(req.query);
    
    const order = kitchenOrders.find(o => o._id === id && o.shopId === shopId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Kitchen order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
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
      error: 'Failed to fetch kitchen order'
    });
  }
});

// 4. Update Kitchen Order
router.put('/orders/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const { shopId } = z.object({ shopId: z.string() }).parse(req.query);
    const updateData = updateKitchenOrderSchema.parse(req.body);
    
    const orderIndex = kitchenOrders.findIndex(o => o._id === id && o.shopId === shopId);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Kitchen order not found'
      });
    }
    
    const updatedOrder = {
      ...kitchenOrders[orderIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    kitchenOrders[orderIndex] = updatedOrder;
    
    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`shop-${shopId}`).emit('kitchen-order-updated', updatedOrder);
    }
    
    res.json({
      success: true,
      data: updatedOrder,
      message: 'Kitchen order updated successfully'
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
      error: 'Failed to update kitchen order'
    });
  }
});

// 5. Partial Update Kitchen Order
router.patch('/orders/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const { shopId } = z.object({ shopId: z.string() }).parse(req.query);
    const updateData = updateKitchenOrderSchema.parse(req.body);
    
    const orderIndex = kitchenOrders.findIndex(o => o._id === id && o.shopId === shopId);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Kitchen order not found'
      });
    }
    
    const updatedOrder = {
      ...kitchenOrders[orderIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    kitchenOrders[orderIndex] = updatedOrder;
    
    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`shop-${shopId}`).emit('kitchen-order-updated', updatedOrder);
    }
    
    res.json({
      success: true,
      data: updatedOrder,
      message: 'Kitchen order updated successfully'
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
      error: 'Failed to update kitchen order'
    });
  }
});

// 6. Delete Kitchen Order
router.delete('/orders/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const { shopId } = z.object({ shopId: z.string() }).parse(req.query);
    
    const orderIndex = kitchenOrders.findIndex(o => o._id === id && o.shopId === shopId);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Kitchen order not found'
      });
    }
    
    const deletedOrder = kitchenOrders[orderIndex];
    kitchenOrders.splice(orderIndex, 1);
    
    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`shop-${shopId}`).emit('kitchen-order-deleted', deletedOrder);
    }
    
    res.json({
      success: true,
      message: 'Kitchen order deleted successfully'
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
      error: 'Failed to delete kitchen order'
    });
  }
});

// 7. Get Kitchen Statistics
router.get('/stats', async (req, res) => {
  try {
    const { shopId } = z.object({ shopId: z.string() }).parse(req.query);
    
    const shopOrders = kitchenOrders.filter(order => order.shopId === shopId);
    
    const stats = {
      totalOrders: shopOrders.length,
      byStatus: shopOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPriority: shopOrders.reduce((acc, order) => {
        acc[order.priority] = (acc[order.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averagePreparationTime: shopOrders
        .filter(order => order.estimatedTime)
        .reduce((sum, order) => sum + (order.estimatedTime || 0), 0) / 
        shopOrders.filter(order => order.estimatedTime).length || 0,
      pendingOrders: shopOrders.filter(order => order.status === 'pending').length,
      preparingOrders: shopOrders.filter(order => order.status === 'preparing').length,
      readyOrders: shopOrders.filter(order => order.status === 'ready').length
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
      error: 'Failed to fetch kitchen statistics'
    });
  }
});

// 8. Test Kitchen Endpoint
router.get('/test', async (req, res) => {
  res.json({
    success: true,
    message: 'Kitchen API is working correctly',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

export default router; 