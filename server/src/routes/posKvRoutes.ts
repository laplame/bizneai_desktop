/**
 * Persistencia SQLite tipo KV para espejar claves críticas de localStorage (acceso rápido en cliente).
 */
import express from 'express';
import { getPosKvDb, kvGet, kvSet } from '../posKvDb.js';
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

export default router;
