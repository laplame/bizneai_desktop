/**
 * Reserva de inventario al mandar pedido a lista de espera y liberación al eliminar / completar venta.
 */

import { scheduleMirrorKeyToSqlite } from './posPersistService';

const RESERVATIONS_KEY = 'bizneai-waitlist-inventory-reservations';

export interface WaitlistReservationLine {
  productId: string;
  quantity: number;
}

interface ReservationRecord {
  lines: WaitlistReservationLine[];
}

type ProductLike = { id: string | number; stock?: number; isWeightBased?: boolean };

function loadReservations(): Record<string, ReservationRecord> {
  try {
    const raw = localStorage.getItem(RESERVATIONS_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, ReservationRecord>;
    return p && typeof p === 'object' ? p : {};
  } catch {
    return {};
  }
}

function saveReservations(map: Record<string, ReservationRecord>): void {
  try {
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(map));
    scheduleMirrorKeyToSqlite(RESERVATIONS_KEY);
  } catch {
    /* ignore */
  }
}

function persistProducts(products: ProductLike[]): void {
  try {
    localStorage.setItem('bizneai-products', JSON.stringify(products));
    scheduleMirrorKeyToSqlite('bizneai-products');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('products-updated'));
    }
  } catch {
    /* ignore */
  }
}

/**
 * Descuenta stock y guarda reserva por entrada de lista de espera.
 */
export function reserveStockForWaitlist<T extends ProductLike>(
  products: T[],
  waitlistEntryId: string,
  lines: WaitlistReservationLine[]
): { ok: true; nextProducts: T[] } | { ok: false; error: string } {
  if (!lines.length) {
    return { ok: true, nextProducts: [...products] };
  }

  const next = products.map((p) => ({ ...p }));
  const errors: string[] = [];

  for (const line of lines) {
    const idx = next.findIndex((p) => String(p.id) === String(line.productId));
    if (idx === -1) {
      errors.push(`Producto ${line.productId} no encontrado`);
      continue;
    }
    const p = next[idx]!;
    const stock = Number(p.stock ?? 0);
    const isWeight = Boolean(p.isWeightBased);
    const qty = Number(line.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      errors.push(`Cantidad inválida para ${line.productId}`);
      continue;
    }
    if (!isWeight && qty > stock) {
      errors.push(`Stock insuficiente: ${String(p.id)} (${stock})`);
      continue;
    }
    if (isWeight && qty > stock) {
      errors.push(`Stock insuficiente (peso): ${String(p.id)}`);
      continue;
    }
    next[idx] = { ...p, stock: stock - qty };
  }

  if (errors.length) {
    return { ok: false, error: errors.join('; ') };
  }

  const map = loadReservations();
  map[waitlistEntryId] = { lines };
  saveReservations(map);
  persistProducts(next);
  return { ok: true, nextProducts: next };
}

/**
 * Devuelve stock al eliminar entrada de lista de espera (sin venta).
 */
export function releaseWaitlistReservation<T extends ProductLike>(
  products: T[],
  waitlistEntryId: string
): { nextProducts: T[]; hadReservation: boolean } {
  const map = loadReservations();
  const rec = map[waitlistEntryId];
  if (!rec?.lines?.length) {
    return { nextProducts: [...products], hadReservation: false };
  }

  const next = products.map((p) => ({ ...p }));
  for (const line of rec.lines) {
    const idx = next.findIndex((p) => String(p.id) === String(line.productId));
    if (idx === -1) continue;
    const p = next[idx]!;
    const stock = Number(p.stock ?? 0);
    const qty = Number(line.quantity);
    next[idx] = { ...p, stock: stock + (Number.isFinite(qty) ? qty : 0) };
  }

  delete map[waitlistEntryId];
  saveReservations(map);
  persistProducts(next);
  return { nextProducts: next, hadReservation: true };
}

/**
 * Tras cobrar venta originada en lista de espera: el stock ya estaba reservado; solo quita el registro de reserva.
 */
export function consumeWaitlistReservation(waitlistEntryId: string): void {
  const map = loadReservations();
  if (map[waitlistEntryId]) {
    delete map[waitlistEntryId];
    saveReservations(map);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('products-updated'));
  }
}

/** Tras POST /waitlist/shop/:id, el servidor devuelve `_id` Mongo; reasigna la reserva de inventario. */
export function rekeyWaitlistReservation(oldId: string, newId: string): void {
  if (!oldId || !newId || oldId === newId) return;
  const map = loadReservations();
  const rec = map[oldId];
  if (!rec) return;
  map[newId] = rec;
  delete map[oldId];
  saveReservations(map);
}
