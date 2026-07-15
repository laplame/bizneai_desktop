/**
 * Sesión JWT de tienda (shop-app auth) para el desktop — puerto del mismo
 * flujo que ya usa `app/BizneAI` (`src/services/shopAuthService.ts` allá).
 * Necesario porque `sites/bizneaiWeb` exige un Bearer válido en toda
 * escritura protegida de /api/shop cuando SHOP_AUTH_ENFORCE=enforce
 * (confirmado en producción: PUT /api/shop/:id devuelve 401 sin este token,
 * el ownerPasscode en el body no alcanza por sí solo).
 *
 * El login usa el mismo passcode del owner que ya se pide para cifrar
 * cryptoAddresses — no hace falta una pantalla de login separada, se puede
 * obtener la sesión en el mismo paso que cualquier escritura protegida.
 */
import { getLocalApiOrigin, shouldUseSalesMcpProxy } from '../utils/localApiBase';
import { scheduleMirrorKeyToSqlite } from './posPersistService';

const TOKEN_KEY = 'bizneai-shop-session-token';
const EXPIRES_KEY = 'bizneai-shop-session-expires-at';
const INSTALLATION_ID_KEY = 'bizneai-installation-id';

function bizneaiOrigin(): string {
  return 'https://www.bizneai.com';
}

function apiBase(): string {
  return shouldUseSalesMcpProxy()
    ? `${getLocalApiOrigin().replace(/\/$/, '')}/api/proxy/bizneai`
    : `${bizneaiOrigin()}/api`;
}

export function getOrCreateInstallationId(): string {
  let id = localStorage.getItem(INSTALLATION_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `desktop-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(INSTALLATION_ID_KEY, id);
    scheduleMirrorKeyToSqlite(INSTALLATION_ID_KEY);
  }
  return id;
}

function parseExpiresInMs(expiresIn: string): number {
  const m = expiresIn.trim().match(/^(\d+)([smhd])$/i);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const multipliers: Record<string, number> = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return n * (multipliers[unit] ?? multipliers.d);
}

export function getShopSessionToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  const expiresAt = Number(localStorage.getItem(EXPIRES_KEY) || 0);
  if (expiresAt && Date.now() > expiresAt) {
    clearShopSessionToken();
    return null;
  }
  return token;
}

export function saveShopSessionToken(token: string, expiresIn?: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  scheduleMirrorKeyToSqlite(TOKEN_KEY);
  if (expiresIn) {
    const expiresAt = Date.now() + parseExpiresInMs(expiresIn);
    localStorage.setItem(EXPIRES_KEY, String(expiresAt));
    scheduleMirrorKeyToSqlite(EXPIRES_KEY);
  }
}

export function clearShopSessionToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  scheduleMirrorKeyToSqlite(TOKEN_KEY);
  scheduleMirrorKeyToSqlite(EXPIRES_KEY);
}

export function buildShopAuthHeaders(): Record<string, string> {
  const token = getShopSessionToken();
  const headers: Record<string, string> = { 'X-Installation-Id': getOrCreateInstallationId() };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export interface ShopAuthLoginResult {
  success: boolean;
  error?: string;
  token?: string;
}

/**
 * POST /shop/auth/login — identifier puede ser storeName o username.
 * Reutiliza el token existente si sigue vigente (evita relogin en cada sync).
 */
export async function shopAuthLogin(
  identifier: string,
  passcode: string,
  identifierField: 'storeName' | 'username' = 'storeName'
): Promise<ShopAuthLoginResult> {
  const installationId = getOrCreateInstallationId();
  try {
    const response = await fetch(`${apiBase()}/shop/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Installation-Id': installationId },
      body: JSON.stringify({
        [identifierField]: identifier.trim(),
        passcode: passcode.trim(),
        currentInstallation: { installationId, roleId: null },
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      return { success: false, error: data?.error || `Error ${response.status}` };
    }
    const token = data?.data?.token as string | undefined;
    const expiresIn = (data?.data?.expiresIn as string | undefined) || '7d';
    if (token) saveShopSessionToken(token, expiresIn);
    return { success: true, token };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error de conexión' };
  }
}

/** Asegura una sesión válida: reusa el token cacheado o hace login de nuevo. */
export async function ensureShopSession(
  identifier: string,
  passcode: string,
  identifierField: 'storeName' | 'username' = 'storeName'
): Promise<ShopAuthLoginResult> {
  const existing = getShopSessionToken();
  if (existing) return { success: true, token: existing };
  return shopAuthLogin(identifier, passcode, identifierField);
}
