import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  Star,
  UserPlus,
  UserCheck,
  UserX,
  Filter,
  Download,
  RefreshCw,
  X,
  Eye,
  MessageSquare,
  CreditCard,
  Award,
  TrendingUp,
  BarChart3,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { CustomerStatus, RegistryCustomer as Customer } from '../types/customerRegistry';
import { isShopIdConfigured } from '../utils/shopIdHelper';
import { isBatchDue, syncMcpBatch } from '../utils/syncService';
import {
  loadCustomers,
  saveCustomers,
  computeCustomerStatus,
  getCustomerStatusLabel,
  getCustomerFullName,
} from '../services/customerRegistry';
import { summarizeMerkleSalesForRegistryCustomer } from '../services/merkleTreeService';
import {
  canSyncCustomersToMcp,
  pullCustomersFromMcp,
  syncCustomerToMcpAfterSave,
} from '../services/customerMcpSync';
import type { CustomerAccountAdjustmentKind } from '../types/saleWaitlistCredit';
import {
  appendLedgerEntry,
  getCustomerAccountBalance,
  listLedgerForCustomer,
} from '../services/customerAccountLedger';

interface CustomerManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Totales mostrados: máximo entre registro local y ventas en historial Merkle (evita $0 si hubo cobros POS). */
function getMergedPosDisplay(
  c: Customer,
  summary: ReturnType<typeof summarizeMerkleSalesForRegistryCustomer> | undefined
): { spent: number; orders: number; lastPurchaseIso: string; crmStatus: CustomerStatus } {
  const s = summary ?? { rows: [], totalSpent: 0, orderCount: 0, lastDate: null };
  const spent = Math.max(c.totalSpent ?? 0, s.totalSpent);
  const orders = Math.max(c.totalOrders ?? 0, s.orderCount);
  let lastPurchaseIso = c.lastPurchase || '';
  if (s.lastDate) {
    const tM = new Date(s.lastDate).getTime();
    const tR = c.lastPurchase ? new Date(c.lastPurchase).getTime() : NaN;
    if (!c.lastPurchase?.trim() || !Number.isFinite(tR) || tM > tR) {
      lastPurchaseIso = new Date(tM).toISOString();
    }
  }
  const crmStatus = computeCustomerStatus({ ...c, totalSpent: spent, totalOrders: orders });
  return { spent, orders, lastPurchaseIso, crmStatus };
}

const membershipLevels = ['bronze', 'silver', 'gold', 'platinum'];
const genders = ['male', 'female', 'other'];

function formatPaymentMethodLabel(method: string): string {
  const m = String(method).toLowerCase();
  const map: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    crypto: 'Crypto',
    codi: 'CODI',
    credit: 'Crédito / diferido',
    mixed: 'Pago mixto',
  };
  return map[m] ?? method;
}

