import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings as SettingsIcon, 
  Camera,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Receipt,
  X,
  Store,
  ShoppingBag,
  Warehouse,
  Clock,
  ReceiptText,
  FileText,
  ChefHat,
  MessageSquare,
  Calendar,
  Info,
  RefreshCw,
  PanelLeftClose,
  ChevronDown,
  ChevronUp,
  User,
  Printer,
  Lock
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import {
  getProductsFromMcp,
  mapMcpProductToLocal,
  getShopDataFromMcp,
  enrichProductsWithImages,
  isShopIdConfigured,
  syncKitchenEnabledFromMcp,
  mergeProductsFromServerPreserveImages,
} from './utils/shopIdHelper';
import { normalizeProductId } from './utils/productId';
import { maybeSyncIfDue, setLastSyncTime } from './utils/syncService';
import { createSale } from './api/sales';
import { computeCartTaxBreakdownFromCartItems, loadTaxSettings } from './utils/taxSettings';
import {
  loadCustomers,
  recordPurchaseForCustomer,
  getCustomerFullName,
  getCustomerStatusLabel,
} from './services/customerRegistry';
import type { RegistryCustomer } from './types/customerRegistry';
import type { RecoveredSalePayload } from './types/salesRecovery';
import { recordSaleCreation } from './services/merkleTreeService';
import { printReceiptThermalOrDialog, printProductCatalog, isElectron } from './services/receiptPrintService';
import BarcodeScanner from './components/BarcodeScanner';
import CheckoutModal from './components/CheckoutModal';
import SalesReports from './components/SalesReports';
import ProductManagement from './components/ProductManagement';
import CustomerManagement from './components/CustomerManagement';
import VirtualTicket from './components/VirtualTicket';
import Settings from './components/Settings';
import ProductUpload from './components/ProductUpload';
import Waitlist from './components/Waitlist';
import Taxes from './components/Taxes';
import Kitchen from './components/Kitchen';
import BizneAIChat from './components/BizneAIChat';
import ComingSoon from './components/ComingSoon';
import LiveClock from './components/LiveClock';
import MerkleBlocksWidget from './components/MerkleBlocksWidget';
import LocalPersistenceStatus from './components/LocalPersistenceStatus';
import ScreenLock from './components/ScreenLock';
import ConfigurationAccessGate from './components/ConfigurationAccessGate';
import { storeAPI } from './api/store';
import { waitlistAPI } from './api/waitlist';
import { useStore } from './contexts/StoreContext';
import { shouldShowImage, markImageFailed } from './utils/imageCache';
import ProductVariantSelectorModal from './components/ProductVariantSelectorModal';
import { calculateProductPrice, buildVariantDisplayName } from './types/variants';
import type { VariantGroup, SelectedVariants } from './types/variants';
import { getVersionDisplay } from './lib/buildInfo';
import {
  lockSession,
  shouldShowScreenLockOnStartup,
  isScreenLockEnabled,
  hasScreenLockPinsConfigured,
  getScreenLockIdentity,
} from './services/rolesScreenLock';
import { isConfigurationAccessUnlocked } from './services/configPasswords';
import { recordSaleCashier } from './services/localActivityLog';
import {
  hydrateLocalFromServerIfEmpty,
  initPosPersistence,
  scheduleMirrorKeyToSqlite,
} from './services/posPersistService';
import { syncProductImagesToLocalDisk } from './services/productImageLocalCache';
import { getKitchenModuleVisibility } from './utils/kitchenModule';

// Tipos de datos
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  barcode?: string; // Agregando código de barras
  isWeightBased?: boolean;
  hasVariants?: boolean;
  variantGroups?: VariantGroup[];
  primaryVariantGroup?: string;
  /** JSON/API: precio con IVA incluido para este artículo (sobrescribe la tienda). */
  priceIncludesTax?: boolean;
  /** JSON/API: artículo exento de impuesto. */
  taxExempt?: boolean;
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  weight?: number;
  selectedVariants?: SelectedVariants;
  variantDisplayName?: string;
  unitPrice: number;
  itemTotal: number;
  notes?: string;
}

interface CustomerInfo {
  name?: string;
  phone?: string;
  email?: string;
  tableNumber?: string;
  waiterName?: string;
  /** Si se elige del registro de clientes (Clientes). */
  customerId?: number;
}

// Datos de ejemplo con códigos de barras (Café Latte tiene variantes tipo cafetería)
const sampleProducts: Product[] = [
  { id: 1, name: 'Café Americano', price: 2.50, category: 'Bebidas', stock: 50, barcode: '1234567890123' },
  {
    id: 2,
    name: 'Café Latte',
    price: 4.00,
    category: 'Bebidas',
    stock: 45,
    barcode: '1234567890124',
    hasVariants: true,
    variantGroups: [
      {
        name: 'Size',
        label: 'Tamaño',
        type: 'size',
        isPrimary: true,
        order: 0,
        variants: [
          { name: 'Chico', value: 'S', priceModifier: 0, isDefault: true, order: 0 },
          { name: 'Mediano', value: 'M', priceModifier: 0.5, order: 1 },
          { name: 'Grande', value: 'L', priceModifier: 1.0, order: 2 }
        ]
      },
      {
        name: 'Milk',
        label: 'Tipo de leche',
        type: 'custom',
        order: 1,
        variants: [
          { name: 'Normal', value: 'normal', priceModifier: 0, isDefault: true, order: 0 },
          { name: 'Leche almendras', value: 'almond', priceModifier: 0.5, order: 1 },
          { name: 'Leche avena', value: 'oat', priceModifier: 0.5, order: 2 }
        ]
      },
      {
        name: 'Extras',
        label: 'Extras',
        type: 'custom',
        allowMultiple: true,
        order: 2,
        variants: [
          { name: 'Shot extra', value: 'extra_shot', priceModifier: 1.0, order: 0 },
          { name: 'Crema batida', value: 'whipped', priceModifier: 0.5, order: 1 }
        ]
      }
    ],
    primaryVariantGroup: 'Size'
  },
  { id: 3, name: 'Cappuccino', price: 3.00, category: 'Bebidas', stock: 40, barcode: '1234567890125' },
  { id: 4, name: 'Croissant', price: 2.00, category: 'Panadería', stock: 30, barcode: '1234567890126' },
  { id: 5, name: 'Muffin de Chocolate', price: 2.50, category: 'Panadería', stock: 25, barcode: '1234567890127' },
  { id: 6, name: 'Sándwich de Pollo', price: 5.50, category: 'Comida', stock: 20, barcode: '1234567890128' },
  { id: 7, name: 'Ensalada César', price: 6.00, category: 'Comida', stock: 15, barcode: '1234567890129' },
  { id: 8, name: 'Pizza Margherita', price: 8.50, category: 'Comida', stock: 10, barcode: '1234567890130' },
  { id: 9, name: 'Agua Mineral', price: 1.50, category: 'Bebidas', stock: 100, barcode: '1234567890131' },
  { id: 10, name: 'Jugo de Naranja', price: 2.00, category: 'Bebidas', stock: 35, barcode: '1234567890132' },
  { id: 11, name: 'Tarta de Manzana', price: 3.50, category: 'Postres', stock: 20, barcode: '1234567890133' },
  { id: 12, name: 'Helado de Vainilla', price: 2.50, category: 'Postres', stock: 30, barcode: '1234567890134' },
];

const CLOUDINARY_PRODUCTS_BASE_URL = 'https://res.cloudinary.com/pin-pos/image/upload';
const IMAGE_FILENAME_REGEX = /^(images-\d{13}-[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp|gif))$/i;

const getApiOriginFromConfig = (): string => {
  try {
    const serverConfigRaw = localStorage.getItem('bizneai-server-config');
    if (!serverConfigRaw) return 'https://www.bizneai.com';

    const serverConfig = JSON.parse(serverConfigRaw);
    if (serverConfig?.mcpUrl) return new URL(serverConfig.mcpUrl).origin;
    if (serverConfig?.serverUrl) return new URL(serverConfig.serverUrl).origin;
  } catch {
    // Use default origin
  }

  return 'https://www.bizneai.com';
};

const normalizeProductImageUrl = (value?: string): string => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const filename = trimmed.split('?')[0].split('#')[0].split('/').pop() || trimmed;
  if (IMAGE_FILENAME_REGEX.test(filename)) {
    const millisMatch = filename.match(/^images-(\d{13})-/i);
    if (millisMatch) {
      const version = millisMatch[1].slice(0, 10);
      return `${CLOUDINARY_PRODUCTS_BASE_URL}/v${version}/products/${filename}`;
    }
  }

  if (trimmed.startsWith('/')) {
    return `${getApiOriginFromConfig()}${trimmed}`;
  }

  return trimmed;
};

// Plantillas de variantes para productos conocidos (cafetería). Se aplican al cargar si el producto no tiene variantGroups.
const VARIANT_TEMPLATES: Record<string, Partial<Product>> = {
  'café latte': {
    hasVariants: true,
    variantGroups: [
      {
        name: 'Size',
        label: 'Tamaño',
        type: 'size',
        isPrimary: true,
        order: 0,
        variants: [
          { name: 'Chico', value: 'S', priceModifier: 0, isDefault: true, order: 0 },
          { name: 'Mediano', value: 'M', priceModifier: 0.5, order: 1 },
          { name: 'Grande', value: 'L', priceModifier: 1.0, order: 2 }
        ]
      },
      {
        name: 'Milk',
        label: 'Tipo de leche',
        type: 'custom',
        order: 1,
        variants: [
          { name: 'Normal', value: 'normal', priceModifier: 0, isDefault: true, order: 0 },
          { name: 'Leche almendras', value: 'almond', priceModifier: 0.5, order: 1 },
          { name: 'Leche avena', value: 'oat', priceModifier: 0.5, order: 2 }
        ]
      },
      {
        name: 'Extras',
        label: 'Extras',
        type: 'custom',
        allowMultiple: true,
        order: 2,
        variants: [
          { name: 'Shot extra', value: 'extra_shot', priceModifier: 1.0, order: 0 },
          { name: 'Crema batida', value: 'whipped', priceModifier: 0.5, order: 1 }
        ]
      }
    ],
    primaryVariantGroup: 'Size'
  },
  'cappuccino': {
    hasVariants: true,
    variantGroups: [
      {
        name: 'Size',
        label: 'Tamaño',
        type: 'size',
        isPrimary: true,
        order: 0,
        variants: [
          { name: 'Chico', value: 'S', priceModifier: 0, isDefault: true, order: 0 },
          { name: 'Mediano', value: 'M', priceModifier: 0.5, order: 1 },
          { name: 'Grande', value: 'L', priceModifier: 1.0, order: 2 }
        ]
      }
    ],
    primaryVariantGroup: 'Size'
  },
  'café americano': {
    hasVariants: true,
    variantGroups: [
      {
        name: 'Size',
        label: 'Tamaño',
        type: 'size',
        isPrimary: true,
        order: 0,
        variants: [
          { name: 'Chico', value: 'S', priceModifier: 0, isDefault: true, order: 0 },
          { name: 'Mediano', value: 'M', priceModifier: 0.5, order: 1 },
          { name: 'Grande', value: 'L', priceModifier: 1.0, order: 2 }
        ]
      }
    ],
    primaryVariantGroup: 'Size'
  },
  'smoothie': {
    hasVariants: true,
    variantGroups: [
      {
        name: 'Size',
        label: 'Tamaño',
        type: 'size',
        isPrimary: true,
        order: 0,
        variants: [
          { name: 'Chico', value: 'S', priceModifier: -5, isDefault: true, order: 0 },
          { name: 'Mediano', value: 'M', priceModifier: 0, order: 1 },
          { name: 'Grande', value: 'L', priceModifier: 5, order: 2 }
        ]
      }
    ],
    primaryVariantGroup: 'Size'
  }
};

