#!/usr/bin/env node
/**
 * Empaqueta el API local (SQLite + Express) para distribuirlo sin el resto del POS.
 * Genera standalone-local-api/ con node_modules y bizneai-server.cjs listos para copiar a la tienda.
 *
 * Uso: npm run pack:local-api
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const bundleSrc = path.join(root, 'dist-backend', 'bizneai-server.cjs');
const standaloneDir = path.join(root, 'standalone-local-api');
const bundleDest = path.join(standaloneDir, 'bizneai-server.cjs');
const releaseDir = path.join(root, 'release', 'bizneai-local-api-portable');

if (!fs.existsSync(bundleSrc)) {
  console.error('Falta dist-backend/bizneai-server.cjs. Ejecuta: npm run build:server');
  process.exit(1);
}

fs.mkdirSync(standaloneDir, { recursive: true });
fs.copyFileSync(bundleSrc, bundleDest);
console.log('Copiado bizneai-server.cjs → standalone-local-api/');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const install = spawnSync(npmCmd, ['install', '--omit=dev'], {
  cwd: standaloneDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (install.status !== 0) {
  console.error('npm install en standalone-local-api falló');
  process.exit(install.status ?? 1);
}

/** pkg embebe Node 20 (ABI 115); better-sqlite3 nativo debe coincidir. */
if (process.platform === 'win32' && process.versions.modules !== '115') {
  console.warn(
    '\n[pack:local-api] Aviso: para generar BizneAI-Local-API-Backend.exe hace falta Node 20 LTS ' +
      `(ahora: ${process.version}, NODE_MODULE_VERSION=${process.versions.modules}). ` +
      'Con Node 22+ el .exe fallará al abrir SQLite; usa Node 20 y vuelve a `npm run pack:local-api` antes de `build:local-api-exe`.\n'
  );
}

function copyRecursive(src, dest, opts = { skipTopLevelData: false }) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      if (name === '.git') continue;
      if (opts.skipTopLevelData && path.resolve(src) === path.resolve(standaloneDir) && name === 'data') {
        continue;
      }
      copyRecursive(path.join(src, name), path.join(dest, name), { skipTopLevelData: false });
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(releaseDir)) {
  fs.rmSync(releaseDir, { recursive: true });
}
fs.mkdirSync(path.dirname(releaseDir), { recursive: true });
copyRecursive(standaloneDir, releaseDir, { skipTopLevelData: true });

const stamp = new Date().toISOString().slice(0, 10);
const versioned = path.join(root, 'release', `bizneai-local-api-portable-${stamp}`);
if (fs.existsSync(versioned)) {
  fs.rmSync(versioned, { recursive: true });
}
copyRecursive(standaloneDir, versioned, { skipTopLevelData: true });
console.log('\nListo. Carpetas de salida:');
console.log('  ', releaseDir, '(última compilación)');
console.log('  ', versioned, '(copia fechada)');
console.log('\nEn Windows, en la tienda: ejecutar iniciar-api-local.bat');
console.log('(Node en PATH o carpeta node\\ con node.exe portable).');
console.log('API: http://127.0.0.1:3000/health');
