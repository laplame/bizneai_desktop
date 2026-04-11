/** Marcadores de tiempo para sincronización de catálogo y backup completo MCP. */

export const LAST_SYNC_KEY = 'bizneai-last-sync';
export const LAST_FULL_BACKUP_KEY = 'bizneai-last-full-backup-at';
export const FULL_BACKUP_INTERVAL_HOURS_KEY = 'bizneai-full-backup-interval-hours';

export const DEFAULT_FULL_BACKUP_INTERVAL_HOURS = 18;

export function getLastSyncTime(): Date | null {
  try {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    if (!stored) return null;
    const ts = parseInt(stored, 10);
    return Number.isNaN(ts) ? null : new Date(ts);
  } catch {
    return null;
  }
}

export function setLastSyncTime(date: Date = new Date()): void {
  localStorage.setItem(LAST_SYNC_KEY, String(date.getTime()));
}

export function getLastFullBackupTime(): Date | null {
  try {
    const stored = localStorage.getItem(LAST_FULL_BACKUP_KEY);
    if (!stored) return null;
    const ts = parseInt(stored, 10);
    return Number.isNaN(ts) ? null : new Date(ts);
  } catch {
    return null;
  }
}

export function setLastFullBackupTime(date: Date = new Date()): void {
  localStorage.setItem(LAST_FULL_BACKUP_KEY, String(date.getTime()));
}

/** Entre 12 y 24 h (por defecto 18). */
export function getFullBackupIntervalHours(): number {
  try {
    const raw = localStorage.getItem(FULL_BACKUP_INTERVAL_HOURS_KEY);
    const n = raw != null ? parseFloat(raw) : DEFAULT_FULL_BACKUP_INTERVAL_HOURS;
    if (!Number.isFinite(n)) return DEFAULT_FULL_BACKUP_INTERVAL_HOURS;
    return Math.min(24, Math.max(12, n));
  } catch {
    return DEFAULT_FULL_BACKUP_INTERVAL_HOURS;
  }
}

export function setFullBackupIntervalHours(hours: number): void {
  const h = Math.min(24, Math.max(12, hours));
  localStorage.setItem(FULL_BACKUP_INTERVAL_HOURS_KEY, String(h));
}

export function getFullBackupIntervalMs(): number {
  return getFullBackupIntervalHours() * 60 * 60 * 1000;
}

export function isFullBackupDue(): boolean {
  const last = getLastFullBackupTime();
  if (!last) return true;
  return Date.now() - last.getTime() >= getFullBackupIntervalMs();
}
