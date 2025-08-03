import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  MapPin,
  CreditCard,
  Settings as SettingsIcon,
  Globe,
  Mail,
  Save,
  CheckCircle,
  AlertCircle,
  Building,
  Truck,
  Zap,
  RefreshCw,
  Info,
  Copy,
  Database,
  Calendar,
  Star,
  X,
  Upload,
  Image,
  Trash2
} from 'lucide-react';
import { storeAPI } from '../api/store';
import { 
  validateImageFile, 
  generateUniqueFileName, 
  applyBackgroundImage, 
  getSavedBackgroundImage, 
  saveBackgroundImageInfo 
} from '../utils/fileUtils';
import { useStore } from '../contexts/StoreContext';
import { useDatabase } from '../hooks/useDatabase';

interface StoreType {
  value: string;
  label: string;
}

interface SettingsFormData {
  storeName: string;
  storeType: string;
  status: 'active' | 'inactive' | 'draft';
  clientId: string;
  backupEmail: string;
  googleDriveAccount: string;
  webUrl: string;
  ecommerceEnabled: boolean;
  kitchenEnabled: boolean;
  menuSystemEnabled: boolean;
  paymentMethods: {
    cash: boolean;
    card: boolean;
    crypto: boolean;
    luxae: boolean;
  };
  acceptedCryptocurrencies: string[];
  luxaeEnabled: boolean;
  luxaeAddress: string;
  cryptoAddress: string;
  openAIKey: string;
  multiLocationEnabled: boolean;
  locationSettings: {
    allowStockTransfer: boolean;
    requireLocationSelection: boolean;
    autoAllocateStock: boolean;
    lowStockAlerts: boolean;
  };
  backupSettings: {
    enabled: boolean;
    plan: 'basic' | 'advanced' | 'premium';
    trialDays: number;
    lastBackup: string;
    nextBackup: string;
    autoBackup: boolean;
    includeEcommerce: boolean;
  };
  // Campos adicionales para la configuración inicial
  storeLocation?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface SettingsProps {
  isSetupMode?: boolean;
  onSetupComplete?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isSetupMode = false, onSetupComplete }) => {
  const [storeTypes, setStoreTypes] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'payment' | 'advanced' | 'backup'>('basic');
  const [generatingAddress, setGeneratingAddress] = useState(false);
  const [showERC777Info, setShowERC777Info] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [selectedBackupPlan, setSelectedBackupPlan] = useState<'basic' | 'advanced' | 'premium'>('basic');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [uploadingBackground, setUploadingBackground] = useState(false);

  const [formData, setFormData] = useState<SettingsFormData>({
    storeName: '',
    storeType: 'Restaurant',
    status: 'active',
    clientId: `client-${Date.now()}`,
    backupEmail: '',
    googleDriveAccount: '',
    webUrl: '',
    ecommerceEnabled: true,
    kitchenEnabled: true,
    menuSystemEnabled: false,
    paymentMethods: { cash: true, card: true, crypto: true, luxae: true },
    acceptedCryptocurrencies: ['bitcoin', 'ethereum', 'luxae'],
    luxaeEnabled: true,
    luxaeAddress: '',
    cryptoAddress: '',
    openAIKey: '',
    multiLocationEnabled: false,
    locationSettings: {
      allowStockTransfer: true,
      requireLocationSelection: false,
      autoAllocateStock: true,
      lowStockAlerts: true
    },
    backupSettings: {
      enabled: false,
      plan: 'basic',
      trialDays: 0,
      lastBackup: '',
      nextBackup: '',
      autoBackup: true,
      includeEcommerce: false
    },
    // Campos de ubicación para configuración inicial
    storeLocation: '',
    streetAddress: '',
    city: '',
    state: '',
    zip: ''
  });

  const { storeIdentifiers, setStoreIdentifiers } = useStore();
  const { saveStoreConfig } = useDatabase();

  useEffect(() => {
    // Datos de ejemplo para tipos de tienda
    const sampleStoreTypes: StoreType[] = [
      { value: 'Restaurant', label: 'Restaurante' },
      { value: 'CoffeeShop', label: 'Cafetería' },
      { value: 'Bakery', label: 'Panadería' },
      { value: 'GroceryStore', label: 'Tienda de Abarrotes' },
      { value: 'Pharmacy', label: 'Farmacia' },
      { value: 'ElectronicsStore', label: 'Tienda de Electrónicos' },
      { value: 'ClothingStore', label: 'Tienda de Ropa' },
      { value: 'JewelryStore', label: 'Joyería' },
      { value: 'ShoeStore', label: 'Zapatería' },
      { value: 'PetStore', label: 'Tienda de Mascotas' },
      { value: 'LiquorStore', label: 'Licorería' },
      { value: 'Bookstore', label: 'Librería' },
      { value: 'GiftShop', label: 'Tienda de Regalos' },
      { value: 'HardwareStore', label: 'Ferretería' },
      { value: 'HealthFoodStore', label: 'Tienda de Alimentos Saludables' },
      { value: 'SportingGoodsStore', label: 'Tienda Deportiva' },
      { value: 'ToyStore', label: 'Juguetería' },
      { value: 'FashionBoutique', label: 'Boutique de Moda' },
      { value: 'FurnitureStore', label: 'Mueblería' },
      { value: 'AutoPartsStore', label: 'Refaccionaria' },
      { value: 'Laundry', label: 'Lavandería' },
      { value: 'CosmeticsStore', label: 'Tienda de Cosméticos' },
      { value: 'CellPhoneStore', label: 'Tienda de Celulares' },
      { value: 'ComputerStore', label: 'Tienda de Computadoras' },
      { value: 'ThriftStore', label: 'Tienda de Segunda Mano' },
      { value: 'FlowerShop', label: 'Florería' },
      { value: 'ButcherShop', label: 'Carnicería' },
      { value: 'StationeryStore', label: 'Papelería' }
    ];
    setStoreTypes(sampleStoreTypes);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name.startsWith('paymentMethods.')) {
      const paymentMethod = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        paymentMethods: {
          ...prev.paymentMethods,
          [paymentMethod]: (e.target as HTMLInputElement).checked
        }
      }));
    } else if (name.startsWith('locationSettings.')) {
      const setting = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        locationSettings: {
          ...prev.locationSettings,
          [setting]: (e.target as HTMLInputElement).checked
        }
      }));
    } else if (name.startsWith('backupSettings.')) {
      const setting = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        backupSettings: {
          ...prev.backupSettings,
          [setting]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCryptoChange = (crypto: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      acceptedCryptocurrencies: checked
        ? [...prev.acceptedCryptocurrencies, crypto]
        : prev.acceptedCryptocurrencies.filter(c => c !== crypto)
    }));
  };

  const handleStoreTypeChange = (storeType: string) => {
    setFormData(prev => ({ ...prev, storeType }));
  };

  // Generar dirección ERC-777
  const generateERC777Address = () => {
    setGeneratingAddress(true);
    
    // Simular generación de dirección ERC-777
    setTimeout(() => {
      const newAddress = `0x${Math.random().toString(16).substring(2, 42)}`;
      setFormData(prev => ({ 
        ...prev, 
        luxaeAddress: newAddress,
        cryptoAddress: newAddress 
      }));
      setGeneratingAddress(false);
      toast.success('Dirección ERC-777 generada exitosamente');
    }, 2000);
  };

  // Copiar dirección al portapapeles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Dirección copiada al portapapeles');
    }).catch(() => {
      toast.error('Error al copiar la dirección');
    });
  };

  // Funciones de backup
  const handleBackupPlanChange = (plan: 'basic' | 'advanced' | 'premium') => {
    setSelectedBackupPlan(plan);
    if (!formData.backupSettings.enabled) {
      setShowTrialModal(true);
    }
  };

  const startTrial = () => {
    setFormData(prev => ({
      ...prev,
      backupSettings: {
        ...prev.backupSettings,
        enabled: true,
        plan: selectedBackupPlan,
        trialDays: 30,
        lastBackup: new Date().toISOString(),
        nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        autoBackup: true,
        includeEcommerce: selectedBackupPlan === 'premium'
      }
    }));
    setShowTrialModal(false);
    toast.success(`¡Período de prueba iniciado para el plan ${selectedBackupPlan}!`);
  };

  // Funciones para manejar imagen de fondo
  const handleBackgroundImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar archivo usando la utilidad
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Archivo inválido');
        return;
      }

      setBackgroundImageFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadBackgroundImage = async () => {
    if (!backgroundImageFile) {
      toast.error('No hay imagen seleccionada');
      return;
    }

    setUploadingBackground(true);
    
    try {
      // Generar nombre único para el archivo
      const fileName = generateUniqueFileName(backgroundImageFile.name);
      
      // Simular delay de subida
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Guardar información de la imagen
      const imageInfo = {
        fileName,
        originalName: backgroundImageFile.name,
        size: backgroundImageFile.size,
        type: backgroundImageFile.type,
        url: backgroundImage // En producción, sería la URL del servidor
      };
      
      // Guardar usando la utilidad
      saveBackgroundImageInfo(imageInfo);
      
      // Aplicar la imagen de fondo al contenedor
      applyBackgroundImage(backgroundImage);
      
      // Actualizar tiempo de último backup
      const now = new Date();
      localStorage.setItem('lastBackupTime', now.toISOString());
      
      toast.success('Imagen de fondo subida exitosamente');
      
    } catch (error) {
      console.error('Error al subir imagen:', error);
      toast.error('Error al subir la imagen. Inténtalo de nuevo.');
    } finally {
      setUploadingBackground(false);
    }
  };

  const removeBackgroundImage = () => {
    setBackgroundImage(null);
    setBackgroundImageFile(null);
    localStorage.removeItem('bizneai-background-image');
    
    // Remover la imagen de fondo del contenedor
    applyBackgroundImage(null);
    
    toast.success('Imagen de fondo removida');
  };

  // Cargar imagen de fondo existente al montar el componente
  useEffect(() => {
    const savedImage = getSavedBackgroundImage();
    if (savedImage) {
      setBackgroundImage(savedImage.url);
      // Aplicar la imagen de fondo al contenedor
      applyBackgroundImage(savedImage.url);
    }
  }, []);

  const getBackupPlanInfo = (plan: string) => {
    switch (plan) {
      case 'basic':
        return { price: 0, features: ['Backup básico', 'Almacenamiento 5GB', 'Backup diario'] };
      case 'advanced':
        return { price: 200, features: ['Backup avanzado', 'Almacenamiento 50GB', 'Backup cada 6 horas', 'Encriptación AES-256'] };
      case 'premium':
        return { price: 300, features: ['Backup premium', 'Almacenamiento ilimitado', 'Backup en tiempo real', 'Incluye e-commerce', 'Soporte 24/7'] };
      default:
        return { price: 0, features: [] };
    }
  };

  const getBackupStatusColor = () => {
    if (!formData.backupSettings.enabled) return '#64748b';
    if (formData.backupSettings.trialDays > 7) return '#10b981';
    if (formData.backupSettings.trialDays > 3) return '#f59e0b';
    return '#dc2626';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSetupMode) {
        // Modo de configuración inicial
        const setupData = {
          storeName: formData.storeName,
          storeType: formData.storeType,
          storeLocation: formData.storeLocation,
          streetAddress: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          clientId: formData.clientId,
          ecommerceEnabled: formData.ecommerceEnabled,
          kitchenEnabled: formData.kitchenEnabled,
          crypto: formData.paymentMethods.crypto,
          acceptedCryptocurrencies: formData.acceptedCryptocurrencies
        };

        const response = await storeAPI.setupStore(setupData);
        
        if (response.success) {
          // Simular respuesta con datos de la tienda (en desarrollo)
          const storeData = {
            _id: `store_${Date.now()}`,
            clientId: formData.clientId,
            storeName: formData.storeName,
            storeType: formData.storeType
          };

          // Guardar identificadores en el contexto
          setStoreIdentifiers({
            _id: storeData._id,
            clientId: storeData.clientId,
            storeName: storeData.storeName,
            storeType: storeData.storeType
          });

          // Guardar configuración en la base de datos local
          try {
            await saveStoreConfig({
              store_id: storeData._id,
              client_id: storeData.clientId,
              store_name: storeData.storeName,
              store_type: storeData.storeType,
              config_data: JSON.stringify(formData)
            });
          } catch (dbError) {
            console.warn('Error saving to local database:', dbError);
          }

          // Guardar configuración en localStorage
          localStorage.setItem('bizneai-settings', JSON.stringify(formData));
          localStorage.setItem('bizneai-setup-complete', 'true');

          setMessage({ type: 'success', text: 'Configuración inicial completada exitosamente' });
          toast.success('Configuración inicial completada exitosamente');

          // Llamar callback de completado
          if (onSetupComplete) {
            onSetupComplete();
          }
        } else {
          setMessage({ type: 'error', text: response.message || 'Error al configurar la tienda' });
          toast.error(response.message || 'Error al configurar la tienda');
        }
      } else {
        // Modo de configuración normal
        setTimeout(() => {
          // Guardar configuración local
          localStorage.setItem('bizneai-settings', JSON.stringify(formData));

          // Guardar configuración en la base de datos local si tenemos identificadores
          if (storeIdentifiers._id && storeIdentifiers.clientId) {
            saveStoreConfig({
              store_id: storeIdentifiers._id,
              client_id: storeIdentifiers.clientId,
              store_name: storeIdentifiers.storeName || formData.storeName,
              store_type: storeIdentifiers.storeType || formData.storeType,
              config_data: JSON.stringify(formData)
            }).catch(dbError => {
              console.warn('Error saving to local database:', dbError);
            });
          }

          // Actualizar tiempo de último backup si está habilitado
          if (formData.backupSettings.enabled) {
            const now = new Date();
            localStorage.setItem('lastBackupTime', now.toISOString());
            setMessage({ type: 'success', text: 'Configuración guardada local y online' });
            toast.success('Configuración guardada local y online');
          } else {
            setMessage({ type: 'success', text: 'Configuración guardada local' });
            toast.success('Configuración guardada local');
          }

          setLoading(false);
        }, 1000);
        return;
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error al guardar la configuración. Inténtalo de nuevo.' });
      toast.error('Error al guardar la configuración. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const availableCryptocurrencies = [
    { value: 'bitcoin', label: 'Bitcoin (BTC)' },
    { value: 'ethereum', label: 'Ethereum (ETH)' },
    { value: 'litecoin', label: 'Litecoin (LTC)' },
    { value: 'dogecoin', label: 'Dogecoin (DOGE)' },
    { value: 'cardano', label: 'Cardano (ADA)' },
    { value: 'polkadot', label: 'Polkadot (DOT)' },
    { value: 'solana', label: 'Solana (SOL)' },
    { value: 'luxae', label: 'Luxae (LUX)' },
    { value: 'tether', label: 'Tether (USDT)' },
    { value: 'xrp', label: 'XRP (XRP)' },
    { value: 'worldcoin', label: 'Worldcoin (WLD)' }
  ];

  const renderTabButton = (tab: string, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setActiveTab(tab as 'basic' | 'payment' | 'advanced' | 'backup')}
      className={`settings-tab ${activeTab === tab ? 'active' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Configuración del Sistema</h2>
        <p>Ajusta la configuración general de tu POS</p>
      </div>

      {message && (
        <div className={`settings-message ${message.type === 'success' ? 'success' : 'error'}`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="settings-tabs">
        {renderTabButton('basic', 'Datos Básicos', <Building className="h-4 w-4" />)}
        {renderTabButton('payment', 'Pagos', <CreditCard className="h-4 w-4" />)}
        {renderTabButton('advanced', 'Avanzado', <SettingsIcon className="h-4 w-4" />)}
        {renderTabButton('backup', 'Backup', <Database className="h-4 w-4" />)}
      </div>

      <form onSubmit={handleSubmit} className="settings-content">
        {activeTab === 'basic' && (
          <>
            <div className="settings-section">
              <h3>
                <Building className="h-5 w-5" style={{ color: '#3b82f6' }} />
                <span>Datos Básicos</span>
              </h3>
              <div className="settings-form-grid">
                <div className="settings-form-group">
                  <label>Nombre de la Tienda *</label>
                  <input 
                    type="text" 
                    name="storeName" 
                    value={formData.storeName} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div className="settings-form-group">
                  <label>Tipo de Tienda *</label>
                  <select 
                    name="storeType" 
                    value={formData.storeType} 
                    onChange={e => handleStoreTypeChange(e.target.value)} 
                    required
                  >
                    <option value="">Selecciona un tipo</option>
                    {storeTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="settings-form-group">
                  <label>Estado</label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleInputChange} 
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="draft">Borrador</option>
                  </select>
                </div>
                <div className="settings-form-group">
                  <label>ID del Cliente</label>
                  <input 
                    type="text" 
                    name="clientId" 
                    value={formData.clientId} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Campos de ubicación para configuración inicial */}
            {isSetupMode && (
              <div className="settings-section">
                <h3>
                  <MapPin className="h-5 w-5" style={{ color: '#f59e0b' }} />
                  <span>Ubicación de la Tienda</span>
                </h3>
                <div className="settings-form-grid">
                  <div className="settings-form-group">
                    <label>Ubicación/Área</label>
                    <input 
                      type="text" 
                      name="storeLocation" 
                      value={formData.storeLocation || ''} 
                      onChange={handleInputChange} 
                      placeholder="Ej: Centro Comercial"
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Dirección *</label>
                    <input 
                      type="text" 
                      name="streetAddress" 
                      value={formData.streetAddress || ''} 
                      onChange={handleInputChange} 
                      placeholder="Ej: Av. Principal 123"
                      required 
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Ciudad *</label>
                    <input 
                      type="text" 
                      name="city" 
                      value={formData.city || ''} 
                      onChange={handleInputChange} 
                      placeholder="Ej: Ciudad"
                      required 
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Estado/Provincia *</label>
                    <input 
                      type="text" 
                      name="state" 
                      value={formData.state || ''} 
                      onChange={handleInputChange} 
                      placeholder="Ej: Estado"
                      required 
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Código Postal *</label>
                    <input 
                      type="text" 
                      name="zip" 
                      value={formData.zip || ''} 
                      onChange={handleInputChange} 
                      placeholder="Ej: 12345"
                      required 
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="settings-section">
              <h3>
                <Mail className="h-5 w-5" style={{ color: '#8b5cf6' }} />
                <span>Contacto</span>
              </h3>
              <div className="settings-form-grid">
                <div className="settings-form-group">
                  <label>Email de Respaldo</label>
                  <input 
                    type="email" 
                    name="backupEmail" 
                    value={formData.backupEmail} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div className="settings-form-group">
                  <label>Google Drive</label>
                  <input 
                    type="email" 
                    name="googleDriveAccount" 
                    value={formData.googleDriveAccount} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div className="settings-form-group full-width">
                  <label>Sitio Web</label>
                  <input 
                    type="url" 
                    name="webUrl" 
                    value={formData.webUrl} 
                    onChange={handleInputChange} 
                    placeholder="https://www.mitienda.com" 
                  />
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>
                <Zap className="h-5 w-5" style={{ color: '#10b981' }} />
                <span>Configuración del Sistema</span>
              </h3>
              <div className="settings-checkbox-grid">
                <div className="settings-checkbox-group">
                  <input 
                    type="checkbox" 
                    id="ecommerceEnabled" 
                    name="ecommerceEnabled" 
                    checked={formData.ecommerceEnabled} 
                    onChange={handleInputChange} 
                  />
                  <label htmlFor="ecommerceEnabled">E-commerce</label>
                </div>
                <div className="settings-checkbox-group">
                  <input 
                    type="checkbox" 
                    id="kitchenEnabled" 
                    name="kitchenEnabled" 
                    checked={formData.kitchenEnabled} 
                    onChange={handleInputChange} 
                  />
                  <label htmlFor="kitchenEnabled">Cocina</label>
                </div>
                <div className="settings-checkbox-group">
                  <input 
                    type="checkbox" 
                    id="menuSystemEnabled" 
                    name="menuSystemEnabled" 
                    checked={formData.menuSystemEnabled} 
                    onChange={handleInputChange} 
                  />
                  <label htmlFor="menuSystemEnabled">Menú</label>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'payment' && (
          <>
            <div className="settings-section">
              <h3>
                <CreditCard className="h-5 w-5" style={{ color: '#f59e0b' }} />
                <span>Métodos de Pago</span>
              </h3>
              <div className="settings-checkbox-grid">
                <div className="settings-checkbox-group">
                  <input 
                    type="checkbox" 
                    id="paymentCash" 
                    name="paymentMethods.cash" 
                    checked={formData.paymentMethods.cash} 
                    onChange={handleInputChange} 
                  />
                  <label htmlFor="paymentCash">Efectivo</label>
                </div>
                <div className="settings-checkbox-group">
                  <input 
                    type="checkbox" 
                    id="paymentCard" 
                    name="paymentMethods.card" 
                    checked={formData.paymentMethods.card} 
                    onChange={handleInputChange} 
                  />
                  <label htmlFor="paymentCard">Tarjeta</label>
                </div>
                <div className="settings-checkbox-group">
                  <input 
                    type="checkbox" 
                    id="paymentCrypto" 
                    name="paymentMethods.crypto" 
                    checked={formData.paymentMethods.crypto} 
                    onChange={handleInputChange} 
                  />
                  <label htmlFor="paymentCrypto">Criptomonedas</label>
                </div>
                <div className="settings-checkbox-group">
                  <input 
                    type="checkbox" 
                    id="paymentLuxae" 
                    name="paymentMethods.luxae" 
                    checked={formData.paymentMethods.luxae} 
                    onChange={handleInputChange} 
                  />
                  <label htmlFor="paymentLuxae">Luxae</label>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>
                <Globe className="h-5 w-5" style={{ color: '#8b5cf6' }} />
                <span>Criptomonedas</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="settings-checkbox-group">
                  <input 
                    type="checkbox" 
                    id="luxaeEnabled" 
                    name="luxaeEnabled" 
                    checked={formData.luxaeEnabled} 
                    onChange={handleInputChange} 
                  />
                  <label htmlFor="luxaeEnabled">Habilitar Luxae</label>
                </div>

                {/* Información ERC-777 */}
                <div className="erc777-info-section">
                  <div className="info-header">
                    <Info className="h-4 w-4" style={{ color: '#3b82f6' }} />
                    <span>Estándar ERC-777</span>
                    <button 
                      onClick={() => setShowERC777Info(!showERC777Info)}
                      className="info-toggle"
                    >
                      {showERC777Info ? 'Ocultar' : 'Mostrar'} información
                    </button>
                  </div>
                  
                  {showERC777Info && (
                    <div className="erc777-details">
                      <p>
                        El ERC-777 es un estándar avanzado para tokens fungibles en Ethereum, diseñado como una mejora del estándar ERC-20. 
                        Introduce funcionalidades más sofisticadas para facilitar interacciones con contratos inteligentes y mejorar la experiencia del usuario.
                      </p>
                      
                      <h4>Características principales:</h4>
                      <ul>
                        <li><strong>Función send:</strong> Reemplaza la función transfer de ERC-20, permitiendo transferencias más flexibles con datos adicionales.</li>
                        <li><strong>Ganchos (hooks):</strong> Incluye funciones como tokensToSend y tokensReceived, que permiten a los contratos reaccionar a las transferencias.</li>
                        <li><strong>Operadores autorizados:</strong> Permite a terceros mover tokens en nombre del propietario.</li>
                        <li><strong>Compatibilidad con ERC-20:</strong> Es retrocompatible, por lo que los tokens ERC-777 pueden interactuar con sistemas diseñados para ERC-20.</li>
                      </ul>
                      
                      <h4>Ventajas:</h4>
                      <p>
                        Reduce la complejidad de transferencias a contratos inteligentes, mejora la seguridad y permite personalizaciones avanzadas. 
                        Resuelve problemas de ERC-20 como la pérdida de tokens al enviarlos a contratos no compatibles.
                      </p>
                      
                      <h4>Ejemplos de tokens ERC-777:</h4>
                      <p>Bancor (BNT), Loopring (LRC), MakerDAO (MKR)</p>
                    </div>
                  )}
                </div>

                <div className="settings-form-grid">
                  <div className="settings-form-group">
                    <label>Dirección Luxae (ERC-777)</label>
                    <div className="address-input-group">
                      <input 
                        type="text" 
                        name="luxaeAddress" 
                        value={formData.luxaeAddress} 
                        onChange={handleInputChange}
                        placeholder="0x..." 
                        readOnly
                      />
                      <button 
                        type="button"
                        onClick={() => copyToClipboard(formData.luxaeAddress)}
                        className="copy-btn"
                        title="Copiar dirección"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button 
                        type="button"
                        onClick={generateERC777Address}
                        disabled={generatingAddress}
                        className="generate-btn"
                        title="Generar nueva dirección ERC-777"
                      >
                        {generatingAddress ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <small>Dirección ERC-777 para recibir tokens Luxae</small>
                  </div>
                  <div className="settings-form-group">
                    <label>Dirección Cripto General</label>
                    <div className="address-input-group">
                      <input 
                        type="text" 
                        name="cryptoAddress" 
                        value={formData.cryptoAddress} 
                        onChange={handleInputChange}
                        placeholder="0x..." 
                        readOnly
                      />
                      <button 
                        type="button"
                        onClick={() => copyToClipboard(formData.cryptoAddress)}
                        className="copy-btn"
                        title="Copiar dirección"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <small>Dirección para otras criptomonedas</small>
                  </div>
                </div>
                <div>
                  <label style={{ marginBottom: '0.75rem', display: 'block', color: '#374151', fontWeight: '500', fontSize: '0.875rem' }}>
                    Criptomonedas Aceptadas
                  </label>
                  <div className="settings-checkbox-grid">
                    {availableCryptocurrencies.map(crypto => (
                      <div key={crypto.value} className="settings-checkbox-group">
                        <input 
                          type="checkbox" 
                          id={`crypto-${crypto.value}`} 
                          checked={formData.acceptedCryptocurrencies.includes(crypto.value)} 
                          onChange={e => handleCryptoChange(crypto.value, e.target.checked)} 
                        />
                        <label htmlFor={`crypto-${crypto.value}`}>{crypto.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'advanced' && (
          <div className="settings-section">
            <h3>
              <SettingsIcon className="h-5 w-5" style={{ color: '#f97316' }} />
              <span>Avanzado</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Sección de Imagen de Fondo */}
              <div className="background-upload-section">
                <h3>
                  <Image className="h-5 w-5" style={{ color: '#8b5cf6' }} />
                  <span>Imagen de Fondo Personalizada</span>
                </h3>
                
                <div className="background-preview">
                  {backgroundImage ? (
                    <div 
                      className="background-preview has-image"
                      style={{ 
                        backgroundImage: `url(${backgroundImage})`,
                        width: '100%',
                        height: '100%'
                      }}
                    />
                  ) : (
                    <div className="background-preview-placeholder">
                      <Image className="h-12 w-12" />
                      <p>No hay imagen seleccionada</p>
                      <small>Selecciona una imagen para personalizar el fondo</small>
                    </div>
                  )}
                </div>
                
                <div className="background-upload-controls">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundImageSelect}
                    className="background-upload-input"
                    id="background-image-input"
                  />
                  <label htmlFor="background-image-input" className="background-upload-btn">
                    <Upload className="h-4 w-4" />
                    <span>Seleccionar Imagen</span>
                  </label>
                  
                  {backgroundImageFile && (
                    <button
                      type="button"
                      onClick={uploadBackgroundImage}
                      disabled={uploadingBackground}
                      className="background-upload-btn"
                    >
                      {uploadingBackground ? (
                        <>
                          <div className="settings-loading-spinner"></div>
                          <span>Subiendo...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Guardar Imagen</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  {backgroundImage && (
                    <button
                      type="button"
                      onClick={removeBackgroundImage}
                      className="background-remove-btn"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>
                
                <div className="background-upload-info">
                  <p><strong>Formatos soportados:</strong> JPG, PNG, GIF, WebP</p>
                  <p><strong>Tamaño máximo:</strong> 5MB</p>
                  <p><strong>Resolución recomendada:</strong> 1920x1080 o superior</p>
                </div>
              </div>

              <div className="settings-form-group">
                <label>Clave de OpenAI</label>
                <input 
                  type="password" 
                  name="openAIKey" 
                  value={formData.openAIKey} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="settings-checkbox-group">
                <input 
                  type="checkbox" 
                  id="multiLocationEnabled" 
                  name="multiLocationEnabled" 
                  checked={formData.multiLocationEnabled} 
                  onChange={handleInputChange} 
                />
                <label htmlFor="multiLocationEnabled">Multi-Ubicación</label>
              </div>
              {formData.multiLocationEnabled && (
                <div className="settings-section" style={{ backgroundColor: '#f8fafc' }}>
                  <h4 style={{ color: '#1e293b', marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Truck className="h-4 w-4" style={{ color: '#3b82f6' }} />
                    <span>Ubicaciones</span>
                  </h4>
                  <div className="settings-checkbox-grid">
                    <div className="settings-checkbox-group">
                      <input 
                        type="checkbox" 
                        id="allowStockTransfer" 
                        name="locationSettings.allowStockTransfer" 
                        checked={formData.locationSettings.allowStockTransfer} 
                        onChange={handleInputChange} 
                      />
                      <label htmlFor="allowStockTransfer">Transferencias de Stock</label>
                    </div>
                    <div className="settings-checkbox-group">
                      <input 
                        type="checkbox" 
                        id="requireLocationSelection" 
                        name="locationSettings.requireLocationSelection" 
                        checked={formData.locationSettings.requireLocationSelection} 
                        onChange={handleInputChange} 
                      />
                      <label htmlFor="requireLocationSelection">Requerir Selección</label>
                    </div>
                    <div className="settings-checkbox-group">
                      <input 
                        type="checkbox" 
                        id="autoAllocateStock" 
                        name="locationSettings.autoAllocateStock" 
                        checked={formData.locationSettings.autoAllocateStock} 
                        onChange={handleInputChange} 
                      />
                      <label htmlFor="autoAllocateStock">Asignación Automática</label>
                    </div>
                    <div className="settings-checkbox-group">
                      <input 
                        type="checkbox" 
                        id="lowStockAlerts" 
                        name="locationSettings.lowStockAlerts" 
                        checked={formData.locationSettings.lowStockAlerts} 
                        onChange={handleInputChange} 
                      />
                      <label htmlFor="lowStockAlerts">Alertas de Stock Bajo</label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="settings-section">
            <h3>
              <Database className="h-5 w-5" style={{ color: '#3b82f6' }} />
              <span>Sistema de Backup</span>
            </h3>
            
            {/* Estado del Backup */}
            <div className="backup-status-section">
              <div className="backup-status-card">
                <div className="backup-status-header">
                  <div className="backup-status-indicator">
                    <div 
                      className="backup-status-dot" 
                      style={{ backgroundColor: getBackupStatusColor() }}
                    ></div>
                    <span className="backup-status-text">
                      {formData.backupSettings.enabled ? 'Backup Activo' : 'Backup Inactivo'}
                    </span>
                  </div>
                  {formData.backupSettings.enabled && (
                    <div className="backup-trial-counter">
                      <Calendar className="h-4 w-4" />
                      <span>{formData.backupSettings.trialDays} días restantes</span>
                    </div>
                  )}
                </div>
                
                {formData.backupSettings.enabled && (
                  <div className="backup-info-grid">
                    <div className="backup-info-item">
                      <span className="backup-info-label">Último backup:</span>
                      <span className="backup-info-value">
                        {formData.backupSettings.lastBackup ? 
                          new Date(formData.backupSettings.lastBackup).toLocaleString() : 
                          'Nunca'
                        }
                      </span>
                    </div>
                    <div className="backup-info-item">
                      <span className="backup-info-label">Próximo backup:</span>
                      <span className="backup-info-value">
                        {formData.backupSettings.nextBackup ? 
                          new Date(formData.backupSettings.nextBackup).toLocaleString() : 
                          'No programado'
                        }
                      </span>
                    </div>
                    <div className="backup-info-item">
                      <span className="backup-info-label">Plan actual:</span>
                      <span className="backup-info-value">
                        {formData.backupSettings.plan === 'basic' ? 'Básico' :
                         formData.backupSettings.plan === 'advanced' ? 'Avanzado' : 'Premium'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Planes de Backup */}
            <div className="backup-plans-section">
              <h4>Planes de Backup Disponibles</h4>
              <div className="backup-plans-grid">
                {['basic', 'advanced', 'premium'].map(plan => {
                  const planInfo = getBackupPlanInfo(plan);
                  const isSelected = formData.backupSettings.plan === plan;
                  const isEnabled = formData.backupSettings.enabled;
                  
                  return (
                    <div 
                      key={plan}
                      className={`backup-plan-card ${isSelected ? 'selected' : ''} ${!isEnabled ? 'disabled' : ''}`}
                      onClick={() => handleBackupPlanChange(plan as 'basic' | 'advanced' | 'premium')}
                    >
                      <div className="backup-plan-header">
                        <h5>
                          {plan === 'basic' ? 'Básico' :
                           plan === 'advanced' ? 'Avanzado' : 'Premium'}
                        </h5>
                        <div className="backup-plan-price">
                          {planInfo.price === 0 ? (
                            <span className="free">Gratis</span>
                          ) : (
                            <span className="price">${planInfo.price}/mes</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="backup-plan-features">
                        {planInfo.features.map((feature, index) => (
                          <div key={index} className="backup-plan-feature">
                            <CheckCircle className="h-4 w-4" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      {plan === 'premium' && (
                        <div className="backup-plan-badge">
                          <Star className="h-4 w-4" />
                          <span>Incluye E-commerce</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Configuración de Backup */}
            <div className="backup-config-section">
              <h4>Configuración de Backup</h4>
              <div className="settings-form-grid">
                <div className="settings-form-group">
                  <label>Habilitar Backup Automático</label>
                  <input 
                    type="checkbox" 
                    name="backupSettings.autoBackup" 
                    checked={formData.backupSettings.autoBackup} 
                    onChange={handleInputChange}
                    disabled={!formData.backupSettings.enabled}
                  />
                </div>
                <div className="settings-form-group">
                  <label>Incluir Datos de E-commerce</label>
                  <input 
                    type="checkbox" 
                    name="backupSettings.includeEcommerce" 
                    checked={formData.backupSettings.includeEcommerce} 
                    onChange={handleInputChange}
                    disabled={!formData.backupSettings.enabled || formData.backupSettings.plan !== 'premium'}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="settings-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <>
                <div className="settings-loading-spinner"></div>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal de Período de Prueba */}
      {showTrialModal && (
        <div className="trial-modal-overlay">
          <div className="trial-modal">
            <div className="trial-modal-header">
              <h3>
                <Star className="h-5 w-5" />
                <span>¡Inicia tu Período de Prueba!</span>
              </h3>
              <button 
                onClick={() => setShowTrialModal(false)}
                className="trial-modal-close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="trial-modal-content">
              <div className="trial-plan-info">
                <h4>Plan {selectedBackupPlan === 'basic' ? 'Básico' : 
                           selectedBackupPlan === 'advanced' ? 'Avanzado' : 'Premium'}</h4>
                <div className="trial-plan-price">
                  {selectedBackupPlan === 'basic' ? 'Gratis' : 
                   selectedBackupPlan === 'advanced' ? '$200/mes' : '$300/mes'}
                </div>
                <p>Disfruta de 30 días de prueba gratuita con todas las funcionalidades incluidas.</p>
              </div>
              
              <div className="trial-features">
                <h5>Incluye:</h5>
                <ul>
                  {getBackupPlanInfo(selectedBackupPlan).features.map((feature, index) => (
                    <li key={index}>
                      <CheckCircle className="h-4 w-4" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="trial-actions">
                <button onClick={startTrial} className="btn-primary">
                  <Star className="h-4 w-4" />
                  <span>Iniciar Período de Prueba</span>
                </button>
                <button onClick={() => setShowTrialModal(false)} className="btn-secondary">
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 