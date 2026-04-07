/**
 * URL base del API local (Express :3000).
 * - Vite dev: localhost
 * - Electron con file:// o app empaquetada: 127.0.0.1
 */
export const LOCAL_API_PORT = 3000;

export function getLocalApiOrigin(): string {
  if (typeof window === 'undefined') {
    return `http://127.0.0.1:${LOCAL_API_PORT}`;
  }
  const o = window.location?.origin || '';
  if (o.includes('localhost') || o.includes('127.0.0.1')) {
    return `http://127.0.0.1:${LOCAL_API_PORT}`;
  }
  if (o === 'file://' || o.startsWith('file://') || !o) {
    return `http://127.0.0.1:${LOCAL_API_PORT}`;
  }
  return `http://127.0.0.1:${LOCAL_API_PORT}`;
}

/** True si el API local (proxy :3000) debe usarse: Vite localhost o Electron file:// */
export function shouldUseSalesMcpProxy(): boolean {
  if (typeof window === 'undefined') return true;
  const o = window.location?.origin || '';
  if (o.includes('localhost') || o.includes('127.0.0.1')) return true;
  if (o.startsWith('file://')) return true;
  return false;
}
