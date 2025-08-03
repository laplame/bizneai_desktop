// Chat API Service
import { apiRequest } from './client';
import { 
  ChatMessage, 
  CreateChatMessageRequest, 
  ChatSession,
  ChatQueryParams,
  ApiResponse 
} from '../types/api';

export const chatAPI = {
  // Send chat message
  async sendMessage(shopId: string, messageData: CreateChatMessageRequest): Promise<ApiResponse<{
    message: ChatMessage;
    aiResponse: ChatMessage;
  }>> {
    return apiRequest<{
      message: ChatMessage;
      aiResponse: ChatMessage;
    }>(`/chat/shop/${shopId}`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },

  // Get chat history for a shop
  async getChatHistory(shopId: string, params?: ChatQueryParams): Promise<ApiResponse<ChatMessage[]>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/chat/shop/${shopId}?${queryString}` : `/chat/shop/${shopId}`;
    
    return apiRequest<ChatMessage[]>(endpoint);
  },

  // Get active chat sessions for a shop
  async getActiveSessions(shopId: string, status: string = 'active'): Promise<ApiResponse<ChatSession[]>> {
    return apiRequest<ChatSession[]>(`/chat/shop/${shopId}/sessions?status=${status}`);
  },

  // Close chat session
  async closeSession(shopId: string, sessionId: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/chat/shop/${shopId}/sessions/${sessionId}/close`, {
      method: 'POST',
    });
  }
}; 