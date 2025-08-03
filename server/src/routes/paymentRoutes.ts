import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Payment schemas
const createPaymentSchema = z.object({
  type: z.enum(['sale', 'refund', 'adjustment']),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('USD'),
  paymentMethod: z.enum(['cash', 'card', 'crypto', 'mobile']),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']).default('completed'),
  description: z.string().optional(),
  transactionId: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const paymentQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']).optional(),
  paymentMethod: z.enum(['cash', 'card', 'crypto', 'mobile']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

// Mock payments data
let payments: any[] = [];

// 1. Process Payment
router.post('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = z.object({ shopId: z.string() }).parse(req.params);
    const paymentData = createPaymentSchema.parse(req.body);
    
    const newPayment = {
      _id: Date.now().toString(16),
      shopId,
      ...paymentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    payments.push(newPayment);
    
    res.status(201).json({
      success: true,
      data: newPayment,
      message: 'Payment processed successfully'
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
      error: 'Failed to process payment'
    });
  }
});

// 2. Get Payment History
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = z.object({ shopId: z.string() }).parse(req.params);
    const query = paymentQuerySchema.parse(req.query);
    
    let filteredPayments = payments.filter(payment => payment.shopId === shopId);
    
    // Apply filters
    if (query.status) {
      filteredPayments = filteredPayments.filter(payment => payment.status === query.status);
    }
    
    if (query.paymentMethod) {
      filteredPayments = filteredPayments.filter(payment => payment.paymentMethod === query.paymentMethod);
    }
    
    if (query.startDate) {
      filteredPayments = filteredPayments.filter(payment => 
        new Date(payment.createdAt) >= new Date(query.startDate!)
      );
    }
    
    if (query.endDate) {
      filteredPayments = filteredPayments.filter(payment => 
        new Date(payment.createdAt) <= new Date(query.endDate!)
      );
    }
    
    // Apply pagination
    const startIndex = (query.page - 1) * query.limit;
    const endIndex = startIndex + query.limit;
    const paginatedPayments = filteredPayments.slice(startIndex, endIndex);
    
    const total = filteredPayments.length;
    const pages = Math.ceil(total / query.limit);
    
    res.json({
      success: true,
      data: paginatedPayments,
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
      error: 'Failed to fetch payment history'
    });
  }
});

// 3. Get Payment Statistics
router.get('/shop/:shopId/stats', async (req, res) => {
  try {
    const { shopId } = z.object({ shopId: z.string() }).parse(req.params);
    const { period = '30d' } = req.query;
    
    const shopPayments = payments.filter(payment => payment.shopId === shopId);
    
    const totalAmount = shopPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalTransactions = shopPayments.length;
    const averageAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    
    const byPaymentMethod = shopPayments.reduce((acc, payment) => {
      acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byStatus = shopPayments.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    res.json({
      success: true,
      data: {
        totalAmount,
        totalTransactions,
        averageAmount,
        byPaymentMethod,
        byStatus,
        period
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
      error: 'Failed to fetch payment statistics'
    });
  }
});

export default router; 