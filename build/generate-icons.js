import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para crear un icono SVG básico para BizneAI POS
function createSVGIcon() {
  const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Fondo -->
  <rect width="512" height="512" rx="80" fill="url(#grad1)"/>
  
  <!-- Icono de POS -->
  <g transform="translate(128, 128)">
    <!-- Terminal/Pantalla -->
    <rect x="0" y="0" width="256" height="160" rx="16" fill="white" opacity="0.9"/>
    
    <!-- Pantalla interna -->
    <rect x="16" y="16" width="224" height="128" rx="8" fill="#1e293b"/>
    
    <!-- Líneas de texto simuladas -->
    <rect x="32" y="40" width="120" height="8" rx="4" fill="#64748b"/>
    <rect x="32" y="60" width="80" height="8" rx="4" fill="#64748b"/>
    <rect x="32" y="80" width="100" height="8" rx="4" fill="#64748b"/>
    <rect x="32" y="100" width="60" height="8" rx="4" fill="#64748b"/>
    <rect x="32" y="120" width="140" height="8" rx="4" fill="#64748b"/>
    
    <!-- Total -->
    <rect x="180" y="100" width="60" height="20" rx="10" fill="#059669"/>
    <text x="210" y="114" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">$25.50</text>
    
    <!-- Teclado -->
    <rect x="0" y="180" width="256" height="80" rx="12" fill="white" opacity="0.9"/>
    
    <!-- Teclas -->
    <rect x="16" y="196" width="32" height="32" rx="6" fill="#e2e8f0"/>
    <rect x="56" y="196" width="32" height="32" rx="6" fill="#e2e8f0"/>
    <rect x="96" y="196" width="32" height="32" rx="6" fill="#e2e8f0"/>
    <rect x="136" y="196" width="32" height="32" rx="6" fill="#e2e8f0"/>
    <rect x="176" y="196" width="32" height="32" rx="6" fill="#e2e8f0"/>
    <rect x="216" y="196" width="32" height="32" rx="6" fill="#e2e8f0"/>
    
    <rect x="16" y="236" width="32" height="32" rx="6" fill="#e2e8f0"/>
    <rect x="56" y="236" width="32" height="32" rx="6" fill="#e2e8f0"/>
    <rect x="96" y="236" width="32" height="32" rx="6" fill="#e2e8f0"/>
    <rect x="136" y="236" width="32" height="32" rx="6" fill="#e2e8f0"/>
    <rect x="176" y="236" width="32" height="32" rx="6" fill="#e2e8f0"/>
    <rect x="216" y="236" width="32" height="32" rx="6" fill="#e2e8f0"/>
  </g>
  
  <!-- Texto BizneAI -->
  <text x="256" y="480" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">BizneAI</text>
</svg>`;

  return svg;
}

// Crear el icono SVG
const svgIcon = createSVGIcon();
fs.writeFileSync(path.join(__dirname, 'icon.svg'), svgIcon);

console.log('✅ Icono SVG creado: build/icon.svg');
console.log('');
console.log('📋 Para generar los iconos en diferentes formatos, necesitas:');
console.log('');
console.log('🖥️  Para macOS (.icns):');
console.log('   1. Instalar ImageMagick: brew install imagemagick');
console.log('   2. Convertir SVG a PNG de diferentes tamaños');
console.log('   3. Usar iconutil para crear .icns');
console.log('');
console.log('🪟 Para Windows (.ico):');
console.log('   1. Convertir SVG a PNG de diferentes tamaños');
console.log('   2. Usar un convertidor online o herramienta como ImageMagick');
console.log('');
console.log('🐧 Para Linux (.png):');
console.log('   1. Convertir SVG a PNG de 512x512');
console.log('');
console.log('💡 Alternativa: Usar herramientas online como:');
console.log('   - https://www.electron.build/icons');
console.log('   - https://cloudconvert.com/svg-to-icns');
console.log('   - https://cloudconvert.com/svg-to-ico');
console.log('');
console.log('📁 Archivos necesarios:');
console.log('   - build/icon.icns (para macOS)');
console.log('   - build/icon.ico (para Windows)');
console.log('   - build/icon.png (para Linux)');
console.log('   - build/background.png (para DMG de macOS)'); 