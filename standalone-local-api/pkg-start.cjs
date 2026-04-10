'use strict';
/**
 * Entrada para empaquetar el API local como un solo .exe (@yao-pkg/pkg).
 * Datos por defecto: carpeta `data` junto al .exe (o BIZNEAI_USER_DATA).
 */
const path = require('path');
const fs = require('fs');

if (!process.env.BIZNEAI_EMBEDDED) {
  process.env.BIZNEAI_EMBEDDED = '1';
}

const root = process.pkg ? path.dirname(process.execPath) : __dirname;

if (!process.env.BIZNEAI_USER_DATA || !String(process.env.BIZNEAI_USER_DATA).trim()) {
  process.env.BIZNEAI_USER_DATA = path.join(root, 'data');
}

fs.mkdirSync(process.env.BIZNEAI_USER_DATA, { recursive: true });

// eslint-disable-next-line import/no-dynamic-require
const mod = require('./bizneai-server.cjs');

const port = Number(process.env.PORT) || 3000;
mod.startBizneaiServer(port).catch((err) => {
  console.error('[bizneai-local-api]', err);
  process.exit(1);
});
