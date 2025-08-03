import fs from 'fs';
import path from 'path';

// Create a simple SVG icon
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#grad1)"/>
  <circle cx="256" cy="200" r="60" fill="white" opacity="0.9"/>
  <rect x="180" y="280" width="152" height="8" rx="4" fill="white" opacity="0.9"/>
  <rect x="200" y="300" width="112" height="8" rx="4" fill="white" opacity="0.7"/>
  <rect x="220" y="320" width="72" height="8" rx="4" fill="white" opacity="0.5"/>
  <circle cx="256" cy="380" r="20" fill="white" opacity="0.8"/>
</svg>
`;

// Create build directory if it doesn't exist
const buildDir = path.join(process.cwd(), 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Write SVG icon
fs.writeFileSync(path.join(buildDir, 'icon.svg'), svgIcon);

// Create a simple PNG icon (base64 encoded minimal PNG)
const pngIcon = Buffer.from(`
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
`, 'base64');

fs.writeFileSync(path.join(buildDir, 'icon.png'), pngIcon);

// Create a simple ICO file (minimal ICO format)
const icoHeader = Buffer.from([
  0x00, 0x00, // Reserved
  0x01, 0x00, // Type (1 = ICO)
  0x01, 0x00, // Number of images
  0x10, 0x00, // Width (16)
  0x10, 0x00, // Height (16)
  0x00,       // Color count
  0x00,       // Reserved
  0x01, 0x00, // Color planes
  0x20, 0x00, // Bits per pixel
  0x40, 0x00, 0x00, 0x00, // Size of image data
  0x16, 0x00, 0x00, 0x00  // Offset to image data
]);

const icoData = Buffer.concat([icoHeader, pngIcon]);
fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoData);

// Create a simple ICNS file (minimal ICNS format)
const icnsHeader = Buffer.from([
  0x69, 0x63, 0x6e, 0x73, // 'icns'
  0x00, 0x00, 0x00, 0x20, // Size
  0x69, 0x63, 0x6f, 0x6e, // 'icon'
  0x00, 0x00, 0x00, 0x18  // Size
]);

const icnsData = Buffer.concat([icnsHeader, pngIcon]);
fs.writeFileSync(path.join(buildDir, 'icon.icns'), icnsData);

console.log('✅ Icons generated successfully in build/ directory');
console.log('📁 Files created:');
console.log('  - icon.svg (vector format)');
console.log('  - icon.png (PNG format)');
console.log('  - icon.ico (Windows ICO format)');
console.log('  - icon.icns (macOS ICNS format)'); 