// API Client Core
// Centralized API request handling for BizneAI

/**
 * Base `/api` para fetch JSON.
 * - `VITE_API_URL` si está definido (p. ej. `http://localhost:3000/api` en dev con API local).
 * - Si no: origen desde `bizneai-server-config` (serverUrl / mcpUrl).
 * - Por defecto: producción `https://www.bizneai.com/api` (el waitlist real vive ahí; el default
 *   anterior `localhost:3000` dejaba la lista vacía si no corría el mock local).
 */
export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '');
  }
  try {
    const raw = localStorage.getItem('bizneai-server-config');
    if (raw) {
      const c = JSON.parse(raw) as { serverUrl?: string; mcpUrl?: string };
      if (c.serverUrl) {
        return `${new URL(c.serverUrl).origin}/api`;
      }
      if (c.mcpUrl) {
        return `${new URL(c.mcpUrl).origin}/api`;
      }
    }
  } catch {
    /* ignore */
  }
  return 'https://www.bizneai.com/api';
}

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
  const base = getApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${path}`;
  
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
  const base = getApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${path}`;
  
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

/**
 * Respuesta JSON sin asumir `{ success, data }` (p. ej. GET /waitlist en producción devuelve `{ entries }`).
 */
export async function apiRequestRaw(endpoint: string, options: RequestInit = {}): Promise<unknown> {
  const base = getApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${path}`;
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...options,
  };
  const response = await fetch(url, defaultOptions);
  return response.json();
}

export { apiRequest, uploadFiles }; 