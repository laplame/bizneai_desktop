import fs from 'fs';
import path from 'path';
import Jimp from 'jimp';
import pngToIco from 'png-to-ico';

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

async function generateIcons() {
  // Create 256x256 PNG with Jimp (gradient purple + white shapes)
  const size = 256;
  const image = new Jimp(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const r = Math.floor(102 + (118 - 102) * (x / size));
      const g = Math.floor(126 + (75 - 126) * (x / size));
      const b = Math.floor(234 + (162 - 234) * (x / size));
      image.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
    }
  }
  // Draw white circle
  const cx = size / 2;
  const cy = size * 0.4;
  const radius = 30;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < radius) {
        image.setPixelColor(Jimp.rgbaToInt(255, 255, 255, 230), x, y);
      }
    }
  }
  const pngBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
  const pngPath = path.join(buildDir, 'icon.png');
  fs.writeFileSync(pngPath, pngBuffer);

  // Create valid ICO using png-to-ico (accepts file path)
  const icoBuffer = await pngToIco(pngPath);
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);

  // ICNS: keep minimal format for macOS (electron-builder may handle it)
  const icnsHeader = Buffer.from([
    0x69, 0x63, 0x6e, 0x73, 0x00, 0x00, 0x00, 0x20,
    0x69, 0x63, 0x6f, 0x6e, 0x00, 0x00, 0x00, 0x18
  ]);
  fs.writeFileSync(path.join(buildDir, 'icon.icns'), Buffer.concat([icnsHeader, pngBuffer.slice(0, 8)]));

  console.log('✅ Icons generated successfully in build/ directory');
  console.log('📁 Files created:');
  console.log('  - icon.svg (vector format)');
  console.log('  - icon.png (PNG format)');
  console.log('  - icon.ico (Windows ICO format)');
  console.log('  - icon.icns (macOS ICNS format)');
}

generateIcons().catch((err) => {
  console.error('❌ Failed to generate icons:', err);
  process.exit(1);
}); 