#!/usr/bin/env node
/**
 * Con "type": "module" en package.json, Node/tsx resuelve ESM sin añadir extensiones.
 * Los imports relativos en server/src deben terminar en .js (convención TS → fuente .ts).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const serverSrc = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'server',
  'src'
);

let bad = 0;

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name.endsWith('.ts')) checkFile(p);
  }
}

function checkFile(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/from\s+['"](\.[^'"]+)['"]\s*;?\s*$/);
    if (!m) continue;
    const spec = m[1];
    if (spec.endsWith('.js') || spec.endsWith('.json')) continue;
    console.error(`${path.relative(process.cwd(), filePath)}:${i + 1}: import relativo sin .js → ${spec}`);
    bad++;
  }
}

if (!fs.existsSync(serverSrc)) {
  console.error('No existe server/src');
  process.exit(1);
}

walk(serverSrc);

if (bad > 0) {
  console.error(
    `\n${bad} import(s) incorrectos. Añade sufijo .js (p. ej. './bootstrap.js').`
  );
  process.exit(1);
}

console.log('server/src: imports ESM relativos OK (.js)');
