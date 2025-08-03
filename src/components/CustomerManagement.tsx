import { useState, useEffect } from 'react';
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

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  birthday: string;
  gender: 'male' | 'female' | 'other';
  membershipLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  totalOrders: number;
  lastPurchase: string;
  isActive: boolean;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Purchase {
  id: number;
  customerId: number;
  date: string;
  total: number;
  items: number;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'cancelled';
}

interface CustomerManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const membershipLevels = ['bronze', 'silver', 'gold', 'platinum'];
const genders = ['male', 'female', 'other'];

// Datos de ejemplo para clientes
const generateSampleCustomers = (): Customer[] => {
  const customers: Customer[] = [
    {
      id: 1,
      firstName: 'María',
      lastName: 'González',
      email: 'maria.gonzalez@email.com',
      phone: '+52 55 1234 5678',
      address: 'Av. Insurgentes Sur 1234',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '03100',
      birthday: '1985-03-15',
      gender: 'female',
      membershipLevel: 'gold',
      totalSpent: 2847.50,
      totalOrders: 23,
      lastPurchase: '2024-01-10T14:30:00Z',
      isActive: true,
      notes: 'Cliente frecuente, prefiere café americano y croissants. Siempre amable.',
      tags: ['frecuente', 'café', 'mañana'],
      createdAt: '2023-01-15T10:00:00Z',
      updatedAt: '2024-01-10T14:30:00Z'
    },
    {
      id: 2,
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      email: 'carlos.rodriguez@email.com',
      phone: '+52 55 9876 5432',
      address: 'Calle Reforma 567',
      city: 'Guadalajara',
      state: 'Jalisco',
      zipCode: '44100',
      birthday: '1990-07-22',
      gender: 'male',
      membershipLevel: 'silver',
      totalSpent: 1245.75,
      totalOrders: 12,
      lastPurchase: '2024-01-08T16:45:00Z',
      isActive: true,
      notes: 'Cliente de oficina, compra sándwiches para el almuerzo.',
      tags: ['oficina', 'almuerzo', 'sándwiches'],
      createdAt: '2023-06-20T10:00:00Z',
      updatedAt: '2024-01-08T16:45:00Z'
    },
    {
      id: 3,
      firstName: 'Ana',
      lastName: 'Martínez',
      email: 'ana.martinez@email.com',
      phone: '+52 55 5555 1234',
      address: 'Blvd. Constitución 890',
      city: 'Monterrey',
      state: 'Nuevo León',
      zipCode: '64000',
      birthday: '1988-11-08',
      gender: 'female',
      membershipLevel: 'platinum',
      totalSpent: 5678.90,
      totalOrders: 45,
      lastPurchase: '2024-01-12T09:15:00Z',
      isActive: true,
      notes: 'Cliente VIP, ama los postres artesanales. Celebra cumpleaños aquí.',
      tags: ['vip', 'postres', 'cumpleaños'],
      createdAt: '2022-08-10T10:00:00Z',
      updatedAt: '2024-01-12T09:15:00Z'
    },
    {
      id: 4,
      firstName: 'Luis',
      lastName: 'Hernández',
      email: 'luis.hernandez@email.com',
      phone: '+52 55 4444 5678',
      address: 'Calle Juárez 234',
      city: 'Puebla',
      state: 'Puebla',
      zipCode: '72000',
      birthday: '1995-04-30',
      gender: 'male',
      membershipLevel: 'bronze',
      totalSpent: 345.25,
      totalOrders: 4,
      lastPurchase: '2024-01-05T12:20:00Z',
      isActive: true,
      notes: 'Cliente nuevo, parece interesado en bebidas especiales.',
      tags: ['nuevo', 'bebidas', 'especiales'],
      createdAt: '2023-12-15T10:00:00Z',
      updatedAt: '2024-01-05T12:20:00Z'
    },
    {
      id: 5,
      firstName: 'Sofia',
      lastName: 'López',
      email: 'sofia.lopez@email.com',
      phone: '+52 55 3333 9999',
      address: 'Av. Hidalgo 456',
      city: 'Querétaro',
      state: 'Querétaro',
      zipCode: '76000',
      birthday: '1992-09-12',
      gender: 'female',
      membershipLevel: 'silver',
      totalSpent: 1890.30,
      totalOrders: 18,
      lastPurchase: '2024-01-09T17:30:00Z',
      isActive: false,
      notes: 'Cliente inactivo desde hace 2 meses. Posible mudanza.',
      tags: ['inactivo', 'mudanza'],
      createdAt: '2023-03-05T10:00:00Z',
      updatedAt: '2023-11-15T10:00:00Z'
    }
  ];
  
  return customers;
};

