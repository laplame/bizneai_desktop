/**
 * Vigencia por sincronización (desktop Windows / Electron).
 * Sin sync durante MAX_DAYS_WITHOUT_SYNC días → la app se detiene hasta sincronizar.
 */

import { getLastSyncTime } from './syncClock';
import { isShopIdConfigured } from './shopIdHelper';

export const MAX_DAYS_WITHOUT_SYNC = 30;
export const FIRST_OPEN_DATE_KEY = 'bizneai-first-open-date';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function getOrSetFirstOpenDate(): string {
  try {
    const existing = localStorage.getItem(FIRST_OPEN_DATE_KEY);
    if (existing) {
      const d = new Date(existing);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    const now = new Date().toISOString();
    localStorage.setItem(FIRST_OPEN_DATE_KEY, now);
    return now;
  } catch {
    return new Date().toISOString();
  }
}

export function getDaysSinceFirstOpen(): number {
  const first = getOrSetFirstOpenDate();
  const t = new Date(first).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor(Math.max(0, Date.now() - t) / MS_PER_DAY);
}

/** Días desde la última sync; si nunca hubo sync, usa la fecha de primer uso. */
export function getDaysSinceSyncReference(): {
  days: number;
  reference: 'lastSync' | 'firstOpen';
  lastSyncAt: Date | null;
  firstOpenAt: string;
} {
  const firstOpenAt = getOrSetFirstOpenDate();
  const last = getLastSyncTime();
  if (last && !Number.isNaN(last.getTime())) {
    return {
      days: Math.floor(Math.max(0, Date.now() - last.getTime()) / MS_PER_DAY),
      reference: 'lastSync',
      lastSyncAt: last,
      firstOpenAt,
    };
  }
  const first = new Date(firstOpenAt);
  return {
    days: Math.floor(Math.max(0, Date.now() - first.getTime()) / MS_PER_DAY),
    reference: 'firstOpen',
    lastSyncAt: null,
    firstOpenAt,
  };
}

export type SyncValidityStatus = {
  /** Tienda configurada (hay shopId); sin ella no se bloquea el setup. */
  shopConfigured: boolean;
  lastSyncAt: string | null;
  firstOpenAt: string;
  daysSinceSync: number;
  daysRemaining: number;
  isExpired: boolean;
  reference: 'lastSync' | 'firstOpen';
  maxDays: number;
};

export function getSyncValidityStatus(): SyncValidityStatus {
  const shopConfigured = isShopIdConfigured();
  const { days, reference, lastSyncAt, firstOpenAt } = getDaysSinceSyncReference();
  const daysRemaining = Math.max(0, MAX_DAYS_WITHOUT_SYNC - days);
  const isExpired = shopConfigured && days >= MAX_DAYS_WITHOUT_SYNC;

  return {
    shopConfigured,
    lastSyncAt: lastSyncAt ? lastSyncAt.toISOString() : null,
    firstOpenAt,
    daysSinceSync: days,
    daysRemaining,
    isExpired,
    reference,
    maxDays: MAX_DAYS_WITHOUT_SYNC,
  };
}

export function isSyncValidityExpired(): boolean {
  return getSyncValidityStatus().isExpired;
}
