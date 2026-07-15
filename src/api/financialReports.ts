/**
 * Financial Reports API - Balance, cuentas por pagar/cobrar, estado de resultados
 * Endpoints reales: POST/GET /api/reports/:shopId
 * @see docs/REPORTS_API_SPEC.md
 */

import { getLocalApiOrigin, shouldUseSalesMcpProxy } from '../utils/localApiBase';

const getApiOrigin = (): string => 'https://www.bizneai.com';

export interface FinancialReportEntry {
  id: string;
  concept: string;
  amount: number;
  date: string;
  notes?: string;
  dueDate?: string;
}

export interface FinancialReportSections {
  assets: FinancialReportEntry[];
  liabilities: FinancialReportEntry[];
  accountsPayable: FinancialReportEntry[];
  accountsReceivable: FinancialReportEntry[];
  incomeStatement: FinancialReportEntry[];
  capital: FinancialReportEntry[];
}

export interface FinancialReportCalculations {
  totalAssets: number;
  totalLiabilities: number;
  capital: number;
  inventoryEstimate: number;
  totalAccountsPayable: number;
  totalAccountsReceivable: number;
  calculationFlow: string;
}

export interface PaymentScheduleItem {
  id: string;
  type: 'payable' | 'receivable';
  concept: string;
  amount: number;
  dueDate: string;
  entryDate: string;
  notes?: string;
  daysUntilDue?: number;
}

export interface FinancialReportPayload {
  timestamp: string;
  sourceDeviceId?: string;
  clientTimestampUnixMs?: number;
  sections: FinancialReportSections;
  calculations: FinancialReportCalculations;
  paymentSchedule: PaymentScheduleItem[];
}

export interface FinancialReportRecord {
  reportId: string;
  timestamp: string;
  appVersion?: string;
  platform?: string;
  deviceId?: string;
  reportsData: {
    sections: FinancialReportSections;
    calculations: FinancialReportCalculations;
    paymentSchedule: PaymentScheduleItem[];
  };
  createdAt: string;
}

function reportsUrl(shopId: string, query?: Record<string, string>): string {
  const qs = query ? new URLSearchParams(query).toString() : '';
  const suffix = qs ? `?${qs}` : '';
  return shouldUseSalesMcpProxy()
    ? `${getLocalApiOrigin()}/api/proxy/bizneai/reports/${shopId}${suffix}`
    : `${getApiOrigin()}/api/reports/${shopId}${suffix}`;
}

/** POST /api/reports/:shopId — envía un snapshot contable completo (crea historial, no upsert). */
export async function sendFinancialReport(
  shopId: string,
  payload: FinancialReportPayload
): Promise<{ success: boolean; error?: string; reportId?: string }> {
  try {
    const response = await fetch(reportsUrl(shopId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      return { success: false, error: data?.error || data?.message || `Error ${response.status}` };
    }
    return { success: true, reportId: data?.data?.reportId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error de conexión' };
  }
}

/** GET /api/reports/:shopId — lista snapshots paginados, más reciente primero. */
export async function getFinancialReports(
  shopId: string,
  params?: { page?: number; limit?: number }
): Promise<{
  success: boolean;
  error?: string;
  reports?: FinancialReportRecord[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}> {
  const query: Record<string, string> = {};
  if (params?.page) query.page = String(params.page);
  if (params?.limit) query.limit = String(params.limit);
  try {
    const response = await fetch(reportsUrl(shopId, query), { headers: { Accept: 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      return { success: false, error: data?.error || data?.message || `Error ${response.status}` };
    }
    return { success: true, reports: data?.data?.reports || [], pagination: data?.data?.pagination };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error de conexión' };
  }
}
