import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Play, 
  Square, 
  Coins, 
  Wallet, 
  BarChart3, 
  Network, 
  Cpu,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Server,
  Users,
  Globe,
  Shield,
  Target,
  TrendingUp,
  Database,
  HardDrive,
  Wifi,
  Settings,
  Power,
  RefreshCw,
  Eye,
  EyeOff,
  ShoppingCart,
  DollarSign,
  Hash,
  Key,
  Lock,
  Unlock
} from 'lucide-react';

interface MiningStatus {
  isMining: boolean;
  currentBlock: number;
  difficulty: number;
  hashrate: number;
  isDiscreteMining: boolean;
}

interface BlockchainData {
  chainLength: number;
  lastBlock: any;
  pendingTransactions: number;
  totalTransactions: number;
  networkHashrate: number;
  averageBlockTime: number;
}

interface NetworkNode {
  id: string;
  address: string;
  status: 'online' | 'offline' | 'syncing';
  lastSeen: string;
  version: string;
  isValidator: boolean;
  stake: number;
}

interface WalletInfo {
  address: string;
  balance: number;
  transactions: any[];
  stakedAmount: number;
  rewards: number;
}

interface NetworkStatus {
  totalNodes: number;
  onlineNodes: number;
  totalStake: number;
  averageBlockTime: number;
  networkHashrate: number;
  consensus: 'active' | 'inactive';
}

