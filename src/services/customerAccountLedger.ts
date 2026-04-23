/**
 * Libro de cuenta corriente por cliente (ajustes: cobranza, anticipo, cobro sobre nota).
 */

import type {
  CustomerAccountAdjustmentKind,
  CustomerAccountLedgerEntry,
} from '../types/saleWaitlistCredit';
import { scheduleMirrorKeyToSqlite } from './posPersistService';

const STORAGE_KEY = 'bizneai-customer-account-ledger';

function loadAll(): CustomerAccountLedgerEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as CustomerAccountLedgerEntry[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function saveAll(entries: CustomerAccountLedgerEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    scheduleMirrorKeyToSqlite(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Saldo adeudado por el cliente (positivo = debe a la tienda). */
export function getCustomerAccountBalance(customerId: number): number {
  return loadAll()
    .filter((e) => e.customerId === customerId)
    .reduce((sum, e) => {
      switch (e.kind) {
        case 'cobranza':
          return sum + e.amount;
        case 'anticipo':
        case 'cobro_sobre_nota':
          return sum - e.amount;
        default:
          return sum;
      }
    }, 0);
}

export function listLedgerForCustomer(customerId: number): CustomerAccountLedgerEntry[] {
  return loadAll()
    .filter((e) => e.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function appendLedgerEntry(params: {
  customerId: number;
  kind: CustomerAccountAdjustmentKind;
  amount: number;
  note?: string;
  notaId?: string;
}): { ok: true; entry: CustomerAccountLedgerEntry } | { ok: false; error: string } {
  const amount = Number(params.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'El monto debe ser mayor a cero' };
  }
  if (params.kind === 'cobro_sobre_nota') {
    const nid = (params.notaId || '').trim();
    if (!nid) {
      return { ok: false, error: 'Indica el ID de nota para cobro sobre nota' };
    }
  }

  const entry: CustomerAccountLedgerEntry = {
    id: `lad_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    customerId: params.customerId,
    kind: params.kind,
    amount,
    note: params.note?.trim() || undefined,
    notaId: params.notaId?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  const all = loadAll();
  all.push(entry);
  saveAll(all);
  window.dispatchEvent(new CustomEvent('customer-ledger-updated', { detail: { customerId: params.customerId } }));
  return { ok: true, entry };
}
