import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Building BizneAI POS for Windows (Simple)...');

// Step 1: Build the web application
console.log('📦 Building web application...');
execSync('npm run build', { stdio: 'inherit' });

// Step 2: Create a minimal Windows config that skips native dependencies
const winConfig = {
  appId: "com.bizneai.pos",
  productName: "BizneAI POS",
  copyright: "Copyright © 2024 BizneAI Team",
  directories: {
    output: "release",
    buildResources: "build"
  },
  files: [
    "dist/**/*",
    "electron/**/*",
    "package.json",
    "node_modules/**/*",
    "!node_modules/.cache/**/*",
    "!node_modules/.vite/**/*",
    "!node_modules/.bin/**/*",
    "!node_modules/*/test/**/*",
    "!node_modules/*/tests/**/*",
    "!node_modules/*/docs/**/*",
    "!node_modules/*/examples/**/*",
    "!node_modules/better-sqlite3/**/*",
    "!node_modules/classic-level/**/*",
    "!node_modules/sqlite3/**/*",
    "!node_modules/level/**/*"
  ],
  extraResources: [
    {
      from: "public",
      to: "public"
    }
  ],
  asar: true,
  win: {
    target: [
      {
        target: "portable",
        arch: ["x64"]
      }
    ],
    icon: "build/icon.ico",
    artifactName: "BizneAI-POS-${version}-win-portable.exe"
  }
};

// Write the config to a temporary file
const configPath = path.join(__dirname, '../temp-win-simple-config.json');
fs.writeFileSync(configPath, JSON.stringify(winConfig, null, 2));

try {
  // Step 3: Build Windows executable with environment variable to skip native rebuilds
  console.log('🔨 Building Windows portable executable...');
  execSync(`npx electron-builder --config ${configPath} --win --x64`, { 
    stdio: 'inherit',
    env: { 
      ...process.env, 
      ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES: 'true',
      ELECTRON_BUILDER_SKIP_NATIVE_REBUILD: 'true'
    }
  });
  
  console.log('✅ Windows build completed successfully!');
  console.log('📁 Check the release/ directory for the Windows portable executable');
} catch (error) {
  console.error('❌ Windows build failed:', error.message);
  console.log('💡 Trying alternative approach...');
  
  // Alternative: Try building without any native dependencies
  try {
    console.log('🔄 Attempting build without native dependencies...');
    execSync(`npx electron-builder --config ${configPath} --win --x64 --config.buildDependenciesFromSource=false`, { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES: 'true'
      }
    });
    console.log('✅ Alternative Windows build completed successfully!');
  } catch (altError) {
    console.error('❌ Alternative build also failed:', altError.message);
  }
} finally {
  // Clean up temporary config
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
} 