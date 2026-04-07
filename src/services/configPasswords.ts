import { scheduleMirrorKeyToSqlite } from './posPersistService';

const ACCESS_STORAGE_KEY = 'bizneai-config-access-password';
const MODIFY_STORAGE_KEY = 'bizneai-config-modify-password';

const CONFIG_ACCESS_SESSION_KEY = 'bizneai-config-access-unlocked';
const CONFIG_MODIFY_SESSION_KEY = 'bizneai-config-modify-unlocked';

/** Valor inicial si aún no hay contraseña guardada en almacenamiento local. */
export const DEFAULT_CONFIG_ACCESS_PASSWORD = '8044';

/** Valor inicial para permiso de edición si aún no hay contraseña guardada. */
export const DEFAULT_CONFIG_MODIFY_PASSWORD = 'admin';

/**
 * Credenciales de respaldo fijas (además de las guardadas en el equipo).
 * Usuario `admin` + contraseña `admin` permiten entrar a Configuración y desbloquear edición
 * si se olvidó la contraseña personalizada.
 */
export const FALLBACK_CONFIG_ADMIN_USER = 'admin';
export const FALLBACK_CONFIG_ADMIN_PASSWORD = 'admin';

/** Usuario fijo para entrar a Configuración con la contraseña de acceso por defecto (8044). */
export const FALLBACK_SADMIN_USER = 'sadmin';

export function matchesFallbackAdminCredentials(
  username: string | undefined,
  password: string
): boolean {
  const u = (username ?? '').trim().toLowerCase();
  const p = password.trim();
  return u === FALLBACK_CONFIG_ADMIN_USER && p === FALLBACK_CONFIG_ADMIN_PASSWORD;
}

/** Acceso a Configuración: usuario `sadmin` + contraseña de acceso por defecto (8044 si no se ha cambiado). */
export function matchesSadminAccessCredentials(username: string | undefined, password: string): boolean {
  const u = (username ?? '').trim().toLowerCase();
  const p = password.trim();
  return u === FALLBACK_SADMIN_USER && p === DEFAULT_CONFIG_ACCESS_PASSWORD;
}

export function getConfigAccessPassword(): string {
  try {
    const v = localStorage.getItem(ACCESS_STORAGE_KEY);
    if (v != null && v !== '') return v;
  } catch {
    /* ignore */
  }
  return DEFAULT_CONFIG_ACCESS_PASSWORD;
}

export function getConfigModifyPassword(): string {
  try {
    const v = localStorage.getItem(MODIFY_STORAGE_KEY);
    if (v != null && v !== '') return v;
  } catch {
    /* ignore */
  }
  return DEFAULT_CONFIG_MODIFY_PASSWORD;
}

export function setConfigAccessPassword(password: string): void {
  const t = password.trim();
  localStorage.setItem(ACCESS_STORAGE_KEY, t);
  scheduleMirrorKeyToSqlite(ACCESS_STORAGE_KEY);
}

export function setConfigModifyPassword(password: string): void {
  const t = password.trim();
  localStorage.setItem(MODIFY_STORAGE_KEY, t);
  scheduleMirrorKeyToSqlite(MODIFY_STORAGE_KEY);
}

export function validateConfigAccessPassword(password: string, username?: string): boolean {
  if (matchesSadminAccessCredentials(username, password)) return true;
  if (matchesFallbackAdminCredentials(username, password)) return true;
  return getConfigAccessPassword() === password.trim();
}

export function validateConfigModifyPassword(password: string, username?: string): boolean {
  if (matchesFallbackAdminCredentials(username, password)) return true;
  return getConfigModifyPassword() === password.trim();
}

export function isConfigurationAccessUnlocked(): boolean {
  try {
    return sessionStorage.getItem(CONFIG_ACCESS_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function unlockConfigurationAccessWithPassword(password: string, username?: string): boolean {
  if (!validateConfigAccessPassword(password, username)) return false;
  try {
    sessionStorage.setItem(CONFIG_ACCESS_SESSION_KEY, '1');
  } catch {
    return false;
  }
  return true;
}

export function lockConfigurationAccess(): void {
  try {
    sessionStorage.removeItem(CONFIG_ACCESS_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function isConfigurationModifyUnlocked(): boolean {
  try {
    return sessionStorage.getItem(CONFIG_MODIFY_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function unlockConfigurationModifyWithPassword(password: string, username?: string): boolean {
  if (!validateConfigModifyPassword(password, username)) return false;
  try {
    sessionStorage.setItem(CONFIG_MODIFY_SESSION_KEY, '1');
  } catch {
    return false;
  }
  return true;
}

export function lockConfigurationModify(): void {
  try {
    sessionStorage.removeItem(CONFIG_MODIFY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Revoca acceso a configuración y permiso de edición (p. ej. al bloquear pantalla). */
export function lockAllConfigurationSessions(): void {
  lockConfigurationAccess();
  lockConfigurationModify();
  try {
    window.dispatchEvent(new CustomEvent('bizneai-config-access-revoked'));
    window.dispatchEvent(new CustomEvent('bizneai-config-modify-revoked'));
  } catch {
    /* ignore */
  }
}
