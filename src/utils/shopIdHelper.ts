/**
 * Helper utilities for working with Shop ID and MCP URLs
 */

/**
 * Get the shop ID from localStorage or context
 * @returns Shop ID string or null if not found
 */
export const getShopId = (): string | null => {
  try {
    // Try to get from server config first
    const serverConfig = localStorage.getItem('bizneai-server-config');
    if (serverConfig) {
      const config = JSON.parse(serverConfig);
      if (config.shopId) {
        return config.shopId;
      }
    }
    
    // Fallback to store identifiers
    const storeIdentifiers = localStorage.getItem('bizneai-store-identifiers');
    if (storeIdentifiers) {
      const identifiers = JSON.parse(storeIdentifiers);
      if (identifiers.shopId) {
        return identifiers.shopId;
      }
      // Also check clientId as fallback
      if (identifiers.clientId) {
        return identifiers.clientId;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting shopId:', error);
    return null;
  }
};

/**
 * Get the MCP URL from localStorage or build it from shopId
 * @returns MCP URL string or null if shopId not found
 */
export const getMcpUrl = (): string | null => {
  try {
    const serverConfig = localStorage.getItem('bizneai-server-config');
    if (serverConfig) {
      const config = JSON.parse(serverConfig);
      if (config.mcpUrl) {
        return config.mcpUrl;
      }
      // Build MCP URL from shopId if available
      if (config.shopId) {
        const baseUrl = config.serverUrl 
          ? new URL(config.serverUrl).origin 
          : 'https://www.bizneai.com';
        return `${baseUrl}/api/mcp/${config.shopId}`;
      }
    }
    
    // Fallback: build from store identifiers
    const storeIdentifiers = localStorage.getItem('bizneai-store-identifiers');
    if (storeIdentifiers) {
      const identifiers = JSON.parse(storeIdentifiers);
      if (identifiers.mcpUrl) {
        return identifiers.mcpUrl;
      }
      if (identifiers.shopId) {
        return `https://www.bizneai.com/api/mcp/${identifiers.shopId}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting MCP URL:', error);
    return null;
  }
};

/**
 * Check if shopId is configured
 * @returns true if shopId is available
 */
export const isShopIdConfigured = (): boolean => {
  return getShopId() !== null;
};

/**
 * Get shop data from MCP endpoint
 * @returns Promise with shop data or null if error
 */
export const getShopDataFromMcp = async (): Promise<any | null> => {
  const mcpUrl = getMcpUrl();
  if (!mcpUrl) {
    console.warn('MCP URL not configured');
    return null;
  }

  try {
    const response = await fetch(mcpUrl);
    if (response.ok) {
      const data = await response.json();
      return data.data || data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching shop data from MCP:', error);
    return null;
  }
};

/**
 * Get products from MCP endpoint
 * @returns Promise with products array or null if error
 */
export const getProductsFromMcp = async (): Promise<any[] | null> => {
  const mcpUrl = getMcpUrl();
  if (!mcpUrl) {
    console.warn('MCP URL not configured');
    return null;
  }

  try {
    const response = await fetch(mcpUrl);
    if (response.ok) {
      const data = await response.json();
      const shopData = data.data || data;
      return shopData.products || [];
    }
    return null;
  } catch (error) {
    console.error('Error fetching products from MCP:', error);
    return null;
  }
};

/**
 * Get inventory/stock data from MCP endpoint
 * @returns Promise with inventory data or null if error
 */
export const getInventoryFromMcp = async (): Promise<any | null> => {
  const mcpUrl = getMcpUrl();
  if (!mcpUrl) {
    console.warn('MCP URL not configured');
    return null;
  }

  try {
    const response = await fetch(mcpUrl);
    if (response.ok) {
      const data = await response.json();
      const shopData = data.data || data;
      return shopData.inventory || null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching inventory from MCP:', error);
    return null;
  }
};

/**
 * Get transactions/sales from MCP endpoint
 * @returns Promise with transactions array or null if error
 */
export const getTransactionsFromMcp = async (): Promise<any[] | null> => {
  const mcpUrl = getMcpUrl();
  if (!mcpUrl) {
    console.warn('MCP URL not configured');
    return null;
  }

  try {
    const response = await fetch(mcpUrl);
    if (response.ok) {
      const data = await response.json();
      const shopData = data.data || data;
      return shopData.transactions || [];
    }
    return null;
  } catch (error) {
    console.error('Error fetching transactions from MCP:', error);
    return null;
  }
};

/**
 * Map MCP product to local Product format
 */
export const mapMcpProductToLocal = (mcpProduct: any, index: number = 0): any => {
  return {
    id: mcpProduct._id || `product_${index}`,
    name: mcpProduct.name || '',
    description: mcpProduct.description || '',
    price: mcpProduct.price || 0,
    cost: mcpProduct.cost || mcpProduct.price || 0,
    category: mcpProduct.category || mcpProduct.mainCategory || 'General',
    stock: mcpProduct.stock || 0,
    minStock: mcpProduct.minStock || 0,
    maxStock: mcpProduct.maxStock || 0,
    barcode: mcpProduct.barcode || '',
    sku: mcpProduct.sku || '',
    unit: mcpProduct.unitOfMeasure || 'piece',
    supplier: '',
    location: '',
    isActive: mcpProduct.status === 'active',
    image: mcpProduct.images?.[0] || mcpProduct.imageMetadata?.cloudinaryUrls?.[0] || '',
    tags: [],
    createdAt: mcpProduct.createdAt || new Date().toISOString(),
    updatedAt: mcpProduct.updatedAt || new Date().toISOString()
  };
};

/**
 * Map MCP transaction to local Sale format
 */
export const mapMcpTransactionToSale = (mcpTransaction: any, index: number = 0): any => {
  return {
    id: mcpTransaction._id || `sale_${index}`,
    date: mcpTransaction.createdAt || new Date().toISOString(),
    customer: mcpTransaction.customerName || 'Walk-in Customer',
    items: (mcpTransaction.items || []).map((item: any) => ({
      product: {
        id: item.productId || `product_${index}`,
        name: item.productName || '',
        price: item.unitPrice || 0,
        category: item.category || 'General'
      },
      quantity: item.quantity || 0
    })),
    subtotal: mcpTransaction.subtotal || 0,
    tax: mcpTransaction.tax || 0,
    discount: mcpTransaction.discount || 0,
    total: mcpTransaction.total || 0,
    paymentMethod: mcpTransaction.paymentMethod || 'cash',
    status: mcpTransaction.paymentStatus || 'completed',
    transactionId: mcpTransaction.transactionId || '',
    receiptNumber: mcpTransaction.receiptNumber || '',
    change: 0
  };
};

