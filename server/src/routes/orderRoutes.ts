import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Order schemas
const createOrderSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive(),
    shippingAddress: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      country: z.string(),
      zipCode: z.string()
    }),
    paymentMethod: z.string()
  })),
  totalAmount: z.number().positive(),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    zipCode: z.string()
  }),
  paymentMethod: z.string()
});

// Mock orders data
let orders: any[] = [];

// 1. Create Order
router.post('/', async (req, res) => {
  try {
    const orderData = createOrderSchema.parse(req.body);
    
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const newOrder = {
      _id: Date.now().toString(16),
      orderNumber,
      ...orderData,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    orders.push(newOrder);
    
    res.status(201).json({
      success: true,
      data: newOrder,
      message: 'Order created successfully'
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
      error: 'Failed to create order'
    });
  }
});

// 2. Get User Orders
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = z.object({ userId: z.string() }).parse(req.params);
    
    const userOrders = orders.filter(order => order.userId === userId);
    
    res.json({
      success: true,
      data: userOrders
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
      error: 'Failed to fetch user orders'
    });
  }
});

// 3. Get Order by Order Number
router.get('/order/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = z.object({ orderNumber: z.string() }).parse(req.params);
    
    const order = orders.find(o => o.orderNumber === orderNumber);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
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
      error: 'Failed to fetch order'
    });
  }
});

// 4. Update Order Status
router.patch('/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = z.object({ orderNumber: z.string() }).parse(req.params);
    const updateData = z.object({
      status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
      paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional()
    }).parse(req.body);
    
    const orderIndex = orders.findIndex(o => o.orderNumber === orderNumber);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    orders[orderIndex] = {
      ...orders[orderIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: orders[orderIndex],
      message: 'Order updated successfully'
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
      error: 'Failed to update order'
    });
  }
});

// 5. Cancel Order
router.delete('/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = z.object({ orderNumber: z.string() }).parse(req.params);
    
    const orderIndex = orders.findIndex(o => o.orderNumber === orderNumber);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    orders[orderIndex].status = 'cancelled';
    orders[orderIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: orders[orderIndex],
      message: 'Order cancelled successfully'
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
      error: 'Failed to cancel order'
    });
  }
});

export default router; 