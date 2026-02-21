import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle,
  X,
  RefreshCw,
  Filter,
  Search,
  AlertCircle,
  Timer,
  Package,
  Users,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStore } from '../contexts/StoreContext';

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

interface KitchenOrder {
  _id: string;
  orderId: string;
  customerName: string;
  items: KitchenItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  timestamp: string;
  estimatedTime?: number;
  tableNumber?: string;
  notes?: string;
  source: 'pos' | 'online' | 'waitlist';
}

interface KitchenProps {
  isOpen: boolean;
  onClose: () => void;
}

type StatusFilter = 'all' | 'pending' | 'preparing' | 'ready' | 'completed';

const Kitchen: React.FC<KitchenProps> = ({ isOpen, onClose }) => {
  const { storeIdentifiers } = useStore();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<KitchenOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load kitchen orders from localStorage and waitlist
  useEffect(() => {
    if (isOpen) {
      loadKitchenOrders();
    }
  }, [isOpen]);

  // Filter and search orders
  useEffect(() => {
    let filtered = [...orders];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.product.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm]);

  const loadKitchenOrders = () => {
    setIsLoading(true);
    try {
      // Load from kitchen-specific storage
      const saved = localStorage.getItem('bizneai-kitchen-orders');
      const kitchenOrders: KitchenOrder[] = saved ? JSON.parse(saved) : [];

      // Also check waitlist for orders that should be in kitchen
      const waitlistSaved = localStorage.getItem('bizneai-waitlist');
      if (waitlistSaved) {
        const waitlistEntries = JSON.parse(waitlistSaved);
        // Convert waitlist entries with items to kitchen orders
        waitlistEntries.forEach((entry: any) => {
          if (entry.items && entry.items.length > 0 && 
              (entry.status === 'preparing' || entry.status === 'waiting')) {
            const kitchenOrder: KitchenOrder = {
              _id: entry._id,
              orderId: `ORD-${entry._id.slice(-6)}`,
              customerName: entry.name || entry.customerInfo?.name || 'Cliente',
              items: entry.items,
              total: entry.total,
              status: entry.status === 'preparing' ? 'preparing' : 'pending',
              timestamp: entry.timestamp,
              estimatedTime: entry.estimatedWaitTime,
              notes: entry.notes,
              source: entry.source === 'online' ? 'online' : 'pos'
            };
            
            // Only add if not already in kitchen orders
            if (!kitchenOrders.find(o => o._id === entry._id)) {
              kitchenOrders.push(kitchenOrder);
            }
          }
        });
      }

      setOrders(kitchenOrders);
    } catch (error) {
      console.error('Error loading kitchen orders:', error);
      toast.error('Error al cargar órdenes de cocina');
    } finally {
      setIsLoading(false);
    }
  };

  const saveKitchenOrders = (newOrders: KitchenOrder[]) => {
    localStorage.setItem('bizneai-kitchen-orders', JSON.stringify(newOrders));
  };

  const handleStatusChange = (orderId: string, newStatus: KitchenOrder['status']) => {
    setOrders(prev => {
      const updated = prev.map(order =>
        order._id === orderId ? { ...order, status: newStatus } : order
      );
      saveKitchenOrders(updated);
      return updated;
    });

    // Also update waitlist if exists
    const waitlistSaved = localStorage.getItem('bizneai-waitlist');
    if (waitlistSaved) {
      const waitlistEntries = JSON.parse(waitlistSaved);
      const updatedWaitlist = waitlistEntries.map((entry: any) => {
        if (entry._id === orderId) {
          return { ...entry, status: newStatus === 'pending' ? 'waiting' : newStatus };
        }
        return entry;
      });
      localStorage.setItem('bizneai-waitlist', JSON.stringify(updatedWaitlist));
    }

    toast.success('Estado de orden actualizado');
  };

  const handleCompleteOrder = (orderId: string) => {
    handleStatusChange(orderId, 'completed');
    toast.success('Orden completada');
  };

  const getStatusColor = (status: KitchenOrder['status']) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'preparing':
        return '#3b82f6';
      case 'ready':
        return '#10b981';
      case 'completed':
        return '#64748b';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getStatusLabel = (status: KitchenOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Listo';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed').length
  };

  if (!isOpen) return null;

  // Renderizar siempre como contenido inline (sin overlay/modal)
  return (
    <div className="kitchen-content-inline">
      <div className="kitchen-header-inline">
          <div className="kitchen-title">
            <ChefHat size={24} />
            <h2>Cocina</h2>
          </div>
          <div className="header-actions">
            <button className="action-btn" onClick={loadKitchenOrders} title="Actualizar">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        <div className="kitchen-content">
          {/* Statistics */}
          <div className="kitchen-stats">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <Package size={24} />
              </div>
              <div className="stat-content">
                <h3>{stats.total}</h3>
                <p>Total</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <h3>{stats.pending}</h3>
                <p>Pendientes</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <ChefHat size={24} />
              </div>
              <div className="stat-content">
                <h3>{stats.preparing}</h3>
                <p>Preparando</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <CheckCircle size={24} />
              </div>
              <div className="stat-content">
                <h3>{stats.ready}</h3>
                <p>Listos</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="kitchen-filters">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar por cliente, orden o producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="filter-select"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="preparing">Preparando</option>
              <option value="ready">Listos</option>
              <option value="completed">Completados</option>
            </select>
          </div>

          {/* Orders List */}
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
                <p>Las órdenes con productos aparecerán aquí</p>
              </div>
            ) : (
              <div className="kitchen-grid">
                {filteredOrders.map(order => (
                  <div key={order._id} className="kitchen-order-card">
                    <div className="kitchen-order-header">
                      <div className="order-info">
                        <h3>{order.customerName}</h3>
                        <span className="order-id">#{order.orderId}</span>
                        {order.tableNumber && (
                          <span className="table-number">Mesa {order.tableNumber}</span>
                        )}
                      </div>
                      <span
                        className="status-badge"
                        style={{
                          background: getStatusColor(order.status) + '20',
                          color: getStatusColor(order.status)
                        }}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="kitchen-order-body">
                      <div className="order-items">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="order-item">
                            <div className="item-quantity">
                              {item.product.isWeightBased ? (
                                <span>{item.weight?.toFixed(2)} kg</span>
                              ) : (
                                <span>{item.quantity}x</span>
                              )}
                            </div>
                            <div className="item-name">{item.product.name}</div>
                            {item.notes && (
                              <div className="item-notes">
                                <AlertCircle size={14} />
                                <span>{item.notes}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <div className="order-notes">
                          <FileText size={14} />
                          <span>{order.notes}</span>
                        </div>
                      )}

                      {order.estimatedTime && (
                        <div className="order-time">
                          <Timer size={14} />
                          <span>Tiempo estimado: ~{order.estimatedTime} min</span>
                        </div>
                      )}

                      <div className="order-timestamp">
                        {new Date(order.timestamp).toLocaleString()}
                      </div>
                    </div>

                    <div className="kitchen-order-footer">
                      <div className="status-buttons">
                        {order.status === 'pending' && (
                          <button
                            className="status-btn preparing"
                            onClick={() => handleStatusChange(order._id, 'preparing')}
                          >
                            Iniciar Preparación
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            className="status-btn ready"
                            onClick={() => handleStatusChange(order._id, 'ready')}
                          >
                            Marcar como Listo
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            className="status-btn completed"
                            onClick={() => handleCompleteOrder(order._id)}
                          >
                            Completar Orden
                          </button>
                        )}
                        {order.status !== 'completed' && order.status !== 'cancelled' && (
                          <button
                            className="status-btn cancelled"
                            onClick={() => handleStatusChange(order._id, 'cancelled')}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
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

