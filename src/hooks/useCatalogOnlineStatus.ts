import { useEffect, useState } from 'react';
import { getMcpUrl, isShopIdConfigured } from '../utils/shopIdHelper';

export type CatalogOnlineStatus = 'idle' | 'checking' | 'online' | 'offline';

const MCP_FETCH_MS = 12000;

/**
 * Ping periódico al endpoint MCP del catálogo (misma URL que usa la sincronización).
 */
export function useCatalogOnlineStatus(pollMs = 25000): CatalogOnlineStatus {
  const [status, setStatus] = useState<CatalogOnlineStatus>(() => {
    if (typeof window === 'undefined') return 'idle';
    return isShopIdConfigured() && getMcpUrl() ? 'checking' : 'idle';
  });

  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      if (!isShopIdConfigured()) {
        if (!cancelled) setStatus('idle');
        return;
      }
      const mcpUrl = getMcpUrl();
      if (!mcpUrl) {
        if (!cancelled) setStatus('idle');
        return;
      }

      setStatus((prev) => (prev === 'idle' ? 'checking' : prev === 'online' || prev === 'offline' ? prev : prev));

      const ac = new AbortController();
      const tid = window.setTimeout(() => ac.abort(), MCP_FETCH_MS);
      try {
        const r = await fetch(mcpUrl, { method: 'GET', cache: 'no-store', signal: ac.signal });
        if (cancelled) return;
        setStatus(r.ok ? 'online' : 'offline');
      } catch {
        if (!cancelled) setStatus('offline');
      } finally {
        window.clearTimeout(tid);
      }
    };

    void probe();
    const id = window.setInterval(probe, pollMs);
    const onFocus = () => void probe();
    window.addEventListener('focus', onFocus);
    window.addEventListener('store-config-updated', onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('store-config-updated', onFocus);
    };
  }, [pollMs]);

  return status;
}
