/**
 * Sincroniza claves de localStorage con SQLite (API /api/pos/kv) para persistencia local.
 */
import { getLocalApiOrigin } from '../utils/localApiBase';

/** Claves que se pueden volcar al SQLite local (setup + debounce en caliente). */
export const KEYS_TO_MIRROR = [
  'bizneai-products',
  'bizneai-store-config',
  'bizneai-server-config',
  'bizneai-store-identifiers',
  'bizneai-setup-complete',
  'bizneai-product-order-counts',
  'bizneai-customers-registry',
  'bizneai-kitchen-orders',
  'bizneai-waitlist',
  'bizneai-inventory-history',
  'bizneai-tax-rate',
  'bizneai-fiscal-config',
  'bizneai-store-type',
  'bizneai-cart',
  'bizneai-cart-customer',
  'bizneai-cart-notes',
  'bizneai-language',
  'bizneai-sidebar-minimal',
  'bizneai-roles',
  'bizneai-screen-lock-enabled',
  'bizneai-store-types',
] as const;

const MIRROR_KEYS_SET = new Set<string>(KEYS_TO_MIRROR);

const DEBOUNCE_MS: Record<string, number> = {
  'bizneai-products': 450,
  default: 650,
};

const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json() as Promise<T>;
}

export async function posBackendHealth(): Promise<boolean> {
  try {
    const r = await fetch(`${getLocalApiOrigin()}/health`);
    return r.ok;
  } catch {
    return false;
  }
}

/** Crea ficheros SQLite y tablas (KV, actividad, bizneai.db). */
export async function initPosPersistence(): Promise<{ ok: boolean; dataDir?: string; error?: string }> {
  try {
    const data = await fetchJson<{ ok: boolean; dataDir?: string }>(
      `${getLocalApiOrigin()}/api/pos/init`,
      { method: 'POST', headers: { Accept: 'application/json' } }
    );
    return data.ok ? { ok: true, dataDir: data.dataDir } : { ok: false, error: 'init rejected' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function pushKvToServer(key: string, value: string): Promise<boolean> {
  try {
    // express.json strict solo acepta objetos/arrays; serializar siempre como JSON (p. ej. "true" → "\"true\"")
    const r = await fetch(
      `${getLocalApiOrigin()}/api/pos/kv?key=${encodeURIComponent(key)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(value),
      }
    );
    return r.ok;
  } catch {
    return false;
  }
}

export async function pullKvFromServer(key: string): Promise<string | null> {
  try {
    const r = await fetch(`${getLocalApiOrigin()}/api/pos/kv?key=${encodeURIComponent(key)}`);
    if (r.status === 404) return null;
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

export async function deleteKvFromServer(key: string): Promise<boolean> {
  try {
    const r = await fetch(
      `${getLocalApiOrigin()}/api/pos/kv?key=${encodeURIComponent(key)}`,
      { method: 'DELETE' }
    );
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * Encola un PUT de una clave al SQLite local (debounce por clave).
 * Solo actúa si `key` está en KEYS_TO_MIRROR.
 */
export function scheduleMirrorKeyToSqlite(key: string): void {
  if (typeof window === 'undefined') return;
  if (!MIRROR_KEYS_SET.has(key)) return;

  const prev = pendingTimers.get(key);
  if (prev) clearTimeout(prev);
  const ms = DEBOUNCE_MS[key] ?? DEBOUNCE_MS.default;
  pendingTimers.set(
    key,
    setTimeout(() => {
      pendingTimers.delete(key);
      const v = localStorage.getItem(key);
      if (v == null || v === '') {
        void deleteKvFromServer(key);
        return;
      }
      void pushKvToServer(key, v);
    }, ms)
  );
}

/** Registra el volcado de catálogo cuando otros módulos disparan `products-updated`. */
export function registerPosStorageMirror(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('products-updated', () => {
    scheduleMirrorKeyToSqlite('bizneai-products');
  });
}

/** Sube al servidor las claves definidas si existen en localStorage. */
export async function flushMirroredKeysToServer(): Promise<void> {
  for (const key of KEYS_TO_MIRROR) {
    const v = localStorage.getItem(key);
    if (v != null && v !== '') {
      await pushKvToServer(key, v);
    }
  }
}

/** Si el servidor tiene datos y local no, hidrata localStorage. */
export async function hydrateLocalFromServerIfEmpty(): Promise<void> {
  const hasProducts = (() => {
    try {
      const p = localStorage.getItem('bizneai-products');
      if (!p) return false;
      const a = JSON.parse(p);
      return Array.isArray(a) && a.length > 0;
    } catch {
      return false;
    }
  })();
  if (!hasProducts) {
    const remote = await pullKvFromServer('bizneai-products');
    if (remote) {
      try {
        const parsed = JSON.parse(remote);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem('bizneai-products', remote);
          window.dispatchEvent(new Event('products-updated'));
        }
      } catch {
        /* ignore */
      }
    }
  }

  for (const key of ['bizneai-store-config', 'bizneai-server-config', 'bizneai-store-identifiers'] as const) {
    if (localStorage.getItem(key)) continue;
    const r = await pullKvFromServer(key);
    if (r) localStorage.setItem(key, r);
  }
}
