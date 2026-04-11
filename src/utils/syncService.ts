/**
 * Sincronización programada ligera: solo lotes `shop` + `catalog` cuando toca el intervalo del catálogo.
 * Backup completo por lotes: `runMcpFullBackupBatched` / Configuración.
 */

import { getShopId, getMcpUrl } from './shopIdHelper';
import { setLastSyncTime } from './syncClock';
import { pullProductsFromMcpToLocalStorage } from './mcpProductSync';
import {
  isBatchDue,
  syncMcpBatch,
  sleep,
  DEFAULT_INTER_BATCH_GAP_MS,
  runFullBackupSync,
  runMcpFullBackupBatched,
} from '../services/mcpBatchSync';

export { getLastSyncTime, setLastSyncTime, LAST_SYNC_KEY } from './syncClock';
export {
  getLastFullBackupTime,
  setLastFullBackupTime,
  getFullBackupIntervalHours,
  setFullBackupIntervalHours,
  getFullBackupIntervalMs,
  isFullBackupDue,
} from './syncClock';

export {
  isBatchDue,
  syncMcpBatch,
  runMcpFullBackupBatched,
  runFullBackupSync,
  sleep,
  MCP_BATCH_INTERVAL_MS,
  DEFAULT_INTER_BATCH_GAP_MS,
  DEFAULT_INTER_PAGE_DELAY_MS,
} from '../services/mcpBatchSync';

/** ¿Toca refrescar catálogo desde MCP? (intervalo del lote `catalog`, típ. 12 h). */
export const isSyncDue = (): boolean => isBatchDue('catalog');

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

/** Solo catálogo (sin otros lotes). */
export const runBackgroundSync = async (onSuccess?: (productCount: number) => void): Promise<boolean> => {
  if (!getShopId() || !getMcpUrl()) return false;

  try {
    const n = await pullProductsFromMcpToLocalStorage();
    if (n === 0) return false;
    setLastSyncTime();
    window.dispatchEvent(new Event('products-updated'));
    onSuccess?.(n);
    return true;
  } catch (error) {
    console.warn('Background sync failed (offline?):', error);
    return false;
  }
};

/**
 * Si el lote de catálogo está vencido, descarga agregado de tienda + catálogo (con pausa entre ambos).
 */
export const maybeSyncIfDue = (onSuccess?: (productCount: number) => void): void => {
  if (!getShopId() || !getMcpUrl()) return;
  if (!isBatchDue('catalog')) return;

  void (async () => {
    try {
      await syncMcpBatch('shop', { force: true });
      await sleep(DEFAULT_INTER_BATCH_GAP_MS);
      const r = await syncMcpBatch('catalog', { force: true });
      if (r.ok && r.count != null) onSuccess?.(r.count);
    } catch (e) {
      console.warn('[BizneAI] Sincronización programada (lotes shop+catálogo)', e);
    }
  })();
};
