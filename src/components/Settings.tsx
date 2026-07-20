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
  Zap,
  X,
  MessageCircle,
  Printer,
  User,
  Users,
  Terminal,
  Diamond
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { storeAPI } from '../api/store';
import { API_CONFIG, apiRequest, handleApiError } from '../config/api';
import { StoreConfig } from '../types/store';
import { useStore } from '../contexts/StoreContext';
import { getStoreTypes, checkStoreTypesForUpdates, getStoreTypeLabel } from '../data/storeTypes';
import {
  mapMcpProductToLocal,
  mergeProductsFromServerPreserveImages,
  applyMcpInventoryStatusToMergedCatalog,
  getShopId,
  getMcpUrl,
} from '../utils/shopIdHelper';
import { getLocalApiOrigin, shouldUseSalesMcpProxy } from '../utils/localApiBase';
import { extractMcpMethodsField, getMcpMethodsEndpointCount } from '../utils/mcpMethodsApi';
import {
  setLastSyncTime,
  isSyncDue,
  getLastFullBackupTime,
  getFullBackupIntervalHours,
  setFullBackupIntervalHours,
} from '../utils/syncService';
import { runFullBackupSync } from '../services/fullBackupSyncService';
import { getWhatsAppUrl } from '../constants/contact';
import {
  getReceiptPrintConfig,
  setReceiptPrintConfig,
  isElectron,
  openReceiptPrintPreviewDialog,
  printReceiptTestThermal,
  type ReceiptPageSize,
  type ReceiptPrintConfig,
} from '../services/receiptPrintService';
import { syncRolesToServer } from '../api/roles';
import RolesScreenLockPanel from './RolesScreenLockPanel';
import { enterKioskMode, isKioskModeActive } from '../hooks/useKioskMode';
import { getVersionDisplay, BUILD_TIMESTAMP } from '../lib/buildInfo';
import i18n from '../i18n';
import type { TaxSettings } from '../utils/taxSettings';
import {
  flushMirroredKeysToServer,
  initPosPersistence,
  scheduleMirrorKeyToSqlite,
  deleteKvFromServer,
  wipeAllPosLocalData,
} from '../services/posPersistService';
import { syncProductImagesToLocalDisk } from '../services/productImageLocalCache';
import { generatePolygonWallet, revealPolygonWalletMnemonic, getPolygonWallet } from '../api/cryptoWallet';
import { syncShopCryptoAddresses } from '../api/shopCryptoSync';
import { ensureShopSession, shopAuthLogin, clearShopSessionToken } from '../services/shopAuthService';
import {
  setConfigAccessPassword,
  setConfigModifyPassword,
  isConfigurationModifyUnlocked,
  unlockConfigurationModifyWithPassword,
  validateConfigModifyPassword,
  getConfigAccessPassword,
  getConfigModifyPassword,
} from '../services/configPasswords';

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
  /** USDLXE (LUXAE) — dirección Polygon (0x + 40 hex), generada localmente o pegada a mano. */
  luxae?: string;
}

interface BusinessHours {
  [key: string]: { open: string; close: string; enabled: boolean };
}

