/**
 * Fusiona entradas locales (POS, reservas, fulfillment) con las devueltas por GET /waitlist/entries.
 * No sustituye el array local por el remoto: preserva filas solo locales y combina campos POS en duplicados por _id.
 */

import { normalizeWaitlistItemsArray } from '../api/waitlistResourceMap';

export interface WaitlistEntryLike {
  _id: string;
  shopId?: string;
  name: string;
  items: unknown[];
  total: number;
  source?: 'local' | 'online';
  status: 'waiting' | 'completed' | string;
  notes?: string;
  fulfillmentState?: string;
  customerId?: number;
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
    customerId?: number;
  };
  timestamp: string;
  partySize?: number;
  estimatedWaitTime?: number;
}

function normalizeStatus(raw: unknown): string {
  const t = String(raw ?? 'waiting');
  if (t === 'waiting' || t === 'preparing' || t === 'ready' || t === 'completed') return t;
  return 'waiting';
}

const WAITLIST_STATUS_RANK: Record<string, number> = {
  waiting: 0,
  preparing: 1,
  ready: 2,
  completed: 3,
};

export function waitlistStatusRank(raw: unknown): number {
  const t = normalizeStatus(raw);
  return WAITLIST_STATUS_RANK[t] ?? 0;
}

/** Elige el estado más avanzado (p. ej. `completed` gana sobre `waiting`) al combinar API + local. */
export function pickMoreAdvancedWaitlistStatus(a: unknown, b: unknown): string {
  const na = normalizeStatus(a);
  const nb = normalizeStatus(b);
  return waitlistStatusRank(nb) > waitlistStatusRank(na) ? nb : na;
}

/** Normaliza una fila del API a la forma del POS. */
export function normalizeRemoteWaitlistEntry(entry: Record<string, unknown>): WaitlistEntryLike {
  const items = normalizeWaitlistItemsArray(entry.items) as unknown[];
  const ts =
    (typeof entry.timestamp === 'string' && entry.timestamp) ||
    (typeof entry.createdAt === 'string' && entry.createdAt) ||
    new Date().toISOString();
  return {
    _id: String(entry._id ?? ''),
    shopId: entry.shopId != null ? String(entry.shopId) : undefined,
    name: String(entry.name ?? (entry.customerInfo as { name?: string } | undefined)?.name ?? 'Cliente'),
    items,
    total: typeof entry.total === 'number' ? entry.total : Number(entry.total) || 0,
    source: entry.source === 'online' ? 'online' : 'local',
    status: normalizeStatus(entry.status),
    notes: typeof entry.notes === 'string' ? entry.notes : undefined,
    fulfillmentState: typeof entry.fulfillmentState === 'string' ? entry.fulfillmentState : undefined,
    customerId: typeof entry.customerId === 'number' ? entry.customerId : undefined,
    customerInfo:
      entry.customerInfo && typeof entry.customerInfo === 'object'
        ? (entry.customerInfo as WaitlistEntryLike['customerInfo'])
        : undefined,
    timestamp: ts,
    partySize: typeof entry.partySize === 'number' ? entry.partySize : undefined,
    estimatedWaitTime:
      typeof entry.estimatedWaitTime === 'number'
        ? entry.estimatedWaitTime
        : typeof entry.estimatedTime === 'number'
          ? entry.estimatedTime
          : undefined,
  };
}

/**
 * - Entradas remotas por _id como base.
 * - Entradas solo locales (sin id remoto) se añaden.
 * - Mismo _id: se prioriza remoto y se rellenan huecos POS desde local (fulfillment, cliente, ítems si el local tiene carrito).
 */
/**
 * Quita filas que quedaron en localStorage al mapear leads de GET /waitlist? (email + _id ObjectId, sin carrito).
 * No afecta entradas POS (`waitlist_*`, fulfillment, o filas con ítems).
 */
export function filterStaleMarketingWaitlistRows<T extends WaitlistEntryLike>(rows: T[]): T[] {
  return rows.filter((row) => {
    const id = String(row._id ?? '');
    if (id.startsWith('waitlist_')) return true;
    if (row.fulfillmentState) return true;
    const items = row.items;
    const hasItems = Array.isArray(items) && items.length > 0;
    if (hasItems || (row.total ?? 0) > 0) return true;
    if (/^[a-f0-9]{24}$/i.test(id)) return false;
    return true;
  });
}

/**
 * Unifica filas con el mismo `_id` (p. ej. GET /entries + GET /orders + /status/completed).
 * Si hay duplicado, fusiona campos y conserva el **status** más avanzado (completed sobre waiting).
 */
export function dedupeWaitlistRowsById<T extends { _id?: string; status?: unknown }>(rows: T[]): T[] {
  const byId = new Map<string, T>();
  for (const row of rows) {
    const id = row._id != null ? String(row._id) : '';
    if (!id) continue;
    const prev = byId.get(id);
    if (!prev) {
      byId.set(id, row);
      continue;
    }
    const status = pickMoreAdvancedWaitlistStatus(prev.status, row.status);
    byId.set(id, { ...prev, ...row, status } as T);
  }
  return Array.from(byId.values());
}

export function mergeWaitlistEntries<T extends WaitlistEntryLike>(
  local: T[],
  remoteRaw: unknown[]
): T[] {
  const remoteNorm = remoteRaw
    .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object')
    .map((e) => normalizeRemoteWaitlistEntry(e) as T);

  const byId = new Map<string, T>();

  for (const r of remoteNorm) {
    if (r._id) byId.set(r._id, r);
  }

  for (const l of local) {
    if (!l._id) continue;
    if (!byId.has(l._id)) {
      byId.set(l._id, l);
      continue;
    }
    const r = byId.get(l._id)!;
    const mergedStatus = pickMoreAdvancedWaitlistStatus(r.status, l.status);
    const fulfillmentState =
      mergedStatus === 'completed'
        ? typeof r.fulfillmentState === 'string' && r.fulfillmentState
          ? r.fulfillmentState
          : typeof l.fulfillmentState === 'string' && l.fulfillmentState
            ? l.fulfillmentState
            : 'completed'
        : (l.fulfillmentState ?? r.fulfillmentState);
    const combined = {
      ...r,
      ...l,
      status: mergedStatus,
      fulfillmentState,
      customerId: l.customerId ?? r.customerId,
      customerInfo: l.customerInfo ?? r.customerInfo,
      items:
        Array.isArray(l.items) && l.items.length > 0 ? l.items : r.items,
      total: l.total || r.total,
      notes: l.notes || r.notes,
    };
    byId.set(l._id, combined as T);
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
