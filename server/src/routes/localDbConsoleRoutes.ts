/**
 * Consola SQL de solo lectura para SQLite locales (KV, actividad, legado).
 * Solo accesible desde localhost o con BIZNEAI_EMBEDDED=1 (Electron).
 */
import express from 'express';
import type Database from 'better-sqlite3';
import path from 'path';
import { getPosKvDb } from '../posKvDb.js';
import { getLocalActivityDb } from '../localActivityDb.js';
import { getDatabase, getLegacyBizneaiDbPath } from '../../../src/database/database.js';
import { ensureBizneaiDataDir } from '../dataPaths.js';

const router = express.Router();

function requireLocalConsole(req: express.Request, res: express.Response, next: express.NextFunction) {
  const embedded = process.env.BIZNEAI_EMBEDDED === '1';
  const ip = req.socket.remoteAddress || '';
  const local =
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '::ffff:127.0.0.1' ||
    ip.endsWith('127.0.0.1');
  if (embedded || local) return next();
  res.status(403).json({ error: 'Consola BD solo disponible en entorno local o app de escritorio' });
}

router.use(requireLocalConsole);

function assertReadOnlySql(sql: string): void {
  const s = sql.trim();
  if (!s) throw new Error('SQL vacío');
  const noComments = s.replace(/--[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');
  if (/;\s*\S/.test(noComments)) {
    throw new Error('Ejecuta una sola sentencia');
  }
  if (/^EXPLAIN\b/i.test(s)) return;
  if (/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|ATTACH|DETACH|VACUUM|TRUNCATE)\b/i.test(s)) {
    throw new Error('Solo consultas de lectura');
  }
  if (/^SELECT\b/i.test(s) || /^WITH\b/i.test(s)) return;
  if (/^PRAGMA\b/i.test(s)) {
    if (/\b(write_|encoding\s*=)\b/i.test(s)) throw new Error('Este PRAGMA no está permitido');
    return;
  }
  throw new Error('Solo SELECT, WITH, EXPLAIN o PRAGMA de inspección');
}

function getDbByKey(key: string): Database.Database {
  switch (key) {
    case 'kv':
      return getPosKvDb();
    case 'activity':
      return getLocalActivityDb();
    case 'legacy':
      return getDatabase().getRawSqliteDb();
    default:
      throw new Error('Base desconocida (use kv, activity o legacy)');
  }
}

router.get('/meta', (_req, res) => {
  try {
    const dir = ensureBizneaiDataDir();
    res.json({
      dataDir: dir,
      databases: [
        {
          key: 'kv',
          label: 'KV (localStorage espejado)',
          file: 'pos-local-store.sqlite',
          path: path.join(dir, 'pos-local-store.sqlite'),
        },
        {
          key: 'activity',
          label: 'Actividad local',
          file: 'local-activity.db',
          path: path.join(dir, 'local-activity.db'),
        },
        {
          key: 'legacy',
          label: 'Legado (bizneai.db)',
          file: 'bizneai.db',
          path: getLegacyBizneaiDbPath(),
        },
      ],
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/:dbKey/tables', (req, res) => {
  try {
    const db = getDbByKey(req.params.dbKey);
    const rows = db
      .prepare(`SELECT name, type FROM sqlite_master WHERE type IN ('table','view') ORDER BY name`)
      .all() as { name: string; type: string }[];
    res.json({ tables: rows });
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

router.post('/:dbKey/query', express.json({ limit: '512kb' }), (req, res) => {
  try {
    const sql = typeof req.body?.sql === 'string' ? req.body.sql : '';
    assertReadOnlySql(sql);
    const db = getDbByKey(req.params.dbKey);
    const stmt = db.prepare(sql);
    const rows = stmt.all();
    res.json({ rows, count: Array.isArray(rows) ? rows.length : 0 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(400).json({ error: msg });
  }
});

export default router;
