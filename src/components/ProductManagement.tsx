import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Save,
  X,
  AlertTriangle,
  BarChart3,
  FileText,
  Download,
  RefreshCw,
  Warehouse,
  CloudDownload,
  Layers,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getProductsFromMcp,
  mapMcpProductToLocal,
  isShopIdConfigured,
  enrichProductsWithImages,
  mergeProductsFromServerPreserveImages,
  fetchMcpInventoryStatusStockRows,
  applyMcpInventoryStockRowsToProducts,
} from '../utils/shopIdHelper';
import { syncProductImagesToLocalDisk } from '../services/productImageLocalCache';
import { isSyncDue, isBatchDue, syncMcpBatch } from '../utils/syncService';
import { shouldShowImage, markImageFailed } from '../utils/imageCache';
import InventoryManagement from './InventoryManagement';
import {
  type ProductComponentRow,
  getComponentsFromProductRecord,
} from '../utils/productComponents';

interface Product {
  id: number | string;
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
  /** Insumos / BOM / receta (MCP o local). */
  components?: ProductComponentRow[];
  createdAt: string;
  updatedAt: string;
}

interface ProductManagementProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'list' | 'grid' | 'analytics' | 'inventory';
  restockProduct?: { id: number | string; name: string } | null;
  onRestockComplete?: (productToAdd?: unknown) => void;
}

