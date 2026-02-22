import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Store,
  Building,
  CreditCard,
  Percent,
  Brain,
  Shield,
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
  MapPin,
  Clock,
  DollarSign,
  Bitcoin,
  Wallet,
  QrCode,
  Camera,
  FileText,
  Database,
  HardDrive,
  Cloud,
  CloudOff,
  RefreshCw,
  TestTube,
  Link,
  Phone,
  Mail,
  Calendar,
  Clock as ClockIcon,
  Activity,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { storeAPI } from '../api/store';
import { API_CONFIG, apiRequest, handleApiError } from '../config/api';
import { StoreConfig } from '../types/store';
import { useStore } from '../contexts/StoreContext';
import { getStoreTypes, checkStoreTypesForUpdates, getStoreTypeLabel } from '../data/storeTypes';
import { mapMcpProductToLocal } from '../utils/shopIdHelper';
import { setLastSyncTime, isSyncDue } from '../utils/syncService';

interface SettingsProps {
  isSetupMode?: boolean;
  onSetupComplete?: () => void;
}

interface ServerSyncStatus {
  synced: boolean;
  shopId: string | null;
  lastSync: string | null;
}

interface CryptoConfig {
  bitcoin?: string;
  ethereum?: string;
  solana?: string;
}

interface BusinessHours {
  [key: string]: { open: string; close: string; enabled: boolean };
}

