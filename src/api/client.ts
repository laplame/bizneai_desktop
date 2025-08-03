// API Client Core
// Centralized API request handling for BizneAI

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  details?: any[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Generic API request function
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('API Request failed:', error);
    throw new Error(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * File upload function for multipart/form-data
 */
async function uploadFiles<T>(endpoint: string, files: File[], additionalData: Record<string, any> = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const formData = new FormData();
  
  // Add files
  files.forEach((file, index) => {
    formData.append('images', file);
  });
  
  // Add additional data
  Object.entries(additionalData).forEach(([key, value]) => {
    formData.append(key, value);
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('File upload failed:', error);
    throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export { apiRequest, uploadFiles }; 