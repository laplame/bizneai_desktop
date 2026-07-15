/**
 * Almacén local cifrado para secretos que nunca deben salir de esta máquina
 * (p. ej. la frase mnemónica de una wallet Polygon generada en el POS).
 *
 * AES-256-GCM con una llave aleatoria de 32 bytes generada una sola vez por
 * instalación y guardada en un archivo separado (permisos 600 en POSIX) bajo
 * el mismo directorio de datos que usa el resto del backend local
 * (BIZNEAI_USER_DATA / server/data — ver dataPaths.ts). Protege contra la
 * inspección casual del archivo de secretos (mismo nivel que Electron
 * safeStorage a efectos prácticos para un terminal de un solo usuario); no
 * sustituye un enclave seguro de hardware.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ensureBizneaiDataDir } from '../dataPaths.js';

const DIRNAME = 'secrets';
const KEY_FILENAME = '.local-secrets-key';

function secretsDir(): string {
  const dir = path.join(ensureBizneaiDataDir(), DIRNAME);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}

function loadOrCreateKey(): Buffer {
  const keyPath = path.join(secretsDir(), KEY_FILENAME);
  try {
    const existing = fs.readFileSync(keyPath);
    if (existing.length === 32) return existing;
  } catch {
    /* no existe aún */
  }
  const key = crypto.randomBytes(32);
  fs.writeFileSync(keyPath, key, { mode: 0o600 });
  return key;
}

/** ivHex:authTagHex:cipherHex */
export function encryptLocalSecret(plaintext: string): string {
  const key = loadOrCreateKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptLocalSecret(payload: string): string {
  const key = loadOrCreateKey();
  const [ivHex, authTagHex, cipherHex] = payload.split(':');
  if (!ivHex || !authTagHex || !cipherHex) {
    throw new Error('Formato de secreto local inválido');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(cipherHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}

function recordPath(name: string): string {
  const safe = String(name).replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(secretsDir(), `${safe}.json`);
}

/** Guarda un objeto JSON cifrado bajo un nombre lógico (p. ej. "polygon-wallet-<shopId>"). */
export function writeLocalSecretRecord(name: string, data: Record<string, unknown>): void {
  const payload = encryptLocalSecret(JSON.stringify(data));
  fs.writeFileSync(recordPath(name), JSON.stringify({ payload, updatedAt: new Date().toISOString() }), {
    mode: 0o600,
  });
}

export function readLocalSecretRecord<T = Record<string, unknown>>(name: string): T | null {
  try {
    const raw = fs.readFileSync(recordPath(name), 'utf8');
    const { payload } = JSON.parse(raw) as { payload: string };
    return JSON.parse(decryptLocalSecret(payload)) as T;
  } catch {
    return null;
  }
}

export function deleteLocalSecretRecord(name: string): void {
  try {
    fs.unlinkSync(recordPath(name));
  } catch {
    /* no existía */
  }
}
