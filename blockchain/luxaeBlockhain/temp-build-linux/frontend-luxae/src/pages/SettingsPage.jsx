import { useState, useEffect } from 'react';
import { useBlockchain } from '../hooks/useBlockchain';
import { 
  CogIcon, 
  ShieldCheckIcon,
  GlobeAltIcon,
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const SettingsPage = () => {
  const {
    blockchainInfo,
    networkStatus,
    loading,
    error,
    fetchBlockchainInfo,
    fetchNetworkStatus,
  } = useBlockchain();

  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: 30,
    notifications: true,
    theme: 'light',
    language: 'es',
    apiEndpoint: 'http://localhost:3001'
  });

  const [showSaveMessage, setShowSaveMessage] = useState(false);

  useEffect(() => {
    fetchBlockchainInfo();
    fetchNetworkStatus();
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('luxae-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [fetchBlockchainInfo, fetchNetworkStatus]);

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('luxae-settings', JSON.stringify(newSettings));
    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 3000);
  };

  const resetSettings = () => {
    const defaultSettings = {
      autoRefresh: true,
      refreshInterval: 30,
      notifications: true,
      theme: 'light',
      language: 'es',
      apiEndpoint: 'http://localhost:3001'
    };
    setSettings(defaultSettings);
    localStorage.setItem('luxae-settings', JSON.stringify(defaultSettings));
    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 3000);
  };

  if (loading && !blockchainInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-luxae-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="mt-2 text-gray-600">
            Gestiona la configuración del sistema y preferencias
          </p>
        </div>

        {/* Save Message */}
        {showSaveMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Configuración guardada</h3>
                <p className="mt-1 text-sm text-green-700">Los cambios han sido aplicados correctamente.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Settings */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CogIcon className="h-5 w-5 mr-2 text-luxae-600" />
                Configuración General
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.autoRefresh}
                      onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                      className="rounded border-gray-300 text-luxae-600 focus:ring-luxae-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Actualización automática</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500">Actualiza automáticamente los datos del dashboard</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intervalo de actualización (segundos)
                  </label>
                  <select
                    value={settings.refreshInterval}
                    onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                    className="input-field"
                    disabled={!settings.autoRefresh}
                  >
                    <option value={15}>15 segundos</option>
                    <option value={30}>30 segundos</option>
                    <option value={60}>1 minuto</option>
                    <option value={300}>5 minutos</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                      className="rounded border-gray-300 text-luxae-600 focus:ring-luxae-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Notificaciones</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500">Recibe notificaciones sobre eventos importantes</p>
                </div>
              </div>
            </div>

            {/* Appearance Settings */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <GlobeAltIcon className="h-5 w-5 mr-2 text-luxae-600" />
                Apariencia
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tema
                  </label>
                  <select
                    value={settings.theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                    className="input-field"
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Oscuro</option>
                    <option value="auto">Automático</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Idioma
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    className="input-field"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>

            {/* API Settings */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2 text-luxae-600" />
                Configuración de API
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endpoint de API
                  </label>
                  <input
                    type="url"
                    value={settings.apiEndpoint}
                    onChange={(e) => handleSettingChange('apiEndpoint', e.target.value)}
                    className="input-field"
                    placeholder="http://localhost:3001"
                  />
                  <p className="mt-1 text-xs text-gray-500">URL del servidor de la API v2</p>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      // Test API connection
                      fetch(settings.apiEndpoint + '/health')
                        .then(response => response.json())
                        .then(data => {
                          alert('API conectada correctamente');
                        })
                        .catch(error => {
                          alert('Error conectando a la API');
                        });
                    }}
                    className="btn-secondary"
                  >
                    Probar Conexión
                  </button>
                  <button
                    onClick={() => handleSettingChange('apiEndpoint', 'http://localhost:3001')}
                    className="btn-secondary"
                  >
                    Restaurar Predeterminado
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="space-y-6">
            {/* System Status */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Sistema</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Blockchain:</span>
                  <span className="text-sm text-green-600 font-medium">Operativa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">API v2:</span>
                  <span className="text-sm text-green-600 font-medium">Conectada</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">P2P Network:</span>
                  <span className="text-sm text-yellow-600 font-medium">Disponible</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Frontend:</span>
                  <span className="text-sm text-green-600 font-medium">Funcionando</span>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Versión:</span>
                  <span className="text-sm text-gray-900">v2.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bloques:</span>
                  <span className="text-sm text-gray-900">{blockchainInfo?.chain?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Consenso:</span>
                  <span className="text-sm text-gray-900">{blockchainInfo?.consensus || 'PoS'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Peers:</span>
                  <span className="text-sm text-gray-900">{networkStatus?.peers?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
              <div className="space-y-3">
                <button
                  onClick={resetSettings}
                  className="w-full btn-secondary"
                >
                  Restaurar Configuración
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Limpiar Datos
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BellIcon className="h-5 w-5 mr-2 text-luxae-600" />
                Notificaciones
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Nuevos bloques minados</p>
                <p>• Transacciones confirmadas</p>
                <p>• Cambios en la red P2P</p>
                <p>• Errores del sistema</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 