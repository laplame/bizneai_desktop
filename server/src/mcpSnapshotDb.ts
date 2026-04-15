/**
 * Respaldos JSON del MCP remoto (bizneai.com) en SQLite local.
 * La fuente de verdad sigue siendo la API MCP; aquí solo se persiste una copia para recuperación / auditoría.
 * Misma base que pos-local-store.sqlite (getPosKvDb).
 */
import { getPosKvDb } from './posKvDb.js';

let tableReady = false;

function ensureMcpSnapshotTable(): void {
  if (tableReady) return;
  const db = getPosKvDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS mcp_remote_snapshot (
      shop_id TEXT NOT NULL,
      resource_path TEXT NOT NULL,
      query_key TEXT NOT NULL DEFAULT '',
      payload_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      PRIMARY KEY (shop_id, resource_path, query_key)
    );
    CREATE INDEX IF NOT EXISTS idx_mcp_remote_snapshot_fetched ON mcp_remote_snapshot(fetched_at);
  `);
  tableReady = true;
}

/** Devuelve `fetched_at` ISO usado en la fila (para alinear capa relacional). */
export function upsertMcpSnapshot(
  shopId: string,
  resourcePath: string,
  queryKey: string,
  payloadJson: string
): string {
  ensureMcpSnapshotTable();
  const db = getPosKvDb();
  const fetchedAt = new Date().toISOString();
  const qk = queryKey || '';
  db.prepare(
    `
    INSERT INTO mcp_remote_snapshot (shop_id, resource_path, query_key, payload_json, fetched_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(shop_id, resource_path, query_key) DO UPDATE SET
      payload_json = excluded.payload_json,
      fetched_at = excluded.fetched_at
  `
  ).run(shopId, resourcePath, qk, payloadJson, fetchedAt);
  return fetchedAt;
}

export function getMcpSnapshot(shopId: string, resourcePath: string, queryKey: string): string | null {
  const row = getMcpSnapshotRow(shopId, resourcePath, queryKey);
  return row?.payload_json ?? null;
}

export function getMcpSnapshotRow(
  shopId: string,
  resourcePath: string,
  queryKey: string
): { payload_json: string; fetched_at: string } | null {
  ensureMcpSnapshotTable();
  const db = getPosKvDb();
  const qk = queryKey || '';
  const row = db
    .prepare(
      `SELECT payload_json, fetched_at FROM mcp_remote_snapshot WHERE shop_id = ? AND resource_path = ? AND query_key = ?`
    )
    .get(shopId, resourcePath, qk) as { payload_json: string; fetched_at: string } | undefined;
  return row ?? null;
}

export function listMcpSnapshotKeys(shopId: string): { resource_path: string; query_key: string; fetched_at: string }[] {
  ensureMcpSnapshotTable();
  const db = getPosKvDb();
  return db
    .prepare(
      `SELECT resource_path, query_key, fetched_at FROM mcp_remote_snapshot WHERE shop_id = ? ORDER BY fetched_at DESC`
    )
    .all(shopId) as { resource_path: string; query_key: string; fetched_at: string }[];
}
