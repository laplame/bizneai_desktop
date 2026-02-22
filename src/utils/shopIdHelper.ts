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
      const mcpProducts = shopData.products || [];
      const shopId = shopData?.shop?._id || getShopId();
      const shopProducts = shopId ? await getProductsFromShopApi(shopId) : [];
      const shopProductIndex = buildShopProductIndex(shopProducts);

      return mcpProducts.map((product: any) =>
        enrichProductImageFromSources(product, shopProductIndex)
      );
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
    image: resolveBestImageUrl(mcpProduct) || '',
    tags: [],
    createdAt: mcpProduct.createdAt || new Date().toISOString(),
    updatedAt: mcpProduct.updatedAt || new Date().toISOString()
  };
};

const CLOUDINARY_PRODUCTS_BASE_URL = 'https://res.cloudinary.com/pin-pos/image/upload';
const IMAGE_FILENAME_REGEX = /^(images-\d{13}-[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp|gif))$/i;

const getApiOrigin = (): string => {
  const mcpUrl = getMcpUrl();
  if (mcpUrl) {
    try {
      return new URL(mcpUrl).origin;
    } catch {
      // Fall through to default
    }
  }

  return 'https://www.bizneai.com';
};

const getFilenameFromInput = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withoutQuery = trimmed.split('?')[0].split('#')[0];
  const candidate = withoutQuery.split('/').pop() || withoutQuery;
  return candidate || null;
};

const buildCloudinaryProductImageUrl = (value: string): string | null => {
  const filename = getFilenameFromInput(value);
  if (!filename || !IMAGE_FILENAME_REGEX.test(filename)) return null;

  // File pattern: images-1768357126991-608781052_gto6mf.jpg
  // Cloudinary version folder uses the first 10 digits of the unix millis: v1768357127
  const millisMatch = filename.match(/^images-(\d{13})-/i);
  if (!millisMatch) return null;

  const version = millisMatch[1].slice(0, 10);
  return `${CLOUDINARY_PRODUCTS_BASE_URL}/v${version}/products/${filename}`;
};

const normalizeImageValue = (value?: string): string | null => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const fromCloudinaryPattern = buildCloudinaryProductImageUrl(trimmed);
  if (fromCloudinaryPattern) return fromCloudinaryPattern;

  if (trimmed.startsWith('/')) {
    return `${getApiOrigin()}${trimmed}`;
  }

  return trimmed;
};

const resolveBestImageUrl = (product: any): string | null => {
  const candidates = [
    ...(product?.images || []),
    ...(product?.imageMetadata?.cloudinaryUrls || []),
    ...(product?.imageMetadata?.localUrls || []),
    product?.image,
    product?.thumbnail
  ];

  for (const candidate of candidates) {
    const normalized = normalizeImageValue(candidate);
    if (normalized) return normalized;
  }

  return null;
};

const getProductsFromShopApi = async (shopId: string): Promise<any[]> => {
  try {
    const url = `${getApiOrigin()}/api/shop/${shopId}/products?limit=500`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const payload = await response.json();
    return payload?.data?.products || payload?.data || [];
  } catch (error) {
    console.warn('Could not load products from shop API for image fallback:', error);
    return [];
  }
};

const buildShopProductIndex = (products: any[]): Map<string, any> => {
  const map = new Map<string, any>();

  for (const product of products || []) {
    if (product?._id) map.set(`id:${product._id}`, product);
    if (product?.sku) map.set(`sku:${String(product.sku).toLowerCase()}`, product);
    if (product?.name) map.set(`name:${String(product.name).toLowerCase()}`, product);
  }

  return map;
};

const findShopProductMatch = (mcpProduct: any, index: Map<string, any>): any | null => {
  if (!index || index.size === 0) return null;

  const keys = [
    mcpProduct?._id ? `id:${mcpProduct._id}` : null,
    mcpProduct?.sku ? `sku:${String(mcpProduct.sku).toLowerCase()}` : null,
    mcpProduct?.name ? `name:${String(mcpProduct.name).toLowerCase()}` : null
  ].filter(Boolean) as string[];

  for (const key of keys) {
    const match = index.get(key);
    if (match) return match;
  }

  return null;
};

const enrichProductImageFromSources = (mcpProduct: any, shopIndex: Map<string, any>): any => {
  const currentImage = resolveBestImageUrl(mcpProduct);
  if (currentImage) {
    return {
      ...mcpProduct,
      image: currentImage
    };
  }

  const shopMatch = findShopProductMatch(mcpProduct, shopIndex);
  const fallbackImage = resolveBestImageUrl(shopMatch);

  return {
    ...mcpProduct,
    image: fallbackImage || ''
  };
};

/**
 * Enrich products (e.g. from localStorage) with images from the Shop API.
 * Only updates products that don't have an image. Call this when displaying
 * the product list to ensure images are loaded even if they weren't at app init.
 */
export const enrichProductsWithImages = async (products: any[]): Promise<any[]> => {
  const shopId = getShopId();
  if (!shopId || !products?.length) return products;

  const needsImage = products.filter((p) => !p?.image || String(p.image).trim() === '');
  if (needsImage.length === 0) return products;

  try {
    const shopProducts = await getProductsFromShopApi(shopId);
    const shopIndex = buildShopProductIndex(shopProducts);

    return products.map((product) => {
      if (product?.image && String(product.image).trim() !== '') return product;

      const mcpLike = {
        _id: product.id,
        sku: product.sku,
        name: product.name
      };
      const shopMatch = findShopProductMatch(mcpLike, shopIndex);
      const imageUrl = shopMatch ? resolveBestImageUrl(shopMatch) : null;
      if (imageUrl) {
        return { ...product, image: imageUrl };
      }
      return product;
    });
  } catch (error) {
    console.warn('Could not enrich product images:', error);
    return products;
  }
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

