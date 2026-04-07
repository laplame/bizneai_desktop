/**
 * Roles Sync API - Sincronizar roles de la tienda
 * POST /api/shops/:shopId/roles/sync
 * @see docs/# Datos enviados al servidor y endpoints.md
 */

import { getShopId } from '../utils/shopIdHelper';
import { getLocalApiOrigin, shouldUseSalesMcpProxy } from '../utils/localApiBase';

const getApiOrigin = (): string => 'https://www.bizneai.com';

export interface RoleUser {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  /** PIN de 4 dígitos para desbloquear el POS (opcional). Se envía en roles/sync. */
  screenLockPin?: string;
}

export interface RoleSyncItem {
  role: string;
  users?: RoleUser[];
}

export interface RolesSyncRequest {
  shopId: string;
  roles: RoleSyncItem[];
  timestamp: string;
}

export interface RolesSyncResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Sincroniza roles al servidor
 * POST /api/shops/:shopId/roles/sync
 * Base: https://www.bizneai.com/api (según documentación)
 */
export async function syncRolesToServer(
  payload: Omit<RolesSyncRequest, 'shopId'> & { shopId?: string }
): Promise<RolesSyncResponse> {
  const shopId = payload.shopId ?? getShopId();
  if (!shopId) {
    return { success: false, error: 'Shop ID no configurado' };
  }

  const url = shouldUseSalesMcpProxy()
    ? `${getLocalApiOrigin()}/api/proxy/shops/${shopId}/roles/sync`
    : `${getApiOrigin()}/api/shops/${shopId}/roles/sync`;

  const body: RolesSyncRequest = {
    shopId,
    roles: payload.roles,
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || data?.message || `Error ${response.status}`,
      };
    }

    return {
      success: true,
      message: data?.message,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error de conexión';
    return { success: false, error: message };
  }
}