const Settings: React.FC<SettingsProps> = ({ isSetupMode, onSetupComplete }) => {
  const { setStoreIdentifiers, clearStoreIdentifiers } = useStore();
  // State for active section
  const [activeSection, setActiveSection] = useState<string>('store-info');

  // Receipt printer config (solo relevante en Electron)
  const [receiptPrintConfig, setReceiptPrintConfigState] = useState<ReceiptPrintConfig>(() =>
    getReceiptPrintConfig()
  );
  
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

  // Wallet Polygon (USDLXE) generada localmente
  const [polygonWalletLoading, setPolygonWalletLoading] = useState(false);
  const [generatedWalletModal, setGeneratedWalletModal] = useState<{ address: string; mnemonic: string } | null>(null);
  const [mnemonicRevealed, setMnemonicRevealed] = useState(false);

  // Sync de "Pagos con Cripto" hacia sites/bizneaiWeb (PUT /api/shop/:id)
  const [showCryptoSyncModal, setShowCryptoSyncModal] = useState(false);
  const [cryptoSyncPasscode, setCryptoSyncPasscode] = useState('');
  const [cryptoSyncLoading, setCryptoSyncLoading] = useState(false);

  // Tax Settings
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    taxRate: 16,
    taxCalculationMethod: 'exclusive',
    taxInclusive: false
  });

  // AI Settings
  const [aiSettings, setAiSettings] = useState({
    openaiApiKey: '',
    geminiApiKey: typeof window !== 'undefined' ? localStorage.getItem('bizneai-gemini-key') || '' : '',
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

  // Server URL and MCP Configuration (mcpMethods: array legacy o mapa GET/POST/… desde /methods)
  const [serverConfig, setServerConfig] = useState<{
    serverUrl: string;
    shopId: string;
    mcpUrl: string;
    mcpMethods: unknown;
  }>({
    serverUrl: '',
    shopId: '',
    mcpUrl: '',
    mcpMethods: [],
  });

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [kitchenEnabled, setKitchenEnabled] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(['store-info', 'config-passwords', 'roles-screen-lock'])
  );
  const [apiConnectionStatus, setApiConnectionStatus] = useState<{
    connected: boolean;
    responseTime: number | null;
  }>({ connected: false, responseTime: null });
  const [fullBackupIntervalH, setFullBackupIntervalH] = useState(() => getFullBackupIntervalHours());
  const [fullBackupUiTick, setFullBackupUiTick] = useState(0);
  const [showContactDeveloperModal, setShowContactDeveloperModal] = useState(false);

  const [modifyUnlocked, setModifyUnlocked] = useState(() =>
    isSetupMode ? true : isConfigurationModifyUnlocked()
  );
  const [showModifyUnlockModal, setShowModifyUnlockModal] = useState(false);
  const [modifyUnlockPassword, setModifyUnlockPassword] = useState('');
  const [modifyUnlockUsername, setModifyUnlockUsername] = useState('');
  const [modifyUnlockError, setModifyUnlockError] = useState(false);
  const [newAccessPassword, setNewAccessPassword] = useState('');
  const [newModifyPassword, setNewModifyPassword] = useState('');
  const [confirmModifyPassword, setConfirmModifyPassword] = useState('');
  /** Si la edición global está bloqueada, aquí se valida la contraseña de admin actual para poder guardar cambios de contraseñas. */
  const [currentAdminForPasswordChange, setCurrentAdminForPasswordChange] = useState('');
  /** Junto con la anterior: usuario `admin` + contraseña `admin` como respaldo fijo. */
  const [currentAdminUsernameForPasswordChange, setCurrentAdminUsernameForPasswordChange] = useState('');
  const [showPwAccessInput, setShowPwAccessInput] = useState(false);
  const [showPwModifyNew, setShowPwModifyNew] = useState(false);
  const [showPwModifyConfirm, setShowPwModifyConfirm] = useState(false);
  const [showPwCurrentAdmin, setShowPwCurrentAdmin] = useState(false);
  /** Solo con edición desbloqueada o setup: ver texto plano de lo guardado en el equipo (uso puntual). */
  const [showStoredPasswordsReference, setShowStoredPasswordsReference] = useState(false);

  const settingsLocked = !isSetupMode && !modifyUnlocked;

  useEffect(() => {
    if (isSetupMode) setModifyUnlocked(true);
  }, [isSetupMode]);

  useEffect(() => {
    const onRevoke = () => setModifyUnlocked(false);
    window.addEventListener('bizneai-config-modify-revoked', onRevoke);
    return () => window.removeEventListener('bizneai-config-modify-revoked', onRevoke);
  }, []);

  // Cargar idioma guardado al montar
  useEffect(() => {
    const saved = localStorage.getItem('bizneai-language');
    if (saved && (saved === 'es' || saved === 'en')) {
      setBusinessSettings(prev => ({ ...prev, language: saved }));
    }
  }, []);

  // Cargar dirección Polygon (USDLXE) ya generada localmente, si existe
  useEffect(() => {
    const shopId = getShopId();
    if (!shopId) return;
    void getPolygonWallet(shopId).then((res) => {
      if (res.success && res.data?.address) {
        setPaymentSettings(prev => ({
          ...prev,
          cryptoAddresses: { ...prev.cryptoAddresses, luxae: res.data!.address },
        }));
      }
    });
  }, []);

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

  // Build MCP URL from shop ID (canonical production URL for storage)
  const buildMcpUrl = (shopId: string): string => {
    let baseUrl = 'https://www.bizneai.com';
    
    try {
      if (serverConfig.serverUrl) {
        const urlObj = new URL(serverConfig.serverUrl);
        baseUrl = `${urlObj.protocol}//${urlObj.host}`;
      }
    } catch {
      console.warn('Could not parse base URL, using default');
    }
    
    return `${baseUrl}/api/mcp/${shopId}`;
  };

  /** En localhost/Electron reescribe a proxy :3000 para evitar CORS. */
  const resolveMcpFetchUrl = (mcpUrl: string): string => {
    if (!shouldUseSalesMcpProxy()) return mcpUrl;
    const shopId = extractShopIdFromUrl(mcpUrl) || getShopId();
    if (!shopId) return getMcpUrl() || mcpUrl;
    const suffixMatch = mcpUrl.match(/\/api\/mcp\/[a-f0-9]{24}(.*)$/i);
    const suffix = suffixMatch?.[1] || '';
    return `${getLocalApiOrigin()}/api/proxy/mcp/${shopId}${suffix}`;
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
      let prev: { shopId?: string; mcpUrl?: string } = {};
      try {
        const raw = localStorage.getItem('bizneai-server-config');
        if (raw) prev = JSON.parse(raw);
      } catch {
        /* ignore */
      }
      const serverIdsChanged =
        String(prev.shopId ?? '') !== String(config.shopId ?? '') ||
        String(prev.mcpUrl ?? '') !== String(config.mcpUrl ?? '');

      localStorage.setItem('bizneai-server-config', JSON.stringify(config));
      scheduleMirrorKeyToSqlite('bizneai-server-config');
      setServerConfig(config);
      if (serverIdsChanged) {
        window.dispatchEvent(new CustomEvent('store-config-updated'));
      }
    } catch (error) {
      console.error('Error saving server config:', error);
    }
  };

  // Load shop data from MCP and populate form
  const loadShopDataFromServer = async (mcpUrl: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(resolveMcpFetchUrl(mcpUrl));
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

          if (shopData.kitchenEnabled !== undefined) {
            setKitchenEnabled(!!shopData.kitchenEnabled);
          }

          // Persistir storeType + kitchenEnabled para que el POS resuelva Cocina según el tipo real (p. ej. papelería).
          try {
            const existingStoreConfig = localStorage.getItem('bizneai-store-config');
            const storeConfig = existingStoreConfig ? JSON.parse(existingStoreConfig) : {};
            if (shopData.storeType != null && String(shopData.storeType).trim() !== '') {
              const st = String(shopData.storeType).trim();
              storeConfig.storeType = st;
              localStorage.setItem('bizneai-store-type', st);
              scheduleMirrorKeyToSqlite('bizneai-store-type');
            }
            if (shopData.kitchenEnabled !== undefined) {
              storeConfig.kitchenEnabled = !!shopData.kitchenEnabled;
            }
            if (
              (shopData.storeType != null && String(shopData.storeType).trim() !== '') ||
              shopData.kitchenEnabled !== undefined
            ) {
              localStorage.setItem('bizneai-store-config', JSON.stringify(storeConfig));
              scheduleMirrorKeyToSqlite('bizneai-store-config');
              window.dispatchEvent(new Event('store-config-updated'));
            }
          } catch (e) {
            console.warn('Could not persist shop type/kitchen to store config:', e);
          }

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

          // Guardar nombre y kitchenEnabled en server-config para que POS lo resuelva rápido
          try {
            const existingServerConfigRaw = localStorage.getItem('bizneai-server-config');
            if (existingServerConfigRaw) {
              const existingServerConfig = JSON.parse(existingServerConfigRaw);
              const updated = {
                ...existingServerConfig,
                storeName: shopData.storeName || existingServerConfig.storeName || ''
              };
              if (shopData.kitchenEnabled !== undefined) {
                updated.kitchenEnabled = !!shopData.kitchenEnabled;
              }
              if (shopData.storeType != null && String(shopData.storeType).trim() !== '') {
                updated.storeType = String(shopData.storeType).trim();
              }
              localStorage.setItem('bizneai-server-config', JSON.stringify(updated));
              scheduleMirrorKeyToSqlite('bizneai-server-config');
            }
          } catch (configError) {
            console.warn('Could not persist server config:', configError);
          }

          // Guardar productos reales del MCP para que POS no caiga en catálogo de muestra
          if (Array.isArray(mcpProducts) && mcpProducts.length > 0) {
            let savedParsed: unknown[] = [];
            try {
              const raw = localStorage.getItem('bizneai-products');
              if (raw) {
                const p = JSON.parse(raw);
                if (Array.isArray(p)) savedParsed = p;
              }
            } catch {
              /* ignore */
            }
            const mappedProducts = mcpProducts.map((product: any, index: number) =>
              mapMcpProductToLocal(product, index)
            );
            const merged = mergeProductsFromServerPreserveImages(savedParsed, mappedProducts);
            const mergedWithInv = await applyMcpInventoryStatusToMergedCatalog(merged);
            const withLocalImages = await syncProductImagesToLocalDisk(mergedWithInv);
            localStorage.setItem('bizneai-products', JSON.stringify(withLocalImages));
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
    let mcpMethods: unknown = [];

    if (shopId) {
      mcpUrl = buildMcpUrl(shopId);
      
      // GET …/methods — data.methods puede ser { GET: [], POST: [], … }
      try {
        const methodsUrl = `${resolveMcpFetchUrl(mcpUrl)}/methods`;
        const response = await fetch(methodsUrl);
        if (response.ok) {
          const data = await response.json();
          mcpMethods = extractMcpMethodsField(data);
        }
      } catch (error) {
        console.warn('Could not fetch MCP methods:', error);
      }

      const newConfig = {
        serverUrl: url,
        shopId,
        mcpUrl,
        mcpMethods,
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
      
      if (getMcpMethodsEndpointCount(mcpMethods) > 0) {
        toast.success(
          `Shop ID extraído: ${shopId}. ${getMcpMethodsEndpointCount(mcpMethods)} endpoints MCP documentados${dataLoaded ? '. Datos cargados.' : ''}`
        );
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
        const methods = extractMcpMethodsField(data);

        const updatedConfig = {
          ...serverConfig,
          mcpMethods: methods,
        };
        saveServerConfig(updatedConfig);

        const n = getMcpMethodsEndpointCount(methods);
        toast.success(`${n} endpoints MCP documentados cargados`);
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

  const handleFullBackupNow = async () => {
    if (!serverConfig.shopId || !serverConfig.mcpUrl) {
      toast.error('Configura la URL del servidor y el Shop ID primero');
      return;
    }
    setIsLoading(true);
    toast.loading('Sincronización completa MCP (backup en línea)...', { id: 'full-backup' });
    try {
      const result = await runFullBackupSync((label) => {
        toast.loading(`${label}...`, { id: 'full-backup' });
      });
      toast.dismiss('full-backup');
      if (result.ok) {
        toast.success(
          `Backup completo: ${result.productCount ?? 0} productos en catálogo; ventas/tickets/inventario guardados en local.`
        );
      } else {
        toast.error(
          'Backup parcial: revisa que el API local (:3000) esté en marcha en desarrollo o tu conexión a internet.'
        );
      }
      setFullBackupUiTick((t) => t + 1);
    } catch (e) {
      toast.dismiss('full-backup');
      toast.error(e instanceof Error ? e.message : 'Error en sincronización completa');
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
          cryptoEnabled: config.crypto || false,
          cryptoAddresses: { ...prev.cryptoAddresses, ...(config.cryptoAddresses || {}) }
        }));
        setKitchenEnabled(config.kitchenEnabled ?? false);
        
        // Actualizar StoreContext con el storeType cargado
        if (config.storeType) {
          setStoreIdentifiers({ 
            storeType: config.storeType,
            storeName: config.storeName 
          });
          localStorage.setItem('bizneai-store-type', config.storeType);
          scheduleMirrorKeyToSqlite('bizneai-store-type');
        }

        if (typeof config.taxRate === 'number' && !Number.isNaN(config.taxRate)) {
          setTaxSettings({
            taxRate: config.taxRate,
            taxCalculationMethod:
              config.taxCalculationMethod === 'inclusive' ? 'inclusive' : 'exclusive',
            taxInclusive: !!config.taxInclusive,
          });
        } else {
          const legacy = localStorage.getItem('bizneai-tax-rate');
          if (legacy != null) {
            const r = parseFloat(legacy);
            if (!Number.isNaN(r)) {
              setTaxSettings((prev) => ({ ...prev, taxRate: r }));
            }
          }
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

  const syncTaxToBackend = (next: {
    taxRate: number;
    taxCalculationMethod: 'exclusive' | 'inclusive';
    taxInclusive: boolean;
  }) => {
    void storeAPI.updateConfig({
      taxRate: next.taxRate,
      taxCalculationMethod: next.taxCalculationMethod,
      taxInclusive: next.taxInclusive,
    });
    localStorage.setItem('bizneai-tax-rate', String(next.taxRate));
    scheduleMirrorKeyToSqlite('bizneai-tax-rate');
    window.dispatchEvent(new CustomEvent('store-config-updated'));
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
    if (settingsLocked) {
      toast.error('Desbloquea la edición con la contraseña de administrador.');
      return;
    }
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
        kitchenEnabled,
        crypto: paymentSettings.cryptoEnabled,
        acceptedCryptocurrencies: Object.keys(paymentSettings.cryptoAddresses).filter(
          key => paymentSettings.cryptoAddresses[key as keyof CryptoConfig]
        ),
        taxRate: taxSettings.taxRate,
        taxCalculationMethod:
          taxSettings.taxCalculationMethod === 'inclusive' ? 'inclusive' : 'exclusive',
        taxInclusive: taxSettings.taxInclusive,
      };

      // Guardar primero en localStorage (funciona sin conexión)
      try {
        localStorage.setItem('bizneai-store-config', JSON.stringify(config));
        localStorage.setItem('bizneai-setup-complete', 'true');
        localStorage.setItem('bizneai-store-type', config.storeType);
        scheduleMirrorKeyToSqlite('bizneai-store-config');
        scheduleMirrorKeyToSqlite('bizneai-setup-complete');
        scheduleMirrorKeyToSqlite('bizneai-store-type');

        // Actualizar StoreContext con el storeType
        setStoreIdentifiers({ 
          storeType: config.storeType,
          storeName: config.storeName 
        });

        void (async () => {
          const persisted = await initPosPersistence();
          if (persisted.ok) {
            await flushMirroredKeysToServer();
          }
        })();
        
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

  const handleSyncRoles = async () => {
    if (!serverConfig.shopId) {
      toast.error('Configura el Shop ID antes de sincronizar roles');
      return;
    }
    setIsLoading(true);
    try {
      const rolesRaw = localStorage.getItem('bizneai-roles');
      const roles = rolesRaw ? JSON.parse(rolesRaw) : [];
      const result = await syncRolesToServer({
        shopId: serverConfig.shopId,
        roles: Array.isArray(roles) ? roles : [],
        timestamp: new Date().toISOString(),
      });
      if (result.success) {
        toast.success(result.message || 'Roles sincronizados correctamente');
      } else {
        toast.error(result.error || 'Error al sincronizar roles');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al sincronizar roles');
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
    if ((crypto === 'ethereum' || crypto === 'luxae') && !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error(crypto === 'luxae' ? 'Dirección Polygon (USDLXE) inválida — debe ser 0x + 40 hex' : 'Dirección Ethereum inválida');
      return;
    }

    const updatedAddresses = {
      ...paymentSettings.cryptoAddresses,
      [crypto]: address
    };
    setPaymentSettings(prev => ({
      ...prev,
      cryptoAddresses: updatedAddresses
    }));

    // Persistir de verdad — antes esto solo vivía en useState y se perdía en
    // cada recarga/remount (loadConfiguration/loadShopDataFromServer pisaban
    // el toggle y las direcciones nunca se habían guardado).
    const acceptedCryptocurrencies = Object.keys(updatedAddresses).filter((k) => !!updatedAddresses[k]);
    void storeAPI.updateConfig({ cryptoAddresses: updatedAddresses, acceptedCryptocurrencies }).then((res) => {
      if (!res.success) {
        toast.error(`Dirección ${crypto} guardada solo en esta sesión — no se pudo persistir`);
      }
    });

    toast.success(`Dirección ${crypto} guardada`);
  };

  /**
   * Genera una wallet Polygon (EVM, 0x + 40 hex) nueva para USDLXE en el
   * servidor local (nunca sale de esta máquina salvo respaldo manual del
   * usuario). Requiere que el toggle "Habilitar pagos con criptomonedas" esté
   * activo — misma regla de negocio que la app móvil, pero sin el bug de
   * sombra de variable que ahí bloqueaba el flujo permanentemente.
   */
  const handleGeneratePolygonWallet = async (force = false) => {
    if (!paymentSettings.cryptoEnabled) {
      toast.error('Activa "Habilitar pagos con criptomonedas" antes de generar la dirección.');
      return;
    }
    const shopId = getShopId();
    if (!shopId) {
      toast.error('Configura el ID de tienda antes de generar la wallet.');
      return;
    }
    setPolygonWalletLoading(true);
    const res = await generatePolygonWallet(shopId, force);
    setPolygonWalletLoading(false);
    if (res.success && res.data) {
      handleSaveCryptoAddress('luxae', res.data.address);
      setMnemonicRevealed(true);
      setGeneratedWalletModal({ address: res.data.address, mnemonic: res.data.mnemonic });
      toast.success('Wallet Polygon generada — respalda tu frase antes de cerrar este cuadro');
    } else if (res.error === 'ALREADY_EXISTS') {
      toast.error('Ya existe una wallet generada para esta tienda. Usa "Ver frase de nuevo" o fuerza una nueva.');
    } else {
      toast.error(res.error || 'No se pudo generar la wallet');
    }
  };

  const handleRevealPolygonMnemonic = async () => {
    const shopId = getShopId();
    if (!shopId) return;
    setPolygonWalletLoading(true);
    const res = await revealPolygonWalletMnemonic(shopId);
    setPolygonWalletLoading(false);
    if (res.success && res.data) {
      setMnemonicRevealed(true);
      setGeneratedWalletModal({ address: res.data.address, mnemonic: res.data.mnemonic });
    } else {
      toast.error(res.error || 'No se pudo recuperar la frase');
    }
  };

  /**
   * Envía las direcciones configuradas en "Pagos con Cripto" a
   * PUT /api/shop/:id (sites/bizneaiWeb) — mismo endpoint que usa la app
   * móvil. Requiere el passcode del owner en cada llamada (nunca se cachea,
   * el servidor lo usa para derivar la llave de cifrado).
   */
  const handleSyncCryptoToShop = async () => {
    const shopId = getShopId();
    if (!shopId) {
      toast.error('Configura el ID de tienda antes de sincronizar.');
      return;
    }
    if (!cryptoSyncPasscode.trim()) {
      toast.error('Ingresa el passcode del owner.');
      return;
    }
    if (!storeInfo.storeName.trim()) {
      toast.error('Configura el nombre de la tienda antes de sincronizar (Información de la tienda).');
      return;
    }
    const addresses: Record<string, string> = {};
    Object.entries(paymentSettings.cryptoAddresses).forEach(([key, value]) => {
      if (value && value.trim()) addresses[key] = value.trim();
    });
    if (Object.keys(addresses).length === 0) {
      toast.error('No hay direcciones configuradas para sincronizar.');
      return;
    }
    setCryptoSyncLoading(true);

    // El passcode del owner sirve para dos cosas en la misma llamada: iniciar
    // sesión de tienda (JWT, exigido por SHOP_AUTH_ENFORCE=enforce) y cifrar
    // cryptoAddresses en el servidor.
    const session = await ensureShopSession(storeInfo.storeName.trim(), cryptoSyncPasscode.trim());
    if (!session.success) {
      setCryptoSyncLoading(false);
      toast.error(session.error || 'No se pudo iniciar sesión con la tienda');
      return;
    }

    let res = await syncShopCryptoAddresses(shopId, addresses, Object.keys(addresses), cryptoSyncPasscode.trim());
    if (!res.success && res.needsSession) {
      clearShopSessionToken();
      const retrySession = await shopAuthLogin(storeInfo.storeName.trim(), cryptoSyncPasscode.trim());
      if (retrySession.success) {
        res = await syncShopCryptoAddresses(shopId, addresses, Object.keys(addresses), cryptoSyncPasscode.trim());
      } else {
        res = { success: false, error: retrySession.error };
      }
    }
    setCryptoSyncLoading(false);
    if (res.success) {
      toast.success('Direcciones sincronizadas con la tienda');
      setShowCryptoSyncModal(false);
      setCryptoSyncPasscode('');
    } else {
      toast.error(res.error || 'No se pudo sincronizar — verifica el passcode del owner');
    }
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

  const handleClearAllData = async () => {
    if (
      !window.confirm(
        '¿Estás seguro de eliminar todos los datos?\n\n' +
          'Se borrará localStorage y el espejo SQLite. Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }
    try {
      toast.loading('Eliminando datos…', { id: 'wipe-pos' });
      await wipeAllPosLocalData();
      clearShopSessionToken();
      clearStoreIdentifiers();
      toast.success('Todos los datos han sido eliminados', { id: 'wipe-pos' });
      window.location.reload();
    } catch (error) {
      console.error('Error wiping POS data:', error);
      toast.error('No se pudieron eliminar todos los datos', { id: 'wipe-pos' });
    }
  };

  /** Vuelve a la pantalla inicial para pegar de nuevo la URL de sync (shopId/MCP). */
  const handleResetPosSetup = async () => {
    const ok = window.confirm(
      '¿Restablecer el POS a la configuración inicial?\n\n' +
        'Se borrará la URL de sincronización, el shopId y el estado del asistente. ' +
        'Después deberás volver a pegar la URL de sync.'
    );
    if (!ok) return;

    try {
      // App marca setup completo si existe bizneai-setup-complete O bizneai-store-config.
      // También hay que limpiar server-config / identifiers o la URL vieja sigue cargada.
      const keysToClear = [
        'bizneai-setup-complete',
        'bizneai-server-config',
        'bizneai-store-identifiers',
        'bizneai-store-config',
      ] as const;

      for (const key of keysToClear) {
        localStorage.removeItem(key);
        await deleteKvFromServer(key);
      }

      clearShopSessionToken();
      clearStoreIdentifiers();

      toast.success('POS restablecido. Configura de nuevo la URL de sync.');
      window.location.reload();
    } catch (error) {
      console.error('Error resetting POS setup:', error);
      toast.error('No se pudo restablecer el POS');
    }
  };

  const handleContactDeveloper = () => {
    setShowContactDeveloperModal(true);
  };

  const handleOpenWhatsApp = () => {
    window.open(getWhatsAppUrl('Hola, necesito ayuda con BizneAI POS'), '_blank');
    setShowContactDeveloperModal(false);
  };

  const handleSaveConfigPasswords = () => {
    const hasAccessChange = newAccessPassword.trim().length > 0;
    const hasModifyChange =
      newModifyPassword.trim().length > 0 || confirmModifyPassword.trim().length > 0;

    if (!hasAccessChange && !hasModifyChange) {
      toast.error('Indica al menos una contraseña nueva o cambia acceso/administrador');
      return;
    }

    if (hasModifyChange) {
      if (newModifyPassword !== confirmModifyPassword) {
        toast.error('Las contraseñas de administrador nuevas no coinciden');
        return;
      }
      if (!newModifyPassword.trim()) {
        toast.error('Completa la nueva contraseña de administrador');
        return;
      }
    }

    if (settingsLocked) {
      const cur = currentAdminForPasswordChange.trim();
      if (!cur) {
        toast.error('Escribe la contraseña de administrador actual (campo inferior) para autorizar el cambio');
        return;
      }
      if (!validateConfigModifyPassword(cur, currentAdminUsernameForPasswordChange)) {
        toast.error('Contraseña de administrador actual incorrecta');
        return;
      }
    }

    if (hasAccessChange) {
      setConfigAccessPassword(newAccessPassword.trim());
    }
    if (hasModifyChange) {
      setConfigModifyPassword(newModifyPassword.trim());
    }

    if (settingsLocked) {
      if (hasModifyChange) {
        unlockConfigurationModifyWithPassword(newModifyPassword.trim());
      } else {
        unlockConfigurationModifyWithPassword(
          currentAdminForPasswordChange.trim(),
          currentAdminUsernameForPasswordChange
        );
      }
      setModifyUnlocked(true);
      setCurrentAdminForPasswordChange('');
      setCurrentAdminUsernameForPasswordChange('');
      toast.success('Contraseñas actualizadas. Edición desbloqueada para el resto de la sesión.');
    } else {
      if (hasModifyChange) {
        unlockConfigurationModifyWithPassword(newModifyPassword.trim());
      }
      toast.success('Contraseñas actualizadas');
    }

    setNewAccessPassword('');
    setNewModifyPassword('');
    setConfirmModifyPassword('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const renderSection = (
    id: string,
    title: string,
    icon: React.ReactNode,
    content: React.ReactNode,
    options?: { alwaysInteractive?: boolean }
  ) => {
    const isExpanded = expandedSections.has(id);
    const contentInert =
      options?.alwaysInteractive ? undefined : settingsLocked ? true : undefined;
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
          <div inert={contentInert} className="settings-section-content">
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
        {BUILD_TIMESTAMP > 0 && (
          <p style={{ fontSize: '0.75rem', color: 'var(--bs-dark-text-muted)', marginTop: '0.25rem' }}>
            Build {getVersionDisplay()}
          </p>
        )}
      </div>

      {isElectron() && (
        <div style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => window.electronAPI?.openDbConsole?.()}
          >
            <Terminal size={18} />
            Abrir consola BD (ventana aparte)
          </button>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--bs-dark-text-muted)' }}>
            SQLite en solo lectura. La ventana se puede minimizar desde la barra de título.
          </p>
        </div>
      )}

      {!isSetupMode && !modifyUnlocked && (
        <div
          className="settings-unlock-banner"
          style={{
            marginBottom: '1rem',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--bs-radius)',
            border: '1px solid var(--bs-dark-border)',
            background: 'var(--bs-dark-surface)',
          }}
        >
          <p style={{ margin: '0 0 0.75rem', color: 'var(--bs-dark-text)' }}>
            <strong>Modo solo lectura</strong> para la mayoría de opciones (tienda, impuestos, etc.). Siguen editables:{' '}
            <strong>Contraseñas de configuración</strong>, <strong>Roles y bloqueo de pantalla</strong> (PIN). Para el
            resto, pulsa <strong>Desbloquear edición</strong> o indica la contraseña de administrador en Contraseñas.
            Respaldo: usuario <strong>admin</strong> y contraseña <strong>admin</strong>.
          </p>
          <button type="button" className="btn-primary" onClick={() => setShowModifyUnlockModal(true)}>
            <Unlock size={18} />
            Desbloquear edición
          </button>
        </div>
      )}
      {!isSetupMode && modifyUnlocked && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--bs-radius)',
            border: '1px solid rgba(40, 167, 69, 0.35)',
            background: 'rgba(40, 167, 69, 0.08)',
            fontSize: '0.9rem',
            color: 'var(--bs-dark-text)',
          }}
        >
          Edición desbloqueada en esta sesión. Se volverá a pedir la contraseña de administrador al bloquear la
          pantalla o cerrar la sesión.
        </div>
      )}

      {/* Server Sync Status */}
      <div inert={settingsLocked ? true : undefined}>
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
          <button onClick={handleSyncRoles} disabled={isLoading || !serverConfig.shopId} className="btn-secondary" title="Sincronizar roles y usuarios de la tienda">
            <User size={16} />
            Sincronizar Roles
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
            {getMcpMethodsEndpointCount(serverConfig.mcpMethods) > 0 && (
              <div className="info-row">
                <span className="info-label">Endpoints MCP documentados:</span>
                <span className="info-value">{getMcpMethodsEndpointCount(serverConfig.mcpMethods)}</span>
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
            <div className="info-row" style={{ marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span className="info-label">Último backup completo:</span>
              <span className="info-value" key={fullBackupUiTick}>
                {getLastFullBackupTime()?.toLocaleString() ?? '—'}
              </span>
            </div>
            <div className="info-row" style={{ alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="info-label">Intervalo automático (12–24 h):</span>
              <input
                type="number"
                min={12}
                max={24}
                step={1}
                value={fullBackupIntervalH}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (Number.isFinite(v)) {
                    setFullBackupIntervalHours(v);
                    setFullBackupIntervalH(getFullBackupIntervalHours());
                  }
                }}
                className="url-input"
                style={{ width: '4rem', padding: '0.35rem' }}
                disabled={isLoading}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--bs-dark-text-muted)' }}>
                El POS descarga ventas, pedidos, productos, inventario y un snapshot de clientes locales.
              </span>
            </div>
            <button
              type="button"
              onClick={handleFullBackupNow}
              disabled={isLoading || !serverConfig.mcpUrl}
              className="btn-secondary"
              style={{ marginTop: '0.5rem' }}
            >
              <Download size={16} />
              Sincronización completa ahora (backup en línea)
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
          {(storeInfo.storeType === 'restaurant' || storeInfo.storeType === 'coffee-shop' || storeInfo.storeType === 'CoffeeShop' || storeInfo.storeType === 'Restaurant') && (
            <div className="form-row">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={kitchenEnabled}
                    onChange={(e) => setKitchenEnabled(e.target.checked)}
                  />
                  <span>Habilitar módulo de cocina</span>
                </label>
                <small style={{ color: 'var(--bs-dark-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                  Muestra la sección Cocina en el sistema para gestionar órdenes de cocina
                </small>
              </div>
            </div>
          )}
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
                onChange={(e) => {
                  const lang = e.target.value as 'es' | 'en';
                  setBusinessSettings(prev => ({ ...prev, language: lang }));
                  localStorage.setItem('bizneai-language', lang);
                  scheduleMirrorKeyToSqlite('bizneai-language');
                  i18n.changeLanguage(lang);
                }}
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
                onChange={(e) => {
                  const checked = e.target.checked;
                  setPaymentSettings(prev => ({ ...prev, ecommerceEnabled: checked }));
                  void storeAPI.updateConfig({ ecommerceEnabled: checked });
                }}
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
                onChange={(e) => {
                  const checked = e.target.checked;
                  setPaymentSettings(prev => ({ ...prev, cryptoEnabled: checked }));
                  void storeAPI.updateConfig({ crypto: checked }).then((res) => {
                    if (!res.success) toast.error('No se pudo guardar la preferencia de pagos con cripto');
                  });
                }}
              />
              <span>Habilitar pagos con criptomonedas</span>
            </label>
          </div>
          {paymentSettings.cryptoEnabled && (
            <div className="crypto-settings">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <h4 style={{ margin: 0 }}>Direcciones de Criptomonedas</h4>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCryptoSyncModal(true)}
                  disabled={Object.values(paymentSettings.cryptoAddresses).every((v) => !v)}
                >
                  <RefreshCw size={16} />
                  Sincronizar con la tienda
                </button>
              </div>

              {/* USDLXE (LUXAE) — dirección Polygon, generada localmente o pegada a mano */}
              <div className="crypto-address-group">
                <div className="crypto-header">
                  <Diamond size={20} color="#8B5CF6" />
                  <span>USDLXE</span>
                  <span className={`crypto-status ${paymentSettings.cryptoAddresses.luxae ? 'configured' : 'not-configured'}`}>
                    {paymentSettings.cryptoAddresses.luxae ? 'Configurado' : 'No configurado'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', opacity: 0.75, margin: '0.25rem 0 0.5rem' }}>
                  Dirección Polygon (0x…, misma familia que MetaMask) para recibir USDLXE de ventas con
                  el programa de cashback CryptoMkt.
                </p>
                <div className="crypto-input-group">
                  <input
                    type="text"
                    value={paymentSettings.cryptoAddresses.luxae || ''}
                    onChange={(e) => {
                      const newAddresses = { ...paymentSettings.cryptoAddresses, luxae: e.target.value };
                      setPaymentSettings(prev => ({ ...prev, cryptoAddresses: newAddresses }));
                    }}
                    placeholder="0x... (pegar dirección existente)"
                  />
                  <button
                    onClick={() => handleSaveCryptoAddress('luxae', paymentSettings.cryptoAddresses.luxae || '')}
                    className="btn-secondary"
                    disabled={!paymentSettings.cryptoAddresses.luxae}
                  >
                    <Save size={16} />
                    Guardar
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => void handleGeneratePolygonWallet(!!paymentSettings.cryptoAddresses.luxae)}
                    className="btn-secondary"
                    disabled={polygonWalletLoading}
                  >
                    <Zap size={16} />
                    {polygonWalletLoading
                      ? 'Generando...'
                      : paymentSettings.cryptoAddresses.luxae
                        ? 'Generar wallet nueva'
                        : 'Generar dirección Polygon'}
                  </button>
                  {paymentSettings.cryptoAddresses.luxae && (
                    <button onClick={() => void handleRevealPolygonMnemonic()} className="btn-secondary" disabled={polygonWalletLoading}>
                      <Eye size={16} />
                      Ver frase de nuevo
                    </button>
                  )}
                </div>
              </div>

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

          {generatedWalletModal && (
            <div className="modal-overlay" onClick={() => { setGeneratedWalletModal(null); setMnemonicRevealed(false); }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>
                    <Diamond size={20} color="#8B5CF6" style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />
                    Respalda tu wallet Polygon
                  </h3>
                  <button className="close-btn" onClick={() => { setGeneratedWalletModal(null); setMnemonicRevealed(false); }}>
                    <X size={20} />
                  </button>
                </div>
                <div className="modal-body">
                  <p style={{ color: '#dc2626', fontWeight: 600, marginBottom: '1rem' }}>
                    Guarda esta frase en un lugar seguro fuera de esta computadora. Cualquiera que la tenga
                    puede mover los fondos de esta dirección. BizneAI no puede recuperarla por ti.
                  </p>
                  <div className="form-group">
                    <label>Dirección de recepción</label>
                    <input type="text" readOnly value={generatedWalletModal.address} />
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ marginTop: '0.5rem' }}
                      onClick={() => {
                        navigator.clipboard.writeText(generatedWalletModal.address);
                        toast.success('Dirección copiada');
                      }}
                    >
                      <Copy size={16} />
                      Copiar dirección
                    </button>
                  </div>
                  <div className="form-group">
                    <label>Frase mnemónica (12 palabras)</label>
                    {mnemonicRevealed ? (
                      <textarea
                        readOnly
                        value={generatedWalletModal.mnemonic}
                        rows={3}
                        style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.9rem' }}
                      />
                    ) : (
                      <button type="button" className="btn-secondary" onClick={() => setMnemonicRevealed(true)}>
                        <Eye size={16} />
                        Mostrar frase
                      </button>
                    )}
                    {mnemonicRevealed && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ marginTop: '0.5rem' }}
                        onClick={() => {
                          navigator.clipboard.writeText(generatedWalletModal.mnemonic);
                          toast.success('Frase copiada — guárdala y borra el portapapeles después');
                        }}
                      >
                        <Copy size={16} />
                        Copiar frase
                      </button>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn-primary"
                    onClick={() => { setGeneratedWalletModal(null); setMnemonicRevealed(false); }}
                  >
                    Ya respaldé mi frase
                  </button>
                </div>
              </div>
            </div>
          )}

          {showCryptoSyncModal && (
            <div
              className="modal-overlay"
              onClick={() => { setShowCryptoSyncModal(false); setCryptoSyncPasscode(''); }}
            >
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Sincronizar con la tienda</h3>
                  <button
                    className="close-btn"
                    onClick={() => { setShowCryptoSyncModal(false); setCryptoSyncPasscode(''); }}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="modal-body">
                  <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '1rem' }}>
                    Envía las direcciones configuradas arriba a sites/bizneaiWeb, cifradas con una
                    llave derivada del passcode del owner. El passcode no se guarda — se pide en
                    cada sincronización.
                  </p>
                  <div className="form-group">
                    <label>Passcode del owner</label>
                    <input
                      type="password"
                      value={cryptoSyncPasscode}
                      onChange={(e) => setCryptoSyncPasscode(e.target.value)}
                      placeholder="****"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleSyncCryptoToShop();
                      }}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn-secondary"
                    onClick={() => { setShowCryptoSyncModal(false); setCryptoSyncPasscode(''); }}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => void handleSyncCryptoToShop()}
                    disabled={cryptoSyncLoading || !cryptoSyncPasscode.trim()}
                  >
                    {cryptoSyncLoading ? 'Sincronizando...' : 'Sincronizar'}
                  </button>
                </div>
              </div>
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
                onChange={(e) => {
                  const taxRate = parseFloat(e.target.value) || 0;
                  setTaxSettings((prev) => {
                    const next = { ...prev, taxRate };
                    syncTaxToBackend(next);
                    return next;
                  });
                }}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label>Método de Cálculo</label>
              <select
                value={taxSettings.taxCalculationMethod}
                onChange={(e) => {
                  const taxCalculationMethod = e.target.value as 'exclusive' | 'inclusive';
                  setTaxSettings((prev) => {
                    const next = {
                      ...prev,
                      taxCalculationMethod,
                      taxInclusive: taxCalculationMethod === 'inclusive',
                    };
                    syncTaxToBackend(next);
                    return next;
                  });
                }}
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
                onChange={(e) => {
                  const taxInclusive = e.target.checked;
                  setTaxSettings((prev) => {
                    const taxCalculationMethod: TaxSettings['taxCalculationMethod'] = taxInclusive
                      ? 'inclusive'
                      : 'exclusive';
                    const next = { ...prev, taxInclusive, taxCalculationMethod };
                    syncTaxToBackend(next);
                    return next;
                  });
                }}
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
            <label>Gemini API Key</label>
            <div className="api-key-input-group">
              <input
                type={showPasscode ? 'text' : 'password'}
                value={aiSettings.geminiApiKey}
                onChange={(e) => setAiSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                placeholder="AIza..."
              />
              <button onClick={() => setShowPasscode(!showPasscode)} className="icon-btn">
                {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              onClick={() => {
                if (aiSettings.geminiApiKey) {
                  localStorage.setItem('bizneai-gemini-key', aiSettings.geminiApiKey);
                  setAiSettings(prev => ({ ...prev, aiEnabled: true }));
                  toast.success('API Key de Gemini guardada. Asistente de IA habilitado');
                }
              }}
              className="btn-secondary"
              disabled={!aiSettings.geminiApiKey}
            >
              <Save size={16} />
              Guardar API Key
            </button>
            <p style={{ color: 'var(--bs-dark-text-muted)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
              El asistente de IA de la app de escritorio usa Google Gemini. Obtén tu API key en{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a>.
            </p>
          </div>
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
      {renderSection('receipt-printer', 'Impresora de Tickets', <Printer size={20} />,
        <div className="settings-form">
          {!isElectron() ? (
            <>
              <p style={{ color: 'var(--bs-dark-text-muted)', fontSize: '0.875rem' }}>
                La impresión <strong>térmica directa</strong> (PosPrinter) está disponible solo en la app de escritorio.
                Puedes probar el aspecto del ticket y usar <strong>PDF</strong> o cualquier impresora desde el botón de
                abajo.
              </p>
              <div className="form-group">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={async () => {
                    const r = await openReceiptPrintPreviewDialog();
                    if (r.success) {
                      toast.success('Vista previa: elige impresora o Guardar como PDF');
                    } else {
                      toast.error(r.error || 'No se pudo abrir');
                    }
                  }}
                >
                  <Printer size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Cuadro de impresión (PDF / elegir impresora)
                </button>
                <small className="form-hint" style={{ display: 'block', marginTop: '0.5rem' }}>
                  Abre un ticket de prueba y el diálogo de impresión del navegador.
                </small>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={receiptPrintConfig.enabled}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setReceiptPrintConfig({ enabled: v });
                      setReceiptPrintConfigState((prev) => ({ ...prev, enabled: v }));
                      toast.success(v ? 'Impresión automática activada' : 'Impresión automática desactivada');
                    }}
                  />
                  Impresión automática al completar venta
                </label>
                <small className="form-hint">Imprime el ticket en la impresora térmica cada vez que se complete una venta.</small>
              </div>
              <div className="form-group">
                <label className="form-label">Ancho del papel</label>
                <select
                  className="form-control"
                  value={receiptPrintConfig.pageSize}
                  onChange={(e) => {
                    const v = e.target.value as ReceiptPageSize;
                    setReceiptPrintConfig({ pageSize: v });
                    setReceiptPrintConfigState((prev) => ({ ...prev, pageSize: v }));
                    toast.success(`Papel configurado: ${v}`);
                  }}
                >
                  <option value="57mm">57 mm</option>
                  <option value="58mm">58 mm</option>
                  <option value="80mm">80 mm</option>
                </select>
                <small className="form-hint">Selecciona el ancho de tu impresora térmica.</small>
              </div>
              <div className="form-group">
                <label className="form-label">Nombre en ticket (opcional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="BizneAI POS"
                  value={receiptPrintConfig.storeName ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setReceiptPrintConfigState((prev) => ({ ...prev, storeName: v || undefined }));
                  }}
                  onBlur={(e) => {
                    setReceiptPrintConfig({ storeName: e.target.value.trim() || undefined });
                  }}
                />
                <small className="form-hint">Texto que aparece en el encabezado del ticket.</small>
              </div>
              <div className="form-group">
                <label className="form-label">Logo en el ticket (PNG, JPG, WebP)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={async () => {
                      const api = window.electronAPI;
                      if (!api?.pickTicketLogo) {
                        toast.error('No disponible');
                        return;
                      }
                      const r = await api.pickTicketLogo();
                      if (r?.error) {
                        toast.error(r.error);
                        return;
                      }
                      if (r?.path) {
                        setReceiptPrintConfig({ ticketLogoPath: r.path });
                        setReceiptPrintConfigState((prev) => ({ ...prev, ticketLogoPath: r.path }));
                        toast.success('Logo guardado; se verá en el ticket y en la vista previa');
                      }
                    }}
                  >
                    Elegir imagen…
                  </button>
                  {receiptPrintConfig.ticketLogoPath ? (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={async () => {
                        await window.electronAPI?.removeTicketLogo?.();
                        setReceiptPrintConfig({ ticketLogoPath: undefined });
                        setReceiptPrintConfigState((prev) => ({ ...prev, ticketLogoPath: undefined }));
                        toast.success('Logo quitado');
                      }}
                    >
                      Quitar logo
                    </button>
                  ) : null}
                </div>
                <small className="form-hint">
                  Aparece encima del nombre del negocio. PNG con fondo transparente funciona bien; el ticket térmico lo
                  escala al ancho del papel (80 mm recomendado para logos anchos).
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">Impresora térmica en el sistema (opcional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre exacto como en Ajustes del sistema → Impresoras"
                  value={receiptPrintConfig.printerName ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setReceiptPrintConfigState((prev) => ({ ...prev, printerName: v || undefined }));
                  }}
                  onBlur={(e) => {
                    const t = e.target.value.trim();
                    setReceiptPrintConfig({ printerName: t || undefined });
                  }}
                />
                <small className="form-hint">
                  Si lo dejas vacío, PosPrinter usa la <strong>impresora predeterminada</strong>. Si la térmica no es la
                  predeterminada, escribe aquí el nombre exacto (evita timeouts si apuntaba a otra impresora).
                </small>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={receiptPrintConfig.generic80mmFallback === true}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setReceiptPrintConfig({ generic80mmFallback: v });
                      setReceiptPrintConfigState((prev) => ({ ...prev, generic80mmFallback: v }));
                      toast.success(
                        v
                          ? 'Modo genérico 80 mm: se buscará Generic/Text Only o PDF si no hay driver térmico'
                          : 'Modo genérico desactivado'
                      );
                    }}
                  />
                  Sin driver del fabricante: impresora genérica 80 mm
                </label>
                <small className="form-hint" style={{ display: 'block', marginTop: '0.35rem' }}>
                  Actívalo si aún no instalaste el driver USB/Ethernet de la térmica. En Windows puedes añadir manualmente
                  una cola <strong>Generic / Text Only</strong> (o «Genérico / Solo texto») con papel 80 mm; si no existe,
                  la app intentará <strong>Microsoft Print to PDF</strong> o la impresora predeterminada. El ticket sigue
                  formateado al ancho elegido arriba (p. ej. 80 mm).
                </small>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={receiptPrintConfig.showTicketCopyType !== false}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setReceiptPrintConfig({ showTicketCopyType: v });
                      setReceiptPrintConfigState((prev) => ({ ...prev, showTicketCopyType: v }));
                      toast.success(v ? 'Leyenda Original/Copia activada' : 'Leyenda Original/Copia desactivada');
                    }}
                  />
                  Leyenda <strong>Original</strong> / <strong>Copia</strong> en tickets de venta (recomendado en 80&nbsp;mm)
                </label>
                <small className="form-hint">
                  La primera impresión térmica de cada venta muestra el texto de &quot;original&quot;; las reimpresiones
                  del mismo ticket muestran &quot;copia&quot;. Las listas de productos no usan esta leyenda.
                </small>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Texto primera impresión</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ORIGINAL"
                    value={receiptPrintConfig.labelOriginal ?? 'ORIGINAL'}
                    onChange={(e) => {
                      const v = e.target.value;
                      setReceiptPrintConfigState((prev) => ({ ...prev, labelOriginal: v }));
                    }}
                    onBlur={(e) => {
                      setReceiptPrintConfig({ labelOriginal: e.target.value.trim() || 'ORIGINAL' });
                    }}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Texto reimpresiones</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="COPIA"
                    value={receiptPrintConfig.labelCopia ?? 'COPIA'}
                    onChange={(e) => {
                      const v = e.target.value;
                      setReceiptPrintConfigState((prev) => ({ ...prev, labelCopia: v }));
                    }}
                    onBlur={(e) => {
                      setReceiptPrintConfig({ labelCopia: e.target.value.trim() || 'COPIA' });
                    }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Probar impresión</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={async () => {
                      const r = await openReceiptPrintPreviewDialog();
                      if (r.success) {
                        toast.success('Se abrió la vista previa y el cuadro de impresión (PDF o impresora)');
                      } else {
                        toast.error(r.error || 'No se pudo abrir la vista previa');
                      }
                    }}
                  >
                    <Printer size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                    Cuadro de impresión (PDF / elegir impresora)
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={async () => {
                      toast.loading('Enviando a impresora térmica…', { id: 'thermal-test' });
                      const r = await printReceiptTestThermal();
                      toast.dismiss('thermal-test');
                      if (r.success) {
                        toast.success(
                          'Listo: revisa la térmica o la ventana del cuadro de impresión (PDF / otra impresora)'
                        );
                      } else {
                        toast.error(r.error || 'Error al imprimir');
                      }
                    }}
                  >
                    <Printer size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                    Prueba en impresora de tickets
                  </button>
                </div>
                <small className="form-hint">
                  El primer botón abre el diálogo del sistema: puedes guardar como <strong>PDF</strong> o elegir
                  cualquier impresora (incluida la térmica si aparece en el listado). El segundo envía un ticket de
                  prueba por el flujo térmico (PosPrinter) con el ancho y nombre de impresora configurados arriba.
                </small>
              </div>
            </>
          )}
        </div>
      )}

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

      {renderSection(
        'config-passwords',
        'Contraseñas de configuración',
        <Key size={20} />,
        <div className="settings-form">
          <p className="form-hint" style={{ marginBottom: '1rem', color: 'var(--bs-dark-text-muted)' }}>
            <strong>Acceso:</strong> contraseña para abrir Configuración desde el POS.{' '}
            <strong>Administrador:</strong> contraseña para editar el resto de ajustes. Si solo lectura está activo,
            indica la <strong>contraseña de administrador actual</strong> abajo para poder guardar cambios aquí sin
            pulsar «Desbloquear edición». Respaldo: usuario <strong>admin</strong> + contraseña <strong>admin</strong>{' '}
            en el campo de usuario y contraseña correspondientes. Usa el icono del ojo para ver lo que escribes; las
            contraseñas ya guardadas no se muestran solas por seguridad (puedes consultarlas abajo solo con edición
            desbloqueada o en el asistente inicial).
          </p>
          {(isSetupMode || modifyUnlocked) && (
            <div
              className="form-group"
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: 8,
                border: '1px solid var(--bs-border-color, #dee2e6)',
                background: 'var(--bs-dark-bg-subtle, rgba(0,0,0,0.04))',
              }}
            >
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Contraseñas vigentes en este equipo (solo referencia)
              </label>
              <p className="form-hint" style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                Úsalo para recordar qué debes escribir al cambiar contraseñas. No compartas esta pantalla.
              </p>
              <button
                type="button"
                className="btn-secondary"
                style={{ marginBottom: showStoredPasswordsReference ? '0.75rem' : 0 }}
                onClick={() => setShowStoredPasswordsReference((v) => !v)}
              >
                {showStoredPasswordsReference ? <EyeOff size={16} /> : <Eye size={16} />}
                {showStoredPasswordsReference ? 'Ocultar' : 'Mostrar'} contraseñas guardadas
              </button>
              {showStoredPasswordsReference && (
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Acceso:</strong>{' '}
                    <span>{getConfigAccessPassword()}</span>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Administrador:</strong>{' '}
                    <span>{getConfigModifyPassword()}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="form-group">
            <label>Nueva contraseña de acceso (dejar vacío para no cambiar)</label>
            <div className="api-key-input-group">
              <input
                type={showPwAccessInput ? 'text' : 'password'}
                autoComplete="new-password"
                value={newAccessPassword}
                onChange={(e) => setNewAccessPassword(e.target.value)}
                placeholder="Nueva contraseña de acceso"
              />
              <button
                type="button"
                onClick={() => setShowPwAccessInput(!showPwAccessInput)}
                className="icon-btn"
                aria-label={showPwAccessInput ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPwAccessInput ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Nueva contraseña de administrador</label>
            <div className="api-key-input-group">
              <input
                type={showPwModifyNew ? 'text' : 'password'}
                autoComplete="new-password"
                value={newModifyPassword}
                onChange={(e) => setNewModifyPassword(e.target.value)}
                placeholder="Nueva contraseña de administrador"
              />
              <button
                type="button"
                onClick={() => setShowPwModifyNew(!showPwModifyNew)}
                className="icon-btn"
                aria-label={showPwModifyNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPwModifyNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Confirmar contraseña de administrador</label>
            <div className="api-key-input-group">
              <input
                type={showPwModifyConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmModifyPassword}
                onChange={(e) => setConfirmModifyPassword(e.target.value)}
                placeholder="Repetir contraseña de administrador"
              />
              <button
                type="button"
                onClick={() => setShowPwModifyConfirm(!showPwModifyConfirm)}
                className="icon-btn"
                aria-label={showPwModifyConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPwModifyConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {!isSetupMode && settingsLocked && (
            <div className="form-group">
              <label>Usuario (opcional, para respaldo admin / admin)</label>
              <input
                type="text"
                autoComplete="username"
                value={currentAdminUsernameForPasswordChange}
                onChange={(e) => setCurrentAdminUsernameForPasswordChange(e.target.value)}
                placeholder="admin"
                className="url-input"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  background: 'var(--bs-dark-surface)',
                  border: '1px solid var(--bs-dark-border)',
                  borderRadius: 'var(--bs-radius)',
                  color: 'var(--bs-dark-text)',
                }}
              />
            </div>
          )}
          {!isSetupMode && settingsLocked && (
            <div className="form-group">
              <label>Contraseña de administrador actual (obligatoria para guardar en modo solo lectura)</label>
              <div className="api-key-input-group">
                <input
                  type={showPwCurrentAdmin ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={currentAdminForPasswordChange}
                  onChange={(e) => setCurrentAdminForPasswordChange(e.target.value)}
                  placeholder="Contraseña de administrador vigente"
                />
                <button
                  type="button"
                  onClick={() => setShowPwCurrentAdmin(!showPwCurrentAdmin)}
                  className="icon-btn"
                  aria-label={showPwCurrentAdmin ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPwCurrentAdmin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}
          <button type="button" className="btn-primary" onClick={handleSaveConfigPasswords}>
            <Key size={18} />
            Guardar contraseñas
          </button>
        </div>,
        { alwaysInteractive: true }
      )}

      {renderSection(
        'roles-screen-lock',
        'Roles y bloqueo de pantalla',
        <Users size={20} />,
        <RolesScreenLockPanel />,
        { alwaysInteractive: true }
      )}

      {renderSection(
        'kiosk-mode',
        'Modo kiosko (autoservicio)',
        <Lock size={20} />,
        <div className="settings-form">
          <p className="settings-hint">
            Activa la pantalla completa de autoservicio para terminal táctil. Una vez activo,{' '}
            <strong>no se puede salir sin el passcode de acceso a Configuración</strong>. Para
            salir, usa el botón de candado que aparece en el POS e ingresa el passcode.
          </p>
          {isKioskModeActive() ? (
            <div className="kiosk-status-active">
              <Lock size={16} /> Modo kiosko ACTIVO
            </div>
          ) : (
            <button
              className="btn-primary kiosk-activate-btn"
              onClick={() => enterKioskMode()}
            >
              <Lock size={18} /> Activar modo kiosko autoservicio
            </button>
          )}
        </div>,
        { alwaysInteractive: true }
      )}

      {renderSection(
        'utilities',
        'Utilidades',
        <Database size={20} />,
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
            <button onClick={() => void handleResetPosSetup()} className="btn-secondary" title="Vuelve a la pantalla inicial para configurar la URL de sync">
              <RotateCcw size={16} />
              Restablecer POS
            </button>
            <button onClick={() => void handleClearAllData()} className="btn-danger">
              <Trash2 size={16} />
              Eliminar Todos los Datos
            </button>
            <button onClick={handleContactDeveloper} className="btn-secondary">
              <Phone size={16} />
              Contactar Desarrollador
            </button>
          </div>
          <p className="settings-hint" style={{ marginTop: '0.75rem' }}>
            <strong>Restablecer POS</strong> borra la sincronización (URL/shopId) y vuelve al asistente
            inicial. No borra catálogo ni ventas locales; usa «Eliminar Todos los Datos» para un borrado total.
          </p>
        </div>,
        { alwaysInteractive: true }
      )}

      {/* Actions - Sticky Footer */}
      <div inert={settingsLocked ? true : undefined}>
        <div className="settings-actions">
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={isLoading}
            style={{
              minWidth: '200px',
              fontSize: '1rem',
              padding: '0.875rem 2rem',
              fontWeight: 600,
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

      {showModifyUnlockModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowModifyUnlockModal(false);
            setModifyUnlockPassword('');
            setModifyUnlockUsername('');
            setModifyUnlockError(false);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Desbloquear edición</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => {
                  setShowModifyUnlockModal(false);
                  setModifyUnlockPassword('');
                  setModifyUnlockUsername('');
                  setModifyUnlockError(false);
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '0.75rem' }}>
                Introduce la contraseña de administrador guardada en este equipo, o usuario <strong>admin</strong> con
                contraseña <strong>admin</strong> como respaldo.
              </p>
              <label
                htmlFor="modify-unlock-user"
                style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.875rem', fontWeight: 500 }}
              >
                Usuario (opcional)
              </label>
              <input
                id="modify-unlock-user"
                type="text"
                autoComplete="username"
                value={modifyUnlockUsername}
                onChange={(e) => {
                  setModifyUnlockError(false);
                  setModifyUnlockUsername(e.target.value);
                }}
                className="url-input"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  marginBottom: '0.75rem',
                  background: 'var(--bs-dark-surface)',
                  border: '1px solid var(--bs-dark-border)',
                  borderRadius: 'var(--bs-radius)',
                  color: 'var(--bs-dark-text)',
                }}
                placeholder="admin si usas el respaldo"
              />
              <label
                htmlFor="modify-unlock-pass"
                style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.875rem', fontWeight: 500 }}
              >
                Contraseña de administrador
              </label>
              <input
                id="modify-unlock-pass"
                type="password"
                autoComplete="current-password"
                value={modifyUnlockPassword}
                onChange={(e) => {
                  setModifyUnlockError(false);
                  setModifyUnlockPassword(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setModifyUnlockError(false);
                    if (unlockConfigurationModifyWithPassword(modifyUnlockPassword, modifyUnlockUsername)) {
                      setModifyUnlocked(true);
                      setShowModifyUnlockModal(false);
                      setModifyUnlockPassword('');
                      setModifyUnlockUsername('');
                      toast.success('Edición desbloqueada');
                    } else {
                      setModifyUnlockError(true);
                    }
                  }
                }}
                className="url-input"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  background: 'var(--bs-dark-surface)',
                  border: '1px solid var(--bs-dark-border)',
                  borderRadius: 'var(--bs-radius)',
                  color: 'var(--bs-dark-text)',
                }}
                placeholder="Contraseña de administrador"
              />
              {modifyUnlockError && (
                <p style={{ color: 'var(--bs-danger, #dc3545)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  Credenciales incorrectas
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowModifyUnlockModal(false);
                  setModifyUnlockPassword('');
                  setModifyUnlockUsername('');
                  setModifyUnlockError(false);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setModifyUnlockError(false);
                  if (unlockConfigurationModifyWithPassword(modifyUnlockPassword, modifyUnlockUsername)) {
                    setModifyUnlocked(true);
                    setShowModifyUnlockModal(false);
                    setModifyUnlockPassword('');
                    setModifyUnlockUsername('');
                    toast.success('Edición desbloqueada');
                  } else {
                    setModifyUnlockError(true);
                  }
                }}
              >
                <Unlock size={18} />
                Desbloquear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Contactar Desarrollador */}
      {showContactDeveloperModal && (
        <div className="modal-overlay" onClick={() => setShowContactDeveloperModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Contactar Desarrollador</h3>
              <button className="close-btn" onClick={() => setShowContactDeveloperModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>¿Deseas abrir WhatsApp para contactar al desarrollador de BizneAI POS?</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--bs-dark-text-muted)' }}>
                Te redirigiremos a una conversación con un mensaje predefinido. Puedes editarlo antes de enviar.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowContactDeveloperModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleOpenWhatsApp}>
                <MessageCircle size={18} />
                Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
