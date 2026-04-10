import path from 'path';
import Database from 'better-sqlite3';
import { ensureBizneaiDataDir } from './dataPaths.js';

const dataDir = ensureBizneaiDataDir();
const dbPath = path.join(dataDir, 'local-activity.db');

let db: Database.Database | null = null;

export function getLocalActivityDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initTables(db);
  }
  return db;
}

function initTables(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS session_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      source TEXT NOT NULL,
      role TEXT,
      name TEXT,
      email TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_session_shop ON session_events(shop_id);
    CREATE INDEX IF NOT EXISTS idx_session_created ON session_events(created_at);

    CREATE TABLE IF NOT EXISTS sale_cashier_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id TEXT NOT NULL,
      transaction_id TEXT,
      client_event_id TEXT,
      total REAL NOT NULL,
      payment_method TEXT,
      cashier_source TEXT,
      cashier_role TEXT,
      cashier_name TEXT,
      cashier_email TEXT,
      items_summary TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sale_shop ON sale_cashier_events(shop_id);
    CREATE INDEX IF NOT EXISTS idx_sale_created ON sale_cashier_events(created_at);
  `);
  createActivityConsoleViews(database);
}

/** Vistas para la consola BD: ventas (POS local), clientes/usuarios en sesión, historial unificado. */
function createActivityConsoleViews(database: Database.Database): void {
  database.exec(`
    CREATE VIEW IF NOT EXISTS vista_ventas AS
    SELECT
      id,
      shop_id AS tienda,
      transaction_id AS id_transaccion,
      client_event_id AS id_evento_cliente,
      total AS total,
      payment_method AS metodo_pago,
      cashier_name AS cajero,
      cashier_role AS rol_cajero,
      cashier_email AS email_cajero,
      cashier_source AS origen_cajero,
      items_summary AS resumen_items,
      created_at AS fecha
    FROM sale_cashier_events;

    CREATE VIEW IF NOT EXISTS vista_clientes AS
    SELECT
      id,
      shop_id AS tienda,
      name AS nombre,
      email,
      role AS rol,
      source AS origen,
      event_type AS tipo_evento,
      created_at AS fecha
    FROM session_events
    WHERE (name IS NOT NULL AND TRIM(name) != '')
       OR (email IS NOT NULL AND TRIM(email) != '');

    CREATE VIEW IF NOT EXISTS vista_historial AS
    SELECT
      'sesion' AS categoria,
      id,
      shop_id AS tienda,
      event_type AS tipo,
      COALESCE(
        NULLIF(TRIM(name), ''),
        NULLIF(TRIM(email), ''),
        source
      ) AS descripcion,
      created_at AS fecha
    FROM session_events
    UNION ALL
    SELECT
      'venta_pos' AS categoria,
      id,
      shop_id AS tienda,
      'sale_cashier' AS tipo,
      COALESCE(
        items_summary,
        'Tx ' || IFNULL(transaction_id, '') || ' $' || printf('%.2f', total)
      ) AS descripcion,
      created_at AS fecha
    FROM sale_cashier_events;
  `);
}

export interface SessionEventRow {
  id: number;
  shop_id: string;
  event_type: string;
  source: string;
  role: string | null;
  name: string | null;
  email: string | null;
  created_at: string;
}

export interface SaleCashierRow {
  id: number;
  shop_id: string;
  transaction_id: string | null;
  client_event_id: string | null;
  total: number;
  payment_method: string | null;
  cashier_source: string | null;
  cashier_role: string | null;
  cashier_name: string | null;
  cashier_email: string | null;
  items_summary: string | null;
  created_at: string;
}

export function insertSessionEvent(row: Omit<SessionEventRow, 'id'>): number {
  const d = getLocalActivityDb();
  const stmt = d.prepare(`
    INSERT INTO session_events (shop_id, event_type, source, role, name, email, created_at)
    VALUES (@shop_id, @event_type, @source, @role, @name, @email, @created_at)
  `);
  const info = stmt.run({
    shop_id: row.shop_id,
    event_type: row.event_type,
    source: row.source,
    role: row.role ?? null,
    name: row.name ?? null,
    email: row.email ?? null,
    created_at: row.created_at,
  });
  return Number(info.lastInsertRowid);
}

export function insertSaleCashierEvent(row: Omit<SaleCashierRow, 'id'>): number {
  const d = getLocalActivityDb();
  const stmt = d.prepare(`
    INSERT INTO sale_cashier_events (
      shop_id, transaction_id, client_event_id, total, payment_method,
      cashier_source, cashier_role, cashier_name, cashier_email, items_summary, created_at
    ) VALUES (
      @shop_id, @transaction_id, @client_event_id, @total, @payment_method,
      @cashier_source, @cashier_role, @cashier_name, @cashier_email, @items_summary, @created_at
    )
  `);
  const info = stmt.run({
    shop_id: row.shop_id,
    transaction_id: row.transaction_id ?? null,
    client_event_id: row.client_event_id ?? null,
    total: row.total,
    payment_method: row.payment_method ?? null,
    cashier_source: row.cashier_source ?? null,
    cashier_role: row.cashier_role ?? null,
    cashier_name: row.cashier_name ?? null,
    cashier_email: row.cashier_email ?? null,
    items_summary: row.items_summary ?? null,
    created_at: row.created_at,
  });
  return Number(info.lastInsertRowid);
}

export function listSessionEvents(shopId: string, limit: number): SessionEventRow[] {
  const d = getLocalActivityDb();
  const stmt = d.prepare(`
    SELECT id, shop_id, event_type, source, role, name, email, created_at
    FROM session_events
    WHERE shop_id = ?
    ORDER BY datetime(created_at) DESC
    LIMIT ?
  `);
  return stmt.all(shopId, limit) as SessionEventRow[];
}

export function listSaleCashierEvents(shopId: string, limit: number): SaleCashierRow[] {
  const d = getLocalActivityDb();
  const stmt = d.prepare(`
    SELECT id, shop_id, transaction_id, client_event_id, total, payment_method,
           cashier_source, cashier_role, cashier_name, cashier_email, items_summary, created_at
    FROM sale_cashier_events
    WHERE shop_id = ?
    ORDER BY datetime(created_at) DESC
    LIMIT ?
  `);
  return stmt.all(shopId, limit) as SaleCashierRow[];
}
