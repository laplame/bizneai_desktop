import type { SaleFulfillmentState } from '../types/saleWaitlistCredit';
import { scheduleMirrorKeyToSqlite } from './posPersistService';

export function updateWaitlistEntryFields(
  entryId: string,
  fields: Record<string, unknown>
): void {
  try {
    const raw = localStorage.getItem('bizneai-waitlist');
    if (!raw) return;
    const arr = JSON.parse(raw) as Array<Record<string, unknown>>;
    if (!Array.isArray(arr)) return;
    const idx = arr.findIndex((e) => e._id === entryId);
    if (idx === -1) return;
    arr[idx] = { ...arr[idx], ...fields };
    localStorage.setItem('bizneai-waitlist', JSON.stringify(arr));
    scheduleMirrorKeyToSqlite('bizneai-waitlist');
    window.dispatchEvent(new CustomEvent('waitlist-updated'));
  } catch {
    /* ignore */
  }
}

export function markWaitlistEntryCompleted(entryId: string): void {
  const done: SaleFulfillmentState = 'completed';
  updateWaitlistEntryFields(entryId, {
    status: 'completed',
    fulfillmentState: done,
  });
}

/** Tras cobro en checkout: quita la entrada de la lista (el historial queda en Merkle / actividad). */
export function removeWaitlistEntryById(entryId: string): void {
  try {
    const raw = localStorage.getItem('bizneai-waitlist');
    if (!raw) return;
    const arr = JSON.parse(raw) as Array<Record<string, unknown>>;
    if (!Array.isArray(arr)) return;
    const next = arr.filter((e) => String(e._id) !== String(entryId));
    if (next.length === arr.length) return;
    localStorage.setItem('bizneai-waitlist', JSON.stringify(next));
    scheduleMirrorKeyToSqlite('bizneai-waitlist');
    window.dispatchEvent(new CustomEvent('waitlist-updated'));
  } catch {
    /* ignore */
  }
}
