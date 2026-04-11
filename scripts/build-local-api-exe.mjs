#!/usr/bin/env node
/**
 * Empaqueta standalone-local-api en un .exe con @yao-pkg/pkg.
 * Requiere haber ejecutado antes `npm run pack:local-api` (bundle + npm install en standalone).
 * Debe ejecutarse en Windows: better-sqlite3 debe ser el binario win32.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const standalone = path.join(root, 'standalone-local-api');
const releaseDir = path.join(root, 'release');
const pkgStart = path.join(standalone, 'pkg-start.cjs');

if (process.platform !== 'win32') {
  console.error(
    '[build:local-api-exe] Solo Windows: hace falta better-sqlite3 nativo para win32. ' +
      'Usa GitHub Actions (Build Windows) o una máquina/VM Windows.'
  );
  process.exit(1);
}

/** Debe coincidir con `PKG_TARGET` / `standalone-local-api/package.json` pkg.targets (node20 → ABI 115). */
const PKG_NODE_MODULE_VERSION = '115';

if (process.versions.modules !== PKG_NODE_MODULE_VERSION) {
  console.error(
    '[build:local-api-exe] El .exe usa Node 20 embebido (NODE_MODULE_VERSION=' +
      PKG_NODE_MODULE_VERSION +
      ').\n' +
      `Tu Node actual es ${process.version} (NODE_MODULE_VERSION=${process.versions.modules}). ` +
      'better-sqlite3 se instaló para otra versión → fallará al abrir SQLite.\n\n' +
      'Solución:\n' +
      '  1) Instala Node 20 LTS desde https://nodejs.org (o nvm-windows: nvm install 20 && nvm use 20).\n' +
      '  2) Borra módulos nativos viejos y la caché de pkg, luego reempaqueta:\n' +
      '     rmdir /s /q standalone-local-api\\node_modules\n' +
      '     rmdir /s /q %USERPROFILE%\\.cache\\pkg\n' +
      '     npm run pack:local-api\n' +
      '     npm run build:local-api-exe\n'
  );
  process.exit(1);
}

if (!fs.existsSync(pkgStart)) {
  console.error('[build:local-api-exe] Falta standalone-local-api/pkg-start.cjs');
  process.exit(1);
}

if (!fs.existsSync(path.join(standalone, 'node_modules', 'better-sqlite3'))) {
  console.error('[build:local-api-exe] Ejecuta antes: npm run pack:local-api');
  process.exit(1);
}

const target = process.env.PKG_TARGET || 'node20-win-x64';
const outBase = path.join(releaseDir, 'BizneAI-Local-API-Backend');

fs.mkdirSync(releaseDir, { recursive: true });

/** Binario de @yao-pkg/pkg (evita que `npx pkg` resuelva otro paquete). */
const pkgBin =
  process.platform === 'win32'
    ? path.join(root, 'node_modules', '.bin', 'pkg.cmd')
    : path.join(root, 'node_modules', '.bin', 'pkg');

const args = ['pkg-start.cjs', '--targets', target, '-o', outBase];

const r = spawnSync(pkgBin, args, {
  cwd: standalone,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env },
});

if (r.status !== 0) {
  process.exit(r.status ?? 1);
}

console.log('\n[build:local-api-exe] Listo:', `${outBase}.exe`);
