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
        // En desarrollo, simular conexión exitosa
        if (process.env.NODE_ENV === 'development') {
          setIsConnected(true);
          setError(null);
          return;
        }

        // En producción, verificar conexión real
        const response = await fetch('/api/database/status');
        if (response.ok) {
          setIsConnected(true);
          setError(null);
        } else {
          setIsConnected(false);
          setError('No se pudo conectar a la base de datos');
        }
      } catch (err) {
        setIsConnected(false);
        setError('Error de conexión a la base de datos');
      }
    };

    checkConnection();
  }, []);

  // Función helper para hacer peticiones a la API
  const makeRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!storeIdentifiers._id || !storeIdentifiers.clientId) {
      throw new Error('Identificadores de tienda no configurados');
    }

    const response = await fetch(`/api/database/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify({
        ...JSON.parse(options.body as string),
        store_id: storeIdentifiers._id,
        client_id: storeIdentifiers.clientId,
      }) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error en la operación de base de datos');
    }

    return response.json();
  }, [storeIdentifiers._id, storeIdentifiers.clientId]);

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
    
    // Estado
    isConnected,
    error,
  };
}; 