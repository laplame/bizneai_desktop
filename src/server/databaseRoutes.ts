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