/** Fila API MCP para variantes (shape flexible) */
type ApiVariantRow = Record<string, unknown>;
type ApiProductRow = Record<string, unknown>;

/** Normaliza variantGroups de API (p. ej. "options" -> "variants", nombres de variante) */
const normalizeVariantGroups = (groups: unknown): ApiVariantRow[] => {
  if (!Array.isArray(groups)) return [];
  return groups.map((g) => {
    const row = (g && typeof g === 'object' ? g : {}) as ApiVariantRow;
    const rawV = row.variants ?? row.options;
    const variants = Array.isArray(rawV) ? rawV : [];
    return {
      ...row,
      name: row.name ?? row.id ?? '',
      label: row.label ?? row.name ?? '',
      variants: variants.map((v) => {
        const vr = (v && typeof v === 'object' ? v : {}) as ApiVariantRow;
        return {
          name: vr.name ?? vr.label ?? vr.optionName ?? vr.value ?? '',
          value: String(vr.value ?? vr.name ?? vr.id ?? ''),
          price: vr.price,
          priceModifier: vr.priceModifier,
          stock: vr.stock,
          isDefault: vr.isDefault ?? vr.default ?? false,
          order: vr.order ?? 0,
        };
      }),
    };
  });
};

const applyVariantTemplates = (product: ApiProductRow): ApiProductRow => {
  const vg = product.variantGroups;
  if (Array.isArray(vg) && vg.length > 0) {
    return {
      ...product,
      variantGroups: normalizeVariantGroups(vg),
      hasVariants: true,
      primaryVariantGroup:
        (product.primaryVariantGroup as string | undefined) ??
        (typeof (vg[0] as ApiVariantRow)?.name === 'string' ? (vg[0] as ApiVariantRow).name : undefined),
    };
  }
  const name = String(product.name || '')
    .toLowerCase()
    .trim();
  const template = VARIANT_TEMPLATES[name];
  if (!template) return product;
  return { ...product, ...template };
};

const hydrateProductsForPos = (productsList: unknown[]): Product[] => {
  const list = Array.isArray(productsList) ? productsList : [];
  return list.map((product: unknown, index: number) => {
    const withVariants = applyVariantTemplates(
      (product && typeof product === 'object' ? product : {}) as ApiProductRow
    );
    const meta =
      withVariants.imageMetadata && typeof withVariants.imageMetadata === 'object'
        ? (withVariants.imageMetadata as Record<string, unknown>)
        : {};
    const cy = meta.cloudinaryUrls;
    const lu = meta.localUrls;
    const imgs = withVariants.images;
    const imageCandidate =
      withVariants.image ||
      (Array.isArray(imgs) ? imgs[0] : undefined) ||
      (Array.isArray(cy) ? cy[0] : undefined) ||
      (Array.isArray(lu) ? lu[0] : undefined) ||
      '';

    return {
      ...withVariants,
      id: normalizeProductId(withVariants?.id, index),
      image: normalizeProductImageUrl(
        typeof imageCandidate === 'string' ? imageCandidate : String(imageCandidate ?? '')
      ),
      hasVariants: Boolean(withVariants?.hasVariants),
      variantGroups: withVariants?.variantGroups,
      primaryVariantGroup: withVariants?.primaryVariantGroup,
    } as Product;
  });
};

const looksLikeSampleCatalog = (productsList: Product[]): boolean => {
  if (!productsList || productsList.length === 0) return false;
  const sampleNames = new Set([
    'Cappuccino',
    'Café Americano',
    'Café Latte',
    'Muffin de Chocolate',
    'Croissant'
  ]);

  const matches = productsList.filter((p) => sampleNames.has(p.name)).length;
  return matches >= 3;
};

const getConfiguredMcpUrl = (): string => {
  try {
    const serverConfigRaw = localStorage.getItem('bizneai-server-config');
    if (!serverConfigRaw) return '';
    const serverConfig = JSON.parse(serverConfigRaw);
    return serverConfig?.mcpUrl || '';
  } catch {
    return '';
  }
};

