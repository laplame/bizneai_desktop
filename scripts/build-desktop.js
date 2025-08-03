import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Building BizneAI POS Desktop Applications...\n');

// Check if build directory exists
const buildDir = path.join(process.cwd(), 'build');
if (!fs.existsSync(buildDir)) {
  console.log('❌ Build directory not found. Please run: node scripts/generate-icons.js');
  process.exit(1);
}

// Check if icons exist
const requiredIcons = ['icon.ico', 'icon.icns', 'icon.png'];
for (const icon of requiredIcons) {
  const iconPath = path.join(buildDir, icon);
  if (!fs.existsSync(iconPath)) {
    console.log(`❌ Icon file not found: ${iconPath}`);
    console.log('Please run: node scripts/generate-icons.js');
    process.exit(1);
  }
}

console.log('✅ All required files found');

// Build the web application first
console.log('\n📦 Building web application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Web application built successfully');
} catch (error) {
  console.log('❌ Failed to build web application');
  process.exit(1);
}

// Function to build for a specific platform
function buildForPlatform(platform) {
  console.log(`\n🖥️  Building for ${platform}...`);
  try {
    const command = `npm run dist:${platform}`;
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${platform} build completed successfully`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to build for ${platform}`);
    return false;
  }
}

// Build for all platforms
const platforms = ['mac', 'win', 'linux'];
const results = [];

for (const platform of platforms) {
  const success = buildForPlatform(platform);
  results.push({ platform, success });
}

// Summary
console.log('\n📊 Build Summary:');
console.log('================');

let allSuccess = true;
for (const result of results) {
  const status = result.success ? '✅' : '❌';
  console.log(`${status} ${result.platform.toUpperCase()}`);
  if (!result.success) allSuccess = false;
}

if (allSuccess) {
  console.log('\n🎉 All builds completed successfully!');
  console.log('\n📁 Output files:');
  console.log('  - macOS: release/BizneAI POS-1.0.0.dmg');
  console.log('  - Windows: release/BizneAI POS Setup 1.0.0.exe');
  console.log('  - Linux: release/BizneAI POS-1.0.0.AppImage');
  console.log('\n🚀 Your desktop applications are ready for distribution!');
} else {
  console.log('\n⚠️  Some builds failed. Check the output above for details.');
  process.exit(1);
} 