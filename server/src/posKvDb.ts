import Database from 'better-sqlite3';
import { ensureBizneaiDataDir } from './dataPaths.js';
import path from 'path';

let db: Database.Database | null = null;

export function getPosKvDb(): Database.Database {
  if (!db) {
    const dir = ensureBizneaiDataDir();
    const dbPath = path.join(dir, 'pos-local-store.sqlite');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS kv_store (
        k TEXT PRIMARY KEY,
        v TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }
  return db;
}

export function kvGet(key: string): string | null {
  const d = getPosKvDb();
  const row = d.prepare('SELECT v FROM kv_store WHERE k = ?').get(key) as { v: string } | undefined;
  return row?.v ?? null;
}

export function kvSet(key: string, value: string): void {
  const d = getPosKvDb();
  const now = new Date().toISOString();
  d.prepare(`
    INSERT INTO kv_store (k, v, updated_at) VALUES (@k, @v, @t)
    ON CONFLICT(k) DO UPDATE SET v = excluded.v, updated_at = excluded.updated_at
  `).run({ k: key, v: value, t: now });
}
