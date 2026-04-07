#!/usr/bin/env node
/**
 * Empaqueta el servidor Express (bootstrap) para cargarlo desde Electron sin tsx.
 */
import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'dist-backend');
const outfile = path.join(outDir, 'bizneai-server.cjs');

fs.mkdirSync(outDir, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(root, 'server/src/bootstrap.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile,
  packages: 'external',
  logLevel: 'info',
});

console.log('Written', outfile);