function App() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productOrderCounts, setProductOrderCounts] = useState<{ [productId: number]: number }>({});
  
  // Categorías dinámicas extraídas de los productos
  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Función para extraer categorías únicas de los productos
  const extractCategories = (productsList: Product[]): string[] => {
    const uniqueCategories = new Set<string>();
    productsList.forEach(product => {
      if (product.category && product.category.trim() !== '') {
        uniqueCategories.add(product.category);
      }
    });
    const sortedCategories = Array.from(uniqueCategories).sort();
    return ['Todos', ...sortedCategories];
  };
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [productForVariantModal, setProductForVariantModal] = useState<Product | null>(null);
  const [productManagementInitialView, setProductManagementInitialView] = useState<'list' | 'grid' | 'analytics' | 'inventory' | null>(null);
  const [productManagementRestockProduct, setProductManagementRestockProduct] = useState<{ id: number; name: string } | null>(null);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isProductManagementOpen, setIsProductManagementOpen] = useState(false);
  const [isCustomerManagementOpen, setIsCustomerManagementOpen] = useState(false);
  const [isVirtualTicketOpen, setIsVirtualTicketOpen] = useState(false);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isTaxesOpen, setIsTaxesOpen] = useState(false);
  const [isKitchenOpen, setIsKitchenOpen] = useState(false);
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
  const [printErrorModal, setPrintErrorModal] = useState<{ message: string } | null>(null);
  const [isPrintingCatalog, setIsPrintingCatalog] = useState(false);
  const [activeSection, setActiveSection] = useState<'pos' | 'cart' | 'products' | 'reports' | 'customers' | 'waitlist' | 'taxes' | 'kitchen' | 'chat' | 'coming-soon' | 'settings'>('pos');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({});
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [customerInfoCollapsed, setCustomerInfoCollapsed] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<{
    saleId: string;
    paymentMethod: string;
    change?: number;
    customerInfo?: {
      name: string;
      email: string;
      phone: string;
    };
  } | null>(null);
  const [storeConfigVersion, setStoreConfigVersion] = useState(0);
  const [sidebarMinimal, setSidebarMinimal] = useState(() => localStorage.getItem('bizneai-sidebar-minimal') === 'true');
  const [registryCustomers, setRegistryCustomers] = useState<RegistryCustomer[]>([]);
  const [screenLocked, setScreenLocked] = useState(() => {
    try {
      const stored = localStorage.getItem('bizneai-setup-complete');
      const storeConfig = localStorage.getItem('bizneai-store-config');
      const setupDone = stored === 'true' || storeConfig !== null;
      if (!setupDone) return false;
      return shouldShowScreenLockOnStartup();
    } catch {
      return false;
    }
  });

  const cartTax = useMemo(
    () =>
      computeCartTaxBreakdownFromCartItems(
        cart.map((item) => ({ itemTotal: item.itemTotal, product: item.product })),
        loadTaxSettings()
      ),
    [cart, storeConfigVersion]
  );

  // Estado para la configuración inicial
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(() => {
    const stored = localStorage.getItem('bizneai-setup-complete');
    const storeConfig = localStorage.getItem('bizneai-store-config');
    return stored === 'true' || storeConfig !== null;
  });

  // Estado para el modal de carga de productos
  const [showProductUpload, setShowProductUpload] = useState(false);

  // Cargar productos: al iniciar, recargar desde MCP si está configurado para tener variantes actualizadas.
  const loadProducts = async () => {
    // 1. Si hay shopId configurado, intentar recargar desde MCP primero (productos con variantes actualizados)
    if (isShopIdConfigured()) {
      try {
        syncKitchenEnabledFromMcp();
        const mcpProducts = await getProductsFromMcp();
        if (mcpProducts && mcpProducts.length > 0) {
          let savedParsed: unknown[] = [];
          try {
            const raw = localStorage.getItem('bizneai-products');
            if (raw) {
              const p = JSON.parse(raw);
              if (Array.isArray(p)) savedParsed = p;
            }
          } catch {
            /* ignore */
          }
          const mappedProducts = mcpProducts.map((p: unknown, index: number) => mapMcpProductToLocal(p, index));
          const merged = mergeProductsFromServerPreserveImages(savedParsed, mappedProducts);
          const mergedCached = await syncProductImagesToLocalDisk(merged);
          const hydrated = hydrateProductsForPos(mergedCached);
          setProducts(hydrated);
          setCategories(extractCategories(hydrated));
          localStorage.setItem('bizneai-products', JSON.stringify(hydrated));
          setLastSyncTime();
          window.dispatchEvent(new Event('products-updated'));
          maybeSyncIfDue();
          return;
        }
      } catch (e) {
        console.warn('Error al recargar productos desde servidor:', e);
      }
    }

    // 2. Fallback: cargar desde localStorage (con plantillas de variantes aplicadas)
    const savedProducts = localStorage.getItem('bizneai-products');
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        if (parsedProducts && parsedProducts.length > 0) {
          const hydratedLocalProducts = hydrateProductsForPos(parsedProducts);
          setProducts(hydratedLocalProducts);
          setCategories(extractCategories(hydratedLocalProducts));

          const hasAnyImage = hydratedLocalProducts.some((product) => Boolean(product.image));
          const isSampleCatalog = looksLikeSampleCatalog(hydratedLocalProducts);
          if (hasAnyImage && !isSampleCatalog) {
            if (isShopIdConfigured() && hydratedLocalProducts.some((p) => !p?.image || String(p.image).trim() === '')) {
              enrichProductsWithImages(hydratedLocalProducts).then((enriched) => {
                setProducts(enriched);
                setCategories(extractCategories(enriched));
                localStorage.setItem('bizneai-products', JSON.stringify(enriched));
                window.dispatchEvent(new Event('products-updated'));
              });
            }
          }
          maybeSyncIfDue();
          return;
        }
      } catch (error) {
        console.warn('Error parsing saved products:', error);
      }
    }

    // 3. Sin datos locales: usar productos de ejemplo (incluyen Café Latte con variantes)
    setProducts(sampleProducts);
    setCategories(extractCategories(sampleProducts));
    if (isShopIdConfigured()) {
      try {
        syncKitchenEnabledFromMcp();
        const mcpProducts = await getProductsFromMcp();
        if (mcpProducts && mcpProducts.length > 0) {
          let savedParsed: unknown[] = [];
          try {
            const raw = localStorage.getItem('bizneai-products');
            if (raw) {
              const p = JSON.parse(raw);
              if (Array.isArray(p)) savedParsed = p;
            }
          } catch {
            /* ignore */
          }
          const mappedProducts = mcpProducts.map((p: unknown, index: number) => mapMcpProductToLocal(p, index));
          const merged = mergeProductsFromServerPreserveImages(savedParsed, mappedProducts);
          const mergedCached = await syncProductImagesToLocalDisk(merged);
          const hydrated = hydrateProductsForPos(mergedCached);
          setProducts(hydrated);
          setCategories(extractCategories(hydrated));
          localStorage.setItem('bizneai-products', JSON.stringify(hydrated));
          setLastSyncTime();
          window.dispatchEvent(new Event('products-updated'));
        }
      } catch (e) {
        console.warn('Primera carga falló (sin conexión?):', e);
      }
    }
    maybeSyncIfDue();
  };

  // Cargar contadores de pedidos al iniciar
  useEffect(() => {
    const savedOrderCounts = localStorage.getItem('bizneai-product-order-counts');
    if (savedOrderCounts) {
      try {
        const parsedCounts = JSON.parse(savedOrderCounts);
        setProductOrderCounts(parsedCounts);
      } catch (error) {
        console.error('Error loading product order counts:', error);
      }
    }
  }, []);

  // Guardar contadores de pedidos cuando cambien
  useEffect(() => {
    if (Object.keys(productOrderCounts).length > 0) {
      localStorage.setItem('bizneai-product-order-counts', JSON.stringify(productOrderCounts));
      scheduleMirrorKeyToSqlite('bizneai-product-order-counts');
    }
  }, [productOrderCounts]);

  // Escuchar cambios en productos desde ProductManagement
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bizneai-products' && e.newValue) {
        try {
          const parsedProducts = JSON.parse(e.newValue);
          setProducts(hydrateProductsForPos(parsedProducts));
        } catch (error) {
          console.error('Error parsing products from storage:', error);
        }
      }
    };

    const handleProductsUpdated = () => {
      const savedProducts = localStorage.getItem('bizneai-products');
      if (savedProducts) {
        try {
          const parsedProducts = JSON.parse(savedProducts);
          const hydratedProducts = hydrateProductsForPos(parsedProducts);
          setProducts(hydratedProducts);
          // Actualizar categorías cuando se actualizan los productos
          setCategories(extractCategories(hydratedProducts));
        } catch (error) {
          console.error('Error parsing products:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('products-updated', handleProductsUpdated);

    void (async () => {
      await initPosPersistence();
      await hydrateLocalFromServerIfEmpty();
      loadProducts();
      if (isShopIdConfigured()) {
        syncKitchenEnabledFromMcp();
      }
    })();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('products-updated', handleProductsUpdated);
    };
  }, []);

  // Escuchar actualizaciones de store-config (ej. kitchenEnabled desde MCP)
  useEffect(() => {
    const onStoreConfigUpdated = () => setStoreConfigVersion(v => v + 1);
    window.addEventListener('store-config-updated', onStoreConfigUpdated);
    return () => window.removeEventListener('store-config-updated', onStoreConfigUpdated);
  }, []);

  useEffect(() => {
    const refresh = () => setRegistryCustomers(loadCustomers());
    refresh();
    window.addEventListener('customers-updated', refresh);
    return () => window.removeEventListener('customers-updated', refresh);
  }, []);

  // Cargar carrito guardado al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('bizneai-cart');
    const savedCustomerInfo = localStorage.getItem('bizneai-cart-customer');
    const savedNotes = localStorage.getItem('bizneai-cart-notes');
    
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
    
    if (savedCustomerInfo) {
      try {
        setCustomerInfo(JSON.parse(savedCustomerInfo));
      } catch (error) {
        console.error('Error loading customer info:', error);
      }
    }
    
    if (savedNotes) {
      setOrderNotes(savedNotes);
    }
  }, []);

  // Guardar carrito cuando cambie
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('bizneai-cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('bizneai-cart');
    }
    scheduleMirrorKeyToSqlite('bizneai-cart');
  }, [cart]);

  // Guardar información de cliente
  useEffect(() => {
    if (Object.keys(customerInfo).length > 0) {
      localStorage.setItem('bizneai-cart-customer', JSON.stringify(customerInfo));
    } else {
      localStorage.removeItem('bizneai-cart-customer');
    }
    scheduleMirrorKeyToSqlite('bizneai-cart-customer');
  }, [customerInfo]);

  // Guardar notas
  useEffect(() => {
    if (orderNotes) {
      localStorage.setItem('bizneai-cart-notes', orderNotes);
    } else {
      localStorage.removeItem('bizneai-cart-notes');
    }
    scheduleMirrorKeyToSqlite('bizneai-cart-notes');
  }, [orderNotes]);

  // Verificar configuración al cargar la aplicación
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await storeAPI.checkStatus();
        if (response.isConfigured) {
          setIsSetupComplete(true);
          localStorage.setItem('bizneai-setup-complete', 'true');
          scheduleMirrorKeyToSqlite('bizneai-setup-complete');
        }
      } catch {
        console.log('No se pudo verificar el estado de configuración, usando configuración local');
        // Verificar si ya hay configuración local
        const localConfig = localStorage.getItem('bizneai-store-config');
        if (localConfig) {
          setIsSetupComplete(true);
          localStorage.setItem('bizneai-setup-complete', 'true');
          scheduleMirrorKeyToSqlite('bizneai-setup-complete');
        }
      }
    };

    checkSetupStatus();
  }, []);

  // Simular backup automático cada 30 minutos
  useEffect(() => {
    const simulateAutoBackup = () => {
      const now = new Date();
      localStorage.setItem('lastBackupTime', now.toISOString());
      console.log('Backup automático completado:', now.toLocaleString());
    };

    // Verificar si hay configuración de backup habilitada
    const settings = localStorage.getItem('bizneai-settings');
    let interval: NodeJS.Timeout | null = null;
    
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        if (parsedSettings.backupSettings?.enabled && parsedSettings.backupSettings?.autoBackup) {
          // Simular backup automático cada 30 minutos
          interval = setInterval(simulateAutoBackup, 30 * 60 * 1000);
        }
      } catch (error) {
        console.error('Error al parsear configuración:', error);
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  useEffect(() => {
    if (!isSetupComplete) return;
    setScreenLocked(shouldShowScreenLockOnStartup());
  }, [isSetupComplete]);

  /** Al guardar roles/PIN o cambiar el interruptor de bloqueo, volver a evaluar si debe mostrarse el lock */
  useEffect(() => {
    if (!isSetupComplete) return;
    const syncLockFromStorage = () => {
      setScreenLocked(shouldShowScreenLockOnStartup());
    };
    window.addEventListener('bizneai-roles-updated', syncLockFromStorage);
    window.addEventListener('bizneai-screen-lock-settings-changed', syncLockFromStorage);
    window.addEventListener('storage', syncLockFromStorage);
    return () => {
      window.removeEventListener('bizneai-roles-updated', syncLockFromStorage);
      window.removeEventListener('bizneai-screen-lock-settings-changed', syncLockFromStorage);
      window.removeEventListener('storage', syncLockFromStorage);
    };
  }, [isSetupComplete]);

  useEffect(() => {
    const onForceLock = () => {
      lockSession();
      if (isScreenLockEnabled() && hasScreenLockPinsConfigured()) {
        setScreenLocked(true);
      }
    };
    window.addEventListener('bizneai-force-screen-lock', onForceLock);
    return () => window.removeEventListener('bizneai-force-screen-lock', onForceLock);
  }, []);

  // Si la configuración no está completa, mostrar la pantalla de configuración
  if (!isSetupComplete) {
    return (
      <div className="pos-container">
        <Settings isSetupMode={true} onSetupComplete={() => setIsSetupComplete(true)} />
      </div>
    );
  }

  if (screenLocked) {
    return (
      <div className="pos-container">
        <ScreenLock
          onUnlock={() => {
            setScreenLocked(false);
          }}
        />
      </div>
    );
  }

  // Filtrar productos por categoría y búsqueda
  const filteredProducts = products
    .filter(product => {
      const matchesCategory = selectedCategory === 'Todos' || 
                            product.category === selectedCategory ||
                            (product.category && product.category.toLowerCase() === selectedCategory.toLowerCase());
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.barcode && product.barcode.includes(searchTerm));
      return matchesCategory && matchesSearch;
    })
    // Ordenar por cantidad de pedidos (más pedidos primero)
    .sort((a, b) => {
      const countA = productOrderCounts[a.id] || 0;
      const countB = productOrderCounts[b.id] || 0;
      // Orden descendente: más pedidos primero
      return countB - countA;
    });

  // Crear item del carrito con estructura completa (variantes, modificadores, notas)
  const createCartItem = (
    product: Product,
    quantity: number = 1,
    weight?: number,
    variants?: SelectedVariants,
    notes?: string
  ): CartItem => {
    const unitPrice = variants && product.hasVariants
      ? calculateProductPrice(product, variants)
      : product.price;
    const finalQuantity = product.isWeightBased && weight ? weight : quantity;
    const itemTotal = unitPrice * finalQuantity;
    const variantDisplayName = variants && product.variantGroups?.length
      ? buildVariantDisplayName(product.name, product.variantGroups, variants)
      : undefined;

    return {
      id: `${product.id}-${Date.now()}-${Math.random()}`,
      product,
      quantity: product.isWeightBased ? 1 : quantity,
      weight: product.isWeightBased ? weight || 1 : undefined,
      selectedVariants: variants,
      variantDisplayName,
      unitPrice,
      itemTotal,
      notes
    };
  };

  // Incrementar contador de pedidos para un producto
  const incrementProductOrderCount = (productId: number) => {
    setProductOrderCounts(prevCounts => ({
      ...prevCounts,
      [productId]: (prevCounts[productId] || 0) + 1
    }));
  };

  // Toast con acción para ir a inventario cuando hay stock insuficiente
  const showStockInsufficientToast = (available: number, unit = '', product?: Product) => {
    toast(
      (t) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span>Stock insuficiente. Disponible: {available}{unit}</span>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              openInventoryForRestock(product);
            }}
            style={{
              padding: '0.35rem 0.75rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            Ir a inventario
          </button>
        </span>
      ),
      { duration: 6000 }
    );
  };

  // Agregar producto al carrito (con variantes y notas por línea)
  const addToCart = (
    product: Product,
    quantity: number = 1,
    weight?: number,
    variants?: SelectedVariants,
    notes?: string
  ) => {
    // Validar inventario
    if (!product.isWeightBased && quantity > product.stock) {
      showStockInsufficientToast(product.stock, '', product);
      return;
    }
    
    // Incrementar contador de pedidos cada vez que se agrega al carrito
    incrementProductOrderCount(product.id);
    
    setCart(prevCart => {
      // Buscar si ya existe un item con el mismo producto y variantes (normalizar id para string/number)
      const productIdStr = String(product.id);
      const existingItem = prevCart.find(item => {
        if (String(item.product.id) !== productIdStr) return false;
        if (product.hasVariants && variants) {
          // Comparar variantes
          const itemVariants = JSON.stringify(item.selectedVariants || {});
          const newVariants = JSON.stringify(variants);
          return itemVariants === newVariants;
        }
        return !product.hasVariants;
      });
      
      if (existingItem) {
        // Actualizar cantidad existente
        return prevCart.map(item => {
          if (item.id === existingItem.id) {
            const newQuantity = product.isWeightBased 
              ? (item.weight || 0) + (weight || 0)
              : item.quantity + quantity;
            
            if (!product.isWeightBased && newQuantity > product.stock) {
              showStockInsufficientToast(product.stock, '', product);
              return item;
            }
            
            const finalQuantity = product.isWeightBased ? newQuantity : newQuantity;
            const itemTotal = item.unitPrice * finalQuantity;
            
            return {
              ...item,
              quantity: product.isWeightBased ? 1 : newQuantity,
              weight: product.isWeightBased ? newQuantity : item.weight,
              itemTotal
            };
          }
          return item;
        });
      } else {
        // Agregar nuevo item
        const newItem = createCartItem(product, quantity, weight, variants, notes);
        return [...prevCart, newItem];
      }
    });
  };

  const handleRecoverSaleFromReports = (payload: RecoveredSalePayload) => {
    setIsReportsOpen(false);
    setActiveSection('pos');
    setCustomerInfo(payload.customerName ? { name: payload.customerName } : {});
    setOrderNotes(payload.notes || '');
    setLastSaleData({
      saleId: payload.displaySaleId,
      paymentMethod: payload.paymentMethod,
      change: undefined,
      customerInfo: payload.customerName
        ? { name: payload.customerName, email: '', phone: '' }
        : undefined,
    });

    setCart(() => {
      const next: CartItem[] = [];
      for (const line of payload.items) {
        const match = products.find(
          (p) =>
            String(p.id) === String(line.productId) ||
            p.name.trim().toLowerCase() === line.name.trim().toLowerCase()
        );
        const product: Product =
          match ??
          ({
            id:
              typeof line.productId === 'number'
                ? line.productId
                : Number(String(line.productId).replace(/\D/g, '')) ||
                  Math.floor(Math.random() * 900000) + 100000,
            name: line.name,
            price: line.unitPrice,
            category: line.category || 'General',
            stock: 9999,
          } as Product);
        next.push(createCartItem(product, line.quantity));
      }
      return next;
    });
    toast.success('Venta cargada en el carrito. Puedes editar y cobrar de nuevo.');
  };

  // Buscar producto por código de barras
  const handleBarcodeScan = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
      setSearchTerm(barcode); // Mostrar el código en la búsqueda
    } else {
      alert(`Producto con código ${barcode} no encontrado`);
    }
  };

  // Actualizar notas de un ítem del carrito
  const updateCartItemNotes = (itemId: string, notes: string) => {
    setCart(prev => prev.map(item =>
      item.id === itemId ? { ...item, notes: notes.trim() || undefined } : item
    ));
  };

  // Actualizar cantidad en el carrito (nuevo formato)
  const updateCartQuantity = (itemId: string, newQuantity: number, weight?: number) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === itemId) {
          const product = item.product;
          const quantity = product.isWeightBased ? 1 : newQuantity;
          const finalWeight = product.isWeightBased ? (weight || newQuantity) : item.weight;
          
          if (!product.isWeightBased && newQuantity > product.stock) {
            showStockInsufficientToast(product.stock, '', product);
            return item;
          }
          
          if (product.isWeightBased && finalWeight && finalWeight > product.stock) {
            showStockInsufficientToast(product.stock, 'kg', product);
            return item;
          }
          
          const finalQuantity = product.isWeightBased ? finalWeight || 0 : quantity;
          const itemTotal = item.unitPrice * finalQuantity;
          
          return {
            ...item,
            quantity,
            weight: finalWeight,
            itemTotal
          };
        }
        return item;
      })
    );
  };

  // Remover producto del carrito (nuevo formato)
  const removeCartItem = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    toast.success('Producto removido del carrito');
  };

  // Limpiar carrito
  const clearCart = () => {
    setCart([]);
    setCustomerInfo({});
    setOrderNotes('');
    localStorage.removeItem('bizneai-cart');
    localStorage.removeItem('bizneai-cart-customer');
    localStorage.removeItem('bizneai-cart-notes');
    toast.success('Carrito limpiado');
  };

  // Enviar carrito a cocina (solo tiendas restaurante/café con cocina activa)
  const handleAddCartToKitchen = () => {
    if (!getKitchenModuleVisibility()) {
      toast.error('Cocina no disponible para este tipo de tienda');
      return;
    }
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    const orderId = `kitchen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const items = cart.map(item => ({
      product: {
        id: item.product.id.toString(),
        name: item.variantDisplayName || item.product.name,
        price: item.unitPrice,
        category: item.product.category,
        isWeightBased: item.product.isWeightBased
      },
      quantity: item.product.isWeightBased ? (item.weight || 0) : item.quantity,
      weight: item.weight,
      notes: item.notes
    }));
    const total = cart.reduce((sum, item) => sum + item.itemTotal, 0);
    const kitchenOrder = {
      _id: orderId,
      orderId: `ORD-${orderId.slice(-6)}`,
      customerName: customerInfo.name || 'Cliente',
      waiterName: customerInfo.waiterName,
      tableNumber: customerInfo.tableNumber,
      items,
      total,
      status: 'pending' as const,
      priority: 'normal' as const,
      timestamp: new Date().toISOString(),
      notes: orderNotes || undefined,
      specialInstructions: orderNotes || undefined,
      source: 'pos' as const
    };
    const saved = localStorage.getItem('bizneai-kitchen-orders');
    const orders = saved ? JSON.parse(saved) : [];
    orders.unshift(kitchenOrder);
    localStorage.setItem('bizneai-kitchen-orders', JSON.stringify(orders));
    scheduleMirrorKeyToSqlite('bizneai-kitchen-orders');
    window.dispatchEvent(new CustomEvent('kitchen-updated'));
    clearCart();
    setActiveSection('kitchen');
    toast.success('Orden enviada a cocina');
  };

  // Agregar carrito al waitlist
  const handleAddCartToWaitlist = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    // Obtener shopId desde localStorage
    const storeId = localStorage.getItem('bizneai-store-identifiers');
    let shopId = 'local-shop';
    
    if (storeId) {
      try {
        const parsed = JSON.parse(storeId);
        shopId = parsed._id || 'local-shop';
      } catch (error) {
        console.error('Error parsing store identifiers:', error);
      }
    }

    setIsProcessing(true);

    try {
      const items = cart.map(item => ({
        product: {
          id: item.product.id.toString(),
          name: item.product.name,
          price: item.product.price,
          category: item.product.category
        },
        quantity: item.product.isWeightBased ? (item.weight || 0) : item.quantity
      }));

      const total = cart.reduce((sum, item) => sum + item.itemTotal, 0);
      const customerName = customerInfo.name || 'Cliente';

      const waitlistEntry = {
        _id: `waitlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        shopId: shopId,
        name: customerName,
        items,
        total,
        source: 'local' as const,
        status: 'waiting' as const,
        notes: orderNotes || undefined,
        customerInfo: customerInfo.name ? customerInfo : undefined,
        timestamp: new Date().toISOString()
      };

      // Intentar guardar en servidor
      try {
        await waitlistAPI.addToShopWaitlist(shopId, {
          name: customerName,
          items,
          total,
          source: 'local',
          notes: orderNotes || undefined,
          customerInfo: customerInfo && customerInfo.name ? {
            name: customerInfo.name,
            phone: customerInfo.phone,
            email: customerInfo.email
          } : { name: customerName }
        });
      } catch (error) {
        console.error('Error saving to server, using local storage:', error);
      }

      // Guardar en localStorage
      const savedWaitlist = localStorage.getItem('bizneai-waitlist');
      const waitlistEntries = savedWaitlist ? JSON.parse(savedWaitlist) : [];
      waitlistEntries.unshift(waitlistEntry);
      localStorage.setItem('bizneai-waitlist', JSON.stringify(waitlistEntries));
      scheduleMirrorKeyToSqlite('bizneai-waitlist');

      // Disparar evento personalizado para actualizar waitlist
      window.dispatchEvent(new CustomEvent('waitlist-updated'));

      toast.success('Carrito agregado a la lista de espera');
      
      // Limpiar carrito
      clearCart();
      
      // Abrir waitlist para ver las tarjetas
      setIsWaitlistOpen(true);
      setActiveSection('waitlist');
    } catch (error) {
      toast.error('Error al agregar a la lista de espera');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Procesar venta
  const processSale = () => {
    if (cart.length === 0) return;
    setIsCheckoutOpen(true);
  };

  // Manejar completar checkout (crea venta en API según Sales Sync Model)
  const handleCheckoutComplete = async (paymentMethod: string, amount: number, change?: number) => {
    const saleId = `TKT-${Math.floor(Math.random() * 100000) + 10000}`;
    const { subtotalExclTax, taxAmount } = computeCartTaxBreakdownFromCartItems(
      cart.map((item) => ({ itemTotal: item.itemTotal, product: item.product })),
      loadTaxSettings()
    );
    const subtotal = subtotalExclTax;
    const tax = taxAmount;
    const discount = 0;

    setLastSaleData({
      saleId,
      paymentMethod,
      change,
      customerInfo: customerInfo?.name || customerInfo?.email || customerInfo?.phone
        ? { name: customerInfo.name || '', email: customerInfo.email || '', phone: customerInfo.phone || '' }
        : { name: 'Cliente General', email: 'cliente@email.com', phone: '+52 55 0000 0000' }
    });

    const apiPayload = {
      customerName: customerInfo?.name || 'Cliente General',
      customerPhone: customerInfo?.phone,
      customerEmail: customerInfo?.email,
      tableNumber: customerInfo?.tableNumber,
      waiterName: customerInfo?.waiterName,
      items: cart.map((item) => {
        const qty = item.product.isWeightBased ? (item.weight ?? item.quantity) : item.quantity;
        const quantity = Number.isInteger(qty) ? qty : Math.max(1, Math.round(Number(qty)));
        return {
          productId: String(item.product.id),
          productName: item.variantDisplayName || item.product.name,
          quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.itemTotal,
          category: (item.product.category || '').trim() || 'General',
        };
      }),
      subtotal,
      tax,
      discount,
      total: amount,
      paymentMethod,
      orderType: 'dine-in' as const,
      source: 'local' as const,
      notes: orderNotes || undefined,
    };

    console.log('[SALE] handleCheckoutComplete → createSale', { saleId, amount, items: apiPayload.items?.length });
    const result = await createSale(apiPayload);
    console.log('[SALE] handleCheckoutComplete ← createSale', { success: result.success, error: result.error });

    const resultData = result.data as Record<string, unknown> | undefined;
    const nestedData =
      resultData && typeof resultData === 'object' && 'data' in resultData && resultData.data != null
        ? (resultData.data as Record<string, unknown>)
        : undefined;
    const remoteTransactionId =
      (typeof resultData?.transactionId === 'string' && resultData.transactionId) ||
      (nestedData && typeof nestedData.transactionId === 'string' ? nestedData.transactionId : undefined) ||
      saleId;
    const remoteClientEventId =
      (typeof resultData?.clientEventId === 'string' && resultData.clientEventId) ||
      (nestedData && typeof nestedData.clientEventId === 'string' ? nestedData.clientEventId : undefined);

    recordSaleCashier({
      transactionId: remoteTransactionId,
      clientEventId: remoteClientEventId,
      total: amount,
      paymentMethod,
      itemsSummary: apiPayload.items.map((i) => `${i.productName} x${i.quantity}`).join(', '),
      identity: getScreenLockIdentity(),
    });

    // Registrar en Merkle Tree (historial inmutable local)
    try {
      await recordSaleCreation({
        saleId,
        transactionId: saleId,
        customerName: apiPayload.customerName,
        items: apiPayload.items,
        subtotal: apiPayload.subtotal,
        tax: apiPayload.tax,
        discount: apiPayload.discount,
        total: apiPayload.total,
        paymentMethod: apiPayload.paymentMethod,
        paymentStatus: 'completed',
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        notes: apiPayload.notes,
      });
    } catch (merkleErr) {
      console.warn('[SALE] Merkle recordSaleCreation:', merkleErr);
    }

    if (result.success) {
      toast.success(`Venta #${saleId} completada por $${amount.toFixed(2)} (sincronizada)`);
    } else {
      toast.success(`Venta #${saleId} completada por $${amount.toFixed(2)}`);
      if (result.error) {
        console.warn('[SALE] Venta guardada localmente, sync pendiente:', result.error);
      }
    }

    if (customerInfo.customerId != null) {
      recordPurchaseForCustomer(customerInfo.customerId, amount);
    }

    // Ticket: primero térmica directa (PosPrinter); si falla o timeout → cuadro del sistema (PDF / otra impresora)
    try {
      const storeName = (() => {
        try {
          const sc = localStorage.getItem('bizneai-store-config');
          const sr = localStorage.getItem('bizneai-server-config');
          const store = sc ? JSON.parse(sc) : null;
          const server = sr ? JSON.parse(sr) : null;
          return store?.storeName || store?.businessName || server?.storeName || undefined;
        } catch { return undefined; }
      })();
      const printResult = await printReceiptThermalOrDialog({
        storeName,
        saleId,
        ticketKind: 'sale',
        date: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
        items: apiPayload.items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice ?? i.unitPrice * i.quantity,
        })),
        subtotal,
        tax,
        total: amount,
        paymentMethod,
      });
      if (!printResult.success && printResult.error && isElectron()) {
        setPrintErrorModal({ message: printResult.error });
      }
    } catch (e) {
      if (isElectron()) {
        const errMsg = e instanceof Error ? e.message : String(e);
        setPrintErrorModal({ message: errMsg || 'Error desconocido al imprimir' });
      }
    }

    clearCart();
    setSearchTerm('');
  };

  const handlePrintProductCatalog = async () => {
    if (filteredProducts.length === 0) {
      toast.error('No hay productos para imprimir');
      return;
    }
    setIsPrintingCatalog(true);
    try {
      const lines = filteredProducts.map((p) => ({ name: p.name, price: p.price }));
      const result = await printProductCatalog(lines);
      if (result.success) {
        toast.success(isElectron() ? 'Lista enviada a la impresora' : 'Ventana de impresión abierta');
      } else {
        toast.error(result.error || 'No se pudo imprimir');
        if (result.error && isElectron()) {
          setPrintErrorModal({ message: result.error });
        }
      }
    } finally {
      setIsPrintingCatalog(false);
    }
  };

  // Mostrar ticket virtual
  const showVirtualTicket = () => {
    if (cart.length === 0 && !lastSaleData) {
      alert('No hay productos en el carrito ni venta reciente para generar ticket');
      return;
    }
    setIsVirtualTicketOpen(true);
  };

  // Redirigir a inventario para agregar stock rápido (desde POS cuando hay stock insuficiente)
  const openInventoryForRestock = (product?: Product) => {
    setActiveSection('products');
    setProductManagementInitialView('inventory');
    setProductManagementRestockProduct(product ? { id: product.id, name: product.name } : null);
    setIsProductManagementOpen(true);
  };

  const handleSectionChange = (section: 'pos' | 'cart' | 'products' | 'reports' | 'customers' | 'waitlist' | 'taxes' | 'kitchen' | 'chat' | 'coming-soon' | 'settings') => {
    if (section === 'kitchen' && !getKitchenModuleVisibility()) {
      return;
    }
    setActiveSection(section);
    if (section !== 'products') {
      setIsProductManagementOpen(false);
    }
    if (section === 'reports') {
      setIsReportsOpen(true);
    } else if (section === 'products') {
      setProductManagementInitialView(null);
      setProductManagementRestockProduct(null);
      setIsProductManagementOpen(true);
    } else if (section === 'customers') {
      setIsCustomerManagementOpen(true);
    } else if (section === 'cart') {
      // Unificar con POS: Carrito navega a la misma vista que Punto de venta
      setActiveSection('pos');
    } else if (section === 'waitlist') {
      setIsWaitlistOpen(true);
    } else if (section === 'taxes') {
      setIsTaxesOpen(true);
    } else if (section === 'kitchen') {
      // Kitchen se renderiza directamente en el contenido, no como modal
      // Solo actualizar activeSection
    }
  };

  const handleProductCreated = (product: { name: string; id?: string; price?: number; description?: string }) => {
    // Refresh products list or add to current list
    toast.success(`Product "${product.name}" created successfully!`);
    // You can add logic here to refresh the products list
  };

  // Handler para cargar orden de cocina al carrito y cobrar
  const handleLoadKitchenOrderToCart = (order: {
    _id: string;
    customerName: string;
    waiterName?: string;
    tableNumber?: string;
    items: Array<{
      product: { id: string; name: string; price: number; isWeightBased?: boolean };
      quantity: number;
      weight?: number;
      notes?: string;
    }>;
    notes?: string;
  }) => {
    if (!order.items || order.items.length === 0) {
      toast.error('Esta orden no tiene items');
      return;
    }
    setCart([]);
    order.items.forEach((item) => {
      const product = products.find(
        (p) =>
          p.id.toString() === item.product.id?.toString() ||
          p.name === item.product.name
      );
      if (product) {
        addToCart(
          product,
          item.quantity || 1,
          item.weight,
          undefined,
          item.notes
        );
      } else {
        const syntheticProduct: Product = {
          id: Number(item.product.id) || 900000 + order.items.indexOf(item),
          name: item.product.name,
          price: item.product.price,
          category: (item.product as { category?: string }).category || 'General',
          stock: 999,
          isWeightBased: item.product.isWeightBased,
        };
        addToCart(
          syntheticProduct,
          item.quantity || 1,
          item.weight,
          undefined,
          item.notes
        );
      }
    });
    setCustomerInfo({
      name: order.customerName,
      waiterName: order.waiterName,
      tableNumber: order.tableNumber,
    });
    if (order.notes) setOrderNotes(order.notes);
    setActiveSection('pos');
    if (isKitchenOpen) setIsKitchenOpen(false);
    toast.success(`Orden cargada al carrito (${order.items.length} items)`);
  };

  interface WaitlistCartProduct {
    id?: string | number;
    name: string;
    price?: number;
    variants?: SelectedVariants;
    category?: string;
  }
  interface WaitlistCartItem {
    product: WaitlistCartProduct;
    quantity?: number;
    weight?: number;
    selectedVariants?: SelectedVariants;
    notes?: string;
  }
  interface WaitlistEntryForCart {
    name?: string;
    items: WaitlistCartItem[];
    customerInfo?: { name?: string; phone?: string; email?: string };
    notes?: string;
  }

  // Handler para cargar waitlist al carrito
  const handleLoadWaitlistToCart = (entry: WaitlistEntryForCart) => {
    if (!entry.items || entry.items.length === 0) {
      toast.error('Esta entrada no tiene items para cargar al carrito');
      return;
    }

    // Limpiar el carrito actual antes de cargar la nueva orden
    setCart([]);
    
    // Cargar cada item al carrito
    entry.items.forEach((item) => {
      // Buscar el producto por ID o nombre
      const product = products.find(
        p => p.id.toString() === item.product.id?.toString() || 
             p.name === item.product.name
      );
      
      if (product) {
        // Agregar el producto con la cantidad del item
        addToCart(
          product, 
          item.quantity || 1,
          item.weight, // Si es producto por peso
          item.selectedVariants ?? item.product.variants // Variantes si existen
        );
      } else {
        // Si no se encuentra el producto, crear uno temporal
        console.warn('Producto no encontrado:', item.product.name);
        toast(`Producto "${item.product.name}" no encontrado en el catálogo`, { icon: '⚠️' });
      }
    });
    
    // Cargar información del cliente si existe
    if (entry.customerInfo) {
      setCustomerInfo({
        name: entry.customerInfo.name || entry.name,
        phone: entry.customerInfo.phone,
        email: entry.customerInfo.email
      });
    } else if (entry.name) {
      // Si no hay customerInfo pero hay name, usarlo
      setCustomerInfo({ name: entry.name });
    }
    
    // Cargar notas de la orden si existen
    if (entry.notes) {
      setOrderNotes(entry.notes);
    }
    
    // Cerrar waitlist y navegar al POS con el carrito cargado
    setIsWaitlistOpen(false);
    setActiveSection('pos');
    
    toast.success(`Orden de ${entry.name || 'cliente'} cargada al carrito (${entry.items.length} items)`);
  };

  // Componente interno para usar el hook useStore
  const AppContent = () => {
    const { storeIdentifiers, setStoreIdentifiers } = useStore();
    const [configSettingsUnlocked, setConfigSettingsUnlocked] = useState(() => isConfigurationAccessUnlocked());

    useEffect(() => {
      const onRevoked = () => setConfigSettingsUnlocked(false);
      window.addEventListener('bizneai-config-access-revoked', onRevoked);
      return () => window.removeEventListener('bizneai-config-access-revoked', onRevoked);
    }, []);
    /** Cocina: solo restaurante/cafetería y flag kitchenEnabled (MCP / Configuración). */
    const showKitchenModule = getKitchenModuleVisibility(storeIdentifiers.storeType);

    useEffect(() => {
      if (activeSection === 'kitchen' && !showKitchenModule) {
        setActiveSection('pos');
      }
    }, [activeSection, showKitchenModule, storeConfigVersion]);
    let configuredStoreName = '';
    try {
      const storeConfigRaw = localStorage.getItem('bizneai-store-config');
      const serverConfigRaw = localStorage.getItem('bizneai-server-config');
      const storeConfig = storeConfigRaw ? JSON.parse(storeConfigRaw) : null;
      const serverConfig = serverConfigRaw ? JSON.parse(serverConfigRaw) : null;
      configuredStoreName =
        storeConfig?.storeName ||
        storeConfig?.businessName ||
        serverConfig?.storeName ||
        '';
    } catch {
      configuredStoreName = '';
    }

    const [resolvedStoreName, setResolvedStoreName] = useState<string>(
      storeIdentifiers.storeName || configuredStoreName || 'Tienda'
    );

    useEffect(() => {
      setResolvedStoreName(storeIdentifiers.storeName || configuredStoreName || 'Tienda');
    }, [storeIdentifiers.storeName, configuredStoreName]);

    useEffect(() => {
      const loadNameFromMcp = async () => {
        if (storeIdentifiers.storeName) return;

        const mcpUrl = getConfiguredMcpUrl();
        if (mcpUrl) {
          try {
            const response = await fetch(mcpUrl);
            if (response.ok) {
              const payload = await response.json();
              const fetchedStoreName = payload?.data?.shop?.storeName || payload?.shop?.storeName;
              if (fetchedStoreName) {
                setResolvedStoreName(fetchedStoreName);
                setStoreIdentifiers({ storeName: fetchedStoreName });
                return;
              }
            }
          } catch {
            // fallback below
          }
        }

        const shopData = await getShopDataFromMcp();
        const fetchedStoreName = shopData?.shop?.storeName;
        if (fetchedStoreName) {
          setResolvedStoreName(fetchedStoreName);
          setStoreIdentifiers({ storeName: fetchedStoreName });
        }
      };

      loadNameFromMcp();
    }, [storeIdentifiers.storeName, setStoreIdentifiers]);
    
    const toggleSidebarMinimal = () => {
      setSidebarMinimal(prev => {
        const next = !prev;
        localStorage.setItem('bizneai-sidebar-minimal', String(next));
        scheduleMirrorKeyToSqlite('bizneai-sidebar-minimal');
        return next;
      });
    };

    const handleLockScreen = () => {
      lockSession();
      setScreenLocked(true);
    };

    const sessionLockLabel = (() => {
      const id = getScreenLockIdentity();
      if (!id) return null;
      if (id.source === 'legacy') return 'Código de seguridad';
      if (id.source === 'super') return 'Superusuario';
      const name = (id.name || '').trim();
      const role = (id.role || '').trim();
      if (name && role) return `${name} (${role})`;
      if (name) return name;
      if (role) return role;
      const em = (id.email || '').trim();
      return em || null;
    })();

    return (
      <div className="pos-container">
        {/* Sidebar - click en nombre del shop para minimizar/mostrar iconos */}
        <div className={`pos-sidebar ${sidebarMinimal ? 'pos-sidebar-minimal' : ''}`}>
          {/* Logo / Tienda - click para toggle minimal/expandir (div para compatibilidad file:// en Electron) */}
          <div className={`sidebar-section ${sidebarMinimal ? 'sidebar-section-minimal' : ''} sidebar-shop-toggle`}>
            <div
              role="button"
              tabIndex={0}
              className={`sidebar-item ${sidebarMinimal ? 'sidebar-item-icon-only' : 'sidebar-item-shop'} sidebar-item-clickable sidebar-toggle-btn`}
              onClick={toggleSidebarMinimal}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSidebarMinimal(); } }}
              title={sidebarMinimal ? `${resolvedStoreName} (clic para expandir)` : `${resolvedStoreName} (clic para minimizar)`}
              aria-label={sidebarMinimal ? 'Expandir menú' : 'Minimizar menú'}
            >
              <Store size={sidebarMinimal ? 22 : 20} />
              {!sidebarMinimal && (
                <>
                  <span className="sidebar-shop-name">{resolvedStoreName}</span>
                  <PanelLeftClose size={18} className="sidebar-collapse-icon" aria-hidden />
                </>
              )}
            </div>
          </div>

          {/* Fecha y hora */}
          {sidebarMinimal ? (
            <div className="sidebar-section sidebar-section-minimal sidebar-date-time-minimal">
              <div className="sidebar-item sidebar-item-icon-only" title={new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()}>
                <Clock size={22} />
              </div>
            </div>
          ) : (
            <div className="sidebar-date-time">
              <span className="sidebar-date">{new Date().toLocaleDateString()}</span>
              <span className="sidebar-time">
                <LiveClock />
              </span>
            </div>
          )}

          <div className={`sidebar-section ${sidebarMinimal ? 'sidebar-section-minimal' : ''} sidebar-persistence-section`}>
            <LocalPersistenceStatus sidebarMinimal={sidebarMinimal} />
          </div>

          {/* Bloques Merkle - debajo del reloj */}
          <div className={`sidebar-section ${sidebarMinimal ? 'sidebar-section-minimal' : ''} sidebar-merkle-widget`}>
            <MerkleBlocksWidget
              onOpenSales={() => handleSectionChange('reports')}
              compact={sidebarMinimal}
            />
          </div>

          {/* Punto de venta */}
          <div className={`sidebar-section ${sidebarMinimal ? 'sidebar-section-minimal' : ''}`}>
            <div
              className={`sidebar-item ${sidebarMinimal ? 'sidebar-item-icon-only' : ''} ${activeSection === 'pos' ? 'active' : ''}`}
              onClick={() => handleSectionChange('pos')}
              title="Punto de Venta"
            >
              <ShoppingCart size={sidebarMinimal ? 22 : 20} />
              {!sidebarMinimal && 'Punto de Venta'}
            </div>
          </div>

          {/* Carrito */}
          <div className={`sidebar-section ${sidebarMinimal ? 'sidebar-section-minimal' : ''}`}>
            <div
              className={`sidebar-item ${sidebarMinimal ? 'sidebar-item-icon-only' : ''} ${activeSection === 'pos' ? 'active' : ''}`}
              onClick={() => handleSectionChange('cart')}
              title="Carrito"
            >
              <ShoppingBag size={sidebarMinimal ? 22 : 20} />
              {!sidebarMinimal && 'Carrito'}
            </div>
          </div>

          {/* Productos e inventario */}
          <div className={`sidebar-section ${sidebarMinimal ? 'sidebar-section-minimal' : ''}`}>
            <div
              className={`sidebar-item ${sidebarMinimal ? 'sidebar-item-icon-only' : ''} ${activeSection === 'products' ? 'active' : ''}`}
              onClick={() => handleSectionChange('products')}
              title="Productos e Inventario"
            >
              <Warehouse size={sidebarMinimal ? 22 : 20} />
              {!sidebarMinimal && 'Productos e Inventario'}
            </div>
          </div>

          {/* Ventas */}
          <div className={`sidebar-section ${sidebarMinimal ? 'sidebar-section-minimal' : ''}`}>
            <div
              className={`sidebar-item ${sidebarMinimal ? 'sidebar-item-icon-only' : ''} ${activeSection === 'reports' ? 'active' : ''}`}
              onClick={() => handleSectionChange('reports')}
              title="Ventas"
            >
              <BarChart3 size={sidebarMinimal ? 22 : 20} />
              {!sidebarMinimal && 'Ventas'}
            </div>
          </div>

          {/* Clientes */}
          <div className={`sidebar-section ${sidebarMinimal ? 'sidebar-section-minimal' : ''}`}>
            <div
              className={`sidebar-item ${sidebarMinimal ? 'sidebar-item-icon-only' : ''} ${activeSection === 'customers' ? 'active' : ''}`}
              onClick={() => handleSectionChange('customers')}
              title="Clientes"
            >
              <Users size={sidebarMinimal ? 22 : 20} />
              {!sidebarMinimal && 'Clientes'}
            </div>
          </div>

          {/* Lista de espera */}
          <div className={`sidebar-section ${sidebarMinimal ? 'sidebar-section-minimal' : ''}`}>
            <div
              className={`sidebar-item ${sidebarMinimal ? 'sidebar-item-icon-only' : ''} ${activeSection === 'waitlist' ? 'active' : ''}`}
              onClick={() => handleSectionChange('waitlist')}
              title="Lista de Espera"
            >
              <Clock size={sidebarMinimal ? 22 : 20} />
              {!sidebarMinimal && 'Lista de Espera'}
            </div>
          </div>

          {/* Impuestos */}
          <div className={`sidebar-section ${sidebarMinimal ? 'sidebar-section-minimal' : ''}`}>
            <div
              className={`sidebar-item ${sidebarMinimal ? 'sidebar-item-icon-only' : ''} ${activeSection === 'taxes' ? 'active' : ''}`}
              onClick={() => handleSectionChange('taxes')}
              title="Impuestos"
            >
              <ReceiptText size={sidebarMinimal ? 22 : 20} />
              {!sidebarMinimal && 'Impuestos'}
            </div>
          </div>

          {/* Cocina */}
          {showKitchenModule && (
            <div className={`sidebar-section ${sidebarMinimal ? 'sidebar-section-minimal' : ''}`}>
              <div
                className={`sidebar-item ${sidebarMinimal ? 'sidebar-item-icon-only' : ''} ${activeSection === 'kitchen' ? 'active' : ''}`}
                onClick={() => handleSectionChange('kitchen')}
                title="Cocina"
              >
                <ChefHat size={sidebarMinimal ? 22 : 20} />
                {!sidebarMinimal && 'Cocina'}
              </div>
            </div>
          )}

          {/* BizneAI Chat */}
          <div className={`sidebar-section ${sidebarMinimal ? 'sidebar-section-minimal' : ''}`}>
            <div
              className={`sidebar-item ${sidebarMinimal ? 'sidebar-item-icon-only' : ''} ${activeSection === 'chat' ? 'active' : ''}`}
              onClick={() => handleSectionChange('chat')}
              title="BizneAI Chat"
            >
              <MessageSquare size={sidebarMinimal ? 22 : 20} />
              {!sidebarMinimal && 'BizneAI Chat'}
            </div>
          </div>

          {/* Próximamente */}
          <div className={`sidebar-section ${sidebarMinimal ? 'sidebar-section-minimal' : ''}`}>
            <div
              className={`sidebar-item ${sidebarMinimal ? 'sidebar-item-icon-only' : ''} ${activeSection === 'coming-soon' ? 'active' : ''}`}
              onClick={() => {
                handleSectionChange('coming-soon');
                setIsComingSoonOpen(true);
              }}
              title="Próximamente"
            >
              <Calendar size={sidebarMinimal ? 22 : 20} />
              {!sidebarMinimal && 'Próximamente'}
            </div>
          </div>

          <div className={`sidebar-section ${sidebarMinimal ? 'sidebar-section-minimal' : ''}`}>
            {isScreenLockEnabled() && hasScreenLockPinsConfigured() ? (
              <div
                className={`sidebar-item ${sidebarMinimal ? 'sidebar-item-icon-only' : ''}`}
                onClick={handleLockScreen}
                title="Bloquear pantalla"
                role="button"
              >
                <Lock size={sidebarMinimal ? 22 : 20} />
                {!sidebarMinimal && 'Bloquear'}
              </div>
            ) : (
              <div
                className={`sidebar-item ${sidebarMinimal ? 'sidebar-item-icon-only' : ''}`}
                onClick={() => handleSectionChange('settings')}
                title="Configura PIN en Configuración → Roles y bloqueo de pantalla"
                role="button"
              >
                <Lock size={sidebarMinimal ? 22 : 20} />
                {!sidebarMinimal && 'Bloqueo PIN'}
              </div>
            )}
          </div>

          {/* Configuración */}
          <div className={`sidebar-section ${sidebarMinimal ? 'sidebar-section-minimal' : ''}`}>
            <div
              className={`sidebar-item ${sidebarMinimal ? 'sidebar-item-icon-only' : ''} ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => handleSectionChange('settings')}
              title="Configuración"
            >
              <SettingsIcon size={sidebarMinimal ? 22 : 20} />
              {!sidebarMinimal && 'Configuración'}
            </div>
          </div>

          {/* Versión */}
          <div className={`sidebar-section ${sidebarMinimal ? 'sidebar-section-minimal sidebar-spacer' : ''}`}>
            <div className={`sidebar-item ${sidebarMinimal ? 'sidebar-item-icon-only sidebar-version' : 'sidebar-version'} ${sidebarMinimal ? '' : 'sidebar-item-version-full'}`} title={`Versión ${getVersionDisplay()}`}>
              <Info size={sidebarMinimal ? 18 : 16} />
              {!sidebarMinimal && <span style={{ fontSize: '0.75rem', color: 'var(--bs-dark-text-muted)' }}>Versión {getVersionDisplay()}</span>}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="pos-main">
          <div className="pos-main-toolbar" role="toolbar" aria-label="Sesión y bloqueo">
            {isScreenLockEnabled() && hasScreenLockPinsConfigured() ? (
              <>
                <div className="pos-main-toolbar-session">
                  {sessionLockLabel ? (
                    <span className="pos-main-toolbar-session-text" title="Usuario autenticado con PIN en esta sesión">
                      <User size={16} aria-hidden />
                      {sessionLockLabel}
                    </span>
                  ) : (
                    <span className="pos-main-toolbar-session-muted">Inicia sesión con tu PIN al desbloquear</span>
                  )}
                </div>
                <button
                  type="button"
                  className="pos-main-toolbar-lock-btn"
                  onClick={handleLockScreen}
                  title="Bloquear pantalla (requiere PIN para volver a entrar)"
                >
                  <Lock size={18} aria-hidden />
                  <span>Bloquear</span>
                </button>
              </>
            ) : (
              <div className="pos-main-toolbar-hint">
                <Lock size={18} aria-hidden />
                <span className="pos-main-toolbar-hint-text">
                  <strong>Bloqueo de pantalla:</strong> ve a{' '}
                  <button
                    type="button"
                    className="pos-main-toolbar-link"
                    onClick={() => handleSectionChange('settings')}
                  >
                    Configuración
                  </button>
                  , sección <strong>Roles y bloqueo de pantalla</strong>: activa el interruptor, pon un PIN de 4 dígitos y
                  pulsa <strong>Guardar roles y PIN</strong>. También puedes usar el código de 4 dígitos en{' '}
                  <strong>Seguridad</strong> (código de acceso).
                </span>
              </div>
            )}
          </div>
          {/* Content */}
          <div className={`pos-content ${activeSection === 'settings' ? 'settings-active' : ''} ${activeSection === 'chat' ? 'chat-active' : ''} ${['pos', 'cart', 'products', 'reports', 'customers', 'taxes'].includes(activeSection) ? 'pos-content-with-cart' : ''}`}>
            {activeSection === 'settings' ? (
              <div style={{ padding: '1rem' }}>
                {configSettingsUnlocked ? (
                  <Settings />
                ) : (
                  <ConfigurationAccessGate
                    onUnlocked={() => setConfigSettingsUnlocked(true)}
                    onCancel={() => setActiveSection('pos')}
                  />
                )}
              </div>
            ) : activeSection === 'kitchen' && showKitchenModule ? (
              <div className="kitchen-wrapper">
                <Kitchen
                  isOpen={true}
                  onClose={() => {
                    setActiveSection('pos');
                  }}
                  onLoadOrderToCart={handleLoadKitchenOrderToCart}
                />
              </div>
            ) : activeSection === 'chat' ? (
              <div style={{ padding: 0, margin: 0, height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <BizneAIChat isOpen={true} />
              </div>
            ) : activeSection === 'waitlist' || (activeSection === 'kitchen' && !showKitchenModule) ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Calendar size={64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h2 style={{ marginBottom: '0.5rem' }}>Próximamente</h2>
                <p style={{ color: 'var(--bs-dark-text-muted)' }}>
                  Esta funcionalidad estará disponible en una futura actualización.
                </p>
              </div>
            ) : (
              <>
                {/* Products Section */}
                <div className="pos-products">
                  {/* Search and Categories */}
                  <div style={{ padding: '1rem' }}>
                    <div className="search-container">
                      <input
                        type="text"
                        placeholder={t('products.searchPlaceholder')}
                        className="search-bar"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <button
                        className="barcode-btn"
                        onClick={() => setIsBarcodeScannerOpen(true)}
                        title={t('products.scanBarcode')}
                      >
                        <Camera size={20} />
                      </button>
                    </div>
                    <div className="category-tabs">
                      {categories.map(category => (
                        <button
                          key={category}
                          className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                          onClick={() => setSelectedCategory(category)}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Products Grid - According to Gherkin: "I am on the POS screen" */}
                  <div className="product-grid">
                    {filteredProducts.length === 0 ? (
                      <div className="no-products">
                        <Package size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                        <p>{t('products.noProducts')}</p>
                        <small>{t('products.tryAdjusting')}</small>
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className={`product-card ${shouldShowImage(product.image) ? 'product-card--has-image' : ''}`}
                          onClick={() => {
                            if (product.stock === 0) {
                              openInventoryForRestock(product);
                            } else if (product.hasVariants && product.variantGroups?.length) {
                              setProductForVariantModal(product);
                            } else {
                              addToCart(product);
                            }
                          }}
                          title={product.stock === 0 ? t('products.noStockClick') : `${t('products.addToCart')} ${product.name}`}
                        >
                          <div className="product-image">
                            {shouldShowImage(product.image) ? (
                              <>
                                <img
                                  src={product.image!}
                                  alt={product.name}
                                  onError={() => markImageFailed(product.image)}
                                  loading="lazy"
                                />
                                <span className="product-add-overlay" aria-hidden="true">+</span>
                                <div className="product-price-overlay">
                                  ${product.price.toFixed(2)}
                                  {product.hasVariants && product.variantGroups?.length && (
                                    <span className="product-variants-badge" title={t('products.hasVariants')}>+</span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <Package size={32} />
                            )}
                          </div>
                          <div className="product-name">{product.name}</div>
                          {!shouldShowImage(product.image) && (
                            <div className="product-price">
                              ${product.price.toFixed(2)}
                              {product.hasVariants && product.variantGroups?.length && (
                                <span className="product-variants-badge" title={t('products.hasVariants')}>+</span>
                              )}
                            </div>
                          )}
                          {product.stock !== undefined && product.stock < 10 && product.stock > 0 && (
                            <div
                              className="product-stock-warning product-stock-action"
                              onClick={(e) => { e.stopPropagation(); openInventoryForRestock(product); }}
                              title={t('products.addStock')}
                            >
                              {t('products.stockLow')}: {product.stock}
                            </div>
                          )}
                          {product.stock === 0 && (
                            <div
                              className="product-stock-out product-stock-action"
                              onClick={(e) => { e.stopPropagation(); openInventoryForRestock(product); }}
                              title={t('products.addStock')}
                            >
                              {t('products.outOfStock')}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {/* Cart Section - According to Gherkin specs */}
                <div className="pos-cart">
                  <div className="cart-header">
                    <div className="cart-header-left">
                      <ShoppingCart size={20} />
                      <span>{t('cart.title')}</span>
                      {cart.length > 0 && (
                        <span className="cart-count-badge">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                      )}
                    </div>
                  </div>
                  <div className="cart-items">
                    {cart.length === 0 ? (
                      <div className="empty-cart">
                        <div className="empty-cart-icon">🛒</div>
                        <p>{t('cart.empty')}</p>
                        <button className="action-btn" onClick={() => setSearchTerm('')}>
                          {t('cart.startToSell')}
                        </button>
                      </div>
                    ) : (
                      <>
                        {cart.map(item => (
                        <div key={item.id} className="cart-item">
                          <div className="cart-item-info">
                            <div className="cart-item-name">
                              {item.variantDisplayName || item.product.name}
                            </div>
                            <div className="cart-item-notes-row">
                              {item.notes ? (
                                <span className="cart-item-notes" title={item.notes}>📝 {item.notes}</span>
                              ) : (
                                <span className="cart-item-notes-placeholder">{t('cart.noNotes')}</span>
                              )}
                              <button
                                type="button"
                                className="cart-item-notes-edit"
                                onClick={() => {
                                  const newNotes = prompt(t('cart.notesForProduct'), item.notes || '');
                                  if (newNotes !== null) updateCartItemNotes(item.id, newNotes);
                                }}
                                title={t('cart.editNotes')}
                              >
                                <FileText size={12} />
                              </button>
                            </div>
                              <div className="cart-item-details">
                                <span className="cart-item-quantity-label">
                              {item.product.isWeightBased 
                                    ? `${t('cart.weight')}: ${item.weight?.toFixed(2)} kg`
                                    : `${t('cart.quantity')}: ${item.quantity}`
                                  }
                                </span>
                                <span className="cart-item-unit-price">
                                  {t('cart.unitPrice')}: ${item.unitPrice.toFixed(2)}
                                  {item.product.isWeightBased ? '/kg' : ''}
                                </span>
                          </div>
                            </div>
                            <div className="cart-item-right">
                              <div className="cart-item-total">${item.itemTotal.toFixed(2)}</div>
                              <div className="cart-item-controls">
                            <button
                              className="quantity-btn"
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1, item.weight)}
                                  title={t('cart.decreaseQuantity')}
                            >
                                  <Minus size={14} />
                            </button>
                            <span className="quantity-display">
                                  {item.product.isWeightBased ? `${item.weight?.toFixed(2)} kg` : item.quantity}
                            </span>
                            <button
                              className="quantity-btn"
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1, item.weight)}
                                  title={t('cart.increaseQuantity')}
                            >
                                  <Plus size={14} />
                            </button>
                            <button
                                  className="quantity-btn remove-btn"
                              onClick={() => removeCartItem(item.id)}
                                  title={t('cart.removeItem')}
                            >
                                  <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  {cart.length > 0 && (
                    <>
                      {/* Customer Information Section - Collapsible */}
                      <div className="cart-customer-info">
                        <button
                          type="button"
                          className="cart-customer-info-toggle"
                          onClick={() => setCustomerInfoCollapsed(!customerInfoCollapsed)}
                          aria-expanded={!customerInfoCollapsed}
                        >
                          <User size={16} />
                          <span className="cart-section-title">{t('cart.customerInfo')}</span>
                          {customerInfo.name || customerInfo.tableNumber || orderNotes ? (
                            <span className="cart-customer-info-badge">•</span>
                          ) : null}
                          {customerInfoCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                        </button>
                        {!customerInfoCollapsed && (
                          <div className="cart-customer-info-fields">
                            <label className="cart-input-label" htmlFor="cart-customer-select">
                              Cliente del registro
                            </label>
                            <select
                              id="cart-customer-select"
                              className="cart-input"
                              value={customerInfo.customerId != null ? String(customerInfo.customerId) : ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (!v) {
                                  setCustomerInfo({
                                    ...customerInfo,
                                    customerId: undefined,
                                  });
                                  return;
                                }
                                const id = parseInt(v, 10);
                                const c = registryCustomers.find((x) => x.id === id);
                                if (!c) return;
                                setCustomerInfo({
                                  ...customerInfo,
                                  customerId: id,
                                  name: getCustomerFullName(c),
                                  email: c.email,
                                  phone: c.phone,
                                });
                              }}
                            >
                              <option value="">Cliente ocasional (nombre abajo)</option>
                              {registryCustomers.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {getCustomerFullName(c)} — {getCustomerStatusLabel(c.customerStatus)}
                                  {!c.isActive ? ' (inactivo)' : ''}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder={t('cart.customerName')}
                              className="cart-input"
                              value={customerInfo.name || ''}
                              onChange={(e) =>
                                setCustomerInfo({
                                  ...customerInfo,
                                  name: e.target.value,
                                  customerId: undefined,
                                })
                              }
                            />
                            {showKitchenModule && (
                              <input
                                type="text"
                                placeholder="Mesero (opcional)"
                                className="cart-input"
                                value={customerInfo.waiterName || ''}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, waiterName: e.target.value })}
                              />
                            )}
                            <input
                              type="text"
                              placeholder={t('cart.tableNumber')}
                              className="cart-input"
                              value={customerInfo.tableNumber || ''}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, tableNumber: e.target.value })}
                            />
                            <textarea
                              placeholder={t('cart.orderNotes')}
                              className="cart-textarea"
                              value={orderNotes}
                              onChange={(e) => setOrderNotes(e.target.value)}
                              rows={2}
                            />
                          </div>
                        )}
                      </div>
                      {/* Cart Totals */}
                  <div className="cart-total">
                        <div className="cart-total-row">
                          <span>{t('cart.subtotalExclTax')}</span>
                      <span>${cartTax.subtotalExclTax.toFixed(2)}</span>
                    </div>
                        <div className="cart-total-row">
                          <span>{t('cart.taxAmount')}</span>
                      <span>${cartTax.taxAmount.toFixed(2)}</span>
                    </div>
                        <div className="cart-total-row cart-total-final">
                          <span>{t('cart.totalInclTax')}</span>
                      <span className="total-amount">${cartTax.total.toFixed(2)}</span>
                    </div>
                  </div>
                    </>
                  )}
                  <div className="cart-actions">
                    {cart.length > 0 ? (
                      <>
                    <div className="cart-actions-row cart-actions-row-checkout">
                    <button 
                      className="action-btn cart-btn-checkout-main" 
                      onClick={processSale} 
                          title={t('cart.proceedToCheckout')}
                    >
                      <CreditCard size={20} style={{ marginRight: '0.5rem' }} />
                          {t('cart.proceedToCheckout')}
                    </button>
                    <button
                      type="button"
                      className="action-btn action-btn-print-catalog"
                      onClick={handlePrintProductCatalog}
                      disabled={isPrintingCatalog || filteredProducts.length === 0}
                      title="Imprimir lista de productos (respeta búsqueda y categoría)"
                    >
                      {isPrintingCatalog ? (
                        <RefreshCw size={20} className="spinner" />
                      ) : (
                        <Printer size={20} />
                      )}
                      <span className="cart-print-label">Imprimir</span>
                    </button>
                    </div>
                    <button 
                      className="action-btn btn-waitlist" 
                      onClick={handleAddCartToWaitlist}
                          disabled={isProcessing}
                          title={t('cart.addToWaitlist')}
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw size={20} className="spinner" style={{ marginRight: '0.5rem' }} />
                              {t('cart.adding')}
                        </>
                      ) : (
                        <>
                          <Clock size={20} style={{ marginRight: '0.5rem' }} />
                              {t('cart.addToWaitlist')}
                        </>
                      )}
                    </button>
                    {showKitchenModule && (
                      <button 
                        className="action-btn"
                        onClick={handleAddCartToKitchen}
                        title="Enviar a cocina"
                        style={{ background: 'var(--bs-primary)', color: 'white' }}
                      >
                        <ChefHat size={20} style={{ marginRight: '0.5rem' }} />
                        Enviar a Cocina
                      </button>
                    )}
                        <button 
                          className="action-btn secondary" 
                          onClick={() => {
                            if (window.confirm(t('cart.clearCartConfirm'))) {
                              clearCart();
                            }
                          }}
                        >
                      <X size={20} style={{ marginRight: '0.5rem' }} />
                          {t('cart.clearCart')}
                    </button>
                      </>
                    ) : (
                    <div className="cart-actions-row cart-actions-row-empty">
                      <button className="action-btn secondary cart-btn-empty-grow" onClick={showVirtualTicket}>
                        <Receipt size={20} style={{ marginRight: '0.5rem' }} />
                        {t('cart.viewTickets')}
                      </button>
                      <button
                        type="button"
                        className="action-btn action-btn-print-catalog"
                        onClick={handlePrintProductCatalog}
                        disabled={isPrintingCatalog || filteredProducts.length === 0}
                        title="Imprimir lista de productos"
                      >
                        {isPrintingCatalog ? (
                          <RefreshCw size={20} className="spinner" />
                        ) : (
                          <Printer size={20} />
                        )}
                        <span className="cart-print-label">Imprimir</span>
                      </button>
                    </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Barcode Scanner Modal */}
        <BarcodeScanner
          isOpen={isBarcodeScannerOpen}
          onClose={() => setIsBarcodeScannerOpen(false)}
          onScan={handleBarcodeScan}
        />

        {/* Modal de variantes y modificadores (cafetería) */}
        <ProductVariantSelectorModal
          isOpen={!!productForVariantModal}
          onClose={() => setProductForVariantModal(null)}
          product={productForVariantModal}
          onAddToCart={(p, q, w, v, n) => {
            addToCart(p, q, w, v, n);
            setProductForVariantModal(null);
          }}
        />

        {/* Checkout Modal */}
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          total={cartTax.total}
          onComplete={handleCheckoutComplete}
        />

        {/* Modal Error de Impresión */}
        {printErrorModal && (
          <div className="modal-overlay" onClick={() => setPrintErrorModal(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Error al imprimir ticket</h3>
                <button className="close-btn" onClick={() => setPrintErrorModal(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <p style={{ color: 'var(--bs-danger, #dc3545)', marginBottom: '0.5rem' }}>
                  No se pudo imprimir el ticket.
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--bs-dark-text-muted)' }}>
                  {printErrorModal.message}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--bs-dark-text-muted)', marginTop: '1rem' }}>
                  Si la térmica falla, debería abrirse una ventana con el ticket y el cuadro de impresión del sistema (puedes elegir <strong>Guardar como PDF</strong> u otra impresora). Comprueba que no estén bloqueadas las ventanas emergentes. También puedes revisar Configuración → Impresora de Tickets.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn-primary" onClick={() => setPrintErrorModal(null)}>
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sales Reports Modal */}
        <SalesReports
          isOpen={isReportsOpen}
          onClose={() => setIsReportsOpen(false)}
          onRecoverSaleToCart={handleRecoverSaleFromReports}
        />

        {/* Product Management Modal - solo visible en sección Productos e Inventario */}
        {activeSection === 'products' && (
          <ProductManagement
            isOpen={isProductManagementOpen}
            onClose={() => {
              setIsProductManagementOpen(false);
              setProductManagementInitialView(null);
              setProductManagementRestockProduct(null);
              setActiveSection('pos');
            }}
            initialView={productManagementInitialView ?? undefined}
            restockProduct={productManagementRestockProduct}
            onRestockComplete={
              productManagementRestockProduct
                ? (productToAdd) => {
                    setIsProductManagementOpen(false);
                    setProductManagementInitialView(null);
                    setProductManagementRestockProduct(null);
                    setActiveSection('pos');
                    if (productToAdd) {
                      addToCart(productToAdd as Product, 1);
                    }
                  }
                : undefined
            }
          />
        )}

        {/* Customer Management Modal */}
        <CustomerManagement
          isOpen={isCustomerManagementOpen}
          onClose={() => setIsCustomerManagementOpen(false)}
        />

        {/* Waitlist Modal */}
        {isWaitlistOpen && (
          <Waitlist
            isOpen={isWaitlistOpen}
            onClose={() => {
              setIsWaitlistOpen(false);
              setActiveSection('pos');
            }}
            onLoadToCart={handleLoadWaitlistToCart}
          />
        )}

        {/* Taxes Modal */}
        {isTaxesOpen && (
          <Taxes
            isOpen={isTaxesOpen}
            onClose={() => {
              setIsTaxesOpen(false);
              setActiveSection('pos');
            }}
          />
        )}

        {/* Kitchen Modal - Only show for restaurant or coffee shop */}
        {isKitchenOpen && showKitchenModule && (
          <Kitchen
            isOpen={isKitchenOpen}
            onClose={() => {
              setIsKitchenOpen(false);
              setActiveSection('pos');
            }}
            onLoadOrderToCart={handleLoadKitchenOrderToCart}
          />
        )}

        {/* Virtual Ticket Modal */}
        <VirtualTicket
          isOpen={isVirtualTicketOpen}
          onClose={() => setIsVirtualTicketOpen(false)}
          cart={cart.length > 0 ? cart : (lastSaleData ? [] : [])}
          total={cart.length > 0 ? cart.reduce((sum, item) => sum + item.itemTotal, 0) * 1.16 : (lastSaleData ? (lastSaleData.change || 0) : 0)}
          saleId={lastSaleData?.saleId || `TKT-${Math.floor(Math.random() * 100000) + 10000}`}
          paymentMethod={lastSaleData?.paymentMethod || 'cash'}
          change={lastSaleData?.change}
          customerInfo={lastSaleData?.customerInfo}
          onPrintError={(message) => setPrintErrorModal({ message })}
        />
        
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        {/* Product Upload Modal */}
        {showProductUpload && (
          <ProductUpload
            businessId="your-business-id" // Replace with actual business ID
            onProductCreated={handleProductCreated}
            onClose={() => setShowProductUpload(false)}
          />
        )}

        {/* Coming Soon Modal */}
        <ComingSoon
          isOpen={isComingSoonOpen}
          onClose={() => {
            setIsComingSoonOpen(false);
            setActiveSection('pos');
          }}
        />
      </div>
    );
  };

  return <AppContent />;
}

export default App;
