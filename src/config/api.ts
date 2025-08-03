// Configuración de la API
export const API_CONFIG = {
  // URL base de la API
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://api.bizneai.com' 
    : 'http://localhost:3001',
  
  // Endpoints de la tienda
  STORE: {
    STATUS: '/api/store/status',
    SETUP: '/api/store/setup',
    CONFIG: '/api/store/config',
    UPDATE: '/api/store/update'
  },
  
  // Timeouts
  TIMEOUT: 10000, // 10 segundos
  
  // Headers por defecto
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Función para hacer requests a la API
export const apiRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      ...API_CONFIG.DEFAULT_HEADERS,
      ...options.headers
    },
    ...options
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...config,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Función para manejar errores de la API
export const handleApiError = (error: any): string => {
  if (error.name === 'AbortError') {
    return 'La solicitud tardó demasiado tiempo';
  }
  
  if (error instanceof TypeError) {
    return 'Error de conexión. Verifica tu conexión a internet';
  }
  
  return 'Error inesperado. Inténtalo de nuevo';
}; 