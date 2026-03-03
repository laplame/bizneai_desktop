import React, { useState, useEffect, useCallback } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle,
  Hourglass,
  RefreshCw,
  Search,
  AlertCircle,
  Trash2,
  RotateCcw,
  ShoppingCart,
  CreditCard
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStore } from '../contexts/StoreContext';
import { getShopId } from '../utils/shopIdHelper';
import { kitchenAPI } from '../api/kitchen';

interface KitchenItem {
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
    isWeightBased?: boolean;
  };
  quantity: number;
  weight?: number;
  notes?: string;
}

type KitchenStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
type KitchenPriority = 'low' | 'normal' | 'high' | 'urgent';

interface KitchenOrder {
  _id: string;
  orderId?: string;
  customerName: string;
  waiterName?: string;
  items: KitchenItem[];
  total: number;
  status: KitchenStatus;
  priority?: KitchenPriority;
  timestamp: string;
  createdAt?: string;
  estimatedTime?: number;
  tableNumber?: string;
  notes?: string;
  specialInstructions?: string;
  source?: 'pos' | 'online' | 'waitlist';
}

interface KitchenProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadOrderToCart?: (order: KitchenOrder) => void;
}

type StatusFilter = 'all' | 'pending' | 'preparing' | 'ready' | 'served';

const PRIORITY_LABELS: Record<KitchenPriority, string> = {
  low: 'Baja',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente'
};

const formatElapsedTime = (timestamp: string): string => {
  const start = new Date(timestamp).getTime();
  const now = Date.now();
  const diffMs = now - start;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  if (diffH >= 1) {
    return `${diffH}h ${diffMin % 60}min`;
  }
  return `${diffMin} min`;
};

