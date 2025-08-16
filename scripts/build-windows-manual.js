import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Building BizneAI POS for Windows (Manual)...');

// Step 1: Build the web application
console.log('📦 Building web application...');
execSync('npm run build', { stdio: 'inherit' });

// Step 2: Create a minimal config that completely skips native dependencies
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
    "package.json"
  ],
  extraResources: [
    {
      from: "public",
      to: "public"
    }
  ],
  asar: false,
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
const configPath = path.join(__dirname, '../temp-win-manual-config.json');
fs.writeFileSync(configPath, JSON.stringify(winConfig, null, 2));

try {
  // Step 3: Try building with electron-builder but skip native rebuilds
  console.log('🔨 Building Windows portable executable (manual)...');
  
  // Set environment variables to skip native rebuilds
  const env = {
    ...process.env,
    ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES: 'true',
    ELECTRON_BUILDER_SKIP_NATIVE_REBUILD: 'true',
    ELECTRON_BUILDER_BUILD_FROM_SOURCE: 'false'
  };
  
  execSync(`npx electron-builder --config ${configPath} --win --x64 --config.buildDependenciesFromSource=false`, { 
    stdio: 'inherit',
    env
  });
  
  console.log('✅ Windows build completed successfully!');
  console.log('📁 Check the release/ directory for the Windows portable executable');
} catch (error) {
  console.error('❌ Windows build failed:', error.message);
  console.log('💡 Creating a basic Windows package without native dependencies...');
  
  // Create a basic Windows package manually
  try {
    const releaseDir = path.join(__dirname, '../release');
    const winDir = path.join(releaseDir, 'win');
    
    // Create directories
    if (!fs.existsSync(winDir)) {
      fs.mkdirSync(winDir, { recursive: true });
    }
    
    // Copy necessary files
    const filesToCopy = [
      { from: 'dist', to: 'dist' },
      { from: 'electron', to: 'electron' },
      { from: 'package.json', to: 'package.json' },
      { from: 'public', to: 'public' }
    ];
    
    filesToCopy.forEach(({ from, to }) => {
      const sourcePath = path.join(__dirname, '..', from);
      const destPath = path.join(winDir, to);
      
      if (fs.existsSync(sourcePath)) {
        if (fs.lstatSync(sourcePath).isDirectory()) {
          execSync(`cp -r "${sourcePath}" "${destPath}"`, { stdio: 'inherit' });
        } else {
          execSync(`cp "${sourcePath}" "${destPath}"`, { stdio: 'inherit' });
        }
      }
    });
    
    console.log('✅ Basic Windows package created in release/win/');
    console.log('📝 Note: This is a basic package without native dependencies');
    console.log('💡 To create a full Windows installer, build on a Windows machine');
    
  } catch (manualError) {
    console.error('❌ Manual packaging also failed:', manualError.message);
  }
} finally {
  // Clean up temporary config
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
} 