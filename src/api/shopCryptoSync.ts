/**
 * Sincroniza la configuración de "Pagos con Cripto" del desktop hacia
 * sites/bizneaiWeb — mismo endpoint real que usa la app móvil:
 * PUT /api/shop/:id con { cryptoAddresses, enabledCryptocurrencies, ownerPasscode }.
 * El servidor cifra cryptoAddresses con una llave derivada del ownerPasscode;
 * sin un passcode de owner válido, la escritura se ignora (no borra nada).
 *
 * Requiere sesión JWT válida (ver shopAuthService.ts) — confirmado en vivo
 * contra producción que SHOP_AUTH_ENFORCE está en modo enforce: sin
 * Authorization: Bearer, el servidor responde 401 antes de siquiera evaluar
 * ownerPasscode. El caller debe llamar ensureShopSession() antes de esto.
 *
 * Nota: `shopsAPI.updateShopCryptoSettings` (src/api/shops.ts) apunta a
 * PUT /shop/:id/crypto, una ruta que no existe en el backend real — no usar.
 * Este módulo usa el mismo passthrough /api/proxy/bizneai que ya prueban
 * financialReports.ts / waitlistApiBase.ts (evita CORS en dev/Electron).
 */

import { getLocalApiOrigin, shouldUseSalesMcpProxy } from '../utils/localApiBase';
import { buildShopAuthHeaders } from '../services/shopAuthService';

const getApiOrigin = (): string => 'https://www.bizneai.com';

function shopUrl(shopId: string): string {
  return shouldUseSalesMcpProxy()
    ? `${getLocalApiOrigin()}/api/proxy/bizneai/shop/${shopId}`
    : `${getApiOrigin()}/api/shop/${shopId}`;
}

interface SyncResult {
  success: boolean;
  error?: string;
  /** true si el servidor rechazó por falta/expiración de sesión — el caller debe volver a loguear. */
  needsSession?: boolean;
}

/**
 * @param cryptoAddresses direcciones por moneda, p. ej. { luxae: '0x...', bitcoin: '...' }
 * @param enabledCryptocurrencies claves habilitadas (mismo set de `cryptoAddresses`)
 * @param ownerPasscode passcode del owner — nunca se cachea, se pide en el momento
 */
export async function syncShopCryptoAddresses(
  shopId: string,
  cryptoAddresses: Record<string, string>,
  enabledCryptocurrencies: string[],
  ownerPasscode: string
): Promise<SyncResult> {
  try {
    const response = await fetch(shopUrl(shopId), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...buildShopAuthHeaders(),
      },
      body: JSON.stringify({ cryptoAddresses, enabledCryptocurrencies, ownerPasscode }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      return { success: false, error: data?.error || 'Sesión expirada', needsSession: true };
    }
    if (!response.ok || data?.success === false) {
      return { success: false, error: data?.error || data?.message || `Error ${response.status}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error de conexión' };
  }
}
