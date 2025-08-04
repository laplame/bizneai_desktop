import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Shield, 
  CreditCard, 
  Store,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit3,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  Globe,
  Wifi,
  WifiOff,
  Server,
  HardDrive,
  Cloud,
  CloudOff,
  Zap,
  ZapOff,
  Cpu,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Bitcoin,
  Ethereum,
  Wallet,
  Receipt,
  FileText,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Users,
  Building,
  Home,
  ShoppingBag,
  ShoppingCart,
  Package,
  Tag,
  Percent,
  Hash,
  HashIcon,
  QrCode,
  Barcode,
  Camera,
  Image,
  File,
  Folder,
  Archive,
  Database as DatabaseIcon,
  HardDrive as HardDriveIcon,
  Server as ServerIcon,
  Cloud as CloudIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Zap as ZapIcon,
  ZapOff as ZapOffIcon,
  Cpu as CpuIcon,
  Activity as ActivityIcon,
  BarChart3 as BarChart3Icon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  DollarSign as DollarSignIcon,
  Bitcoin as BitcoinIcon,
  Ethereum as EthereumIcon,
  Wallet as WalletIcon,
  Receipt as ReceiptIcon,
  FileText as FileTextIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  MapPin as MapPinIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  User as UserIcon,
  Users as UsersIcon,
  Building as BuildingIcon,
  Home as HomeIcon,
  ShoppingBag as ShoppingBagIcon,
  ShoppingCart as ShoppingCartIcon,
  Package as PackageIcon,
  Tag as TagIcon,
  Percent as PercentIcon,
  Hash as HashIcon,
  HashIcon as HashIconIcon,
  QrCode as QrCodeIcon,
  Barcode as BarcodeIcon,
  Camera as CameraIcon,
  Image as ImageIcon,
  File as FileIcon,
  Folder as FolderIcon,
  Archive as ArchiveIcon
} from 'lucide-react';

// Temporary simplified Settings component
const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Temporary state without useStore
  const [storeIdentifiers, setStoreIdentifiers] = useState({
    _id: null,
    clientId: null,
    storeName: null,
    storeType: null
  });

  useEffect(() => {
    // Load store identifiers from localStorage
    const savedIdentifiers = localStorage.getItem('bizneai-store-identifiers');
    if (savedIdentifiers) {
      try {
        const parsed = JSON.parse(savedIdentifiers);
        setStoreIdentifiers(parsed);
      } catch (error) {
        console.error('Error loading store identifiers:', error);
      }
    }
  }, []);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage
      localStorage.setItem('bizneai-store-identifiers', JSON.stringify(storeIdentifiers));
      
      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Configuración del Sistema</h2>
        <p>Gestiona la configuración de tu tienda y preferencias del sistema</p>
      </div>

      {message && (
        <div className={`settings-message ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <SettingsIcon size={20} />
          General
        </button>
        <button
          className={`settings-tab ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          <Database size={20} />
          Backup
        </button>
        <button
          className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Shield size={20} />
          Seguridad
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'general' && (
          <div className="settings-section">
            <h3>Configuración General</h3>
            <div className="settings-form-grid">
              <div className="settings-form-group">
                <label>Nombre de la Tienda</label>
                <input
                  type="text"
                  value={storeIdentifiers.storeName || ''}
                  onChange={(e) => setStoreIdentifiers(prev => ({ ...prev, storeName: e.target.value }))}
                  placeholder="Mi Tienda"
                />
              </div>
              <div className="settings-form-group">
                <label>Tipo de Negocio</label>
                <input
                  type="text"
                  value={storeIdentifiers.storeType || ''}
                  onChange={(e) => setStoreIdentifiers(prev => ({ ...prev, storeType: e.target.value }))}
                  placeholder="Retail, Restaurante, etc."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="settings-section">
            <h3>Configuración de Backup</h3>
            <p>El sistema realiza backups automáticos cada 24 horas.</p>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="settings-section">
            <h3>Configuración de Seguridad</h3>
            <p>Configura las opciones de seguridad de tu tienda.</p>
          </div>
        )}
      </div>

      <div className="settings-actions">
        <button 
          className="btn-primary" 
          onClick={handleSaveSettings}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="settings-loading-spinner"></div>
          ) : (
            <Save size={20} />
          )}
          Guardar Configuración
        </button>
      </div>
    </div>
  );
};

export default Settings; 