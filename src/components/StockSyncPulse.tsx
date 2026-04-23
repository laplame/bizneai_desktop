import React, { useCallback, useEffect, useRef, useState } from 'react';
import { isShopIdConfigured, syncLocalProductStocksFromMcpInventoryStatus } from '../utils/shopIdHelper';

type PulseState = 'idle' | 'syncing' | 'ok' | 'offline' | 'error';

const INTERVAL_MS = 4 * 60 * 1000;
const INITIAL_DELAY_MS = 12_000;

/**
 * Indicador mínimo (esquina) que alinea stocks locales con GET `inventory/status` del MCP
 * de forma periódica y al volver la conexión o la pestaña.
 */
const StockSyncPulse: React.FC = () => {
  const [visible, setVisible] = useState(() => isShopIdConfigured());
  const [pulse, setPulse] = useState<PulseState>('idle');
  const [lastOkAt, setLastOkAt] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);
  const inFlight = useRef(false);

  const tickConfigured = useCallback(() => {
    setVisible(isShopIdConfigured());
  }, []);

  const runPull = useCallback(async (): Promise<void> => {
    if (!isShopIdConfigured() || !navigator.onLine) {
      setPulse((p) => (p === 'syncing' ? p : !navigator.onLine ? 'offline' : 'idle'));
      return;
    }
    if (document.visibilityState !== 'visible') return;
    if (inFlight.current) return;
    inFlight.current = true;
    setPulse('syncing');
    try {
      const r = await syncLocalProductStocksFromMcpInventoryStatus();
      if (!r.ok) {
        setPulse(r.reason === 'fetch_failed' ? 'error' : !navigator.onLine ? 'offline' : 'idle');
        return;
      }
      setLastOkAt(Date.now());
      if (r.updatedRows > 0) {
        setLastUpdated((n) => n + r.updatedRows);
      }
      setPulse('ok');
    } catch {
      setPulse('error');
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    tickConfigured();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'bizneai-store-identifiers' || e.key === 'bizneai-server-config') tickConfigured();
    };
    const onIdsUpdated = () => tickConfigured();
    window.addEventListener('storage', onStorage);
    window.addEventListener('bizneai-store-identifiers-updated', onIdsUpdated);
    const id = window.setInterval(tickConfigured, 10_000);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('bizneai-store-identifiers-updated', onIdsUpdated);
      window.clearInterval(id);
    };
  }, [tickConfigured]);

  useEffect(() => {
    if (!visible) return;

    const onOnline = () => {
      setPulse('idle');
      void runPull();
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') void runPull();
    };

    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVis);

    const t0 = window.setTimeout(() => void runPull(), INITIAL_DELAY_MS);
    const interval = window.setInterval(() => void runPull(), INTERVAL_MS);

    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVis);
      window.clearTimeout(t0);
      window.clearInterval(interval);
    };
  }, [visible, runPull]);

  if (!visible) return null;

  const titleParts = [
    'Sincronización de stock (inventario MCP)',
    lastOkAt ? `Última lectura: ${new Date(lastOkAt).toLocaleTimeString()}` : 'Aún sin lectura',
    lastUpdated > 0 ? `Ajustes aplicados en esta sesión: ${lastUpdated} fila(s)` : null,
    pulse === 'offline' ? 'Sin conexión' : null,
    pulse === 'error' ? 'Falló la última consulta' : null,
  ].filter(Boolean);

  return (
    <button
      type="button"
      className="stock-sync-pulse"
      title={titleParts.join(' · ')}
      aria-label={titleParts.join('. ')}
      onClick={() => void runPull()}
    >
      <span className={`stock-sync-pulse-dot stock-sync-pulse-dot--${pulse}`} />
    </button>
  );
};

export default StockSyncPulse;
