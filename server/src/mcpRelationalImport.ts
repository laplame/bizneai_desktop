/**
 * Segunda capa: tablas SQLite por colección, pobladas desde respuestas MCP (misma forma que payload_json).
 * La tabla mcp_remote_snapshot sigue siendo cachía cruda + auditoría; estas tablas permiten consultas y joins locales.
 */
import { getPosKvDb } from './posKvDb.js';
import { getMcpSnapshotRow, listMcpSnapshotKeys } from './mcpSnapshotDb.js';

const ROOT_RESOURCE = 'mcp-root';
const CUSTOMERS_RESOURCE = 'customers';

let relationalReady = false;

function ensureRelationalTables(): void {
  if (relationalReady) return;
  const db = getPosKvDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS mcp_cache_shop (
      shop_id TEXT PRIMARY KEY,
      store_name TEXT,
      store_type TEXT,
      kitchen_enabled INTEGER,
      ecommerce_enabled INTEGER,
      snapshot_fetched_at TEXT NOT NULL,
      extra_json TEXT
    );

    CREATE TABLE IF NOT EXISTS mcp_cache_product (
      shop_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      sku TEXT,
      name TEXT,
      price REAL,
      currency TEXT,
      category TEXT,
      is_active INTEGER,
      updated_at_remote TEXT,
      raw_json TEXT NOT NULL,
      synced_at TEXT NOT NULL,
      PRIMARY KEY (shop_id, product_id)
    );
    CREATE INDEX IF NOT EXISTS idx_mcp_cache_product_shop ON mcp_cache_product(shop_id);

    CREATE TABLE IF NOT EXISTS mcp_cache_customer (
      shop_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      name TEXT,
      rfc TEXT,
      status TEXT,
      allow_credit INTEGER,
      updated_at_remote TEXT,
      raw_json TEXT NOT NULL,
      synced_at TEXT NOT NULL,
      PRIMARY KEY (shop_id, customer_id)
    );
    CREATE INDEX IF NOT EXISTS idx_mcp_cache_customer_shop ON mcp_cache_customer(shop_id);
  `);
  relationalReady = true;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v != null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** Extrae shop + products del GET /api/mcp/:shopId */
function parseMcpRootPayload(payload: unknown): { shop: Record<string, unknown> | null; products: unknown[] } {
  const top = asRecord(payload);
  if (!top) return { shop: null, products: [] };
  const data = asRecord(top.data) ?? top;
  const shop =
    asRecord(data.shop) ??
    (data && ('storeName' in data || 'storeType' in data) ? data : null);
  const products = Array.isArray(data.products)
    ? data.products
    : Array.isArray(top.products)
      ? top.products
      : [];
  return { shop, products };
}

function parseCustomersList(payload: unknown): Record<string, unknown>[] {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  const o = asRecord(payload);
  if (!o) return [];
  if (Array.isArray(o.customers)) return o.customers as Record<string, unknown>[];
  if (Array.isArray(o.data)) return o.data as Record<string, unknown>[];
  const inner = asRecord(o.data);
  if (inner) {
    if (Array.isArray(inner.customers)) return inner.customers as Record<string, unknown>[];
    if (Array.isArray(inner.data)) return inner.data as Record<string, unknown>[];
  }
  return [];
}

function numOrNull(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function strOrEmpty(v: unknown): string {
  if (v == null) return '';
  return String(v);
}

function bool01(v: unknown): number | null {
  if (v === true) return 1;
  if (v === false) return 0;
  return null;
}

/**
 * Importa filas relacionales desde un objeto ya parseado (misma respuesta que el MCP).
 */
export function importMcpPayloadToRelationalTables(
  shopId: string,
  resourcePath: string,
  _queryKey: string,
  payload: unknown,
  fetchedAt: string
): { shop?: boolean; products?: number; customers?: number } {
  ensureRelationalTables();
  const out: { shop?: boolean; products?: number; customers?: number } = {};

  if (resourcePath === ROOT_RESOURCE) {
    const { shop, products } = parseMcpRootPayload(payload);
    const db = getPosKvDb();

    db.transaction(() => {
      if (shop) {
        const name = strOrEmpty(shop.storeName ?? shop.name);
        const storeType = strOrEmpty(shop.storeType);
        const kitchen = bool01(shop.kitchenEnabled);
        const ecommerce = bool01(shop.ecommerceEnabled);
        const extra = { ...shop };
        delete extra.storeName;
        delete extra.storeType;
        delete extra.kitchenEnabled;
        delete extra.ecommerceEnabled;
        const extraJson = Object.keys(extra).length ? JSON.stringify(extra) : null;
        db.prepare(
          `
          INSERT INTO mcp_cache_shop (shop_id, store_name, store_type, kitchen_enabled, ecommerce_enabled, snapshot_fetched_at, extra_json)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(shop_id) DO UPDATE SET
            store_name = excluded.store_name,
            store_type = excluded.store_type,
            kitchen_enabled = excluded.kitchen_enabled,
            ecommerce_enabled = excluded.ecommerce_enabled,
            snapshot_fetched_at = excluded.snapshot_fetched_at,
            extra_json = excluded.extra_json
        `
        ).run(shopId, name, storeType, kitchen, ecommerce, fetchedAt, extraJson);
        out.shop = true;
      }

      db.prepare(`DELETE FROM mcp_cache_product WHERE shop_id = ?`).run(shopId);
      const ins = db.prepare(
        `
        INSERT INTO mcp_cache_product (
          shop_id, product_id, sku, name, price, currency, category, is_active, updated_at_remote, raw_json, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      );
      let n = 0;
      for (const raw of products) {
        const p = asRecord(raw);
        if (!p) continue;
        const productId = strOrEmpty(p._id ?? p.id);
        if (!productId) continue;
        const price = numOrNull(p.price ?? p.salePrice ?? p.unitPrice) ?? 0;
        const category =
          typeof p.category === 'string'
            ? p.category
            : asRecord(p.category)?.name != null
              ? strOrEmpty(asRecord(p.category)?.name)
              : '';
        ins.run(
          shopId,
          productId,
          p.sku != null ? strOrEmpty(p.sku) : null,
          strOrEmpty(p.name),
          price,
          p.currency != null ? strOrEmpty(p.currency) : null,
          category,
          p.isActive === false ? 0 : p.active === false ? 0 : 1,
          p.updatedAt != null ? strOrEmpty(p.updatedAt) : p.updated_at != null ? strOrEmpty(p.updated_at) : null,
          JSON.stringify(raw),
          fetchedAt
        );
        n++;
      }
      out.products = n;
    })();
    return out;
  }

  if (resourcePath === CUSTOMERS_RESOURCE) {
    const rows = parseCustomersList(payload);
    const db = getPosKvDb();
    db.transaction(() => {
      db.prepare(`DELETE FROM mcp_cache_customer WHERE shop_id = ?`).run(shopId);
      const ins = db.prepare(
        `
        INSERT INTO mcp_cache_customer (
          shop_id, customer_id, name, rfc, status, allow_credit, updated_at_remote, raw_json, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      );
      let n = 0;
      for (const r of rows) {
        const id = strOrEmpty(r.id);
        if (!id) continue;
        ins.run(
          shopId,
          id,
          strOrEmpty(r.name),
          r.rfc != null ? strOrEmpty(r.rfc) : null,
          r.status != null ? strOrEmpty(r.status) : null,
          r.allowCredit === true ? 1 : r.allowCredit === false ? 0 : null,
          r.updatedAt != null ? strOrEmpty(r.updatedAt) : null,
          JSON.stringify(r),
          fetchedAt
        );
        n++;
      }
      out.customers = n;
    })();
    return out;
  }

  return out;
}

/** Relee payload_json de un snapshot y vuelve a poblar tablas relacionales. */
export function reimportFromStoredSnapshot(
  shopId: string,
  resourcePath: string,
  queryKey: string
): { ok: boolean; error?: string; result?: ReturnType<typeof importMcpPayloadToRelationalTables> } {
  const row = getMcpSnapshotRow(shopId, resourcePath, queryKey);
  if (row === null) return { ok: false, error: 'snapshot no encontrado' };
  try {
    const payload = JSON.parse(row.payload_json) as unknown;
    const result = importMcpPayloadToRelationalTables(shopId, resourcePath, queryKey, payload, row.fetched_at);
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Reimporta todos los snapshots crudos del shop (útil tras migración o reparación). */
export function reimportAllSnapshotsForShop(shopId: string): {
  snapshots: number;
  results: { resource_path: string; query_key: string; result: ReturnType<typeof importMcpPayloadToRelationalTables> }[];
} {
  const keys = listMcpSnapshotKeys(shopId);
  const results: { resource_path: string; query_key: string; result: ReturnType<typeof importMcpPayloadToRelationalTables> }[] = [];
  for (const k of keys) {
    const row = getMcpSnapshotRow(shopId, k.resource_path, k.query_key);
    if (!row) continue;
    try {
      const payload = JSON.parse(row.payload_json) as unknown;
      const result = importMcpPayloadToRelationalTables(shopId, k.resource_path, k.query_key, payload, row.fetched_at);
      results.push({ resource_path: k.resource_path, query_key: k.query_key, result });
    } catch {
      /* skip corrupt */
    }
  }
  return { snapshots: results.length, results };
}

export type McpProductRow = {
  shop_id: string;
  product_id: string;
  sku: string | null;
  name: string;
  price: number;
  currency: string | null;
  category: string | null;
  is_active: number | null;
  updated_at_remote: string | null;
  synced_at: string;
};

export type McpCustomerRow = {
  shop_id: string;
  customer_id: string;
  name: string;
  rfc: string | null;
  status: string | null;
  allow_credit: number | null;
  updated_at_remote: string | null;
  synced_at: string;
};

export function listMcpCacheProducts(shopId: string, opts?: { limit?: number }): McpProductRow[] {
  ensureRelationalTables();
  const db = getPosKvDb();
  const limit = Math.min(Math.max(opts?.limit ?? 2000, 1), 10000);
  return db
    .prepare(
      `SELECT shop_id, product_id, sku, name, price, currency, category, is_active, updated_at_remote, synced_at
       FROM mcp_cache_product WHERE shop_id = ? ORDER BY name LIMIT ?`
    )
    .all(shopId, limit) as McpProductRow[];
}

export function listMcpCacheCustomers(shopId: string, opts?: { limit?: number }): McpCustomerRow[] {
  ensureRelationalTables();
  const db = getPosKvDb();
  const limit = Math.min(Math.max(opts?.limit ?? 5000, 1), 20000);
  return db
    .prepare(
      `SELECT shop_id, customer_id, name, rfc, status, allow_credit, updated_at_remote, synced_at
       FROM mcp_cache_customer WHERE shop_id = ? ORDER BY name LIMIT ?`
    )
    .all(shopId, limit) as McpCustomerRow[];
}

export function getMcpCacheShopRow(shopId: string): Record<string, unknown> | null {
  ensureRelationalTables();
  const db = getPosKvDb();
  const row = db.prepare(`SELECT * FROM mcp_cache_shop WHERE shop_id = ?`).get(shopId) as Record<string, unknown> | undefined;
  return row ?? null;
}
