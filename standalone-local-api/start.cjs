'use strict';
/**
 * Arranca el bundle bizneai-server.cjs desde esta carpeta (mismo Node que instaló better-sqlite3).
 * Variables útiles:
 *   PORT          — puerto (default 3000)
 *   BIZNEAI_USER_DATA — carpeta de datos (SQLite, uploads); por defecto ./data junto a este script
 *   BIZNEAI_EMBEDDED  — se fuerza a 1 si no viene definida
 */
const path = require('path');

if (!process.env.BIZNEAI_EMBEDDED) {
  process.env.BIZNEAI_EMBEDDED = '1';
}

const root = __dirname;
if (!process.env.BIZNEAI_USER_DATA || !String(process.env.BIZNEAI_USER_DATA).trim()) {
  process.env.BIZNEAI_USER_DATA = path.join(root, 'data');
}

const fs = require('fs');
fs.mkdirSync(process.env.BIZNEAI_USER_DATA, { recursive: true });

const bundlePath = path.join(root, 'bizneai-server.cjs');
if (!fs.existsSync(bundlePath)) {
  console.error(
    '[bizneai-local-api] Falta bizneai-server.cjs en',
    root,
    '\nEjecuta en el repo: npm run build:server && npm run pack:local-api'
  );
  process.exit(1);
}

// eslint-disable-next-line import/no-dynamic-require
const mod = require(bundlePath);

const port = Number(process.env.PORT) || 3000;
mod.startBizneaiServer(port).catch((err) => {
  console.error('[bizneai-local-api]', err);
  process.exit(1);
});
