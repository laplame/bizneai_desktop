import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../contexts/StoreContext';

// Tipos para las operaciones de base de datos
export interface DatabaseProduct {
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

export interface DatabaseSale {
  id?: number;
  store_id: string;
  client_id: string;
  total_amount: number;
  payment_method: string;
  items: DatabaseSaleItem[];
  customer_info?: string;
  status: 'completed' | 'pending' | 'cancelled';
  created_at?: string;
}

export interface DatabaseSaleItem {
  id?: number;
  sale_id?: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface DatabaseCustomer {
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

export interface DatabaseStats {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockProducts: number;
  recentSales: number;
}

// Interfaz para las operaciones de base de datos
interface DatabaseOperations {
  // Productos
  addProduct: (product: DatabaseProduct) => Promise<number>;
  getProducts: () => Promise<DatabaseProduct[]>;
  getProductById: (id: number) => Promise<DatabaseProduct | undefined>;
  updateProduct: (id: number, product: Partial<DatabaseProduct>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  
  // Ventas
  addSale: (sale: DatabaseSale) => Promise<number>;
  getSales: (limit?: number) => Promise<DatabaseSale[]>;
  
  // Clientes
  addCustomer: (customer: DatabaseCustomer) => Promise<number>;
  getCustomers: () => Promise<DatabaseCustomer[]>;
  updateCustomer: (id: number, customer: Partial<DatabaseCustomer>) => Promise<void>;
  
  // Configuración
  saveStoreConfig: (config: any) => Promise<void>;
  getStoreConfig: () => Promise<any | undefined>;
  
  // Respaldos
  addBackup: (backup: any) => Promise<void>;
  getBackups: () => Promise<any[]>;
  
  // Estadísticas
  getStats: () => Promise<DatabaseStats>;
  
  // Transacciones y bloques (Merkle Tree)
  addTransaction: (transaction: any) => Promise<void>;
  getTransactions: (limit?: number) => Promise<any[]>;
  getTransactionsByDate: (date: string) => Promise<any[]>;
  getTransactionById: (id: string) => Promise<any | undefined>;
  addBlock: (block: any) => Promise<void>;
  getBlocks: (limit?: number) => Promise<any[]>;
  getBlockById: (id: string) => Promise<any | undefined>;
  getLastBlock: () => Promise<any | undefined>;
  
  // Estado
  isConnected: boolean;
  error: string | null;
}

export const useDatabase = (): DatabaseOperations => {
  const { storeIdentifiers } = useStore();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar conexión a la base de datos
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // La aplicación usa base de datos local (SQLite), no API
        // Simular conexión exitosa ya que la base de datos local siempre está disponible
          setIsConnected(true);
          setError(null);
      } catch (err) {
        setIsConnected(false);
        setError('Error de conexión a la base de datos');
      }
    };

    checkConnection();
  }, []);

