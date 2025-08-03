// Tickets API Service
import { apiRequest } from './client';
import { 
  Ticket, 
  CreateTicketRequest, 
  TicketStats,
  TicketQueryParams,
  ApiResponse 
} from '../types/api';

export const ticketsAPI = {
  // Get ticket by shop ID and sale ID
  async getTicket(shopId: string, saleId: string): Promise<ApiResponse<Ticket>> {
    return apiRequest<Ticket>(`/tickets/${shopId}/${saleId}`);
  },

  // Create ticket for a shop and sale
  async createTicket(shopId: string, saleId: string, ticketData: CreateTicketRequest): Promise<ApiResponse<Ticket>> {
    return apiRequest<Ticket>(`/tickets/${shopId}/${saleId}`, {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  },

  // Update ticket
  async updateTicket(shopId: string, saleId: string, ticketData: Partial<CreateTicketRequest>): Promise<ApiResponse<Ticket>> {
    return apiRequest<Ticket>(`/tickets/${shopId}/${saleId}`, {
      method: 'PUT',
      body: JSON.stringify(ticketData),
    });
  },

  // Delete ticket
  async deleteTicket(shopId: string, saleId: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/tickets/${shopId}/${saleId}`, {
      method: 'DELETE',
    });
  },

  // Get all tickets for a shop
  async getShopTickets(shopId: string, params?: TicketQueryParams): Promise<ApiResponse<Ticket[]>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/tickets/shop/${shopId}?${queryString}` : `/tickets/shop/${shopId}`;
    
    return apiRequest<Ticket[]>(endpoint);
  },

  // Get ticket statistics for a shop
  async getTicketStats(shopId: string, period: string = '30d'): Promise<ApiResponse<TicketStats>> {
    return apiRequest<TicketStats>(`/tickets/shop/${shopId}/stats?period=${period}`);
  }
}; 