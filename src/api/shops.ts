// Shops API Service
import { apiRequest } from './client';
import { 
  Shop, 
  CreateShopRequest, 
  StoreType, 
  ShopQueryParams,
  ApiResponse 
} from '../types/api';

export const shopsAPI = {
  // Get all shops with filtering and pagination
  async getShops(params?: ShopQueryParams): Promise<ApiResponse<Shop[]>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/shop?${queryString}` : '/shop';
    
    return apiRequest<Shop[]>(endpoint);
  },

  // Create a new shop
  async createShop(shopData: CreateShopRequest): Promise<ApiResponse<Shop>> {
    return apiRequest<Shop>('/shop', {
      method: 'POST',
      body: JSON.stringify(shopData),
    });
  },

  // Get shop by ID
  async getShopById(id: string): Promise<ApiResponse<Shop>> {
    return apiRequest<Shop>(`/shop/${id}`);
  },

  // Update shop
  async updateShop(id: string, shopData: Partial<CreateShopRequest>): Promise<ApiResponse<Shop>> {
    return apiRequest<Shop>(`/shop/${id}`, {
      method: 'PUT',
      body: JSON.stringify(shopData),
    });
  },

  // Delete shop
  async deleteShop(id: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/shop/${id}`, {
      method: 'DELETE',
    });
  },

  // Get store types
  async getStoreTypes(): Promise<ApiResponse<StoreType[]>> {
    return apiRequest<StoreType[]>('/shop/store-types');
  },

  // Test shop endpoint
  async testShop(): Promise<ApiResponse<any>> {
    return apiRequest<any>('/shop/test');
  },

  // Get shop crypto settings
  async getShopCryptoSettings(id: string): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/shop/${id}/crypto`);
  },

  // Update shop crypto settings
  async updateShopCryptoSettings(id: string, cryptoData: any): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/shop/${id}/crypto`, {
      method: 'PUT',
      body: JSON.stringify(cryptoData),
    });
  }
}; 