// Orders API Service
import { apiRequest } from './client';
import { 
  Order, 
  CreateOrderRequest, 
  ApiResponse 
} from '../types/api';

export const ordersAPI = {
  // Create a new order
  async createOrder(orderData: CreateOrderRequest): Promise<ApiResponse<Order>> {
    return apiRequest<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Get user orders
  async getUserOrders(userId: string): Promise<ApiResponse<Order[]>> {
    return apiRequest<Order[]>(`/orders/${userId}`);
  },

  // Get order by order number
  async getOrderByNumber(orderNumber: string): Promise<ApiResponse<Order>> {
    return apiRequest<Order>(`/orders/order/${orderNumber}`);
  },

  // Update order status
  async updateOrderStatus(orderNumber: string, statusData: {
    status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  }): Promise<ApiResponse<Order>> {
    return apiRequest<Order>(`/orders/${orderNumber}`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  },

  // Cancel order
  async cancelOrder(orderNumber: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/orders/${orderNumber}`, {
      method: 'DELETE',
    });
  },

  // Create Stripe checkout session
  async createStripeCheckoutSession(checkoutData: {
    items: Array<{
      price: string;
      quantity: number;
    }>;
    success_url: string;
    cancel_url: string;
  }): Promise<ApiResponse<{ url: string }>> {
    return apiRequest<{ url: string }>('/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify(checkoutData),
    });
  },

  // Handle Stripe webhooks
  async handleStripeWebhook(webhookData: any): Promise<ApiResponse<any>> {
    return apiRequest<any>('/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify(webhookData),
    });
  }
}; 