const Settings: React.FC<SettingsProps> = ({ isSetupMode, onSetupComplete }) => {
  const { setStoreIdentifiers } = useStore();
  // State for active section
  const [activeSection, setActiveSection] = useState<string>('store-info');
  
  // Obtener tipos de tienda disponibles
  const storeTypes = getStoreTypes('es');
  
  // Store Information
  const [storeInfo, setStoreInfo] = useState({
    storeName: '',
    storeLocation: '',
    streetAddress: '',
    city: '',
    state: '',
    zip: '',
    storeType: '',
    latitude: '',
    longitude: ''
  });

  // Business Settings
  const [businessSettings, setBusinessSettings] = useState({
    timeZone: 'America/Mexico_City',
    currency: 'MXN',
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,234.56',
    businessHours: {} as BusinessHours
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    cashEnabled: true,
    cardEnabled: true,
    cryptoEnabled: false,
    cryptoAddresses: {} as CryptoConfig,
    ecommerceEnabled: false,
    ecommerceUrl: ''
  });

  // Tax Settings
  const [taxSettings, setTaxSettings] = useState({
    taxRate: 16,
    taxCalculationMethod: 'exclusive',
    taxInclusive: false
  });

  // AI Settings
  const [aiSettings, setAiSettings] = useState({
    openaiApiKey: '',
    aiEnabled: false,
    responseStyle: 'professional',
    detailLevel: 'detailed',
    notificationsEnabled: true
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    passcodeEnabled: false,
    passcode: '',
    confirmPasscode: '',
    sessionTimeout: 30,
    dataEncryption: true,
    autoBackup: true,
    backupFrequency: 'daily'
  });

  // Server Sync
  const [serverSync, setServerSync] = useState<ServerSyncStatus>({
    synced: false,
    shopId: null,
    lastSync: null
  });

  // Server URL and MCP Configuration
  const [serverConfig, setServerConfig] = useState({
    serverUrl: '',
    shopId: '',
    mcpUrl: '',
    mcpMethods: [] as string[]
  });

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['store-info']));
  const [apiConnectionStatus, setApiConnectionStatus] = useState<{
    connected: boolean;
    responseTime: number | null;
  }>({ connected: false, responseTime: null });

  // Load configuration on mount
  useEffect(() => {
    const initializeConfig = async () => {
    loadConfiguration();
      await checkServerSync();
      await loadServerConfig(); // Ahora es async y carga datos del shop si hay shopId
    };
    
    initializeConfig();
    
    // Verificar actualizaciones de tipos de tienda solo en el primer inicio
    checkStoreTypesForUpdates('es').then(result => {
      if (result.hasChanges && result.updatedTypes) {
        console.log('Tipos de tienda actualizados:', result.message);
        // Opcional: mostrar notificación al usuario
        // toast.success(result.message || 'Tipos de tienda actualizados');
      }
    });
  }, []);

  // Extract shop ID from URL
  // Supports three URL types:
  // 1. MCP direct: https://www.bizneai.com/api/mcp/{shopId}
  // 2. Shop: https://www.bizneai.com/shop/{shopId}/products
  // 3. Restaurant: https://www.bizneai.com/restaurant/{shopId}/menu
  const extractShopIdFromUrl = (url: string): string | null => {
    try {
      // Pattern 1: MCP direct URL - https://www.bizneai.com/api/mcp/{shopId}
      const mcpMatch = url.match(/\/api\/mcp\/([a-f0-9]{24})/);
      if (mcpMatch && mcpMatch[1]) {
        return mcpMatch[1];
      }
      
      // Pattern 2: Shop URL - https://www.bizneai.com/shop/{shopId}/products
      const shopMatch = url.match(/\/shop\/([a-f0-9]{24})/);
      if (shopMatch && shopMatch[1]) {
        return shopMatch[1];
      }
      
      // Pattern 3: Restaurant URL - https://www.bizneai.com/restaurant/{shopId}/menu
      const restaurantMatch = url.match(/\/restaurant\/([a-f0-9]{24})/);
      if (restaurantMatch && restaurantMatch[1]) {
        return restaurantMatch[1];
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting shop ID:', error);
      return null;
    }
  };

  // Build MCP URL from shop ID
  // Always constructs the MCP URL regardless of input URL type
  const buildMcpUrl = (shopId: string): string => {
    // Extract base URL from the input, or use default
    let baseUrl = 'https://www.bizneai.com';
    
    try {
      if (serverConfig.serverUrl) {
        const urlObj = new URL(serverConfig.serverUrl);
        baseUrl = `${urlObj.protocol}//${urlObj.host}`;
      }
    } catch (error) {
      // If URL parsing fails, use default
      console.warn('Could not parse base URL, using default');
    }
    
    return `${baseUrl}/api/mcp/${shopId}`;
  };

  // Load server configuration from localStorage
  const loadServerConfig = async () => {
    try {
      const saved = localStorage.getItem('bizneai-server-config');
      if (saved) {
        const config = JSON.parse(saved);
        setServerConfig(config);
        if (config.shopId) {
          setServerSync(prev => ({ ...prev, shopId: config.shopId }));
          // Sincronizar con StoreContext
          setStoreIdentifiers({
            shopId: config.shopId,
            mcpUrl: config.mcpUrl || null
          });
          
          // Si hay MCP URL y sincronización pendiente (una vez al día), cargar datos del shop
          if (config.mcpUrl && isSyncDue()) {
            await loadShopDataFromServer(config.mcpUrl);
          }
        }
      }
    } catch (error) {
      console.error('Error loading server config:', error);
    }
  };

  // Save server configuration to localStorage
  const saveServerConfig = (config: typeof serverConfig) => {
    try {
      localStorage.setItem('bizneai-server-config', JSON.stringify(config));
      setServerConfig(config);
    } catch (error) {
      console.error('Error saving server config:', error);
    }
  };

  // Load shop data from MCP and populate form
  const loadShopDataFromServer = async (mcpUrl: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(mcpUrl);
      if (response.ok) {
        const result = await response.json();
        const shopData = result.data?.shop || result.shop;
        const mcpProducts = result.data?.products || result.products || [];
        
        if (shopData) {
          // Mapear datos del servidor a los campos del formulario
          setStoreInfo({
            storeName: shopData.storeName || '',
            storeLocation: shopData.storeLocation || '',
            streetAddress: shopData.streetAddress || '',
            city: shopData.city || '',
            state: shopData.state || '',
            zip: shopData.zip || '',
            storeType: shopData.storeType || '',
            latitude: shopData.latitude || shopData.coordinates?.latitude?.toString() || '',
            longitude: shopData.longitude || shopData.coordinates?.longitude?.toString() || ''
          });

          // Actualizar configuración de pagos
          setPaymentSettings(prev => ({
            ...prev,
            ecommerceEnabled: shopData.ecommerceEnabled || false,
            cryptoEnabled: shopData.crypto || false
          }));

          // Actualizar StoreContext con datos del servidor
          setStoreIdentifiers({
            _id: shopData._id || null,
            clientId: shopData.clientId || shopData._id || null,
            shopId: shopData._id || null,
            storeName: shopData.storeName || null,
            storeType: shopData.storeType || null,
            mcpUrl: mcpUrl
          });

          // Actualizar serverSync
          setServerSync(prev => ({
            ...prev,
            synced: true,
            shopId: shopData._id || null,
            lastSync: new Date().toISOString()
          }));

          // Guardar nombre en server-config para que POS lo resuelva rápido en arranque
          try {
            const existingServerConfigRaw = localStorage.getItem('bizneai-server-config');
            if (existingServerConfigRaw) {
              const existingServerConfig = JSON.parse(existingServerConfigRaw);
              localStorage.setItem(
                'bizneai-server-config',
                JSON.stringify({
                  ...existingServerConfig,
                  storeName: shopData.storeName || existingServerConfig.storeName || ''
                })
              );
            }
          } catch (configError) {
            console.warn('Could not persist server storeName:', configError);
          }

          // Guardar productos reales del MCP para que POS no caiga en catálogo de muestra
          if (Array.isArray(mcpProducts) && mcpProducts.length > 0) {
            const mappedProducts = mcpProducts.map((product: any, index: number) =>
              mapMcpProductToLocal(product, index)
            );
            localStorage.setItem('bizneai-products', JSON.stringify(mappedProducts));
            setLastSyncTime();
            window.dispatchEvent(new Event('products-updated'));
          }

          toast.success('Datos del shop cargados desde el servidor');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading shop data:', error);
      toast.error('Error al cargar datos del shop desde el servidor');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle server URL change
  const handleServerUrlChange = async (url: string) => {
    const shopId = extractShopIdFromUrl(url);
    let mcpUrl = '';
    let mcpMethods: string[] = [];

    if (shopId) {
      mcpUrl = buildMcpUrl(shopId);
      
      // Try to fetch MCP methods
      try {
        const methodsUrl = `${mcpUrl}/methods`;
        const response = await fetch(methodsUrl);
        if (response.ok) {
          const data = await response.json();
          mcpMethods = data.methods || data.data?.methods || [];
        }
      } catch (error) {
        console.warn('Could not fetch MCP methods:', error);
      }

      const newConfig = {
        serverUrl: url,
        shopId,
        mcpUrl,
        mcpMethods
      };

      saveServerConfig(newConfig);
      setServerSync(prev => ({ ...prev, shopId }));
      
      // Guardar shopId en StoreContext para uso global
      setStoreIdentifiers({
        shopId,
        mcpUrl
      });

      // Cargar datos del shop desde el servidor
      const dataLoaded = await loadShopDataFromServer(mcpUrl);
      
      if (mcpMethods.length > 0) {
        toast.success(`Shop ID extraído: ${shopId}. ${mcpMethods.length} métodos MCP disponibles${dataLoaded ? '. Datos cargados.' : ''}`);
      } else {
        toast.success(`Shop ID extraído: ${shopId}${dataLoaded ? '. Datos cargados.' : ''}`);
      }
    } else {
      const newConfig = {
        serverUrl: url,
        shopId: '',
        mcpUrl: '',
        mcpMethods: []
      };
      saveServerConfig(newConfig);
      toast.error('No se pudo extraer el Shop ID de la URL');
    }
  };

  // Fetch MCP methods
  const fetchMcpMethods = async () => {
    if (!serverConfig.mcpUrl) {
      toast.error('Primero configura la URL del servidor');
      return;
    }

    setIsLoading(true);
    try {
      const methodsUrl = `${serverConfig.mcpUrl}/methods`;
      const response = await fetch(methodsUrl);
      
      if (response.ok) {
        const data = await response.json();
        const methods = data.methods || data.data?.methods || [];
        
        const updatedConfig = {
          ...serverConfig,
          mcpMethods: methods
        };
        saveServerConfig(updatedConfig);
        
        toast.success(`${methods.length} métodos MCP cargados exitosamente`);
      } else {
        toast.error('Error al obtener métodos MCP');
      }
    } catch (error) {
      console.error('Error fetching MCP methods:', error);
      toast.error('Error al conectar con el servidor MCP');
    } finally {
      setIsLoading(false);
    }
  };

  // Load shop data from server button
  const handleLoadShopData = async () => {
    if (!serverConfig.mcpUrl) {
      toast.error('Primero configura la URL del servidor');
      return;
    }

    await loadShopDataFromServer(serverConfig.mcpUrl);
  };

  const loadConfiguration = async () => {
    try {
      const config = await storeAPI.getConfig();
      if (config) {
        setStoreInfo({
          storeName: config.storeName || '',
          storeLocation: config.storeLocation || '',
          streetAddress: config.streetAddress || '',
          city: config.city || '',
          state: config.state || '',
          zip: config.zip || '',
          storeType: config.storeType || '',
          latitude: '',
          longitude: ''
        });
        setPaymentSettings(prev => ({
          ...prev,
          ecommerceEnabled: config.ecommerceEnabled || false,
          cryptoEnabled: config.crypto || false
        }));
        
        // Actualizar StoreContext con el storeType cargado
        if (config.storeType) {
          setStoreIdentifiers({ 
            storeType: config.storeType,
            storeName: config.storeName 
          });
          localStorage.setItem('bizneai-store-type', config.storeType);
        }
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const checkServerSync = async () => {
    try {
      const status = await storeAPI.checkStatus();
      if (status.config) {
        setServerSync({
          synced: true,
          shopId: status.config.clientId || null,
          lastSync: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error checking server sync:', error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const config: StoreConfig = {
        storeName: storeInfo.storeName,
        storeType: storeInfo.storeType,
        storeLocation: storeInfo.storeLocation,
        streetAddress: storeInfo.streetAddress,
        city: storeInfo.city,
        state: storeInfo.state,
        zip: storeInfo.zip,
        clientId: serverSync.shopId || '',
        ecommerceEnabled: paymentSettings.ecommerceEnabled,
        kitchenEnabled: false,
        crypto: paymentSettings.cryptoEnabled,
        acceptedCryptocurrencies: Object.keys(paymentSettings.cryptoAddresses).filter(
          key => paymentSettings.cryptoAddresses[key as keyof CryptoConfig]
        )
      };

      // Guardar primero en localStorage (funciona sin conexión)
      try {
        localStorage.setItem('bizneai-store-config', JSON.stringify(config));
        localStorage.setItem('bizneai-setup-complete', 'true');
        localStorage.setItem('bizneai-store-type', config.storeType);
        
        // Actualizar StoreContext con el storeType
        setStoreIdentifiers({ 
          storeType: config.storeType,
          storeName: config.storeName 
        });
        
        // Intentar sincronizar con servidor (opcional, no bloquea si falla)
        try {
          const result = await storeAPI.setupStore(config);
          if (result.success) {
            toast.success('Configuración guardada y sincronizada exitosamente');
          } else {
            toast.success('Configuración guardada localmente (sin conexión)');
          }
        } catch (syncError) {
          // Si falla la sincronización, no es crítico - ya está guardado localmente
          console.warn('No se pudo sincronizar con el servidor, pero los datos se guardaron localmente:', syncError);
          toast.success('Configuración guardada localmente (sin conexión)');
        }
        
        if (isSetupMode && onSetupComplete) {
          onSetupComplete();
        }
      } catch (localError) {
        console.error('Error guardando en localStorage:', localError);
        toast.error('Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error en handleSave:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncToServer = async () => {
    setIsLoading(true);
    try {
      // Si hay MCP configurado, priorizar sincronización real contra el servidor
      if (serverConfig.mcpUrl) {
        const loaded = await loadShopDataFromServer(serverConfig.mcpUrl);
        if (loaded) {
          const latestServerConfig = localStorage.getItem('bizneai-server-config');
          let currentShopId = serverConfig.shopId;
          if (latestServerConfig) {
            try {
              currentShopId = JSON.parse(latestServerConfig).shopId || currentShopId;
            } catch {
              // ignore parse errors
            }
          }

          setServerSync({
            synced: true,
            shopId: currentShopId || serverSync.shopId || null,
            lastSync: new Date().toISOString()
          });
          toast.success(`Sincronizado exitosamente. Shop ID: ${currentShopId || serverSync.shopId || 'N/A'}`);
          await loadConfiguration();
          return;
        }
      }

      // Fallback local si no hay MCP o falla la carga remota
      const config = await storeAPI.getConfig();
      if (config) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setServerSync({
          synced: true,
          shopId: config.clientId || `SHOP-${Date.now()}`,
          lastSync: new Date().toISOString()
        });
        toast.success(`Sincronizado localmente. Shop ID: ${config.clientId || 'N/A'}`);
        await loadConfiguration();
      }
    } catch (error) {
      toast.error('Error al sincronizar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    const startTime = Date.now();
    try {
      const response = await apiRequest('/health');
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        setApiConnectionStatus({ connected: true, responseTime });
        toast.success(`Conexión exitosa. Tiempo de respuesta: ${responseTime}ms`);
      } else {
        setApiConnectionStatus({ connected: false, responseTime });
        toast.error('Error de conexión');
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setApiConnectionStatus({ connected: false, responseTime });
      toast.error(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setStoreInfo(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
          toast.success('Coordenadas GPS capturadas');
        },
        (error) => {
          toast.error('Error al obtener la ubicación');
        }
      );
    } else {
      toast.error('Geolocalización no disponible');
    }
  };

  const handleSaveCryptoAddress = (crypto: string, address: string) => {
    // Basic validation
    if (crypto === 'bitcoin' && !address.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/)) {
      toast.error('Dirección Bitcoin inválida');
      return;
    }
    if (crypto === 'ethereum' && !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error('Dirección Ethereum inválida');
      return;
    }

    setPaymentSettings(prev => ({
      ...prev,
      cryptoAddresses: {
        ...prev.cryptoAddresses,
        [crypto]: address
      }
    }));
    toast.success(`Dirección ${crypto} guardada`);
  };

  const handleSavePasscode = () => {
    if (securitySettings.passcode !== securitySettings.confirmPasscode) {
      toast.error('Los códigos no coinciden');
      return;
    }
    if (securitySettings.passcode.length < 4) {
      toast.error('El código debe tener al menos 4 dígitos');
      return;
    }
    localStorage.setItem('bizneai-passcode', securitySettings.passcode);
    toast.success('Código de acceso guardado');
  };

  const handleResetPasscode = () => {
    localStorage.setItem('bizneai-passcode', '1234');
    setSecuritySettings(prev => ({ ...prev, passcode: '1234', confirmPasscode: '1234' }));
    toast.success('Código restablecido a 1234');
  };

  const handleExportData = () => {
    const data = {
      storeInfo,
      businessSettings,
      paymentSettings,
      taxSettings,
      aiSettings,
      securitySettings: { ...securitySettings, passcode: '', confirmPasscode: '' },
      exportedAt: new Date().toISOString(),
      totalRecords: 0
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bizneai-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Datos exportados exitosamente');
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.storeInfo) setStoreInfo(data.storeInfo);
        if (data.businessSettings) setBusinessSettings(data.businessSettings);
        if (data.paymentSettings) setPaymentSettings(data.paymentSettings);
        if (data.taxSettings) setTaxSettings(data.taxSettings);
        if (data.aiSettings) setAiSettings(data.aiSettings);
        toast.success('Datos importados exitosamente');
      } catch (error) {
        toast.error('Error al importar datos');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (window.confirm('¿Estás seguro de eliminar todos los datos? Esta acción no se puede deshacer.')) {
      localStorage.clear();
      toast.success('Todos los datos han sido eliminados');
      window.location.reload();
    }
  };

  const handleContactDeveloper = () => {
    const message = encodeURIComponent('Hola, necesito ayuda con BizneAI POS');
    window.open(`https://wa.me/1234567890?text=${message}`, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const renderSection = (id: string, title: string, icon: React.ReactNode, content: React.ReactNode) => {
    const isExpanded = expandedSections.has(id);
    return (
      <div className="settings-section-card">
        <div className="settings-section-header" onClick={() => toggleSection(id)}>
          <div className="settings-section-title">
            {icon}
            <h3>{title}</h3>
          </div>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        {isExpanded && (
          <div className="settings-section-content">
            {content}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Configuración del Sistema</h2>
        <p>Gestiona la configuración de tu tienda y preferencias del sistema</p>
      </div>

      {/* Server Sync Status */}
      <div className="settings-sync-status">
        <div className="sync-status-info">
          <Server size={20} />
          <div>
            <div className="sync-status-row">
              <span>Estado de sincronización:</span>
              <span className={serverSync.synced ? 'status-synced' : 'status-not-synced'}>
                {serverSync.synced ? 'Sincronizado' : 'No sincronizado'}
              </span>
            </div>
            {serverSync.shopId && (
              <div className="sync-status-row">
                <span>Shop ID:</span>
                <span className="shop-id">{serverSync.shopId}</span>
                <button onClick={() => copyToClipboard(serverSync.shopId!)} className="icon-btn">
                  <Copy size={14} />
                </button>
              </div>
            )}
            {serverSync.lastSync && (
              <div className="sync-status-row">
                <span>Última sincronización:</span>
                <span>{new Date(serverSync.lastSync).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* URL de la Tienda en Línea */}
        <div className="server-url-input-section">
          <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            URL de la Tienda en Línea
          </label>
          <div className="url-input-group" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              value={serverConfig.serverUrl}
              onChange={(e) => {
                const url = e.target.value;
                setServerConfig(prev => ({ ...prev, serverUrl: url }));
              }}
              onBlur={(e) => {
                if (e.target.value) {
                  handleServerUrlChange(e.target.value);
                }
              }}
              placeholder="https://www.bizneai.com/shop/691a59f9529b1c88366b342c/products o https://www.bizneai.com/api/mcp/691a59f9529b1c88366b342c o https://www.bizneai.com/restaurant/688a83b458e5b457505e70ae/menu"
              className="url-input"
              style={{ 
                flex: 1, 
                padding: '0.625rem 0.75rem',
                background: 'var(--bs-dark-surface)',
                border: '1px solid var(--bs-dark-border)',
                borderRadius: 'var(--bs-radius)',
                color: 'var(--bs-dark-text)',
                fontSize: '0.875rem',
                fontFamily: "'Courier New', monospace"
              }}
            />
            <button 
              onClick={() => copyToClipboard(serverConfig.serverUrl)} 
              className="icon-btn" 
              disabled={!serverConfig.serverUrl}
              title="Copiar URL"
            >
              <Copy size={16} />
            </button>
          </div>
          <small className="form-hint" style={{ 
            display: 'block', 
            marginTop: '0.5rem', 
            fontSize: '0.75rem', 
            color: 'var(--bs-dark-text-muted)', 
            fontStyle: 'italic' 
          }}>
            Ingresa la URL completa de tu tienda. Acepta URLs de Shop, Restaurant o MCP directo. El sistema extraerá automáticamente el Shop ID.
          </small>
        </div>
        
        <div className="sync-actions">
          <button onClick={handleSyncToServer} disabled={isLoading} className="btn-secondary">
            <RefreshCw size={16} />
            Sincronizar con Servidor
          </button>
          <button onClick={handleTestConnection} disabled={isLoading} className="btn-secondary">
            <TestTube size={16} />
            Probar Conexión
          </button>
          {serverConfig.mcpUrl && (
            <button onClick={handleLoadShopData} disabled={isLoading} className="btn-secondary">
              <Download size={16} />
              Cargar Datos del Shop
            </button>
          )}
        </div>
        
        {/* Información MCP (solo si hay Shop ID) */}
        {serverConfig.shopId && (
          <div className="mcp-info">
            <div className="info-row">
              <span className="info-label">Shop ID:</span>
              <span className="info-value">{serverConfig.shopId}</span>
              <button onClick={() => copyToClipboard(serverConfig.shopId)} className="icon-btn">
                <Copy size={14} />
              </button>
            </div>
            {serverConfig.mcpUrl && (
              <div className="info-row">
                <span className="info-label">URL MCP:</span>
                <span className="info-value">{serverConfig.mcpUrl}</span>
                <button onClick={() => copyToClipboard(serverConfig.mcpUrl)} className="icon-btn">
                  <Copy size={14} />
                </button>
              </div>
            )}
            {serverConfig.mcpMethods.length > 0 && (
              <div className="info-row">
                <span className="info-label">Métodos MCP disponibles:</span>
                <span className="info-value">{serverConfig.mcpMethods.length}</span>
              </div>
            )}
            <button 
              onClick={fetchMcpMethods} 
              disabled={isLoading || !serverConfig.mcpUrl} 
              className="btn-secondary"
              style={{ marginTop: '0.5rem' }}
            >
              <RefreshCw size={16} />
              Actualizar Métodos MCP
            </button>
          </div>
        )}
        {apiConnectionStatus.responseTime !== null && (
          <div className="connection-status">
            <Activity size={16} />
            <span>Tiempo de respuesta: {apiConnectionStatus.responseTime}ms</span>
          </div>
        )}
      </div>

      {/* Store Information */}
      {renderSection('store-info', 'Información de la Tienda', <Store size={20} />,
        <div className="settings-form">
          <div className="form-row">
            <div className="form-group">
              <label>Nombre de la Tienda *</label>
              <input
                type="text"
                value={storeInfo.storeName}
                onChange={(e) => setStoreInfo(prev => ({ ...prev, storeName: e.target.value }))}
                placeholder="Mi Tienda"
              />
            </div>
            <div className="form-group">
              <label>Ubicación</label>
              <input
                type="text"
                value={storeInfo.storeLocation}
                onChange={(e) => setStoreInfo(prev => ({ ...prev, storeLocation: e.target.value }))}
                placeholder="Ubicación"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Dirección</label>
              <input
                type="text"
                value={storeInfo.streetAddress}
                onChange={(e) => setStoreInfo(prev => ({ ...prev, streetAddress: e.target.value }))}
                placeholder="Calle y número"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Ciudad</label>
              <input
                type="text"
                value={storeInfo.city}
                onChange={(e) => setStoreInfo(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Ciudad"
              />
            </div>
            <div className="form-group">
              <label>Estado</label>
              <input
                type="text"
                value={storeInfo.state}
                onChange={(e) => setStoreInfo(prev => ({ ...prev, state: e.target.value }))}
                placeholder="Estado"
              />
            </div>
            <div className="form-group">
              <label>Código Postal</label>
              <input
                type="text"
                value={storeInfo.zip}
                onChange={(e) => setStoreInfo(prev => ({ ...prev, zip: e.target.value }))}
                placeholder="CP"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Tipo de Tienda</label>
              <select
                value={storeInfo.storeType}
                onChange={(e) => setStoreInfo(prev => ({ ...prev, storeType: e.target.value }))}
              >
                <option value="">Seleccionar tipo</option>
                {storeTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label.es}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Coordenadas GPS</label>
              <div className="gps-input-group">
                <input
                  type="text"
                  value={storeInfo.latitude}
                  onChange={(e) => setStoreInfo(prev => ({ ...prev, latitude: e.target.value }))}
                  placeholder="Latitud"
                  readOnly
                />
                <input
                  type="text"
                  value={storeInfo.longitude}
                  onChange={(e) => setStoreInfo(prev => ({ ...prev, longitude: e.target.value }))}
                  placeholder="Longitud"
                  readOnly
                />
                <button onClick={handleGetLocation} className="btn-secondary">
                  <MapPin size={16} />
                  Obtener Ubicación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Settings */}
      {renderSection('business-settings', 'Configuración del Negocio', <Building size={20} />,
        <div className="settings-form">
          <div className="form-row">
            <div className="form-group">
              <label>Zona Horaria</label>
              <select
                value={businessSettings.timeZone}
                onChange={(e) => setBusinessSettings(prev => ({ ...prev, timeZone: e.target.value }))}
              >
                <option value="America/Mexico_City">Hora del Centro (México)</option>
                <option value="America/New_York">Hora del Este (EE.UU.)</option>
                <option value="America/Los_Angeles">Hora del Pacífico (EE.UU.)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Moneda</label>
              <select
                value={businessSettings.currency}
                onChange={(e) => setBusinessSettings(prev => ({ ...prev, currency: e.target.value }))}
              >
                <option value="MXN">MXN ($)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Idioma</label>
              <select
                value={businessSettings.language}
                onChange={(e) => setBusinessSettings(prev => ({ ...prev, language: e.target.value }))}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Payment Settings */}
      {renderSection('payment-settings', 'Configuración de Pagos', <CreditCard size={20} />,
        <div className="settings-form">
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={paymentSettings.cashEnabled}
                onChange={(e) => setPaymentSettings(prev => ({ ...prev, cashEnabled: e.target.checked }))}
              />
              <span>Habilitar pago en efectivo</span>
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={paymentSettings.cardEnabled}
                onChange={(e) => setPaymentSettings(prev => ({ ...prev, cardEnabled: e.target.checked }))}
              />
              <span>Habilitar pago con tarjeta</span>
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={paymentSettings.ecommerceEnabled}
                onChange={(e) => setPaymentSettings(prev => ({ ...prev, ecommerceEnabled: e.target.checked }))}
              />
              <span>Habilitar eCommerce</span>
            </label>
          </div>
          {paymentSettings.ecommerceEnabled && (
            <div className="form-group">
              <label>URL de la Tienda</label>
              <div className="url-input-group">
                <input
                  type="text"
                  value={paymentSettings.ecommerceUrl}
                  readOnly
                  placeholder="https://tu-tienda.bizneai.com"
                />
                <button onClick={() => copyToClipboard(paymentSettings.ecommerceUrl)} className="icon-btn">
                  <Copy size={16} />
                </button>
              </div>
            </div>
          )}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={paymentSettings.cryptoEnabled}
                onChange={(e) => setPaymentSettings(prev => ({ ...prev, cryptoEnabled: e.target.checked }))}
              />
              <span>Habilitar pagos con criptomonedas</span>
            </label>
          </div>
          {paymentSettings.cryptoEnabled && (
            <div className="crypto-settings">
              <h4>Direcciones de Criptomonedas</h4>
              {['bitcoin', 'ethereum', 'solana'].map((crypto) => {
                const address = paymentSettings.cryptoAddresses[crypto as keyof CryptoConfig] || '';
                const isConfigured = !!address;
                return (
                  <div key={crypto} className="crypto-address-group">
                    <div className="crypto-header">
                      <Bitcoin size={20} />
                      <span>{crypto.charAt(0).toUpperCase() + crypto.slice(1)}</span>
                      <span className={`crypto-status ${isConfigured ? 'configured' : 'not-configured'}`}>
                        {isConfigured ? 'Configurado' : 'No configurado'}
                      </span>
                    </div>
                    <div className="crypto-input-group">
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => {
                          const newAddresses = { ...paymentSettings.cryptoAddresses, [crypto]: e.target.value };
                          setPaymentSettings(prev => ({ ...prev, cryptoAddresses: newAddresses }));
                        }}
                        placeholder={`Dirección ${crypto}`}
                      />
                      <button
                        onClick={() => handleSaveCryptoAddress(crypto, address)}
                        className="btn-secondary"
                        disabled={!address}
                      >
                        <Save size={16} />
                        Guardar
                      </button>
                    </div>
                    {isConfigured && (
                      <div className="crypto-qr">
                        <QrCode size={64} />
                        <button className="btn-secondary">
                          <Download size={16} />
                          Guardar QR
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tax Settings */}
      {renderSection('tax-settings', 'Configuración de Impuestos', <Percent size={20} />,
        <div className="settings-form">
          <div className="form-row">
            <div className="form-group">
              <label>Tasa de Impuesto (%)</label>
              <input
                type="number"
                value={taxSettings.taxRate}
                onChange={(e) => setTaxSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label>Método de Cálculo</label>
              <select
                value={taxSettings.taxCalculationMethod}
                onChange={(e) => setTaxSettings(prev => ({ ...prev, taxCalculationMethod: e.target.value }))}
              >
                <option value="exclusive">Impuesto excluido</option>
                <option value="inclusive">Impuesto incluido</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={taxSettings.taxInclusive}
                onChange={(e) => setTaxSettings(prev => ({ ...prev, taxInclusive: e.target.checked }))}
              />
              <span>Precios incluyen impuesto</span>
            </label>
          </div>
        </div>
      )}

      {/* AI Settings */}
      {renderSection('ai-settings', 'Configuración de IA', <Brain size={20} />,
        <div className="settings-form">
          <div className="form-group">
            <label>OpenAI API Key</label>
            <div className="api-key-input-group">
              <input
                type={showPasscode ? 'text' : 'password'}
                value={aiSettings.openaiApiKey}
                onChange={(e) => setAiSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                placeholder="sk-..."
              />
              <button onClick={() => setShowPasscode(!showPasscode)} className="icon-btn">
                {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              onClick={() => {
                if (aiSettings.openaiApiKey) {
                  localStorage.setItem('bizneai-openai-key', aiSettings.openaiApiKey);
                  setAiSettings(prev => ({ ...prev, aiEnabled: true }));
                  toast.success('API Key guardada. BizneAI Chat habilitado');
                }
              }}
              className="btn-secondary"
              disabled={!aiSettings.openaiApiKey}
            >
              <Save size={16} />
              Guardar API Key
            </button>
          </div>
          <div className="form-group">
            <label>Estilo de Respuesta</label>
            <select
              value={aiSettings.responseStyle}
              onChange={(e) => setAiSettings(prev => ({ ...prev, responseStyle: e.target.value }))}
            >
              <option value="professional">Profesional</option>
              <option value="casual">Casual</option>
              <option value="friendly">Amigable</option>
            </select>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {renderSection('security-settings', 'Configuración de Seguridad', <Shield size={20} />,
        <div className="settings-form">
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={securitySettings.passcodeEnabled}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, passcodeEnabled: e.target.checked }))}
              />
              <span>Habilitar código de acceso</span>
            </label>
          </div>
          {securitySettings.passcodeEnabled && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Nuevo Código</label>
                  <input
                    type="password"
                    value={securitySettings.passcode}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, passcode: e.target.value }))}
                    placeholder="1234"
                  />
                </div>
                <div className="form-group">
                  <label>Confirmar Código</label>
                  <input
                    type="password"
                    value={securitySettings.confirmPasscode}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, confirmPasscode: e.target.value }))}
                    placeholder="1234"
                  />
                </div>
              </div>
              <div className="form-group">
                <button onClick={handleSavePasscode} className="btn-secondary">
                  <Save size={16} />
                  Guardar Código
                </button>
                <button onClick={handleResetPasscode} className="btn-secondary">
                  <RotateCcw size={16} />
                  Restablecer a 1234
                </button>
              </div>
            </>
          )}
          <div className="form-group">
            <label>Timeout de Sesión (minutos)</label>
            <input
              type="number"
              value={securitySettings.sessionTimeout}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 30 }))}
              min="5"
              max="120"
            />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={securitySettings.autoBackup}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, autoBackup: e.target.checked }))}
              />
              <span>Backup automático</span>
            </label>
          </div>
          {securitySettings.autoBackup && (
            <div className="form-group">
              <label>Frecuencia de Backup</label>
              <select
                value={securitySettings.backupFrequency}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
              >
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Utilities Section */}
      {renderSection('utilities', 'Utilidades', <Database size={20} />,
        <div className="settings-form">
          <div className="utility-buttons">
            <button onClick={handleExportData} className="btn-secondary">
              <Download size={16} />
              Exportar Datos
            </button>
            <label className="btn-secondary">
              <Upload size={16} />
              Importar Datos
              <input type="file" accept=".json" onChange={handleImportData} style={{ display: 'none' }} />
            </label>
            <button onClick={() => {
              if (window.confirm('¿Restablecer el asistente de configuración?')) {
                localStorage.removeItem('bizneai-setup-complete');
                toast.success('Asistente restablecido');
              }
            }} className="btn-secondary">
              <RotateCcw size={16} />
              Restablecer Asistente
            </button>
            <button onClick={handleClearAllData} className="btn-danger">
              <Trash2 size={16} />
              Eliminar Todos los Datos
            </button>
            <button onClick={handleContactDeveloper} className="btn-secondary">
              <Phone size={16} />
              Contactar Desarrollador
            </button>
          </div>
        </div>
      )}

      {/* Actions - Sticky Footer */}
      <div className="settings-actions">
        <button 
          className="btn-primary" 
          onClick={handleSave}
          disabled={isLoading}
          style={{
            minWidth: '200px',
            fontSize: '1rem',
            padding: '0.875rem 2rem',
            fontWeight: 600
          }}
        >
          {isLoading ? (
            <>
              <div className="spinner" style={{ marginRight: '0.5rem' }}></div>
              Guardando...
            </>
          ) : (
            <>
              <Save size={20} />
              Guardar Configuración
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Settings;
