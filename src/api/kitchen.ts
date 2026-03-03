// Kitchen API Service
// Usa la API de bizneai.com cuando hay shopId configurado (mismo que la web)
const KITCHEN_API_BASE = 'https://www.bizneai.com/api';

async function kitchenFetch<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(`${KITCHEN_API_BASE}${endpoint}`, {
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
  }
}; 