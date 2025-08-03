import { useEffect } from 'react';
import { useBlockchain } from '../hooks/useBlockchain';
import { 
  GlobeAltIcon, 
  SignalIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const NetworkPage = () => {
  const {
    networkStatus,
    loading,
    error,
    fetchNetworkStatus,
  } = useBlockchain();

  useEffect(() => {
    fetchNetworkStatus();
    // Refresh network status every 30 seconds
    const interval = setInterval(fetchNetworkStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchNetworkStatus]);

  const formatPeerId = (peerId) => {
    if (!peerId) return 'N/A';
    return `${peerId.substring(0, 12)}...${peerId.substring(peerId.length - 12)}`;
  };

  const getConnectionStatus = (isConnected) => {
    if (isConnected) {
      return { 
        status: 'Conectado', 
        color: 'text-green-600', 
        bgColor: 'bg-green-50',
        icon: CheckCircleIcon 
      };
    } else {
      return { 
        status: 'Desconectado', 
        color: 'text-red-600', 
        bgColor: 'bg-red-50',
        icon: ExclamationTriangleIcon 
      };
    }
  };

  const getPeerStatus = (peer) => {
    if (peer.connected) {
      return { status: 'Activo', color: 'text-green-600', bgColor: 'bg-green-50' };
    } else if (peer.lastSeen) {
      return { status: 'Reciente', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    } else {
      return { status: 'Inactivo', color: 'text-red-600', bgColor: 'bg-red-50' };
    }
  };

  if (loading && !networkStatus) {
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
          <h1 className="text-3xl font-bold text-gray-900">Red P2P</h1>
          <p className="mt-2 text-gray-600">
            Monitorea el estado de la red descentralizada Luxae
          </p>
        </div>

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

        {/* Network Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <GlobeAltIcon className="h-8 w-8 text-luxae-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Estado de Red</p>
                {networkStatus && (
                  <div className="flex items-center mt-1">
                    {(() => {
                      const statusInfo = getConnectionStatus(networkStatus.isConnected);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <>
                          <StatusIcon className={`h-4 w-4 mr-2 ${statusInfo.color}`} />
                          <span className={`text-sm font-medium ${statusInfo.color}`}>
                            {statusInfo.status}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <SignalIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Peers Conectados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {networkStatus?.peers?.length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <WifiIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Latencia Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {networkStatus?.averageLatency ? `${networkStatus.averageLatency}ms` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Última Sincronización</p>
                <p className="text-sm font-bold text-gray-900">
                  {networkStatus?.lastSync ? new Date(networkStatus.lastSync).toLocaleTimeString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Network Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Nodo</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Node ID:</span>
                <span className="text-sm font-mono text-gray-900">
                  {formatPeerId(networkStatus?.nodeId)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Versión:</span>
                <span className="text-sm text-gray-900">
                  {networkStatus?.version || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Puerto P2P:</span>
                <span className="text-sm text-gray-900">
                  {networkStatus?.p2pPort || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Protocolo:</span>
                <span className="text-sm text-gray-900">
                  {networkStatus?.protocol || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas de Red</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Bloques Sincronizados:</span>
                <span className="text-sm text-gray-900">
                  {networkStatus?.syncedBlocks || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Transacciones Procesadas:</span>
                <span className="text-sm text-gray-900">
                  {networkStatus?.processedTransactions || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Ancho de Banda:</span>
                <span className="text-sm text-gray-900">
                  {networkStatus?.bandwidth ? `${networkStatus.bandwidth} KB/s` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tiempo Activo:</span>
                <span className="text-sm text-gray-900">
                  {networkStatus?.uptime ? `${Math.floor(networkStatus.uptime / 3600)}h ${Math.floor((networkStatus.uptime % 3600) / 60)}m` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Peers Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Peers Conectados</h2>
            <div className="text-sm text-gray-500">
              Mostrando {networkStatus?.peers?.length || 0} peers
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peer ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Latencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Actividad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Versión
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {networkStatus?.peers?.map((peer, index) => {
                  const statusInfo = getPeerStatus(peer);
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {formatPeerId(peer.peerId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {peer.address || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                          {statusInfo.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {peer.latency ? `${peer.latency}ms` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {peer.lastSeen ? new Date(peer.lastSeen).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {peer.version || 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(!networkStatus?.peers || networkStatus.peers.length === 0) && (
            <div className="text-center py-12">
              <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay peers conectados</h3>
              <p className="mt-1 text-sm text-gray-500">
                Los peers aparecerán aquí cuando se conecten a la red.
              </p>
            </div>
          )}
        </div>

        {/* Network Health */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Salud de la Red</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Conectividad</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600">Excelente</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sincronización</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600">Actualizada</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rendimiento</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm text-yellow-600">Bueno</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Protocolos Soportados</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-gray-600">libp2p</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-gray-600">Noise Protocol</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-gray-600">Multiplexing</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-gray-600">DHT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkPage; 