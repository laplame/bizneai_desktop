/**
 * Wallet Polygon local para USDLXE (LUXAE) — generación y respaldo de la frase
 * mnemónica. Vive 100% en el servidor local (nunca se sube a bizneai.com):
 * POST/GET/DELETE /api/local/crypto-wallet/:shopId/...
 */

import { getLocalApiOrigin } from '../utils/localApiBase';

function localUrl(shopId: string, subpath: string): string {
  return `${getLocalApiOrigin()}/api/local/crypto-wallet/${shopId}/${subpath}`;
}

interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PolygonWalletAddress {
  address: string;
  createdAt: string;
}

export interface PolygonWalletGenerated {
  address: string;
  mnemonic: string;
}

async function postJson<T>(url: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body || {}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      return { success: false, error: data?.error || `Error ${response.status}`, data: data?.data };
    }
    return { success: true, data: data?.data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error de conexión' };
  }
}

/** GET .../polygon — dirección actual (si existe), sin la frase. */
export async function getPolygonWallet(shopId: string): Promise<ApiResult<PolygonWalletAddress | null>> {
  try {
    const response = await fetch(localUrl(shopId, 'polygon'), { headers: { Accept: 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      return { success: false, error: data?.error || `Error ${response.status}` };
    }
    return { success: true, data: data?.data ?? null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error de conexión' };
  }
}

/**
 * POST .../generate-polygon — genera una wallet nueva. Devuelve la frase
 * mnemónica UNA SOLA VEZ; el llamador debe mostrarla para respaldo inmediato.
 * Si ya existe una wallet, falla con error 'ALREADY_EXISTS' salvo `force: true`.
 */
export async function generatePolygonWallet(
  shopId: string,
  force = false
): Promise<ApiResult<PolygonWalletGenerated>> {
  return postJson(localUrl(shopId, 'generate-polygon'), { force });
}

/** POST .../reveal-mnemonic — vuelve a mostrar la frase de una wallet ya generada. */
export async function revealPolygonWalletMnemonic(
  shopId: string
): Promise<ApiResult<PolygonWalletGenerated>> {
  return postJson(localUrl(shopId, 'reveal-mnemonic'));
}

/** DELETE .../polygon — borra la wallet local (no revoca fondos en cadena). */
export async function deletePolygonWallet(shopId: string): Promise<ApiResult<null>> {
  try {
    const response = await fetch(localUrl(shopId, 'polygon'), { method: 'DELETE' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      return { success: false, error: data?.error || `Error ${response.status}` };
    }
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error de conexión' };
  }
}
