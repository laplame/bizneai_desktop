/**
 * Helper utilities for working with Shop ID and MCP URLs
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- Respuestas MCP heterogéneas; tipado estricto en mapMcp* y helpers nuevos */
import { normalizeProductId } from './productId';
import { getLocalApiOrigin, shouldUseSalesMcpProxy } from './localApiBase';
import { scheduleMirrorKeyToSqlite } from '../services/posPersistService';
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
 * Get the MCP URL from localStorage or build it from shopId.
 * En dev (localhost) o Electron (file://) usa proxy local :3000 para evitar CORS.
 * @returns MCP URL string or null if shopId not found
 */
export const getMcpUrl = (): string | null => {
  try {
    const shopId = getShopId();
    if (!shopId) return null;

    if (shouldUseSalesMcpProxy()) {
      return `${getLocalApiOrigin()}/api/proxy/mcp/${shopId}`;
    }

    const serverConfig = localStorage.getItem('bizneai-server-config');
    if (serverConfig) {
      const config = JSON.parse(serverConfig);
      if (config.mcpUrl) {
        return config.mcpUrl;
      }
      if (config.shopId) {
        const baseUrl = config.serverUrl
          ? new URL(config.serverUrl).origin
          : 'https://www.bizneai.com';
        return `${baseUrl}/api/mcp/${config.shopId}`;
      }
    }

    const storeIdentifiers = localStorage.getItem('bizneai-store-identifiers');
    if (storeIdentifiers) {
      const identifiers = JSON.parse(storeIdentifiers);
      if (identifiers.mcpUrl) return identifiers.mcpUrl;
      if (identifiers.shopId) {
        return `https://www.bizneai.com/api/mcp/${identifiers.shopId}`;
      }
    }

    return `https://www.bizneai.com/api/mcp/${shopId}`;
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
 * Sincroniza kitchenEnabled desde MCP a bizneai-store-config.
 * Llama al arranque cuando hay shopId configurado para que el menú Cocina se muestre.
 */
export const syncKitchenEnabledFromMcp = (): void => {
  const mcpUrl = getMcpUrl();
  if (!mcpUrl) return;
  getShopDataFromMcp().then((payload) => {
    if (!payload) return;
    const shop = payload.shop || payload.data?.shop || payload;
    const enabled = shop?.kitchenEnabled ?? payload.kitchen?.enabled;
    if (enabled === undefined) return;
    const kitchenOn = !!enabled;
    try {
      const existing = localStorage.getItem('bizneai-store-config');
      const config = existing ? JSON.parse(existing) : {};
      config.kitchenEnabled = kitchenOn;
      localStorage.setItem('bizneai-store-config', JSON.stringify(config));
      scheduleMirrorKeyToSqlite('bizneai-store-config');
      const serverRaw = localStorage.getItem('bizneai-server-config');
      if (serverRaw) {
        const server = JSON.parse(serverRaw);
        server.kitchenEnabled = kitchenOn;
        localStorage.setItem('bizneai-server-config', JSON.stringify(server));
        scheduleMirrorKeyToSqlite('bizneai-server-config');
      }
      window.dispatchEvent(new Event('store-config-updated'));
    } catch (e) {
      console.warn('Could not sync kitchenEnabled from MCP:', e);
    }
  });
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

/** Normaliza objeto MCP desconocido a mapa para lectura segura */
function asMcpRecord(mcpProduct: unknown): Record<string, unknown> {
  return mcpProduct && typeof mcpProduct === 'object' ? (mcpProduct as Record<string, unknown>) : {};
}

/**
 * Map MCP product to local Product format
 */
export const mapMcpProductToLocal = (mcpProduct: unknown, index: number = 0): Record<string, unknown> => {
  const p = asMcpRecord(mcpProduct);
  const id = p._id ?? `product_${index}`;
  const price = typeof p.price === 'number' ? p.price : Number(p.price) || 0;
  const cost = typeof p.cost === 'number' ? p.cost : Number(p.cost) || price;
  return {
    id,
    name: String(p.name ?? ''),
    description: String(p.description ?? ''),
    price,
    cost,
    category: String(p.category ?? p.mainCategory ?? 'General'),
    stock: typeof p.stock === 'number' ? p.stock : Number(p.stock) || 0,
    minStock: typeof p.minStock === 'number' ? p.minStock : Number(p.minStock) || 0,
    maxStock: typeof p.maxStock === 'number' ? p.maxStock : Number(p.maxStock) || 0,
    barcode: String(p.barcode ?? ''),
    sku: String(p.sku ?? ''),
    unit: String(p.unitOfMeasure ?? 'piece'),
    supplier: '',
    location: '',
    isActive: p.status === 'active',
    image: resolveBestImageUrl(mcpProduct) || '',
    tags: [],
    createdAt: p.createdAt != null && String(p.createdAt) !== '' ? String(p.createdAt) : '',
    updatedAt: p.updatedAt != null && String(p.updatedAt) !== '' ? String(p.updatedAt) : '',
    hasVariants: Boolean(p.hasVariants),
    variantGroups: p.variantGroups ?? undefined,
    primaryVariantGroup: p.primaryVariantGroup ?? undefined,
    isWeightBased: Boolean(p.isWeightBased),
    priceIncludesTax: typeof p.priceIncludesTax === 'boolean' ? p.priceIncludesTax : undefined,
    taxExempt: typeof p.taxExempt === 'boolean' ? p.taxExempt : undefined,
  };
};

/** Campos que definen si el servidor cambió datos (excluye id e image). */
const SYNC_DATA_KEYS: readonly string[] = [
  'name',
  'description',
  'price',
  'cost',
  'category',
  'stock',
  'minStock',
  'maxStock',
  'barcode',
  'sku',
  'unit',
  'supplier',
  'location',
  'isActive',
  'hasVariants',
  'variantGroups',
  'primaryVariantGroup',
  'isWeightBased',
  'priceIncludesTax',
  'taxExempt',
  'createdAt',
  'updatedAt',
  'tags',
];

function productDataFingerprint(row: Record<string, unknown>): string {
  const o: Record<string, unknown> = {};
  for (const k of SYNC_DATA_KEYS) {
    const key = k as string;
    if (key in row) o[key] = row[key];
  }
  return JSON.stringify(o, Object.keys(o).sort());
}

function pickMergedImage(remote: Record<string, unknown>, local: Record<string, unknown>): string {
  const r = String(remote.image ?? '').trim();
  const l = String(local.image ?? '').trim();
  if (r) return r;
  return l;
}

function shouldKeepLocalUnchanged(
  prev: Record<string, unknown>,
  remote: Record<string, unknown>
): boolean {
  const u1 = String(prev.updatedAt ?? '').trim();
  const u2 = String(remote.updatedAt ?? '').trim();
  if (u1 && u2 && u1 === u2) return true;
  return productDataFingerprint(prev) === productDataFingerprint(remote);
}

/**
 * Tras traer el catálogo del servidor: conserva filas locales sin cambios si los datos
 * coinciden (misma huella / mismo updatedAt) y mantiene la imagen local si el remoto viene sin URL.
 * El orden y el conjunto de IDs siguen al listado remoto (fuente de verdad).
 */
export const mergeProductsFromServerPreserveImages = (
  localProducts: unknown[] | null | undefined,
  remoteMapped: Record<string, unknown>[]
): Record<string, unknown>[] => {
  const local = Array.isArray(localProducts) ? localProducts : [];
  const localByKey = new Map<number, Record<string, unknown>>();
  for (let i = 0; i < local.length; i++) {
    const p = local[i];
    if (p && typeof p === 'object') {
      const row = p as Record<string, unknown>;
      const key = normalizeProductId(row.id, i);
      localByKey.set(key, row);
    }
  }

  const out: Record<string, unknown>[] = [];
  for (let i = 0; i < remoteMapped.length; i++) {
    const r = remoteMapped[i];
    const key = normalizeProductId(r.id, i);
    const prev = localByKey.get(key);
    if (!prev) {
      out.push(r);
      continue;
    }
    if (shouldKeepLocalUnchanged(prev, r)) {
      out.push(prev);
      continue;
    }
    out.push({ ...prev, ...r, image: pickMergedImage(r, prev) });
  }
  return out;
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

const normalizeImageValue = (value: unknown): string | null => {
  if (value == null || typeof value !== 'string') return null;
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

const resolveBestImageUrl = (product: unknown): string | null => {
  const p = asMcpRecord(product);
  const meta =
    p.imageMetadata && typeof p.imageMetadata === 'object'
      ? (p.imageMetadata as Record<string, unknown>)
      : {};
  const cloud = meta.cloudinaryUrls;
  const local = meta.localUrls;
  const candidates: unknown[] = [
    ...(Array.isArray(p.images) ? p.images : []),
    ...(Array.isArray(cloud) ? cloud : []),
    ...(Array.isArray(local) ? local : []),
    p.image,
    p.thumbnail,
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
export const mapMcpTransactionToSale = (mcpTransaction: unknown, index: number = 0): Record<string, unknown> => {
  const t = asMcpRecord(mcpTransaction);
  const rawItems = t.items;
  const items = Array.isArray(rawItems) ? rawItems : [];
  return {
    id: t._id ?? `sale_${index}`,
    date: String(t.createdAt ?? new Date().toISOString()),
    customer: String(t.customerName ?? 'Walk-in Customer'),
    items: items.map((item: unknown, i: number) => {
      const it = asMcpRecord(item);
      return {
        product: {
          id: it.productId ?? `product_${i}`,
          name: String(it.productName ?? ''),
          price: typeof it.unitPrice === 'number' ? it.unitPrice : Number(it.unitPrice) || 0,
          category: String(it.category ?? 'General'),
        },
        quantity: typeof it.quantity === 'number' ? it.quantity : Number(it.quantity) || 0,
      };
    }),
    subtotal: typeof t.subtotal === 'number' ? t.subtotal : Number(t.subtotal) || 0,
    tax: typeof t.tax === 'number' ? t.tax : Number(t.tax) || 0,
    discount: typeof t.discount === 'number' ? t.discount : Number(t.discount) || 0,
    total: typeof t.total === 'number' ? t.total : Number(t.total) || 0,
    paymentMethod: String(t.paymentMethod ?? 'cash'),
    status: String(t.paymentStatus ?? 'completed'),
    transactionId: String(t.transactionId ?? ''),
    receiptNumber: String(t.receiptNumber ?? ''),
    change: 0,
  };
};

