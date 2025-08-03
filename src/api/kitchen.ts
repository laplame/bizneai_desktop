// Kitchen API Service
import { apiRequest } from './client';
import { 
  KitchenOrder, 
  CreateKitchenOrderRequest, 
  KitchenOrderQueryParams,
  ApiResponse 
} from '../types/api';

export const kitchenAPI = {
  // Get kitchen orders with filtering and pagination
  async getOrders(params?: KitchenOrderQueryParams): Promise<ApiResponse<KitchenOrder[]>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/kitchen/orders?${queryString}` : '/kitchen/orders';
    
    return apiRequest<KitchenOrder[]>(endpoint);
  },

  // Create a new kitchen order
  async createOrder(orderData: CreateKitchenOrderRequest): Promise<ApiResponse<KitchenOrder>> {
    return apiRequest<KitchenOrder>('/kitchen/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Get kitchen order by ID
  async getOrderById(id: string, shopId: string): Promise<ApiResponse<KitchenOrder>> {
    return apiRequest<KitchenOrder>(`/kitchen/orders/${id}?shopId=${shopId}`);
  },

  // Update kitchen order
  async updateOrder(id: string, shopId: string, orderData: Partial<CreateKitchenOrderRequest>): Promise<ApiResponse<KitchenOrder>> {
    return apiRequest<KitchenOrder>(`/kitchen/orders/${id}?shopId=${shopId}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  },

  // Partial update kitchen order
  async partialUpdateOrder(id: string, shopId: string, orderData: Partial<CreateKitchenOrderRequest>): Promise<ApiResponse<KitchenOrder>> {
    return apiRequest<KitchenOrder>(`/kitchen/orders/${id}?shopId=${shopId}`, {
      method: 'PATCH',
      body: JSON.stringify(orderData),
    });
  },

  // Delete kitchen order
  async deleteOrder(id: string, shopId: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/kitchen/orders/${id}?shopId=${shopId}`, {
      method: 'DELETE',
    });
  }
}; 