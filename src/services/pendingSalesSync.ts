/**
 * Cola de ventas que no pudieron enviarse al servidor (sin red, 5xx, etc.).
 * Se reintenta al recuperar conexión y periódicamente para alinear inventario remoto.
 */
import type { CreateSaleInput } from '../api/sales';
import { createSale } from '../api/sales';
import { scheduleMirrorKeyToSqlite } from './posPersistService';
import { runBackgroundSync } from '../utils/syncService';

export const PENDING_SALES_STORAGE_KEY = 'bizneai-pending-sales';

const MAX_QUEUED = 300;
const FLUSH_INTERVAL_MS = 45_000;
let flushInFlight = false;
let listenersInstalled = false;

export interface PendingSaleRecord {
  /** Igual que clientEventId — deduplicación en cola */
  id: string;
  shopId: string;
  clientEventId: string;
  payload: CreateSaleInput;
  enqueuedAt: number;
  attemptCount: number;
}

function readQueue(): PendingSaleRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PENDING_SALES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidRecord);
  } catch {
    return [];
  }
}

function isValidRecord(x: unknown): x is PendingSaleRecord {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.shopId === 'string' &&
    typeof r.clientEventId === 'string' &&
    r.payload != null &&
    typeof r.payload === 'object' &&
    typeof r.enqueuedAt === 'number' &&
    typeof r.attemptCount === 'number'
  );
}

function writeQueue(q: PendingSaleRecord[]): void {
  if (typeof window === 'undefined') return;
  const trimmed = q.length > MAX_QUEUED ? q.slice(-MAX_QUEUED) : q;
  localStorage.setItem(PENDING_SALES_STORAGE_KEY, JSON.stringify(trimmed));
  scheduleMirrorKeyToSqlite(PENDING_SALES_STORAGE_KEY);
  try {
    window.dispatchEvent(new CustomEvent('pending-sales-queue-changed', { detail: { count: trimmed.length } }));
  } catch {
    /* ignore */
  }
}

export function getPendingSalesCount(): number {
  return readQueue().length;
}

/**
 * Encola una venta para reenvío (mismo clientEventId que el intento fallido).
 */
export function enqueuePendingSale(entry: Omit<PendingSaleRecord, 'attemptCount'>): void {
  const q = readQueue();
  const withoutDup = q.filter((r) => r.clientEventId !== entry.clientEventId);
  const next: PendingSaleRecord = {
    ...entry,
    attemptCount: 0,
  };
  withoutDup.push(next);
  writeQueue(withoutDup);
  console.warn('[SALE] Venta en cola pendiente de sincronización:', entry.clientEventId);
  void flushPendingSalesSoon();
}

/** Programa un flush sin bloquear (p. ej. justo después de encolar). */
export function flushPendingSalesSoon(): void {
  if (typeof window === 'undefined') return;
  window.setTimeout(() => {
    void flushPendingSales().then((n) => {
      if (n > 0) {
        window.dispatchEvent(new CustomEvent('pending-sales-sync-toast', { detail: { count: n } }));
      }
    });
  }, 800);
}

/**
 * Reintenta todas las ventas pendientes (FIFO por enqueuedAt).
 * @returns cuántas se sincronizaron correctamente en esta pasada
 */
export async function flushPendingSales(): Promise<number> {
  if (typeof window === 'undefined' || !navigator.onLine) return 0;
  if (flushInFlight) return 0;
  flushInFlight = true;
  let synced = 0;
  try {
    const q = readQueue().sort((a, b) => a.enqueuedAt - b.enqueuedAt);
    if (q.length === 0) return 0;

    const remaining: PendingSaleRecord[] = [];

    for (const row of q) {
      const payload: CreateSaleInput = {
        ...row.payload,
        clientEventId: row.clientEventId,
      };
      const result = await createSale(payload, { shopId: row.shopId });
      if (result.success) {
        synced += 1;
        continue;
      }
      const nextAttempt = row.attemptCount + 1;
      if (result.retriable === false || nextAttempt > 80) {
        console.error('[SALE] Cola: venta descartada (no reintentable o demasiados intentos)', {
          clientEventId: row.clientEventId,
          error: result.error,
        });
        continue;
      }
      remaining.push({
        ...row,
        attemptCount: nextAttempt,
      });
    }

    writeQueue(remaining);

    if (synced > 0) {
      console.log('[SALE] Cola: sincronizadas', synced, 'venta(s) pendiente(s)');
      void runBackgroundSync();
    }

    return synced;
  } finally {
    flushInFlight = false;
  }
}

export function installPendingSalesSyncListeners(): void {
  if (typeof window === 'undefined' || listenersInstalled) return;
  listenersInstalled = true;

  const onOnline = () => {
    void flushPendingSales().then((n) => {
      if (n > 0) {
        window.dispatchEvent(new CustomEvent('pending-sales-sync-toast', { detail: { count: n } }));
      }
    });
  };

  window.addEventListener('online', onOnline);

  const onVisible = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      void flushPendingSales().then((n) => {
        if (n > 0) {
          window.dispatchEvent(new CustomEvent('pending-sales-sync-toast', { detail: { count: n } }));
        }
      });
    }
  };
  document.addEventListener('visibilitychange', onVisible);

  window.setInterval(() => {
    if (navigator.onLine && getPendingSalesCount() > 0) {
      void flushPendingSales().then((n) => {
        if (n > 0) {
          window.dispatchEvent(new CustomEvent('pending-sales-sync-toast', { detail: { count: n } }));
        }
      });
    }
  }, FLUSH_INTERVAL_MS);

  void flushPendingSales().then((n) => {
    if (n > 0) {
      window.dispatchEvent(new CustomEvent('pending-sales-sync-toast', { detail: { count: n } }));
    }
  });
}
