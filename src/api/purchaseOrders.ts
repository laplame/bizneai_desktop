/**
 * Purchase Orders API (Proveedores) - Órdenes de compra a proveedores
 * Endpoints reales: POST/GET /api/mcp/:shopId/purchase-orders, POST /api/mcp/:shopId/purchase-orders/:orderId/receive
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

export type PurchaseOrderStatus = 'pending' | 'ordered' | 'received' | 'cancelled' | 'partial';

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity: number;
  notes?: string;
}

export interface PurchaseOrder {
  _id: string;
  shopId: string;
  supplierName: string;
  supplierContact?: string;
  orderNumber?: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderPayload {
  supplierName: string;
  supplierContact?: string;
  items: Array<{
    productId: string;
    productName: string;
    sku?: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
  subtotal: number;
  tax?: number;
  shipping?: number;
  total: number;
  notes?: string;
  createdBy?: string;
  expectedDeliveryDate?: string;
}

interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  /** true si vale la pena reintentar más tarde (sin conexión, 5xx, timeout). */
  retriable?: boolean;
}

async function postJson<T>(url: string, body: unknown): Promise<ApiResult<T>> {
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
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error de conexión',
      retriable: isNetworkFailure(err) || !navigator.onLine,
    };
  }
}

/** POST /api/mcp/:shopId/purchase-orders — crea una orden de compra a proveedor. */
export async function createPurchaseOrder(
  shopId: string,
  payload: CreatePurchaseOrderPayload
): Promise<ApiResult<{ purchaseOrder: PurchaseOrder }>> {
  return postJson(mcpUrl(shopId, 'purchase-orders'), payload);
}

/** GET /api/mcp/:shopId/purchase-orders — lista órdenes, paginado, filtrable por estado. */
export async function getPurchaseOrders(
  shopId: string,
  params?: { status?: PurchaseOrderStatus; page?: number; limit?: number }
): Promise<
  ApiResult<{
    orders: PurchaseOrder[];
    pagination: { currentPage: number; totalPages: number; totalOrders: number; limit: number };
  }>
> {
  const query: Record<string, string> = {};
  if (params?.status) query.status = params.status;
  if (params?.page) query.page = String(params.page);
  if (params?.limit) query.limit = String(params.limit);
  try {
    const response = await fetch(mcpUrl(shopId, 'purchase-orders', query), { headers: { Accept: 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      return { success: false, error: data?.error || data?.message || `Error ${response.status}` };
    }
    return { success: true, data: data?.data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error de conexión' };
  }
}

/** POST /api/mcp/:shopId/purchase-orders/:orderId/receive — registra ítems recibidos (actualiza stock). */
export async function receivePurchaseOrder(
  shopId: string,
  orderId: string,
  receivedItems: Array<{ productId: string; quantity: number }>
): Promise<ApiResult<{ order: PurchaseOrder }>> {
  return postJson(mcpUrl(shopId, `purchase-orders/${orderId}/receive`), { receivedItems });
}
