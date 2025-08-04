import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings as SettingsIcon, 
  Cpu,
  Camera,
  Database,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Receipt,
  X
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import BarcodeScanner from './components/BarcodeScanner';
import CheckoutModal from './components/CheckoutModal';
import SalesReports from './components/SalesReports';
import ProductManagement from './components/ProductManagement';
import CustomerManagement from './components/CustomerManagement';
import VirtualTicket from './components/VirtualTicket';
import Settings from './components/Settings';
import Mining from './components/Mining';
import MiningStatus from './components/MiningStatus';
import ProductUpload from './components/ProductUpload';
import Navbar from './components/Navbar';
import { storeAPI } from './api/store';
import { StoreProvider } from './contexts/StoreContext';

// Tipos de datos
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  barcode?: string; // Agregando código de barras
}

interface CartItem {
  product: Product;
  quantity: number;
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

const categories = ['Todos', 'Bebidas', 'Panadería', 'Comida', 'Postres'];

function App() {
  const [products] = useState<Product[]>(sampleProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isProductManagementOpen, setIsProductManagementOpen] = useState(false);
  const [isCustomerManagementOpen, setIsCustomerManagementOpen] = useState(false);
  const [isVirtualTicketOpen, setIsVirtualTicketOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'pos' | 'products' | 'customers' | 'reports' | 'settings' | 'mining'>('pos');
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

  // Estado para el estado de minería
  const [isMiningActive, setIsMiningActive] = useState(false);

  // Estado para la configuración inicial
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(() => {
    const stored = localStorage.getItem('bizneai-setup-complete');
    return stored === 'true';
  });

  // Estado para el modal de carga de productos
  const [showProductUpload, setShowProductUpload] = useState(false);

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
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.barcode && product.barcode.includes(searchTerm));
    return matchesCategory && matchesSearch;
  });

  // Calcular total del carrito
  const cartTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  // Agregar producto al carrito
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
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

  // Actualizar cantidad en el carrito
  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Remover producto del carrito
  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  // Limpiar carrito
  const clearCart = () => {
    setCart([]);
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

  const handleSectionChange = (section: 'pos' | 'products' | 'customers' | 'reports' | 'settings' | 'mining') => {
    setActiveSection(section);
    if (section === 'reports') {
      setIsReportsOpen(true);
    } else if (section === 'products') {
      setIsProductManagementOpen(true);
    } else if (section === 'customers') {
      setIsCustomerManagementOpen(true);
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

  // Handler para cambios en el estado de minería
  const handleMiningStatusChange = (isMining: boolean) => {
    setIsMiningActive(isMining);
  };

  // Handler para click en botón de minería en navbar
  const handleNavbarMiningClick = () => {
    setActiveSection('mining');
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

  return (
    <StoreProvider>
      <div className="pos-container">
        {/* Navbar */}
        <Navbar 
          isMiningActive={isMiningActive}
          onMiningClick={handleNavbarMiningClick}
          onSettingsClick={handleNavbarSettingsClick}
          lastBackupTime={getLastBackupTime()}
        />

        {/* Sidebar */}
        <div className="pos-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-title">BizneAI POS</div>
            <div 
              className={`sidebar-item ${activeSection === 'pos' ? 'active' : ''}`}
              onClick={() => handleSectionChange('pos')}
            >
              <ShoppingCart size={20} />
              Punto de Venta
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-title">Gestión</div>
            <div 
              className={`sidebar-item ${activeSection === 'products' ? 'active' : ''}`}
              onClick={() => handleSectionChange('products')}
            >
              <Package size={20} />
              Productos
            </div>
            <div 
              className={`sidebar-item ${activeSection === 'customers' ? 'active' : ''}`}
              onClick={() => handleSectionChange('customers')}
            >
              <Users size={20} />
              Clientes
            </div>
            <div 
              className={`sidebar-item ${activeSection === 'reports' ? 'active' : ''}`}
              onClick={() => handleSectionChange('reports')}
            >
              <BarChart3 size={20} />
              Reportes
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="pos-main">
          {/* Content */}
          <div className={`pos-content ${activeSection === 'settings' || activeSection === 'mining' ? 'settings-active' : ''}`}>
            {activeSection === 'settings' ? (
              <Settings />
            ) : activeSection === 'mining' ? (
              <Mining />
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
                  {/* Products Grid */}
                  <div className="product-grid">
                    {filteredProducts.map(product => (
                      <div
                        key={product.id}
                        className="product-card"
                        onClick={() => addToCart(product)}
                      >
                        <div className="product-image">
                          {product.image ? (
                            <img src={product.image} alt={product.name} />
                          ) : (
                            <Package size={32} />
                          )}
                        </div>
                        <div className="product-name">{product.name}</div>
                        <div className="product-price">${product.price.toFixed(2)}</div>
                        <small style={{ color: '#64748b' }}>Stock: {product.stock}</small>
                        {product.barcode && (
                          <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                            Código: {product.barcode}
                          </small>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Cart Section */}
                <div className="pos-cart">
                  <div className="cart-header">
                    <ShoppingCart size={20} />
                    Carrito de Compras
                  </div>
                  <div className="cart-items">
                    {cart.length === 0 ? (
                      <div className="empty-cart">
                        <div className="empty-cart-icon">🛒</div>
                        <p>El carrito está vacío</p>
                        <small>Selecciona productos para comenzar</small>
                      </div>
                    ) : (
                      cart.map(item => (
                        <div key={item.product.id} className="cart-item">
                          <div className="cart-item-info">
                            <div className="cart-item-name">{item.product.name}</div>
                            <div className="cart-item-price">${item.product.price.toFixed(2)}</div>
                          </div>
                          <div className="cart-item-quantity">
                            <button
                              className="quantity-btn"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="quantity-display">{item.quantity}</span>
                            <button
                              className="quantity-btn"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus size={12} />
                            </button>
                            <button
                              className="quantity-btn"
                              style={{ background: '#dc2626', marginLeft: '0.5rem' }}
                              onClick={() => removeFromCart(item.product.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="cart-total">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Subtotal:</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>IVA (16%):</span>
                      <span>${(cartTotal * 0.16).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span>Total:</span>
                      <span className="total-amount">${(cartTotal * 1.16).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="cart-actions">
                    <button className="action-btn" onClick={processSale} disabled={cart.length === 0}>
                      <CreditCard size={20} style={{ marginRight: '0.5rem' }} />
                      Procesar Venta
                    </button>
                    <button className="action-btn secondary" onClick={clearCart}>
                      <X size={20} style={{ marginRight: '0.5rem' }} />
                      Limpiar Carrito
                    </button>
                    <button className="action-btn secondary" onClick={showVirtualTicket}>
                      <Receipt size={20} style={{ marginRight: '0.5rem' }} />
                      Imprimir Ticket
                    </button>
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
          total={cartTotal}
          onComplete={handleCheckoutComplete}
        />

        {/* Sales Reports Modal */}
        <SalesReports
          isOpen={isReportsOpen}
          onClose={() => setIsReportsOpen(false)}
        />

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

        {/* Virtual Ticket Modal */}
        <VirtualTicket
          isOpen={isVirtualTicketOpen}
          onClose={() => setIsVirtualTicketOpen(false)}
          cart={cart.length > 0 ? cart : (lastSaleData ? [] : [])}
          total={cart.length > 0 ? cartTotal : 0}
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
      </div>
    </StoreProvider>
  );
}

export default App;
