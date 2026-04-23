/**
 * Descarga catálogo MCP → merge → localStorage `bizneai-products`.
 * Usado por syncService y por la sincronización completa (backup).
 */

import {
  getProductsFromMcp,
  mapMcpProductToLocal,
  mergeProductsFromServerPreserveImages,
  applyMcpInventoryStatusToMergedCatalog,
} from './shopIdHelper';
import { syncProductImagesToLocalDisk } from '../services/productImageLocalCache';

export async function pullProductsFromMcpToLocalStorage(): Promise<number> {
  const mcpProducts = await getProductsFromMcp();
  if (!mcpProducts || mcpProducts.length === 0) return 0;

  let savedParsed: unknown[] = [];
  try {
    const raw = localStorage.getItem('bizneai-products');
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) savedParsed = p;
    }
  } catch {
    /* ignore */
  }
  const mappedProducts = mcpProducts.map((p: unknown, index: number) => mapMcpProductToLocal(p, index));
  const merged = mergeProductsFromServerPreserveImages(savedParsed, mappedProducts);
  const mergedWithInv = await applyMcpInventoryStatusToMergedCatalog(merged);
  const withLocalImages = await syncProductImagesToLocalDisk(mergedWithInv);
  localStorage.setItem('bizneai-products', JSON.stringify(withLocalImages));
  window.dispatchEvent(new Event('products-updated'));
  return withLocalImages.length;
}