  // Función helper para hacer peticiones a la API
  // NOTA: Esta aplicación usa base de datos local (SQLite), no API
  // Esta función se mantiene para compatibilidad pero no hace peticiones reales
  const makeRequest = useCallback(async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    // La aplicación usa base de datos local, no API
    // Retornar array vacío o null según el caso
    console.warn(`useDatabase: makeRequest called for ${endpoint} but using local database instead`);
    
    // Para transacciones y bloques, retornar arrays vacíos
    if (endpoint.includes('transactions') || endpoint.includes('blocks')) {
      return [];
    }
    
    // Para otros endpoints, retornar null o estructura vacía
    return null;
  }, []);

  // Operaciones de productos
  const addProduct = useCallback(async (product: DatabaseProduct): Promise<number> => {
    const result = await makeRequest('products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    return result.id;
  }, [makeRequest]);

  const getProducts = useCallback(async (): Promise<DatabaseProduct[]> => {
    return await makeRequest('products');
  }, [makeRequest]);

  const getProductById = useCallback(async (id: number): Promise<DatabaseProduct | undefined> => {
    return await makeRequest(`products/${id}`);
  }, [makeRequest]);

  const updateProduct = useCallback(async (id: number, product: Partial<DatabaseProduct>): Promise<void> => {
    await makeRequest(`products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }, [makeRequest]);

  const deleteProduct = useCallback(async (id: number): Promise<void> => {
    await makeRequest(`products/${id}`, {
      method: 'DELETE',
    });
  }, [makeRequest]);

  // Operaciones de ventas
  const addSale = useCallback(async (sale: DatabaseSale): Promise<number> => {
    const result = await makeRequest('sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
    return result.id;
  }, [makeRequest]);

  const getSales = useCallback(async (limit: number = 100): Promise<DatabaseSale[]> => {
    return await makeRequest(`sales?limit=${limit}`);
  }, [makeRequest]);

  // Operaciones de clientes
  const addCustomer = useCallback(async (customer: DatabaseCustomer): Promise<number> => {
    const result = await makeRequest('customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
    return result.id;
  }, [makeRequest]);

  const getCustomers = useCallback(async (): Promise<DatabaseCustomer[]> => {
    return await makeRequest('customers');
  }, [makeRequest]);

  const updateCustomer = useCallback(async (id: number, customer: Partial<DatabaseCustomer>): Promise<void> => {
    await makeRequest(`customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  }, [makeRequest]);

  // Operaciones de configuración
  const saveStoreConfig = useCallback(async (config: any): Promise<void> => {
    await makeRequest('config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }, [makeRequest]);

  const getStoreConfig = useCallback(async (): Promise<any | undefined> => {
    return await makeRequest('config');
  }, [makeRequest]);

  // Operaciones de respaldos
  const addBackup = useCallback(async (backup: any): Promise<void> => {
    await makeRequest('backups', {
      method: 'POST',
      body: JSON.stringify(backup),
    });
  }, [makeRequest]);

  const getBackups = useCallback(async (): Promise<any[]> => {
    return await makeRequest('backups');
  }, [makeRequest]);

  // Estadísticas
  const getStats = useCallback(async (): Promise<DatabaseStats> => {
    return await makeRequest('stats');
  }, [makeRequest]);

  // Transacciones (Merkle Tree)
  const addTransaction = useCallback(async (transaction: any): Promise<void> => {
    await makeRequest('transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }, [makeRequest]);

  const getTransactions = useCallback(async (limit: number = 1000): Promise<any[]> => {
    return await makeRequest(`transactions?limit=${limit}`);
  }, [makeRequest]);

  const getTransactionsByDate = useCallback(async (date: string): Promise<any[]> => {
    return await makeRequest(`transactions/date/${date}`);
  }, [makeRequest]);

  const getTransactionById = useCallback(async (id: string): Promise<any | undefined> => {
    return await makeRequest(`transactions/${id}`);
  }, [makeRequest]);

  // Bloques (Merkle Tree)
  const addBlock = useCallback(async (block: any): Promise<void> => {
    await makeRequest('blocks', {
      method: 'POST',
      body: JSON.stringify(block),
    });
  }, [makeRequest]);

  const getBlocks = useCallback(async (limit: number = 100): Promise<any[]> => {
    return await makeRequest(`blocks?limit=${limit}`);
  }, [makeRequest]);

  const getBlockById = useCallback(async (id: string): Promise<any | undefined> => {
    return await makeRequest(`blocks/${id}`);
  }, [makeRequest]);

  const getLastBlock = useCallback(async (): Promise<any | undefined> => {
    return await makeRequest('blocks/last');
  }, [makeRequest]);

  return {
    // Productos
    addProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    
    // Ventas
    addSale,
    getSales,
    
    // Clientes
    addCustomer,
    getCustomers,
    updateCustomer,
    
    // Configuración
    saveStoreConfig,
    getStoreConfig,
    
    // Respaldos
    addBackup,
    getBackups,
    
    // Estadísticas
    getStats,
    
    // Transacciones y bloques (Merkle Tree)
    addTransaction,
    getTransactions,
    getTransactionsByDate,
    getTransactionById,
    addBlock,
    getBlocks,
    getBlockById,
    getLastBlock,
    
    // Estado
    isConnected,
    error,
  };
}; 