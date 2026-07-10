#!/usr/bin/env node

/**
 * Fix Dependencies Script
 * This script ensures all required dependencies are properly installed
 * and handles common electron-builder issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing dependencies for BizneAI...');

// List of problematic dependencies that need special handling
const problematicDeps = [
  'call-bind-apply-helpers',
  'call-bind',
  'get-intrinsic',
  'side-channel',
  'dunder-proto',
  'get-proto',
  'better-sqlite3',
  'express',
  'qs',
  'cloudinary',
  'multer',
  'cors',
  'helmet',
  'morgan',
  'socket.io',
  'ws',
  'axios',
  'stripe',
  'zod',
  'quagga',
  'lucide-react',
  'react-hot-toast'
];

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('❌ node_modules not found. Running npm install...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  } catch (error) {
    console.error('❌ npm install failed:', error.message);
    process.exit(1);
  }
}

// Check for missing dependencies
console.log('🔍 Checking for missing dependencies...');
const missingDeps = [];

for (const dep of problematicDeps) {
  const depPath = path.join(nodeModulesPath, dep);
  if (!fs.existsSync(depPath)) {
    missingDeps.push(dep);
    console.log(`⚠️  Missing: ${dep}`);
  }
}

if (missingDeps.length > 0) {
  console.log('📦 Installing missing dependencies...');
  try {
    execSync(`npm install ${missingDeps.join(' ')}`, { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..') 
    });
  } catch (error) {
    console.error('❌ Failed to install missing dependencies:', error.message);
    process.exit(1);
  }
}

// Rebuild native modules for electron (skip problematic ones)
console.log('🔨 Rebuilding native modules for electron...');
try {
  // Only rebuild better-sqlite3 which is critical
  execSync('npx electron-rebuild --only better-sqlite3', { 
    stdio: 'inherit', 
    cwd: path.join(__dirname, '..') 
  });
  console.log('✅ better-sqlite3 rebuilt successfully');
} catch (error) {
  console.error('❌ electron-rebuild failed:', error.message);
  console.log('⚠️  This might be normal if no native modules need rebuilding');
  // Try alternative approach
  try {
    console.log('🔄 Trying alternative rebuild approach...');
    execSync('npm rebuild better-sqlite3 --update-binary', { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..') 
    });
  } catch (altError) {
    console.log('⚠️  Alternative rebuild also failed, continuing anyway...');
  }
}

// Verify critical dependencies
console.log('✅ Verifying critical dependencies...');
const criticalDeps = ['express', 'better-sqlite3', 'cloudinary'];
for (const dep of criticalDeps) {
  const depPath = path.join(nodeModulesPath, dep);
  if (fs.existsSync(depPath)) {
    console.log(`✅ ${dep} - OK`);
  } else {
    console.log(`❌ ${dep} - MISSING`);
  }
}

console.log('🎉 Dependency fix completed!');
console.log('💡 You can now run: npm run dist:mac'); 