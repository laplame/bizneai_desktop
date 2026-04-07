import type { RoleSyncItem, RoleUser } from '../api/roles';
import type { ScreenLockIdentity } from '../types/screenLock';
import { recordSessionLock, recordSessionUnlock } from './localActivityLog';
import { scheduleMirrorKeyToSqlite } from './posPersistService';
import { lockAllConfigurationSessions } from './configPasswords';

export type { ScreenLockIdentity } from '../types/screenLock';

const ROLES_KEY = 'bizneai-roles';
const ENABLED_KEY = 'bizneai-screen-lock-enabled';
const LEGACY_PASSCODE_KEY = 'bizneai-passcode';

/** PIN de recuperación / superusuario (fijo en app). No asignar el mismo a usuarios en Roles. */
export const SUPER_USER_SCREEN_LOCK_PIN = '8044';
const SESSION_UNLOCKED = 'bizneai-session-unlocked';
const SESSION_IDENTITY = 'bizneai-screen-lock-identity';

export function loadRolesSyncItems(): RoleSyncItem[] {
  try {
    const raw = localStorage.getItem(ROLES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RoleSyncItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRolesSyncItems(items: RoleSyncItem[]): void {
  localStorage.setItem(ROLES_KEY, JSON.stringify(items));
  scheduleMirrorKeyToSqlite(ROLES_KEY);
  window.dispatchEvent(new CustomEvent('bizneai-roles-updated'));
}

export function isScreenLockEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) === 'true';
}

export function setScreenLockEnabled(enabled: boolean): void {
  localStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false');
  scheduleMirrorKeyToSqlite(ENABLED_KEY);
  window.dispatchEvent(new CustomEvent('bizneai-screen-lock-settings-changed'));
}

/** Normaliza PIN a 4 dígitos numéricos o cadena vacía. */
export function normalizePin(pin: string | undefined): string {
  if (!pin) return '';
  const d = pin.replace(/\D/g, '').slice(0, 4);
  return d;
}

function getLegacyPasscode(): string {
  try {
    return localStorage.getItem(LEGACY_PASSCODE_KEY) || '';
  } catch {
    return '';
  }
}

/** Hay al menos un PIN válido (roles, código legacy o PIN de superusuario). */
export function hasScreenLockPinsConfigured(): boolean {
  const legacy = normalizePin(getLegacyPasscode());
  if (legacy.length === 4) return true;
  for (const item of loadRolesSyncItems()) {
    for (const u of item.users || []) {
      if (normalizePin(u.screenLockPin).length === 4) return true;
    }
  }
  return normalizePin(SUPER_USER_SCREEN_LOCK_PIN).length === 4;
}

function matchPinToIdentity(pin: string): ScreenLockIdentity | null {
  const normalized = normalizePin(pin);
  if (normalized.length !== 4) return null;
  if (normalized === normalizePin(SUPER_USER_SCREEN_LOCK_PIN)) {
    return { source: 'super', role: 'Superusuario' };
  }
  const legacy = normalizePin(getLegacyPasscode());
  if (legacy.length === 4 && normalized === legacy) {
    return { source: 'legacy' };
  }
  for (const item of loadRolesSyncItems()) {
    for (const u of item.users || []) {
      const p = normalizePin(u.screenLockPin);
      if (p.length === 4 && normalized === p) {
        return {
          source: 'role',
          role: item.role,
          name: u.name,
          email: u.email,
        };
      }
    }
  }
  return null;
}

export function validateScreenLockPin(input: string): boolean {
  return matchPinToIdentity(input) !== null;
}

/** Valida el PIN, guarda sesión desbloqueada y la identidad asociada al código (rol / usuario). */
export function unlockFromPin(pin: string): boolean {
  const identity = matchPinToIdentity(pin);
  if (!identity) return false;
  unlockSessionWithIdentity(identity);
  recordSessionUnlock(identity);
  return true;
}

function unlockSessionWithIdentity(identity: ScreenLockIdentity): void {
  try {
    sessionStorage.setItem(SESSION_UNLOCKED, '1');
    sessionStorage.setItem(SESSION_IDENTITY, JSON.stringify(identity));
  } catch {
    /* ignore */
  }
}

export function getScreenLockIdentity(): ScreenLockIdentity | null {
  try {
    const raw = sessionStorage.getItem(SESSION_IDENTITY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ScreenLockIdentity;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function isSessionUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_UNLOCKED) === '1';
  } catch {
    return false;
  }
}

export function unlockSession(): void {
  try {
    sessionStorage.setItem(SESSION_UNLOCKED, '1');
  } catch {
    /* ignore */
  }
}

export function lockSession(): void {
  const identity = getScreenLockIdentity();
  try {
    sessionStorage.removeItem(SESSION_UNLOCKED);
    sessionStorage.removeItem(SESSION_IDENTITY);
  } catch {
    /* ignore */
  }
  lockAllConfigurationSessions();
  recordSessionLock(identity);
}

export function shouldShowScreenLockOnStartup(): boolean {
  if (!isScreenLockEnabled()) return false;
  if (isSessionUnlocked()) return false;
  if (!hasScreenLockPinsConfigured()) return false;
  return true;
}

export interface RoleUserFlatRow {
  id: string;
  role: string;
  name: string;
  email: string;
  pin: string;
}

export function flattenRolesForEditor(items: RoleSyncItem[]): RoleUserFlatRow[] {
  const rows: RoleUserFlatRow[] = [];
  let i = 0;
  for (const item of items) {
    const users = item.users?.length ? item.users : [{ name: '', email: '' } as RoleUser];
    for (const u of users) {
      rows.push({
        id: `row-${i++}`,
        role: item.role || '',
        name: u.name || '',
        email: u.email || '',
        pin: u.screenLockPin ? normalizePin(u.screenLockPin) : '',
      });
    }
  }
  if (rows.length === 0) {
    rows.push({
      id: 'row-0',
      role: 'Cajero',
      name: '',
      email: '',
      pin: '',
    });
  }
  return rows;
}

export function groupFlatRowsToSyncItems(rows: RoleUserFlatRow[]): RoleSyncItem[] {
  const byRole = new Map<string, RoleUser[]>();
  for (const row of rows) {
    const roleName = (row.role || '').trim();
    if (!roleName) continue;
    const pin = normalizePin(row.pin);
    const user: RoleUser = {
      name: row.name.trim() || undefined,
      email: row.email.trim() || undefined,
      ...(pin.length === 4 ? { screenLockPin: pin } : {}),
    };
    if (!byRole.has(roleName)) byRole.set(roleName, []);
    byRole.get(roleName)!.push(user);
  }
  return Array.from(byRole.entries()).map(([role, users]) => ({ role, users }));
}
