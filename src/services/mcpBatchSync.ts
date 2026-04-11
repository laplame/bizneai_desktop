/**
 * Sincronización MCP por **lotes** (ventas, catálogo, inventario, etc.)
 * con espaciado para no saturar la API. Cada lote tiene su propio intervalo y marca de tiempo.
 */

import { getShopId, getMcpUrl, syncKitchenEnabledFromMcp } from '../utils/shopIdHelper';
import { buildMcpResourceUrl } from '../utils/mcpResourceUrl';
import { pullProductsFromMcpToLocalStorage } from '../utils/mcpProductSync';
import { setLastSyncTime, setLastFullBackupTime } from '../utils/syncClock';
import { setMcpBatchSyncedAt, isMcpBatchDue } from '../utils/mcpBatchSyncClock';

export const KEYS = {
  meta: 'bizneai-full-backup-meta',
  aggregate: 'bizneai-full-backup-aggregate',
  sales: 'bizneai-full-backup-sales',
  tickets: 'bizneai-full-backup-tickets',
  purchaseOrders: 'bizneai-full-backup-purchase-orders',
  inventoryStatus: 'bizneai-full-backup-inventory-status',
  inventoryLowStock: 'bizneai-full-backup-inventory-low-stock',
  inventoryHistory: 'bizneai-full-backup-inventory-history',
  analytics: 'bizneai-full-backup-analytics',
  salesStats: 'bizneai-full-backup-sales-stats',
  ticketsStats: 'bizneai-full-backup-tickets-stats',
  cashRegisterStatus: 'bizneai-full-backup-cash-register-status',
  cashRegisterSessions: 'bizneai-full-backup-cash-register-sessions',
  blocksSummary: 'bizneai-full-backup-blocks-summary',
  productsPaged: 'bizneai-full-backup-products-paged',
  localCustomers: 'bizneai-full-backup-local-customers',
} as const;

export type McpBatchId =
  | 'shop'
  | 'catalog'
  | 'catalogPages'
  | 'sales'
  | 'tickets'
  | 'purchaseOrders'
  | 'inventory'
  | 'analyticsBundle'
  | 'cashRegister'
  | 'blocks'
  | 'localCustomers';

/** Intervalos por defecto (ms). 0 = solo manual / siempre “due” al comprobar con intervalo 0 deshabilitado en isDue. */
export const MCP_BATCH_INTERVAL_MS: Record<McpBatchId, number> = {
  shop: 24 * 60 * 60 * 1000,
  catalog: 12 * 60 * 60 * 1000,
  catalogPages: 24 * 60 * 60 * 1000,
  sales: 6 * 60 * 60 * 1000,
  tickets: 6 * 60 * 60 * 1000,
  purchaseOrders: 24 * 60 * 60 * 1000,
  inventory: 8 * 60 * 60 * 1000,
  analyticsBundle: 24 * 60 * 60 * 1000,
  cashRegister: 12 * 60 * 60 * 1000,
  blocks: 24 * 60 * 60 * 1000,
  localCustomers: 4 * 60 * 60 * 1000,
};

export const DEFAULT_INTER_BATCH_GAP_MS = 1200;
export const DEFAULT_INTER_PAGE_DELAY_MS = 450;

export type BackupSection =
  | 'aggregate'
  | 'products'
  | 'sales'
  | 'tickets'
  | 'purchaseOrders'
  | 'inventoryStatus'
  | 'inventoryLowStock'
  | 'inventoryHistory'
  | 'analytics'
  | 'salesStats'
  | 'ticketsStats'
  | 'cashRegisterStatus'
  | 'cashRegisterSessions'
  | 'blocksSummary'
  | 'productsPaged'
  | 'localCustomers';

export interface SectionResult {
  ok: boolean;
  count?: number;
  error?: string;
}

export interface FullBackupResult {
  ok: boolean;
  productCount?: number;
  sections: Partial<Record<BackupSection, SectionResult>>;
  startedAt: string;
  completedAt: string;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchJson(url: string): Promise<{ ok: boolean; data: unknown; status: number }> {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, data, status: res.status };
  } catch {
    return { ok: false, data: null, status: 0 };
  }
}

