import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  FileText,
  PieChart,
  Activity,
  X
} from 'lucide-react';

interface Sale {
  id: number;
  date: string;
  items: Array<{
    product: {
      id: number;
      name: string;
      price: number;
      category: string;
    };
    quantity: number;
  }>;
  total: number;
  paymentMethod: string;
  change: number;
}

interface SalesReportsProps {
  isOpen: boolean;
  onClose: () => void;
}

// Datos de ejemplo para reportes
const generateSampleSales = (): Sale[] => {
  const sales: Sale[] = [];
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
      change: Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0
    });
  }
  
  return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const SalesReports = ({ isOpen, onClose }: SalesReportsProps) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [dateRange, setDateRange] = useState('7d');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [category, setCategory] = useState('all');
  const [view, setView] = useState<'summary' | 'detailed' | 'analytics'>('summary');

  useEffect(() => {
    if (isOpen) {
      const sampleSales = generateSampleSales();
      setSales(sampleSales);
      setFilteredSales(sampleSales);
    }
  }, [isOpen]);

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
        sale.items.some(item => item.product.category === category)
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
      acc[item.product.category] = (acc[item.product.category] || 0) + item.quantity;
    });
    return acc;
  }, {} as { [key: string]: number });

  const topProducts = filteredSales.reduce((acc, sale) => {
    sale.items.forEach(item => {
      acc[item.product.name] = (acc[item.product.name] || 0) + item.quantity;
    });
    return acc;
  }, {} as { [key: string]: number });

  const topProductsArray = Object.entries(topProducts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

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
            {filteredSales.map(sale => (
              <tr key={sale.id}>
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
                  <button className="action-btn" title="Ver detalles">
                    <Eye size={16} />
                  </button>
                  <button className="action-btn" title="Generar ticket">
                    <FileText size={16} />
                  </button>
                </td>
              </tr>
            ))}
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

  if (!isOpen) return null;

  return (
    <div className="reports-overlay">
      <div className="reports-modal">
        <div className="reports-header">
          <h2>Reportes de Ventas</h2>
          <div className="header-actions">
            <button className="action-btn" title="Actualizar">
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
          </div>

          {/* Contenido de la vista */}
          <div className="view-content">
            {view === 'summary' && renderSummary()}
            {view === 'detailed' && renderDetailed()}
            {view === 'analytics' && renderAnalytics()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReports; 