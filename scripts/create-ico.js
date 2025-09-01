import fs from 'fs';
import path from 'path';

console.log('🎨 Creating a valid 256x256 ICO file...');

// Create a simple 256x256 ICO file
// This is a minimal but valid ICO format
const createICO = () => {
  // ICO file structure for a 256x256 32-bit RGBA image
  const icoHeader = Buffer.from([
    0x00, 0x00, // Reserved
    0x01, 0x00, // Type (1 = ICO)
    0x01, 0x00, // Number of images
    0x00,        // Width (0 = 256)
    0x00,        // Height (0 = 256)
    0x00,        // Color count
    0x00,        // Reserved
    0x01, 0x00, // Color planes
    0x20, 0x00, // Bits per pixel (32)
    0x00, 0x00, 0x00, 0x00, // Size of image data (placeholder)
    0x16, 0x00, 0x00, 0x00  // Offset to image data
  ]);

  // Create a simple 256x256 RGBA image (solid color)
  const width = 256;
  const height = 256;
  const imageSize = width * height * 4; // 4 bytes per pixel (RGBA)
  
  // Create image data (simple gradient)
  const imageData = Buffer.alloc(imageSize);
  for (let i = 0; i < imageSize; i += 4) {
    const x = (i / 4) % width;
    const y = Math.floor((i / 4) / width);
    
    // Create a simple gradient
    const r = Math.floor((x / width) * 255);
    const g = Math.floor((y / height) * 255);
    const b = 128;
    const a = 255;
    
    imageData[i] = r;     // Red
    imageData[i + 1] = g; // Green
    imageData[i + 2] = b; // Blue
    imageData[i + 3] = a; // Alpha
  }

  // Update the size in the header
  const sizeBuffer = Buffer.alloc(4);
  sizeBuffer.writeUInt32LE(imageSize, 0);
  icoHeader.writeUInt32LE(imageSize, 10);

  // Combine header and image data
  const icoData = Buffer.concat([icoHeader, imageData]);
  
  return icoData;
};

try {
  const buildDir = path.join(process.cwd(), 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  const icoData = createICO();
  const icoPath = path.join(buildDir, 'icon.ico');
  
  fs.writeFileSync(icoPath, icoData);
  
  console.log(`✅ ICO file created successfully at: ${icoPath}`);
  console.log(`📏 Size: ${icoData.length} bytes`);
  console.log(`🖼️  Dimensions: 256x256 pixels`);
  
} catch (error) {
  console.error('❌ Error creating ICO file:', error.message);
  process.exit(1);
}
