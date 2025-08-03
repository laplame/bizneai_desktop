import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Play, 
  Pause, 
  Activity, 
  Coins, 
  Hash, 
  Zap,
  TrendingUp,
  Target,
  Clock,
  Power,
  AlertCircle,
  CheckCircle,
  Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MiningStatusProps {
  isCompact?: boolean;
  onStatusChange?: (isMining: boolean) => void;
}

interface MiningStats {
  totalBlocks: number;
  totalLuxae: number;
  currentHashrate: number;
  averageBlockTime: number;
  difficulty: number;
  networkHashrate: number;
  activeMiners: number;
  pendingTransactions: number;
  lastBlockHash: string;
  nextDifficultyAdjustment: number;
}

interface Block {
  id: number;
  hash: string;
  previousHash: string;
  timestamp: number;
  nonce: number;
  difficulty: number;
  transactions: number;
  reward: number;
  status: 'pending' | 'mining' | 'completed' | 'failed';
  minerAddress: string;
}

const MiningStatus: React.FC<MiningStatusProps> = ({ isCompact = true, onStatusChange }) => {
  const [isMining, setIsMining] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);
  const [miningProgress, setMiningProgress] = useState(0);
  const [currentHash, setCurrentHash] = useState('');
  const [nonce, setNonce] = useState(0);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const [stats, setStats] = useState<MiningStats>({
    totalBlocks: 1247,
    totalLuxae: 156.78,
    currentHashrate: 0,
    averageBlockTime: 2.3,
    difficulty: 156789,
    networkHashrate: 1250000,
    activeMiners: 847,
    pendingTransactions: 156,
    lastBlockHash: '0x7a8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1',
    nextDifficultyAdjustment: 2016
  });

  // Simular generación de hash
  const generateHash = (data: string, nonce: number): string => {
    const combined = data + nonce.toString();
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  };

  // Simular minado de bloque
  const mineBlock = () => {
    if (!currentBlock) return;

    const target = '0000'; // Dificultad simplificada
    let currentNonce = nonce;
    let hash = '';

    const mineStep = () => {
      if (!isMining) return;

      hash = generateHash(currentBlock.previousHash + currentBlock.timestamp + currentNonce, currentNonce);
      setCurrentHash(hash);
      setNonce(currentNonce);

      if (hash.startsWith(target)) {
        // Bloque minado exitosamente
        const completedBlock = {
          ...currentBlock,
          hash,
          nonce: currentNonce,
          status: 'completed' as const
        };
        
        setBlocks(prev => [completedBlock, ...prev.slice(0, 9)]);
        setCurrentBlock(null);
        setMiningProgress(0);
        setNonce(0);
        setIsMining(false);
        
        // Actualizar estadísticas
        setStats(prev => ({
          ...prev,
          totalBlocks: prev.totalBlocks + 1,
          totalLuxae: prev.totalLuxae + 0.125, // Recompensa por bloque
          currentHashrate: 0
        }));

        toast.success('¡Bloque minado exitosamente! +0.125 LUXAE');
        onStatusChange?.(false);
        return;
      }

      currentNonce++;
      setMiningProgress((currentNonce / 10000) * 100); // Progreso simulado

      if (isMining) {
        setTimeout(mineStep, 50); // Velocidad de minado
      }
    };

    mineStep();
  };

  const startMining = () => {
    if (isMining) return;

    const newBlock: Block = {
      id: stats.totalBlocks + 1,
      hash: '',
      previousHash: stats.lastBlockHash,
      timestamp: Date.now(),
      nonce: 0,
      difficulty: stats.difficulty,
      transactions: Math.floor(Math.random() * 100) + 50,
      reward: 0.125,
      status: 'mining',
      minerAddress: '0x1234567890abcdef...'
    };

    setCurrentBlock(newBlock);
    setIsMining(true);
    setMiningProgress(0);
    setNonce(0);
    setCurrentHash('');
    
    // Simular hashrate
    setStats(prev => ({
      ...prev,
      currentHashrate: Math.floor(Math.random() * 1000) + 500
    }));

    toast.success('Minería iniciada');
    onStatusChange?.(true);
  };

  const stopMining = () => {
    setIsMining(false);
    setCurrentBlock(null);
    setMiningProgress(0);
    setNonce(0);
    setCurrentHash('');
    
    setStats(prev => ({
      ...prev,
      currentHashrate: 0
    }));

    toast.success('Minería detenida');
    onStatusChange?.(false);
  };

  // Efecto para iniciar minado cuando hay un bloque activo
  useEffect(() => {
    if (isMining && currentBlock) {
      mineBlock();
    }
  }, [isMining, currentBlock]);

  // Generar bloques de ejemplo
  useEffect(() => {
    const exampleBlocks: Block[] = Array.from({ length: 5 }, (_, i) => ({
      id: stats.totalBlocks - i,
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      previousHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      timestamp: Date.now() - (i * 60000),
      nonce: Math.floor(Math.random() * 1000000),
      difficulty: stats.difficulty,
      transactions: Math.floor(Math.random() * 100) + 50,
      reward: 0.125,
      status: 'completed' as const,
      minerAddress: '0x1234567890abcdef...'
    }));
    setBlocks(exampleBlocks);
  }, []);

  if (isCompact) {
    return (
      <div className="mining-status-compact">
        <div className="mining-status-header">
          <div className="mining-status-title">
            <Cpu size={16} />
            <span>Minería LUXAE</span>
          </div>
          <div className="mining-status-controls">
            {isMining ? (
              <button 
                className="mining-btn mining-btn-stop"
                onClick={stopMining}
                title="Detener minería"
              >
                <Pause size={14} />
              </button>
            ) : (
              <button 
                className="mining-btn mining-btn-start"
                onClick={startMining}
                title="Iniciar minería"
              >
                <Play size={14} />
              </button>
            )}
          </div>
        </div>
        
        <div className="mining-status-indicators">
          <div className="mining-indicator">
            <Coins size={12} />
            <span>{stats.totalLuxae.toFixed(3)} LUXAE</span>
          </div>
          <div className="mining-indicator">
            <Hash size={12} />
            <span>{stats.totalBlocks}</span>
          </div>
          {isMining && (
            <div className="mining-indicator mining-active">
              <Activity size={12} />
              <span>Minando...</span>
            </div>
          )}
        </div>

        {isMining && currentBlock && (
          <div className="mining-progress-container">
            <div className="mining-progress-bar">
              <div 
                className="mining-progress-fill"
                style={{ width: `${miningProgress}%` }}
              />
            </div>
            <small>Progreso: {miningProgress.toFixed(1)}%</small>
          </div>
        )}

        <button 
          className="mining-details-toggle"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Ocultar' : 'Ver'} detalles
        </button>

        {showDetails && (
          <div className="mining-details">
            <div className="mining-detail-item">
              <Clock size={12} />
              <span>Tiempo promedio: {stats.averageBlockTime}s</span>
            </div>
            <div className="mining-detail-item">
              <TrendingUp size={12} />
              <span>Dificultad: {stats.difficulty.toLocaleString()}</span>
            </div>
            <div className="mining-detail-item">
              <Users size={12} />
              <span>Mineros activos: {stats.activeMiners}</span>
            </div>
            {isMining && currentHash && (
              <div className="mining-detail-item">
                <Hash size={12} />
                <span>Hash actual: {currentHash.substring(0, 8)}...</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Vista completa (para cuando no es compacto)
  return (
    <div className="mining-status-full">
      <div className="mining-status-header">
        <h3>Estado de Minería LUXAE</h3>
        <div className="mining-controls">
          {isMining ? (
            <button className="mining-btn-stop" onClick={stopMining}>
              <Pause size={16} />
              Detener
            </button>
          ) : (
            <button className="mining-btn-start" onClick={startMining}>
              <Play size={16} />
              Iniciar
            </button>
          )}
        </div>
      </div>

      <div className="mining-stats-grid">
        <div className="mining-stat-card">
          <Coins size={20} />
          <div>
            <h4>{stats.totalLuxae.toFixed(3)}</h4>
            <span>LUXAE Total</span>
          </div>
        </div>
        <div className="mining-stat-card">
          <Hash size={20} />
          <div>
            <h4>{stats.totalBlocks}</h4>
            <span>Bloques</span>
          </div>
        </div>
        <div className="mining-stat-card">
          <Activity size={20} />
          <div>
            <h4>{stats.currentHashrate}</h4>
            <span>Hash/s</span>
          </div>
        </div>
        <div className="mining-stat-card">
          <Clock size={20} />
          <div>
            <h4>{stats.averageBlockTime}s</h4>
            <span>Tiempo promedio</span>
          </div>
        </div>
      </div>

      {isMining && currentBlock && (
        <div className="mining-current-block">
          <h4>Minando Bloque #{currentBlock.id}</h4>
          <div className="mining-progress-container">
            <div className="mining-progress-bar">
              <div 
                className="mining-progress-fill"
                style={{ width: `${miningProgress}%` }}
              />
            </div>
            <span>Progreso: {miningProgress.toFixed(1)}%</span>
          </div>
          {currentHash && (
            <div className="current-hash">
              <small>Hash actual: {currentHash}</small>
            </div>
          )}
        </div>
      )}

      <div className="recent-blocks">
        <h4>Bloques Recientes</h4>
        <div className="blocks-list">
          {blocks.slice(0, 5).map(block => (
            <div key={block.id} className="block-item">
              <div className="block-info">
                <span className="block-number">#{block.id}</span>
                <span className="block-hash">{block.hash.substring(0, 16)}...</span>
              </div>
              <div className="block-status">
                <CheckCircle size={12} />
                <span>{block.reward} LUXAE</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MiningStatus; 