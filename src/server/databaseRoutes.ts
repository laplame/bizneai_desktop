import express from 'express';
import { getDatabase } from '../database/database';

const router = express.Router();

// Middleware para verificar identificadores de tienda
const validateStoreIdentifiers = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { store_id, client_id } = req.body;
  
  if (!store_id || !client_id) {
    return res.status(400).json({ 
      error: 'Identificadores de tienda requeridos (store_id, client_id)' 
    });
  }
  
  next();
};

// Status de la base de datos
router.get('/status', (req, res) => {
  try {
    const db = getDatabase();
    res.json({ status: 'connected', message: 'Database is ready' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Rutas de productos
router.get('/products', (req, res) => {
  try {
    const db = getDatabase();
    const products = db.getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.get('/products/:id', (req, res) => {
  try {
    const db = getDatabase();
    const product = db.getProductById(parseInt(req.params.id));
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Producto no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

router.post('/products', validateStoreIdentifiers, (req, res) => {
  try {
    const db = getDatabase();
    const productId = db.addProduct(req.body);
    res.json({ id: productId, message: 'Producto agregado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar producto' });
  }
});

router.put('/products/:id', (req, res) => {
  try {
    const db = getDatabase();
    db.updateProduct(parseInt(req.params.id), req.body);
    res.json({ message: 'Producto actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

router.delete('/products/:id', (req, res) => {
  try {
    const db = getDatabase();
    db.deleteProduct(parseInt(req.params.id));
    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// Rutas de ventas
router.get('/sales', validateStoreIdentifiers, (req, res) => {
  try {
    const db = getDatabase();
    const limit = parseInt(req.query.limit as string) || 100;
    const sales = db.getSales(req.body.store_id, limit);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

router.post('/sales', validateStoreIdentifiers, (req, res) => {
  try {
    const db = getDatabase();
    const saleId = db.addSale(req.body);
    res.json({ id: saleId, message: 'Venta registrada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar venta' });
  }
});

// Rutas de configuración de tienda
router.get('/config', validateStoreIdentifiers, (req, res) => {
  try {
    const db = getDatabase();
    const config = db.getStoreConfig(req.body.store_id);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

router.post('/config', validateStoreIdentifiers, (req, res) => {
  try {
    const db = getDatabase();
    db.saveStoreConfig(req.body);
    res.json({ message: 'Configuración guardada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar configuración' });
  }
});

// Rutas de respaldos
router.get('/backups', validateStoreIdentifiers, (req, res) => {
  try {
    const db = getDatabase();
    const backups = db.getBackups(req.body.store_id);
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener respaldos' });
  }
});

router.post('/backups', validateStoreIdentifiers, (req, res) => {
  try {
    const db = getDatabase();
    db.addBackup(req.body);
    res.json({ message: 'Respaldo registrado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar respaldo' });
  }
});

// Rutas de transacciones (Merkle Tree)
router.get('/transactions', (req, res) => {
  try {
    const db = getDatabase();
    const limit = parseInt(req.query.limit as string) || 1000;
    const transactions = db.getTransactions(limit);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
});

router.get('/transactions/date/:date', (req, res) => {
  try {
    const db = getDatabase();
    const transactions = db.getTransactionsByDate(req.params.date);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener transacciones por fecha' });
  }
});

router.get('/transactions/:id', (req, res) => {
  try {
    const db = getDatabase();
    const transaction = db.getTransactionById(req.params.id);
    if (transaction) {
      res.json(transaction);
    } else {
      res.status(404).json({ error: 'Transacción no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener transacción' });
  }
});

router.post('/transactions', (req, res) => {
  try {
    const db = getDatabase();
    db.addTransaction(req.body);
    res.json({ message: 'Transacción agregada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar transacción' });
  }
});

// Rutas de bloques diarios (Merkle Tree)
router.get('/blocks', (req, res) => {
  try {
    const db = getDatabase();
    const limit = parseInt(req.query.limit as string) || 100;
    const blocks = db.getBlocks(limit);
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener bloques' });
  }
});

router.get('/blocks/last', (req, res) => {
  try {
    const db = getDatabase();
    const block = db.getLastBlock();
    if (block) {
      res.json(block);
    } else {
      res.status(404).json({ error: 'No hay bloques disponibles' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener último bloque' });
  }
});

router.get('/blocks/:id', (req, res) => {
  try {
    const db = getDatabase();
    const block = db.getBlockById(req.params.id);
    if (block) {
      res.json(block);
    } else {
      res.status(404).json({ error: 'Bloque no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener bloque' });
  }
});

router.post('/blocks', (req, res) => {
  try {
    const db = getDatabase();
    db.addBlock(req.body);
    res.json({ message: 'Bloque agregado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar bloque' });
  }
});

// Rutas de estadísticas
router.get('/stats', validateStoreIdentifiers, (req, res) => {
  try {
    const db = getDatabase();
    const stats = db.getStats(req.body.store_id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

export default router; 