const BlockchainMining: React.FC = () => {
  const [miningStatus, setMiningStatus] = useState<MiningStatus>({
    isMining: false,
    currentBlock: 0,
    difficulty: 0,
    hashrate: 0,
    isDiscreteMining: false
  });
  
  const [blockchainData, setBlockchainData] = useState<BlockchainData>({
    chainLength: 0,
    lastBlock: null,
    pendingTransactions: 0,
    totalTransactions: 0,
    networkHashrate: 0,
    averageBlockTime: 0
  });
  
  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>([]);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    totalNodes: 0,
    onlineNodes: 0,
    totalStake: 0,
    averageBlockTime: 0,
    networkHashrate: 0,
    consensus: 'inactive'
  });
  
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    address: '',
    balance: 0,
    transactions: [],
    stakedAmount: 0,
    rewards: 0
  });
  
  const [blockchainStatus, setBlockchainStatus] = useState<string>('stopped');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [discreteMiningEnabled, setDiscreteMiningEnabled] = useState(false);
  const [posIntegrationEnabled, setPosIntegrationEnabled] = useState(true);

  // Check if we're in Electron environment
  const isElectron = window.blockchainAPI?.isElectron || false;

  useEffect(() => {
    if (isElectron) {
      updateStatus();
      const interval = setInterval(updateStatus, 3000); // Update every 3 seconds
      return () => clearInterval(interval);
    }
  }, [isElectron]);

  const updateStatus = async () => {
    if (!isElectron) return;

    try {
      const status = await window.blockchainAPI.getStatus();
      setBlockchainStatus(status.status);

      if (status.status === 'running') {
        const miningInfo = await window.blockchainAPI.getMiningStatus();
        setMiningStatus(miningInfo);

        const blockchainInfo = await window.blockchainAPI.getBlockchainData();
        setBlockchainData(blockchainInfo);

        // Get network data
        const networkStatus = await window.blockchainAPI.getNetworkStatus();
        setNetworkStatus(networkStatus);

        const networkNodes = await window.blockchainAPI.getNetworkNodes();
        setNetworkNodes(networkNodes);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update blockchain status');
    }
  };

  const simulateNetworkData = () => {
    // This function is no longer needed as we get real data from the API
    // Keeping it for fallback in case API fails
    const mockNodes: NetworkNode[] = [
      {
        id: 'node-001',
        address: '192.168.1.100:30303',
        status: 'online',
        lastSeen: new Date().toISOString(),
        version: '1.0.0',
        isValidator: true,
        stake: 10000
      },
      {
        id: 'node-002',
        address: '192.168.1.101:30303',
        status: 'online',
        lastSeen: new Date().toISOString(),
        version: '1.0.0',
        isValidator: true,
        stake: 8500
      },
      {
        id: 'node-003',
        address: '192.168.1.102:30303',
        status: 'syncing',
        lastSeen: new Date().toISOString(),
        version: '1.0.0',
        isValidator: false,
        stake: 0
      }
    ];

    setNetworkNodes(mockNodes);
    setNetworkStatus({
      totalNodes: 15,
      onlineNodes: 12,
      totalStake: 50000,
      averageBlockTime: 12.5,
      networkHashrate: 2500,
      consensus: 'active'
    });
  };

  const startBlockchain = async () => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await window.blockchainAPI.start();
      if (result.success) {
        setBlockchainStatus('running');
        updateStatus();
      } else {
        setError('Failed to start blockchain');
      }
    } catch (error) {
      setError('Error starting blockchain');
    } finally {
      setIsLoading(false);
    }
  };

  const stopBlockchain = async () => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await window.blockchainAPI.stop();
      if (result.success) {
        setBlockchainStatus('stopped');
        setMiningStatus({
          isMining: false,
          currentBlock: 0,
          difficulty: 0,
          hashrate: 0,
          isDiscreteMining: false
        });
      } else {
        setError('Failed to stop blockchain');
      }
    } catch (error) {
      setError('Error stopping blockchain');
    } finally {
      setIsLoading(false);
    }
  };

  const startMining = async () => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await window.blockchainAPI.startMining();
      if (result.success) {
        updateStatus();
      } else {
        setError(result.message || 'Failed to start mining');
      }
    } catch (error) {
      setError('Error starting mining');
    } finally {
      setIsLoading(false);
    }
  };

  const stopMining = async () => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await window.blockchainAPI.stopMining();
      if (result.success) {
        updateStatus();
      } else {
        setError(result.message || 'Failed to stop mining');
      }
    } catch (error) {
      setError('Error stopping mining');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDiscreteMining = async () => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      if (discreteMiningEnabled) {
        const result = await window.blockchainAPI.stopDiscreteMining();
        if (result.success) {
          setDiscreteMiningEnabled(false);
          updateStatus();
        } else {
          setError(result.message || 'Failed to stop discrete mining');
        }
      } else {
        const result = await window.blockchainAPI.startDiscreteMining();
        if (result.success) {
          setDiscreteMiningEnabled(true);
          updateStatus();
        } else {
          setError(result.message || 'Failed to start discrete mining');
        }
      }
    } catch (error) {
      setError('Error toggling discrete mining');
    } finally {
      setIsLoading(false);
    }
  };

  const getWalletInfo = async (address: string) => {
    if (!isElectron || !address) return;
    
    try {
      const walletInfo = await window.blockchainAPI.getWalletInfo(address);
      setWalletInfo(walletInfo);
    } catch (error) {
      setError('Error getting wallet info');
    }
  };

  const refreshNetworkData = () => {
    updateStatus();
  };

  // Update discrete mining status when mining status changes
  useEffect(() => {
    if (miningStatus.isDiscreteMining !== discreteMiningEnabled) {
      setDiscreteMiningEnabled(miningStatus.isDiscreteMining);
    }
  }, [miningStatus.isDiscreteMining]);

  if (!isElectron) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-2 text-yellow-800">
          <AlertCircle className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Blockchain Mining</h3>
        </div>
        <p className="mt-2 text-yellow-700">
          Blockchain mining is only available in the Electron desktop application.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Cpu className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Luxae Blockchain Node</h2>
            <p className="text-gray-600">Nodo de minería y validación PoS</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={refreshNetworkData}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            title="Actualizar datos"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            blockchainStatus === 'running' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {blockchainStatus === 'running' ? (
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>Conectado</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Desconectado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Node Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node Status */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Server className="w-5 h-5 text-blue-600" />
            <span>Estado del Nodo</span>
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Estado:</span>
              <span className={`font-medium ${
                blockchainStatus === 'running' ? 'text-green-600' : 'text-red-600'
              }`}>
                {blockchainStatus === 'running' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Minería:</span>
              <span className={`font-medium ${
                miningStatus.isMining ? 'text-green-600' : 'text-red-600'
              }`}>
                {miningStatus.isMining ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Minería Discreta:</span>
              <span className={`font-medium ${
                discreteMiningEnabled ? 'text-green-600' : 'text-gray-600'
              }`}>
                {discreteMiningEnabled ? 'Activada' : 'Desactivada'}
              </span>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={startBlockchain}
                disabled={isLoading || blockchainStatus === 'running'}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Power className="w-4 h-4" />
                <span>Iniciar Nodo</span>
              </button>
              
              <button
                onClick={stopBlockchain}
                disabled={isLoading || blockchainStatus === 'stopped'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Square className="w-4 h-4" />
                <span>Detener Nodo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mining Operations */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <span>Operaciones de Minería</span>
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Hash Rate:</span>
              <span className="font-medium text-gray-900">
                {miningStatus.hashrate} H/s
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Dificultad:</span>
              <span className="font-medium text-gray-900">
                {miningStatus.difficulty}
              </span>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={startMining}
                disabled={isLoading || miningStatus.isMining || blockchainStatus !== 'running'}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Iniciar Minería</span>
              </button>
              
              <button
                onClick={stopMining}
                disabled={isLoading || !miningStatus.isMining}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Square className="w-4 h-4" />
                <span>Detener Minería</span>
              </button>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Minería Discreta para POS</span>
                <button
                  onClick={toggleDiscreteMining}
                  className={`p-1 rounded ${
                    discreteMiningEnabled 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {discreteMiningEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Minado automático discreto para transacciones del POS
              </p>
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Globe className="w-5 h-5 text-purple-600" />
            <span>Estado de la Red</span>
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Nodos Online:</span>
              <span className="font-medium text-gray-900">
                {networkStatus.onlineNodes}/{networkStatus.totalNodes}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Stake Total:</span>
              <span className="font-medium text-gray-900">
                {networkStatus.totalStake.toLocaleString()} LXA
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Hash Rate Red:</span>
              <span className="font-medium text-gray-900">
                {networkStatus.networkHashrate} H/s
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Consenso:</span>
              <span className={`font-medium ${
                networkStatus.consensus === 'active' ? 'text-green-600' : 'text-red-600'
              }`}>
                {networkStatus.consensus === 'active' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Blockchain Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Longitud de Cadena</p>
              <p className="text-2xl font-bold text-gray-900">{blockchainData.chainLength}</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Bloque Actual</p>
              <p className="text-2xl font-bold text-gray-900">{miningStatus.currentBlock}</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Coins className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Transacciones Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{blockchainData.pendingTransactions}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Tiempo Promedio Bloque</p>
              <p className="text-2xl font-bold text-gray-900">{networkStatus.averageBlockTime}s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <span>Opciones Avanzadas</span>
          </h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showAdvanced ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* POS Integration */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4" />
                <span>Integración con POS</span>
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Minería Automática:</span>
                  <button
                    onClick={() => setPosIntegrationEnabled(!posIntegrationEnabled)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      posIntegrationEnabled 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {posIntegrationEnabled ? 'Activada' : 'Desactivada'}
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Minería Discreta:</span>
                  <button
                    onClick={toggleDiscreteMining}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      discreteMiningEnabled 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {discreteMiningEnabled ? 'Activada' : 'Desactivada'}
                  </button>
                </div>
              </div>
            </div>

            {/* Node Configuration */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <Server className="w-4 h-4" />
                <span>Configuración del Nodo</span>
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Puerto API:</span>
                  <span className="text-sm font-medium text-gray-900">3001</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Puerto P2P:</span>
                  <span className="text-sm font-medium text-gray-900">30303</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Versión:</span>
                  <span className="text-sm font-medium text-gray-900">1.0.0</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Network Nodes */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <span>Nodos de la Red</span>
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nodo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dirección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stake
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Actividad
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {networkNodes.map((node) => (
                <tr key={node.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {node.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {node.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      node.status === 'online' 
                        ? 'bg-green-100 text-green-800'
                        : node.status === 'syncing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {node.status === 'online' ? 'Online' : 
                       node.status === 'syncing' ? 'Sincronizando' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {node.isValidator ? 'Validador' : 'Nodo'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {node.stake.toLocaleString()} LXA
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(node.lastSeen).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wallet Section */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Wallet className="w-5 h-5 text-purple-600" />
          <span>Información de Billetera</span>
        </h3>
        
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Ingresa dirección de billetera"
              value={walletInfo.address}
              onChange={(e) => setWalletInfo(prev => ({ ...prev, address: e.target.value }))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => getWalletInfo(walletInfo.address)}
              disabled={!walletInfo.address}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Obtener Info
            </button>
          </div>
          
          {walletInfo.balance > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-600">Balance</p>
                <p className="text-xl font-semibold text-purple-900">
                  {walletInfo.balance} LXA
                </p>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">Stake</p>
                <p className="text-xl font-semibold text-green-900">
                  {walletInfo.stakedAmount} LXA
                </p>
              </div>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-600">Recompensas</p>
                <p className="text-xl font-semibold text-yellow-900">
                  {walletInfo.rewards} LXA
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockchainMining; 