const CustomerManagement = ({ isOpen, onClose }: CustomerManagementProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [membershipFilter, setMembershipFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<'list' | 'grid' | 'analytics'>('list');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer>>({});
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);
  const [mcpBanner, setMcpBanner] = useState<string | null>(null);
  const [mcpPulling, setMcpPulling] = useState(false);
  const [ledgerTick, setLedgerTick] = useState(0);
  const [merkleTick, setMerkleTick] = useState(0);
  const [adjKind, setAdjKind] = useState<CustomerAccountAdjustmentKind>('anticipo');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjNotaId, setAdjNotaId] = useState('');
  const [adjNote, setAdjNote] = useState('');

  useEffect(() => {
    const onLed = () => setLedgerTick((n) => n + 1);
    const onMerkle = () => setMerkleTick((n) => n + 1);
    window.addEventListener('customer-ledger-updated', onLed);
    window.addEventListener('merkle-sales-updated', onMerkle);
    return () => {
      window.removeEventListener('customer-ledger-updated', onLed);
      window.removeEventListener('merkle-sales-updated', onMerkle);
    };
  }, []);

  const merklePosByCustomerId = useMemo(() => {
    void merkleTick;
    const m = new Map<number, ReturnType<typeof summarizeMerkleSalesForRegistryCustomer>>();
    for (const c of customers) {
      m.set(c.id, summarizeMerkleSalesForRegistryCustomer(c.id, getCustomerFullName(c)));
    }
    return m;
  }, [customers, merkleTick]);

  useEffect(() => {
    setAdjAmount('');
    setAdjNotaId('');
    setAdjNote('');
    setAdjKind('anticipo');
  }, [selectedCustomerForDetails?.id]);

  useEffect(() => {
    if (isOpen) {
      const loaded = loadCustomers();
      setCustomers(loaded);
      setFilteredCustomers(loaded);
      setMcpBanner(null);
      if (isShopIdConfigured() && isBatchDue('localCustomers')) {
        void syncMcpBatch('localCustomers', { force: true });
      }
      // No pull automático al abrir: evita ráfagas MCP/mirror y la sensación de "recarga".
      // Sincronización con la nube solo con el botón de actualizar.
    }
  }, [isOpen]);

  const handleMcpRefresh = () => {
    if (!canSyncCustomersToMcp()) {
      setMcpBanner('Configura un shopId válido en Ajustes para sincronizar clientes con la nube.');
      return;
    }
    setMcpPulling(true);
    setMcpBanner(null);
    void pullCustomersFromMcp().then((r) => {
      setMcpPulling(false);
      if (r.ok) {
        const after = loadCustomers();
        setCustomers(after);
        setFilteredCustomers(after);
        setMcpBanner(`Lista actualizada (${r.count ?? 0} clientes en servidor).`);
      } else {
        setMcpBanner(r.error || 'No se pudo sincronizar.');
      }
    });
  };

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, membershipFilter, statusFilter]);

  const filterCustomers = () => {
    let filtered = [...customers];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      );
    }

    // Filtrar por nivel de membresía
    if (membershipFilter !== 'all') {
      filtered = filtered.filter(customer => customer.membershipLevel === membershipFilter);
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => 
        statusFilter === 'active' ? customer.isActive : !customer.isActive
      );
    }

    setFilteredCustomers(filtered);
  };

  const handleAddCustomer = () => {
    setEditingCustomer({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      birthday: '',
      gender: 'male',
      membershipLevel: 'bronze',
      totalSpent: 0,
      totalOrders: 0,
      lastPurchase: '',
      isActive: true,
      notes: '',
      tags: []
    });
    setIsAddModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditingCustomer({ ...customer });
    setIsEditModalOpen(true);
  };

  const handleSaveCustomer = () => {
    const nameTrim = String(editingCustomer.firstName ?? '').trim();
    if (!nameTrim) {
      window.alert('Indica al menos el nombre del cliente.');
      return;
    }

    if (isAddModalOpen) {
      const nextId = customers.length ? Math.max(...customers.map((c) => c.id)) + 1 : 1;
      const draft = {
        ...(editingCustomer as Customer),
        firstName: nameTrim,
      } as Customer;
      const newCustomer: Customer = {
        ...draft,
        id: nextId,
        customerStatus: computeCustomerStatus(draft),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const next = [...customers, newCustomer];
      setCustomers(next);
      saveCustomers(next);
      setIsAddModalOpen(false);
      if (canSyncCustomersToMcp()) {
        void syncCustomerToMcpAfterSave(newCustomer).then((remote) => {
          if (!remote) return;
          setCustomers((prev) => {
            const upd = prev.map((x) => (x.id === remote.id ? remote : x));
            saveCustomers(upd);
            return upd;
          });
        });
      }
    } else if (isEditModalOpen && selectedCustomer) {
      const updated = customers.map((c) => {
        if (c.id !== selectedCustomer.id) return c;
        const merged = {
          ...(editingCustomer as Customer),
          firstName: nameTrim,
          updatedAt: new Date().toISOString(),
        };
        merged.customerStatus = computeCustomerStatus(merged);
        return merged;
      });
      const row = updated.find((c) => c.id === selectedCustomer.id);
      setCustomers(updated);
      saveCustomers(updated);
      setIsEditModalOpen(false);
      setSelectedCustomer(null);
      if (row && canSyncCustomersToMcp()) {
        void syncCustomerToMcpAfterSave(row).then((remote) => {
          if (!remote) return;
          setCustomers((prev) => {
            const upd = prev.map((x) => (x.id === remote.id ? remote : x));
            saveCustomers(upd);
            return upd;
          });
        });
      }
    }
    setEditingCustomer({});
  };

  const handleDeleteCustomer = (customerId: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      const next = customers.filter((c) => c.id !== customerId);
      setCustomers(next);
      saveCustomers(next);
    }
  };

  const getMembershipColor = (level: string) => {
    const colors: { [key: string]: string } = {
      bronze: '#cd7f32',
      silver: '#c0c0c0',
      gold: '#ffd700',
      platinum: '#e5e4e2'
    };
    return colors[level] || '#64748b';
  };

  const getMembershipName = (level: string) => {
    const names: { [key: string]: string } = {
      bronze: 'Bronce',
      silver: 'Plata',
      gold: 'Oro',
      platinum: 'Platino'
    };
    return names[level] || level;
  };

  const renderCustomerForm = () => (
    <div className="customer-form-modal">
      <div className="form-header">
        <h3>{isAddModalOpen ? 'Agregar Cliente' : 'Editar Cliente'}</h3>
        <button className="close-btn" onClick={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingCustomer({});
        }}>
          <X size={20} />
        </button>
      </div>
      
      <div className="customer-form-modal-scroll">
        <div className="form-grid customer-form-grid">
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              value={editingCustomer.firstName || ''}
              onChange={(e) => setEditingCustomer({...editingCustomer, firstName: e.target.value})}
              placeholder="Ej: María"
              autoComplete="given-name"
            />
          </div>

          <div className="form-group">
            <label>Apellido</label>
            <input
              type="text"
              value={editingCustomer.lastName || ''}
              onChange={(e) => setEditingCustomer({...editingCustomer, lastName: e.target.value})}
              placeholder="Opcional"
              autoComplete="family-name"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={editingCustomer.email || ''}
              onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
              placeholder="Opcional"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              value={editingCustomer.phone || ''}
              onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
              placeholder="Opcional"
              autoComplete="tel"
            />
          </div>

          <div className="form-group full-width">
            <label>Dirección</label>
            <input
              type="text"
              value={editingCustomer.address || ''}
              onChange={(e) => setEditingCustomer({...editingCustomer, address: e.target.value})}
              placeholder="Av. Insurgentes Sur 1234"
            />
          </div>

          <div className="form-group">
            <label>Ciudad</label>
            <input
              type="text"
              value={editingCustomer.city || ''}
              onChange={(e) => setEditingCustomer({...editingCustomer, city: e.target.value})}
              placeholder="Ciudad de México"
            />
          </div>

          <div className="form-group">
            <label>Estado</label>
            <input
              type="text"
              value={editingCustomer.state || ''}
              onChange={(e) => setEditingCustomer({...editingCustomer, state: e.target.value})}
              placeholder="CDMX"
            />
          </div>

          <div className="form-group">
            <label>Código Postal</label>
            <input
              type="text"
              value={editingCustomer.zipCode || ''}
              onChange={(e) => setEditingCustomer({...editingCustomer, zipCode: e.target.value})}
              placeholder="03100"
            />
          </div>

          <div className="form-group">
            <label>Fecha de Nacimiento</label>
            <input
              type="date"
              value={editingCustomer.birthday || ''}
              onChange={(e) => setEditingCustomer({...editingCustomer, birthday: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Género</label>
            <select
              value={editingCustomer.gender || 'male'}
              onChange={(e) => setEditingCustomer({...editingCustomer, gender: e.target.value as any})}
            >
              {genders.map(gender => (
                <option key={gender} value={gender}>
                  {gender === 'male' ? 'Masculino' : gender === 'female' ? 'Femenino' : 'Otro'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Nivel de Membresía</label>
            <select
              value={editingCustomer.membershipLevel || 'bronze'}
              onChange={(e) => setEditingCustomer({...editingCustomer, membershipLevel: e.target.value as any})}
            >
              {membershipLevels.map(level => (
                <option key={level} value={level}>{getMembershipName(level)}</option>
              ))}
            </select>
          </div>

          <div className="form-group full-width">
            <label>Notas</label>
            <textarea
              value={editingCustomer.notes || ''}
              onChange={(e) => setEditingCustomer({...editingCustomer, notes: e.target.value})}
              placeholder="Notas sobre el cliente..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Estado</label>
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="isActive"
                checked={editingCustomer.isActive !== false}
                onChange={(e) => setEditingCustomer({...editingCustomer, isActive: e.target.checked})}
              />
              <label htmlFor="isActive">Cliente activo</label>
            </div>
          </div>
        </div>
      </div>

      <div className="customer-form-modal-footer form-actions">
        <button type="button" className="btn-secondary" onClick={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingCustomer({});
        }}>
          Cancelar
        </button>
        <button type="button" className="btn-primary" onClick={handleSaveCustomer}>
          <UserPlus size={16} />
          Guardar Cliente
        </button>
      </div>
    </div>
  );

  const renderCustomerList = () => (
    <div className="customers-list">
      <table className="customers-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Contacto</th>
            <th>Membresía</th>
            <th>Compras</th>
            <th>Total Gastado</th>
            <th>Última Compra</th>
            <th>Estado CRM</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.map((customer) => {
            const pos = getMergedPosDisplay(customer, merklePosByCustomerId.get(customer.id));
            return (
              <tr key={customer.id}>
                <td>
                  <div className="customer-info">
                    <div className="customer-avatar">
                      <Users size={24} />
                    </div>
                    <div>
                      <div className="customer-name">{customer.firstName} {customer.lastName}</div>
                      <div className="customer-location">{customer.city}, {customer.state}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="contact-info">
                    <div className="contact-item">
                      <Mail size={14} />
                      <span>{customer.email}</span>
                    </div>
                    <div className="contact-item">
                      <Phone size={14} />
                      <span>{customer.phone}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span 
                    className="membership-badge"
                    style={{ backgroundColor: getMembershipColor(customer.membershipLevel) }}
                  >
                    {getMembershipName(customer.membershipLevel)}
                  </span>
                </td>
                <td>
                  <div className="purchase-info">
                    <span className="purchase-count">{pos.orders} órdenes (POS)</span>
                  </div>
                </td>
                <td>
                  <span className="total-spent">${pos.spent.toFixed(2)}</span>
                </td>
                <td>
                  <span className="last-purchase">
                    {pos.lastPurchaseIso ? new Date(pos.lastPurchaseIso).toLocaleDateString() : 'Nunca'}
                  </span>
                </td>
                <td>
                  <span className="crm-status-label">{getCustomerStatusLabel(pos.crmStatus)}</span>
                </td>
                <td className="customers-table-actions-cell">
                  <div className="customers-table-actions">
                    <button
                      type="button"
                      className="customers-row-btn customers-row-btn--ghost"
                      onClick={() => setSelectedCustomerForDetails(customer)}
                      title="Ver detalles"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      className="customers-row-btn customers-row-btn--edit"
                      onClick={() => handleEditCustomer(customer)}
                      title="Editar cliente"
                    >
                      <Edit size={16} />
                      Editar
                    </button>
                    <button
                      type="button"
                      className="customers-row-btn customers-row-btn--delete"
                      onClick={() => handleDeleteCustomer(customer.id)}
                      title="Eliminar cliente"
                    >
                      <Trash2 size={16} />
                      Eliminar
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

  const renderCustomerGrid = () => (
    <div className="customers-grid">
      {filteredCustomers.map((customer) => {
        const pos = getMergedPosDisplay(customer, merklePosByCustomerId.get(customer.id));
        return (
          <div key={customer.id} className="customer-card">
            <div className="customer-card-header">
              <div className="customer-avatar">
                <Users size={32} />
              </div>
              <div className="customer-status">
                <span className={`status-badge ${customer.isActive ? 'active' : 'inactive'}`}>
                  {customer.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
            
            <div className="customer-card-content">
              <h3 className="customer-name">{customer.firstName} {customer.lastName}</h3>
              <p className="customer-email">{customer.email}</p>
              
              <div className="customer-details">
                <div className="detail-row">
                  <span className="label">Teléfono:</span>
                  <span className="value">{customer.phone}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Ubicación:</span>
                  <span className="value">{customer.city}, {customer.state}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Membresía:</span>
                  <span 
                    className="value membership-badge"
                    style={{ backgroundColor: getMembershipColor(customer.membershipLevel) }}
                  >
                    {getMembershipName(customer.membershipLevel)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Total gastado:</span>
                  <span className="value total-spent">${pos.spent.toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Órdenes:</span>
                  <span className="value">{pos.orders}</span>
                </div>
              </div>
            </div>
            
            <div className="customer-card-actions">
              <button className="btn-secondary" onClick={() => setSelectedCustomerForDetails(customer)}>
                <Eye size={16} />
                Ver Detalles
              </button>
              <button className="btn-secondary" onClick={() => handleEditCustomer(customer)}>
                <Edit size={16} />
                Editar
              </button>
              <button className="btn-danger" onClick={() => handleDeleteCustomer(customer.id)}>
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
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.isActive).length;
    const mergedRows = customers.map((c) => ({
      customer: c,
      ...getMergedPosDisplay(c, merklePosByCustomerId.get(c.id)),
    }));
    const totalRevenue = mergedRows.reduce((sum, r) => sum + r.spent, 0);
    const averageSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    const membershipStats = customers.reduce((acc, customer) => {
      acc[customer.membershipLevel] = (acc[customer.membershipLevel] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const topCustomers = [...mergedRows].sort((a, b) => b.spent - a.spent).slice(0, 5);

    return (
      <div className="analytics-view">
        <div className="analytics-stats">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#3b82f6' }}>
              <Users size={24} />
            </div>
            <div className="stat-info">
              <h3>{totalCustomers}</h3>
              <p>Total Clientes</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#059669' }}>
              <UserCheck size={24} />
            </div>
            <div className="stat-info">
              <h3>{activeCustomers}</h3>
              <p>Clientes Activos</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f59e0b' }}>
              <DollarSign size={24} />
            </div>
            <div className="stat-info">
              <h3>${totalRevenue.toFixed(2)}</h3>
              <p>Ingresos Totales</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#8b5cf6' }}>
              <TrendingUp size={24} />
            </div>
            <div className="stat-info">
              <h3>${averageSpent.toFixed(2)}</h3>
              <p>Promedio por Cliente</p>
            </div>
          </div>
        </div>

        <div className="analytics-charts">
          <div className="chart-container">
            <h3>Distribución por Membresía</h3>
            <div className="membership-chart">
              {Object.entries(membershipStats).map(([level, count]) => (
                <div key={level} className="membership-bar">
                  <span className="membership-name">{getMembershipName(level)}</span>
                  <div className="membership-bar-container">
                    <div 
                      className="membership-bar-fill"
                      style={{ 
                        width: `${(count / Math.max(...Object.values(membershipStats))) * 100}%`,
                        backgroundColor: getMembershipColor(level)
                      }}
                    />
                  </div>
                  <span className="membership-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-container">
            <h3>Top 5 Clientes</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--bs-dark-text-muted, #64748b)', margin: '0 0 0.75rem' }}>
              Ingresos y órdenes = registro del cliente o historial de ventas (Merkle) del POS, el valor mayor de ambos.
            </p>
            <div className="top-customers">
              {topCustomers.map((row, index) => (
                <div key={row.customer.id} className="top-customer-item">
                  <div className="customer-rank">
                    <span className="rank-number">{index + 1}</span>
                    <div className="customer-info">
                      <span className="customer-name">
                        {row.customer.firstName} {row.customer.lastName}
                      </span>
                      <span className="customer-level">{getMembershipName(row.customer.membershipLevel)}</span>
                    </div>
                  </div>
                  <div className="customer-stats">
                    <span className="total-spent">${row.spent.toFixed(2)}</span>
                    <span className="order-count">{row.orders} órdenes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomerDetails = () => {
    if (!selectedCustomerForDetails) return null;

    void merkleTick;
    const detailSummary = merklePosByCustomerId.get(selectedCustomerForDetails.id) ?? {
      rows: [],
      totalSpent: 0,
      orderCount: 0,
      lastDate: null,
    };
    const pos = getMergedPosDisplay(selectedCustomerForDetails, detailSummary);
    const recentSales = detailSummary.rows.slice(0, 5);

    return (
      <div className="customer-details-modal">
        <div className="details-header">
          <h3>Detalles del Cliente</h3>
          <button className="close-btn" onClick={() => setSelectedCustomerForDetails(null)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="details-content">
          <div className="customer-profile">
            <div className="profile-header">
              <div className="profile-avatar">
                <Users size={48} />
              </div>
              <div className="profile-info">
                <h2>{selectedCustomerForDetails.firstName} {selectedCustomerForDetails.lastName}</h2>
                <span 
                  className="membership-badge"
                  style={{ backgroundColor: getMembershipColor(selectedCustomerForDetails.membershipLevel) }}
                >
                  {getMembershipName(selectedCustomerForDetails.membershipLevel)}
                </span>
                <span className={`status-badge ${selectedCustomerForDetails.isActive ? 'active' : 'inactive'}`}>
                  {selectedCustomerForDetails.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <div className="profile-details">
              <div className="detail-section">
                <h4>Información de Contacto</h4>
                <div className="contact-details">
                  <div className="contact-item">
                    <Mail size={16} />
                    <span>{selectedCustomerForDetails.email}</span>
                  </div>
                  <div className="contact-item">
                    <Phone size={16} />
                    <span>{selectedCustomerForDetails.phone}</span>
                  </div>
                  <div className="contact-item">
                    <MapPin size={16} />
                    <span>{selectedCustomerForDetails.address}, {selectedCustomerForDetails.city}, {selectedCustomerForDetails.state}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Estadísticas</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--bs-dark-text-muted, #64748b)', margin: '0 0 0.5rem' }}>
                  Totales combinados con ventas registradas en historial Merkle (POS).
                </p>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Total Gastado</span>
                    <span className="stat-value">${pos.spent.toFixed(2)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Órdenes</span>
                    <span className="stat-value">{pos.orders}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Última Compra</span>
                    <span className="stat-value">
                      {pos.lastPurchaseIso ? new Date(pos.lastPurchaseIso).toLocaleDateString() : 'Nunca'}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Cliente desde</span>
                    <span className="stat-value">{new Date(selectedCustomerForDetails.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section" key={`ledger-${ledgerTick}`}>
                <h4>Cuenta corriente</h4>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  Saldo adeudado (positivo = debe a la tienda):{' '}
                  <strong>${getCustomerAccountBalance(selectedCustomerForDetails.id).toFixed(2)}</strong>
                </p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                  Conceptos: <strong>cobranza</strong> (cargo), <strong>anticipo</strong> (abono a cuenta),{' '}
                  <strong>cobro sobre nota</strong> (abono ligado al ID de nota).
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '420px' }}>
                  <label className="customer-form-label">Concepto</label>
                  <select
                    className="customer-form-input"
                    value={adjKind}
                    onChange={(e) => setAdjKind(e.target.value as CustomerAccountAdjustmentKind)}
                  >
                    <option value="cobranza">Cobranza (cargo)</option>
                    <option value="anticipo">Anticipo (abono)</option>
                    <option value="cobro_sobre_nota">Cobro sobre nota</option>
                  </select>
                  {adjKind === 'cobro_sobre_nota' && (
                    <>
                      <label className="customer-form-label">ID de nota</label>
                      <input
                        className="customer-form-input"
                        value={adjNotaId}
                        onChange={(e) => setAdjNotaId(e.target.value)}
                        placeholder="Ej. NOTA-123"
                      />
                    </>
                  )}
                  <label className="customer-form-label">Monto</label>
                  <input
                    className="customer-form-input"
                    type="number"
                    min={0}
                    step="0.01"
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value)}
                  />
                  <label className="customer-form-label">Descripción (opcional)</label>
                  <input
                    className="customer-form-input"
                    value={adjNote}
                    onChange={(e) => setAdjNote(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}
                    onClick={() => {
                      const amt = parseFloat(adjAmount);
                      const r = appendLedgerEntry({
                        customerId: selectedCustomerForDetails.id,
                        kind: adjKind,
                        amount: amt,
                        notaId: adjKind === 'cobro_sobre_nota' ? adjNotaId : undefined,
                        note: adjNote || undefined,
                      });
                      if (r.ok) {
                        toast.success('Movimiento registrado');
                        setAdjAmount('');
                        setAdjNotaId('');
                        setAdjNote('');
                        setLedgerTick((x) => x + 1);
                      } else if (!r.ok && 'error' in r) {
                        toast.error(r.error);
                      }
                    }}
                  >
                    Registrar ajuste
                  </button>
                </div>
                <div className="recent-purchases" style={{ marginTop: '1rem' }}>
                  {listLedgerForCustomer(selectedCustomerForDetails.id).length === 0 ? (
                    <p className="no-purchases">Sin movimientos de cuenta</p>
                  ) : (
                    listLedgerForCustomer(selectedCustomerForDetails.id)
                      .slice(0, 20)
                      .map((row) => (
                        <div key={row.id} className="purchase-item">
                          <div className="purchase-info">
                            <span className="purchase-date">{new Date(row.createdAt).toLocaleString()}</span>
                            <span className="purchase-items">
                              {row.kind}
                              {row.notaId ? ` · nota ${row.notaId}` : ''}
                              {row.note ? ` · ${row.note}` : ''}
                            </span>
                          </div>
                          <div className="purchase-amount">
                            <span className="amount">${row.amount.toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {selectedCustomerForDetails.notes && (
                <div className="detail-section">
                  <h4>Notas</h4>
                  <p className="customer-notes">{selectedCustomerForDetails.notes}</p>
                </div>
              )}

              <div className="detail-section">
                <h4>Compras recientes (POS)</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--bs-dark-text-muted, #64748b)', marginBottom: '0.5rem' }}>
                  Ventas registradas en historial Merkle al cobrar con este cliente vinculado (o mismo nombre en ventas anteriores sin ID).
                </p>
                <div className="recent-purchases">
                  {recentSales.length > 0 ? (
                    recentSales.map((row) => (
                      <div key={row.transactionId} className="purchase-item">
                        <div className="purchase-info">
                          <span className="purchase-date">{new Date(row.date).toLocaleString()}</span>
                          <span className="purchase-items">
                            {row.itemCount} artículo{row.itemCount === 1 ? '' : 's'} · {row.saleId}
                          </span>
                        </div>
                        <div className="purchase-amount">
                          <span className="amount">${row.total.toFixed(2)}</span>
                          <span className="payment-method">{formatPaymentMethodLabel(row.paymentMethod)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-purchases">No hay ventas en historial para este cliente. Vincula el cliente al carrito y cobra para registrarlas aquí.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="customer-details-footer">
          <button
            type="button"
            className="customers-row-btn customers-row-btn--edit"
            onClick={() => {
              const c = selectedCustomerForDetails;
              setSelectedCustomerForDetails(null);
              handleEditCustomer(c);
            }}
          >
            <Edit size={16} />
            Editar
          </button>
          <button
            type="button"
            className="customers-row-btn customers-row-btn--delete"
            onClick={() => {
              const id = selectedCustomerForDetails.id;
              setSelectedCustomerForDetails(null);
              handleDeleteCustomer(id);
            }}
          >
            <Trash2 size={16} />
            Eliminar
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="customer-management-overlay">
      <div className="customer-management-modal">
        <div className="management-header">
          <h2>Gestión de Clientes</h2>
          <div className="header-actions">
            <button
              type="button"
              className="action-btn"
              title="Sincronizar con la nube (MCP)"
              disabled={mcpPulling}
              onClick={handleMcpRefresh}
            >
              <RefreshCw size={20} />
            </button>
            <button className="action-btn" title="Exportar">
              <Download size={20} />
            </button>
            <button className="btn-primary" onClick={handleAddCustomer}>
              <UserPlus size={20} />
              Agregar Cliente
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {mcpBanner && (
          <div className="customer-mcp-banner" style={{ padding: '8px 16px', fontSize: 13, color: '#475569' }}>
            {mcpBanner}
          </div>
        )}

        <div className="management-content">
          {/* Filtros y búsqueda */}
          <div className="filters-section">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Buscar clientes por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-controls">
              <select value={membershipFilter} onChange={(e) => setMembershipFilter(e.target.value)}>
                <option value="all">Todos los niveles</option>
                {membershipLevels.map(level => (
                  <option key={level} value={level}>{getMembershipName(level)}</option>
                ))}
              </select>

              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Todos los estados</option>
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
              <Users size={20} />
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
            {view === 'list' && renderCustomerList()}
            {view === 'grid' && renderCustomerGrid()}
            {view === 'analytics' && renderAnalytics()}
          </div>
        </div>
      </div>

      {/* Modales */}
      {(isAddModalOpen || isEditModalOpen) && renderCustomerForm()}
      {selectedCustomerForDetails && renderCustomerDetails()}
    </div>
  );
};

export default CustomerManagement; 