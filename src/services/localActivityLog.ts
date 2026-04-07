/**
 * Registro de sesión (PIN) y ventas por usuario/cajero.
 * - Intenta persistir en SQLite vía API local (server :3000)
 * - Siempre guarda copia en localStorage como respaldo
 */
import { getShopId } from '../utils/shopIdHelper';
import { getLocalApiOrigin, shouldUseSalesMcpProxy } from '../utils/localApiBase';
import type { ScreenLockIdentity } from '../types/screenLock';

const LS_SESSIONS = 'bizneai-local-activity-sessions';
const LS_SALES = 'bizneai-local-activity-sales';
const MAX_ROWS = 3000;

const baseUrl = (): string => {
  if (typeof window === 'undefined') return '';
  return shouldUseSalesMcpProxy() ? getLocalApiOrigin() : '';
};

function trimStore<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  return arr.slice(0, max);
}

export interface LocalSessionEvent {
  id: string;
  shop_id: string;
  event_type: 'unlock' | 'lock';
  source: 'role' | 'legacy' | 'super';
  role?: string | null;
  name?: string | null;
  email?: string | null;
  created_at: string;
}

export interface LocalSaleCashierEvent {
  id: string;
  shop_id: string;
  transaction_id?: string | null;
  client_event_id?: string | null;
  total: number;
  payment_method?: string | null;
  cashier_source?: string | null;
  cashier_role?: string | null;
  cashier_name?: string | null;
  cashier_email?: string | null;
  items_summary?: string | null;
  created_at: string;
}

