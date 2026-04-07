/**
 * Tras sincronizar el catálogo, copia imágenes remotas al API local para verlas sin depender de la web.
 */
import toast from 'react-hot-toast';
import i18n from '../i18n';
import { getLocalApiOrigin } from '../utils/localApiBase';
import { posBackendHealth } from './posPersistService';

const BATCH = 35;

export function isRemoteProductImageUrl(url: string): boolean {
  const u = String(url || '').trim();
  if (!u || u.startsWith('data:')) return false;
  try {
    const base = getLocalApiOrigin();
    if (u.startsWith(`${base}/api/pos/product-images/file/`)) return false;
  } catch {
    /* ignore */
  }
  return /^https?:\/\//i.test(u);
}

type Row = Record<string, unknown>;

export async function syncProductImagesToLocalDisk(products: Row[]): Promise<Row[]> {
  if (!products.length) return products;

  const healthy = await posBackendHealth();
  if (!healthy) return products;

  const items: { id: string; url: string; index: number }[] = [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const id = String(p?.id ?? i);
    const url = String(p?.image ?? '').trim();
    if (!isRemoteProductImageUrl(url)) continue;
    items.push({ id, url, index: i });
  }

  if (items.length === 0) return products;

  const origin = getLocalApiOrigin();
  const idToPath = new Map<string, string>();

  for (let offset = 0; offset < items.length; offset += BATCH) {
    const slice = items.slice(offset, offset + BATCH);
    try {
      const r = await fetch(`${origin}/api/pos/product-images/cache`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: slice.map(({ id, url }) => ({ id, url })) }),
      });
      if (!r.ok) continue;
      const data = (await r.json()) as {
        results?: { id: string; path: string | null }[];
      };
      for (const row of data.results || []) {
        if (row.path) idToPath.set(String(row.id), row.path);
      }
    } catch {
      /* offline / error: keep remote URLs */
    }
  }

  const downloaded = idToPath.size;
  if (downloaded === 0) return products;

  toast.success(i18n.t('persistence.photosCachedToast', { count: downloaded }));

  return products.map((p, i) => {
    const id = String(p?.id ?? i);
    const rel = idToPath.get(id);
    if (!rel) return p;
    return { ...p, image: `${origin}${rel}` };
  });
}
