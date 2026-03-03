import React, { useState, useEffect } from 'react';
import {
  Percent,
  ReceiptText,
  Settings as SettingsIcon,
  History,
  Save,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  Calculator,
  Building2,
  MapPin,
  Mail,
  Phone,
  FileText,
  Download,
  RefreshCw,
  MessageCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getWhatsAppUrl } from '../constants/contact';

interface FiscalConfig {
  rfc: string;
  legalName: string;
  tradeName: string;
  fiscalRegime: string;
  fiscalAddress: {
    street: string;
    exteriorNumber: string;
    interiorNumber: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  email: string;
  phone: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  totalAmount: number;
  taxId?: string;
  type: 'income' | 'credit-note' | 'cancellation' | 'complement' | 'expense';
}

interface TaxesProps {
  isOpen: boolean;
  onClose: () => void;
}

const FISCAL_REGIMES = [
  { code: '601', name: 'General de Ley Personas Morales', nameEn: 'General Law of Legal Entities' },
  { code: '603', name: 'Personas Físicas con Actividades Empresariales', nameEn: 'Individuals with Business Activities' },
  { code: '605', name: 'Sueldos y Salarios', nameEn: 'Wages and Salaries' },
  { code: '606', name: 'Arrendamiento', nameEn: 'Rental Income' },
  { code: '608', name: 'Demás ingresos', nameEn: 'Other Income' },
  { code: '610', name: 'Residentes en el Extranjero sin Establecimiento Permanente', nameEn: 'Foreign Residents without Permanent Establishment' },
  { code: '611', name: 'Ingresos por Dividendos', nameEn: 'Dividend Income' },
  { code: '612', name: 'Personas Físicas con Actividades Profesionales', nameEn: 'Individuals with Professional Activities' },
  { code: '614', name: 'Ingresos por Intereses', nameEn: 'Interest Income' },
  { code: '615', name: 'Régimen de los ingresos por obtención de premios', nameEn: 'Prize Income Regime' },
  { code: '616', name: 'Sin obligaciones fiscales', nameEn: 'No Tax Obligations' },
  { code: '620', name: 'Sociedades Cooperativas de Producción', nameEn: 'Production Cooperative Societies' },
  { code: '621', name: 'Incorporación Fiscal', nameEn: 'Tax Incorporation' },
  { code: '622', name: 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras', nameEn: 'Agricultural, Livestock, Forestry and Fishing Activities' },
  { code: '623', name: 'Opcional para Grupos de Sociedades', nameEn: 'Optional for Groups of Companies' },
  { code: '624', name: 'Coordinados', nameEn: 'Coordinated' },
  { code: '625', name: 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas', nameEn: 'Business Activities with Income through Technology Platforms' },
  { code: '626', name: 'Régimen Simplificado de Confianza', nameEn: 'Simplified Trust Regime' }
];

const Taxes: React.FC<TaxesProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'rate' | 'configuration' | 'history'>('rate');
  const [taxRate, setTaxRate] = useState<number>(16);
  const [newTaxRate, setNewTaxRate] = useState<string>('');
  const [isSavingRate, setIsSavingRate] = useState(false);
  
  const [fiscalConfig, setFiscalConfig] = useState<FiscalConfig>({
    rfc: '',
    legalName: '',
    tradeName: '',
    fiscalRegime: '601',
    fiscalAddress: {
      street: '',
      exteriorNumber: '',
      interiorNumber: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    },
    email: '',
    phone: ''
  });
  
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [invoiceHistory, setInvoiceHistory] = useState<Invoice[]>([]);
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | Invoice['type']>('all');
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  // Load tax rate from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedRate = localStorage.getItem('bizneai-tax-rate');
      if (savedRate) {
        setTaxRate(parseFloat(savedRate));
      }
      
      const savedConfig = localStorage.getItem('bizneai-fiscal-config');
      if (savedConfig) {
        setFiscalConfig(JSON.parse(savedConfig));
      }
      
      loadInvoiceHistory();
    }
  }, [isOpen]);

  const loadInvoiceHistory = async () => {
    setIsLoadingInvoices(true);
    try {
      const saved = localStorage.getItem('bizneai-invoices');
      if (saved) {
        setInvoiceHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading invoice history:', error);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const handleSaveTaxRate = () => {
    const rate = parseFloat(newTaxRate);
    
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Por favor ingresa una tasa válida (0-100)');
      return;
    }
    
    setIsSavingRate(true);
    
    setTimeout(() => {
      localStorage.setItem('bizneai-tax-rate', rate.toString());
      setTaxRate(rate);
      setNewTaxRate('');
      setIsSavingRate(false);
      toast.success(`Tasa de impuesto guardada: ${rate}%`);
      
      // Disparar evento para actualizar en otros componentes
      window.dispatchEvent(new CustomEvent('tax-rate-updated', { detail: { rate } }));
    }, 500);
  };

  const handleSaveFiscalConfig = () => {
    // Validar campos requeridos
    if (!fiscalConfig.rfc || !fiscalConfig.legalName || !fiscalConfig.fiscalAddress.street || 
        !fiscalConfig.fiscalAddress.exteriorNumber || !fiscalConfig.fiscalAddress.neighborhood ||
        !fiscalConfig.fiscalAddress.city || !fiscalConfig.fiscalAddress.state ||
        !fiscalConfig.fiscalAddress.zipCode || !fiscalConfig.email || !fiscalConfig.phone) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }
    
    // Validar RFC (máximo 13 caracteres)
    if (fiscalConfig.rfc.length > 13) {
      toast.error('El RFC no puede tener más de 13 caracteres');
      return;
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fiscalConfig.email)) {
      toast.error('Por favor ingresa un email válido');
      return;
    }
    
    // Validar código postal (5 dígitos)
    if (fiscalConfig.fiscalAddress.zipCode.length !== 5 || !/^\d+$/.test(fiscalConfig.fiscalAddress.zipCode)) {
      toast.error('El código postal debe tener 5 dígitos');
      return;
    }
    
    localStorage.setItem('bizneai-fiscal-config', JSON.stringify(fiscalConfig));
    setIsConfigModalOpen(false);
    setIsEditingConfig(false);
    toast.success('Configuración fiscal guardada');
  };

  const handleContactDeveloper = () => {
    // Validar campos requeridos
    if (!fiscalConfig.rfc || !fiscalConfig.legalName || !fiscalConfig.fiscalAddress.street || 
        !fiscalConfig.fiscalAddress.exteriorNumber || !fiscalConfig.fiscalAddress.neighborhood ||
        !fiscalConfig.fiscalAddress.city || !fiscalConfig.fiscalAddress.state ||
        !fiscalConfig.fiscalAddress.zipCode || !fiscalConfig.email || !fiscalConfig.phone) {
      toast.error('Por favor completa todos los campos requeridos antes de contactar');
      return;
    }
    
    const regime = FISCAL_REGIMES.find(r => r.code === fiscalConfig.fiscalRegime);
    const regimeName = regime?.name || fiscalConfig.fiscalRegime;
    
    const message = `Hola, necesito configurar mi información fiscal para el sistema POS:

*RFC:* ${fiscalConfig.rfc.toUpperCase()}
*Razón Social:* ${fiscalConfig.legalName}
${fiscalConfig.tradeName ? `*Nombre Comercial:* ${fiscalConfig.tradeName}\n` : ''}
*Dirección Fiscal:*
${fiscalConfig.fiscalAddress.street} ${fiscalConfig.fiscalAddress.exteriorNumber}${fiscalConfig.fiscalAddress.interiorNumber ? ` Int. ${fiscalConfig.fiscalAddress.interiorNumber}` : ''}
Col. ${fiscalConfig.fiscalAddress.neighborhood}
${fiscalConfig.fiscalAddress.city}, ${fiscalConfig.fiscalAddress.state}
C.P. ${fiscalConfig.fiscalAddress.zipCode}

*Régimen Fiscal:* ${regimeName} (${fiscalConfig.fiscalRegime})
*Email:* ${fiscalConfig.email}
*Teléfono:* ${fiscalConfig.phone}

Por favor, ayúdame a configurar la facturación electrónica.`;

    const whatsappUrl = getWhatsAppUrl(message);
    
    window.open(whatsappUrl, '_blank');
  };

  const calculateTax = (base: number) => {
    return base * (taxRate / 100);
  };

  const calculateTotal = (base: number) => {
    return base + calculateTax(base);
  };

  const calculateBaseFromInclusive = (inclusive: number) => {
    return inclusive / (1 + taxRate / 100);
  };

  const isFiscalConfigured = fiscalConfig.rfc && fiscalConfig.legalName && fiscalConfig.fiscalAddress.street;

  const filteredInvoices = invoiceFilter === 'all' 
    ? invoiceHistory 
    : invoiceHistory.filter(inv => inv.type === invoiceFilter);

  if (!isOpen) return null;

  return (
    <div className="taxes-overlay">
      <div className="taxes-modal">
        <div className="taxes-header">
          <h2>Impuestos</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="taxes-tabs">
          <button
            className={`taxes-tab ${activeTab === 'rate' ? 'active' : ''}`}
            onClick={() => setActiveTab('rate')}
          >
            <Percent size={18} />
            Tasa de Impuesto
          </button>
          <button
            className={`taxes-tab ${activeTab === 'configuration' ? 'active' : ''}`}
            onClick={() => setActiveTab('configuration')}
          >
            <SettingsIcon size={18} />
            Configuración Fiscal
          </button>
          <button
            className={`taxes-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            Historial de Facturas
          </button>
        </div>

        <div className="taxes-content">
          {/* Tax Rate Tab */}
          {activeTab === 'rate' && (
            <div className="taxes-section">
              <div className="tax-rate-card">
                <div className="tax-rate-display">
                  <h3>Tasa de Impuesto Actual</h3>
                  <div className="tax-rate-value">
                    <Percent size={32} />
                    <span>{taxRate}%</span>
                  </div>
                </div>

                <div className="tax-rate-form">
                  <div className="form-group">
                    <label>Nueva Tasa de Impuesto (%)</label>
                    <input
                      type="number"
                      value={newTaxRate}
                      onChange={(e) => setNewTaxRate(e.target.value)}
                      placeholder="Ej: 16"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <button
                    className="btn-primary"
                    onClick={handleSaveTaxRate}
                    disabled={isSavingRate || !newTaxRate}
                  >
                    {isSavingRate ? (
                      <>
                        <RefreshCw size={18} className="spinner" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Guardar Tasa
                      </>
                    )}
                  </button>
                </div>

                <div className="tax-examples">
                  <h4>Ejemplos de Cálculo</h4>
                  <div className="example-calculations">
                    <div className="example-item">
                      <span>Base:</span>
                      <strong>$100.00</strong>
                    </div>
                    <div className="example-item">
                      <span>Impuesto ({taxRate}%):</span>
                      <strong>${calculateTax(100).toFixed(2)}</strong>
                    </div>
                    <div className="example-item total">
                      <span>Total:</span>
                      <strong>${calculateTotal(100).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fiscal Configuration Tab */}
          {activeTab === 'configuration' && (
            <div className="taxes-section">
              <div className="fiscal-status-banner" style={{
                background: isFiscalConfigured ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderColor: isFiscalConfigured ? '#10b981' : '#ef4444'
              }}>
                {isFiscalConfigured ? (
                  <>
                    <CheckCircle size={20} style={{ color: '#10b981' }} />
                    <span>Datos Fiscales: Configurados</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={20} style={{ color: '#ef4444' }} />
                    <span>Datos Fiscales: No Configurados</span>
                  </>
                )}
              </div>

              {isFiscalConfigured ? (
                <div className="fiscal-config-summary">
                  <div className="summary-card">
                    <div className="summary-item">
                      <strong>RFC:</strong>
                      <span>{fiscalConfig.rfc.toUpperCase()}</span>
                    </div>
                    <div className="summary-item">
                      <strong>Razón Social:</strong>
                      <span>{fiscalConfig.legalName}</span>
                    </div>
                    {fiscalConfig.tradeName && (
                      <div className="summary-item">
                        <strong>Nombre Comercial:</strong>
                        <span>{fiscalConfig.tradeName}</span>
                      </div>
                    )}
                    <div className="summary-item">
                      <strong>Régimen Fiscal:</strong>
                      <span>{FISCAL_REGIMES.find(r => r.code === fiscalConfig.fiscalRegime)?.name || fiscalConfig.fiscalRegime}</span>
                    </div>
                    <div className="summary-item">
                      <strong>Dirección:</strong>
                      <span>
                        {fiscalConfig.fiscalAddress.street} {fiscalConfig.fiscalAddress.exteriorNumber}
                        {fiscalConfig.fiscalAddress.interiorNumber && ` Int. ${fiscalConfig.fiscalAddress.interiorNumber}`}
                        , {fiscalConfig.fiscalAddress.neighborhood}, {fiscalConfig.fiscalAddress.city}, {fiscalConfig.fiscalAddress.state}
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setIsEditingConfig(true);
                      setIsConfigModalOpen(true);
                    }}
                  >
                    <Edit size={18} />
                    Editar Configuración
                  </button>
                </div>
              ) : (
                <div className="fiscal-config-empty">
                  <Building2 size={48} style={{ opacity: 0.5 }} />
                  <h3>No hay configuración fiscal</h3>
                  <p>Configura tu información fiscal para generar facturas electrónicas</p>
                  <button
                    className="btn-primary"
                    onClick={() => setIsConfigModalOpen(true)}
                  >
                    <SettingsIcon size={18} />
                    Configurar Datos Fiscales
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Invoice History Tab */}
          {activeTab === 'history' && (
            <div className="taxes-section">
              <div className="invoice-filters">
                <button
                  className={`filter-btn ${invoiceFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setInvoiceFilter('all')}
                >
                  Todas
                </button>
                <button
                  className={`filter-btn ${invoiceFilter === 'income' ? 'active' : ''}`}
                  onClick={() => setInvoiceFilter('income')}
                >
                  Ingresos
                </button>
                <button
                  className={`filter-btn ${invoiceFilter === 'credit-note' ? 'active' : ''}`}
                  onClick={() => setInvoiceFilter('credit-note')}
                >
                  Notas de Crédito
                </button>
                <button
                  className={`filter-btn ${invoiceFilter === 'cancellation' ? 'active' : ''}`}
                  onClick={() => setInvoiceFilter('cancellation')}
                >
                  Cancelaciones
                </button>
                <button
                  className={`filter-btn ${invoiceFilter === 'complement' ? 'active' : ''}`}
                  onClick={() => setInvoiceFilter('complement')}
                >
                  Complementos
                </button>
                <button
                  className={`filter-btn ${invoiceFilter === 'expense' ? 'active' : ''}`}
                  onClick={() => setInvoiceFilter('expense')}
                >
                  Gastos
                </button>
              </div>

              {isLoadingInvoices ? (
                <div className="empty-state">
                  <RefreshCw size={48} className="spinner" />
                  <p>Cargando facturas...</p>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="empty-state">
                  <FileText size={48} style={{ opacity: 0.5 }} />
                  <h3>No hay facturas</h3>
                  <p>Las facturas generadas aparecerán aquí</p>
                </div>
              ) : (
                <div className="invoice-list">
                  {filteredInvoices.map(invoice => (
                    <div key={invoice.id} className="invoice-card">
                      <div className="invoice-header">
                        <div>
                          <h4>Factura #{invoice.invoiceNumber}</h4>
                          <span className="invoice-date">{new Date(invoice.date).toLocaleDateString()}</span>
                        </div>
                        <span className="invoice-type">{invoice.type}</span>
                      </div>
                      <div className="invoice-body">
                        <div className="invoice-info">
                          <span><strong>Cliente:</strong> {invoice.customerName}</span>
                          {invoice.taxId && <span><strong>RFC:</strong> {invoice.taxId}</span>}
                        </div>
                        <div className="invoice-total">
                          <strong>${invoice.totalAmount.toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fiscal Configuration Modal */}
      {isConfigModalOpen && (
        <div className="modal-overlay" onClick={() => setIsConfigModalOpen(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Configuración Fiscal</h3>
              <button className="close-btn" onClick={() => setIsConfigModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>RFC (Registro Federal de Contribuyentes) *</label>
                <input
                  type="text"
                  value={fiscalConfig.rfc}
                  onChange={(e) => setFiscalConfig(prev => ({ ...prev, rfc: e.target.value.toUpperCase() }))}
                  placeholder="ABC123456789"
                  maxLength={13}
                />
              </div>

              <div className="form-group">
                <label>Razón Social *</label>
                <input
                  type="text"
                  value={fiscalConfig.legalName}
                  onChange={(e) => setFiscalConfig(prev => ({ ...prev, legalName: e.target.value }))}
                  placeholder="Nombre legal de la empresa"
                />
              </div>

              <div className="form-group">
                <label>Nombre Comercial</label>
                <input
                  type="text"
                  value={fiscalConfig.tradeName}
                  onChange={(e) => setFiscalConfig(prev => ({ ...prev, tradeName: e.target.value }))}
                  placeholder="Nombre comercial (opcional)"
                />
              </div>

              <div className="form-section-title">
                <MapPin size={18} />
                Dirección Fiscal
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Calle *</label>
                  <input
                    type="text"
                    value={fiscalConfig.fiscalAddress.street}
                    onChange={(e) => setFiscalConfig(prev => ({
                      ...prev,
                      fiscalAddress: { ...prev.fiscalAddress, street: e.target.value }
                    }))}
                    placeholder="Nombre de la calle"
                  />
                </div>
                <div className="form-group">
                  <label>Número Exterior *</label>
                  <input
                    type="text"
                    value={fiscalConfig.fiscalAddress.exteriorNumber}
                    onChange={(e) => setFiscalConfig(prev => ({
                      ...prev,
                      fiscalAddress: { ...prev.fiscalAddress, exteriorNumber: e.target.value }
                    }))}
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Número Interior</label>
                  <input
                    type="text"
                    value={fiscalConfig.fiscalAddress.interiorNumber}
                    onChange={(e) => setFiscalConfig(prev => ({
                      ...prev,
                      fiscalAddress: { ...prev.fiscalAddress, interiorNumber: e.target.value }
                    }))}
                    placeholder="A (opcional)"
                  />
                </div>
                <div className="form-group">
                  <label>Colonia *</label>
                  <input
                    type="text"
                    value={fiscalConfig.fiscalAddress.neighborhood}
                    onChange={(e) => setFiscalConfig(prev => ({
                      ...prev,
                      fiscalAddress: { ...prev.fiscalAddress, neighborhood: e.target.value }
                    }))}
                    placeholder="Nombre de la colonia"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ciudad *</label>
                  <input
                    type="text"
                    value={fiscalConfig.fiscalAddress.city}
                    onChange={(e) => setFiscalConfig(prev => ({
                      ...prev,
                      fiscalAddress: { ...prev.fiscalAddress, city: e.target.value }
                    }))}
                    placeholder="Ciudad"
                  />
                </div>
                <div className="form-group">
                  <label>Estado *</label>
                  <input
                    type="text"
                    value={fiscalConfig.fiscalAddress.state}
                    onChange={(e) => setFiscalConfig(prev => ({
                      ...prev,
                      fiscalAddress: { ...prev.fiscalAddress, state: e.target.value }
                    }))}
                    placeholder="Estado"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Código Postal *</label>
                <input
                  type="text"
                  value={fiscalConfig.fiscalAddress.zipCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setFiscalConfig(prev => ({
                      ...prev,
                      fiscalAddress: { ...prev.fiscalAddress, zipCode: value }
                    }));
                  }}
                  placeholder="12345"
                  maxLength={5}
                />
              </div>

              <div className="form-section-title">
                <Building2 size={18} />
                Régimen Fiscal
              </div>

              <div className="form-group">
                <label>Régimen Fiscal *</label>
                <select
                  value={fiscalConfig.fiscalRegime}
                  onChange={(e) => setFiscalConfig(prev => ({ ...prev, fiscalRegime: e.target.value }))}
                >
                  {FISCAL_REGIMES.map(regime => (
                    <option key={regime.code} value={regime.code}>
                      {regime.code} - {regime.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-section-title">
                <Mail size={18} />
                Información de Contacto
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={fiscalConfig.email}
                    onChange={(e) => setFiscalConfig(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono *</label>
                  <input
                    type="tel"
                    value={fiscalConfig.phone}
                    onChange={(e) => setFiscalConfig(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+52 55 1234 5678"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsConfigModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleSaveFiscalConfig}>
                <Save size={18} />
                Guardar Configuración
              </button>
              <button
                className="btn-success"
                onClick={handleContactDeveloper}
                style={{ background: '#25D366', borderColor: '#25D366' }}
              >
                <MessageCircle size={18} />
                Contactar Desarrollador (WhatsApp)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Taxes;

