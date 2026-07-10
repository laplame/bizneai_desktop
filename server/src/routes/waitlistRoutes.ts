/**
 * ⚠️  MOCK / LEGACY ROUTE — NOT the source of truth for the desktop POS.
 *
 * This router keeps an in-memory array that RESETS on every restart. It is a
 * vestige of the forked BizneAI cloud API and is NOT how the desktop app
 * persists data. Do not build features against it assuming durability.
 *
 * Real desktop data flow:
 *   localStorage  →  PUT/GET /api/pos/kv (posKvRoutes)  →  SQLite (pos-local-store)
 *   catalog/stock →  MCP proxy /api/proxy (mcpProxyRoutes)
 *   sales ledger  →  /api/merkle-ledger (merkleLedgerRoutes)  +  local-activity DB
 * See docs/ARCHITECTURE.md for the full picture.
 */

import express from 'express';
import { z } from 'zod';

const router = express.Router();

/**
 * Rutas fijas (/entries, /entries/source/..., /orders, …) deben declararse ANTES de cualquier
 * patrón tipo GET /:email (waitlist marketing) para que "entries" no se interprete como email.
 */

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
  limit: z.string().transform(Number).pipe(z.number().min(1).max(500)).default('20'),
  source: z.enum(['local', 'online']).optional(),
  status: z.enum(['waiting', 'preparing', 'ready', 'completed']).optional(),
  search: z.string().optional(),
  sortBy: z.string().default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

type ParsedWaitlistQuery = z.infer<typeof waitlistQuerySchema>;

function paginateWaitlistForShop(query: ParsedWaitlistQuery) {
  let filteredEntries = waitlistEntries.filter((entry) => entry.shopId === query.shopId);

  if (query.source) {
    filteredEntries = filteredEntries.filter((entry) => entry.source === query.source);
  }

  if (query.status) {
    filteredEntries = filteredEntries.filter((entry) => entry.status === query.status);
  }

  if (query.search) {
    filteredEntries = filteredEntries.filter((entry) =>
      entry.name.toLowerCase().includes(query.search!.toLowerCase())
    );
  }

  filteredEntries.sort((a, b) => {
    const aValue = a[query.sortBy as keyof typeof a];
    const bValue = b[query.sortBy as keyof typeof b];

    if (query.sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const startIndex = (query.page - 1) * query.limit;
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + query.limit);
  const total = filteredEntries.length;
  const pages = Math.ceil(total / query.limit) || 1;

  return {
    paginatedEntries,
    pagination: {
      current: query.page,
      pages,
      total,
      limit: query.limit
    }
  };
}

/** En memoria solo para API local; sin datos semilla. */
let waitlistEntries: any[] = [];

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

// 2. GET /api/waitlist/entries?shopId=... — Listar entradas (paginación, source, status, search)
router.get('/entries', async (req, res) => {
  try {
    const query = waitlistQuerySchema.parse(req.query);
    const { paginatedEntries, pagination } = paginateWaitlistForShop(query);
    res.json({
      success: true,
      data: paginatedEntries,
      pagination
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

// 2a. GET /entries/source/:source?shopId=... — Misma lógica que ?source= (ruta fija antes de /entries/:id)
router.get('/entries/source/:source', async (req, res) => {
  try {
    const source = z.enum(['local', 'online']).parse(req.params.source);
    const query = waitlistQuerySchema.parse({ ...req.query, source });
    const { paginatedEntries, pagination } = paginateWaitlistForShop(query);
    res.json({ success: true, data: paginatedEntries, pagination });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({ success: false, error: 'Failed to fetch waitlist entries by source' });
  }
});

// 2b. GET /entries/status/:status?shopId=...
router.get('/entries/status/:status', async (req, res) => {
  try {
    const status = z.enum(['waiting', 'preparing', 'ready', 'completed']).parse(req.params.status);
    const query = waitlistQuerySchema.parse({ ...req.query, status });
    const { paginatedEntries, pagination } = paginateWaitlistForShop(query);
    res.json({ success: true, data: paginatedEntries, pagination });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({ success: false, error: 'Failed to fetch waitlist entries by status' });
  }
});

// 2c. GET /entries/:id?shopId=... — Una entrada (rutas /source y /status van antes para no capturar "source" como id)
router.get('/entries/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const shopId = z.string().min(1).parse(req.query.shopId);
    const entry = waitlistEntries.find((e) => e._id === id && e.shopId === shopId);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Waitlist entry not found' });
    }
    res.json({ success: true, data: entry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({ success: false, error: 'Failed to fetch waitlist entry' });
  }
});

// 2d. GET /orders?shopId=... — Pedidos (mismo almacén; filtros opcionales). Documentación API producción.
const ordersListQuerySchema = z.object({
  shopId: z.string().min(1),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(50),
  source: z.enum(['local', 'online']).optional(),
  status: z.string().optional(),
  customerEmail: z.string().optional()
});

router.get('/orders', async (req, res) => {
  try {
    const q = ordersListQuerySchema.parse(req.query);
    let filtered = waitlistEntries.filter((e) => e.shopId === q.shopId);
    if (q.source) {
      filtered = filtered.filter((e) => e.source === q.source);
    }
    if (q.status) {
      filtered = filtered.filter((e) => e.status === q.status);
    }
    if (q.customerEmail) {
      const em = q.customerEmail.toLowerCase();
      filtered = filtered.filter((e) => {
        const ci = e.customerInfo as { email?: string } | undefined;
        return ci?.email?.toLowerCase().includes(em);
      });
    }
    const start = (q.page - 1) * q.limit;
    const data = filtered.slice(start, start + q.limit);
    const total = filtered.length;
    res.json({
      success: true,
      data,
      pagination: {
        current: q.page,
        pages: Math.ceil(total / q.limit) || 1,
        total,
        limit: q.limit
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
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
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