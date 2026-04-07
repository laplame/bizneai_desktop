'use strict';
/**
 * Arranca el bundle Express+SQLite con el Node del sistema (mismo ABI que better-sqlite3 tras npm install).
 * No usar require() desde el proceso de Electron: el .node nativo suele ser para otro NODE_MODULE_VERSION.
 */
const path = require('path');

process.env.BIZNEAI_EMBEDDED = '1';

const bundlePath = path.join(__dirname, '..', 'dist-backend', 'bizneai-server.cjs');

// eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-require-imports
const mod = require(bundlePath);

mod.startBizneaiServer(3000).catch((err) => {
  console.error('[embedded-server-launcher]', err);
  process.exit(1);
});
