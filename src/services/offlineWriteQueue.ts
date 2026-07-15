/**
 * Cola genérica de escrituras que no pudieron enviarse al servidor real
 * (sin conexión, 5xx, timeout) — guarda local (localStorage, mirroreado a
 * SQLite) y reintenta al reconectar o periódicamente.
 *
 * Generaliza el patrón que ya usaba `pendingSalesSync.ts` (cola dedicada solo
 * a ventas) para que cualquier feature nueva (Purchase Orders, Consignación,
 * Caja, etc.) pueda encolarse sin reinventar la lógica de reintento.
 *
 * Uso:
 *   1. Al arrancar la app, cada feature registra cómo reintentar lo suyo:
 *        registerOfflineExecutor('purchase-order-create', async (payload) => {
 *          const { shopId, body } = payload as {...};
 *          const res = await createPurchaseOrder(shopId, body);
 *          return { success: res.success, retriable: !res.success, error: res.error };
 *        });
 *   2. En el punto de llamada, si la escritura falla y es reintentable:
 *        enqueueOfflineWrite('purchase-order-create', { shopId, body }, dedupId);
 *   3. `installOfflineWriteQueueListeners()` una vez (App.tsx) reintenta solo
 *      al volver la conexión / visibilidad / cada 45s.
 */
import { scheduleMirrorKeyToSqlite } from './posPersistService';

export const OFFLINE_QUEUE_STORAGE_KEY = 'bizneai-offline-write-queue';

const MAX_QUEUED = 300;
const MAX_ATTEMPTS = 80;
const FLUSH_INTERVAL_MS = 45_000;

export interface OfflineWriteRecord {
  /** Deduplicación: un mismo dedupId reemplaza el registro anterior en vez de duplicarlo. */
  id: string;
  kind: string;
  payload: unknown;
  enqueuedAt: number;
  attemptCount: number;
}

export interface OfflineExecutorResult {
  success: boolean;
  /** Si false y no es reintentable, el registro se descarta (no seguirá fallando igual). */
  retriable?: boolean;
  error?: string;
}

type Executor = (payload: unknown) => Promise<OfflineExecutorResult>;

const executors = new Map<string, Executor>();
let flushInFlight = false;
let listenersInstalled = false;

/** Registra cómo reintentar un tipo de escritura. Llamar una vez al iniciar la app. */
export function registerOfflineExecutor(kind: string, executor: Executor): void {
  executors.set(kind, executor);
}

function readQueue(): OfflineWriteRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isValidRecord) : [];
  } catch {
    return [];
  }
}

function isValidRecord(x: unknown): x is OfflineWriteRecord {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.kind === 'string' &&
    typeof r.enqueuedAt === 'number' &&
    typeof r.attemptCount === 'number'
  );
}

function writeQueue(q: OfflineWriteRecord[]): void {
  if (typeof window === 'undefined') return;
  const trimmed = q.length > MAX_QUEUED ? q.slice(-MAX_QUEUED) : q;
  localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(trimmed));
  scheduleMirrorKeyToSqlite(OFFLINE_QUEUE_STORAGE_KEY);
  try {
    window.dispatchEvent(new CustomEvent('offline-write-queue-changed', { detail: { count: trimmed.length } }));
  } catch {
    /* ignore */
  }
}

export function getOfflineWriteQueueCount(kind?: string): number {
  const q = readQueue();
  return kind ? q.filter((r) => r.kind === kind).length : q.length;
}

/**
 * Encola una escritura para reintentar después. `dedupId` (opcional) evita
 * duplicados si el usuario reintenta la misma acción manualmente mientras
 * sigue sin conexión (p. ej. el mismo movimiento de caja).
 */
export function enqueueOfflineWrite(kind: string, payload: unknown, dedupId?: string): void {
  const id = dedupId || `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const q = readQueue().filter((r) => r.id !== id);
  q.push({ id, kind, payload, enqueuedAt: Date.now(), attemptCount: 0 });
  writeQueue(q);
  console.warn(`[OfflineQueue] Encolado "${kind}" pendiente de sincronización:`, id);
  scheduleFlushSoon();
}

function scheduleFlushSoon(): void {
  if (typeof window === 'undefined') return;
  window.setTimeout(() => void flushOfflineWriteQueue(), 800);
}

/** Reintenta todo lo encolado (FIFO). Devuelve cuántos se sincronizaron. */
export async function flushOfflineWriteQueue(): Promise<number> {
  if (typeof window === 'undefined' || !navigator.onLine) return 0;
  if (flushInFlight) return 0;
  flushInFlight = true;
  let synced = 0;
  try {
    const q = readQueue().sort((a, b) => a.enqueuedAt - b.enqueuedAt);
    if (q.length === 0) return 0;

    const remaining: OfflineWriteRecord[] = [];
    for (const row of q) {
      const executor = executors.get(row.kind);
      if (!executor) {
        // Nadie registró cómo reintentar esto todavía (p. ej. arrancó la app
        // pero esta feature aún no montó) — se conserva para el próximo flush.
        remaining.push(row);
        continue;
      }
      try {
        const result = await executor(row.payload);
        if (result.success) {
          synced += 1;
          continue;
        }
        const nextAttempt = row.attemptCount + 1;
        if (result.retriable === false || nextAttempt > MAX_ATTEMPTS) {
          console.error(`[OfflineQueue] Descartado "${row.kind}" (no reintentable o demasiados intentos):`, {
            id: row.id,
            error: result.error,
          });
          continue;
        }
        remaining.push({ ...row, attemptCount: nextAttempt });
      } catch (err) {
        const nextAttempt = row.attemptCount + 1;
        if (nextAttempt > MAX_ATTEMPTS) {
          console.error(`[OfflineQueue] Descartado "${row.kind}" (demasiados intentos):`, row.id, err);
          continue;
        }
        remaining.push({ ...row, attemptCount: nextAttempt });
      }
    }

    writeQueue(remaining);
    if (synced > 0) {
      console.log(`[OfflineQueue] Sincronizados ${synced} registro(s) pendiente(s)`);
    }
    return synced;
  } finally {
    flushInFlight = false;
  }
}

/** Instala los listeners de reintento (una sola vez, típicamente en App.tsx). */
export function installOfflineWriteQueueListeners(): void {
  if (typeof window === 'undefined' || listenersInstalled) return;
  listenersInstalled = true;

  const flushAndNotify = () => {
    void flushOfflineWriteQueue().then((n) => {
      if (n > 0) {
        window.dispatchEvent(new CustomEvent('offline-write-queue-synced', { detail: { count: n } }));
      }
    });
  };

  window.addEventListener('online', flushAndNotify);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) flushAndNotify();
  });
  window.setInterval(() => {
    if (navigator.onLine && getOfflineWriteQueueCount() > 0) flushAndNotify();
  }, FLUSH_INTERVAL_MS);

  flushAndNotify();
}
