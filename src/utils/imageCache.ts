/**
 * Cache de URLs de imágenes fallidas para evitar reintentos y múltiples 404.
 * Cuando una imagen falla (404, etc.), se guarda aquí y se muestra placeholder.
 */

const failedImageUrls = new Set<string>();

export const isImageFailed = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return true;
  return failedImageUrls.has(url.trim());
};

export const markImageFailed = (url: string | null | undefined): void => {
  if (url && typeof url === 'string') {
    failedImageUrls.add(url.trim());
  }
};

/** Devuelve si debemos mostrar la img o el placeholder */
export const shouldShowImage = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string' || url.trim() === '') return false;
  return !failedImageUrls.has(url.trim());
};
