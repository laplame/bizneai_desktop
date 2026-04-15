/**
 * Copia en SQLite local (vía API :3000) de respuestas JSON del MCP remoto (bizneai.com).
 * No sustituye al MCP como fuente de verdad: solo respaldo cuando el backend local está activo.
 */

import { getLocalApiOrigin } from '../utils/localApiBase';
import { posBackendHealth } from './posPersistService';

export const MCP_SNAPSHOT = {
  /** GET /api/mcp/:shopId — payload completo */
  root: 'mcp-root',
  /** GET /api/mcp/:shopId/customers */
  customers: 'customers',
} as const;

export async function mirrorMcpPayloadToLocalSql(params: {
  shopId: string;
  resourcePath: string;
  queryKey?: string;
  payload: unknown;
}): Promise<boolean> {
  if (!(await posBackendHealth())) return false;
  const { shopId, resourcePath, payload } = params;
  const queryKey = params.queryKey ?? '';
  if (!shopId || !resourcePath) return false;
  try {
    const r = await fetch(`${getLocalApiOrigin()}/api/pos/mcp-snapshot`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ shopId, resourcePath, queryKey, payload }),
    });
    return r.ok;
  } catch {
    return false;
  }
}
