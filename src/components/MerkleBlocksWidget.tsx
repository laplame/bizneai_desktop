/**
 * Widget de bloques Merkle para el POS
 * Muestra cantidad de bloques generados y estado de sincronización con la API
 */
import { useState, useEffect, useCallback } from 'react';
import { Layers, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { getDailyBlocks, getBlocksSentToServer } from '../services/merkleTreeService';
import { syncUnsentBlocksToServer } from '../services/blockApiService';
import { isShopIdConfigured } from '../utils/shopIdHelper';
import { toast } from 'react-hot-toast';

interface MerkleBlocksWidgetProps {
  onOpenSales?: () => void;
  compact?: boolean;
}

export default function MerkleBlocksWidget({ onOpenSales, compact = false }: MerkleBlocksWidgetProps) {
  const [blocksCount, setBlocksCount] = useState(0);
  const [syncedCount, setSyncedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refresh = useCallback(() => {
    const blocks = getDailyBlocks();
    const sent = getBlocksSentToServer();
    setBlocksCount(blocks.length);
    setSyncedCount(sent.length);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleSync = async () => {
    if (!isShopIdConfigured()) {
      toast.error('Configura el Shop ID en Configuración para sincronizar');
      return;
    }
    setIsSyncing(true);
    try {
      const { sent, failed } = await syncUnsentBlocksToServer();
      refresh();
      if (sent > 0) {
        toast.success(`${sent} bloque(s) sincronizado(s) con la API`);
      }
      if (failed > 0) {
        toast.error(`${failed} bloque(s) no se pudieron sincronizar`);
      }
      if (sent === 0 && failed === 0 && blocksCount > 0) {
        toast.success('Todos los bloques están sincronizados');
      }
    } catch (err) {
      toast.error('Error al sincronizar bloques');
    } finally {
      setIsSyncing(false);
    }
  };

  const pendingCount = blocksCount - syncedCount;
  const allSynced = blocksCount > 0 && pendingCount === 0;
  const hasShopId = isShopIdConfigured();

  if (compact) {
    return (
      <div
        className="merkle-widget merkle-widget--compact"
        onClick={onOpenSales}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onOpenSales?.()}
        title={`${blocksCount} bloques · ${allSynced ? 'Sincronizado' : `${pendingCount} pendientes`} · Clic para Ventas`}
      >
        <Layers size={16} />
        <span>{blocksCount}</span>
        {hasShopId && (
          <span className={`merkle-widget__sync-dot ${allSynced ? 'synced' : 'pending'}`} title={allSynced ? 'Sincronizado' : 'Pendiente'} />
        )}
      </div>
    );
  }

  return (
    <div className="merkle-widget">
      <div className="merkle-widget__header">
        <Layers size={18} />
        <span>Bloques Merkle</span>
      </div>
      <div className="merkle-widget__content">
        <div className="merkle-widget__stat">
          <span className="merkle-widget__value">{blocksCount}</span>
          <span className="merkle-widget__label">generados</span>
        </div>
        <div className="merkle-widget__stat">
          <span className="merkle-widget__value">{syncedCount}</span>
          <span className="merkle-widget__label">sincronizados</span>
        </div>
      </div>
      {hasShopId && (
        <div className="merkle-widget__actions">
          <button
            type="button"
            className="merkle-widget__sync-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleSync();
            }}
            disabled={isSyncing || pendingCount === 0}
            title={pendingCount > 0 ? `Sincronizar ${pendingCount} bloque(s)` : 'Todo sincronizado'}
          >
            {isSyncing ? (
              <RefreshCw size={14} className="spinning" />
            ) : allSynced ? (
              <Cloud size={14} />
            ) : (
              <CloudOff size={14} />
            )}
            <span>{isSyncing ? 'Sincronizando...' : pendingCount > 0 ? `Sincronizar (${pendingCount})` : 'Sincronizado'}</span>
          </button>
          {onOpenSales && (
            <button
              type="button"
              className="merkle-widget__link-btn"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSales();
              }}
            >
              Ver en Ventas
            </button>
          )}
        </div>
      )}
      {!hasShopId && (
        <p className="merkle-widget__hint">Configura Shop ID para sincronizar</p>
      )}
    </div>
  );
}
