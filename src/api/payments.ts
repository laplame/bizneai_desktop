// Payments API Service
import { apiRequest } from './client';
import { 
  Payment, 
  CreatePaymentRequest, 
  PaymentStats,
  PaymentQueryParams,
  ApiResponse 
} from '../types/api';

export const paymentsAPI = {
  // Process payment for a shop
  async processPayment(shopId: string, paymentData: CreatePaymentRequest): Promise<ApiResponse<Payment>> {
    return apiRequest<Payment>(`/payments/shop/${shopId}`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  // Get payment history for a shop
  async getPaymentHistory(shopId: string, params?: PaymentQueryParams): Promise<ApiResponse<Payment[]>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/payments/shop/${shopId}?${queryString}` : `/payments/shop/${shopId}`;
    
    return apiRequest<Payment[]>(endpoint);
  },

  // Get payment statistics for a shop
  async getPaymentStats(shopId: string, period: string = '30d'): Promise<ApiResponse<PaymentStats>> {
    return apiRequest<PaymentStats>(`/payments/shop/${shopId}/stats?period=${period}`);
  }
}; 