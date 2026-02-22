/**
 * Servicio de sincronización para modo standalone/offline.
 * Sincroniza una vez al día cuando hay conexión. Si no hay conexión,
 * el sistema funciona con los datos descargados la primera vez.
 */

import { getProductsFromMcp, getShopId, getMcpUrl } from './shopIdHelper';
import { mapMcpProductToLocal } from './shopIdHelper';

const LAST_SYNC_KEY = 'bizneai-last-sync';
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 horas

export const getLastSyncTime = (): Date | null => {
  try {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    if (!stored) return null;
    const ts = parseInt(stored, 10);
    return isNaN(ts) ? null : new Date(ts);
  } catch {
    return null;
  }
};

export const setLastSyncTime = (date: Date = new Date()) => {
  localStorage.setItem(LAST_SYNC_KEY, String(date.getTime()));
};

/** Verifica si ya pasaron 24h desde la última sincronización */
export const isSyncDue = (): boolean => {
  const last = getLastSyncTime();
  if (!last) return true;
  return Date.now() - last.getTime() >= SYNC_INTERVAL_MS;
};

/** Verifica si hay datos locales (ya se sincronizó al menos una vez) */
export const hasLocalData = (): boolean => {
  const products = localStorage.getItem('bizneai-products');
  if (!products) return false;
  try {
    const parsed = JSON.parse(products);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
};

/** Ejecuta sincronización en segundo plano. No bloquea. Usa getProductsFromMcp para imágenes enriquecidas. */
export const runBackgroundSync = async (onSuccess?: (productCount: number) => void): Promise<boolean> => {
  if (!getShopId() || !getMcpUrl()) return false;

  try {
    const mcpProducts = await getProductsFromMcp();
    if (!mcpProducts || mcpProducts.length === 0) return false;

    const mappedProducts = mcpProducts.map((p: any, index: number) => mapMcpProductToLocal(p, index));
    localStorage.setItem('bizneai-products', JSON.stringify(mappedProducts));
    setLastSyncTime();
    window.dispatchEvent(new Event('products-updated'));
    onSuccess?.(mappedProducts.length);
    return true;
  } catch (error) {
    console.warn('Background sync failed (offline?):', error);
    return false;
  }
};

/** Inicia sincronización si está programada. Ejecutar al arranque sin bloquear. */
export const maybeSyncIfDue = (onSuccess?: (productCount: number) => void): void => {
  if (!isSyncDue()) return;
  if (!getShopId()) return;

  runBackgroundSync(onSuccess).then((ok) => {
    if (ok) console.log('BizneAI: sync completada');
  });
};
