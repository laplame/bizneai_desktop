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

const Mining: React.FC = () => {
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
  const [blockchainLogs, setBlockchainLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Check if we're in Electron environment
  const isElectron = window.blockchainAPI?.isElectron || false;

  useEffect(() => {
    if (isElectron) {
      updateStatus();
      const interval = setInterval(updateStatus, 3000); // Update every 3 seconds
      return () => clearInterval(interval);
    }
  }, [isElectron]);

  // Monitor blockchain changes and add logs
  useEffect(() => {
    if (blockchainData.chainLength > 0) {
      addLog(`📊 Longitud de cadena: ${blockchainData.chainLength} bloques`);
    }
  }, [blockchainData.chainLength]);

  useEffect(() => {
    if (blockchainData.pendingTransactions > 0) {
      addLog(`⏳ Transacciones pendientes: ${blockchainData.pendingTransactions}`);
    }
  }, [blockchainData.pendingTransactions]);

  const updateStatus = async () => {
    if (!isElectron) return;

    try {
      const status = await window.blockchainAPI.getBlockchainStatus();
      const previousStatus = blockchainStatus;
      setBlockchainStatus(status.status);

      if (status.status === 'running') {
        if (previousStatus !== 'running') {
          addLog('🟢 Nodo blockchain conectado');
        }

        const miningInfo = await window.blockchainAPI.getMiningInfo();
        const previousMining = miningStatus.isMining;
        setMiningStatus(miningInfo);

        if (miningInfo.isMining && !previousMining) {
          addLog('⛏️ Minería activa detectada');
        } else if (!miningInfo.isMining && previousMining) {
          addLog('⛏️ Minería detenida');
        }

        const blockchainInfo = await window.blockchainAPI.getBlockchainData();
        setBlockchainData(blockchainInfo);

        // Get network data
        const networkStatus = await window.blockchainAPI.getNetworkStatus();
        setNetworkStatus(networkStatus);

        const networkNodes = await window.blockchainAPI.getNetworkNodes();
        setNetworkNodes(networkNodes);
      } else if (status.status === 'stopped' && previousStatus === 'running') {
        addLog('🔴 Nodo blockchain desconectado');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update blockchain status');
    }
  };

  const startBlockchain = async () => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      addLog('🚀 Iniciando nodo blockchain...');
      const result = await window.blockchainAPI.start();
      if (result.success) {
        setBlockchainStatus('running');
        addLog('✅ Nodo blockchain iniciado correctamente');
        addLog('🌐 API disponible en puerto 3001');
        addLog('📚 Endpoints: /health, /api/v2/');
        updateStatus();
      } else {
        setError('Failed to start blockchain');
        addLog('❌ Error al iniciar nodo blockchain');
      }
    } catch (error) {
      setError('Error starting blockchain');
      addLog('❌ Error al iniciar nodo blockchain');
    } finally {
      setIsLoading(false);
    }
  };

  const stopBlockchain = async () => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      addLog('🛑 Deteniendo nodo blockchain...');
      const result = await window.blockchainAPI.stop();
      if (result.success) {
        setBlockchainStatus('stopped');
        addLog('✅ Nodo blockchain detenido correctamente');
        setMiningStatus({
          isMining: false,
          currentBlock: 0,
          difficulty: 0,
          hashrate: 0,
          isDiscreteMining: false
        });
      } else {
        setError('Failed to stop blockchain');
        addLog('❌ Error al detener nodo blockchain');
      }
    } catch (error) {
      setError('Error stopping blockchain');
      addLog('❌ Error al detener nodo blockchain');
    } finally {
      setIsLoading(false);
    }
  };

  const startMining = async () => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      addLog('⛏️ Iniciando minería...');
      const result = await window.blockchainAPI.startMining();
      if (result.success) {
        addLog('✅ Minería iniciada correctamente');
        addLog(`📊 Hash rate actual: ${miningStatus.hashrate} H/s`);
        addLog(`🎯 Dificultad: ${miningStatus.difficulty}`);
        updateStatus();
      } else {
        setError(result.message || 'Failed to start mining');
        addLog('❌ Error al iniciar minería');
      }
    } catch (error) {
      setError('Error starting mining');
      addLog('❌ Error al iniciar minería');
    } finally {
      setIsLoading(false);
    }
  };

  const stopMining = async () => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      addLog('⛏️ Deteniendo minería...');
      const result = await window.blockchainAPI.stopMining();
      if (result.success) {
        addLog('✅ Minería detenida correctamente');
        updateStatus();
      } else {
        setError(result.message || 'Failed to stop mining');
        addLog('❌ Error al detener minería');
      }
    } catch (error) {
      setError('Error stopping mining');
      addLog('❌ Error al detener minería');
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
        addLog('👁️ Deteniendo minería discreta...');
        const result = await window.blockchainAPI.stopDiscreteMining();
        if (result.success) {
          setDiscreteMiningEnabled(false);
          addLog('✅ Minería discreta detenida');
          updateStatus();
        } else {
          setError(result.message || 'Failed to stop discrete mining');
          addLog('❌ Error al detener minería discreta');
        }
      } else {
        addLog('👁️ Iniciando minería discreta...');
        const result = await window.blockchainAPI.startDiscreteMining();
        if (result.success) {
          setDiscreteMiningEnabled(true);
          addLog('✅ Minería discreta iniciada');
          addLog('🛒 Procesando transacciones POS automáticamente');
          updateStatus();
        } else {
          setError(result.message || 'Failed to start discrete mining');
          addLog('❌ Error al iniciar minería discreta');
        }
      }
    } catch (error) {
      setError('Error toggling discrete mining');
      addLog('❌ Error en minería discreta');
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

  const simulatePosTransaction = async () => {
    if (!isElectron) return;
    
    try {
      addLog('🛒 Simulando transacción POS...');
      const posTransaction = {
        saleId: `SALE-${Date.now()}`,
        amount: Math.floor(Math.random() * 100) + 10,
        items: [
          { name: 'Producto 1', quantity: 2, price: 25.50 },
          { name: 'Producto 2', quantity: 1, price: 15.00 }
        ]
      };
      
      const result = await window.blockchainAPI.sendPosTransaction(
        posTransaction.saleId, 
        posTransaction.amount, 
        posTransaction.items
      );
      
      if (result.success) {
        addLog(`✅ Transacción POS procesada: $${posTransaction.amount}`);
        addLog(`📦 Items: ${posTransaction.items.length} productos`);
        updateStatus();
      } else {
        addLog('❌ Error al procesar transacción POS');
      }
    } catch (error) {
      addLog('❌ Error al simular transacción POS');
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setBlockchainLogs(prev => [...prev.slice(-49), logEntry]); // Keep last 50 logs
  };

  // Update discrete mining status when mining status changes
  useEffect(() => {
    if (miningStatus.isDiscreteMining !== discreteMiningEnabled) {
      setDiscreteMiningEnabled(miningStatus.isDiscreteMining);
    }
  }, [miningStatus.isDiscreteMining]);

  if (!isElectron) {
    return (
      <div style={{ padding: '1.5rem', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e' }}>
          <AlertCircle style={{ width: '1.25rem', height: '1.25rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Blockchain Mining</h3>
        </div>
        <p style={{ marginTop: '0.5rem', color: '#a16207' }}>
          Blockchain mining is only available in the Electron desktop application.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Cpu style={{ width: '2rem', height: '2rem', color: '#2563eb' }} />
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>Luxae Blockchain Node</h2>
            <p style={{ color: '#64748b' }}>Nodo de minería y validación PoS</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={refreshNetworkData}
            style={{ padding: '0.5rem', color: '#64748b', border: 'none', background: 'none', cursor: 'pointer' }}
            title="Actualizar datos"
          >
            <RefreshCw style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
          <div style={{ 
            padding: '0.25rem 0.75rem', 
            borderRadius: '9999px', 
            fontSize: '0.875rem', 
            fontWeight: '500',
            backgroundColor: blockchainStatus === 'running' ? '#dcfce7' : '#fee2e2',
            color: blockchainStatus === 'running' ? '#166534' : '#dc2626'
          }}>
            {blockchainStatus === 'running' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle style={{ width: '1rem', height: '1rem' }} />
                <span>Conectado</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock style={{ width: '1rem', height: '1rem' }} />
                <span>Desconectado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
            <AlertCircle style={{ width: '1.25rem', height: '1.25rem' }} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Node Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Node Status */}
        <div style={{ padding: '1.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server style={{ width: '1.25rem', height: '1.25rem', color: '#2563eb' }} />
            <span>Estado del Nodo</span>
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Estado:</span>
              <span style={{ fontWeight: '500', color: blockchainStatus === 'running' ? '#059669' : '#dc2626' }}>
                {blockchainStatus === 'running' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Minería:</span>
              <span style={{ fontWeight: '500', color: miningStatus.isMining ? '#059669' : '#dc2626' }}>
                {miningStatus.isMining ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Minería Discreta:</span>
              <span style={{ fontWeight: '500', color: discreteMiningEnabled ? '#059669' : '#64748b' }}>
                {discreteMiningEnabled ? 'Activada' : 'Desactivada'}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={startBlockchain}
                disabled={isLoading || blockchainStatus === 'running'}
                style={{ 
                  flex: 1, 
                  padding: '0.5rem 1rem', 
                  backgroundColor: '#059669', 
                  color: 'white', 
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  opacity: (isLoading || blockchainStatus === 'running') ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Power style={{ width: '1rem', height: '1rem' }} />
                <span>Iniciar Nodo</span>
              </button>
              
              <button
                onClick={stopBlockchain}
                disabled={isLoading || blockchainStatus === 'stopped'}
                style={{ 
                  flex: 1, 
                  padding: '0.5rem 1rem', 
                  backgroundColor: '#dc2626', 
                  color: 'white', 
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  opacity: (isLoading || blockchainStatus === 'stopped') ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Square style={{ width: '1rem', height: '1rem' }} />
                <span>Detener Nodo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mining Operations */}
        <div style={{ padding: '1.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap style={{ width: '1.25rem', height: '1.25rem', color: '#ca8a04' }} />
            <span>Operaciones de Minería</span>
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Hash Rate:</span>
              <span style={{ fontWeight: '500', color: '#1e293b' }}>
                {miningStatus.hashrate} H/s
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Dificultad:</span>
              <span style={{ fontWeight: '500', color: '#1e293b' }}>
                {miningStatus.difficulty}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={startMining}
                disabled={isLoading || miningStatus.isMining || blockchainStatus !== 'running'}
                style={{ 
                  flex: 1, 
                  padding: '0.5rem 1rem', 
                  backgroundColor: '#ca8a04', 
                  color: 'white', 
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  opacity: (isLoading || miningStatus.isMining || blockchainStatus !== 'running') ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Play style={{ width: '1rem', height: '1rem' }} />
                <span>Iniciar Minería</span>
              </button>
              
              <button
                onClick={stopMining}
                disabled={isLoading || !miningStatus.isMining}
                style={{ 
                  flex: 1, 
                  padding: '0.5rem 1rem', 
                  backgroundColor: '#dc2626', 
                  color: 'white', 
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  opacity: (isLoading || !miningStatus.isMining) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Square style={{ width: '1rem', height: '1rem' }} />
                <span>Detener Minería</span>
              </button>
            </div>

            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Minería Discreta para POS</span>
                <button 
                  onClick={toggleDiscreteMining}
                  style={{ 
                    padding: '0.25rem', 
                    borderRadius: '0.25rem',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: discreteMiningEnabled ? '#dcfce7' : '#f1f5f9',
                    color: discreteMiningEnabled ? '#059669' : '#64748b'
                  }}
                >
                  {discreteMiningEnabled ? <Eye style={{ width: '1rem', height: '1rem' }} /> : <EyeOff style={{ width: '1rem', height: '1rem' }} />}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Minado automático discreto para transacciones del POS
              </p>
              {discreteMiningEnabled && (
                <button
                  onClick={simulatePosTransaction}
                  style={{ 
                    marginTop: '0.5rem',
                    padding: '0.5rem 1rem', 
                    backgroundColor: '#7c3aed', 
                    color: 'white', 
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  🛒 Simular Transacción POS
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div style={{ padding: '1.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe style={{ width: '1.25rem', height: '1.25rem', color: '#7c3aed' }} />
            <span>Estado de la Red</span>
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Nodos Online:</span>
              <span style={{ fontWeight: '500', color: '#1e293b' }}>
                {networkStatus.onlineNodes}/{networkStatus.totalNodes}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Stake Total:</span>
              <span style={{ fontWeight: '500', color: '#1e293b' }}>
                {networkStatus.totalStake.toLocaleString()} LXA
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Hash Rate Red:</span>
              <span style={{ fontWeight: '500', color: '#1e293b' }}>
                {networkStatus.networkHashrate} H/s
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Consenso:</span>
              <span style={{ fontWeight: '500', color: networkStatus.consensus === 'active' ? '#059669' : '#dc2626' }}>
                {networkStatus.consensus === 'active' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Blockchain Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BarChart3 style={{ width: '2rem', height: '2rem', color: '#2563eb' }} />
            <div>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Longitud de Cadena</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{blockchainData.chainLength}</p>
            </div>
          </div>
        </div>
        
        <div style={{ padding: '1.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity style={{ width: '2rem', height: '2rem', color: '#059669' }} />
            <div>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Bloque Actual</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{miningStatus.currentBlock}</p>
            </div>
          </div>
        </div>
        
        <div style={{ padding: '1.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Coins style={{ width: '2rem', height: '2rem', color: '#ca8a04' }} />
            <div>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Transacciones Pendientes</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{blockchainData.pendingTransactions}</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <TrendingUp style={{ width: '2rem', height: '2rem', color: '#7c3aed' }} />
            <div>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Tiempo Promedio Bloque</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{networkStatus.averageBlockTime}s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Network Nodes */}
      <div style={{ padding: '1.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users style={{ width: '1.25rem', height: '1.25rem', color: '#4f46e5' }} />
          <span>Nodos de la Red</span>
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#64748b', textTransform: 'uppercase' }}>
                  Nodo
                </th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#64748b', textTransform: 'uppercase' }}>
                  Dirección
                </th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#64748b', textTransform: 'uppercase' }}>
                  Estado
                </th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#64748b', textTransform: 'uppercase' }}>
                  Tipo
                </th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#64748b', textTransform: 'uppercase' }}>
                  Stake
                </th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#64748b', textTransform: 'uppercase' }}>
                  Última Actividad
                </th>
              </tr>
            </thead>
            <tbody>
              {networkNodes.map((node) => (
                <tr key={node.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#1e293b' }}>
                    {node.id}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                    {node.address}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      padding: '0.25rem 0.5rem', 
                      fontSize: '0.75rem', 
                      fontWeight: '600', 
                      borderRadius: '9999px',
                      backgroundColor: node.status === 'online' ? '#dcfce7' : node.status === 'syncing' ? '#fef3c7' : '#fee2e2',
                      color: node.status === 'online' ? '#166534' : node.status === 'syncing' ? '#92400e' : '#dc2626'
                    }}>
                      {node.status === 'online' ? 'Online' : 
                       node.status === 'syncing' ? 'Sincronizando' : 'Offline'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                    {node.isValidator ? 'Validador' : 'Nodo'}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                    {node.stake.toLocaleString()} LXA
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                    {new Date(node.lastSeen).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wallet Section */}
      <div style={{ padding: '1.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wallet style={{ width: '1.25rem', height: '1.25rem', color: '#7c3aed' }} />
          <span>Información de Billetera</span>
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Ingresa dirección de billetera"
              value={walletInfo.address}
              onChange={(e) => setWalletInfo(prev => ({ ...prev, address: e.target.value }))}
              style={{ 
                flex: 1, 
                padding: '0.5rem 0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.5rem',
                outline: 'none'
              }}
            />
            <button
              onClick={() => getWalletInfo(walletInfo.address)}
              disabled={!walletInfo.address}
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: '#7c3aed', 
                color: 'white', 
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                opacity: !walletInfo.address ? 0.5 : 1
              }}
            >
              Obtener Info
            </button>
          </div>

          {walletInfo.balance > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#faf5ff', border: '1px solid #c4b5fd', borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#7c3aed' }}>Balance</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#581c87' }}>
                  {walletInfo.balance} LXA
                </p>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#059669' }}>Stake</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#166534' }}>
                  {walletInfo.stakedAmount} LXA
                </p>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#ca8a04' }}>Recompensas</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#92400e' }}>
                  {walletInfo.rewards} LXA
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Blockchain Logs Section */}
      <div style={{ padding: '1.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database style={{ width: '1.25rem', height: '1.25rem', color: '#059669' }} />
            <span>Logs del Blockchain</span>
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setShowLogs(!showLogs)}
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: showLogs ? '#059669' : '#64748b', 
                color: 'white', 
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {showLogs ? 'Ocultar Logs' : 'Mostrar Logs'}
            </button>
            <button
              onClick={() => setBlockchainLogs([])}
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: '#dc2626', 
                color: 'white', 
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
        
        {showLogs && (
          <div style={{ 
            backgroundColor: '#1e293b', 
            color: '#e2e8f0', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            maxHeight: '300px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            lineHeight: '1.5'
          }}>
            {blockchainLogs.length === 0 ? (
              <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                No hay logs disponibles. Inicia el nodo blockchain para ver los logs en tiempo real.
              </div>
            ) : (
              blockchainLogs.map((log, index) => (
                <div key={index} style={{ 
                  padding: '0.25rem 0',
                  borderBottom: index < blockchainLogs.length - 1 ? '1px solid #334155' : 'none'
                }}>
                  {log}
                </div>
              ))
            )}
          </div>
        )}
        
        {!showLogs && blockchainLogs.length > 0 && (
          <div style={{ 
            padding: '0.5rem', 
            backgroundColor: '#f1f5f9', 
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: '#64748b'
          }}>
            {blockchainLogs.length} logs disponibles. Haz clic en "Mostrar Logs" para verlos.
          </div>
        )}
      </div>
    </div>
  );
};

export default Mining; 