// Datos de ejemplo para compras
const generateSamplePurchases = (): Purchase[] => {
  const purchases: Purchase[] = [];
  const customers = generateSampleCustomers();
  
  customers.forEach(customer => {
    const numPurchases = Math.floor(Math.random() * 10) + 1;
    for (let i = 0; i < numPurchases; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 365));
      
      purchases.push({
        id: purchases.length + 1,
        customerId: customer.id,
        date: date.toISOString(),
        total: Math.random() * 100 + 10,
        items: Math.floor(Math.random() * 5) + 1,
        paymentMethod: ['cash', 'card', 'crypto', 'codi'][Math.floor(Math.random() * 4)],
        status: 'completed'
      });
    }
  });
  
  return purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const CustomerManagement = ({ isOpen, onClose }: CustomerManagementProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
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

  useEffect(() => {
    if (isOpen) {
      const sampleCustomers = generateSampleCustomers();
      const samplePurchases = generateSamplePurchases();
      setCustomers(sampleCustomers);
      setPurchases(samplePurchases);
      setFilteredCustomers(sampleCustomers);
    }
  }, [isOpen]);

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
    if (isAddModalOpen) {
      const newCustomer: Customer = {
        ...editingCustomer as Customer,
        id: Math.max(...customers.map(c => c.id)) + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setCustomers([...customers, newCustomer]);
      setIsAddModalOpen(false);
    } else if (isEditModalOpen && selectedCustomer) {
      const updatedCustomers = customers.map(c =>
        c.id === selectedCustomer.id
          ? { ...editingCustomer as Customer, updatedAt: new Date().toISOString() }
          : c
      );
      setCustomers(updatedCustomers);
      setIsEditModalOpen(false);
      setSelectedCustomer(null);
    }
    setEditingCustomer({});
  };

  const handleDeleteCustomer = (customerId: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      setCustomers(customers.filter(c => c.id !== customerId));
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

  const getCustomerPurchases = (customerId: number) => {
    return purchases.filter(p => p.customerId === customerId);
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
      
      <div className="form-content">
        <div className="form-grid">
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              value={editingCustomer.firstName || ''}
              onChange={(e) => setEditingCustomer({...editingCustomer, firstName: e.target.value})}
              placeholder="Ej: María"
            />
          </div>

          <div className="form-group">
            <label>Apellido *</label>
            <input
              type="text"
              value={editingCustomer.lastName || ''}
              onChange={(e) => setEditingCustomer({...editingCustomer, lastName: e.target.value})}
              placeholder="Ej: González"
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={editingCustomer.email || ''}
              onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
              placeholder="maria@email.com"
            />
          </div>

          <div className="form-group">
            <label>Teléfono *</label>
            <input
              type="tel"
              value={editingCustomer.phone || ''}
              onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
              placeholder="+52 55 1234 5678"
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

        <div className="form-actions">
          <button className="btn-secondary" onClick={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            setEditingCustomer({});
          }}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSaveCustomer}>
            <UserPlus size={16} />
            Guardar Cliente
          </button>
        </div>
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
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.map(customer => {
            const customerPurchases = getCustomerPurchases(customer.id);
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
                    <span className="purchase-count">{customer.totalOrders} órdenes</span>
                    <span className="purchase-items">{customerPurchases.length} transacciones</span>
                  </div>
                </td>
                <td>
                  <span className="total-spent">${customer.totalSpent.toFixed(2)}</span>
                </td>
                <td>
                  <span className="last-purchase">
                    {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : 'Nunca'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${customer.isActive ? 'active' : 'inactive'}`}>
                    {customer.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn" onClick={() => setSelectedCustomerForDetails(customer)} title="Ver detalles">
                      <Eye size={16} />
                    </button>
                    <button className="action-btn" onClick={() => handleEditCustomer(customer)} title="Editar">
                      <Edit size={16} />
                    </button>
                    <button className="action-btn" onClick={() => handleDeleteCustomer(customer.id)} title="Eliminar">
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

  const renderCustomerGrid = () => (
    <div className="customers-grid">
      {filteredCustomers.map(customer => {
        const customerPurchases = getCustomerPurchases(customer.id);
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
                  <span className="value total-spent">${customer.totalSpent.toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Órdenes:</span>
                  <span className="value">{customer.totalOrders}</span>
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
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const averageSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    const membershipStats = customers.reduce((acc, customer) => {
      acc[customer.membershipLevel] = (acc[customer.membershipLevel] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const topCustomers = customers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

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
            <div className="top-customers">
              {topCustomers.map((customer, index) => (
                <div key={customer.id} className="top-customer-item">
                  <div className="customer-rank">
                    <span className="rank-number">{index + 1}</span>
                    <div className="customer-info">
                      <span className="customer-name">{customer.firstName} {customer.lastName}</span>
                      <span className="customer-level">{getMembershipName(customer.membershipLevel)}</span>
                    </div>
                  </div>
                  <div className="customer-stats">
                    <span className="total-spent">${customer.totalSpent.toFixed(2)}</span>
                    <span className="order-count">{customer.totalOrders} órdenes</span>
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

    const customerPurchases = getCustomerPurchases(selectedCustomerForDetails.id);
    const recentPurchases = customerPurchases.slice(0, 5);

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
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Total Gastado</span>
                    <span className="stat-value">${selectedCustomerForDetails.totalSpent.toFixed(2)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Órdenes</span>
                    <span className="stat-value">{selectedCustomerForDetails.totalOrders}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Última Compra</span>
                    <span className="stat-value">
                      {selectedCustomerForDetails.lastPurchase ? new Date(selectedCustomerForDetails.lastPurchase).toLocaleDateString() : 'Nunca'}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Cliente desde</span>
                    <span className="stat-value">{new Date(selectedCustomerForDetails.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {selectedCustomerForDetails.notes && (
                <div className="detail-section">
                  <h4>Notas</h4>
                  <p className="customer-notes">{selectedCustomerForDetails.notes}</p>
                </div>
              )}

              <div className="detail-section">
                <h4>Compras Recientes</h4>
                <div className="recent-purchases">
                  {recentPurchases.length > 0 ? (
                    recentPurchases.map(purchase => (
                      <div key={purchase.id} className="purchase-item">
                        <div className="purchase-info">
                          <span className="purchase-date">{new Date(purchase.date).toLocaleDateString()}</span>
                          <span className="purchase-items">{purchase.items} artículos</span>
                        </div>
                        <div className="purchase-amount">
                          <span className="amount">${purchase.total.toFixed(2)}</span>
                          <span className="payment-method">{purchase.paymentMethod}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-purchases">No hay compras registradas</p>
                  )}
                </div>
              </div>
            </div>
          </div>
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
            <button className="action-btn" title="Actualizar">
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