// Waitlist API Service — siempre upstream https://www.bizneai.com/api/waitlist/…
// (desde localhost/Electron el fetch va a /api/proxy/bizneai vía waitlistApiBase).
import { fetchWaitlistJson } from './waitlistApiBase';
import { buildShopWaitlistPostPayload, mapGetOrdersResponseToEntries } from './waitlistResourceMap';
import { dedupeWaitlistRowsById } from '../utils/waitlistMerge';
import {
  WaitlistEntry,
  CreateWaitlistEntryRequest,
  WaitlistQueryParams,
  ApiResponse,
} from '../types/api';

async function wlGet<T>(path: string): Promise<ApiResponse<T>> {
  return (await fetchWaitlistJson(path, { method: 'GET' })) as ApiResponse<T>;
}

async function wlPost<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return (await fetchWaitlistJson(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })) as ApiResponse<T>;
}

export const waitlistAPI = {
  /**
   * POST /api/waitlist/shop/:shopId — shopId solo en URL; cuerpo alineado con WaitlistEntrySchema.
   * Respuesta 201: { success, data, message }.
   */
  async addToShopWaitlist(shopId: string, entryData: CreateWaitlistEntryRequest): Promise<ApiResponse<WaitlistEntry>> {
    const path = `/waitlist/shop/${encodeURIComponent(shopId)}`;
    return wlPost<WaitlistEntry>(path, buildShopWaitlistPostPayload(entryData));
  },

  /**
   * GET /api/waitlist/entries?shopId=… y, si no hay datos o falla el listado genérico (p. ej. ruta /:email en prod),
   * fallback GET /api/waitlist/entries/source/local?… (ruta fija; devuelve documentos POS).
   */
  async getWaitlistEntries(shopId: string, params?: WaitlistQueryParams): Promise<ApiResponse<WaitlistEntry[]>> {
    const queryParams = new URLSearchParams({ shopId });

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const qs = queryParams.toString();

    try {
      const raw = await fetchWaitlistJson(`/waitlist/entries?${qs}`, { method: 'GET' });
      if (raw && typeof raw === 'object') {
        const o = raw as Record<string, unknown>;
        if (o.success === true && Array.isArray(o.data) && o.data.length > 0) {
          return { success: true, data: o.data as WaitlistEntry[] };
        }
      }

      const rawLocal = await fetchWaitlistJson(`/waitlist/entries/source/local?${qs}`, { method: 'GET' });
      if (rawLocal && typeof rawLocal === 'object') {
        const o2 = rawLocal as Record<string, unknown>;
        if (o2.success === true && Array.isArray(o2.data) && o2.data.length > 0) {
          return { success: true, data: o2.data as WaitlistEntry[] };
        }
      }

      if (raw && typeof raw === 'object') {
        const o = raw as Record<string, unknown>;
        if (o.success === true && Array.isArray(o.data)) {
          return { success: true, data: o.data as WaitlistEntry[] };
        }
      }

      return { success: true, data: [] };
    } catch (e) {
      console.error('[waitlist] getWaitlistEntries', e);
      return {
        success: false,
        data: [],
        error: e instanceof Error ? e.message : 'Error de red',
      };
    }
  },

  /** GET /api/waitlist/entries/:id?shopId=... — una entrada */
  async getWaitlistEntryById(shopId: string, entryId: string): Promise<ApiResponse<WaitlistEntry>> {
    const qs = new URLSearchParams({ shopId }).toString();
    return wlGet<WaitlistEntry>(`/waitlist/entries/${encodeURIComponent(entryId)}?${qs}`);
  },

  /**
   * PATCH /api/waitlist/entries/:id/status?shopId=… — sincroniza estado (p. ej. completed tras cobro POS).
   * Upstream y servidor local de desarrollo: cuerpo `{ status }`.
   */
  async patchWaitlistEntryStatus(
    shopId: string,
    entryId: string,
    status: 'waiting' | 'preparing' | 'ready' | 'completed'
  ): Promise<ApiResponse<WaitlistEntry>> {
    const qs = new URLSearchParams({ shopId }).toString();
    const path = `/waitlist/entries/${encodeURIComponent(entryId)}/status?${qs}`;
    try {
      const raw = await fetchWaitlistJson(path, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (raw && typeof raw === 'object') {
        const o = raw as Record<string, unknown>;
        if (o.success === true) {
          return { success: true, data: o.data as WaitlistEntry };
        }
        return {
          success: false,
          data: {} as WaitlistEntry,
          error: typeof o.error === 'string' ? o.error : 'No se pudo actualizar el estado en waitlist',
        };
      }
      return { success: false, data: {} as WaitlistEntry, error: 'Respuesta waitlist inválida' };
    } catch (e) {
      console.error('[waitlist] patchWaitlistEntryStatus', e);
      return {
        success: false,
        data: {} as WaitlistEntry,
        error: e instanceof Error ? e.message : 'Error de red',
      };
    }
  },

  /** GET /api/waitlist/entries/source/:source?shopId=... */
  async getWaitlistEntriesBySource(
    shopId: string,
    source: 'local' | 'online',
    params?: Omit<WaitlistQueryParams, 'source'>
  ): Promise<ApiResponse<WaitlistEntry[]>> {
    const queryParams = new URLSearchParams({ shopId });
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const q = queryParams.toString();
    return wlGet<WaitlistEntry[]>(`/waitlist/entries/source/${source}?${q}`);
  },

  /** GET /api/waitlist/entries/status/:status?shopId=... */
  async getWaitlistEntriesByStatus(
    shopId: string,
    status: 'waiting' | 'preparing' | 'ready' | 'completed',
    params?: Omit<WaitlistQueryParams, 'status'>
  ): Promise<ApiResponse<WaitlistEntry[]>> {
    const queryParams = new URLSearchParams({ shopId });
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const q = queryParams.toString();
    return wlGet<WaitlistEntry[]>(`/waitlist/entries/status/${status}?${q}`);
  },

  /**
   * GET /api/waitlist/orders?shopId=… — formato “app” (orderName, id, ítems aplanados).
   * En producción, si no envías `source`, el API suele filtrar por **online** y los pedidos POS (`local`) no aparecen.
   * Si `source` está omitido, se piden **local** y **online** y se deduplican por `_id`.
   */
  async getWaitlistOrders(params: {
    shopId: string;
    page?: number;
    limit?: number;
    source?: 'local' | 'online';
    status?: string;
    customerEmail?: string;
  }): Promise<ApiResponse<WaitlistEntry[]>> {
    const buildQs = (source: 'local' | 'online' | undefined) => {
      const queryParams = new URLSearchParams({ shopId: params.shopId });
      if (params.page != null) queryParams.set('page', String(params.page));
      if (params.limit != null) queryParams.set('limit', String(params.limit));
      if (source !== undefined) queryParams.set('source', source);
      if (params.status) queryParams.set('status', params.status);
      if (params.customerEmail) queryParams.set('customerEmail', params.customerEmail);
      return queryParams.toString();
    };

    const fetchOrdersOnce = async (source?: 'local' | 'online') => {
      const raw = await fetchWaitlistJson(`/waitlist/orders?${buildQs(source)}`, { method: 'GET' });
      return mapGetOrdersResponseToEntries(raw);
    };

    try {
      if (params.source !== undefined) {
        const mapped = await fetchOrdersOnce(params.source);
        return {
          success: mapped.success,
          data: mapped.data,
          ...(mapped.error ? { error: mapped.error } : {}),
        };
      }

      const local = await fetchOrdersOnce('local');
      const online = await fetchOrdersOnce('online');
      const merged = dedupeWaitlistRowsById(
        [...local.data, ...online.data] as { _id?: string }[]
      ) as WaitlistEntry[];

      return {
        success: local.success || online.success,
        data: merged,
      };
    } catch (e) {
      console.error('[waitlist] getWaitlistOrders', e);
      return {
        success: false,
        data: [],
        error: e instanceof Error ? e.message : 'Error de red',
      };
    }
  },

  // Add customer to waitlist (legacy)
  async addCustomerToWaitlist(customerData: {
    customerName: string;
    phoneNumber: string;
    partySize: number;
    estimatedWaitTime: number;
    shopId: string;
  }): Promise<ApiResponse<WaitlistEntry>> {
    return wlPost<WaitlistEntry>('/waitlist', customerData);
  },

  // Get all waitlist entries
  async getAllWaitlistEntries(params?: { shopId?: string; status?: string; page?: number; limit?: number }): Promise<ApiResponse<WaitlistEntry[]>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/waitlist?${queryString}` : '/waitlist';

    return wlGet<WaitlistEntry[]>(endpoint);
  },

  // Add item to waitlist with details
  async addWaitlistEntry(entryData: {
    customerName: string;
    phoneNumber: string;
    partySize: number;
    estimatedWaitTime: number;
    shopId: string;
    notes?: string;
  }): Promise<ApiResponse<WaitlistEntry>> {
    return wlPost<WaitlistEntry>('/waitlist/entries', entryData);
  },

  // Load waitlist item to cart
  async loadWaitlistItemToCart(id: string): Promise<ApiResponse<any>> {
    return wlPost<any>(`/waitlist/entries/${id}/load`, {});
  },

  // Receive online order
  async receiveOnlineOrder(orderData: {
    customerName: string;
    phoneNumber: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    totalAmount: number;
    orderType: string;
    shopId: string;
  }): Promise<ApiResponse<WaitlistEntry>> {
    return wlPost<WaitlistEntry>('/waitlist/online-orders', orderData);
  },

  // Get waitlist statistics
  async getWaitlistStats(shopId: string): Promise<ApiResponse<any>> {
    return wlGet<any>(`/waitlist/stats?shopId=${shopId}`);
  },
}; 