function readSessions(): LocalSessionEvent[] {
  try {
    const raw = localStorage.getItem(LS_SESSIONS);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function writeSessions(rows: LocalSessionEvent[]): void {
  localStorage.setItem(LS_SESSIONS, JSON.stringify(trimStore(rows, MAX_ROWS)));
}

function readSales(): LocalSaleCashierEvent[] {
  try {
    const raw = localStorage.getItem(LS_SALES);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function writeSales(rows: LocalSaleCashierEvent[]): void {
  localStorage.setItem(LS_SALES, JSON.stringify(trimStore(rows, MAX_ROWS)));
}

function pushLocalSession(row: LocalSessionEvent): void {
  const all = readSessions();
  all.unshift(row);
  writeSessions(all);
}

function pushLocalSale(row: LocalSaleCashierEvent): void {
  const all = readSales();
  all.unshift(row);
  writeSales(all);
}

async function postJson(path: string, body: unknown): Promise<boolean> {
  const base = baseUrl();
  if (!base) return false;
  try {
    const r = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    return r.ok;
  } catch {
    return false;
  }
}

function identityToPayload(identity: ScreenLockIdentity | null): {
  source: 'role' | 'legacy' | 'super';
  role?: string;
  name?: string;
  email?: string;
} {
  if (!identity) {
    return { source: 'legacy' };
  }
  if (identity.source === 'legacy') {
    return { source: 'legacy' };
  }
  if (identity.source === 'super') {
    return { source: 'super', role: identity.role };
  }
  return {
    source: 'role',
    role: identity.role,
    name: identity.name,
    email: identity.email,
  };
}

/** Misma clave que se usa al guardar eventos (incl. sin Shop ID configurado). */
export function getActivityShopId(): string {
  return getShopId() || 'local-unconfigured';
}

/** Tras desbloquear con PIN correcto (identidad ya guardada en sesión). */
export function recordSessionUnlock(identity: ScreenLockIdentity): void {
  const shopId = getActivityShopId();
  const created_at = new Date().toISOString();
  const p = identityToPayload(identity);
  const row: LocalSessionEvent = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    shop_id: shopId,
    event_type: 'unlock',
    source: p.source,
    role: p.role ?? null,
    name: p.name ?? null,
    email: p.email ?? null,
    created_at,
  };
  pushLocalSession(row);
  void postJson('/api/local-activity/session', {
    shopId,
    eventType: 'unlock',
    source: p.source,
    role: p.role,
    name: p.name,
    email: p.email,
  });
}

/** Al bloquear pantalla (identidad del usuario que cerraba sesión, antes de borrar). */
export function recordSessionLock(identity: ScreenLockIdentity | null): void {
  const shopId = getActivityShopId();
  const created_at = new Date().toISOString();
  const p = identityToPayload(identity);
  const row: LocalSessionEvent = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    shop_id: shopId,
    event_type: 'lock',
    source: p.source,
    role: p.role ?? null,
    name: p.name ?? null,
    email: p.email ?? null,
    created_at,
  };
  pushLocalSession(row);
  void postJson('/api/local-activity/session', {
    shopId,
    eventType: 'lock',
    source: p.source,
    role: p.role,
    name: p.name,
    email: p.email,
  });
}

export function recordSaleCashier(params: {
  transactionId?: string | null;
  clientEventId?: string | null;
  total: number;
  paymentMethod: string;
  itemsSummary: string;
  identity: ScreenLockIdentity | null;
}): void {
  const shopId = getActivityShopId();
  const created_at = new Date().toISOString();
  const id = params.identity;
  const cashier =
    id && (id.source === 'role' || id.source === 'super')
      ? {
          source: id.source,
          role: id.role,
          name: id.name,
          email: id.email,
        }
      : { source: 'legacy' as const };

  const row: LocalSaleCashierEvent = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    shop_id: shopId,
    transaction_id: params.transactionId ?? null,
    client_event_id: params.clientEventId ?? null,
    total: params.total,
    payment_method: params.paymentMethod,
    cashier_source: cashier.source,
    cashier_role: 'role' in cashier ? cashier.role ?? null : null,
    cashier_name: 'role' in cashier ? cashier.name ?? null : null,
    cashier_email: 'role' in cashier ? cashier.email ?? null : null,
    items_summary: params.itemsSummary.slice(0, 2000),
    created_at,
  };
  pushLocalSale(row);
  void postJson('/api/local-activity/sale', {
    shopId,
    transactionId: params.transactionId ?? undefined,
    clientEventId: params.clientEventId ?? undefined,
    total: params.total,
    paymentMethod: params.paymentMethod,
    itemsSummary: params.itemsSummary,
    cashier,
  });
}

export async function fetchSessionEventsMerged(shopId: string): Promise<LocalSessionEvent[]> {
  const local = readSessions().filter((r) => r.shop_id === shopId);
  const base = baseUrl();
  if (!base) return local.sort((a, b) => b.created_at.localeCompare(a.created_at));
  try {
    const r = await fetch(
      `${base}/api/local-activity/sessions?shopId=${encodeURIComponent(shopId)}&limit=500`
    );
    if (!r.ok) throw new Error('bad');
    const server = (await r.json()) as Array<{
      id: number;
      shop_id: string;
      event_type: string;
      source: string;
      role: string | null;
      name: string | null;
      email: string | null;
      created_at: string;
    }>;
    const mapped: LocalSessionEvent[] = server.map((s) => ({
      id: `srv-${s.id}`,
      shop_id: s.shop_id,
      event_type: s.event_type as 'unlock' | 'lock',
      source: s.source as 'role' | 'legacy' | 'super',
      role: s.role,
      name: s.name,
      email: s.email,
      created_at: s.created_at,
    }));
    const byKey = new Set(mapped.map((m) => `${m.event_type}-${m.created_at}-${m.name}-${m.email}`));
    for (const l of local) {
      const k = `${l.event_type}-${l.created_at}-${l.name}-${l.email}`;
      if (!byKey.has(k)) {
        byKey.add(k);
        mapped.push(l);
      }
    }
    return mapped.sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch {
    return local.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
}

export async function fetchSaleCashierMerged(shopId: string): Promise<LocalSaleCashierEvent[]> {
  const local = readSales().filter((r) => r.shop_id === shopId);
  const base = baseUrl();
  if (!base) return local.sort((a, b) => b.created_at.localeCompare(a.created_at));
  try {
    const r = await fetch(
      `${base}/api/local-activity/sales?shopId=${encodeURIComponent(shopId)}&limit=500`
    );
    if (!r.ok) throw new Error('bad');
    const server = (await r.json()) as Array<{
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
    }>;
    const mapped: LocalSaleCashierEvent[] = server.map((s) => ({
      id: `srv-${s.id}`,
      shop_id: s.shop_id,
      transaction_id: s.transaction_id,
      client_event_id: s.client_event_id,
      total: s.total,
      payment_method: s.payment_method,
      cashier_source: s.cashier_source,
      cashier_role: s.cashier_role,
      cashier_name: s.cashier_name,
      cashier_email: s.cashier_email,
      items_summary: s.items_summary,
      created_at: s.created_at,
    }));
    const seen = new Set(mapped.map((m) => `${m.transaction_id}-${m.created_at}-${m.total}`));
    for (const l of local) {
      const k = `${l.transaction_id}-${l.created_at}-${l.total}`;
      if (!seen.has(k)) {
        seen.add(k);
        mapped.push(l);
      }
    }
    return mapped.sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch {
    return local.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
}
