/**
 * Persistencia SQLite tipo KV para espejar claves críticas de localStorage (acceso rápido en cliente).
 */
import express from 'express';
import { getPosKvDb, kvGet, kvSet } from '../posKvDb.js';
import { getMcpSnapshot, listMcpSnapshotKeys, upsertMcpSnapshot } from '../mcpSnapshotDb.js';
import {
  importMcpPayloadToRelationalTables,
  listMcpCacheCustomers,
  listMcpCacheProducts,
  getMcpCacheShopRow,
  reimportAllSnapshotsForShop,
  reimportFromStoredSnapshot,
} from '../mcpRelationalImport.js';
import { getLocalActivityDb } from '../localActivityDb.js';
import { ensureBizneaiDataDir, getBizneaiDataDir } from '../dataPaths.js';
import { getDatabase } from '../../../src/database/database.js';

const router = express.Router();

const KEY_RE = /^[a-zA-Z0-9._@-]{1,120}$/;

function kvKeyFromQuery(raw: unknown): string {
  if (Array.isArray(raw)) return String(raw[0] ?? '').trim();
  return String(raw ?? '').trim();
}

router.get('/status', (_req, res) => {
  try {
    getPosKvDb();
    res.json({
      ok: true,
      dataDir: getBizneaiDataDir(),
      kv: 'pos-local-store.sqlite',
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

/** Inicializa ficheros SQLite (KV + actividad local) y opcionalmente bizneai.db legado. */
router.post('/init', (_req, res) => {
  try {
    ensureBizneaiDataDir();
    getPosKvDb();
    getLocalActivityDb();
    let legacyDbOk = false;
    try {
      getDatabase();
      legacyDbOk = true;
    } catch (legacyErr) {
      console.warn('[pos/init] bizneai.db legado no disponible (KV y actividad local sí):', legacyErr);
    }
    res.json({ ok: true, dataDir: getBizneaiDataDir(), legacyDb: legacyDbOk });
  } catch (e) {
    console.error('[pos/init]', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

router.get('/kv', (req, res) => {
  const key = kvKeyFromQuery(req.query.key);
  if (!KEY_RE.test(key)) {
    return res.status(400).json({ error: 'key query inválida' });
  }
  try {
    const v = kvGet(key);
    if (v === null) return res.status(404).json({ error: 'no encontrado' });
    res.type('application/json').send(v);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.put('/kv', (req, res) => {
  const key = kvKeyFromQuery(req.query.key);
  if (!KEY_RE.test(key)) {
    return res.status(400).json({ error: 'key query inválida' });
  }
  try {
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || buf.length === 0) {
      return res.status(400).json({ error: 'body requerido' });
    }
    const rawStr = buf.toString('utf8');
    const ct = (req.get('content-type') || '').toLowerCase();
    let bodyStr: string;
    if (ct.includes('application/json')) {
      try {
        const parsed = JSON.parse(rawStr) as unknown;
        bodyStr = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
      } catch {
        return res.status(400).json({ error: 'JSON inválido' });
      }
    } else {
      bodyStr = rawStr;
    }
    kvSet(key, bodyStr);
    res.json({ ok: true, key });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete('/kv', (req, res) => {
  const key = kvKeyFromQuery(req.query.key);
  if (!KEY_RE.test(key)) {
    return res.status(400).json({ error: 'key query inválida' });
  }
  try {
    const d = getPosKvDb();
    d.prepare('DELETE FROM kv_store WHERE k = ?').run(key);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

const SHOP_ID_RE = /^[a-zA-Z0-9._-]{1,80}$/;
const RESOURCE_RE = /^[a-zA-Z0-9._/@-]{1,120}$/;

/**
 * PUT respuesta JSON del MCP (bizneai.com) como respaldo en SQLite.
 * Body: { shopId, resourcePath, queryKey?, payload }
 */
router.put('/mcp-snapshot', (req, res) => {
  try {
    const body = req.body as {
      shopId?: string;
      resourcePath?: string;
      queryKey?: string;
      payload?: unknown;
    };
    const shopId = String(body.shopId ?? '').trim();
    const resourcePath = String(body.resourcePath ?? '').trim();
    if (!SHOP_ID_RE.test(shopId) || !RESOURCE_RE.test(resourcePath)) {
      return res.status(400).json({ ok: false, error: 'shopId o resourcePath inválidos' });
    }
    const queryKey = String(body.queryKey ?? '').trim().slice(0, 200);
    const payloadJson = JSON.stringify(body.payload ?? null);
    const fetchedAt = upsertMcpSnapshot(shopId, resourcePath, queryKey, payloadJson);
    let relational: ReturnType<typeof importMcpPayloadToRelationalTables> | null = null;
    let relationalError: string | undefined;
    try {
      const parsed = body.payload !== undefined ? body.payload : (JSON.parse(payloadJson) as unknown);
      relational = importMcpPayloadToRelationalTables(shopId, resourcePath, queryKey, parsed, fetchedAt);
    } catch (e) {
      relationalError = e instanceof Error ? e.message : String(e);
    }
    res.json({ ok: true, relational, ...(relationalError ? { relationalError } : {}) });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

/** GET respaldo guardado (misma forma JSON que devolvió el MCP). */
router.get('/mcp-snapshot', (req, res) => {
  try {
    const shopId = String(kvKeyFromQuery(req.query.shopId)).trim();
    const resourcePath = String(kvKeyFromQuery(req.query.resourcePath)).trim();
    const queryKey = String(kvKeyFromQuery(req.query.queryKey ?? '')).trim();
    if (!SHOP_ID_RE.test(shopId) || !RESOURCE_RE.test(resourcePath)) {
      return res.status(400).json({ ok: false, error: 'shopId o resourcePath inválidos' });
    }
    const raw = getMcpSnapshot(shopId, resourcePath, queryKey);
    if (raw === null) return res.status(404).json({ ok: false, error: 'no encontrado' });
    res.type('application/json').send(raw);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

/** Lista claves de snapshot guardadas para un shop (metadatos). */
router.get('/mcp-snapshot/keys', (req, res) => {
  try {
    const shopId = String(kvKeyFromQuery(req.query.shopId)).trim();
    if (!SHOP_ID_RE.test(shopId)) {
      return res.status(400).json({ ok: false, error: 'shopId inválido' });
    }
    res.json({ ok: true, keys: listMcpSnapshotKeys(shopId) });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

/** Reimporta capa relacional desde una fila cruda de mcp_remote_snapshot. */
router.post('/mcp-cache/reimport-one', (req, res) => {
  try {
    const shopId = String(kvKeyFromQuery(req.query.shopId)).trim();
    const resourcePath = String(kvKeyFromQuery(req.query.resourcePath)).trim();
    const queryKey = String(kvKeyFromQuery(req.query.queryKey ?? '')).trim();
    if (!SHOP_ID_RE.test(shopId) || !RESOURCE_RE.test(resourcePath)) {
      return res.status(400).json({ ok: false, error: 'parámetros inválidos' });
    }
    const out = reimportFromStoredSnapshot(shopId, resourcePath, queryKey);
    if (!out.ok) return res.status(404).json({ ok: false, error: out.error });
    res.json({ ok: true, result: out.result });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

/** Reimporta todos los snapshots crudos del shop a tablas mcp_cache_*. */
router.post('/mcp-cache/reimport-all', (req, res) => {
  try {
    const shopId = String(kvKeyFromQuery(req.query.shopId)).trim();
    if (!SHOP_ID_RE.test(shopId)) {
      return res.status(400).json({ ok: false, error: 'shopId inválido' });
    }
    const out = reimportAllSnapshotsForShop(shopId);
    res.json({ ok: true, ...out });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

router.get('/mcp-cache/shop', (req, res) => {
  try {
    const shopId = String(kvKeyFromQuery(req.query.shopId)).trim();
    if (!SHOP_ID_RE.test(shopId)) {
      return res.status(400).json({ ok: false, error: 'shopId inválido' });
    }
    const row = getMcpCacheShopRow(shopId);
    if (!row) return res.status(404).json({ ok: false, error: 'sin fila en mcp_cache_shop' });
    res.json({ ok: true, shop: row });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

router.get('/mcp-cache/products', (req, res) => {
  try {
    const shopId = String(kvKeyFromQuery(req.query.shopId)).trim();
    if (!SHOP_ID_RE.test(shopId)) {
      return res.status(400).json({ ok: false, error: 'shopId inválido' });
    }
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '2000'), 10) || 2000, 1), 10000);
    const products = listMcpCacheProducts(shopId, { limit });
    res.json({ ok: true, count: products.length, products });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

router.get('/mcp-cache/customers', (req, res) => {
  try {
    const shopId = String(kvKeyFromQuery(req.query.shopId)).trim();
    if (!SHOP_ID_RE.test(shopId)) {
      return res.status(400).json({ ok: false, error: 'shopId inválido' });
    }
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '5000'), 10) || 5000, 1), 20000);
    const customers = listMcpCacheCustomers(shopId, { limit });
    res.json({ ok: true, count: customers.length, customers });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

export default router;
