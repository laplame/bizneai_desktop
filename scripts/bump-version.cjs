#!/usr/bin/env node

/**
 * Sistema de control de versiones para BizneAI POS
 * Incrementa la versión (1.01, 1.02, ...) y añade timestamp Unix en cada build
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const BUILD_INFO_PATH = path.join(ROOT, 'src', 'build-info.json');

/**
 * Parsea versión semver (1.0.0, 1.0.1, etc.) - requerido por electron-builder
 */
function parseVersion(ver) {
  const match = String(ver).match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return { major: 1, minor: 0, patch: 0 };
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Incrementa patch (1.0.0 -> 1.0.1, 1.0.1 -> 1.0.2)
 */
function incrementVersion(ver) {
  const { major, minor, patch } = parseVersion(ver);
  return `${major}.${minor}.${patch + 1}`;
}

function main() {
  const timestamp = Math.floor(Date.now() / 1000);

  // Leer package.json
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  } catch (e) {
    console.error('❌ Error leyendo package.json:', e.message);
    process.exit(1);
  }

  const currentVersion = pkg.version || '1.0.0';
  const newVersion = incrementVersion(currentVersion);

  // Actualizar package.json
  pkg.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  // Crear/actualizar build-info.json
  const buildInfo = {
    version: newVersion,
    buildTimestamp: timestamp,
    buildDate: new Date().toISOString(),
  };
  fs.writeFileSync(BUILD_INFO_PATH, JSON.stringify(buildInfo, null, 2) + '\n', 'utf8');

  console.log('📦 Versión actualizada:');
  console.log(`   Versión: ${currentVersion} → ${newVersion}`);
  console.log(`   Timestamp Unix: ${timestamp}`);
  console.log(`   Fecha: ${buildInfo.buildDate}`);
}

main();
