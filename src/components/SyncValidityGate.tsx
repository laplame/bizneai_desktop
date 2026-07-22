import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Server } from 'lucide-react';
import {
  getSyncValidityStatus,
  type SyncValidityStatus,
  MAX_DAYS_WITHOUT_SYNC,
} from '../utils/syncValidity';
import { runBackgroundSync, setLastSyncTime, syncMcpBatch } from '../utils/syncService';
import { toast } from 'react-hot-toast';

type Props = {
  /** Tras sync exitoso o al cambiar de sección a settings */
  onGoToSettings?: () => void;
};

/**
 * Bloqueo de pantalla cuando pasaron 30 días sin sincronizar con BizneAI.
 */
export default function SyncValidityGate({ onGoToSettings }: Props) {
  const [status, setStatus] = useState<SyncValidityStatus>(() => getSyncValidityStatus());
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(() => {
    setStatus(getSyncValidityStatus());
  }, []);

  useEffect(() => {
    getSyncValidityStatus(); // seed first-open
    refresh();
    const id = window.setInterval(refresh, 60_000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  if (!status.isExpired) return null;

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      let renewed = await runBackgroundSync();
      if (!renewed) {
        try {
          await syncMcpBatch('shop', { force: true });
          setLastSyncTime();
          renewed = true;
        } catch {
          /* keep locked */
        }
      }
      refresh();
      const next = getSyncValidityStatus();
      if (!next.isExpired) {
        toast.success('Sincronización completada. Vigencia restaurada.');
      } else {
        toast.error(
          'Aún no se pudo renovar la vigencia. Abre Configuración y sincroniza el catálogo / shop.'
        );
        onGoToSettings?.();
      }
    } catch (e) {
      console.error('[SyncValidityGate]', e);
      toast.error('Error al sincronizar. Revisa tu conexión e inténtalo de nuevo.');
      onGoToSettings?.();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      className="sync-validity-gate"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="sync-validity-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(15, 23, 42, 0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: '100%',
          background: 'var(--bs-dark-surface, #1e293b)',
          border: '1px solid rgba(248, 113, 113, 0.45)',
          borderRadius: 12,
          padding: '1.75rem',
          color: 'var(--bs-dark-text, #f8fafc)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <AlertTriangle size={28} color="#f87171" aria-hidden />
          <h2 id="sync-validity-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            Vigencia vencida
          </h2>
        </div>
        <p style={{ margin: '0 0 0.75rem', lineHeight: 1.5, color: '#cbd5e1' }}>
          Han pasado <strong>{status.daysSinceSync} días</strong> sin sincronizar con BizneAI
          (límite: {MAX_DAYS_WITHOUT_SYNC} días). El POS se detuvo hasta completar una
          sincronización.
        </p>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.9rem', color: '#94a3b8' }}>
          {status.lastSyncAt
            ? `Última sync: ${new Date(status.lastSyncAt).toLocaleString()}`
            : 'No hay registro de sincronización en este equipo.'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            className="btn-primary"
            disabled={syncing}
            onClick={() => void handleSyncNow()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '0.75rem 1rem',
              borderRadius: 8,
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              cursor: syncing ? 'wait' : 'pointer',
            }}
          >
            <RefreshCw size={18} className={syncing ? 'spin' : undefined} aria-hidden />
            {syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
          </button>
          <button
            type="button"
            onClick={() => onGoToSettings?.()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '0.65rem 1rem',
              borderRadius: 8,
              border: '1px solid #475569',
              background: 'transparent',
              color: '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            <Server size={16} aria-hidden />
            Ir a Configuración
          </button>
        </div>
      </div>
    </div>
  );
}
