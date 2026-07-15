/**
 * Cash Register API (Caja) - Sesiones de caja y movimientos de efectivo
 * Endpoints reales: POST/GET /api/mcp/:shopId/cash-register/{open,close,status,movements,sessions}
 * @see docs/API_CASH_REGISTER_SPEC.md
 */

import { getLocalApiOrigin, shouldUseSalesMcpProxy } from '../utils/localApiBase';
import { isRetriableHttpStatus, isNetworkFailure } from '../utils/httpRetriable';

const getApiOrigin = (): string => 'https://www.bizneai.com';

function mcpUrl(shopId: string, subpath: string, query?: Record<string, string>): string {
  const qs = query ? new URLSearchParams(query).toString() : '';
  const suffix = qs ? `?${qs}` : '';
  return shouldUseSalesMcpProxy()
    ? `${getLocalApiOrigin()}/api/proxy/mcp/${shopId}/${subpath}${suffix}`
    : `${getApiOrigin()}/api/mcp/${shopId}/${subpath}${suffix}`;
}

export interface CashRegisterApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  /** true si vale la pena reintentar más tarde (sin conexión, 5xx, timeout). */
  retriable?: boolean;
}

export type CashMovementType = 'saleCash' | 'refundCash' | 'cashIn' | 'cashOut' | 'adjustment';

export interface CashRegisterStatusData {
  hasActiveSession: boolean;
  sessionId?: string;
  openedAt?: string;
  openedBy?: string;
  openingAmount?: number;
  balance?: number;
  status?: 'open' | 'closed';
  lastSession?: {
    sessionId: string;
    closedAt: string;
    closingAmount: number;
  };
}

export interface CashRegisterSessionData {
  id: string;
  openedAt: string;
  openedBy?: string;
  openingAmount: number;
  closedAt?: string;
  closedBy?: string;
  closingAmount?: number;
  expectedAmount?: number;
  variance?: number;
  status: 'open' | 'closed' | 'archived';
}

export interface CashMovementResultData {
  movementId: string;
  sessionId: string;
  type: CashMovementType;
  amount: number;
  balance: number;
  timestamp: string;
}

function sourceFields(): { sourceDeviceId: string; clientTimestampUnixMs: number } {
  return { sourceDeviceId: 'desktop', clientTimestampUnixMs: Date.now() };
}

async function postJson<T>(url: string, body: unknown): Promise<CashRegisterApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      return {
        success: false,
        error: data?.error || data?.message || `Error ${response.status}`,
        retriable: isRetriableHttpStatus(response.status),
      };
    }
    return { success: true, data: data?.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error de conexión';
    return { success: false, error: message, retriable: isNetworkFailure(err) || !navigator.onLine };
  }
}

async function getJson<T>(url: string): Promise<CashRegisterApiResult<T>> {
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      return { success: false, error: data?.error || data?.message || `Error ${response.status}` };
    }
    return { success: true, data: data?.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error de conexión';
    return { success: false, error: message };
  }
}

/** POST /api/mcp/:shopId/cash-register/open — abre sesión de caja. */
export async function openCashRegister(
  shopId: string,
  params: { openedBy?: string; openingAmount: number; notes?: string }
): Promise<CashRegisterApiResult<{ sessionId: string; openedAt: string; openingAmount: number; status: string; balance: number }>> {
  return postJson(mcpUrl(shopId, 'cash-register/open'), { ...params, ...sourceFields() });
}

/** POST /api/mcp/:shopId/cash-register/close — cierra la sesión activa. */
export async function closeCashRegister(
  shopId: string,
  params: { closingAmount: number; closedBy?: string; notes?: string }
): Promise<
  CashRegisterApiResult<{
    sessionId: string;
    status: string;
    closingAmount: number;
    expectedAmount: number;
    variance: number;
    closedAt: string;
  }>
> {
  return postJson(mcpUrl(shopId, 'cash-register/close'), { ...params, ...sourceFields() });
}

/** GET /api/mcp/:shopId/cash-register/status — estado y balance actual. */
export async function getCashRegisterStatus(shopId: string): Promise<CashRegisterApiResult<CashRegisterStatusData>> {
  return getJson(mcpUrl(shopId, 'cash-register/status'));
}

/** POST /api/mcp/:shopId/cash-register/movements — registra un movimiento de efectivo. */
export async function addCashMovement(
  shopId: string,
  params: { type: CashMovementType; amount: number; referenceId?: string; notes?: string }
): Promise<CashRegisterApiResult<CashMovementResultData>> {
  return postJson(mcpUrl(shopId, 'cash-register/movements'), { ...params, ...sourceFields() });
}

/** GET /api/mcp/:shopId/cash-register/sessions — historial de sesiones, paginado. */
export async function getCashRegisterSessions(
  shopId: string,
  params?: { page?: number; limit?: number; status?: 'open' | 'closed' | 'all'; dateFrom?: string; dateTo?: string }
): Promise<CashRegisterApiResult<{ sessions: CashRegisterSessionData[]; pagination: { page: number; limit: number; total: number } }>> {
  const query: Record<string, string> = {};
  if (params?.page) query.page = String(params.page);
  if (params?.limit) query.limit = String(params.limit);
  if (params?.status) query.status = params.status;
  if (params?.dateFrom) query.dateFrom = params.dateFrom;
  if (params?.dateTo) query.dateTo = params.dateTo;
  return getJson(mcpUrl(shopId, 'cash-register/sessions', query));
}
