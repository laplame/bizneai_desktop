import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Building BizneAI POS for Windows...');

// Step 1: Build the web application
console.log('📦 Building web application...');
execSync('npm run build', { stdio: 'inherit' });

// Step 2: Create Windows-specific electron-builder config
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
    "blockchain/**/*",
    "node_modules/**/*",
    "package.json",
    "!node_modules/.cache/**/*",
    "!node_modules/.vite/**/*",
    "!node_modules/.bin/**/*",
    "!node_modules/*/test/**/*",
    "!node_modules/*/tests/**/*",
    "!node_modules/*/docs/**/*",
    "!node_modules/*/examples/**/*",
    "!node_modules/better-sqlite3/**/*",
    "!node_modules/classic-level/**/*",
    "!node_modules/sqlite3/**/*"
  ],
  extraResources: [
    {
      from: "public",
      to: "public"
    },
    {
      from: "blockchain/luxaeBlockhain/data",
      to: "blockchain/data"
    }
  ],
  asar: true,
  asarUnpack: [
    "node_modules/call-bind-apply-helpers/**/*",
    "node_modules/call-bind/**/*",
    "node_modules/get-intrinsic/**/*",
    "node_modules/side-channel/**/*",
    "node_modules/dunder-proto/**/*",
    "node_modules/get-proto/**/*",
    "node_modules/express/**/*",
    "node_modules/qs/**/*",
    "node_modules/cloudinary/**/*",
    "node_modules/multer/**/*",
    "node_modules/cors/**/*",
    "node_modules/helmet/**/*",
    "node_modules/morgan/**/*",
    "node_modules/socket.io/**/*",
    "node_modules/ws/**/*",
    "node_modules/axios/**/*",
    "node_modules/stripe/**/*",
    "node_modules/zod/**/*",
    "node_modules/quagga/**/*",
    "node_modules/lucide-react/**/*",
    "node_modules/react-hot-toast/**/*"
  ],
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64"]
      },
      {
        target: "portable",
        arch: ["x64"]
      }
    ],
    icon: "build/icon.ico",
    requestedExecutionLevel: "asInvoker",
    artifactName: "BizneAI-POS-${version}-win.${ext}"
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "BizneAI POS"
  }
};

// Write the config to a temporary file
const configPath = path.join(__dirname, '../temp-win-config.json');
fs.writeFileSync(configPath, JSON.stringify(winConfig, null, 2));

try {
  // Step 3: Build Windows executable
  console.log('🔨 Building Windows executable...');
  execSync(`npx electron-builder --config ${configPath} --win --x64`, { 
    stdio: 'inherit',
    env: { ...process.env, ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES: 'true' }
  });
  
  console.log('✅ Windows build completed successfully!');
  console.log('📁 Check the release/ directory for the Windows installer');
} catch (error) {
  console.error('❌ Windows build failed:', error.message);
} finally {
  // Clean up temporary config
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
} 