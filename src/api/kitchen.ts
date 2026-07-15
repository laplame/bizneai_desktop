// Kitchen API Service
// Usa la API de bizneai.com cuando hay shopId configurado (mismo que la web)
import { getLocalApiOrigin, shouldUseSalesMcpProxy } from '../utils/localApiBase';

const KITCHEN_API_BASE = 'https://www.bizneai.com/api';

/**
 * En localhost/Electron, bizneai.com responde CORS con
 * `Access-Control-Allow-Origin: https://www.bizneai.com` fijo (no refleja el
 * origin real), así que un fetch directo desde el renderer se bloquea en
 * silencio. Igual que `waitlistApiBase.ts`, se pasa por el proxy del server
 * local (`/api/proxy/bizneai/...`, sin restricción CORS entre procesos Node)
 * y el upstream real sigue siendo bizneai.com.
 */
function resolveKitchenApiBase(): string {
  if (shouldUseSalesMcpProxy()) {
    return `${getLocalApiOrigin().replace(/\/$/, '')}/api/proxy/bizneai`;
  }
  return KITCHEN_API_BASE;
}

async function kitchenFetch<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(`${resolveKitchenApiBase()}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      ...options
    });
    const json = await res.json();
    return json;
  } catch (e) {
    console.error('Kitchen API error:', e);
    return { success: false, error: String(e) };
  }
}

import { 
  KitchenOrder, 
  CreateKitchenOrderRequest, 
  KitchenOrderQueryParams,
  ApiResponse 
} from '../types/api';

export const kitchenAPI = {
  async getOrders(params?: KitchenOrderQueryParams & { shopId?: string }): Promise<ApiResponse<KitchenOrder[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    const qs = queryParams.toString();
    const endpoint = qs ? `/kitchen/orders?${qs}` : '/kitchen/orders';
    return kitchenFetch<KitchenOrder[]>(endpoint) as Promise<ApiResponse<KitchenOrder[]>>;
  },

  async createOrder(orderData: CreateKitchenOrderRequest): Promise<ApiResponse<KitchenOrder>> {
    return kitchenFetch<KitchenOrder>('/kitchen/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }) as Promise<ApiResponse<KitchenOrder>>;
  },

  async getOrderById(id: string, shopId: string): Promise<ApiResponse<KitchenOrder>> {
    return kitchenFetch<KitchenOrder>(`/kitchen/orders/${id}?shopId=${shopId}`) as Promise<ApiResponse<KitchenOrder>>;
  },

  async updateOrder(id: string, shopId: string, orderData: Partial<CreateKitchenOrderRequest>): Promise<ApiResponse<KitchenOrder>> {
    return kitchenFetch<KitchenOrder>(`/kitchen/orders/${id}?shopId=${shopId}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    }) as Promise<ApiResponse<KitchenOrder>>;
  },

  async partialUpdateOrder(id: string, shopId: string, orderData: Partial<CreateKitchenOrderRequest>): Promise<ApiResponse<KitchenOrder>> {
    return kitchenFetch<KitchenOrder>(`/kitchen/orders/${id}?shopId=${shopId}`, {
      method: 'PATCH',
      body: JSON.stringify(orderData),
    }) as Promise<ApiResponse<KitchenOrder>>;
  },

  async deleteOrder(id: string, shopId: string): Promise<ApiResponse<void>> {
    return kitchenFetch<void>(`/kitchen/orders/${id}?shopId=${shopId}`, {
      method: 'DELETE',
    }) as Promise<ApiResponse<void>>;
  },

  /** Purga pedidos de cocina. beforeToday = ayer+ (todos); servedToday = hoy solo entregados */
  async purgeOrders(
    shopId: string,
    scope: 'beforeToday' | 'all' | 'served' | 'servedToday' = 'beforeToday'
  ): Promise<ApiResponse<{ deleted: number; scope: string }>> {
    return kitchenFetch<{ deleted: number; scope: string }>('/kitchen/orders/purge', {
      method: 'POST',
      body: JSON.stringify({ shopId, scope }),
    }) as Promise<ApiResponse<{ deleted: number; scope: string }>>;
  },

  /**
   * OLAP de cocina — celdas agregadas por dimensiones/medidas.
   * GET /api/kitchen/stats/olap
   */
  async getOlapStats(params: {
    shopId: string;
    dateFrom?: string;
    dateTo?: string;
    grain?: 'hour' | 'day' | 'week' | 'month';
    dimensions?: string;
    measures?: string;
    status?: string;
    limit?: number;
  }): Promise<
    ApiResponse<{
      shopId: string;
      grain: string;
      dimensions: string[];
      measures: string[];
      cells: Array<{ dimensions: Record<string, string | number | null>; metrics: Record<string, number> }>;
      totals: Record<string, number>;
      meta: { factCollection: string; cellCount: number; truncated: boolean };
    }>
  > {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    return kitchenFetch(`/kitchen/stats/olap?${queryParams.toString()}`) as Promise<
      ApiResponse<{
        shopId: string;
        grain: string;
        dimensions: string[];
        measures: string[];
        cells: Array<{ dimensions: Record<string, string | number | null>; metrics: Record<string, number> }>;
        totals: Record<string, number>;
        meta: { factCollection: string; cellCount: number; truncated: boolean };
      }>
    >;
  },
}; 