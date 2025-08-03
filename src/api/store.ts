import { StoreConfig } from '../types/store';

// Mock API para desarrollo
const MOCK_DELAY = 1000; // 1 segundo de delay para simular red

export const storeAPI = {
  // Verificar estado de configuración
  async checkStatus(): Promise<{ isConfigured: boolean; config?: StoreConfig }> {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    
    const stored = localStorage.getItem('bizneai-store-config');
    if (stored) {
      return {
        isConfigured: true,
        config: JSON.parse(stored)
      };
    }
    
    return { isConfigured: false };
  },

  // Configurar tienda
  async setupStore(config: StoreConfig): Promise<{ success: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    
    try {
      // Simular llamada al endpoint real
      console.log('Enviando configuración al servidor:', config);
      
      // Guardar en localStorage para persistencia
      localStorage.setItem('bizneai-store-config', JSON.stringify(config));
      localStorage.setItem('bizneai-setup-complete', 'true');
      
      return {
        success: true,
        message: 'Tienda configurada exitosamente'
      };
    } catch (error) {
      console.error('Error al configurar la tienda:', error);
      return {
        success: false,
        message: 'Error al configurar la tienda'
      };
    }
  },

  // Obtener configuración actual
  async getConfig(): Promise<StoreConfig | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const stored = localStorage.getItem('bizneai-store-config');
    return stored ? JSON.parse(stored) : null;
  },

  // Actualizar configuración
  async updateConfig(config: Partial<StoreConfig>): Promise<{ success: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    
    try {
      const currentConfig = await this.getConfig();
      const updatedConfig = { ...currentConfig, ...config };
      
      localStorage.setItem('bizneai-store-config', JSON.stringify(updatedConfig));
      
      return {
        success: true,
        message: 'Configuración actualizada exitosamente'
      };
    } catch (error) {
      console.error('Error al actualizar la configuración:', error);
      return {
        success: false,
        message: 'Error al actualizar la configuración'
      };
    }
  }
};

// Funciones de conveniencia para usar con fetch
export const storeEndpoints = {
  // Endpoint para verificar estado
  async status() {
    return storeAPI.checkStatus();
  },

  // Endpoint para configuración inicial
  async setup(config: StoreConfig) {
    return storeAPI.setupStore(config);
  }
}; 