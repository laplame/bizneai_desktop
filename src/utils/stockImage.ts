/**
 * Imágenes de stock por palabra clave para productos sin foto.
 *
 * Genera una URL remota (loremflickr, sin API key) a partir del nombre/categoría
 * del producto. Como es una URL http(s), el pipeline existente
 * `syncProductImagesToLocalDisk` la descarga y la guarda en disco local para uso
 * offline, y `mergeProductsFromServerPreserveImages` la conserva en sincronizaciones
 * posteriores. Determinista: mismo producto → misma imagen (sin parpadeo).
 *
 * Solo se aplica a productos que NO tienen imagen, así que nunca pisa una foto real.
 * Se puede desactivar poniendo `localStorage['bizneai-stock-images'] = '0'`.
 */

const STOCK_ENABLED_KEY = 'bizneai-stock-images';

export function stockImagesEnabled(): boolean {
  try {
    return localStorage.getItem(STOCK_ENABLED_KEY) !== '0';
  } catch {
    return true;
  }
}

// Palabras sin valor visual para la búsqueda de imagen.
const STOP_WORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'con', 'sin', 'para', 'base', 'agua',
  'frio', 'fr' + 'ío', 'caliente', 'ml', 'gr', 'kg', 'oz', 'lt', 'litro',
  'grande', 'chico', 'mediano', 'del', 'por',
]);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // quita acentos
}

/** Extrae hasta 3 palabras clave del nombre (o la categoría como respaldo). */
export function keywordsFor(name: string, category?: string): string {
  const words = normalize(String(name || ''))
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w) && !/^\d+$/.test(w))
    .slice(0, 3);

  if (words.length === 0 && category) {
    const cat = normalize(String(category)).replace(/[^a-z0-9]/g, '');
    if (cat) words.push(cat);
  }
  if (words.length === 0) words.push('product');
  return words.join(',');
}

/** Lock estable derivado de las keywords → misma imagen para el mismo producto. */
function stableLock(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return (h % 900) + 1;
}

export function stockImageUrlFor(name: string, category?: string): string {
  const kw = keywordsFor(name, category);
  return `https://loremflickr.com/600/600/${encodeURIComponent(kw)}?lock=${stableLock(kw)}`;
}

type Row = Record<string, unknown>;

function hasImage(p: Row): boolean {
  const img = String(p?.image ?? '').trim();
  if (img) return true;
  const imgs = p?.images;
  return Array.isArray(imgs) && imgs.length > 0 && String(imgs[0] ?? '').trim().length > 0;
}

/** Asigna una URL de stock a los productos sin imagen (si la función está activa). */
export function fillMissingImagesWithStock(products: Row[]): Row[] {
  if (!stockImagesEnabled()) return products;
  return products.map((p) => {
    if (hasImage(p)) return p;
    const name = String(p?.name ?? '');
    if (!name) return p;
    const category = p?.category != null ? String(p.category) : undefined;
    return { ...p, image: stockImageUrlFor(name, category) };
  });
}
