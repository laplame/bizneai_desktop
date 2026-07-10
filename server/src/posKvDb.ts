import Database from 'better-sqlite3';
import { ensureBizneaiDataDir } from './dataPaths.js';
import path from 'path';

let db: Database.Database | null = null;
// Prepared statements are cached per connection: parsing the SQL once instead of
// on every kvGet/kvSet noticeably speeds up the hot mirror path (cart, products…).
let getStmt: Database.Statement | null = null;
let setStmt: Database.Statement | null = null;

export function getPosKvDb(): Database.Database {
  if (!db) {
    const dir = ensureBizneaiDataDir();
    const dbPath = path.join(dir, 'pos-local-store.sqlite');
    db = new Database(dbPath);
    // WAL + NORMAL: durable enough for a local store and far faster on writes than
    // the default FULL sync (WAL already protects against app crashes).
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS kv_store (
        k TEXT PRIMARY KEY,
        v TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    getStmt = db.prepare('SELECT v FROM kv_store WHERE k = ?');
    setStmt = db.prepare(`
      INSERT INTO kv_store (k, v, updated_at) VALUES (@k, @v, @t)
      ON CONFLICT(k) DO UPDATE SET v = excluded.v, updated_at = excluded.updated_at
    `);
  }
  return db;
}

export function kvGet(key: string): string | null {
  getPosKvDb();
  const row = getStmt!.get(key) as { v: string } | undefined;
  return row?.v ?? null;
}

export function kvSet(key: string, value: string): void {
  getPosKvDb();
  setStmt!.run({ k: key, v: value, t: new Date().toISOString() });
}
