import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users,
  Download,
  RefreshCw,
  Printer,
  FileText,
  Activity,
  X,
  History,
  Shield,
  CheckCircle,
  AlertCircle,
  Copy,
  Layers,
  CloudDownload
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  Transaction,
  DailyBlock,
  MerkleProof,
  buildMerkleTree,
  generateMerkleProof,
  verifyMerkleProof,
  verifyBlockIntegrity,
} from '../utils/merkleTree';
import {
  getTransactions,
  getDailyBlocks,
  generateDailyBlock,
  getLastBlockGeneration,
  verifyChainIntegrityService,
} from '../services/merkleTreeService';
import { syncUnsentBlocksToServer } from '../services/blockApiService';
import { getTransactionsFromMcp, isShopIdConfigured } from '../utils/shopIdHelper';
import { isBatchDue, syncMcpBatch, sleep } from '../utils/syncService';
import {
  type SaleReportRow,
  mapMcpToSaleRow,
  mapMerkleTransactionToSaleRow,
  mergeSaleRows,
  saleRowToRecoveryPayload,
} from '../utils/salesRecovery';
import type { RecoveredSalePayload } from '../types/salesRecovery';
import { printReceiptThermalOrDialog, resolveStoreNameForPrint } from '../services/receiptPrintService';
import { computeCartTaxBreakdownFromCartItems, loadTaxSettings } from '../utils/taxSettings';
import type { RegistryCustomer } from '../types/customerRegistry';
import {
  loadCustomers,
  getCustomerFullName,
  getCustomerStatusLabel,
} from '../services/customerRegistry';
import {
  fetchSessionEventsMerged,
  fetchSaleCashierMerged,
  getActivityShopId,
  type LocalSessionEvent,
  type LocalSaleCashierEvent,
} from '../services/localActivityLog';

/** Caché de la vista Stats (evita recalcular sin cambio de ventas) */
interface SalesStatsCache {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalTickets: number;
  paymentMethodStats: Record<string, number>;
  topProducts: Array<[string, { quantity: number; revenue: number }]>;
}

interface SalesReportsProps {
  isOpen: boolean;
  onClose: () => void;
  /** Recupera la venta en el carrito del POS para editar y volver a cobrar */
  onRecoverSaleToCart?: (payload: RecoveredSalePayload) => void;
}

// Datos de ejemplo para ventas
const generateSampleSales = (): SaleReportRow[] => {
  const sales: SaleReportRow[] = [];
  const products = [
    { id: 1, name: 'Café Americano', price: 2.50, category: 'Bebidas' },
    { id: 2, name: 'Café Latte', price: 3.50, category: 'Bebidas' },
    { id: 3, name: 'Cappuccino', price: 3.00, category: 'Bebidas' },
    { id: 4, name: 'Croissant', price: 2.00, category: 'Panadería' },
    { id: 5, name: 'Muffin de Chocolate', price: 2.50, category: 'Panadería' },
    { id: 6, name: 'Sándwich de Pollo', price: 5.50, category: 'Comida' },
    { id: 7, name: 'Ensalada César', price: 6.00, category: 'Comida' },
    { id: 8, name: 'Pizza Margherita', price: 8.50, category: 'Comida' },
    { id: 9, name: 'Agua Mineral', price: 1.50, category: 'Bebidas' },
    { id: 10, name: 'Jugo de Naranja', price: 2.00, category: 'Bebidas' },
    { id: 11, name: 'Tarta de Manzana', price: 3.50, category: 'Postres' },
    { id: 12, name: 'Helado de Vainilla', price: 2.50, category: 'Postres' }
  ];

  const paymentMethods = ['cash', 'card', 'crypto', 'codi'];
  
  // Generar ventas de los últimos 30 días
  for (let i = 0; i < 50; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    const numItems = Math.floor(Math.random() * 5) + 1;
    const items = [];
    let total = 0;
    
    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      items.push({ product, quantity });
      total += product.price * quantity;
    }
    
    sales.push({
      id: 1000 + i,
      date: date.toISOString(),
      items,
      total: total * 1.16, // Con IVA
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      change: Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0,
      source: 'sample',
    });
  }
  
  return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const mergeWithLocalMerkle = (remote: SaleReportRow[]): SaleReportRow[] => {
  const merkleSales = getTransactions()
    .filter((tx) => tx.action === 'create')
    .map(mapMerkleTransactionToSaleRow)
    .filter((s): s is SaleReportRow => s !== null);
  return mergeSaleRows(merkleSales, remote);
};

