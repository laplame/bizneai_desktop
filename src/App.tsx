import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings as SettingsIcon, 
  Camera,
  Database,
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
  ChefHat,
  MessageSquare,
  Calendar,
  Info,
  RefreshCw
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { getProductsFromMcp, mapMcpProductToLocal, getShopDataFromMcp } from './utils/shopIdHelper';
import BarcodeScanner from './components/BarcodeScanner';
import CheckoutModal from './components/CheckoutModal';
import SalesReports from './components/SalesReports';
import ProductManagement from './components/ProductManagement';
import CustomerManagement from './components/CustomerManagement';
import VirtualTicket from './components/VirtualTicket';
import Settings from './components/Settings';
import ProductUpload from './components/ProductUpload';
import Navbar from './components/Navbar';
import Cart from './components/Cart';
import Waitlist from './components/Waitlist';
import Taxes from './components/Taxes';
import Kitchen from './components/Kitchen';
import BizneAIChat from './components/BizneAIChat';
import ComingSoon from './components/ComingSoon';
import { storeAPI } from './api/store';
import { waitlistAPI } from './api/waitlist';
import { StoreProvider, useStore } from './contexts/StoreContext';

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
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  weight?: number;
  selectedVariants?: { [key: string]: string };
  unitPrice: number;
  itemTotal: number;
  notes?: string;
}

interface CustomerInfo {
  name?: string;
  phone?: string;
  email?: string;
  tableNumber?: string;
}

