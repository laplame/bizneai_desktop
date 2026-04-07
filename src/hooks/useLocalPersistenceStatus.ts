import { useEffect, useState } from 'react';
import { getLocalApiOrigin } from '../utils/localApiBase';

export type LocalPersistenceStatus = 'checking' | 'connected' | 'disconnected';

/**
 * Estado del API local (health + SQLite KV). Indica si la persistencia en disco está disponible.
 */
export function useLocalPersistenceStatus(pollMs = 12000): LocalPersistenceStatus {
  const [status, setStatus] = useState<LocalPersistenceStatus>('checking');

  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      try {
        const base = getLocalApiOrigin();
        const [h, s] = await Promise.all([
          fetch(`${base}/health`, { cache: 'no-store' }),
          fetch(`${base}/api/pos/status`, { cache: 'no-store' }),
        ]);
        if (cancelled) return;
        setStatus(h.ok && s.ok ? 'connected' : 'disconnected');
      } catch {
        if (!cancelled) setStatus('disconnected');
      }
    };

    void probe();
    const id = window.setInterval(probe, pollMs);
    const onFocus = () => void probe();
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [pollMs]);

  return status;
}
