import { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  BarChart3,
  Tag,
  DollarSign,
  Hash,
  FileText,
  ImageIcon,
  Upload,
  Download,
  RefreshCw
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  cost: number;
  category: string;
  stock: number;
  minStock: number;
  maxStock: number;
  barcode: string;
  sku: string;
  unit: string;
  supplier: string;
  location: string;
  isActive: boolean;
  image?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProductManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = ['Bebidas', 'Panadería', 'Comida', 'Postres', 'Snacks', 'Bebidas Alcohólicas', 'Otros'];
const units = ['unidad', 'kg', 'g', 'l', 'ml', 'paquete', 'caja', 'botella', 'taza'];
const suppliers = ['Proveedor A', 'Proveedor B', 'Proveedor C', 'Distribuidor Local', 'Importador XYZ'];

// Datos de ejemplo para productos
const generateSampleProducts = (): Product[] => {
  const products: Product[] = [
    {
      id: 1,
      name: 'Café Americano',
      description: 'Café negro tradicional preparado con granos de alta calidad, perfecto para comenzar el día.',
      price: 2.50,
      cost: 1.20,
      category: 'Bebidas',
      stock: 50,
      minStock: 10,
      maxStock: 100,
      barcode: '1234567890123',
      sku: 'CAF-AM-001',
      unit: 'taza',
      supplier: 'Proveedor A',
      location: 'Estante A1',
      isActive: true,
      tags: ['café', 'bebida caliente', 'tradicional'],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      name: 'Café Latte',
      description: 'Café espresso con leche cremosa y espuma suave, ideal para los amantes del café con leche.',
      price: 3.50,
      cost: 1.80,
      category: 'Bebidas',
      stock: 45,
      minStock: 15,
      maxStock: 80,
      barcode: '1234567890124',
      sku: 'CAF-LT-002',
      unit: 'taza',
      supplier: 'Proveedor A',
      location: 'Estante A1',
      isActive: true,
      tags: ['café', 'leche', 'espresso'],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 3,
      name: 'Croissant Clásico',
      description: 'Croissant artesanal horneado diariamente, con capas crujientes y mantequilla de alta calidad.',
      price: 2.00,
      cost: 0.80,
      category: 'Panadería',
      stock: 30,
      minStock: 5,
      maxStock: 50,
      barcode: '1234567890125',
      sku: 'PAN-CR-003',
      unit: 'unidad',
      supplier: 'Proveedor B',
      location: 'Estante B2',
      isActive: true,
      tags: ['panadería', 'croissant', 'artesanal'],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 4,
      name: 'Sándwich de Pollo',
      description: 'Sándwich fresco con pechuga de pollo a la plancha, lechuga, tomate y mayonesa casera.',
      price: 5.50,
      cost: 2.50,
      category: 'Comida',
      stock: 20,
      minStock: 8,
      maxStock: 40,
      barcode: '1234567890126',
      sku: 'COM-SP-004',
      unit: 'unidad',
      supplier: 'Proveedor C',
      location: 'Refrigerador C1',
      isActive: true,
      tags: ['sándwich', 'pollo', 'fresco'],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 5,
      name: 'Tarta de Manzana',
      description: 'Tarta casera de manzana con masa quebrada y relleno de manzanas caramelizadas.',
      price: 3.50,
      cost: 1.50,
      category: 'Postres',
      stock: 15,
      minStock: 3,
      maxStock: 25,
      barcode: '1234567890127',
      sku: 'POS-TM-005',
      unit: 'rebanada',
      supplier: 'Proveedor B',
      location: 'Estante D3',
      isActive: true,
      tags: ['postre', 'tarta', 'manzana'],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    }
  ];
  
  return products;
};

const ProductManagement = ({ isOpen, onClose }: ProductManagementProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [view, setView] = useState<'list' | 'grid' | 'analytics'>('list');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});

  useEffect(() => {
    if (isOpen) {
      const sampleProducts = generateSampleProducts();
      setProducts(sampleProducts);
      setFilteredProducts(sampleProducts);
    }
  }, [isOpen]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory, stockFilter]);

  const filterProducts = () => {
    let filtered = [...products];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode.includes(searchTerm)
      );
    }

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filtrar por stock
    switch (stockFilter) {
      case 'low':
        filtered = filtered.filter(product => product.stock <= product.minStock);
        break;
      case 'out':
        filtered = filtered.filter(product => product.stock === 0);
        break;
      case 'active':
        filtered = filtered.filter(product => product.isActive);
        break;
      case 'inactive':
        filtered = filtered.filter(product => !product.isActive);
        break;
    }

    setFilteredProducts(filtered);
  };

  const handleAddProduct = () => {
    setEditingProduct({
      name: '',
      description: '',
      price: 0,
      cost: 0,
      category: 'Bebidas',
      stock: 0,
      minStock: 0,
      maxStock: 100,
      barcode: '',
      sku: '',
      unit: 'unidad',
      supplier: 'Proveedor A',
      location: '',
      isActive: true,
      tags: []
    });
    setIsAddModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditingProduct({ ...product });
    setIsEditModalOpen(true);
  };

  const handleSaveProduct = () => {
    if (isAddModalOpen) {
      const newProduct: Product = {
        ...editingProduct as Product,
        id: Math.max(...products.map(p => p.id)) + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setProducts([...products, newProduct]);
      setIsAddModalOpen(false);
    } else if (isEditModalOpen && selectedProduct) {
      const updatedProducts = products.map(p =>
        p.id === selectedProduct.id
          ? { ...editingProduct as Product, updatedAt: new Date().toISOString() }
          : p
      );
      setProducts(updatedProducts);
      setIsEditModalOpen(false);
      setSelectedProduct(null);
    }
    setEditingProduct({});
  };

  const handleDeleteProduct = (productId: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  const handleStockUpdate = (productId: number, newStock: number) => {
    setProducts(products.map(p =>
      p.id === productId ? { ...p, stock: newStock, updatedAt: new Date().toISOString() } : p
    ));
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { status: 'out', color: '#dc2626', text: 'Sin stock' };
    if (product.stock <= product.minStock) return { status: 'low', color: '#f59e0b', text: 'Stock bajo' };
    if (product.stock >= product.maxStock * 0.8) return { status: 'high', color: '#059669', text: 'Stock alto' };
    return { status: 'normal', color: '#3b82f6', text: 'Stock normal' };
  };

  const renderProductForm = () => (
    <div className="product-form-modal">
      <div className="form-header">
        <h3>{isAddModalOpen ? 'Agregar Producto' : 'Editar Producto'}</h3>
        <button className="close-btn" onClick={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingProduct({});
        }}>
          <X size={20} />
        </button>
      </div>
      
      <div className="form-content">
        <div className="form-grid">
          <div className="form-group">
            <label>Nombre del producto *</label>
            <input
              type="text"
              value={editingProduct.name || ''}
              onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
              placeholder="Ej: Café Americano"
            />
          </div>

          <div className="form-group">
            <label>Categoría *</label>
            <select
              value={editingProduct.category || 'Bebidas'}
              onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group full-width">
            <label>Descripción</label>
            <textarea
              value={editingProduct.description || ''}
              onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
              placeholder="Descripción detallada del producto..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Precio de venta *</label>
            <input
              type="number"
              step="0.01"
              value={editingProduct.price || ''}
              onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label>Costo *</label>
            <input
              type="number"
              step="0.01"
              value={editingProduct.cost || ''}
              onChange={(e) => setEditingProduct({...editingProduct, cost: parseFloat(e.target.value)})}
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label>Stock actual *</label>
            <input
              type="number"
              value={editingProduct.stock || ''}
              onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})}
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label>Stock mínimo</label>
            <input
              type="number"
              value={editingProduct.minStock || ''}
              onChange={(e) => setEditingProduct({...editingProduct, minStock: parseInt(e.target.value)})}
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label>Stock máximo</label>
            <input
              type="number"
              value={editingProduct.maxStock || ''}
              onChange={(e) => setEditingProduct({...editingProduct, maxStock: parseInt(e.target.value)})}
              placeholder="100"
            />
          </div>

          <div className="form-group">
            <label>Unidad</label>
            <select
              value={editingProduct.unit || 'unidad'}
              onChange={(e) => setEditingProduct({...editingProduct, unit: e.target.value})}
            >
              {units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Código de barras</label>
            <input
              type="text"
              value={editingProduct.barcode || ''}
              onChange={(e) => setEditingProduct({...editingProduct, barcode: e.target.value})}
              placeholder="1234567890123"
            />
          </div>

          <div className="form-group">
            <label>SKU</label>
            <input
              type="text"
              value={editingProduct.sku || ''}
              onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})}
              placeholder="PROD-001"
            />
          </div>

          <div className="form-group">
            <label>Proveedor</label>
            <select
              value={editingProduct.supplier || 'Proveedor A'}
              onChange={(e) => setEditingProduct({...editingProduct, supplier: e.target.value})}
            >
              {suppliers.map(supplier => (
                <option key={supplier} value={supplier}>{supplier}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Ubicación</label>
            <input
              type="text"
              value={editingProduct.location || ''}
              onChange={(e) => setEditingProduct({...editingProduct, location: e.target.value})}
              placeholder="Estante A1"
            />
          </div>

          <div className="form-group">
            <label>Estado</label>
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="isActive"
                checked={editingProduct.isActive !== false}
                onChange={(e) => setEditingProduct({...editingProduct, isActive: e.target.checked})}
              />
              <label htmlFor="isActive">Producto activo</label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-secondary" onClick={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            setEditingProduct({});
          }}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSaveProduct}>
            <Save size={16} />
            Guardar Producto
          </button>
        </div>
      </div>
    </div>
  );

  const renderProductList = () => (
    <div className="products-list">
      <table className="products-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Stock</th>
            <th>Precio</th>
            <th>SKU</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map(product => {
            const stockStatus = getStockStatus(product);
            return (
              <tr key={product.id}>
                <td>
                  <div className="product-info">
                    <div className="product-image">
                      {product.image ? (
                        <img src={product.image} alt={product.name} />
                      ) : (
                        <Package size={24} />
                      )}
                    </div>
                    <div>
                      <div className="product-name">{product.name}</div>
                      <div className="product-description">{product.description.substring(0, 50)}...</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="category-badge">{product.category}</span>
                </td>
                <td>
                  <div className="stock-info">
                    <span className="stock-amount">{product.stock}</span>
                    <span className="stock-unit">{product.unit}</span>
                    <div 
                      className="stock-indicator"
                      style={{ backgroundColor: stockStatus.color }}
                      title={stockStatus.text}
                    />
                  </div>
                </td>
                <td>
                  <div className="price-info">
                    <span className="price">${product.price.toFixed(2)}</span>
                    <span className="cost">Costo: ${product.cost.toFixed(2)}</span>
                  </div>
                </td>
                <td>
                  <span className="sku">{product.sku}</span>
                </td>
                <td>
                  <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                    {product.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn" onClick={() => handleEditProduct(product)} title="Editar">
                      <Edit size={16} />
                    </button>
                    <button className="action-btn" onClick={() => handleDeleteProduct(product.id)} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderProductGrid = () => (
    <div className="products-grid">
      {filteredProducts.map(product => {
        const stockStatus = getStockStatus(product);
        return (
          <div key={product.id} className="product-card">
            <div className="product-card-header">
              <div className="product-image">
                {product.image ? (
                  <img src={product.image} alt={product.name} />
                ) : (
                  <Package size={32} />
                )}
              </div>
              <div className="product-status">
                <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                  {product.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
            
            <div className="product-card-content">
              <h3 className="product-name">{product.name}</h3>
              <p className="product-description">{product.description.substring(0, 80)}...</p>
              
              <div className="product-details">
                <div className="detail-row">
                  <span className="label">Categoría:</span>
                  <span className="value">{product.category}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Stock:</span>
                  <span className="value">
                    {product.stock} {product.unit}
                    <div 
                      className="stock-indicator"
                      style={{ backgroundColor: stockStatus.color }}
                    />
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Precio:</span>
                  <span className="value price">${product.price.toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">SKU:</span>
                  <span className="value sku">{product.sku}</span>
                </div>
              </div>
            </div>
            
            <div className="product-card-actions">
              <button className="btn-secondary" onClick={() => handleEditProduct(product)}>
                <Edit size={16} />
                Editar
              </button>
              <button className="btn-danger" onClick={() => handleDeleteProduct(product.id)}>
                <Trash2 size={16} />
                Eliminar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderAnalytics = () => {
    const categoryStats = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const stockAlerts = products.filter(p => p.stock <= p.minStock);
    const outOfStock = products.filter(p => p.stock === 0);
    const totalValue = products.reduce((sum, p) => sum + (p.stock * p.cost), 0);

    return (
      <div className="analytics-view">
        <div className="analytics-stats">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#3b82f6' }}>
              <Package size={24} />
            </div>
            <div className="stat-info">
              <h3>{products.length}</h3>
              <p>Total Productos</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dc2626' }}>
              <AlertTriangle size={24} />
            </div>
            <div className="stat-info">
              <h3>{stockAlerts.length}</h3>
              <p>Stock Bajo</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f59e0b' }}>
              <X size={24} />
            </div>
            <div className="stat-info">
              <h3>{outOfStock.length}</h3>
              <p>Sin Stock</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#059669' }}>
              <DollarSign size={24} />
            </div>
            <div className="stat-info">
              <h3>${totalValue.toFixed(2)}</h3>
              <p>Valor Inventario</p>
            </div>
          </div>
        </div>

        <div className="analytics-charts">
          <div className="chart-container">
            <h3>Productos por Categoría</h3>
            <div className="category-chart">
              {Object.entries(categoryStats).map(([category, count]) => (
                <div key={category} className="category-bar">
                  <span className="category-name">{category}</span>
                  <div className="category-bar-container">
                    <div 
                      className="category-bar-fill"
                      style={{ 
                        width: `${(count / Math.max(...Object.values(categoryStats))) * 100}%`
                      }}
                    />
                  </div>
                  <span className="category-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-container">
            <h3>Alertas de Stock</h3>
            <div className="stock-alerts">
              {stockAlerts.slice(0, 5).map(product => (
                <div key={product.id} className="stock-alert-item">
                  <div className="alert-info">
                    <span className="product-name">{product.name}</span>
                    <span className="stock-info">
                      Stock: {product.stock} / Mín: {product.minStock}
                    </span>
                  </div>
                  <button 
                    className="btn-small"
                    onClick={() => handleStockUpdate(product.id, product.minStock + 10)}
                  >
                    +10
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="product-management-overlay">
      <div className="product-management-modal">
        <div className="management-header">
          <h2>Gestión de Productos</h2>
          <div className="header-actions">
            <button className="action-btn" title="Actualizar">
              <RefreshCw size={20} />
            </button>
            <button className="action-btn" title="Exportar">
              <Download size={20} />
            </button>
            <button className="btn-primary" onClick={handleAddProduct}>
              <Plus size={20} />
              Agregar Producto
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="management-content">
          {/* Filtros y búsqueda */}
          <div className="filters-section">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Buscar productos por nombre, descripción, SKU o código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-controls">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="all">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                <option value="all">Todos los productos</option>
                <option value="low">Stock bajo</option>
                <option value="out">Sin stock</option>
                <option value="active">Solo activos</option>
                <option value="inactive">Solo inactivos</option>
              </select>
            </div>
          </div>

          {/* Navegación de vistas */}
          <div className="view-tabs">
            <button 
              className={`view-tab ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              <FileText size={20} />
              Lista
            </button>
            <button 
              className={`view-tab ${view === 'grid' ? 'active' : ''}`}
              onClick={() => setView('grid')}
            >
              <Package size={20} />
              Cuadrícula
            </button>
            <button 
              className={`view-tab ${view === 'analytics' ? 'active' : ''}`}
              onClick={() => setView('analytics')}
            >
              <BarChart3 size={20} />
              Análisis
            </button>
          </div>

          {/* Contenido de la vista */}
          <div className="view-content">
            {view === 'list' && renderProductList()}
            {view === 'grid' && renderProductGrid()}
            {view === 'analytics' && renderAnalytics()}
          </div>
        </div>
      </div>

      {/* Modales */}
      {(isAddModalOpen || isEditModalOpen) && renderProductForm()}
    </div>
  );
};

export default ProductManagement; 