// Datos de ejemplo con códigos de barras
const sampleProducts: Product[] = [
  { id: 1, name: 'Café Americano', price: 2.50, category: 'Bebidas', stock: 50, barcode: '1234567890123' },
  { id: 2, name: 'Café Latte', price: 3.50, category: 'Bebidas', stock: 45, barcode: '1234567890124' },
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

const normalizeProductId = (rawId: unknown, fallbackIndex: number): number => {
  if (typeof rawId === 'number' && Number.isFinite(rawId)) return rawId;

  if (typeof rawId === 'string') {
    const numeric = Number(rawId);
    if (Number.isFinite(numeric)) return numeric;

    // Deterministic hash for Mongo-like IDs to keep a stable numeric ID
    let hash = 0;
    for (let i = 0; i < rawId.length; i++) {
      hash = (hash * 31 + rawId.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  return fallbackIndex + 1;
};

const hydrateProductsForPos = (productsList: any[]): Product[] => {
  return (productsList || []).map((product: any, index: number) => {
    const imageCandidate =
      product?.image ||
      product?.images?.[0] ||
      product?.imageMetadata?.cloudinaryUrls?.[0] ||
      product?.imageMetadata?.localUrls?.[0] ||
      '';

    return {
      ...product,
      id: normalizeProductId(product?.id, index),
      image: normalizeProductImageUrl(imageCandidate)
    };
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

const fetchProductsFromConfiguredMcp = async (): Promise<any[]> => {
  const mcpUrl = getConfiguredMcpUrl();
  if (!mcpUrl) return [];

  try {
    const response = await fetch(mcpUrl);
    if (!response.ok) return [];
    const payload = await response.json();
    const shopData = payload?.data || payload;
    return shopData?.products || [];
  } catch (error) {
    console.warn('Direct MCP fetch failed:', error);
    return [];
  }
};

function App() {
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
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isProductManagementOpen, setIsProductManagementOpen] = useState(false);
  const [isCustomerManagementOpen, setIsCustomerManagementOpen] = useState(false);
  const [isVirtualTicketOpen, setIsVirtualTicketOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isTaxesOpen, setIsTaxesOpen] = useState(false);
  const [isKitchenOpen, setIsKitchenOpen] = useState(false);
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'pos' | 'cart' | 'products' | 'reports' | 'customers' | 'waitlist' | 'taxes' | 'kitchen' | 'chat' | 'coming-soon' | 'settings'>('pos');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({});
  const [orderNotes, setOrderNotes] = useState<string>('');
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


  // Estado para la configuración inicial
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(() => {
    const stored = localStorage.getItem('bizneai-setup-complete');
    const storeConfig = localStorage.getItem('bizneai-store-config');
    return stored === 'true' || storeConfig !== null;
  });

  // Estado para el modal de carga de productos
  const [showProductUpload, setShowProductUpload] = useState(false);

  // Cargar productos desde servidor o localStorage
  const loadProducts = async () => {
    try {
      // Primero intentar cargar desde localStorage (productos sincronizados)
      const savedProducts = localStorage.getItem('bizneai-products');
      if (savedProducts) {
        try {
          const parsedProducts = JSON.parse(savedProducts);
          if (parsedProducts && parsedProducts.length > 0) {
            const hydratedLocalProducts = hydrateProductsForPos(parsedProducts);
            setProducts(hydratedLocalProducts);
            // Extraer categorías dinámicamente
            setCategories(extractCategories(hydratedLocalProducts));

            const hasAnyImage = hydratedLocalProducts.some((product) => Boolean(product.image));
            const isSampleCatalog = looksLikeSampleCatalog(hydratedLocalProducts);
            if ((hasAnyImage && !isSampleCatalog)) {
              return;
            }
          }
        } catch (error) {
          console.warn('Error parsing saved products:', error);
        }
      }

      // 1) Intentar carga directa con la mcpUrl configurada en Settings
      let mcpProducts = await fetchProductsFromConfiguredMcp();

      // 2) Fallback al helper global
      if (!mcpProducts || mcpProducts.length === 0) {
        mcpProducts = await getProductsFromMcp();
      }

      if (mcpProducts && mcpProducts.length > 0) {
        const mappedProducts = mcpProducts.map((p: any, index: number) => mapMcpProductToLocal(p, index));
        const hydratedMappedProducts = hydrateProductsForPos(mappedProducts);
        setProducts(hydratedMappedProducts);
        // Extraer categorías dinámicamente desde el MCP
        setCategories(extractCategories(hydratedMappedProducts));
        // Guardar en localStorage para sincronización
        localStorage.setItem('bizneai-products', JSON.stringify(hydratedMappedProducts));
        return;
      }

      // Fallback a productos de muestra
      setProducts(sampleProducts);
      setCategories(extractCategories(sampleProducts));
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts(sampleProducts);
      setCategories(extractCategories(sampleProducts));
    }
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
    
    // Cargar productos al iniciar
    loadProducts();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('products-updated', handleProductsUpdated);
    };
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
  }, [cart]);

  // Guardar información de cliente
  useEffect(() => {
    if (Object.keys(customerInfo).length > 0) {
      localStorage.setItem('bizneai-cart-customer', JSON.stringify(customerInfo));
    } else {
      localStorage.removeItem('bizneai-cart-customer');
    }
  }, [customerInfo]);

  // Guardar notas
  useEffect(() => {
    if (orderNotes) {
      localStorage.setItem('bizneai-cart-notes', orderNotes);
    } else {
      localStorage.removeItem('bizneai-cart-notes');
    }
  }, [orderNotes]);

  // Verificar configuración al cargar la aplicación
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await storeAPI.checkStatus();
        if (response.isConfigured) {
          setIsSetupComplete(true);
          localStorage.setItem('bizneai-setup-complete', 'true');
        }
      } catch {
        console.log('No se pudo verificar el estado de configuración, usando configuración local');
        // Verificar si ya hay configuración local
        const localConfig = localStorage.getItem('bizneai-store-config');
        if (localConfig) {
          setIsSetupComplete(true);
          localStorage.setItem('bizneai-setup-complete', 'true');
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

  // Si la configuración no está completa, mostrar la pantalla de configuración
  if (!isSetupComplete) {
    return (
      <div className="pos-container">
        <Settings isSetupMode={true} onSetupComplete={() => setIsSetupComplete(true)} />
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

  // Crear item del carrito con estructura completa
  const createCartItem = (product: Product, quantity: number = 1, weight?: number, variants?: { [key: string]: string }): CartItem => {
    let unitPrice = product.price;
    
    // Aplicar modificadores de variantes si existen
    if (variants && product.hasVariants) {
      // Aquí se calcularían los modificadores de precio de las variantes
      // Por ahora mantenemos el precio base
    }
    
    const finalQuantity = product.isWeightBased && weight ? weight : quantity;
    const itemTotal = unitPrice * finalQuantity;
    
    return {
      id: `${product.id}-${Date.now()}-${Math.random()}`,
      product,
      quantity: product.isWeightBased ? 1 : quantity,
      weight: product.isWeightBased ? weight || 1 : undefined,
      selectedVariants: variants,
      unitPrice,
      itemTotal
    };
  };

  // Incrementar contador de pedidos para un producto
  const incrementProductOrderCount = (productId: number) => {
    setProductOrderCounts(prevCounts => ({
      ...prevCounts,
      [productId]: (prevCounts[productId] || 0) + 1
    }));
  };

  // Agregar producto al carrito
  const addToCart = (product: Product, quantity: number = 1, weight?: number, variants?: { [key: string]: string }) => {
    // Validar inventario
    if (!product.isWeightBased && quantity > product.stock) {
      toast.error(`Stock insuficiente. Disponible: ${product.stock}`);
      return;
    }
    
    // Incrementar contador de pedidos cada vez que se agrega al carrito
    incrementProductOrderCount(product.id);
    
    setCart(prevCart => {
      // Buscar si ya existe un item con el mismo producto y variantes
      const existingItem = prevCart.find(item => {
        if (item.product.id !== product.id) return false;
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
              toast.error(`Stock insuficiente. Disponible: ${product.stock}`);
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
        const newItem = createCartItem(product, quantity, weight, variants);
        return [...prevCart, newItem];
      }
    });
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

  // Actualizar cantidad en el carrito (nuevo formato)
  const updateCartQuantity = (itemId: string, newQuantity: number, weight?: number) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === itemId) {
          const product = item.product;
          const quantity = product.isWeightBased ? 1 : newQuantity;
          const finalWeight = product.isWeightBased ? (weight || newQuantity) : item.weight;
          
          if (!product.isWeightBased && newQuantity > product.stock) {
            toast.error(`Stock insuficiente. Disponible: ${product.stock}`);
            return item;
          }
          
          if (product.isWeightBased && finalWeight && finalWeight > product.stock) {
            toast.error(`Stock insuficiente. Disponible: ${product.stock}kg`);
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

  // Handler para checkout desde Cart
  const handleCartCheckout = async (checkoutType: 'pay-now' | 'waitlist' | 'kitchen') => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    setIsProcessing(true);

    try {
      if (checkoutType === 'pay-now') {
        setIsCheckoutOpen(true);
        setIsCartOpen(false);
      } else if (checkoutType === 'waitlist') {
        // Agregar a waitlist
        toast.success('Orden agregada a la lista de espera');
        clearCart();
        setIsCartOpen(false);
      } else if (checkoutType === 'kitchen') {
        // Enviar a cocina
        toast.success('Orden enviada a cocina');
        clearCart();
        setIsCartOpen(false);
      }
    } catch (error) {
      toast.error('Error al procesar la orden');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
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

  // Manejar completar checkout
  const handleCheckoutComplete = (paymentMethod: string, amount: number, change?: number) => {
    const saleId = `TKT-${Math.floor(Math.random() * 100000) + 10000}`;
    const saleData = {
      id: Math.floor(Math.random() * 10000) + 1000,
      date: new Date().toISOString(),
      items: cart,
      total: amount,
      paymentMethod,
      change: change || 0
    };
    
    // Guardar datos de la venta para el ticket
    setLastSaleData({
      saleId,
      paymentMethod,
      change,
      customerInfo: {
        name: 'Cliente General',
        email: 'cliente@email.com',
        phone: '+52 55 0000 0000'
      }
    });
    
    console.log('Venta completada:', saleData);
    
    // Aquí podrías guardar la venta en una base de datos
    alert(`Venta #${saleId} completada exitosamente por $${amount.toFixed(2)} usando ${paymentMethod}`);
    
    clearCart();
    setSearchTerm('');
  };

  // Mostrar ticket virtual
  const showVirtualTicket = () => {
    if (cart.length === 0 && !lastSaleData) {
      alert('No hay productos en el carrito ni venta reciente para generar ticket');
      return;
    }
    setIsVirtualTicketOpen(true);
  };

  const handleSectionChange = (section: 'pos' | 'cart' | 'products' | 'reports' | 'customers' | 'waitlist' | 'taxes' | 'kitchen' | 'chat' | 'coming-soon' | 'settings') => {
    setActiveSection(section);
    if (section === 'reports') {
      setIsReportsOpen(true);
    } else if (section === 'products') {
      setIsProductManagementOpen(true);
    } else if (section === 'customers') {
      setIsCustomerManagementOpen(true);
    } else if (section === 'cart') {
      setIsCartOpen(true);
      // No cambiar activeSection para mantener la vista POS visible
    } else if (section === 'waitlist') {
      setIsWaitlistOpen(true);
    } else if (section === 'taxes') {
      setIsTaxesOpen(true);
    } else if (section === 'kitchen') {
      // Kitchen se renderiza directamente en el contenido, no como modal
      // Solo actualizar activeSection
    }
  };

  const getLastBackupTime = () => {
    const lastBackup = localStorage.getItem('lastBackupTime');
    if (!lastBackup) {
      return 'Nunca';
    }
    const date = new Date(lastBackup);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };


  // Handler para click en botón de configuración en navbar
  const handleNavbarSettingsClick = () => {
    setActiveSection('settings');
  };

  const handleProductCreated = (product: { name: string; id?: string; price?: number; description?: string }) => {
    // Refresh products list or add to current list
    toast.success(`Product "${product.name}" created successfully!`);
    // You can add logic here to refresh the products list
  };

  // Handler para cargar waitlist al carrito
  const handleLoadWaitlistToCart = (entry: any) => {
    if (!entry.items || entry.items.length === 0) {
      toast.error('Esta entrada no tiene items para cargar al carrito');
      return;
    }

    // Limpiar el carrito actual antes de cargar la nueva orden
    setCart([]);
    
    // Cargar cada item al carrito
    entry.items.forEach((item: any) => {
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
          item.selectedVariants || item.product.variants // Variantes si existen
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
    
    // Cerrar waitlist y abrir carrito
    setIsWaitlistOpen(false);
    setIsCartOpen(true);
    
    toast.success(`Orden de ${entry.name || 'cliente'} cargada al carrito (${entry.items.length} items)`);
  };

  // Componente interno para usar el hook useStore
  const AppContent = () => {
    const { storeIdentifiers, setStoreIdentifiers } = useStore();
    // Verificar storeType desde localStorage también por si no está en context
    // También verificar desde la configuración guardada
    const savedConfig = localStorage.getItem('bizneai-store-config');
    let configStoreType = null;
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        configStoreType = parsed.storeType;
      } catch (e) {
        // Ignore parse errors
      }
    }
    const savedStoreType = storeIdentifiers.storeType || configStoreType || localStorage.getItem('bizneai-store-type');
    // Verificar si es restaurante o cafetería (incluyendo los valores de la API)
    const isRestaurantOrCafe = savedStoreType === 'restaurant' || 
                               savedStoreType === 'coffee-shop' || 
                               savedStoreType === 'CoffeeShop' ||
                               savedStoreType === 'Restaurant';
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
    
    // Debug temporal
    if (activeSection === 'kitchen') {
      console.log('Kitchen section active:', {
        activeSection,
        savedStoreType,
        isRestaurantOrCafe,
        storeIdentifiers
      });
    }

  return (
      <div className="pos-container">
        {/* Sidebar */}
        <div className="pos-sidebar">
          {/* Nombre del shop */}
          <div className="sidebar-section">
            <div className="sidebar-title">
              <Store size={20} />
              {resolvedStoreName}
            </div>
          </div>

          {/* Punto de venta */}
          <div className="sidebar-section">
            <div 
              className={`sidebar-item ${activeSection === 'pos' ? 'active' : ''}`}
              onClick={() => handleSectionChange('pos')}
            >
              <ShoppingCart size={20} />
              Punto de Venta
            </div>
          </div>

          {/* Carrito */}
          <div className="sidebar-section">
            <div 
              className={`sidebar-item ${activeSection === 'cart' ? 'active' : ''}`}
              onClick={() => handleSectionChange('cart')}
            >
              <ShoppingBag size={20} />
              Carrito
            </div>
          </div>

          {/* Productos e inventario */}
          <div className="sidebar-section">
            <div 
              className={`sidebar-item ${activeSection === 'products' ? 'active' : ''}`}
              onClick={() => handleSectionChange('products')}
            >
              <Warehouse size={20} />
              Productos e Inventario
            </div>
          </div>

          {/* Ventas */}
          <div className="sidebar-section">
            <div 
              className={`sidebar-item ${activeSection === 'reports' ? 'active' : ''}`}
              onClick={() => handleSectionChange('reports')}
            >
              <BarChart3 size={20} />
              Ventas
            </div>
          </div>

          {/* Clientes */}
          <div className="sidebar-section">
            <div 
              className={`sidebar-item ${activeSection === 'customers' ? 'active' : ''}`}
              onClick={() => handleSectionChange('customers')}
            >
              <Users size={20} />
              Clientes
            </div>
          </div>

          {/* Lista de espera */}
          <div className="sidebar-section">
            <div 
              className={`sidebar-item ${activeSection === 'waitlist' ? 'active' : ''}`}
              onClick={() => handleSectionChange('waitlist')}
            >
              <Clock size={20} />
              Lista de Espera
            </div>
          </div>

          {/* Impuestos */}
          <div className="sidebar-section">
            <div 
              className={`sidebar-item ${activeSection === 'taxes' ? 'active' : ''}`}
              onClick={() => handleSectionChange('taxes')}
            >
              <ReceiptText size={20} />
              Impuestos
            </div>
          </div>

          {/* Cocina - Solo para restaurantes y cafeterías */}
          {isRestaurantOrCafe && (
            <div className="sidebar-section">
              <div 
                className={`sidebar-item ${activeSection === 'kitchen' ? 'active' : ''}`}
                onClick={() => handleSectionChange('kitchen')}
              >
                <ChefHat size={20} />
                Cocina
              </div>
            </div>
          )}

          {/* BiznaAI Chat */}
          <div className="sidebar-section">
            <div 
              className={`sidebar-item ${activeSection === 'chat' ? 'active' : ''}`}
              onClick={() => handleSectionChange('chat')}
            >
              <MessageSquare size={20} />
              BiznaAI Chat
            </div>
          </div>

          {/* Proximamente */}
          <div className="sidebar-section">
            <div 
              className={`sidebar-item ${activeSection === 'coming-soon' ? 'active' : ''}`}
              onClick={() => {
                handleSectionChange('coming-soon');
                setIsComingSoonOpen(true);
              }}
            >
              <Calendar size={20} />
              Próximamente
            </div>
          </div>

          {/* Configuracion */}
          <div className="sidebar-section">
            <div 
              className={`sidebar-item ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => handleSectionChange('settings')}
            >
              <SettingsIcon size={20} />
              Configuración
            </div>
          </div>

          {/* Version */}
          <div className="sidebar-section">
            <div className="sidebar-item sidebar-version">
              <Info size={16} />
              <span style={{ fontSize: '0.75rem', color: 'var(--bs-dark-text-muted)' }}>
                Versión 1.0.0
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="pos-main">
          {/* Content */}
          <div className={`pos-content ${activeSection === 'settings' ? 'settings-active' : ''} ${activeSection === 'chat' ? 'chat-active' : ''}`}>
            {activeSection === 'settings' ? (
              <div style={{ padding: '1rem' }}>
                <Settings />
              </div>
            ) : activeSection === 'kitchen' && isRestaurantOrCafe ? (
              <div style={{ padding: '1rem', height: '100%' }}>
                <Kitchen
                  isOpen={true}
                  onClose={() => {
                    setActiveSection('pos');
                  }}
                />
              </div>
            ) : activeSection === 'chat' ? (
              <div style={{ padding: 0, margin: 0, height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <BizneAIChat isOpen={true} />
              </div>
            ) : activeSection === 'waitlist' || (activeSection === 'kitchen' && !isRestaurantOrCafe) ? (
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
                        placeholder="Buscar productos o escanear código de barras..."
                        className="search-bar"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <button
                        className="barcode-btn"
                        onClick={() => setIsBarcodeScannerOpen(true)}
                        title="Escanear código de barras"
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
                        <p>No products found</p>
                        <small>Try adjusting your search or category filter</small>
                      </div>
                    ) : (
                      filteredProducts.map(product => {
                        // Componente interno para manejar el estado de carga de imagen
                        const ProductCard = ({ product }: { product: Product }) => {
                          const [imageError, setImageError] = useState(false);
                          
                          // Reset image error when product image changes after sync
                          useEffect(() => {
                            setImageError(false);
                          }, [product.image]);

                          return (
                            <div
                        className="product-card"
                              onClick={() => {
                                // According to Gherkin: "When I tap on a product"
                                addToCart(product);
                              }}
                              title={`Click to add ${product.name} to cart`}
                      >
                        <div className="product-image">
                                {Boolean(product.image) && !imageError ? (
                                  <img 
                                    src={product.image} 
                                    alt={product.name}
                                    onError={() => {
                                      setImageError(true);
                                    }}
                                  />
                          ) : (
                            <Package size={32} />
                          )}
                        </div>
                        <div className="product-name">{product.name}</div>
                        <div className="product-price">${product.price.toFixed(2)}</div>
                              {product.stock !== undefined && product.stock < 10 && product.stock > 0 && (
                                <div className="product-stock-warning">Low Stock: {product.stock}</div>
                              )}
                              {product.stock === 0 && (
                                <div className="product-stock-out">Out of Stock</div>
                        )}
                      </div>
                          );
                        };

                        return <ProductCard key={product.id} product={product} />;
                      })
                    )}
                  </div>
                </div>
                {/* Cart Section - According to Gherkin specs */}
                <div className="pos-cart">
                  <div className="cart-header">
                    <div className="cart-header-left">
                      <ShoppingCart size={20} />
                      <span>Carrito de Compras</span>
                      {cart.length > 0 && (
                        <span className="cart-count-badge">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                      )}
                    </div>
                    <div className="cart-header-right">
                      <span className="cart-date">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="cart-items">
                    {cart.length === 0 ? (
                      <div className="empty-cart">
                        <div className="empty-cart-icon">🛒</div>
                        <p>Your cart is empty</p>
                        <button className="action-btn" onClick={() => setSearchTerm('')}>
                          Start to Sell
                        </button>
                      </div>
                    ) : (
                      <>
                        {cart.map(item => (
                        <div key={item.id} className="cart-item">
                          <div className="cart-item-info">
                            <div className="cart-item-name">{item.product.name}</div>
                              <div className="cart-item-details">
                                <span className="cart-item-quantity-label">
                              {item.product.isWeightBased 
                                    ? `Weight: ${item.weight?.toFixed(2)} kg`
                                    : `Quantity: ${item.quantity}`
                                  }
                                </span>
                                <span className="cart-item-unit-price">
                                  Unit Price: ${item.unitPrice.toFixed(2)}
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
                                  title="Decrease quantity"
                            >
                                  <Minus size={14} />
                            </button>
                            <span className="quantity-display">
                                  {item.product.isWeightBased ? `${item.weight?.toFixed(2)} kg` : item.quantity}
                            </span>
                            <button
                              className="quantity-btn"
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1, item.weight)}
                                  title="Increase quantity"
                            >
                                  <Plus size={14} />
                            </button>
                            <button
                                  className="quantity-btn remove-btn"
                              onClick={() => removeCartItem(item.id)}
                                  title="Remove item"
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
                      {/* Customer Information Section - According to Gherkin */}
                      <div className="cart-customer-info">
                        <h3 className="cart-section-title">Customer Information</h3>
                        <input
                          type="text"
                          placeholder="Customer Name"
                          className="cart-input"
                          value={customerInfo.name || ''}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Table Number"
                          className="cart-input"
                          value={customerInfo.tableNumber || ''}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, tableNumber: e.target.value })}
                        />
                        <textarea
                          placeholder="Order Notes"
                          className="cart-textarea"
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          rows={2}
                        />
                      </div>
                      {/* Cart Totals - According to Gherkin */}
                  <div className="cart-total">
                        <div className="cart-total-row">
                          <span>Subtotal (excl. tax):</span>
                      <span>${cart.reduce((sum, item) => sum + item.itemTotal, 0).toFixed(2)}</span>
                    </div>
                        <div className="cart-total-row">
                          <span>Tax amount:</span>
                      <span>${(cart.reduce((sum, item) => sum + item.itemTotal, 0) * 0.16).toFixed(2)}</span>
                    </div>
                        <div className="cart-total-row cart-total-final">
                          <span>Total (incl. tax):</span>
                      <span className="total-amount">${(cart.reduce((sum, item) => sum + item.itemTotal, 0) * 1.16).toFixed(2)}</span>
                    </div>
                  </div>
                    </>
                  )}
                  <div className="cart-actions">
                    {cart.length > 0 ? (
                      <>
                    <button 
                      className="action-btn" 
                      onClick={processSale} 
                          title="Proceed to Checkout"
                    >
                      <CreditCard size={20} style={{ marginRight: '0.5rem' }} />
                          Proceed to Checkout
                    </button>
                    <button 
                      className="action-btn btn-waitlist" 
                      onClick={handleAddCartToWaitlist}
                          disabled={isProcessing}
                          title="Add to Waitlist"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw size={20} className="spinner" style={{ marginRight: '0.5rem' }} />
                              Adding...
                        </>
                      ) : (
                        <>
                          <Clock size={20} style={{ marginRight: '0.5rem' }} />
                              Add to Waitlist
                        </>
                      )}
                    </button>
                        <button 
                          className="action-btn secondary" 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to clear the entire cart?')) {
                              clearCart();
                            }
                          }}
                        >
                      <X size={20} style={{ marginRight: '0.5rem' }} />
                          Clear Cart
                    </button>
                      </>
                    ) : (
                    <button className="action-btn secondary" onClick={showVirtualTicket}>
                      <Receipt size={20} style={{ marginRight: '0.5rem' }} />
                        View Tickets
                    </button>
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

        {/* Checkout Modal */}
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          total={cart.reduce((sum, item) => sum + item.itemTotal, 0) * 1.16}
          onComplete={handleCheckoutComplete}
        />

        {/* Sales Reports Modal */}
        <SalesReports
          isOpen={isReportsOpen}
          onClose={() => setIsReportsOpen(false)}
        />

        {/* Cart Modal */}
        {isCartOpen && (
          <div className="modal-overlay" onClick={() => {
            setIsCartOpen(false);
            setActiveSection('pos');
          }}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header">
                <h2>Carrito de Compras</h2>
                <button className="close-btn" onClick={() => {
                  setIsCartOpen(false);
                  setActiveSection('pos');
                }}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body" style={{ padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Cart
                  items={cart}
                  onUpdateQuantity={updateCartQuantity}
                  onRemoveItem={removeCartItem}
                  onClearCart={clearCart}
                  onCheckout={handleCartCheckout}
                  taxRate={0.16}
                  onAddCustomerInfo={setCustomerInfo}
                  onAddOrderNotes={setOrderNotes}
                  customerInfo={customerInfo}
                  orderNotes={orderNotes}
                  isProcessing={isProcessing}
                />
              </div>
            </div>
          </div>
        )}

        {/* Product Management Modal */}
        {activeSection === 'products' && (
          <ProductManagement
            isOpen={isProductManagementOpen}
            onClose={() => setIsProductManagementOpen(false)}
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
        {isKitchenOpen && isRestaurantOrCafe && (
          <Kitchen
            isOpen={isKitchenOpen}
            onClose={() => {
              setIsKitchenOpen(false);
              setActiveSection('pos');
            }}
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
