import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Building BizneAI POS for Windows (Simplified)...\n');

// Build the web application first
console.log('📦 Building web application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Web application built successfully');
} catch (error) {
  console.log('❌ Failed to build web application');
  process.exit(1);
}

// Build Windows executable without native modules rebuild
console.log('\n🖥️  Building Windows executable...');
try {
  const command = 'npx electron-builder --win --config.nodeGypRebuild=false --config.buildDependenciesFromSource=false';
  execSync(command, { stdio: 'inherit' });
  console.log('✅ Windows executable created successfully');
} catch (error) {
  console.log('❌ Failed to build Windows executable');
  console.error(error.message);
  process.exit(1);
}

console.log('\n🎉 Build completed successfully!');
console.log('📁 Check the release/ directory for your executable files.');
