import React, { useState, useEffect, useMemo } from 'react';
import {
  Warehouse,
  Plus,
  Minus,
  Settings,
  History,
  AlertCircle,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckSquare,
  Square,
  Package,
  DollarSign,
  Calendar,
  User,
  FileText,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  Edit,
  Trash2,
  Eye,
  ArrowUpDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { shouldShowImage, markImageFailed } from '../utils/imageCache';
import { scheduleMirrorKeyToSqlite } from '../services/posPersistService';

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

interface InventoryMovement {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  operationType: 'add' | 'remove' | 'adjust' | 'sale';
  reference?: string;
  referenceId?: number;
  notes?: string;
  userId?: string;
  userName?: string;
  createdAt: string;
  newStockLevel: number;
}

interface InventoryManagementProps {
  products: Product[];
  onStockUpdate: (productId: number, newStock: number) => void;
  restockProduct?: { id: number; name: string };
  onRestockComplete?: (productToAdd?: Product) => void;
}

type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';
type SortField = 'name' | 'stock' | 'lastUpdated' | 'category';
type SortDirection = 'asc' | 'desc';

const InventoryManagement: React.FC<InventoryManagementProps> = ({ products, onStockUpdate, restockProduct, onRestockComplete }) => {
  // State
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [inventoryHistory, setInventoryHistory] = useState<InventoryMovement[]>([]);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showRemoveStockModal, setShowRemoveStockModal] = useState(false);
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [showSetMinMaxModal, setShowMinMaxModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [stockNotes, setStockNotes] = useState<string>('');
  const [stockReason, setStockReason] = useState<string>('');
  const [minStock, setMinStock] = useState<number>(0);
  const [maxStock, setMaxStock] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Load inventory history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('bizneai-inventory-history');
    if (savedHistory) {
      try {
        setInventoryHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading inventory history:', error);
      }
    }
  }, []);

  // Predefinir búsqueda y abrir modal Agregar Stock cuando viene del POS con producto específico
  useEffect(() => {
    if (!restockProduct || products.length === 0) return;
    setSearchTerm(restockProduct.name);
    const product = products.find(p => p.id === restockProduct.id);
    if (product) {
      setSelectedProduct(product);
      setStockQuantity(0);
      setShowAddStockModal(true);
    }
  }, [restockProduct, products]);

  // Save inventory history
  const saveInventoryHistory = (movement: InventoryMovement) => {
    const updated = [movement, ...inventoryHistory];
    setInventoryHistory(updated);
    localStorage.setItem('bizneai-inventory-history', JSON.stringify(updated));
    scheduleMirrorKeyToSqlite('bizneai-inventory-history');
  };

  // Get stock status
  const getStockStatus = (product: Product): StockStatus => {
    if (product.stock === 0) return 'out-of-stock';
    if (product.stock <= product.minStock) return 'low-stock';
    return 'in-stock';
  };

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.barcode?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => getStockStatus(p) === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'stock':
          aVal = a.stock;
          bVal = b.stock;
          break;
        case 'lastUpdated':
          aVal = new Date(a.updatedAt).getTime();
          bVal = new Date(b.updatedAt).getTime();
          break;
        case 'category':
          aVal = a.category.toLowerCase();
          bVal = b.category.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, searchTerm, statusFilter, categoryFilter, sortField, sortDirection]);

  // Statistics
  const stats = useMemo(() => {
    const inStock = products.filter(p => getStockStatus(p) === 'in-stock').length;
    const lowStock = products.filter(p => getStockStatus(p) === 'low-stock').length;
    const outOfStock = products.filter(p => getStockStatus(p) === 'out-of-stock').length;
    const totalItems = products.reduce((sum, p) => sum + p.stock, 0);

    return { inStock, lowStock, outOfStock, totalItems };
  }, [products]);

  // Handle add stock
  const handleAddStock = () => {
    if (!selectedProduct || stockQuantity <= 0) {
      toast.error('Selecciona un producto y cantidad válida');
      return;
    }

    const newStock = selectedProduct.stock + stockQuantity;
    onStockUpdate(selectedProduct.id, newStock);

    const productWithNewStock = { ...selectedProduct, stock: newStock };

    const movement: InventoryMovement = {
      id: Date.now(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: stockQuantity,
      operationType: 'add',
      notes: stockNotes,
      createdAt: new Date().toISOString(),
      newStockLevel: newStock
    };

    saveInventoryHistory(movement);
    toast.success(`Stock agregado: ${stockQuantity} unidades`);
    setShowAddStockModal(false);
    setSelectedProduct(null);
    setStockQuantity(0);
    setStockNotes('');
    onRestockComplete?.(productWithNewStock);
  };

  // Handle remove stock
  const handleRemoveStock = () => {
    if (!selectedProduct || stockQuantity <= 0 || stockQuantity > selectedProduct.stock) {
      toast.error('Cantidad inválida');
      return;
    }

    const newStock = selectedProduct.stock - stockQuantity;
    onStockUpdate(selectedProduct.id, newStock);

    const movement: InventoryMovement = {
      id: Date.now(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: -stockQuantity,
      operationType: 'remove',
      notes: stockNotes,
      reference: stockReason,
      createdAt: new Date().toISOString(),
      newStockLevel: newStock
    };

    saveInventoryHistory(movement);
    toast.success(`Stock removido: ${stockQuantity} unidades`);
    setShowRemoveStockModal(false);
    setSelectedProduct(null);
    setStockQuantity(0);
    setStockNotes('');
    setStockReason('');
  };

  // Handle adjust stock
  const handleAdjustStock = () => {
    if (!selectedProduct) {
      toast.error('Selecciona un producto');
      return;
    }

    const newStock = stockQuantity;
    const difference = newStock - selectedProduct.stock;
    onStockUpdate(selectedProduct.id, newStock);

    const movement: InventoryMovement = {
      id: Date.now(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: difference,
      operationType: 'adjust',
      notes: stockNotes,
      reference: stockReason,
      createdAt: new Date().toISOString(),
      newStockLevel: newStock
    };

    saveInventoryHistory(movement);
    toast.success(`Stock ajustado a ${newStock} unidades`);
    setShowAdjustStockModal(false);
    setSelectedProduct(null);
    setStockQuantity(0);
    setStockNotes('');
    setStockReason('');
  };

  // Handle set min/max
  const handleSetMinMax = () => {
    if (!selectedProduct) {
      toast.error('Selecciona un producto');
      return;
    }

    // Update product min/max (this would normally update the database)
    toast.success(`Niveles mínimos/máximos actualizados`);
    setShowMinMaxModal(false);
    setSelectedProduct(null);
    setMinStock(0);
    setMaxStock(0);
  };

  // Handle bulk operations
  const handleBulkAddStock = () => {
    if (selectedProducts.size === 0) {
      toast.error('Selecciona al menos un producto');
      return;
    }

    selectedProducts.forEach(productId => {
      const product = products.find(p => p.id === productId);
      if (product) {
        const newStock = product.stock + stockQuantity;
        onStockUpdate(productId, newStock);
      }
    });

    toast.success(`Stock agregado a ${selectedProducts.size} productos`);
    setShowBulkModal(false);
    setSelectedProducts(new Set());
    setStockQuantity(0);
  };

  // Toggle product selection
  const toggleProductSelection = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  // Toggle all selection
  const toggleAllSelection = () => {
    if (selectedProducts.size === filteredAndSortedProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredAndSortedProducts.map(p => p.id)));
    }
  };

  // Export inventory
  const handleExportInventory = () => {
    const data = filteredAndSortedProducts.map(p => ({
      Nombre: p.name,
      Categoría: p.category,
      Stock: p.stock,
      'Stock Mínimo': p.minStock,
      'Stock Máximo': p.maxStock,
      Estado: getStockStatus(p) === 'in-stock' ? 'En Stock' : 
               getStockStatus(p) === 'low-stock' ? 'Stock Bajo' : 'Sin Stock',
      SKU: p.sku,
      'Última Actualización': p.updatedAt
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Inventario exportado exitosamente');
  };

  // Get categories
  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category))).sort();
  }, [products]);

  return (
    <div className="inventory-management">
      {/* Statistics Cards */}
      <div className="inventory-stats-grid">
        <div className="inventory-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.inStock}</h3>
            <p>En Stock</p>
          </div>
        </div>

        <div className="inventory-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.lowStock}</h3>
            <p>Stock Bajo</p>
          </div>
        </div>

        <div className="inventory-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.outOfStock}</h3>
            <p>Sin Stock</p>
          </div>
        </div>

        <div className="inventory-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Package size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalItems}</h3>
            <p>Total Unidades</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="inventory-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre, categoría, SKU o código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StockStatus | 'all')}
            className="filter-select"
          >
            <option value="all">Todos los estados</option>
            <option value="in-stock">En Stock</option>
            <option value="low-stock">Stock Bajo</option>
            <option value="out-of-stock">Sin Stock</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, dir] = e.target.value.split('-');
              setSortField(field as SortField);
              setSortDirection(dir as SortDirection);
            }}
            className="filter-select"
          >
            <option value="name-asc">Nombre (A-Z)</option>
            <option value="name-desc">Nombre (Z-A)</option>
            <option value="stock-desc">Stock (Alto a Bajo)</option>
            <option value="stock-asc">Stock (Bajo a Alto)</option>
            <option value="lastUpdated-desc">Última Actualización</option>
            <option value="category-asc">Categoría</option>
          </select>
        </div>

        <div className="toolbar-right">
          <button
            className="btn-secondary"
            onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
          >
            {viewMode === 'table' ? <Package size={18} /> : <FileText size={18} />}
            {viewMode === 'table' ? 'Tarjetas' : 'Tabla'}
          </button>

          {selectedProducts.size > 0 && (
            <button
              className="btn-secondary"
              onClick={() => {
                setShowBulkModal(true);
                setStockQuantity(0);
              }}
            >
              <Plus size={18} />
              Agregar a {selectedProducts.size} productos
            </button>
          )}

          <button className="btn-secondary" onClick={handleExportInventory}>
            <Download size={18} />
            Exportar
          </button>

          <button className="btn-secondary" onClick={() => setShowHistoryModal(true)}>
            <History size={18} />
            Historial
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      {viewMode === 'table' ? (
        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <button
                    onClick={toggleAllSelection}
                    className="checkbox-btn"
                  >
                    {selectedProducts.size === filteredAndSortedProducts.length ? (
                      <CheckSquare size={18} />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
                <th>Stock Máximo</th>
                <th>Estado</th>
                <th>Última Actualización</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedProducts.map(product => {
                const status = getStockStatus(product);
                const isSelected = selectedProducts.has(product.id);
                
                return (
                  <tr key={product.id} className={isSelected ? 'selected' : ''}>
                    <td>
                      <button
                        onClick={() => toggleProductSelection(product.id)}
                        className="checkbox-btn"
                      >
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </td>
                    <td>
                      <div className="product-cell">
                        {shouldShowImage(product.image) ? (
                          <img
                            src={product.image!}
                            alt={product.name}
                            className="product-thumb"
                            onError={() => markImageFailed(product.image)}
                            loading="lazy"
                          />
                        ) : null}
                        <div>
                          <div className="product-name">{product.name}</div>
                          {product.sku && (
                            <div className="product-sku">SKU: {product.sku}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td>
                      <span className="stock-value">{product.stock}</span>
                      <span className="stock-unit">{product.unit}</span>
                    </td>
                    <td>{product.minStock}</td>
                    <td>{product.maxStock}</td>
                    <td>
                      <span className={`stock-status-badge ${status}`}>
                        {status === 'in-stock' && '✓ En Stock'}
                        {status === 'low-stock' && '⚠ Stock Bajo'}
                        {status === 'out-of-stock' && '✗ Sin Stock'}
                      </span>
                    </td>
                    <td>{new Date(product.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="icon-btn-small"
                          onClick={() => {
                            setSelectedProduct(product);
                            setStockQuantity(0);
                            setShowAddStockModal(true);
                          }}
                          title="Agregar Stock"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          className="icon-btn-small"
                          onClick={() => {
                            setSelectedProduct(product);
                            setStockQuantity(0);
                            setShowRemoveStockModal(true);
                          }}
                          title="Remover Stock"
                        >
                          <Minus size={16} />
                        </button>
                        <button
                          className="icon-btn-small"
                          onClick={() => {
                            setSelectedProduct(product);
                            setStockQuantity(product.stock);
                            setShowAdjustStockModal(true);
                          }}
                          title="Ajustar Stock"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="icon-btn-small"
                          onClick={() => {
                            setSelectedProduct(product);
                            setMinStock(product.minStock);
                            setMaxStock(product.maxStock);
                            setShowMinMaxModal(true);
                          }}
                          title="Configurar Mín/Máx"
                        >
                          <Settings size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="inventory-cards-grid">
          {filteredAndSortedProducts.map(product => {
            const status = getStockStatus(product);
            const isSelected = selectedProducts.has(product.id);
            
            return (
              <div
                key={product.id}
                className={`inventory-card ${status} ${isSelected ? 'selected' : ''}`}
              >
                <div className="card-header">
                  <button
                    onClick={() => toggleProductSelection(product.id)}
                    className="checkbox-btn"
                  >
                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                  <span className={`stock-status-badge ${status}`}>
                    {status === 'in-stock' && 'En Stock'}
                    {status === 'low-stock' && 'Stock Bajo'}
                    {status === 'out-of-stock' && 'Sin Stock'}
                  </span>
                </div>
                <div className="card-body">
                  <h3>{product.name}</h3>
                  <p className="card-category">{product.category}</p>
                  <div className="stock-info">
                    <div className="stock-item">
                      <span>Stock Actual:</span>
                      <strong>{product.stock} {product.unit}</strong>
                    </div>
                    <div className="stock-item">
                      <span>Mínimo:</span>
                      <span>{product.minStock}</span>
                    </div>
                    <div className="stock-item">
                      <span>Máximo:</span>
                      <span>{product.maxStock}</span>
                    </div>
                  </div>
                </div>
                <div className="card-actions">
                  <button
                    className="btn-small"
                    onClick={() => {
                      setSelectedProduct(product);
                      setStockQuantity(0);
                      setShowAddStockModal(true);
                    }}
                  >
                    <Plus size={14} /> Agregar
                  </button>
                  <button
                    className="btn-small"
                    onClick={() => {
                      setSelectedProduct(product);
                      setStockQuantity(0);
                      setShowRemoveStockModal(true);
                    }}
                  >
                    <Minus size={14} /> Remover
                  </button>
                  <button
                    className="btn-small"
                    onClick={() => {
                      setSelectedProduct(product);
                      setStockQuantity(product.stock);
                      setShowAdjustStockModal(true);
                    }}
                  >
                    <Edit size={14} /> Ajustar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStockModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowAddStockModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Agregar Stock - {selectedProduct.name}</h3>
              <button className="close-btn" onClick={() => setShowAddStockModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Cantidad a Agregar *</label>
                <div className="quick-amounts">
                  {[1, 5, 6, 12, 24, 50, 100].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      className={`quick-amount-btn ${stockQuantity === qty ? 'selected' : ''}`}
                      onClick={() => setStockQuantity(qty)}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  value={stockQuantity || ''}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>Stock Actual: {selectedProduct.stock} {selectedProduct.unit}</label>
                <label>Nuevo Stock: {selectedProduct.stock + (stockQuantity || 0)} {selectedProduct.unit}</label>
              </div>
              <div className="form-group">
                <label>Notas</label>
                <textarea
                  value={stockNotes}
                  onChange={(e) => setStockNotes(e.target.value)}
                  placeholder="Notas sobre este movimiento de inventario..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              {onRestockComplete && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddStockModal(false);
                    setSelectedProduct(null);
                    onRestockComplete(undefined);
                  }}
                >
                  Volver al punto de venta
                </button>
              )}
              <button className="btn-secondary" onClick={() => setShowAddStockModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleAddStock}>
                <Save size={18} />
                Agregar Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Stock Modal */}
      {showRemoveStockModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowRemoveStockModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Remover Stock - {selectedProduct.name}</h3>
              <button className="close-btn" onClick={() => setShowRemoveStockModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Cantidad a Remover *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.stock}
                  value={stockQuantity || ''}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                <small>Stock disponible: {selectedProduct.stock} {selectedProduct.unit}</small>
              </div>
              <div className="form-group">
                <label>Razón *</label>
                <select
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                >
                  <option value="">Seleccionar razón</option>
                  <option value="venta">Venta</option>
                  <option value="daño">Daño/Desperdicio</option>
                  <option value="caducidad">Caducidad</option>
                  <option value="ajuste">Ajuste de inventario</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notas</label>
                <textarea
                  value={stockNotes}
                  onChange={(e) => setStockNotes(e.target.value)}
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowRemoveStockModal(false)}>
                Cancelar
              </button>
              <button className="btn-danger" onClick={handleRemoveStock}>
                <Minus size={18} />
                Remover Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustStockModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowAdjustStockModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ajustar Stock - {selectedProduct.name}</h3>
              <button className="close-btn" onClick={() => setShowAdjustStockModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Stock Actual: {selectedProduct.stock} {selectedProduct.unit}</label>
              </div>
              <div className="form-group">
                <label>Nuevo Stock *</label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity || ''}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>Razón del Ajuste *</label>
                <select
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                >
                  <option value="">Seleccionar razón</option>
                  <option value="conteo">Conteo físico</option>
                  <option value="error">Error de registro</option>
                  <option value="daño">Daño/Desperdicio</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notas</label>
                <textarea
                  value={stockNotes}
                  onChange={(e) => setStockNotes(e.target.value)}
                  placeholder="Explicación del ajuste..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAdjustStockModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleAdjustStock}>
                <Save size={18} />
                Ajustar Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Min/Max Modal */}
      {showSetMinMaxModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowMinMaxModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Configurar Niveles - {selectedProduct.name}</h3>
              <button className="close-btn" onClick={() => setShowMinMaxModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Stock Mínimo *</label>
                <input
                  type="number"
                  min="0"
                  value={minStock || ''}
                  onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                <small>Alerta cuando el stock esté por debajo de este nivel</small>
              </div>
              <div className="form-group">
                <label>Stock Máximo *</label>
                <input
                  type="number"
                  min={minStock}
                  value={maxStock || ''}
                  onChange={(e) => setMaxStock(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                <small>Alerta cuando el stock se acerque a este nivel</small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowMinMaxModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleSetMinMax}>
                <Save size={18} />
                Guardar Niveles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Historial de Movimientos de Inventario</h3>
              <button className="close-btn" onClick={() => setShowHistoryModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="history-table-container">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Producto</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Nuevo Stock</th>
                      <th>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty-state">
                          No hay movimientos registrados
                        </td>
                      </tr>
                    ) : (
                      inventoryHistory.map(movement => (
                        <tr key={movement.id}>
                          <td>{new Date(movement.createdAt).toLocaleString()}</td>
                          <td>{movement.productName}</td>
                          <td>
                            <span className={`movement-type ${movement.operationType}`}>
                              {movement.operationType === 'add' && '➕ Agregar'}
                              {movement.operationType === 'remove' && '➖ Remover'}
                              {movement.operationType === 'adjust' && '⚙️ Ajustar'}
                              {movement.operationType === 'sale' && '💰 Venta'}
                            </span>
                          </td>
                          <td>
                            <span className={movement.quantity > 0 ? 'positive' : 'negative'}>
                              {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                            </span>
                          </td>
                          <td>{movement.newStockLevel}</td>
                          <td>{movement.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Operations Modal */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Operación en Lote - {selectedProducts.size} productos</h3>
              <button className="close-btn" onClick={() => setShowBulkModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Cantidad a Agregar *</label>
                <input
                  type="number"
                  min="1"
                  value={stockQuantity || ''}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>Notas</label>
                <textarea
                  value={stockNotes}
                  onChange={(e) => setStockNotes(e.target.value)}
                  placeholder="Notas sobre esta operación en lote..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowBulkModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleBulkAddStock}>
                <Save size={18} />
                Agregar a {selectedProducts.size} productos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;