const Kitchen: React.FC<KitchenProps> = ({ isOpen, onLoadOrderToCart }) => {
  const { storeIdentifiers } = useStore();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<KitchenOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<KitchenPriority | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useApi, setUseApi] = useState(false);
  const shopId = getShopId() || storeIdentifiers.shopId || storeIdentifiers._id;

  const loadFromApi = useCallback(async () => {
    if (!shopId) return null;
    try {
      const params: Record<string, string> = { shopId };
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (searchTerm) params.search = searchTerm;
      const res = await kitchenAPI.getOrders(params);
      const raw = res?.data ?? (res as any)?.orders ?? (Array.isArray(res) ? res : []);
      const list = Array.isArray(raw) ? raw : [];
      if (list.length === 0 && !res?.success && res?.error) return null;
      return list.map((o: any) => ({
          _id: o._id,
          orderId: o.orderId || o._id?.slice(-12),
          customerName: o.customerName || 'Cliente',
          waiterName: o.waiterName,
          tableNumber: o.tableNumber,
          items: (o.items || []).map((it: any) => ({
            product: {
              id: it.product?.id || it.productId || '',
              name: it.product?.name || it.name || it.productName || 'Producto',
              price: it.product?.price || it.price || 0,
              category: it.product?.category || it.category || '',
              isWeightBased: it.product?.isWeightBased
            },
            quantity: it.quantity || 1,
            weight: it.weight,
            notes: it.notes
          })),
          total: o.total || 0,
          status: (o.status === 'completed' ? 'served' : o.status) as KitchenStatus,
          priority: (o.priority || 'normal') as KitchenPriority,
          timestamp: o.createdAt || o.updatedAt || o.timestamp || new Date().toISOString(),
          createdAt: o.createdAt
        }));
    } catch (e) {
      console.warn('Kitchen API error, using local:', e);
    }
    return null;
  }, [shopId, priorityFilter, searchTerm]);

  const loadFromLocal = useCallback(() => {
    const saved = localStorage.getItem('bizneai-kitchen-orders');
    let kitchenOrders: KitchenOrder[] = saved ? JSON.parse(saved) : [];
    kitchenOrders = kitchenOrders.map(o => {
      const rawStatus = o.status as string;
      const status: KitchenStatus = rawStatus === 'completed' ? 'served' : (rawStatus as KitchenStatus);
      return { ...o, status, priority: (o.priority || 'normal') as KitchenPriority };
    });

    const waitlistSaved = localStorage.getItem('bizneai-waitlist');
    if (waitlistSaved) {
      const waitlistEntries = JSON.parse(waitlistSaved);
      waitlistEntries.forEach((entry: any) => {
        if (entry.items?.length && (entry.status === 'preparing' || entry.status === 'waiting')) {
          const ko: KitchenOrder = {
            _id: entry._id,
            orderId: `ORD-${entry._id.slice(-6)}`,
            customerName: entry.name || entry.customerInfo?.name || 'Cliente',
            waiterName: entry.waiterName || entry.customerInfo?.waiterName,
            tableNumber: entry.tableNumber || entry.customerInfo?.tableNumber,
            items: entry.items,
            total: entry.total,
            status: entry.status === 'preparing' ? 'preparing' : 'pending',
            priority: (entry.priority as KitchenPriority) || 'normal',
            timestamp: entry.timestamp,
            notes: entry.notes,
            specialInstructions: entry.specialInstructions,
            source: entry.source === 'online' ? 'online' : 'pos'
          };
          if (!kitchenOrders.find(o => o._id === entry._id)) kitchenOrders.push(ko);
        }
      });
    }
    return kitchenOrders;
  }, []);

  const loadKitchenOrders = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      const apiOrders = await loadFromApi();
      if (apiOrders !== null) {
        setOrders(apiOrders);
        setUseApi(true);
      } else {
        setOrders(loadFromLocal());
        setUseApi(false);
      }
    } catch (error) {
      console.error('Error loading kitchen orders:', error);
      setOrders(loadFromLocal());
      setUseApi(false);
      toast.error('Error al cargar órdenes de cocina');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, loadFromApi, loadFromLocal]);

  useEffect(() => {
    if (isOpen) loadKitchenOrders();
  }, [isOpen, loadKitchenOrders]);

  useEffect(() => {
    const onUpdated = () => loadKitchenOrders();
    window.addEventListener('kitchen-updated', onUpdated);
    return () => window.removeEventListener('kitchen-updated', onUpdated);
  }, [loadKitchenOrders]);

  useEffect(() => {
    if (!useApi || !isOpen) return;
    const id = setInterval(loadKitchenOrders, 60000);
    return () => clearInterval(id);
  }, [useApi, isOpen, loadKitchenOrders]);

  useEffect(() => {
    let filtered = [...orders];
    if (statusFilter !== 'all') filtered = filtered.filter(o => o.status === statusFilter);
    if (priorityFilter !== 'all') filtered = filtered.filter(o => (o.priority || 'normal') === priorityFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.customerName.toLowerCase().includes(q) ||
        (o.waiterName || '').toLowerCase().includes(q) ||
        (o.tableNumber || '').toLowerCase().includes(q) ||
        o.items.some(it => it.product.name.toLowerCase().includes(q))
      );
    }
    const priorityOrder: KitchenPriority[] = ['urgent', 'high', 'normal', 'low'];
    filtered.sort((a, b) => {
      const pa = priorityOrder.indexOf(a.priority || 'normal');
      const pb = priorityOrder.indexOf(b.priority || 'normal');
      if (pa !== pb) return pa - pb;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    setFilteredOrders(filtered);
  }, [orders, statusFilter, priorityFilter, searchTerm]);

  const saveKitchenOrders = (newOrders: KitchenOrder[]) => {
    localStorage.setItem('bizneai-kitchen-orders', JSON.stringify(newOrders));
  };

  const handleStatusChange = async (orderId: string, newStatus: KitchenOrder['status']) => {
    if (useApi && shopId) {
      try {
        const apiStatus = newStatus === 'served' ? 'completed' : newStatus;
        if (apiStatus !== 'cancelled') {
          await kitchenAPI.partialUpdateOrder(orderId, shopId, { status: apiStatus as 'pending' | 'preparing' | 'ready' | 'completed' });
        }
        await loadKitchenOrders();
        toast.success('Estado actualizado');
        return;
      } catch (e) {
        toast.error('Error al actualizar');
        return;
      }
    }
    setOrders(prev => {
      const updated = prev.map(o => (o._id === orderId ? { ...o, status: newStatus } : o));
      saveKitchenOrders(updated);
      return updated;
    });
    const waitlistSaved = localStorage.getItem('bizneai-waitlist');
    if (waitlistSaved) {
      const entries = JSON.parse(waitlistSaved);
      const updated = entries.map((e: any) =>
        e._id === orderId ? { ...e, status: newStatus === 'pending' ? 'waiting' : newStatus === 'served' ? 'completed' : newStatus } : e
      );
      localStorage.setItem('bizneai-waitlist', JSON.stringify(updated));
    }
    toast.success('Estado actualizado');
  };

  const handleDelete = async (orderId: string) => {
    if (!window.confirm('¿Eliminar esta orden?')) return;
    if (useApi && shopId) {
      try {
        await kitchenAPI.deleteOrder(orderId, shopId);
        await loadKitchenOrders();
        toast.success('Orden eliminada');
        return;
      } catch (e) {
        toast.error('Error al eliminar');
        return;
      }
    }
    setOrders(prev => {
      const updated = prev.filter(o => o._id !== orderId);
      saveKitchenOrders(updated);
      return updated;
    });
    toast.success('Orden eliminada');
  };

  const getStatusColor = (status: KitchenOrder['status']) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'preparing': return '#3b82f6';
      case 'ready': return '#10b981';
      case 'served': return '#64748b';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getStatusLabelShort = (status: KitchenOrder['status'] | string) => {
    switch (status) {
      case 'pending': return 'PENDIENTE';
      case 'preparing': return 'PREPARANDO';
      case 'ready': return 'LISTO';
      case 'served': return 'ENTREGADO';
      case 'cancelled': return 'CANCELADO';
      default: return (status && String(status).toUpperCase()) || '';
    }
  };

  const getPriorityColor = (priority: KitchenPriority) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'normal': return '#3b82f6';
      case 'low': return '#64748b';
      default: return '#64748b';
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    served: orders.filter(o => o.status === 'served').length
  };

  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: stats.total },
    { key: 'pending', label: 'Pendientes', count: stats.pending },
    { key: 'preparing', label: 'Preparando', count: stats.preparing },
    { key: 'ready', label: 'Listos', count: stats.ready },
    { key: 'served', label: 'Entregados', count: stats.served }
  ];

  if (!isOpen) return null;

  return (
    <div className="kitchen-content-inline kitchen-web-style">
      <div className="kitchen-header-inline">
        <div className="kitchen-title">
          <ChefHat size={24} />
          <h2>Cocina</h2>
        </div>
        <div className="header-actions">
          <button className="action-btn" onClick={() => loadKitchenOrders()} title="Actualizar" disabled={isLoading}>
            <RefreshCw size={20} className={isLoading ? 'spinner' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="kitchen-content">
        {/* Status tabs (estilo web) */}
        <div className="kitchen-status-tabs">
          {statusTabs.map(({ key, label, count }) => (
            <button
              key={key}
              className={`kitchen-tab ${statusFilter === key ? 'active' : ''}`}
              onClick={() => setStatusFilter(key)}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Filtros: búsqueda + prioridad */}
        <div className="kitchen-filters">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por cliente, mesa o camarero..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as KitchenPriority | 'all')}
            className="filter-select"
          >
            <option value="all">Todas las prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="normal">Normal</option>
            <option value="low">Baja</option>
          </select>
        </div>

        {/* Lista de órdenes */}
        <div className="kitchen-orders">
          {isLoading ? (
            <div className="empty-state">
              <RefreshCw size={48} className="spinner" />
              <p>Cargando órdenes...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <ChefHat size={48} style={{ opacity: 0.5 }} />
              <h3>No hay órdenes en cocina</h3>
              <p>Las órdenes aparecerán aquí</p>
            </div>
          ) : (
            <div className="kitchen-grid">
              {filteredOrders.map(order => (
                <div key={order._id} className="kitchen-order-card kitchen-card-web">
                  <div className="kitchen-card-top">
                    <span
                      className="kitchen-pill priority-pill"
                      style={{ background: getPriorityColor(order.priority || 'normal') + '20', color: getPriorityColor(order.priority || 'normal') }}
                    >
                      <Clock size={14} />
                      {PRIORITY_LABELS[order.priority || 'normal'].toUpperCase()}
                    </span>
                    <span
                      className="kitchen-pill status-pill"
                      style={{ background: getStatusColor(order.status) + '20', color: getStatusColor(order.status) }}
                    >
                      {order.status === 'pending' ? <Hourglass size={14} /> : order.status === 'served' ? <CheckCircle size={14} /> : null}
                      {getStatusLabelShort(order.status)}
                    </span>
                  </div>

                  <h3 className="kitchen-card-mesa">Mesa {order.tableNumber || 'N/A'}</h3>
                  <p className="kitchen-card-meta">Mesa {order.tableNumber || 'N/A'} • {order.waiterName || order.customerName || 'N/A'}</p>

                  <div className="kitchen-card-time">
                    <span>{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span className="elapsed-pill">{formatElapsedTime(order.timestamp)}</span>
                  </div>

                  <div className="kitchen-card-items">
                    <strong>Items:</strong>
                    <div className="items-pills">
                      {order.items.map((item, idx) => (
                        <span key={idx} className="item-pill">
                          {item.product.isWeightBased ? `${item.weight?.toFixed(2)} kg` : `${item.quantity}x`} {item.product.name}
                          {item.notes && <span title={item.notes}><AlertCircle size={12} /></span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="kitchen-card-order-id">Orden #{order.orderId || order._id?.slice(-12)}</p>

                  <div className="kitchen-card-actions">
                    {onLoadOrderToCart && (
                      <button
                        className="status-btn load-to-cart"
                        onClick={() => onLoadOrderToCart(order)}
                        title="Cargar orden al carrito y cobrar"
                      >
                        <ShoppingCart size={16} />
                        Cargar y cobrar
                      </button>
                    )}
                    {order.status === 'pending' && (
                      <button className="status-btn preparing" onClick={() => handleStatusChange(order._id, 'preparing')}>
                        <ChefHat size={18} />
                        Iniciar Preparación
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button className="status-btn ready" onClick={() => handleStatusChange(order._id, 'ready')}>
                        Marcar como Listo
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button className="status-btn served" onClick={() => handleStatusChange(order._id, 'served')}>
                        Marcar Entregado
                      </button>
                    )}
                    {order.status === 'served' && (
                      <>
                        <button className="status-btn back" onClick={() => handleStatusChange(order._id, 'ready')}>
                          <RotateCcw size={16} />
                          Volver a Listo
                        </button>
                        <button className="status-btn delete" onClick={() => handleDelete(order._id)}>
                          <Trash2 size={16} />
                          Borrar
                        </button>
                      </>
                    )}
                    {order.status !== 'served' && order.status !== 'cancelled' && (
                      <button className="status-btn cancelled" onClick={() => handleStatusChange(order._id, 'cancelled')}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Kitchen;
