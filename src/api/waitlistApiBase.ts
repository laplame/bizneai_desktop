/**
 * Waitlist y pedidos relacionados: el contrato público vive en www.bizneai.com.
 * Todas las rutas se resuelven contra `/api/waitlist/...` en ese host.
 */
import { getLocalApiOrigin, shouldUseSalesMcpProxy } from '../utils/localApiBase';

export const BIZNEAI_WAITLIST_API_ORIGIN = 'https://www.bizneai.com';

/** Siempre `https://www.bizneai.com/api` (sin barra final duplicada al unir paths). */
export const BIZNEAI_WAITLIST_API_BASE = `${BIZNEAI_WAITLIST_API_ORIGIN}/api`;

/**
 * Base desde la que el cliente hace `fetch`.
 * - Origen producción (misma web que el API): llamada directa a `BIZNEAI_WAITLIST_API_BASE` (sin CORS).
 * - localhost / Electron / file://: `http://127.0.0.1:3000/api/proxy/bizneai` → el servidor reenvía a www.bizneai.com (evita CORS).
 */
export function resolveWaitlistApiBase(): string {
  if (shouldUseSalesMcpProxy()) {
    return `${getLocalApiOrigin().replace(/\/$/, '')}/api/proxy/bizneai`;
  }
  return BIZNEAI_WAITLIST_API_BASE;
}

/**
 * @param pathFromApiRoot ruta bajo `/api`, p. ej. `/waitlist?shopId=…` o `/waitlist/orders?…`
 */
export async function fetchWaitlistJson(pathFromApiRoot: string, init?: RequestInit): Promise<unknown> {
  const base = resolveWaitlistApiBase();
  const p = pathFromApiRoot.startsWith('/') ? pathFromApiRoot : `/${pathFromApiRoot}`;
  const url = `${base}${p}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });
  return response.json();
}
