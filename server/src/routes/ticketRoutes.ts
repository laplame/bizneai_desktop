import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Ticket schemas
const createTicketSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive(),
    total: z.number().positive()
  })),
  subtotal: z.number().positive(),
  tax: z.number().min(0),
  total: z.number().positive(),
  paymentMethod: z.string(),
  status: z.enum(['pending', 'completed', 'cancelled', 'refunded']).default('completed'),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const ticketQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  status: z.enum(['pending', 'completed', 'cancelled', 'refunded']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  customerName: z.string().optional()
});

// Mock tickets data
let tickets: any[] = [];

// 1. Get Ticket
router.get('/:shopId/:saleId', async (req, res) => {
  try {
    const { shopId, saleId } = z.object({ 
      shopId: z.string(),
      saleId: z.string()
    }).parse(req.params);
    
    const ticket = tickets.find(t => t.shopId === shopId && t.saleId === saleId);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }
    
    res.json({
      success: true,
      data: ticket
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
      error: 'Failed to fetch ticket'
    });
  }
});

// 2. Create Ticket
router.post('/:shopId/:saleId', async (req, res) => {
  try {
    const { shopId, saleId } = z.object({ 
      shopId: z.string(),
      saleId: z.string()
    }).parse(req.params);
    
    const ticketData = createTicketSchema.parse(req.body);
    
    const newTicket = {
      _id: `ticket_${Date.now()}`,
      shopId,
      saleId,
      ...ticketData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    tickets.push(newTicket);
    
    res.status(201).json({
      success: true,
      data: newTicket,
      message: 'Ticket created successfully'
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
      error: 'Failed to create ticket'
    });
  }
});

// 3. Update Ticket
router.put('/:shopId/:saleId', async (req, res) => {
  try {
    const { shopId, saleId } = z.object({ 
      shopId: z.string(),
      saleId: z.string()
    }).parse(req.params);
    
    const updateData = createTicketSchema.partial().parse(req.body);
    
    const ticketIndex = tickets.findIndex(t => t.shopId === shopId && t.saleId === saleId);
    
    if (ticketIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }
    
    tickets[ticketIndex] = {
      ...tickets[ticketIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: tickets[ticketIndex],
      message: 'Ticket updated successfully'
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
      error: 'Failed to update ticket'
    });
  }
});

// 4. Delete Ticket
router.delete('/:shopId/:saleId', async (req, res) => {
  try {
    const { shopId, saleId } = z.object({ 
      shopId: z.string(),
      saleId: z.string()
    }).parse(req.params);
    
    const ticketIndex = tickets.findIndex(t => t.shopId === shopId && t.saleId === saleId);
    
    if (ticketIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }
    
    tickets.splice(ticketIndex, 1);
    
    res.json({
      success: true,
      message: 'Ticket deleted successfully'
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
      error: 'Failed to delete ticket'
    });
  }
});

// 5. Get All Shop Tickets
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = z.object({ shopId: z.string() }).parse(req.params);
    const query = ticketQuerySchema.parse(req.query);
    
    let filteredTickets = tickets.filter(ticket => ticket.shopId === shopId);
    
    // Apply filters
    if (query.status) {
      filteredTickets = filteredTickets.filter(ticket => ticket.status === query.status);
    }
    
    if (query.customerName) {
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.customerName.toLowerCase().includes(query.customerName!.toLowerCase())
      );
    }
    
    if (query.startDate) {
      filteredTickets = filteredTickets.filter(ticket => 
        new Date(ticket.createdAt) >= new Date(query.startDate!)
      );
    }
    
    if (query.endDate) {
      filteredTickets = filteredTickets.filter(ticket => 
        new Date(ticket.createdAt) <= new Date(query.endDate!)
      );
    }
    
    // Sort by creation date (newest first)
    filteredTickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Apply pagination
    const startIndex = (query.page - 1) * query.limit;
    const endIndex = startIndex + query.limit;
    const paginatedTickets = filteredTickets.slice(startIndex, endIndex);
    
    const total = filteredTickets.length;
    const pages = Math.ceil(total / query.limit);
    
    res.json({
      success: true,
      data: paginatedTickets,
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
      error: 'Failed to fetch tickets'
    });
  }
});

// 6. Get Ticket Statistics
router.get('/shop/:shopId/stats', async (req, res) => {
  try {
    const { shopId } = z.object({ shopId: z.string() }).parse(req.params);
    const { period = '30d' } = req.query;
    
    const shopTickets = tickets.filter(ticket => ticket.shopId === shopId);
    
    const totalTickets = shopTickets.length;
    const totalSales = shopTickets.reduce((sum, ticket) => sum + ticket.total, 0);
    const averageTicketValue = totalTickets > 0 ? totalSales / totalTickets : 0;
    
    const byStatus = shopTickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byPaymentMethod = shopTickets.reduce((acc, ticket) => {
      acc[ticket.paymentMethod] = (acc[ticket.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    res.json({
      success: true,
      data: {
        totalTickets,
        totalSales,
        averageTicketValue,
        byStatus,
        byPaymentMethod,
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
      error: 'Failed to fetch ticket statistics'
    });
  }
});

export default router; 