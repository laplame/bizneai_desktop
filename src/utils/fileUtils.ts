// Utilidades para manejo de archivos

/**
 * Copia un archivo a la carpeta public
 * En un entorno de desarrollo, esto simula la copia
 * En producción, esto se manejaría con el backend
 */
export const copyFileToPublic = async (file: File, fileName: string): Promise<string> => {
  try {
    // En desarrollo, simulamos la copia
    if (process.env.NODE_ENV === 'development') {
      console.log(`Simulando copia de archivo: ${fileName}`);
      
      // Crear una URL temporal para el archivo
      const fileUrl = URL.createObjectURL(file);
      
      // Simular delay de copia
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En un entorno real, aquí copiarías el archivo a la carpeta public
      // Por ejemplo, usando fs en Node.js o una API del servidor
      
      return `/public/${fileName}`;
    }
    
    // En producción, aquí harías la llamada al servidor
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName);
    
    const response = await fetch('/api/upload-background', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Error al subir archivo');
    }
    
    const result = await response.json();
    return result.fileUrl;
    
  } catch (error) {
    console.error('Error al copiar archivo:', error);
    throw error;
  }
};

/**
 * Valida un archivo de imagen
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Validar tipo de archivo
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'El archivo debe ser una imagen' };
  }
  
  // Validar tamaño (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'La imagen debe ser menor a 5MB' };
  }
  
  // Validar extensiones permitidas
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    return { valid: false, error: 'Formato de imagen no soportado' };
  }
  
  return { valid: true };
};

/**
 * Genera un nombre único para el archivo
 */
export const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  return `background-${timestamp}.${extension}`;
};

/**
 * Aplica la imagen de fondo al contenedor principal
 */
export const applyBackgroundImage = (imageUrl: string | null): void => {
  const container = document.querySelector('.pos-container') as HTMLElement;
  
  if (container) {
    if (imageUrl) {
      container.style.setProperty('--custom-background-image', `url(${imageUrl})`);
      container.style.backgroundImage = `url(${imageUrl})`;
    } else {
      container.style.removeProperty('--custom-background-image');
      container.style.backgroundImage = 'none';
    }
  }
};

/**
 * Obtiene información de la imagen guardada
 */
export const getSavedBackgroundImage = (): { url: string; fileName: string } | null => {
  try {
    const saved = localStorage.getItem('bizneai-background-image');
    if (saved) {
      const imageInfo = JSON.parse(saved);
      return {
        url: imageInfo.url,
        fileName: imageInfo.fileName
      };
    }
  } catch (error) {
    console.error('Error al obtener imagen guardada:', error);
  }
  
  return null;
};

/**
 * Guarda información de la imagen
 */
export const saveBackgroundImageInfo = (imageInfo: {
  fileName: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
}): void => {
  try {
    const infoToSave = {
      ...imageInfo,
      uploadedAt: new Date().toISOString()
    };
    
    localStorage.setItem('bizneai-background-image', JSON.stringify(infoToSave));
  } catch (error) {
    console.error('Error al guardar información de imagen:', error);
  }
}; 