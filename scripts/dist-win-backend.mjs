#!/usr/bin/env node
/**
 * Tras `electron-builder --win`, genera `BizneAI-Local-API-Backend.exe` (pkg + better-sqlite3 win32).
 * En macOS/Linux termina sin error: el .exe del API solo se puede construir en Windows.
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

if (process.platform !== 'win32') {
  console.log(
    '[dist:win] Sin build del API .exe (requiere Windows). En este SO solo se generó el instalador Electron en release/.'
  );
  process.exit(0);
}

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const r = spawnSync(npmCmd, ['run', 'build:local-api-exe'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});
process.exit(r.status ?? 1);
