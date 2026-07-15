import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle,
  Hourglass,
  RefreshCw,
  Search,
  Trash2,
  RotateCcw,
  ShoppingCart,
  CreditCard,
  Eraser,
  LayoutGrid,
  Rows3,
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronDown,
  BarChart3,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStore } from '../contexts/StoreContext';
import { getShopId } from '../utils/shopIdHelper';
import { kitchenAPI } from '../api/kitchen';
import { scheduleMirrorKeyToSqlite } from '../services/posPersistService';
import { kitchenWaitlistSocketService } from '../services/kitchenWaitlistSocketService';
import KitchenStats from './KitchenStats';

const KITCHEN_LAST_PURGE_KEY = 'bizneai-kitchen-last-purge-date';

function todayKeyMx(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function markKitchenPurgedToday(shopId: string): void {
  try {
    localStorage.setItem(`${KITCHEN_LAST_PURGE_KEY}:${shopId}`, todayKeyMx());
  } catch {
    /* ignore */
  }
}

function wasKitchenPurgedToday(shopId: string): boolean {
  try {
    return localStorage.getItem(`${KITCHEN_LAST_PURGE_KEY}:${shopId}`) === todayKeyMx();
  } catch {
    return false;
  }
}

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

/** Cocina: solo volumen de líneas (sin nombres de producto); el detalle está en Lista de espera. */
function kitchenLineSummary(order: KitchenOrder): string {
  const n = order.items.length;
  if (n === 0) return 'Sin partidas';
  if (n === 1) return '1 partida en ticket';
  return `${n} partidas en ticket`;
}

const Kitchen: React.FC<KitchenProps> = ({ isOpen, onLoadOrderToCart }) => {
  const { storeIdentifiers } = useStore();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<KitchenOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<KitchenPriority | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useApi, setUseApi] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  /** cards = tarjetas compactas; detail = detalle tipo web */
  const [viewMode, setViewMode] = useState<'cards' | 'detail'>(() => {
    try {
      const v = localStorage.getItem('bizneai-kitchen-view-mode');
      return v === 'detail' ? 'detail' : 'cards';
    } catch {
      return 'cards';
    }
  });
  /** fifo = orden de entrada (más antiguos primero); lifo = últimos primero */
  const [entryOrder, setEntryOrder] = useState<'fifo' | 'lifo'>(() => {
    try {
      const v = localStorage.getItem('bizneai-kitchen-entry-order');
      return v === 'lifo' ? 'lifo' : 'fifo';
    } catch {
      return 'fifo';
    }
  });
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  /** board = pedidos; stats = OLAP */
  const [kitchenPanel, setKitchenPanel] = useState<'board' | 'stats'>('board');
  const viewMenuRef = useRef<HTMLDivElement | null>(null);
  const shopId = getShopId() || storeIdentifiers.shopId || storeIdentifiers._id;

  const loadFromApi = useCallback(async () => {
    if (!shopId) return null;
    try {
      const params: Record<string, string | number> = {
        shopId,
        limit: 100,
        sortBy: 'orderTime',
        sortOrder: entryOrder === 'lifo' ? 'desc' : 'asc',
      };
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (searchTerm) params.search = searchTerm;
      const res = await kitchenAPI.getOrders(params);
      const raw = res?.data ?? (res as any)?.orders ?? (Array.isArray(res) ? res : []);
      const list = Array.isArray(raw) ? raw : [];
      // Si la API respondió con error de red / CORS, no usar cache local de otra tienda
      if (!res?.success && list.length === 0) return null;
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
          timestamp: o.orderTime || o.createdAt || o.updatedAt || o.timestamp || new Date().toISOString(),
          createdAt: o.createdAt || o.orderTime
        }));
    } catch (e) {
      console.warn('Kitchen API error, using local:', e);
    }
    return null;
  }, [shopId, priorityFilter, searchTerm, entryOrder]);

  const loadFromLocal = useCallback(() => {
    const saved = localStorage.getItem('bizneai-kitchen-orders');
    let kitchenOrders: KitchenOrder[] = saved ? JSON.parse(saved) : [];
    kitchenOrders = kitchenOrders.map(o => {
      const rawStatus = o.status as string;
      const status: KitchenStatus = rawStatus === 'completed' ? 'served' : (rawStatus as KitchenStatus);
      return { ...o, status, priority: (o.priority || 'normal') as KitchenPriority };
    });
    // Sin auto-poblado desde waitlist: cocina solo muestra pedidos enviados
    // explícitamente a cocina (API o local), no inventarios de la lista de espera.
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

  const clearLocalKitchenCache = useCallback(() => {
    localStorage.removeItem('bizneai-kitchen-orders');
    scheduleMirrorKeyToSqlite('bizneai-kitchen-orders');
  }, []);

  const purgeKitchenOrders = useCallback(
    async (scope: 'beforeToday' | 'all' | 'served' | 'servedToday', opts?: { silent?: boolean }) => {
      if (!shopId) {
        if (!opts?.silent) toast.error('Sin shopId — configura la URL de sync');
        return { deleted: 0 };
      }

      if (!opts?.silent) {
        const labels = {
          beforeToday: 'TODOS los pedidos de días anteriores (cualquier estado)',
          all: 'TODOS los pedidos de cocina',
          served: 'todos los pedidos entregados',
          servedToday: 'los pedidos ENTREGADOS de hoy (pendientes/preparando/listos se conservan)',
        } as const;
        const ok = window.confirm(
          `¿Purgar ${labels[scope]}?\n\nLa lista de espera no se borra; solo el tablero de cocina.`
        );
        if (!ok) return { deleted: 0 };
      }

      try {
        const res = await kitchenAPI.purgeOrders(shopId, scope);
        const deleted = res?.data?.deleted ?? 0;
        if (scope === 'all' || scope === 'beforeToday') {
          clearLocalKitchenCache();
          markKitchenPurgedToday(shopId);
        }
        await loadKitchenOrders();
        if (!opts?.silent) {
          toast.success(
            deleted > 0 ? `Cocina purgada: ${deleted} pedido(s)` : 'No había pedidos para purgar'
          );
        }
        return { deleted };
      } catch (e) {
        console.error('purge kitchen failed', e);
        if (!opts?.silent) toast.error('No se pudo purgar la cocina');
        return { deleted: 0 };
      }
    },
    [shopId, clearLocalKitchenCache, loadKitchenOrders]
  );

  useEffect(() => {
    if (isOpen) loadKitchenOrders();
  }, [isOpen, loadKitchenOrders]);

  // Una vez al día al abrir cocina: limpia pedidos de días anteriores
  useEffect(() => {
    if (!isOpen || !shopId || !useApi) return;
    if (wasKitchenPurgedToday(shopId)) return;
    void (async () => {
      const { deleted } = await purgeKitchenOrders('beforeToday', { silent: true });
      markKitchenPurgedToday(shopId);
      if (deleted > 0) {
        toast.success(`Cocina: se limpiaron ${deleted} pedido(s) de días anteriores`);
      }
    })();
  }, [isOpen, shopId, useApi, purgeKitchenOrders]);

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

  // Tiempo real: el mesero manda una orden por waitlist → el backend emite
  // new-order/kitchen-updated → refresca al instante en vez de esperar los
  // 60s del polling de arriba (que queda como red de seguridad).
  useEffect(() => {
    if (!useApi || !isOpen || !shopId) return;

    kitchenWaitlistSocketService.connect(shopId);
    const refresh = () => loadKitchenOrders();
    kitchenWaitlistSocketService.on('new-order', refresh);
    kitchenWaitlistSocketService.on('kitchen-updated', refresh);
    kitchenWaitlistSocketService.on('order-status-updated', refresh);
    kitchenWaitlistSocketService.on('order-priority-updated', refresh);

    return () => {
      kitchenWaitlistSocketService.off('new-order', refresh);
      kitchenWaitlistSocketService.off('kitchen-updated', refresh);
      kitchenWaitlistSocketService.off('order-status-updated', refresh);
      kitchenWaitlistSocketService.off('order-priority-updated', refresh);
    };
  }, [useApi, isOpen, shopId, loadKitchenOrders]);

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
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      // FIFO: más antiguos primero; LIFO: más recientes primero
      return entryOrder === 'lifo' ? tb - ta : ta - tb;
    });
    setFilteredOrders(filtered);
  }, [orders, statusFilter, priorityFilter, searchTerm, entryOrder]);

  useEffect(() => {
    try {
      localStorage.setItem('bizneai-kitchen-view-mode', viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  useEffect(() => {
    try {
      localStorage.setItem('bizneai-kitchen-entry-order', entryOrder);
    } catch {
      /* ignore */
    }
  }, [entryOrder]);

  useEffect(() => {
    if (!viewMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setViewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [viewMenuOpen]);

  const saveKitchenOrders = (newOrders: KitchenOrder[]) => {
    localStorage.setItem('bizneai-kitchen-orders', JSON.stringify(newOrders));
    scheduleMirrorKeyToSqlite('bizneai-kitchen-orders');
  };

  const handleStatusChange = async (orderId: string, newStatus: KitchenOrder['status']) => {
    if (useApi && shopId) {
      try {
        // Cloud API usa `served` (no `completed`). Enviar completed hace fallar el update
        // y deja desktop/app/web con estados distintos.
        if (newStatus !== 'cancelled') {
          await kitchenAPI.partialUpdateOrder(orderId, shopId, {
            status: newStatus as 'pending' | 'preparing' | 'ready' | 'served',
          });
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
      scheduleMirrorKeyToSqlite('bizneai-waitlist');
    }
    toast.success('Estado actualizado');
  };

  const handleDelete = async (orderId: string) => {
    if (!window.confirm('¿Eliminar esta orden?')) return;
    if (useApi && shopId) {
      try {
        await kitchenAPI.deleteOrder(orderId, shopId);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
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

  const toggleSelect = (orderId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    const ids = filteredOrders.map((o) => o._id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const deleteSelectedOrders = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.error('Selecciona al menos un pedido');
      return;
    }
    const ok = window.confirm(
      `¿Borrar ${ids.length} pedido(s) seleccionado(s)?\n\nEsta acción no se puede deshacer.`
    );
    if (!ok) return;

    if (useApi && shopId) {
      const results = await Promise.all(ids.map((id) => kitchenAPI.deleteOrder(id, shopId)));
      const failed = results.filter((r) => !r?.success).length;
      setSelectedIds(new Set());
      await loadKitchenOrders();
      if (failed === 0) toast.success(`${ids.length} pedido(s) borrado(s)`);
      else toast.error(`${ids.length - failed} borrados, ${failed} fallaron`);
      return;
    }

    setOrders((prev) => {
      const updated = prev.filter((o) => !selectedIds.has(o._id));
      saveKitchenOrders(updated);
      return updated;
    });
    setSelectedIds(new Set());
    toast.success(`${ids.length} pedido(s) borrado(s)`);
  };

  const deleteAllOrders = async () => {
    const n = orders.length;
    if (n === 0) {
      toast.error('No hay pedidos para borrar');
      return;
    }
    const ok = window.confirm(
      `¿BORRAR TODOS los ${n} pedido(s) de cocina?\n\nConfirma para vaciar el tablero. Esto no se puede deshacer.`
    );
    if (!ok) return;

    if (useApi && shopId) {
      const { deleted } = await purgeKitchenOrders('all', { silent: true });
      setSelectedIds(new Set());
      toast.success(deleted > 0 ? `Se borraron ${deleted} pedido(s)` : 'Tablero vaciado');
      return;
    }

    setOrders([]);
    saveKitchenOrders([]);
    setSelectedIds(new Set());
    toast.success('Tablero de cocina vaciado');
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
        <div className="kitchen-title-block">
          <div className="kitchen-title">
            <ChefHat size={24} />
            <h2>Cocina</h2>
          </div>
          <p className="kitchen-view-hint">
            {viewMode === 'cards'
              ? 'Vista tarjetas: estado y tiempo. El detalle de ítems está en Lista de espera.'
              : 'Vista detalle (tipo web): ítems y acciones por pedido.'}
            {' '}
            Orden: {entryOrder === 'fifo' ? 'FIFO (primero en entrar arriba)' : 'LIFO (último en entrar arriba)'}.
          </p>
        </div>
        <div className="header-actions">
          <div className="kitchen-view-menu" ref={viewMenuRef}>
            <button
              type="button"
              className="action-btn kitchen-view-menu-trigger"
              onClick={() => setViewMenuOpen((o) => !o)}
              title="Vista y orden de cocina"
              aria-expanded={viewMenuOpen}
              aria-haspopup="menu"
            >
              {viewMode === 'cards' ? <LayoutGrid size={18} /> : <Rows3 size={18} />}
              <span>
                {viewMode === 'cards' ? 'Tarjetas' : 'Detalle'} · {entryOrder === 'fifo' ? 'FIFO' : 'LIFO'}
              </span>
              <ChevronDown size={16} className={viewMenuOpen ? 'kitchen-chevron-open' : undefined} />
            </button>
            {viewMenuOpen && (
              <div className="kitchen-view-dropdown" role="menu">
                <p className="kitchen-view-dropdown-label">Vista</p>
                <button
                  type="button"
                  role="menuitem"
                  className={viewMode === 'cards' ? 'active' : undefined}
                  onClick={() => {
                    setViewMode('cards');
                    setViewMenuOpen(false);
                  }}
                >
                  <LayoutGrid size={16} />
                  Tarjetas
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={viewMode === 'detail' ? 'active' : undefined}
                  onClick={() => {
                    setViewMode('detail');
                    setViewMenuOpen(false);
                  }}
                >
                  <Rows3 size={16} />
                  Detalle web
                </button>
                <hr />
                <p className="kitchen-view-dropdown-label">Orden de entrada</p>
                <button
                  type="button"
                  role="menuitem"
                  className={entryOrder === 'fifo' ? 'active-order' : undefined}
                  onClick={() => {
                    setEntryOrder('fifo');
                    setViewMenuOpen(false);
                  }}
                >
                  <ArrowUpAZ size={16} />
                  FIFO — primero arriba
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={entryOrder === 'lifo' ? 'active-order' : undefined}
                  onClick={() => {
                    setEntryOrder('lifo');
                    setViewMenuOpen(false);
                  }}
                >
                  <ArrowDownAZ size={16} />
                  LIFO — último arriba
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className={`action-btn ${kitchenPanel === 'stats' ? 'kitchen-toggle-btn active' : ''}`}
            onClick={() => setKitchenPanel((p) => (p === 'stats' ? 'board' : 'stats'))}
            title="Estadísticas OLAP"
          >
            <BarChart3 size={20} />
            {kitchenPanel === 'stats' ? 'Pedidos' : 'Estadísticas'}
          </button>
          {kitchenPanel === 'board' && (
          <button className="action-btn" onClick={() => loadKitchenOrders()} title="Actualizar" disabled={isLoading}>
            <RefreshCw size={20} className={isLoading ? 'spinner' : ''} />
            Actualizar
          </button>
          )}
          {kitchenPanel === 'board' && (
          <>
          <button
            className="action-btn"
            onClick={() => void deleteSelectedOrders()}
            title="Borrar pedidos marcados"
            disabled={isLoading || selectedIds.size === 0}
            style={{ color: selectedIds.size > 0 ? '#f87171' : undefined }}
          >
            <Trash2 size={20} />
            Borrar seleccionados ({selectedIds.size})
          </button>
          <button
            className="action-btn"
            onClick={() => void deleteAllOrders()}
            title="Borrar todos los pedidos del tablero"
            disabled={isLoading || orders.length === 0}
            style={{ color: '#f87171' }}
          >
            <Trash2 size={20} />
            Borrar todo
          </button>
          <button
            className="action-btn"
            onClick={() => void purgeKitchenOrders('beforeToday')}
            title="Días anteriores: borrar todos los estados"
            disabled={isLoading || !shopId}
          >
            <Eraser size={20} />
            Purgar ayer
          </button>
          <button
            className="action-btn"
            onClick={() => void purgeKitchenOrders('servedToday')}
            title="Hoy: solo pedidos entregados"
            disabled={isLoading || !shopId}
          >
            <CheckCircle size={20} />
            Purgar entregados hoy
          </button>
          </>
          )}
        </div>
      </div>

      {kitchenPanel === 'stats' ? (
        <KitchenStats onBack={() => setKitchenPanel('board')} />
      ) : (
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
              placeholder="Buscar por cliente, mesa, ticket… (el detalle de ítems está en Lista de espera)"
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
          {filteredOrders.length > 0 && (
            <label
              className="kitchen-select-all"
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <input
                type="checkbox"
                checked={
                  filteredOrders.length > 0 &&
                  filteredOrders.every((o) => selectedIds.has(o._id))
                }
                onChange={toggleSelectAllFiltered}
              />
              Seleccionar visibles
            </label>
          )}
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
            <div className={viewMode === 'cards' ? 'kitchen-grid' : 'kitchen-detail-list'}>
              {filteredOrders.map(order =>
                viewMode === 'cards' ? (
                <div
                  key={order._id}
                  className="kitchen-order-card kitchen-card-web"
                  style={
                    selectedIds.has(order._id)
                      ? { outline: '2px solid #3b82f6', outlineOffset: 2 }
                      : undefined
                  }
                >
                  <div className="kitchen-card-top">
                    <label
                      style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order._id)}
                        onChange={() => toggleSelect(order._id)}
                      />
                    </label>
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

                  <h3 className="kitchen-card-mesa">{order.customerName || 'Cliente'}</h3>
                  <p className="kitchen-card-meta">
                    {order.tableNumber ? `Mesa ${order.tableNumber}` : 'Sin mesa'}
                    {order.waiterName ? ` · ${order.waiterName}` : ''}
                    {order.source === 'waitlist' ? ' · Lista de espera' : ''}
                  </p>

                  <div className="kitchen-card-time kitchen-card-time--hero">
                    <span className="kitchen-elapsed-main" title="Tiempo desde que entró a cocina">
                      {formatElapsedTime(order.timestamp)}
                    </span>
                    <span className="kitchen-time-sub">
                      {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <p className="kitchen-card-volume">{kitchenLineSummary(order)}</p>

                  <p className="kitchen-card-order-id">#{order.orderId || order._id?.slice(-12)}</p>

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
                ) : (
                <div
                  key={order._id}
                  className="kitchen-detail-row"
                  style={
                    selectedIds.has(order._id)
                      ? { outline: '2px solid #3b82f6', outlineOffset: 2 }
                      : undefined
                  }
                >
                  <div className="kitchen-detail-row-head">
                    <label className="kitchen-detail-check">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order._id)}
                        onChange={() => toggleSelect(order._id)}
                      />
                    </label>
                    <div className="kitchen-detail-titles">
                      <h3>{order.customerName || 'Cliente'}</h3>
                      <p>
                        {order.tableNumber ? `Mesa ${order.tableNumber}` : 'Sin mesa'}
                        {order.waiterName ? ` · ${order.waiterName}` : ''}
                        {' · '}
                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        {' · '}
                        {formatElapsedTime(order.timestamp)}
                      </p>
                    </div>
                    <span
                      className="kitchen-pill status-pill"
                      style={{ background: getStatusColor(order.status) + '20', color: getStatusColor(order.status) }}
                    >
                      {getStatusLabelShort(order.status)}
                    </span>
                  </div>
                  <ul className="kitchen-detail-items">
                    {(order.items || []).map((it, idx) => (
                      <li key={`${order._id}-it-${idx}`}>
                        <strong>{it.quantity}x</strong> {it.product?.name || 'Producto'}
                        {it.notes ? <em> — {it.notes}</em> : null}
                      </li>
                    ))}
                  </ul>
                  <div className="kitchen-card-actions">
                    {order.status === 'pending' && (
                      <button className="status-btn preparing" onClick={() => handleStatusChange(order._id, 'preparing')}>
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
                      <button className="status-btn delete" onClick={() => handleDelete(order._id)}>
                        Borrar
                      </button>
                    )}
                  </div>
                </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default Kitchen;
