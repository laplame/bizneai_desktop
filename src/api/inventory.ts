// Inventory API Service
import { apiRequest } from './client';
import { 
  InventoryUpdate, 
  CreateInventoryUpdateRequest, 
  InventoryStatus,
  InventoryAlert,
  InventoryStats,
  InventoryQueryParams,
  ApiResponse 
} from '../types/api';

export const inventoryAPI = {
  // Update inventory for a shop
  async updateInventory(shopId: string, updateData: CreateInventoryUpdateRequest): Promise<ApiResponse<InventoryUpdate>> {
    return apiRequest<InventoryUpdate>(`/inventory/shop/${shopId}`, {
      method: 'POST',
      body: JSON.stringify(updateData),
    });
  },

  // Get inventory status for a shop
  async getInventoryStatus(shopId: string, params?: InventoryQueryParams): Promise<ApiResponse<InventoryStatus[]>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/inventory/shop/${shopId}?${queryString}` : `/inventory/shop/${shopId}`;
    
    return apiRequest<InventoryStatus[]>(endpoint);
  },

  // Get inventory alerts for a shop
  async getInventoryAlerts(shopId: string, type: string = 'all'): Promise<ApiResponse<InventoryAlert[]>> {
    return apiRequest<InventoryAlert[]>(`/inventory/shop/${shopId}/alerts?type=${type}`);
  },

  // Get inventory statistics for a shop
  async getInventoryStats(shopId: string): Promise<ApiResponse<InventoryStats>> {
    return apiRequest<InventoryStats>(`/inventory/shop/${shopId}/stats`);
  },

  // Bulk inventory update for a shop
  async bulkUpdateInventory(shopId: string, updates: CreateInventoryUpdateRequest[]): Promise<ApiResponse<InventoryUpdate[]>> {
    return apiRequest<InventoryUpdate[]>(`/inventory/shop/${shopId}/bulk-update`, {
      method: 'POST',
      body: JSON.stringify({ updates }),
    });
  }
}; 