const SalesReports = ({ isOpen, onClose, onRecoverSaleToCart }: SalesReportsProps) => {
  const [sales, setSales] = useState<SaleReportRow[]>([]);
  const [filteredSales, setFilteredSales] = useState<SaleReportRow[]>([]);
  const [printingKey, setPrintingKey] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7d');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [category, setCategory] = useState('all');
  const [view, setView] = useState<
    'summary' | 'detailed' | 'analytics' | 'history' | 'stats' | 'customers' | 'activity'
  >('summary');
  const [sessionEvents, setSessionEvents] = useState<LocalSessionEvent[]>([]);
  const [saleCashierEvents, setSaleCashierEvents] = useState<LocalSaleCashierEvent[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [registryCustomers, setRegistryCustomers] = useState<RegistryCustomer[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsCache, setStatsCache] = useState<SalesStatsCache | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [blocks, setBlocks] = useState<DailyBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<DailyBlock | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [merkleProof, setMerkleProof] = useState<MerkleProof | null>(null);
  const [isGeneratingBlock, setIsGeneratingBlock] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedBlockDate, setSelectedBlockDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load sales from server
  const loadSalesFromServer = async () => {
    if (!isShopIdConfigured()) {
      toast.error('Primero configura la URL del servidor en Configuración');
      return;
    }

    try {
      setIsLoading(true);
      toast.loading('Cargando ventas desde el servidor...', { id: 'loading-sales' });
      const mcpTransactions = await getTransactionsFromMcp();
      
      if (mcpTransactions && mcpTransactions.length > 0) {
        const mappedSales = mcpTransactions.map((t: unknown, index: number) => mapMcpToSaleRow(t, index));
        const merged = mergeWithLocalMerkle(mappedSales);
        setSales(merged);
        setFilteredSales(merged);
        toast.success(`${merged.length} ventas cargadas (servidor + locales)`, { id: 'loading-sales' });
      } else {
        const sampleSales = mergeWithLocalMerkle(generateSampleSales());
        setSales(sampleSales);
        setFilteredSales(sampleSales);
        toast.success('No hay ventas en el servidor. Mostrando muestra y ventas locales', { id: 'loading-sales' });
      }
    } catch (error) {
      console.error('Error loading sales from server:', error);
      toast.error('Error al cargar ventas desde el servidor', { id: 'loading-sales' });
      const sampleSales = mergeWithLocalMerkle(generateSampleSales());
      setSales(sampleSales);
      setFilteredSales(sampleSales);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const run = async () => {
      if (!isShopIdConfigured()) {
        const sampleSales = mergeWithLocalMerkle(generateSampleSales());
        setSales(sampleSales);
        setFilteredSales(sampleSales);
        loadTransactionsAndBlocks();
        return;
      }

      try {
        if (isBatchDue('sales')) {
          await syncMcpBatch('sales', { force: true });
          if (cancelled) return;
          await sleep(600);
        }
        if (isBatchDue('tickets')) {
          await syncMcpBatch('tickets', { force: true });
          if (cancelled) return;
          await sleep(400);
        }
      } catch (e) {
        console.warn('[SalesReports] lotes MCP', e);
      }

      if (cancelled) return;
      await loadSalesFromServer();
      syncUnsentBlocksToServer().then(({ sent }) => {
        if (sent > 0) toast.success(`${sent} bloque(s) sincronizado(s) con el servidor`);
      });
      loadTransactionsAndBlocks();
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    const refresh = () => setRegistryCustomers(loadCustomers());
    refresh();
    window.addEventListener('customers-updated', refresh);
    return () => window.removeEventListener('customers-updated', refresh);
  }, []);

  useEffect(() => {
    if (!isOpen || view !== 'activity') return;
    const shopId = getActivityShopId();
    let cancelled = false;
    (async () => {
      setActivityLoading(true);
      try {
        const [s, v] = await Promise.all([
          fetchSessionEventsMerged(shopId),
          fetchSaleCashierMerged(shopId),
        ]);
        if (!cancelled) {
          setSessionEvents(s);
          setSaleCashierEvents(v);
        }
      } catch {
        if (!cancelled) {
          setSessionEvents([]);
          setSaleCashierEvents([]);
        }
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, view]);

  const loadTransactionsAndBlocks = async () => {
    setIsLoading(true);
    try {
      const txList = getTransactions();
      const blockList = getDailyBlocks();
      setTransactions(txList);
      setBlocks(blockList);
    } catch (error) {
      console.error('Error loading transactions and blocks:', error);
      setTransactions([]);
      setBlocks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDailyBlock = async (date: string) => {
    setIsGeneratingBlock(true);
    try {
      const newBlock = await generateDailyBlock(date);
      if (newBlock) {
        const txCount = newBlock.transactions.length;
        setBlocks(getDailyBlocks());
        setTransactions(getTransactions());
        toast.success(`Bloque generado para ${date} con ${txCount} transacciones${txCount > 0 ? ' • +50 LUX' : ''}`);
        await syncUnsentBlocksToServer();
      }
    } catch (error) {
      console.error('Error generating block:', error);
      toast.error(error instanceof Error ? error.message : 'Error al generar el bloque');
    } finally {
      setIsGeneratingBlock(false);
    }
  };

  const handleVerifyTransaction = async (transaction: Transaction) => {
    setIsVerifying(true);
    try {
      const block = blocks.find((b) => b.transactions.some((tx) => tx.id === transaction.id));
      if (!block) {
        toast.error('Transacción no encontrada en ningún bloque');
        setIsVerifying(false);
        return;
      }

      const { tree } = await buildMerkleTree(block.transactions);
      const proof = generateMerkleProof(transaction.hash, block.transactions, tree);
      const isValid = await verifyMerkleProof(proof);

      setMerkleProof(proof);
      setVerificationResult({ valid: isValid, errors: isValid ? [] : ['La prueba de Merkle no es válida'] });

      if (isValid) {
        toast.success('Transacción verificada correctamente');
      } else {
        toast.error('La transacción no pudo ser verificada');
      }
    } catch (error) {
      console.error('Error verifying transaction:', error);
      toast.error('Error al verificar la transacción');
      setVerificationResult({ valid: false, errors: ['Error al verificar'] });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyBlock = async (block: DailyBlock) => {
    setIsVerifying(true);
    try {
      const result = await verifyBlockIntegrity(block);
      setVerificationResult(result);
      
      if (result.valid) {
        toast.success('Bloque verificado correctamente');
      } else {
        toast.error(`Errores encontrados: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Error verifying block:', error);
      toast.error('Error al verificar el bloque');
      setVerificationResult({ valid: false, errors: ['Error al verificar'] });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      if (blocks.length === 0) {
        toast.error('No hay bloques para verificar');
        setIsVerifying(false);
        return;
      }

      const result = await verifyChainIntegrityService();
      setVerificationResult(result);

      if (result.valid) {
        toast.success('Cadena verificada correctamente');
      } else {
        toast.error(`Errores encontrados: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Error verifying chain:', error);
      toast.error('Error al verificar la cadena');
      setVerificationResult({ valid: false, errors: ['Error al verificar'] });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const handlePrintSale = async (sale: SaleReportRow) => {
    const k = `${String(sale.id)}-${sale.date}`;
    if (printingKey === k) return;
    setPrintingKey(k);
    try {
      const taxSettings = loadTaxSettings();
      const lineRows = sale.items.map((item) => ({
        itemTotal: item.product.price * item.quantity,
        product: {
          priceIncludesTax: (item.product as { priceIncludesTax?: boolean }).priceIncludesTax,
          taxExempt: (item.product as { taxExempt?: boolean }).taxExempt,
        },
      }));
      const { subtotalExclTax, taxAmount, total: computedTotal } = computeCartTaxBreakdownFromCartItems(
        lineRows,
        taxSettings
      );
      const subtotal = sale.subtotal ?? subtotalExclTax;
      const tax = sale.tax ?? taxAmount;
      const total = sale.total ?? computedTotal;

      const r = await printReceiptThermalOrDialog({
        storeName: resolveStoreNameForPrint(),
        saleId: String(sale.id),
        ticketKind: 'sale',
        date: new Date(sale.date).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
        items: sale.items.map((i) => ({
          productName: i.product.name,
          quantity: i.quantity,
          unitPrice: i.product.price,
          totalPrice: i.product.price * i.quantity,
        })),
        subtotal,
        tax,
        total,
        paymentMethod: sale.paymentMethod,
      });
      if (r.success) {
        toast.success('Ticket enviado o abierto el cuadro de impresión');
      } else {
        toast.error(r.error || 'No se pudo imprimir');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al imprimir');
    } finally {
      setPrintingKey(null);
    }
  };

  const handleRecoverSale = (sale: SaleReportRow) => {
    if (!onRecoverSaleToCart) {
      toast.error('Conecta esta pantalla al POS desde la app principal');
      return;
    }
    onRecoverSaleToCart(saleRowToRecoveryPayload(sale));
    onClose();
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getUniqueDates = () => {
    const dates = new Set<string>();
    transactions.forEach(tx => {
      const date = new Date(tx.timestamp).toISOString().split('T')[0];
      dates.add(date);
    });
    return Array.from(dates).sort().reverse();
  };

  useEffect(() => {
    filterSales();
  }, [sales, dateRange, paymentMethod, category]);

  const filterSales = () => {
    let filtered = [...sales];

    // Filtrar por rango de fechas
    const now = new Date();
    const daysAgo = parseInt(dateRange.replace('d', ''));
    const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    filtered = filtered.filter(sale => new Date(sale.date) >= cutoffDate);

    // Filtrar por método de pago
    if (paymentMethod !== 'all') {
      filtered = filtered.filter(sale => sale.paymentMethod === paymentMethod);
    }

    // Filtrar por categoría
    if (category !== 'all') {
      filtered = filtered.filter(sale => 
        sale.items.some(item => {
          const itemCategory = item.product?.category || 'General';
          return itemCategory === category;
        })
      );
    }

    setFilteredSales(filtered);
  };

  const getPaymentMethodName = (method: string) => {
    const names: { [key: string]: string } = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      crypto: 'Crypto',
      codi: 'CODI'
    };
    return names[method] || method;
  };

  const getPaymentMethodColor = (method: string) => {
    const colors: { [key: string]: string } = {
      cash: '#059669',
      card: '#3b82f6',
      crypto: '#f59e0b',
      codi: '#8b5cf6'
    };
    return colors[method] || '#64748b';
  };

  // Cálculos de estadísticas
  const totalSales = filteredSales.length;
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
  
  const paymentMethodStats = filteredSales.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const categoryStats = filteredSales.reduce((acc, sale) => {
    sale.items.forEach(item => {
      const category = item.product?.category || 'General';
      acc[category] = (acc[category] || 0) + item.quantity;
    });
    return acc;
  }, {} as { [key: string]: number });

  const topProducts = filteredSales.reduce((acc, sale) => {
    sale.items.forEach(item => {
      const productName = item.product?.name || 'Producto sin nombre';
      acc[productName] = (acc[productName] || 0) + item.quantity;
    });
    return acc;
  }, {} as { [key: string]: number });

  const topProductsArray = Object.entries(topProducts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Calculate top products with revenue
  const topProductsWithRevenue = filteredSales.reduce((acc, sale) => {
    sale.items.forEach(item => {
      const productName = item.product?.name || 'Producto sin nombre';
      const productPrice = item.product?.price || 0;
      
      if (!acc[productName]) {
        acc[productName] = {
          quantity: 0,
          revenue: 0
        };
      }
      acc[productName].quantity += item.quantity;
      acc[productName].revenue += productPrice * item.quantity;
    });
    return acc;
  }, {} as { [key: string]: { quantity: number; revenue: number } });

  const topProductsArrayWithRevenue = Object.entries(topProductsWithRevenue)
    .sort(([,a], [,b]) => b.quantity - a.quantity)
    .slice(0, 5);

  // Calculate total tickets (same as total sales for now)
  const totalTickets = filteredSales.length;

  const renderSummary = () => (
    <div className="reports-summary">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#3b82f6' }}>
            <ShoppingCart size={24} />
          </div>
          <div className="stat-info">
            <h3>{totalSales}</h3>
            <p>Ventas Totales</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#059669' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>${totalRevenue.toFixed(2)}</h3>
            <p>Ingresos Totales</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>${averageTicket.toFixed(2)}</h3>
            <p>Ticket Promedio</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#8b5cf6' }}>
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <h3>{Object.keys(paymentMethodStats).length}</h3>
            <p>Métodos de Pago</p>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container">
          <h3>Métodos de Pago</h3>
          <div className="payment-methods-chart">
            {Object.entries(paymentMethodStats).map(([method, count]) => (
              <div key={method} className="payment-method-bar">
                <div className="bar-label">
                  <span>{getPaymentMethodName(method)}</span>
                  <span>{count}</span>
                </div>
                <div className="bar-container">
                  <div 
                    className="bar-fill"
                    style={{ 
                      width: `${(count / totalSales) * 100}%`,
                      backgroundColor: getPaymentMethodColor(method)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-container">
          <h3>Productos Más Vendidos</h3>
          <div className="top-products">
            {topProductsArray.map(([product, quantity]) => (
              <div key={product} className="product-stat">
                <span className="product-name">{product}</span>
                <span className="product-quantity">{quantity} unidades</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDetailed = () => (
    <div className="reports-detailed">
      <p style={{ marginBottom: '1rem', color: 'var(--bs-dark-text-muted, #64748b)', fontSize: '0.9rem' }}>
        Incluye ventas del servidor (si está configurado), <strong>registro local Merkle</strong> y muestras. Usa{' '}
        <Printer size={14} style={{ verticalAlign: 'text-bottom' }} /> para imprimir o PDF y{' '}
        <ShoppingCart size={14} style={{ verticalAlign: 'text-bottom' }} /> para cargar la venta al carrito y volver a
        cobrar (nueva venta).
      </p>
      <div className="sales-table-container">
        <table className="sales-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Productos</th>
              <th>Total</th>
              <th>Método</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((sale) => {
              const rowKey = `${String(sale.id)}-${sale.date}`;
              const isPrinting = printingKey === rowKey;
              return (
              <tr key={rowKey}>
                <td>#{sale.id}</td>
                <td>{new Date(sale.date).toLocaleDateString()}</td>
                <td>
                  <div className="sale-items">
                    {sale.items.map((item, index) => (
                      <span key={index} className="sale-item">
                        {item.quantity}x {item.product.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td>${sale.total.toFixed(2)}</td>
                <td>
                  <span 
                    className="payment-method-badge"
                    style={{ backgroundColor: getPaymentMethodColor(sale.paymentMethod) }}
                  >
                    {getPaymentMethodName(sale.paymentMethod)}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="action-btn"
                    title="Imprimir ticket (térmica o PDF)"
                    disabled={isPrinting}
                    onClick={() => void handlePrintSale(sale)}
                  >
                    <Printer size={16} />
                  </button>
                  <button
                    type="button"
                    className="action-btn"
                    title="Cargar al carrito para editar y cobrar de nuevo"
                    disabled={!onRecoverSaleToCart}
                    onClick={() => handleRecoverSale(sale)}
                  >
                    <ShoppingCart size={16} />
                  </button>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="reports-analytics">
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Tendencia de Ventas</h3>
          <div className="trend-chart">
            <div className="trend-line">
              {filteredSales.slice(0, 7).map((sale, index) => (
                <div 
                  key={index}
                  className="trend-point"
                  style={{ 
                    height: `${(sale.total / Math.max(...filteredSales.map(s => s.total))) * 100}%`
                  }}
                  title={`$${sale.total.toFixed(2)} - ${new Date(sale.date).toLocaleDateString()}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Distribución por Categorías</h3>
          <div className="category-chart">
            {Object.entries(categoryStats).map(([cat, quantity]) => (
              <div key={cat} className="category-bar">
                <span className="category-name">{cat}</span>
                <div className="category-bar-container">
                  <div 
                    className="category-bar-fill"
                    style={{ 
                      width: `${(quantity / Math.max(...Object.values(categoryStats))) * 100}%`
                    }}
                  />
                </div>
                <span className="category-quantity">{quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const loadStats = async () => {
    // Check cache first - only use cache if data hasn't changed
    if (statsCache && view === 'stats' && statsCache.totalSales === totalSales) {
      return;
    }

    setIsStatsLoading(true);
    try {
      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Stats are already calculated from filteredSales
      // Cache the results
      setStatsCache({
        totalSales,
        totalRevenue,
        averageOrderValue: averageTicket,
        totalTickets,
        paymentMethodStats,
        topProducts: topProductsArrayWithRevenue
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setIsStatsLoading(false);
    }
  };

  // Invalidate cache when filteredSales changes
  useEffect(() => {
    if (statsCache && statsCache.totalSales !== totalSales) {
      setStatsCache(null);
    }
  }, [totalSales, statsCache]);

  useEffect(() => {
    if (view === 'stats' && isOpen) {
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, isOpen]);

  const renderStats = () => {
    const stats = statsCache || {
      totalSales,
      totalRevenue,
      averageOrderValue: averageTicket,
      totalTickets,
      paymentMethodStats,
      topProducts: topProductsArrayWithRevenue
    };

    if (isStatsLoading) {
      return (
        <div className="stats-loading">
          <RefreshCw size={32} className="spinning" />
          <p>Cargando estadísticas...</p>
        </div>
      );
    }

    return (
      <div className="stats-view">
        {/* Key Metrics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#3b82f6' }}>
              <ShoppingCart size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.totalSales}</h3>
              <p>Total Sales</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#059669' }}>
              <DollarSign size={24} />
            </div>
            <div className="stat-info">
              <h3>${stats.totalRevenue.toFixed(2)}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f59e0b' }}>
              <TrendingUp size={24} />
            </div>
            <div className="stat-info">
              <h3>${stats.averageOrderValue.toFixed(2)}</h3>
              <p>Average Order Value</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#8b5cf6' }}>
              <FileText size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.totalTickets}</h3>
              <p>Total Tickets</p>
            </div>
          </div>
        </div>

        {/* Sales by Payment Method Section */}
        <div className="stats-section">
          <h3>Sales by Payment Method</h3>
          <div className="payment-methods-stats">
            {Object.entries(stats.paymentMethodStats).map(([method, count]) => (
              <div key={method} className="payment-method-stat">
                <div className="payment-method-header">
                  <div 
                    className="payment-method-indicator"
                    style={{ backgroundColor: getPaymentMethodColor(method) }}
                  />
                  <span className="payment-method-name">{getPaymentMethodName(method)}</span>
                </div>
                <div className="payment-method-count">
                  <strong>{count as number}</strong>
                  <span>transactions</span>
                </div>
              </div>
            ))}
            {Object.keys(stats.paymentMethodStats).length === 0 && (
              <div className="empty-state">
                <p>No payment method data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products Performance Section */}
        <div className="stats-section">
          <h3>Top Products</h3>
          <div className="top-products-stats">
            {stats.topProducts.length > 0 ? (
              <table className="top-products-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topProducts.map(([productName, data]: [string, { quantity: number; revenue: number }]) => (
                    <tr key={productName}>
                      <td className="product-name">{productName}</td>
                      <td className="product-quantity">{data.quantity}</td>
                      <td className="product-revenue">${data.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>No product data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const cooldownRemaining = () => {
    const last = getLastBlockGeneration();
    if (!last) return 0;
    const elapsed = Date.now() - last;
    return Math.max(0, Math.ceil((COOLDOWN_MS - elapsed) / 60000));
  };

  const COOLDOWN_MS = 60 * 60 * 1000; // 1 hora
  const canGenerateBlock = cooldownRemaining() === 0;
  const cooldownMins = cooldownRemaining();

  const blockDateOptions = [getTodayDate(), ...getUniqueDates().filter((d) => d !== getTodayDate())];

  const renderHistory = () => (
    <div className="reports-history">
      <div className="history-header">
        <div className="history-actions">
          <select
            className="date-select"
            value={selectedBlockDate}
            onChange={(e) => setSelectedBlockDate(e.target.value)}
            style={{ marginRight: 8 }}
          >
            {blockDateOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button
            className="btn-primary"
            onClick={() => handleGenerateDailyBlock(selectedBlockDate)}
            disabled={isGeneratingBlock || !canGenerateBlock}
            title={!canGenerateBlock ? `Cooldown: espera ${cooldownMins} min` : ''}
          >
            {isGeneratingBlock
              ? 'Generando...'
              : !canGenerateBlock
                ? `Cooldown ${cooldownMins} min`
                : 'Generar Bloque Diario'}
          </button>
          <button
            className="btn-secondary"
            onClick={handleVerifyChain}
            disabled={isVerifying || blocks.length === 0}
          >
            <Shield size={16} />
            Verificar Cadena
          </button>
        </div>
        {verificationResult && (
          <div className={`verification-result ${verificationResult.valid ? 'valid' : 'invalid'}`}>
            {verificationResult.valid ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>
              {verificationResult.valid 
                ? 'Verificación exitosa' 
                : `Errores: ${verificationResult.errors.join(', ')}`}
            </span>
          </div>
        )}
      </div>

      <div className="history-content">
        <div className="blocks-section">
          <h3>Bloques Diarios</h3>
          {blocks.length === 0 ? (
            <div className="empty-state">
              <Layers size={48} />
              <p>No hay bloques generados</p>
              <p className="empty-state-hint">Genera un bloque diario para comenzar</p>
            </div>
          ) : (
            <div className="blocks-list">
              {blocks.map(block => (
                <div 
                  key={block.id} 
                  className={`block-card ${selectedBlock?.id === block.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedBlock(block);
                    setSelectedTransaction(null);
                    setMerkleProof(null);
                  }}
                >
                  <div className="block-header">
                    <div className="block-info">
                      <h4>Bloque {new Date(block.date).toLocaleDateString()}</h4>
                      <span className="block-id">{block.id}</span>
                    </div>
                    <button
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVerifyBlock(block);
                      }}
                      disabled={isVerifying}
                    >
                      <Shield size={16} />
                    </button>
                  </div>
                  <div className="block-details">
                    <div className="block-detail-item">
                      <span>Transacciones:</span>
                      <strong>{block.transactions.length}</strong>
                    </div>
                    <div className="block-detail-item">
                      <span>Merkle Root:</span>
                      <code className="hash-code">{block.merkleRoot.substring(0, 16)}...</code>
                    </div>
                    <div className="block-detail-item">
                      <span>Block Hash:</span>
                      <code className="hash-code">{block.blockHash.substring(0, 16)}...</code>
                    </div>
                    {block.previousBlockHash && (
                      <div className="block-detail-item">
                        <span>Previous Block:</span>
                        <code className="hash-code">{block.previousBlockHash.substring(0, 16)}...</code>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedBlock && (
          <div className="block-details-section">
            <div className="section-header">
              <h3>Detalles del Bloque</h3>
              <button className="close-btn" onClick={() => setSelectedBlock(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="block-full-details">
              <div className="detail-group">
                <label>ID del Bloque:</label>
                <div className="hash-display">
                  <code>{selectedBlock.id}</code>
                  <button className="copy-btn" onClick={() => copyToClipboard(selectedBlock.id)}>
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div className="detail-group">
                <label>Fecha:</label>
                <span>{new Date(selectedBlock.date).toLocaleDateString()}</span>
              </div>
              <div className="detail-group">
                <label>Merkle Root:</label>
                <div className="hash-display">
                  <code>{selectedBlock.merkleRoot}</code>
                  <button className="copy-btn" onClick={() => copyToClipboard(selectedBlock.merkleRoot)}>
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div className="detail-group">
                <label>Block Hash:</label>
                <div className="hash-display">
                  <code>{selectedBlock.blockHash}</code>
                  <button className="copy-btn" onClick={() => copyToClipboard(selectedBlock.blockHash)}>
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              {selectedBlock.previousBlockHash && (
                <div className="detail-group">
                  <label>Previous Block Hash:</label>
                  <div className="hash-display">
                    <code>{selectedBlock.previousBlockHash}</code>
                    <button className="copy-btn" onClick={() => copyToClipboard(selectedBlock.previousBlockHash!)}>
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              )}
              <div className="transactions-list">
                <h4>Transacciones ({selectedBlock.transactions.length})</h4>
                {selectedBlock.transactions.map(tx => (
                  <div
                    key={tx.id}
                    className={`transaction-item ${selectedTransaction?.id === tx.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedTransaction(tx);
                      handleVerifyTransaction(tx);
                    }}
                  >
                    <div className="transaction-header">
                      <span className="transaction-id">{tx.id}</span>
                      <span className={`action-badge ${tx.action}`}>{tx.action}</span>
                    </div>
                    <div className="transaction-details">
                      <span>Venta #{tx.saleId}</span>
                      <span>{new Date(tx.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="transaction-hash">
                      <code>{tx.hash.substring(0, 24)}...</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTransaction && merkleProof && (
          <div className="merkle-proof-section">
            <div className="section-header">
              <h3>Prueba de Merkle</h3>
              <button className="close-btn" onClick={() => setMerkleProof(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="merkle-proof-details">
              <div className="detail-group">
                <label>Transaction Hash:</label>
                <div className="hash-display">
                  <code>{merkleProof.transactionHash}</code>
                  <button className="copy-btn" onClick={() => copyToClipboard(merkleProof.transactionHash)}>
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div className="detail-group">
                <label>Merkle Root:</label>
                <div className="hash-display">
                  <code>{merkleProof.merkleRoot}</code>
                  <button className="copy-btn" onClick={() => copyToClipboard(merkleProof.merkleRoot)}>
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div className="detail-group">
                <label>Leaf Index:</label>
                <span>{merkleProof.leafIndex}</span>
              </div>
              <div className="detail-group">
                <label>Proof Path ({merkleProof.proof.length} hashes):</label>
                <div className="proof-path">
                  {merkleProof.proof.map((hash, index) => (
                    <div key={index} className="proof-hash">
                      <code>{hash}</code>
                      <button className="copy-btn" onClick={() => copyToClipboard(hash)}>
                        <Copy size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {verificationResult && (
                <div className={`verification-status ${verificationResult.valid ? 'valid' : 'invalid'}`}>
                  {verificationResult.valid ? (
                    <>
                      <CheckCircle size={20} />
                      <span>Prueba de Merkle válida</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={20} />
                      <span>Prueba de Merkle inválida</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="reports-detailed">
      <p style={{ marginBottom: '1rem', color: 'var(--bs-dark-text-muted, #64748b)', fontSize: '0.9rem' }}>
        Listado local de clientes. El <strong>estado</strong> (Nuevo, Activo, Frecuente, VIP, Inactivo) se recalcula al
        completar una venta desde el carrito con un cliente del listado.
      </p>
      <div className="sales-table-container">
        <table className="sales-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Pedidos</th>
              <th>Total gastado</th>
              <th>Última compra</th>
            </tr>
          </thead>
          <tbody>
            {registryCustomers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem' }}>
                  No hay clientes en el registro. Gestiona clientes en el menú Clientes.
                </td>
              </tr>
            ) : (
              registryCustomers.map((c) => (
                <tr key={c.id}>
                  <td>{getCustomerFullName(c)}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--bs-primary, #3b82f6)' }}>
                      {getCustomerStatusLabel(c.customerStatus)}
                    </span>
                  </td>
                  <td>{c.totalOrders}</td>
                  <td>${c.totalSpent.toFixed(2)}</td>
                  <td>{c.lastPurchase ? new Date(c.lastPurchase).toLocaleString('es-MX') : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="reports-detailed">
      <p style={{ marginBottom: '1rem', color: 'var(--bs-dark-text-muted, #64748b)', fontSize: '0.9rem' }}>
        Historial de <strong>accesos con PIN</strong> (desbloqueo / bloqueo) y <strong>ventas por usuario</strong> de la
        sesión. Con el servidor local activo (`npm run dev:server`) los datos se guardan también en{' '}
        <code>server/data/local-activity.db</code>; siempre hay copia en localStorage como respaldo.
      </p>
      {getActivityShopId() === 'local-unconfigured' ? (
        <p style={{ color: '#b45309' }}>
          Configura el Shop ID en Configuración para etiquetar el registro con tu tienda (los datos locales siguen
          guardándose).
        </p>
      ) : null}
      {activityLoading ? (
        <p style={{ color: 'var(--bs-dark-text-muted)' }}>Cargando actividad…</p>
      ) : (
        <>
          <h4 style={{ marginTop: '0.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} /> Sesiones (PIN)
          </h4>
          <div className="sales-table-container" style={{ marginBottom: '1.5rem' }}>
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Evento</th>
                  <th>Usuario / rol</th>
                  <th>Origen</th>
                </tr>
              </thead>
              <tbody>
                {sessionEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '1rem' }}>
                      Sin eventos de sesión aún.
                    </td>
                  </tr>
                ) : (
                  sessionEvents.map((e) => (
                    <tr key={e.id}>
                      <td>{new Date(e.created_at).toLocaleString('es-MX')}</td>
                      <td>{e.event_type === 'unlock' ? 'Desbloqueo' : 'Bloqueo'}</td>
                      <td>
                        {[e.name, e.role].filter(Boolean).join(' · ') || e.email || '—'}
                      </td>
                      <td>
                        {e.source === 'legacy'
                          ? 'Código legacy'
                          : e.source === 'super'
                            ? 'Superusuario'
                            : 'Rol'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={18} /> Ventas por cajero
          </h4>
          <div className="sales-table-container">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Pago</th>
                  <th>Cajero</th>
                  <th>Transacción</th>
                  <th>Ítems</th>
                </tr>
              </thead>
              <tbody>
                {saleCashierEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>
                      Sin ventas registradas con cajero aún.
                    </td>
                  </tr>
                ) : (
                  saleCashierEvents.map((s) => (
                    <tr key={s.id}>
                      <td>{new Date(s.created_at).toLocaleString('es-MX')}</td>
                      <td>${Number(s.total).toFixed(2)}</td>
                      <td>{s.payment_method || '—'}</td>
                      <td>
                        {[s.cashier_name, s.cashier_role].filter(Boolean).join(' · ') ||
                          (s.cashier_source === 'legacy'
                            ? 'Código legacy'
                            : s.cashier_source === 'super'
                              ? 'Superusuario'
                              : '—')}
                      </td>
                      <td>
                        <code style={{ fontSize: '0.75rem' }}>{s.transaction_id || '—'}</code>
                      </td>
                      <td style={{ maxWidth: 220, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                        {s.items_summary || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="reports-overlay">
      <div className="reports-modal">
        <div className="reports-header">
          <h2>Ventas</h2>
          <div className="header-actions">
            {isShopIdConfigured() && (
              <button 
                className="action-btn" 
                title="Cargar desde Servidor"
                onClick={loadSalesFromServer}
                disabled={isLoading}
              >
                <CloudDownload size={20} />
              </button>
            )}
            <button className="action-btn" title="Actualizar" onClick={() => {
              const sampleSales = generateSampleSales();
              setSales(sampleSales);
              setFilteredSales(sampleSales);
            }}>
              <RefreshCw size={20} />
            </button>
            <button className="action-btn" title="Exportar">
              <Download size={20} />
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="reports-content">
          {/* Filtros */}
          <div className="reports-filters">
            <div className="filter-group">
              <label>Rango de fechas:</label>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                <option value="1d">Último día</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Método de pago:</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="all">Todos</option>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="crypto">Crypto</option>
                <option value="codi">CODI</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Categoría:</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">Todas</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Panadería">Panadería</option>
                <option value="Comida">Comida</option>
                <option value="Postres">Postres</option>
              </select>
            </div>
          </div>

          {/* Navegación de vistas */}
          <div className="view-tabs">
            <button 
              className={`view-tab ${view === 'summary' ? 'active' : ''}`}
              onClick={() => setView('summary')}
            >
              <BarChart3 size={20} />
              Resumen
            </button>
            <button 
              className={`view-tab ${view === 'stats' ? 'active' : ''}`}
              onClick={() => setView('stats')}
            >
              <Activity size={20} />
              Stats
            </button>
            <button 
              className={`view-tab ${view === 'detailed' ? 'active' : ''}`}
              onClick={() => setView('detailed')}
            >
              <FileText size={20} />
              Detallado
            </button>
            <button 
              className={`view-tab ${view === 'analytics' ? 'active' : ''}`}
              onClick={() => setView('analytics')}
            >
              <TrendingUp size={20} />
              Análisis
            </button>
            <button 
              className={`view-tab ${view === 'history' ? 'active' : ''}`}
              onClick={() => setView('history')}
            >
              <History size={20} />
              Historia
            </button>
            <button
              className={`view-tab ${view === 'customers' ? 'active' : ''}`}
              onClick={() => setView('customers')}
            >
              <Users size={20} />
              Clientes
            </button>
            <button
              className={`view-tab ${view === 'activity' ? 'active' : ''}`}
              onClick={() => setView('activity')}
            >
              <Shield size={20} />
              Actividad
            </button>
          </div>

          {/* Contenido de la vista */}
          <div className="view-content">
            {view === 'summary' && renderSummary()}
            {view === 'stats' && renderStats()}
            {view === 'detailed' && renderDetailed()}
            {view === 'analytics' && renderAnalytics()}
            {view === 'history' && renderHistory()}
            {view === 'customers' && renderCustomers()}
            {view === 'activity' && renderActivity()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReports; 