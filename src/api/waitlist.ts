// Waitlist API Service
import { apiRequest } from './client';
import { 
  WaitlistEntry, 
  CreateWaitlistEntryRequest, 
  WaitlistQueryParams,
  ApiResponse 
} from '../types/api';

export const waitlistAPI = {
  // Add item to shop waitlist
  async addToShopWaitlist(shopId: string, entryData: CreateWaitlistEntryRequest): Promise<ApiResponse<WaitlistEntry>> {
    return apiRequest<WaitlistEntry>(`/waitlist/shop/${shopId}`, {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  },

  // Get waitlist entries for a shop
  async getWaitlistEntries(shopId: string, params?: WaitlistQueryParams): Promise<ApiResponse<WaitlistEntry[]>> {
    const queryParams = new URLSearchParams({ shopId });
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/waitlist/entries?${queryString}`;
    
    return apiRequest<WaitlistEntry[]>(endpoint);
  },

  // Add customer to waitlist (legacy)
  async addCustomerToWaitlist(customerData: {
    customerName: string;
    phoneNumber: string;
    partySize: number;
    estimatedWaitTime: number;
    shopId: string;
  }): Promise<ApiResponse<WaitlistEntry>> {
    return apiRequest<WaitlistEntry>('/waitlist', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
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
    
    return apiRequest<WaitlistEntry[]>(endpoint);
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
    return apiRequest<WaitlistEntry>('/waitlist/entries', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  },

  // Load waitlist item to cart
  async loadWaitlistItemToCart(id: string): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/waitlist/entries/${id}/load`, {
      method: 'POST',
    });
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
    return apiRequest<WaitlistEntry>('/waitlist/online-orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Get waitlist statistics
  async getWaitlistStats(shopId: string): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/waitlist/stats?shopId=${shopId}`);
  }
}; 