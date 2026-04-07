import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Search,
  Filter,
  User,
  Phone,
  Mail,
  Users,
  FileText,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  X,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Eye,
  ArrowUpDown,
  Package,
  ChefHat,
  CheckSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { waitlistAPI } from '../api/waitlist';
import { useStore } from '../contexts/StoreContext';
import { scheduleMirrorKeyToSqlite } from '../services/posPersistService';

interface WaitlistItem {
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
  };
  quantity: number;
}

interface WaitlistEntry {
  _id: string;
  shopId: string;
  name: string;
  items: WaitlistItem[];
  total: number;
  source: 'local' | 'online';
  status: 'waiting' | 'completed'; // Solo waiting y completed, sin preparing/ready (esos son de cocina)
  notes?: string;
  customerInfo?: {
    name: string;
    phone?: string;
    email?: string;
  };
  timestamp: string;
  partySize?: number;
  estimatedWaitTime?: number;
}

interface WaitlistProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadToCart?: (entry: WaitlistEntry) => void;
}

type StatusFilter = 'all' | 'waiting' | 'completed'; // Solo waiting y completed
type SourceFilter = 'all' | 'local' | 'online';

const Waitlist: React.FC<WaitlistProps> = ({ isOpen, onClose, onLoadToCart }) => {
  const { storeIdentifiers } = useStore();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<WaitlistEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'name' | 'total'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'waitlist' | 'online-orders'>('waitlist');

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [partySize, setPartySize] = useState(1);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(15);
  const [notes, setNotes] = useState('');

  // Define loadLocalWaitlist first
  const loadLocalWaitlist = React.useCallback(() => {
    const saved = localStorage.getItem('bizneai-waitlist');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEntries(parsed);
      } catch (error) {
        console.error('Error loading local waitlist:', error);
        setEntries([]);
      }
    } else {
      setEntries([]);
    }
  }, []);

  // Load waitlist entries when component opens
  useEffect(() => {
    if (isOpen) {
      loadWaitlistEntries();
    }
  }, [isOpen]);

  // Force reload when waitlist is opened (in case new entries were added)
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure localStorage is updated
      const timer = setTimeout(() => {
        loadLocalWaitlist();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, loadLocalWaitlist]);

  // Listen for waitlist updates from localStorage
  useEffect(() => {
    if (!isOpen) return;
    
    const handleStorageChange = () => {
      loadLocalWaitlist();
    };
    
    const handleWaitlistUpdated = () => {
      loadLocalWaitlist();
    };
    
    // Listen for storage events (from other tabs)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom event (from same window)
    window.addEventListener('waitlist-updated', handleWaitlistUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('waitlist-updated', handleWaitlistUpdated);
    };
  }, [isOpen, loadLocalWaitlist]);

  // Filter and sort entries
  useEffect(() => {
    let filtered = [...entries];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.customerInfo?.phone?.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(entry => entry.status === statusFilter);
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(entry => entry.source === sourceFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'timestamp':
          aVal = new Date(a.timestamp).getTime();
          bVal = new Date(b.timestamp).getTime();
          break;
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'total':
          aVal = a.total;
          bVal = b.total;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredEntries(filtered);
  }, [entries, searchTerm, statusFilter, sourceFilter, sortBy, sortOrder]);

  const loadWaitlistEntries = async () => {
    setIsLoading(true);
    try {
      // Primero intentar cargar desde localStorage (más rápido)
      loadLocalWaitlist();
      
      // Luego intentar sincronizar con servidor si hay storeId
      if (storeIdentifiers._id) {
        try {
          const response = await waitlistAPI.getWaitlistEntries(storeIdentifiers._id, {
            page: 1,
            limit: 100
          });
          
          if (response.success && response.data && response.data.length > 0) {
            // Filtrar y mapear entradas para que solo tengan status 'waiting' o 'completed'
            const filteredEntries = response.data
              .filter((entry: any) => entry.status === 'waiting' || entry.status === 'completed')
              .map((entry: any) => ({
                ...entry,
                status: entry.status as 'waiting' | 'completed'
              }));
            setEntries(filteredEntries);
            // Guardar también en localStorage
            localStorage.setItem('bizneai-waitlist', JSON.stringify(filteredEntries));
            scheduleMirrorKeyToSqlite('bizneai-waitlist');
          }
        } catch (error) {
          console.error('Error loading from server, using local:', error);
          // Ya cargamos desde local, no hay problema
        }
      }
    } catch (error) {
      console.error('Error loading waitlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveLocalWaitlist = (newEntries: WaitlistEntry[]) => {
    localStorage.setItem('bizneai-waitlist', JSON.stringify(newEntries));
    scheduleMirrorKeyToSqlite('bizneai-waitlist');
  };

  const handleAddToWaitlist = async () => {
    if (!customerName.trim()) {
      toast.error('El nombre del cliente es requerido');
      return;
    }

    if (!storeIdentifiers._id) {
      toast.error('No hay tienda configurada');
      return;
    }

    setIsLoading(true);
    try {
      const newEntry: WaitlistEntry = {
        _id: `waitlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        shopId: storeIdentifiers._id,
        name: customerName,
        items: [],
        total: 0,
        source: 'local',
        status: 'waiting',
        notes: notes || undefined,
        customerInfo: {
          name: customerName,
          phone: phoneNumber || undefined,
          email: email || undefined
        },
        timestamp: new Date().toISOString(),
        partySize: partySize || undefined,
        estimatedWaitTime: estimatedWaitTime || undefined
      };

      // Try to save to server
      try {
        const response = await waitlistAPI.addCustomerToWaitlist({
          customerName,
          phoneNumber: phoneNumber || '',
          partySize,
          estimatedWaitTime,
          shopId: storeIdentifiers._id
        });
        
        if (response.success && response.data) {
          setEntries(prev => {
            const updated = [response.data as WaitlistEntry, ...prev];
            saveLocalWaitlist(updated);
            return updated;
          });
        } else {
          throw new Error('Server response failed');
        }
      } catch (error) {
        // Fallback to local storage
        setEntries(prev => {
          const updated = [newEntry, ...prev];
          saveLocalWaitlist(updated);
          return updated;
        });
      }

      toast.success('Cliente agregado a la lista de espera');
      setIsAddModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Error al agregar a la lista de espera');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (entryId: string, newStatus: WaitlistEntry['status']) => {
    setEntries(prev => {
      const updated = prev.map(entry =>
        entry._id === entryId ? { ...entry, status: newStatus } : entry
      );
      saveLocalWaitlist(updated);
      return updated;
    });
    toast.success('Estado actualizado');
  };

  const handleLoadToCart = (entry: WaitlistEntry) => {
    if (!entry.items || entry.items.length === 0) {
      toast.error('Esta entrada no tiene items para cargar al carrito');
      return;
    }
    
    if (onLoadToCart) {
      onLoadToCart(entry);
      toast.success(`Orden de ${entry.name} cargada al carrito`);
    } else {
      toast('Funcionalidad de cargar al carrito no disponible', { icon: 'ℹ️' });
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta entrada de la lista de espera?')) {
      setEntries(prev => {
        const updated = prev.filter(entry => entry._id !== entryId);
        saveLocalWaitlist(updated);
        return updated;
      });
      toast.success('Entrada eliminada');
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setPhoneNumber('');
    setEmail('');
    setPartySize(1);
    setEstimatedWaitTime(15);
    setNotes('');
  };

  const getStatusColor = (status: WaitlistEntry['status']) => {
    switch (status) {
      case 'waiting':
        return '#f59e0b';
      case 'completed':
        return '#64748b';
      default:
        return '#64748b';
    }
  };

  const getStatusLabel = (status: WaitlistEntry['status']) => {
    switch (status) {
      case 'waiting':
        return 'En Espera';
      case 'completed':
        return 'Completado';
      default:
        return status;
    }
  };

  // Statistics - Solo waiting y completed
  const stats = {
    total: entries.length,
    waiting: entries.filter(e => e.status === 'waiting').length,
    completed: entries.filter(e => e.status === 'completed').length
  };

  // Función para renderizar tarjeta de waitlist
  const renderWaitlistCard = (entry: WaitlistEntry) => (
    <div key={entry._id} className="waitlist-card">
      <div className="waitlist-card-header">
        <div className="waitlist-card-title">
          <h3>{entry.name}</h3>
          <span
            className="status-badge"
            style={{ background: getStatusColor(entry.status) + '20', color: getStatusColor(entry.status) }}
          >
            {getStatusLabel(entry.status)}
          </span>
        </div>
        <div className="waitlist-card-actions">
          {entry.items && entry.items.length > 0 && (
            <button
              className="icon-btn-small"
              onClick={() => handleLoadToCart(entry)}
              title="Cargar al carrito"
              style={{ color: '#10b981' }}
            >
              <ShoppingCart size={16} />
            </button>
          )}
          <button
            className="icon-btn-small"
            onClick={() => handleDeleteEntry(entry._id)}
            title="Eliminar"
            style={{ color: '#ef4444' }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="waitlist-card-body">
        {entry.customerInfo && (
          <div className="waitlist-info-row">
            {entry.customerInfo.phone && (
              <div className="info-item">
                <Phone size={14} />
                <span>{entry.customerInfo.phone}</span>
              </div>
            )}
            {entry.customerInfo.email && (
              <div className="info-item">
                <Mail size={14} />
                <span>{entry.customerInfo.email}</span>
              </div>
            )}
          </div>
        )}

        {entry.partySize && (
          <div className="info-item">
            <Users size={14} />
            <span>{entry.partySize} personas</span>
          </div>
        )}

        {entry.estimatedWaitTime && (
          <div className="info-item">
            <Clock size={14} />
            <span>~{entry.estimatedWaitTime} min</span>
          </div>
        )}

        {entry.items && entry.items.length > 0 && (
          <div className="waitlist-items">
            <strong>Items:</strong>
            <ul>
              {entry.items.map((item, idx) => (
                <li key={idx}>
                  {item.quantity}x {item.product.name} - ${(item.product.price * item.quantity).toFixed(2)}
                </li>
              ))}
            </ul>
            <div className="waitlist-total">
              <strong>Total: ${entry.total.toFixed(2)}</strong>
            </div>
          </div>
        )}

        {entry.notes && (
          <div className="waitlist-notes">
            <FileText size={14} />
            <span>{entry.notes}</span>
          </div>
        )}

        <div className="waitlist-timestamp">
          {new Date(entry.timestamp).toLocaleString()}
        </div>
      </div>

      <div className="waitlist-card-footer">
        <div className="status-buttons">
          <button
            className={`status-btn ${entry.status === 'waiting' ? 'active' : ''}`}
            onClick={() => handleUpdateStatus(entry._id, 'waiting')}
          >
            En Espera
          </button>
          <button
            className={`status-btn ${entry.status === 'completed' ? 'active' : ''}`}
            onClick={() => handleUpdateStatus(entry._id, 'completed')}
          >
            Completado
          </button>
        </div>
        {entry.items && entry.items.length > 0 && (
          <button
            className="btn-primary"
            onClick={() => handleLoadToCart(entry)}
            style={{ marginTop: '0.5rem', width: '100%' }}
          >
            <ShoppingCart size={16} />
            Cargar al Carrito
          </button>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="waitlist-overlay">
      <div className="waitlist-modal">
        <div className="waitlist-header">
          <h2>Lista de Espera</h2>
          <div className="header-actions">
            <button className="action-btn" onClick={loadWaitlistEntries} title="Actualizar">
              <RefreshCw size={20} />
            </button>
            <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={20} />
              Agregar Cliente
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="waitlist-content">
          {/* Tabs */}
          <div className="waitlist-tabs">
            <button
              className={`waitlist-tab ${activeTab === 'waitlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('waitlist')}
            >
              <Clock size={18} />
              Lista de Espera
            </button>
            <button
              className={`waitlist-tab ${activeTab === 'online-orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('online-orders')}
            >
              <Package size={18} />
              Órdenes Online
            </button>
          </div>

          {/* Statistics */}
          <div className="waitlist-stats">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <h3>{stats.total}</h3>
                <p>Total</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <AlertCircle size={24} />
              </div>
              <div className="stat-content">
                <h3>{stats.waiting}</h3>
                <p>En Espera</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(100, 116, 139, 0.1)', color: '#64748b' }}>
                <CheckSquare size={24} />
              </div>
              <div className="stat-content">
                <h3>{stats.completed}</h3>
                <p>Completado</p>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="waitlist-filters">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono..."
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
              <option value="waiting">En Espera</option>
              <option value="completed">Completado</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
              className="filter-select"
            >
              <option value="all">Todas las fuentes</option>
              <option value="local">Local</option>
              <option value="online">Online</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as typeof sortBy);
                setSortOrder(order as typeof sortOrder);
              }}
              className="filter-select"
            >
              <option value="timestamp-desc">Más reciente</option>
              <option value="timestamp-asc">Más antiguo</option>
              <option value="name-asc">Nombre (A-Z)</option>
              <option value="name-desc">Nombre (Z-A)</option>
              <option value="total-desc">Total (Mayor)</option>
              <option value="total-asc">Total (Menor)</option>
            </select>
          </div>

          {/* Waitlist Entries */}
          <div className="waitlist-entries">
            {isLoading ? (
              <div className="empty-state">
                <RefreshCw size={48} className="spinner" />
                <p>Cargando lista de espera...</p>
              </div>
            ) : activeTab === 'waitlist' ? (
              // Vista de Lista de Espera Local
              filteredEntries.filter(e => e.source === 'local').length === 0 ? (
                <div className="empty-state">
                  <Clock size={48} style={{ opacity: 0.5 }} />
                  <h3>No hay entradas en la lista de espera</h3>
                  <p>Agrega clientes para comenzar</p>
                  <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
                    <Plus size={18} />
                    Agregar Cliente
                  </button>
                </div>
              ) : (
                <div className="waitlist-grid">
                  {filteredEntries.filter(e => e.source === 'local').map(entry => (
                    renderWaitlistCard(entry)
                  ))}
                </div>
              )
            ) : (
              // Vista de Órdenes Online
              filteredEntries.filter(e => e.source === 'online').length === 0 ? (
                <div className="empty-state">
                  <Package size={48} style={{ opacity: 0.5 }} />
                  <h3>No hay órdenes online</h3>
                  <p>Las órdenes recibidas online aparecerán aquí</p>
                </div>
              ) : (
                <div className="waitlist-grid">
                  {filteredEntries.filter(e => e.source === 'online').map(entry => (
                    renderWaitlistCard(entry)
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Agregar Cliente a Lista de Espera</h3>
              <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre del Cliente *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tamaño del Grupo</label>
                  <input
                    type="number"
                    min="1"
                    value={partySize}
                    onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="form-group">
                  <label>Tiempo Estimado (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={estimatedWaitTime}
                    onChange={(e) => setEstimatedWaitTime(parseInt(e.target.value) || 15)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Notas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleAddToWaitlist} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw size={18} className="spinner" />
                    Agregando...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Agregar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Waitlist;

