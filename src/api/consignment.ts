/**
 * Consignación (Consignment) - marcar productos + reporte de ventas/por-pagar
 * Endpoints reales: PUT /api/mcp/:shopId/products/:productId (campos consignment*)
 *                    GET /api/mcp/:shopId/reports/consignment
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

export interface ConsignmentFields {
  isConsignment: boolean;
  consignmentSupplier?: string;
  consignmentUnitCost?: number;
  consignmentNotes?: string;
}

interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  /** true si vale la pena reintentar más tarde (sin conexión, 5xx, timeout). */
  retriable?: boolean;
}

/** PUT /api/mcp/:shopId/products/:productId — actualiza solo los campos de consignación. */
export async function updateProductConsignment(
  shopId: string,
  productId: string,
  fields: ConsignmentFields
): Promise<ApiResult<unknown>> {
  try {
    const response = await fetch(mcpUrl(shopId, `products/${productId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(fields),
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
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error de conexión',
      retriable: isNetworkFailure(err) || !navigator.onLine,
    };
  }
}

export interface ConsignmentSummary {
  totalUnitsSold: number;
  totalRevenue: number;
  supplierPayable: number;
  storeProfit: number;
  profitMarginPercent: number;
  consignmentProductCount: number;
  transactionCount: number;
  avgTicket: number;
}

export interface ConsignmentAccounting {
  transactionCount: number;
  avgTicket: number;
  incomeStatement: Array<{ line: string; amount: number; type: string }>;
}

export interface ConsignmentSupplierRow {
  supplier: string;
  productCount: number;
  unitsSold: number;
  revenue: number;
  supplierPayable: number;
  storeProfit: number;
  profitMarginPercent: number;
  revenueSharePercent: number;
  payableSharePercent: number;
}

export interface ConsignmentDailyRow {
  date: string;
  unitsSold: number;
  revenue: number;
  supplierPayable: number;
  storeProfit: number;
  profitMarginPercent: number;
}

export interface ConsignmentProductRow {
  rank: number;
  productId: string;
  productName: string;
  category: string;
  supplier: string;
  consignmentUnitCost: number;
  unitPrice: number;
  unitsSold: number;
  revenue: number;
  supplierPayable: number;
  storeProfit: number;
  profitMarginPercent: number;
  revenueSharePercent: number;
  unitsSharePercent: number;
  profitSharePercent: number;
}

export interface ConsignmentPieSlice {
  productId: string;
  label: string;
  revenue: number;
  sharePercent: number;
}

export interface ConsignmentProductOption {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface ConsignmentReportData {
  summary: ConsignmentSummary;
  accounting: ConsignmentAccounting;
  supplierBreakdown: ConsignmentSupplierRow[];
  dailySeries: ConsignmentDailyRow[];
  revenueSharePie: ConsignmentPieSlice[];
  availableProducts: ConsignmentProductOption[];
  byProduct: ConsignmentProductRow[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalInReport: number;
    hasPrev: boolean;
    hasNext: boolean;
  } | null;
  period: { start: string; end: string; days: number } | null;
}

/** GET /api/mcp/:shopId/reports/consignment — reporte de ventas/ganancia/por-pagar de consignación. */
export async function getConsignmentReport(
  shopId: string,
  params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    period?: string;
    category?: string;
    sortBy?: 'revenue' | 'storeProfit' | 'unitsSold' | 'supplierPayable';
    topLimit?: number;
    productId?: string;
  }
): Promise<ApiResult<ConsignmentReportData>> {
  const query: Record<string, string> = {};
  if (params?.page) query.page = String(params.page);
  if (params?.limit) query.limit = String(params.limit);
  if (params?.startDate) query.startDate = params.startDate;
  if (params?.endDate) query.endDate = params.endDate;
  if (params?.period) query.period = params.period;
  if (params?.category) query.category = params.category;
  if (params?.sortBy) query.sortBy = params.sortBy;
  if (params?.topLimit) query.topLimit = String(params.topLimit);
  if (params?.productId) query.productId = params.productId;

  try {
    const response = await fetch(mcpUrl(shopId, 'reports/consignment', query), { headers: { Accept: 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      return { success: false, error: data?.error || data?.message || `Error ${response.status}` };
    }
    return { success: true, data: data?.data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error de conexión' };
  }
}
