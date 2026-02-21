import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

// Tipos para la base de datos
export interface Product {
  id?: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  barcode?: string;
  image?: string;
  description?: string;
  cost?: number;
  sku?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface Sale {
  id?: number;
  store_id: string;
  client_id: string;
  total_amount: number;
  payment_method: string;
  items: SaleItem[];
  customer_info?: string;
  status: 'completed' | 'pending' | 'cancelled';
  created_at?: string;
}

export interface SaleItem {
  id?: number;
  sale_id?: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Customer {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  membership_level?: string;
  total_purchases: number;
  last_purchase?: string;
  created_at?: string;
}

export interface StoreConfig {
  id?: number;
  store_id: string;
  client_id: string;
  store_name: string;
  store_type: string;
  config_data: string; // JSON string
  created_at?: string;
  updated_at?: string;
}

class DatabaseManager {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    // En desarrollo, usar una ruta local
    if (process.env.NODE_ENV === 'development') {
      this.dbPath = path.join(process.cwd(), 'bizneai.db');
    } else {
      // En producción, usar la carpeta de datos de la app
      const userDataPath = app?.getPath('userData') || process.cwd();
      this.dbPath = path.join(userDataPath, 'bizneai.db');
    }
  }

  initialize(): void {
    try {
      this.db = new Database(this.dbPath);
      this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private createTables(): void {
    if (!this.db) throw new Error('Database not initialized');

    // Tabla de productos
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        barcode TEXT,
        image TEXT,
        description TEXT,
        cost REAL,
        sku TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de ventas
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        total_amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        customer_info TEXT,
        status TEXT NOT NULL DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de items de venta
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
      )
    `);

    // Tabla de clientes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        membership_level TEXT DEFAULT 'regular',
        total_purchases REAL DEFAULT 0,
        last_purchase DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de configuración de tienda
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS store_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id TEXT NOT NULL UNIQUE,
        client_id TEXT NOT NULL,
        store_name TEXT NOT NULL,
        store_type TEXT NOT NULL,
        config_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de inventario
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        operation_type TEXT NOT NULL, -- 'in', 'out', 'adjustment'
        reference TEXT, -- 'sale', 'purchase', 'adjustment'
        reference_id INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
      )
    `);

    // Tabla de respaldos
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id TEXT NOT NULL,
        backup_type TEXT NOT NULL, -- 'manual', 'auto', 'sync'
        status TEXT NOT NULL, -- 'success', 'failed', 'pending'
        file_path TEXT,
        file_size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de transacciones (Merkle Tree)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        sale_id INTEGER NOT NULL,
        action TEXT NOT NULL, -- 'create', 'update', 'delete', 'restore'
        timestamp TEXT NOT NULL,
        data TEXT NOT NULL, -- JSON string
        previous_data TEXT, -- JSON string
        hash TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE
      )
    `);

    // Tabla de bloques diarios (Merkle Tree)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS daily_blocks (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        merkle_root TEXT NOT NULL,
        previous_block_hash TEXT,
        block_hash TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        UNIQUE(date, block_hash)
      )
    `);

    // Tabla de relación bloque-transacciones
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS block_transactions (
        block_id TEXT NOT NULL,
        transaction_id TEXT NOT NULL,
        transaction_index INTEGER NOT NULL,
        PRIMARY KEY (block_id, transaction_id),
        FOREIGN KEY (block_id) REFERENCES daily_blocks (id) ON DELETE CASCADE,
        FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables created successfully');
  }

  // Métodos para productos
  addProduct(product: Product): number {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      INSERT INTO products (name, price, category, stock, barcode, image, description, cost, sku, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      product.name,
      product.price,
      product.category,
      product.stock,
      product.barcode,
      product.image,
      product.description,
      product.cost,
      product.sku,
      product.status
    );
    
    return result.lastInsertRowid as number;
  }

  getProducts(): Product[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM products ORDER BY name');
    return stmt.all() as Product[];
  }

  getProductById(id: number): Product | undefined {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM products WHERE id = ?');
    return stmt.get(id) as Product | undefined;
  }

  updateProduct(id: number, product: Partial<Product>): void {
    if (!this.db) throw new Error('Database not initialized');
    
    const fields = Object.keys(product).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (product as any)[field]);
    values.push(new Date().toISOString()); // updated_at
    values.push(id);
    
    const stmt = this.db.prepare(`
      UPDATE products SET ${setClause}, updated_at = ? WHERE id = ?
    `);
    
