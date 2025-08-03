import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

let isBackendAvailable = false;

// Función para verificar la disponibilidad del backend
const checkBackendAvailability = async () => {
    try {
        // Intentar primero el health check de la API
        await api.get('/health');
        isBackendAvailable = true;
    } catch (error) {
        try {
            // Si falla, intentar el health check del dashboard
            await axios.get(`${DASHBOARD_URL}/health`);
            isBackendAvailable = true;
        } catch (dashboardError) {
            isBackendAvailable = false;
            console.warn('Backend no disponible');
        }
    }
};

// Verificar disponibilidad cada 30 segundos
const healthCheckInterval = setInterval(checkBackendAvailability, 30000);
checkBackendAvailability(); // Verificación inicial

// Limpiar intervalo cuando se desmonte la aplicación
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        clearInterval(healthCheckInterval);
    });
}

// Interceptor mejorado
api.interceptors.response.use(
    response => response,
    error => {
        if (!isBackendAvailable) {
            console.warn('Backend no disponible');
            return Promise.reject({
                message: 'El servidor está iniciando, por favor espere...'
            });
        }

        if (error.code === 'ERR_NETWORK') {
            console.warn('Error de conexión: El servidor no está disponible');
            return Promise.reject({
                message: 'Error de conexión. Reconectando...'
            });
        }

        if (error.response?.status === 404) {
            return Promise.reject({
                message: 'No hay información disponible en este momento.'
            });
        }

        console.error('API Error:', error.message);
        return Promise.reject(error);
    }
);

export default api; 