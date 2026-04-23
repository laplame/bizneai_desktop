/**
 * Widget de bloques para el POS: contadores, cabecera local vs remota y sincronización.
 */
import { useState, useEffect, useCallback } from 'react';
import { Layers, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { getDailyBlocks, getBlocksSentToServer } from '../services/merkleTreeService';
import {
  runFullMerkleSync,
  fetchRemoteMerkleHead,
  reconcileMerkleHead,
  type ReconcileResult,
} from '../services/merkleSyncService';
import { getDisplayLuxaeTotal, applyServerLuxaeTotal } from '../services/merkleLuxaeService';
import { getShopId, isShopIdConfigured } from '../utils/shopIdHelper';
import { toast } from 'react-hot-toast';

function shortBlockRef(id: string, max = 22): string {
  const s = id.trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function reconcileStatusLabel(status: ReconcileResult['status']): string {
  switch (status) {
    case 'ok':
      return 'Alineado';
    case 'remote_ahead':
      return 'Nube adelantada';
    case 'local_ahead':
      return 'Pendiente de envío';
    case 'diverged':
      return 'Revisar';
    case 'no_remote':
      return 'Sin lectura remota';
    case 'no_local':
      return 'Sin copia local';
    default:
      return status;
  }
}

function reconcileShortHint(r: ReconcileResult, localBlockCount: number): string {
  const rb = r.remote?.blockCount ?? 0;
  switch (r.status) {
    case 'ok':
      return localBlockCount === 0 && rb === 0
        ? 'Sin bloques en este equipo ni en el resumen remoto.'
        : 'Conteos y punta coherentes con el servidor.';
    case 'remote_ahead':
      return rb > 0
        ? `La API registra ${rb} bloque(s); aquí ${localBlockCount === 0 ? 'no hay bloques generados' : 'faltan bloques respecto a la nube'}.`
        : r.message;
    case 'local_ahead':
      return 'Hay bloques locales que el servidor aún no refleja por completo.';
    case 'diverged':
      return 'Los bloques locales y el remoto no coinciden; revisa otro POS o auditoría.';
    case 'no_remote':
      return 'No se pudo leer el resumen (red, Shop ID o proxy).';
    case 'no_local':
      return 'Solo hay datos remotos; este POS no tiene bloques en memoria.';
    default:
      return r.message.length > 140 ? `${r.message.slice(0, 137)}…` : r.message;
  }
}

interface MerkleBlocksWidgetProps {
  onOpenSales?: () => void;
  compact?: boolean;
}

export default function MerkleBlocksWidget({ onOpenSales, compact = false }: MerkleBlocksWidgetProps) {
  const [blocksCount, setBlocksCount] = useState(0);
  const [syncedCount, setSyncedCount] = useState(0);
  const [luxaeTotal, setLuxaeTotal] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [reconcilePreview, setReconcilePreview] = useState<ReconcileResult | null>(null);

  const refresh = useCallback(() => {
    const blocks = getDailyBlocks();
    const sentSet = new Set(getBlocksSentToServer());
    /** Bloques actuales marcados como enviados al servidor (ids en @BizneAI_blocks_sent_to_server). */
    const syncedAmongBlocks = blocks.filter((b) => sentSet.has(b.id)).length;
    setBlocksCount(blocks.length);
    setSyncedCount(syncedAmongBlocks);
    setLuxaeTotal(getDisplayLuxaeTotal());
  }, []);

  const refreshReconcilePreview = useCallback(() => {
    const shopId = getShopId();
    if (!shopId || !isShopIdConfigured()) {
      setReconcilePreview(null);
      return;
    }
    void (async () => {
      try {
        const head = await fetchRemoteMerkleHead(shopId);
        applyServerLuxaeTotal(head?.totalLuxae);
        setReconcilePreview(reconcileMerkleHead(getDailyBlocks(), head));
        setLuxaeTotal(getDisplayLuxaeTotal());
      } catch {
        setReconcilePreview(null);
      }
    })();
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    const onLuxae = () => refresh();
    const onBlocks = () => {
      refresh();
      refreshReconcilePreview();
    };
    window.addEventListener('merkle-luxae-updated', onLuxae);
    window.addEventListener('merkle-blocks-updated', onBlocks);
    window.addEventListener('merkle-blocks-sent-updated', onBlocks);
    const onSyncDone = (ev: Event) => {
      const ce = ev as CustomEvent<ReconcileResult>;
      if (ce.detail) setReconcilePreview(ce.detail);
      refresh();
    };
    window.addEventListener('merkle-sync-finished', onSyncDone);
    refreshReconcilePreview();
    const previewInterval = setInterval(refreshReconcilePreview, 12000);
    return () => {
      clearInterval(interval);
      clearInterval(previewInterval);
      window.removeEventListener('merkle-luxae-updated', onLuxae);
      window.removeEventListener('merkle-blocks-updated', onBlocks);
      window.removeEventListener('merkle-blocks-sent-updated', onBlocks);
      window.removeEventListener('merkle-sync-finished', onSyncDone);
    };
  }, [refresh, refreshReconcilePreview]);

  const handleSync = async () => {
    if (!isShopIdConfigured()) {
      toast.error('Configura el Shop ID en Configuración para sincronizar');
      return;
    }
    setIsSyncing(true);
    try {
      const { push, reconcile } = await runFullMerkleSync();
      refresh();
      if (push.sent > 0) {
        toast.success(`${push.sent} bloque(s) enviado(s) a la API`);
      }
      if (push.failed > 0) {
        toast.error(`${push.failed} bloque(s) no se pudieron enviar`);
      }
      setReconcilePreview(reconcile);
      if (reconcile.status === 'diverged') {
        toast.error(reconcile.message, { duration: 6000 });
      } else if (reconcile.status === 'remote_ahead') {
        toast(reconcile.message, { icon: '☁️', duration: 6000 });
      } else if (reconcile.status === 'local_ahead') {
        toast(reconcile.message, { icon: '⚠️', duration: 5000 });
      } else if (reconcile.status === 'no_remote') {
        toast(reconcile.message, { icon: 'ℹ️', duration: 5000 });
      } else if (reconcile.status === 'ok' && push.sent === 0 && push.failed === 0) {
        toast.success(reconcile.message, { duration: 3500 });
      }
    } catch (err) {
      toast.error('Error al sincronizar bloques');
    } finally {
      setIsSyncing(false);
    }
  };

  const pendingCount = Math.max(0, blocksCount - syncedCount);
  const allSynced = blocksCount > 0 && pendingCount === 0;
  const hasBlocks = blocksCount > 0;
  const hasShopId = isShopIdConfigured();
  const blocks = getDailyBlocks();
  const lastLocal = hasBlocks ? blocks[blocks.length - 1] : null;
  const remote = reconcilePreview?.remote;
  const statusClass = reconcilePreview
    ? `merkle-widget__lane--${reconcilePreview.status}`
    : 'merkle-widget__lane--unknown';

  if (compact) {
    return (
      <div
        className="merkle-widget merkle-widget--compact"
        onClick={onOpenSales}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onOpenSales?.()}
        title={`${blocksCount} bloques · Luxae ${luxaeTotal} · ${
          !hasBlocks ? 'Sin bloques generados' : allSynced ? 'Sincronizado con la API' : `${pendingCount} pendiente(s) de envío`
        }${reconcilePreview ? ` · ${reconcileStatusLabel(reconcilePreview.status)}` : ''} · Clic para Ventas`}
      >
        <Layers size={16} />
        <span>{blocksCount}</span>
        {hasShopId && (
          <span
            className={`merkle-widget__sync-dot ${!hasBlocks ? 'idle' : allSynced ? 'synced' : 'pending'}`}
            title={!hasBlocks ? 'Sin bloques' : allSynced ? 'Sincronizado' : 'Pendiente de envío'}
          />
        )}
      </div>
    );
  }

  return (
    <div className="merkle-widget">
      <div className="merkle-widget__header">
        <Layers size={18} />
        <span>Bloques</span>
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
        <div
          className="merkle-widget__stat"
          title="Máximo entre el Luxae ganado en este equipo (bloques Merkle) y el total de la tienda que devuelve la API en el resumen de bloques (incluye otros POS, web o app si ya sincronizaron)."
        >
          <span className="merkle-widget__value">{luxaeTotal}</span>
          <span className="merkle-widget__label">Luxae</span>
        </div>
      </div>
      {hasShopId && reconcilePreview && (
        <div className={`merkle-widget__lane ${statusClass}`} role="status">
          <div className="merkle-widget__lane-head">
            <span className="merkle-widget__lane-badge">{reconcileStatusLabel(reconcilePreview.status)}</span>
            {remote != null && remote.blockCount > 0 && (
              <span className="merkle-widget__lane-meta">
                Nube: {remote.blockCount} bloque(s)
                {remote.lastBlockId ? ` · ${shortBlockRef(remote.lastBlockId)}` : ''}
              </span>
            )}
            {remote != null && remote.blockCount === 0 && !remote.lastBlockId && (
              <span className="merkle-widget__lane-meta">Nube: sin bloques</span>
            )}
          </div>
          {lastLocal && (
            <div className="merkle-widget__lane-local" title={lastLocal.id}>
              Este POS: <strong>{shortBlockRef(lastLocal.id)}</strong>
              <span className="merkle-widget__lane-date"> · {lastLocal.date}</span>
            </div>
          )}
          <p className="merkle-widget__lane-hint">{reconcileShortHint(reconcilePreview, blocksCount)}</p>
        </div>
      )}
      {hasShopId && (
        <div className="merkle-widget__actions">
          <button
            type="button"
            className="merkle-widget__sync-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleSync();
            }}
            disabled={isSyncing}
            title={
              !hasBlocks
                ? 'Comprobar cabecera remota (resumen MCP / ledger) y enviar bloques pendientes si los hay'
                : pendingCount > 0
                  ? `Enviar ${pendingCount} bloque(s) pendiente(s) y reconciliar con el servidor`
                  : 'Todo enviado: reconciliar cabecera con el servidor'
            }
          >
            {isSyncing ? (
              <RefreshCw size={14} className="spinning" />
            ) : !hasBlocks ? (
              <RefreshCw size={14} />
            ) : allSynced ? (
              <Cloud size={14} />
            ) : (
              <CloudOff size={14} />
            )}
            <span>
              {isSyncing
                ? 'Sincronizando...'
                : !hasBlocks
                  ? 'Comprobar API'
                  : pendingCount > 0
                    ? `Sincronizar (${pendingCount})`
                    : 'Sincronizado'}
            </span>
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