    stmt.run(...values);
  }

  deleteProduct(id: number): void {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run(id);
  }

  // Métodos para ventas
  addSale(sale: Sale): number {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(() => {
      // Insertar venta
      const saleStmt = this.db!.prepare(`
        INSERT INTO sales (store_id, client_id, total_amount, payment_method, customer_info, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const saleResult = saleStmt.run(
        sale.store_id,
        sale.client_id,
        sale.total_amount,
        sale.payment_method,
        sale.customer_info,
        sale.status
      );
      
      const saleId = saleResult.lastInsertRowid as number;
      
      // Insertar items de venta
      const itemStmt = this.db!.prepare(`
        INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      sale.items.forEach(item => {
        itemStmt.run(saleId, item.product_id, item.product_name, item.quantity, item.unit_price, item.total_price);
      });
      
      // Actualizar inventario
      sale.items.forEach(item => {
        this.updateProductStock(item.product_id, -item.quantity, 'sale', saleId);
      });
      
      return saleId;
    });
    
    return transaction();
  }

  getSales(storeId: string, limit: number = 100): Sale[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      SELECT s.*, GROUP_CONCAT(si.product_name || ' x' || si.quantity) as items_summary
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE s.store_id = ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ?
    `);
    
    return stmt.all(storeId, limit) as Sale[];
  }

  // Métodos para inventario
  private updateProductStock(productId: number, quantity: number, operationType: string, referenceId?: number): void {
    if (!this.db) throw new Error('Database not initialized');
    
    // Actualizar stock del producto
    const productStmt = this.db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
    productStmt.run(quantity, productId);
    
    // Registrar movimiento de inventario
    const inventoryStmt = this.db.prepare(`
      INSERT INTO inventory (product_id, quantity, operation_type, reference, reference_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    inventoryStmt.run(productId, quantity, operationType, operationType, referenceId);
  }

  // Métodos para configuración de tienda
  saveStoreConfig(config: StoreConfig): void {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO store_config (store_id, client_id, store_name, store_type, config_data, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      config.store_id,
      config.client_id,
      config.store_name,
      config.store_type,
      config.config_data,
      new Date().toISOString()
    );
  }

  getStoreConfig(storeId: string): StoreConfig | undefined {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM store_config WHERE store_id = ?');
    return stmt.get(storeId) as StoreConfig | undefined;
  }

  // Métodos para respaldos
  addBackup(backup: {
    store_id: string;
    backup_type: string;
    status: string;
    file_path?: string;
    file_size?: number;
  }): void {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      INSERT INTO backups (store_id, backup_type, status, file_path, file_size)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      backup.store_id,
      backup.backup_type,
      backup.status,
      backup.file_path,
      backup.file_size
    );
  }

  getBackups(storeId: string): any[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      SELECT * FROM backups 
      WHERE store_id = ? 
      ORDER BY created_at DESC
    `);
    
    return stmt.all(storeId);
  }

  // Métodos para transacciones (Merkle Tree)
  addTransaction(transaction: {
    id: string;
    saleId: number;
    action: 'create' | 'update' | 'delete' | 'restore';
    timestamp: string;
    data: any;
    previousData?: any;
    hash: string;
  }): void {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      INSERT INTO transactions (id, sale_id, action, timestamp, data, previous_data, hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      transaction.id,
      transaction.saleId,
      transaction.action,
      transaction.timestamp,
      JSON.stringify(transaction.data),
      transaction.previousData ? JSON.stringify(transaction.previousData) : null,
      transaction.hash
    );
  }

  getTransactions(limit: number = 1000): any[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      SELECT 
        id,
        sale_id,
        action,
        timestamp,
        data,
        previous_data,
        hash,
        created_at
      FROM transactions
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    
    const rows = stmt.all(limit) as any[];
    return rows.map(row => ({
      id: row.id,
      saleId: row.sale_id,
      action: row.action,
      timestamp: row.timestamp,
      data: JSON.parse(row.data),
      previousData: row.previous_data ? JSON.parse(row.previous_data) : undefined,
      hash: row.hash,
      createdAt: row.created_at
    }));
  }

  getTransactionsByDate(date: string): any[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      SELECT 
        id,
        sale_id,
        action,
        timestamp,
        data,
        previous_data,
        hash,
        created_at
      FROM transactions
      WHERE DATE(timestamp) = DATE(?)
      ORDER BY timestamp ASC
    `);
    
    const rows = stmt.all(date) as any[];
    return rows.map(row => ({
      id: row.id,
      saleId: row.sale_id,
      action: row.action,
      timestamp: row.timestamp,
      data: JSON.parse(row.data),
      previousData: row.previous_data ? JSON.parse(row.previous_data) : undefined,
      hash: row.hash,
      createdAt: row.created_at
    }));
  }

  getTransactionById(id: string): any | undefined {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM transactions WHERE id = ?');
    const row = stmt.get(id) as any | undefined;
    
    if (!row) return undefined;
    
    return {
      id: row.id,
      saleId: row.sale_id,
      action: row.action,
      timestamp: row.timestamp,
      data: JSON.parse(row.data),
      previousData: row.previous_data ? JSON.parse(row.previous_data) : undefined,
      hash: row.hash,
      createdAt: row.created_at
    };
  }

  // Métodos para bloques diarios (Merkle Tree)
  addBlock(block: {
    id: string;
    date: string;
    transactions: any[];
    merkleRoot: string;
    previousBlockHash: string | null;
    blockHash: string;
    createdAt: string;
  }): void {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(() => {
      // Insertar bloque
      const blockStmt = this.db!.prepare(`
        INSERT INTO daily_blocks (id, date, merkle_root, previous_block_hash, block_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      blockStmt.run(
        block.id,
        block.date,
        block.merkleRoot,
        block.previousBlockHash,
        block.blockHash,
        block.createdAt
      );
      
      // Insertar relaciones bloque-transacciones
      const relationStmt = this.db!.prepare(`
        INSERT INTO block_transactions (block_id, transaction_id, transaction_index)
        VALUES (?, ?, ?)
      `);
      
      block.transactions.forEach((tx, index) => {
        relationStmt.run(block.id, tx.id, index);
      });
    });
    
    transaction();
  }

  getBlocks(limit: number = 100): any[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      SELECT 
        id,
        date,
        merkle_root,
        previous_block_hash,
        block_hash,
        created_at
      FROM daily_blocks
      ORDER BY date DESC, created_at DESC
      LIMIT ?
    `);
    
    const rows = stmt.all(limit) as any[];
    return rows.map(row => ({
      id: row.id,
      date: row.date,
      merkleRoot: row.merkle_root,
      previousBlockHash: row.previous_block_hash,
      blockHash: row.block_hash,
      createdAt: row.created_at
    }));
  }

  getBlockById(id: string): any | undefined {
    if (!this.db) throw new Error('Database not initialized');
    
    const blockStmt = this.db.prepare('SELECT * FROM daily_blocks WHERE id = ?');
    const blockRow = blockStmt.get(id) as any | undefined;
    
    if (!blockRow) return undefined;
    
    // Obtener transacciones del bloque
    const txStmt = this.db.prepare(`
      SELECT 
        t.id,
        t.sale_id,
        t.action,
        t.timestamp,
        t.data,
        t.previous_data,
        t.hash
      FROM transactions t
      INNER JOIN block_transactions bt ON t.id = bt.transaction_id
      WHERE bt.block_id = ?
      ORDER BY bt.transaction_index ASC
    `);
    
    const txRows = txStmt.all(id) as any[];
    const transactions = txRows.map(row => ({
      id: row.id,
      saleId: row.sale_id,
      action: row.action,
      timestamp: row.timestamp,
      data: JSON.parse(row.data),
      previousData: row.previous_data ? JSON.parse(row.previous_data) : undefined,
      hash: row.hash
    }));
    
    return {
      id: blockRow.id,
      date: blockRow.date,
      transactions,
      merkleRoot: blockRow.merkle_root,
      previousBlockHash: blockRow.previous_block_hash,
      blockHash: blockRow.block_hash,
      createdAt: blockRow.created_at
    };
  }

  getLastBlock(): any | undefined {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      SELECT * FROM daily_blocks
      ORDER BY date DESC, created_at DESC
      LIMIT 1
    `);
    
    const row = stmt.get() as any | undefined;
    if (!row) return undefined;
    
    return this.getBlockById(row.id);
  }

  // Método para cerrar la base de datos
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Método para obtener estadísticas
  getStats(storeId: string): any {
    if (!this.db) throw new Error('Database not initialized');
    
    const stats = {
      totalSales: 0,
      totalRevenue: 0,
      totalProducts: 0,
      lowStockProducts: 0,
      recentSales: 0
    };
    
    // Total de ventas y revenue
    const salesStmt = this.db.prepare(`
      SELECT COUNT(*) as count, SUM(total_amount) as revenue 
      FROM sales 
      WHERE store_id = ? AND status = 'completed'
    `);
    const salesResult = salesStmt.get(storeId);
    stats.totalSales = salesResult?.count || 0;
    stats.totalRevenue = salesResult?.revenue || 0;
    
    // Total de productos
    const productsStmt = this.db.prepare('SELECT COUNT(*) as count FROM products WHERE status = "active"');
    const productsResult = productsStmt.get();
    stats.totalProducts = productsResult?.count || 0;
    
    // Productos con bajo stock
    const lowStockStmt = this.db.prepare('SELECT COUNT(*) as count FROM products WHERE stock <= 5 AND status = "active"');
    const lowStockResult = lowStockStmt.get();
    stats.lowStockProducts = lowStockResult?.count || 0;
    
    // Ventas recientes (últimos 7 días)
    const recentSalesStmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM sales 
      WHERE store_id = ? AND created_at >= datetime('now', '-7 days')
    `);
    const recentSalesResult = recentSalesStmt.get(storeId);
    stats.recentSales = recentSalesResult?.count || 0;
    
    return stats;
  }
}

// Instancia singleton
let dbManager: DatabaseManager | null = null;

export const getDatabase = (): DatabaseManager => {
  if (!dbManager) {
    dbManager = new DatabaseManager();
    dbManager.initialize();
  }
  return dbManager;
};

export const closeDatabase = (): void => {
  if (dbManager) {
    dbManager.close();
    dbManager = null;
  }
}; 