function extractArray(payload: unknown, keys: string[]): unknown[] {
  if (payload == null) return [];
  const p = payload as Record<string, unknown>;
  const inner = (p.data && typeof p.data === 'object' ? p.data : p) as Record<string, unknown>;
  for (const k of keys) {
    const v = inner[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

async function fetchPaged(
  shopId: string,
  path: string,
  listKey: string,
  extraQuery: Record<string, string | number | undefined>,
  maxPages: number,
  interPageDelayMs: number
): Promise<unknown[]> {
  const all: unknown[] = [];
  let page = 1;
  const limit = 100;
  while (page <= maxPages) {
    const url = buildMcpResourceUrl(shopId, path, { ...extraQuery, page, limit });
    const { ok, data } = await fetchJson(url);
    if (!ok || data == null) break;
    const body = data as Record<string, unknown>;
    const inner = (body.data ?? body) as Record<string, unknown>;
    const list = (inner[listKey] as unknown[]) || extractArray(data, [listKey]);
    if (!Array.isArray(list) || list.length === 0) break;
    all.push(...list);
    const pag = inner.pagination as Record<string, number> | undefined;
    const pages = pag?.pages ?? pag?.totalPages;
    if (pages != null && page >= pages) break;
    if (list.length < limit) break;
    page += 1;
    if (interPageDelayMs > 0) await sleep(interPageDelayMs);
  }
  return all;
}

async function fetchPagedSales(shopId: string, interPageDelayMs: number): Promise<unknown[]> {
  return fetchPaged(
    shopId,
    'sales',
    'sales',
    { sortOrder: 'desc', sortBy: 'createdAt' },
    100,
    interPageDelayMs
  );
}

async function fetchPagedTickets(shopId: string, interPageDelayMs: number): Promise<unknown[]> {
  return fetchPaged(shopId, 'tickets', 'tickets', {}, 100, interPageDelayMs);
}

async function fetchPagedProducts(shopId: string, interPageDelayMs: number): Promise<unknown[]> {
  return fetchPaged(shopId, 'products', 'products', { sortOrder: 'desc' }, 200, interPageDelayMs);
}

function snapshotLocalCustomers(): void {
  try {
    const raw = localStorage.getItem('bizneai-customers-registry');
    if (raw) localStorage.setItem(KEYS.localCustomers, raw);
  } catch {
    /* ignore */
  }
}

export interface SyncMcpBatchOptions {
  /** Pausa entre páginas en listados paginados */
  interPageDelayMs?: number;
  /** Forzar ejecución aunque no toque por intervalo */
  force?: boolean;
  onProgress?: (label: string) => void;
}

export function isBatchDue(batchId: McpBatchId): boolean {
  return isMcpBatchDue(batchId, MCP_BATCH_INTERVAL_MS[batchId]);
}

/**
 * Ejecuta un solo lote MCP y actualiza su marca de tiempo si termina bien.
 */
export async function syncMcpBatch(
  batchId: McpBatchId,
  options: SyncMcpBatchOptions = {}
): Promise<{ ok: boolean; error?: string; count?: number }> {
  const { interPageDelayMs = DEFAULT_INTER_PAGE_DELAY_MS, force = false, onProgress } = options;
  if (!force && !isBatchDue(batchId)) {
    return { ok: true };
  }

  const shopId = getShopId();
  const mcpUrl = getMcpUrl();
  if (!shopId || !mcpUrl) {
    return { ok: false, error: 'Sin shopId o MCP' };
  }

  const label = (s: string) => onProgress?.(s);

  try {
    switch (batchId) {
      case 'shop': {
        label?.('Tienda (agregado MCP)');
        const { ok, data } = await fetchJson(mcpUrl);
        if (!ok) throw new Error('HTTP agregado');
        localStorage.setItem(KEYS.aggregate, JSON.stringify(data));
        break;
      }
      case 'catalog': {
        label?.('Catálogo (productos y precios)');
        syncKitchenEnabledFromMcp();
        const n = await pullProductsFromMcpToLocalStorage();
        if (n > 0) setLastSyncTime();
        window.dispatchEvent(new Event('products-updated'));
        setMcpBatchSyncedAt('catalog');
        return { ok: true, count: n };
      }
      case 'catalogPages': {
        label?.('Catálogo MCP (páginas)');
        const products = await fetchPagedProducts(shopId, interPageDelayMs);
        localStorage.setItem(KEYS.productsPaged, JSON.stringify(products));
        setMcpBatchSyncedAt('catalogPages');
        return { ok: true, count: products.length };
      }
      case 'sales': {
        label?.('Ventas (respaldo paginado)');
        const sales = await fetchPagedSales(shopId, interPageDelayMs);
        localStorage.setItem(KEYS.sales, JSON.stringify(sales));
        setMcpBatchSyncedAt('sales');
        return { ok: true, count: sales.length };
      }
      case 'tickets': {
        label?.('Tickets');
        const tickets = await fetchPagedTickets(shopId, interPageDelayMs);
        localStorage.setItem(KEYS.tickets, JSON.stringify(tickets));
        setMcpBatchSyncedAt('tickets');
        return { ok: true, count: tickets.length };
      }
      case 'purchaseOrders': {
        label?.('Órdenes de compra');
        const url = buildMcpResourceUrl(shopId, 'purchase-orders', { limit: 100, page: 1 });
        const { ok, data } = await fetchJson(url);
        if (!ok) throw new Error('purchase-orders');
        localStorage.setItem(KEYS.purchaseOrders, JSON.stringify(data));
        break;
      }
      case 'inventory': {
        label?.('Inventario');
        const u1 = buildMcpResourceUrl(shopId, 'inventory/status');
        const r1 = await fetchJson(u1);
        if (!r1.ok) throw new Error('inventory/status');
        localStorage.setItem(KEYS.inventoryStatus, JSON.stringify(r1.data));
        await sleep(500);
        const u2 = buildMcpResourceUrl(shopId, 'inventory/low-stock', { threshold: 10 });
        const r2 = await fetchJson(u2);
        if (!r2.ok) throw new Error('inventory/low-stock');
        localStorage.setItem(KEYS.inventoryLowStock, JSON.stringify(r2.data));
        await sleep(500);
        const u3 = buildMcpResourceUrl(shopId, 'inventory/history');
        const r3 = await fetchJson(u3);
        if (!r3.ok) throw new Error('inventory/history');
        localStorage.setItem(KEYS.inventoryHistory, JSON.stringify(r3.data));
        break;
      }
      case 'analyticsBundle': {
        label?.('Analytics y estadísticas');
        const end = new Date();
        const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        const u1 = buildMcpResourceUrl(shopId, 'analytics', {
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
        });
        const a1 = await fetchJson(u1);
        if (!a1.ok) throw new Error('analytics');
        localStorage.setItem(KEYS.analytics, JSON.stringify(a1.data));
        await sleep(600);
        const u2 = buildMcpResourceUrl(shopId, 'sales/stats', { period: '30d' });
        const a2 = await fetchJson(u2);
        if (!a2.ok) throw new Error('sales/stats');
        localStorage.setItem(KEYS.salesStats, JSON.stringify(a2.data));
        await sleep(600);
        const u3 = buildMcpResourceUrl(shopId, 'tickets/stats', { period: '30d' });
        const a3 = await fetchJson(u3);
        if (!a3.ok) throw new Error('tickets/stats');
        localStorage.setItem(KEYS.ticketsStats, JSON.stringify(a3.data));
        break;
      }
      case 'cashRegister': {
        label?.('Caja registradora');
        const u1 = buildMcpResourceUrl(shopId, 'cash-register/status');
        const r1 = await fetchJson(u1);
        if (!r1.ok) throw new Error('cash-register/status');
        localStorage.setItem(KEYS.cashRegisterStatus, JSON.stringify(r1.data));
        await sleep(500);
        const u2 = buildMcpResourceUrl(shopId, 'cash-register/sessions');
        const r2 = await fetchJson(u2);
        if (!r2.ok) throw new Error('cash-register/sessions');
        localStorage.setItem(KEYS.cashRegisterSessions, JSON.stringify(r2.data));
        break;
      }
      case 'blocks': {
        label?.('Bloques / resumen');
        const url = buildMcpResourceUrl(shopId, 'blocks/summary');
        const { ok, data } = await fetchJson(url);
        if (!ok) throw new Error('blocks/summary');
        localStorage.setItem(KEYS.blocksSummary, JSON.stringify(data));
        break;
      }
      case 'localCustomers': {
        label?.('Clientes locales (snapshot)');
        snapshotLocalCustomers();
        break;
      }
      default:
        return { ok: false, error: 'Lote desconocido' };
    }

    setMcpBatchSyncedAt(batchId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

const FULL_BACKUP_ORDER: McpBatchId[] = [
  'shop',
  'catalog',
  'catalogPages',
  'sales',
  'tickets',
  'purchaseOrders',
  'inventory',
  'analyticsBundle',
  'cashRegister',
  'blocks',
  'localCustomers',
];

export interface RunMcpFullBackupBatchedOptions {
  gapMs?: number;
  interPageDelayMs?: number;
  /** Subconjunto de lotes; por defecto todos en orden */
  batches?: McpBatchId[];
  onProgress?: (label: string) => void;
  /** Si true, ignora intervalos y ejecuta todos los lotes pedidos */
  force?: boolean;
}

/**
 * Backup completo en cadena con pausa entre lotes (menos picos en la API).
 */
export async function runMcpFullBackupBatched(
  options: RunMcpFullBackupBatchedOptions = {}
): Promise<FullBackupResult> {
  const {
    gapMs = DEFAULT_INTER_BATCH_GAP_MS,
    interPageDelayMs = DEFAULT_INTER_PAGE_DELAY_MS,
    batches = FULL_BACKUP_ORDER,
    onProgress,
    force = true,
  } = options;

  const startedAt = new Date().toISOString();
  const sections: Partial<Record<BackupSection, SectionResult>> = {};
  const shopId = getShopId();
  const mcpUrl = getMcpUrl();

  if (!shopId || !mcpUrl) {
    return {
      ok: false,
      sections: { aggregate: { ok: false, error: 'Sin shopId o MCP' } },
      startedAt,
      completedAt: new Date().toISOString(),
    };
  }

  const mapBatchToSections = (id: McpBatchId, r: { ok: boolean; error?: string; count?: number }) => {
    if (id === 'shop') sections.aggregate = { ok: !!r.ok, error: r.error };
    if (id === 'catalog') sections.products = { ok: !!r.ok, count: r.count, error: r.error };
    if (id === 'catalogPages') sections.productsPaged = { ok: !!r.ok, count: r.count, error: r.error };
    if (id === 'sales') sections.sales = { ok: !!r.ok, count: r.count, error: r.error };
    if (id === 'tickets') sections.tickets = { ok: !!r.ok, count: r.count, error: r.error };
    if (id === 'purchaseOrders') sections.purchaseOrders = { ok: !!r.ok, error: r.error };
    if (id === 'inventory') {
      sections.inventoryStatus = { ok: !!r.ok, error: r.error };
      sections.inventoryLowStock = { ok: !!r.ok, error: r.error };
      sections.inventoryHistory = { ok: !!r.ok, error: r.error };
    }
    if (id === 'analyticsBundle') {
      sections.analytics = { ok: !!r.ok, error: r.error };
      sections.salesStats = { ok: !!r.ok, error: r.error };
      sections.ticketsStats = { ok: !!r.ok, error: r.error };
    }
    if (id === 'cashRegister') {
      sections.cashRegisterStatus = { ok: !!r.ok, error: r.error };
      sections.cashRegisterSessions = { ok: !!r.ok, error: r.error };
    }
    if (id === 'blocks') sections.blocksSummary = { ok: !!r.ok, error: r.error };
    if (id === 'localCustomers') sections.localCustomers = { ok: !!r.ok, error: r.error };
  };

  let productCount: number | undefined;

  for (let i = 0; i < batches.length; i++) {
    const id = batches[i];
    onProgress?.(`Lote: ${id}`);
    const r = await syncMcpBatch(id, { force, interPageDelayMs, onProgress });
    mapBatchToSections(id, r);
    if (id === 'catalog' && r.count != null) productCount = r.count;
    if (i < batches.length - 1 && gapMs > 0) await sleep(gapMs);
  }

  const completedAt = new Date().toISOString();
  const failedNames = Object.entries(sections)
    .filter(([, s]) => s && !s.ok)
    .map(([k]) => k);
  const ok = !!(sections.aggregate?.ok && sections.products?.ok);

  const meta = {
    lastCompletedAt: completedAt,
    lastStartedAt: startedAt,
    sections,
    productCount,
    failedSections: failedNames,
    allSectionsOk: failedNames.length === 0,
    batched: true,
    batchGapMs: gapMs,
  };
  localStorage.setItem(KEYS.meta, JSON.stringify(meta));
  setLastFullBackupTime();

  window.dispatchEvent(new CustomEvent('full-backup-sync-completed', { detail: meta }));

  return {
    ok,
    productCount,
    sections,
    startedAt,
    completedAt,
  };
}

/** Compatibilidad: backup completo con lotes y pausas. */
export async function runFullBackupSync(onProgress?: (label: string) => void): Promise<FullBackupResult> {
  return runMcpFullBackupBatched({ onProgress, force: true, gapMs: DEFAULT_INTER_BATCH_GAP_MS });
}

export function readFullBackupMeta(): unknown {
  try {
    const raw = localStorage.getItem(KEYS.meta);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export { getMcpBatchSyncedAt } from '../utils/mcpBatchSyncClock';
export { FULL_BACKUP_ORDER };