/** Nuevo id numérico para altas locales cuando el catálogo mezcla ids string (MCP) y numéricos. */
function nextLocalNumericProductId(products: Product[]): number {
  let max = 0;
  for (const p of products) {
    if (typeof p.id === 'number' && Number.isFinite(p.id)) {
      max = Math.max(max, p.id);
    }
  }
  return max + 1;
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
      components: [
        { name: 'Café molido', quantity: 18, unit: 'g' },
        { name: 'Agua filtrada', quantity: 180, unit: 'ml' },
      ],
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

const ProductManagement = ({ isOpen, onClose, initialView, restockProduct, onRestockComplete }: ProductManagementProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [view, setView] = useState<'list' | 'grid' | 'analytics' | 'inventory'>('list');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
  /** Producto resaltado en lista/cuadrícula; panel derecho muestra componentes. */
  const [panelProductId, setPanelProductId] = useState<number | string | null>(null);
  const isLoadingRef = useRef(false);
  const hasLoadedForOpenRef = useRef(false);
  const hasServerDataRef = useRef(false);

  // Cargar productos desde localStorage (inmediato, sin loop)
  const loadFromLocalStorage = (): Product[] => {
    try {
      const saved = localStorage.getItem('bizneai-products');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
      }
    } catch (e) {
      console.warn('Error loading products from localStorage:', e);
    }
    return [];
  };

  // Load products from server (con guard para evitar loops)
  const loadProductsFromServer = async () => {
    if (!isShopIdConfigured()) {
      toast.error('Primero configura la URL del servidor en Configuración');
      return;
    }
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    hasServerDataRef.current = false;

    try {
      toast.loading('Cargando productos desde el servidor...', { id: 'loading-products' });
      const [mcpProducts, stockRows] = await Promise.all([getProductsFromMcp(), fetchMcpInventoryStatusStockRows()]);

      const withRemoteStock = (list: Product[]): Product[] => {
        if (!stockRows?.length) return list;
        return applyMcpInventoryStockRowsToProducts(list as unknown as Record<string, unknown>[], stockRows) as unknown as Product[];
      };

      if (mcpProducts && mcpProducts.length > 0) {
        hasServerDataRef.current = true;
        const localParsed = loadFromLocalStorage();
        const mappedProducts = mcpProducts.map((p: unknown, index: number) => mapMcpProductToLocal(p, index));
        const merged = mergeProductsFromServerPreserveImages(localParsed, mappedProducts) as unknown as Record<
          string,
          unknown
        >[];
        const withLocalImages = (await syncProductImagesToLocalDisk(merged)) as unknown as Product[];
        const finalList = withRemoteStock(withLocalImages);
        setProducts(finalList);
        setFilteredProducts(finalList);
        localStorage.setItem('bizneai-products', JSON.stringify(finalList));
        window.dispatchEvent(new Event('products-updated'));
        const stockHint =
          stockRows && stockRows.length > 0
            ? ' Stocks actualizados desde inventario (MCP).'
            : stockRows === null
              ? ' Inventario MCP no disponible; se usó el stock del catálogo.'
              : '';
        toast.success(`${finalList.length} productos cargados desde el servidor.${stockHint}`, { id: 'loading-products' });
      } else {
        const local = loadFromLocalStorage();
        let toUse = local.length > 0 ? local : generateSampleProducts();
        toUse = await enrichProductsWithImages(toUse);
        toUse = withRemoteStock(toUse);
        setProducts(toUse);
        setFilteredProducts(toUse);
        if (local.length === 0) {
          localStorage.setItem('bizneai-products', JSON.stringify(toUse));
          window.dispatchEvent(new Event('products-updated'));
        }
        const stockHint =
          stockRows && stockRows.length > 0
            ? ' Stocks actualizados desde inventario (MCP).'
            : '';
        toast.success(
          (local.length > 0 ? 'Usando productos guardados localmente' : 'Mostrando productos de muestra') + stockHint,
          { id: 'loading-products' }
        );
      }
    } catch (error) {
      console.error('Error loading products from server:', error);
      toast.error('Error al cargar desde el servidor. Mostrando datos locales.', { id: 'loading-products' });
      const local = loadFromLocalStorage();
      let toUse = local.length > 0 ? local : generateSampleProducts();
      toUse = await enrichProductsWithImages(toUse);
      setProducts(toUse);
      setFilteredProducts(toUse);
    } finally {
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    if (isOpen && initialView) {
      setView(initialView);
    }
  }, [isOpen, initialView]);

  useEffect(() => {
    if (!isOpen) {
      hasLoadedForOpenRef.current = false;
      return;
    }
    // Evitar cargas duplicadas (ej. React Strict Mode)
    if (hasLoadedForOpenRef.current) return;
    hasLoadedForOpenRef.current = true;

    // 1. Mostrar algo de inmediato desde localStorage
    const local = loadFromLocalStorage();
    if (local.length > 0) {
      setProducts(local);
      setFilteredProducts(local);
      // Enriquecer imágenes en segundo plano (no solo al inicio de la app)
      if (isShopIdConfigured() && local.some((p) => !p?.image || String(p.image).trim() === '')) {
        enrichProductsWithImages(local).then((enriched) => {
          if (!hasServerDataRef.current) {
            setProducts(enriched);
            setFilteredProducts(enriched);
          }
        });
      }
    }

    // 2. Si hay servidor y toca el lote de catálogo, cargar desde MCP. Si no, datos locales
    if (isShopIdConfigured() && isSyncDue()) {
      loadProductsFromServer();
    } else if (local.length === 0) {
      const sampleProducts = generateSampleProducts();
      setProducts(sampleProducts);
      setFilteredProducts(sampleProducts);
    }
  }, [isOpen]);

  /** Respaldo paginado del catálogo MCP (lote aparte; intervalo ~24 h). */
  useEffect(() => {
    if (!isOpen || !isShopIdConfigured()) return;
    if (!isBatchDue('catalogPages')) return;
    void syncMcpBatch('catalogPages', { force: true }).catch((e) =>
      console.warn('[ProductManagement] lote catalogPages', e)
    );
  }, [isOpen]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory, stockFilter]);

  useEffect(() => {
    if (panelProductId == null) return;
    if (!filteredProducts.some((p) => p.id === panelProductId)) {
      setPanelProductId(null);
    }
  }, [filteredProducts, panelProductId]);

  const panelProduct = useMemo(
    () => (panelProductId == null ? null : products.find((p) => p.id === panelProductId) ?? null),
    [products, panelProductId]
  );

  const resolveProductComponents = (product: Product): ProductComponentRow[] => {
    if (Array.isArray(product.components) && product.components.length > 0) {
      return product.components;
    }
    return getComponentsFromProductRecord(product as unknown as Record<string, unknown>);
  };

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

  const escapeCsvField = (value: string) => {
    const s = String(value ?? '');
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  /** Exportar catálogo actual (memoria de esta ventana / mismo origen que el POS local). */
  const handleExportCatalogCsv = () => {
    if (products.length === 0) {
      toast.error('No hay productos para exportar');
      return;
    }
    const header = [
      'Nombre',
      'Descripción',
      'Categoría',
      'Stock',
      'Precio',
      'Costo',
      'SKU',
      'Código de barras',
      'Unidad',
      'Activo',
    ];
    const rows = products.map((p) =>
      [
        p.name,
        p.description ?? '',
        p.category,
        String(p.stock),
        String(p.price),
        String(p.cost ?? ''),
        p.sku,
        p.barcode ?? '',
        p.unit ?? '',
        p.isActive ? 'Sí' : 'No',
      ].map((cell) => escapeCsvField(cell))
    );
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catalogo-productos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Catálogo exportado a CSV');
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditingProduct({ ...product });
    setIsEditModalOpen(true);
  };

  const persistProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    localStorage.setItem('bizneai-products', JSON.stringify(updatedProducts));
    window.dispatchEvent(new Event('products-updated'));
  };

  const handleSaveProduct = () => {
    if (isAddModalOpen) {
      const newProduct: Product = {
        ...editingProduct as Product,
        id: nextLocalNumericProductId(products),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updatedProducts = [...products, newProduct];
      persistProducts(updatedProducts);
      setIsAddModalOpen(false);
    } else if (isEditModalOpen && selectedProduct) {
      const updatedProducts = products.map(p =>
        p.id === selectedProduct.id
          ? { ...editingProduct as Product, updatedAt: new Date().toISOString() }
          : p
      );
      persistProducts(updatedProducts);
      setIsEditModalOpen(false);
      setSelectedProduct(null);
    }
    setEditingProduct({});
  };

  const handleDeleteProduct = (productId: number | string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      const updatedProducts = products.filter(p => p.id !== productId);
      setProducts(updatedProducts);
      if (panelProductId === productId) setPanelProductId(null);
      localStorage.setItem('bizneai-products', JSON.stringify(updatedProducts));
      window.dispatchEvent(new Event('products-updated'));
    }
  };

  const handleStockUpdate = (productId: number | string, newStock: number) => {
    const updatedProducts = products.map(p =>
      p.id === productId ? { ...p, stock: newStock, updatedAt: new Date().toISOString() } : p
    );
    setProducts(updatedProducts);
    // Persistir para que el POS y el resto de la app vean el cambio
    localStorage.setItem('bizneai-products', JSON.stringify(updatedProducts));
    window.dispatchEvent(new Event('products-updated'));
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
            const isRowSelected = panelProductId === product.id;
            return (
              <tr
                key={product.id}
                className={isRowSelected ? 'is-selected' : undefined}
                onClick={() => setPanelProductId(product.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPanelProductId(product.id);
                  }
                }}
              >
                <td>
                  <div className="product-info">
                    <div className="product-image">
                      {shouldShowImage(product.image) ? (
                        <img
                          src={product.image!}
                          alt={product.name}
                          onError={() => markImageFailed(product.image)}
                          loading="lazy"
                        />
                      ) : (
                        <Package size={24} />
                      )}
                    </div>
                    <div>
                      <div className="product-name">{product.name}</div>
                      <div className="product-description">{(product.description || '').substring(0, 50)}...</div>
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
                  <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
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
        const isCardSelected = panelProductId === product.id;
        return (
          <div
            key={product.id}
            className={`product-card${isCardSelected ? ' is-selected' : ''}`}
            onClick={() => setPanelProductId(product.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setPanelProductId(product.id);
              }
            }}
          >
            <div className="product-card-header">
              <div className="product-image">
                {shouldShowImage(product.image) ? (
                  <img
                    src={product.image!}
                    alt={product.name}
                    onError={() => markImageFailed(product.image)}
                    loading="lazy"
                  />
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
              <p className="product-description">{(product.description || '').substring(0, 80)}...</p>
              
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
            
            <div className="product-card-actions" onClick={(e) => e.stopPropagation()}>
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

  const renderComponentsAside = () => {
    const showListHint = view === 'inventory' || view === 'analytics';
    const components = panelProduct ? resolveProductComponents(panelProduct) : [];
    const tags = panelProduct?.tags ?? [];

    return (
      <aside className="product-components-aside" aria-label="Componentes del producto">
        <div className="product-components-aside-header">
          <Layers size={18} aria-hidden />
          <span>Componentes</span>
        </div>
        {showListHint && (
          <p className="product-components-hint">
            En <strong>Lista</strong> o <strong>Cuadrícula</strong>, haz clic en un producto para ver insumos o receta aquí.
          </p>
        )}
        {!panelProduct ? (
          <p className="product-components-empty">
            {showListHint
              ? 'Selecciona un producto en Lista o Cuadrícula para ver sus componentes aquí.'
              : 'Selecciona un producto en la tabla o en la cuadrícula.'}
          </p>
        ) : (
          <>
            <div className="product-components-product-title">{panelProduct.name}</div>
            <div className="product-components-badges">
              <span className="category-badge">{panelProduct.category}</span>
              {panelProduct.sku ? <span className="sku-muted">{panelProduct.sku}</span> : null}
            </div>
            {components.length === 0 ? (
              <div className="product-components-empty">
                <p>Sin componentes definidos.</p>
                {tags.length > 0 && (
                  <div className="product-components-tags">
                    <span className="micro-label">Etiquetas</span>
                    <div className="tag-chips">
                      {tags.map((t) => (
                        <span key={t} className="tag-chip">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <ul className="product-components-list">
                {components.map((c, i) => (
                  <li key={`${String(c.name)}-${i}`}>
                    <span className="component-name">{c.name}</span>
                    {(c.quantity != null || c.unit) && (
                      <span className="component-qty">
                        {c.quantity != null ? String(c.quantity) : ''}
                        {c.unit ? ` ${c.unit}` : ''}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </aside>
    );
  };

  const tooltipSyncFromServer =
    'Sincronizar desde el servidor (icono de nube / MCP): descarga el catálogo oficial de tu tienda en BizneAI, lo fusiona con lo que ya tienes guardado en este equipo (p. ej. conserva imágenes descargadas), trae stocks desde el inventario MCP (inventory/status) cuando existe y guarda el resultado en el almacenamiento local del POS. Requiere conexión e ID de tienda. ' +
    'No exporta un archivo. No es el botón circular: ese solo relee datos locales sin usar internet.';

  const tooltipRefreshLocal =
    'Actualizar vista (flechas circulares): vuelve a cargar la tabla desde el catálogo guardado en este equipo (bizneai-products). No usa red ni actualiza el servidor. ' +
    'Sirve para refrescar lo que ya está en el disco tras cambios en la misma sesión o para re-aplicar imágenes en caché. La nube es la que trae cambios remotos desde MCP.';

  const tooltipExportCsv =
    'Exportar catálogo (flecha hacia abajo): genera un archivo CSV con los productos cargados ahora en esta ventana (respaldo o análisis en Excel). No sincroniza con el servidor ni sustituye tu lista. ' +
    'Diferencia con la nube: la nube descarga de BizneAI/MCP; este botón solo saca una copia de lo que ya ves aquí.';

  const tooltipAddProduct =
    'Agregar producto: abre el formulario para crear un artículo nuevo y guardarlo en el catálogo local del POS (bizneai-products). No descarga del servidor hasta que uses la nube.';

  const tooltipCloseModal =
    'Cerrar gestión de productos: oculta esta ventana. El catálogo sigue guardado en este equipo; no se pierden los datos al cerrar.';

  if (!isOpen) return null;

  return (
    <div className="product-management-overlay">
      <div className="product-management-modal">
        <div className="management-header">
          <h2>Gestión de Productos</h2>
          <div className="header-actions">
            {isShopIdConfigured() && (
              <button
                type="button"
                className="action-btn"
                title={tooltipSyncFromServer}
                aria-label={tooltipSyncFromServer}
                onClick={loadProductsFromServer}
              >
                <CloudDownload size={20} />
              </button>
            )}
            <button
              type="button"
              className="action-btn"
              title={tooltipRefreshLocal}
              aria-label={tooltipRefreshLocal}
              onClick={async () => {
                const local = loadFromLocalStorage();
                if (local.length > 0) {
                  try {
                    const enriched = await enrichProductsWithImages(local);
                    setProducts(enriched);
                    setFilteredProducts(enriched);
                    toast.success('Lista actualizada desde el catálogo guardado en este equipo');
                  } catch {
                    setProducts(local);
                    setFilteredProducts(local);
                    toast.success('Lista actualizada desde el catálogo local');
                  }
                  return;
                }
                if (isShopIdConfigured()) {
                  toast('No hay catálogo local aún. Usa el icono de nube para cargar desde el servidor.', {
                    icon: 'ℹ️',
                  });
                } else {
                  toast.error('No hay productos guardados. Configura el servidor o agrega productos.');
                }
              }}
            >
              <RefreshCw size={20} />
            </button>
            <button
              type="button"
              className="action-btn"
              title={tooltipExportCsv}
              aria-label={tooltipExportCsv}
              onClick={handleExportCatalogCsv}
            >
              <Download size={20} />
            </button>
            <button type="button" className="btn-primary" title={tooltipAddProduct} aria-label={tooltipAddProduct} onClick={handleAddProduct}>
              <Plus size={20} />
              Agregar Producto
            </button>
            <button type="button" className="close-btn" title={tooltipCloseModal} aria-label={tooltipCloseModal} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="management-content">
          <div className="management-body">
            <div className="management-main">
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
              className={`view-tab ${view === 'inventory' ? 'active' : ''}`}
              onClick={() => setView('inventory')}
            >
              <Warehouse size={20} />
              Inventario
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
            {view === 'inventory' && (
              <InventoryManagement
                products={products}
                onStockUpdate={handleStockUpdate}
                restockProduct={restockProduct ?? undefined}
                onRestockComplete={onRestockComplete}
                onPullServerCatalog={loadProductsFromServer}
              />
            )}
            {view === 'analytics' && renderAnalytics()}
          </div>
            </div>
            {renderComponentsAside()}
          </div>
        </div>
      </div>

      {/* Modales */}
      {(isAddModalOpen || isEditModalOpen) && renderProductForm()}
    </div>
  );
};

export default ProductManagement; 