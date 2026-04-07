import fs from 'fs';
import path from 'path';

/**
 * Directorio de datos persistentes del POS (SQLite, uploads locales).
 * - Electron establece BIZNEAI_USER_DATA antes de arrancar el backend embebido.
 * - Sin env: `server/data` relativo al cwd del proceso (raíz del repo en dev).
 */
export function getBizneaiDataDir(): string {
  const env = process.env.BIZNEAI_USER_DATA?.trim();
  if (env) {
    return env;
  }
  return path.join(process.cwd(), 'server', 'data');
}

export function ensureBizneaiDataDir(): string {
  const dir = getBizneaiDataDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
