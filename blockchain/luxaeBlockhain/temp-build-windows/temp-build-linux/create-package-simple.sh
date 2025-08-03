#!/bin/bash

# Script simple para crear el paquete exportable de Luxae Blockchain
# Versión: 2.0.0

set -e

# Configuración
PACKAGE_NAME="luxae-blockchain-node"
PACKAGE_VERSION="2.0.0"
PACKAGE_DIR="package-exportable"
DIST_DIR="dist"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

echo
echo "📦 Creando Paquete Exportable de Luxae Blockchain"
echo "================================================="

# Limpiar directorios anteriores
log "Limpiando directorios anteriores..."
rm -rf "$PACKAGE_DIR"
rm -rf "$DIST_DIR"
mkdir -p "$PACKAGE_DIR"
mkdir -p "$DIST_DIR"

# Crear estructura de directorios
log "Creando estructura de directorios..."
mkdir -p "$PACKAGE_DIR"/{node,frontend,logs,data}

# Copiar archivos del nodo
log "Copiando archivos del nodo blockchain..."
cp package.json "$PACKAGE_DIR/node/"
cp -r src/ "$PACKAGE_DIR/node/"
cp -r scripts/ "$PACKAGE_DIR/node/"

# Copiar archivos del frontend
log "Copiando archivos del frontend..."
cp -r frontend-luxae/* "$PACKAGE_DIR/frontend/"

# Crear README
log "Creando README..."
cat > "$PACKAGE_DIR/README.md" << 'EOF'
# Luxae Blockchain Node - Paquete Exportable

## 🌐 Nodo Blockchain Autónomo

Este paquete permite ejecutar un nodo completo de la blockchain Luxae en cualquier sistema (Windows, Linux, macOS).

## 🚀 Instalación Rápida

### Linux/macOS
```bash
chmod +x start-node.sh
./start-node.sh
```

### Windows
```batch
start-node.bat
```

## 📊 URLs de Acceso
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001
- **Documentación**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## 🛑 Para Detener
- Linux/macOS: `./stop-node.sh`
- Windows: `stop-node.bat`

## 📄 Licencia
MIT License
EOF

# Crear scripts principales
log "Creando scripts principales..."

# Script de inicio para Linux/macOS
cat > "$PACKAGE_DIR/start-node.sh" << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Luxae Blockchain Node..."
cd node && npm install && npm run start:api-v2 &
cd ../frontend && npm install && npm run dev &
echo "✅ Nodo iniciado en http://localhost:5173"
EOF

# Script de detención para Linux/macOS
cat > "$PACKAGE_DIR/stop-node.sh" << 'EOF'
#!/bin/bash
echo "🛑 Deteniendo Luxae Blockchain Node..."
pkill -f "start-api-v2"
pkill -f "vite"
echo "✅ Nodo detenido"
EOF

# Script de inicio para Windows
cat > "$PACKAGE_DIR/start-node.bat" << 'EOF'
@echo off
echo 🚀 Iniciando Luxae Blockchain Node...
cd node && npm install && start /b npm run start:api-v2
cd ../frontend && npm install && start /b npm run dev
echo ✅ Nodo iniciado en http://localhost:5173
pause
EOF

# Script de detención para Windows
cat > "$PACKAGE_DIR/stop-node.bat" << 'EOF'
@echo off
echo 🛑 Deteniendo Luxae Blockchain Node...
taskkill /f /im node.exe
echo ✅ Nodo detenido
pause
EOF

# Hacer ejecutables los scripts
log "Haciendo ejecutables los scripts..."
chmod +x "$PACKAGE_DIR"/start-node.sh
chmod +x "$PACKAGE_DIR"/stop-node.sh

# Crear package.json para el nodo
log "Creando package.json para el nodo..."
cat > "$PACKAGE_DIR/node/package.json" << 'EOF'
{
  "name": "luxae-blockchain-node",
  "version": "2.0.0",
  "description": "Luxae Blockchain Node",
  "main": "scripts/start-api-v2.js",
  "type": "module",
  "scripts": {
    "start": "node scripts/start-api-v2.js",
    "start:api-v2": "node scripts/start-api-v2.js"
  },
  "dependencies": {
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "swagger-ui-express": "^5.0.0",
    "swagger-jsdoc": "^6.2.8",
    "axios": "^1.6.2",
    "libp2p": "^0.46.0",
    "@libp2p/tcp": "^12.0.0",
    "@libp2p/bootstrap": "^12.0.0",
    "@libp2p/mplex": "^12.0.0",
    "@chainsafe/libp2p-noise": "^13.0.0",
    "@multiformats/multiaddr": "^13.0.0",
    "crypto": "^1.0.1"
  }
}
EOF

# Crear package.json para el frontend
log "Creando package.json para el frontend..."
cat > "$PACKAGE_DIR/frontend/package.json" << 'EOF'
{
  "name": "luxae-frontend",
  "version": "2.0.0",
  "description": "Luxae Blockchain Frontend",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "axios": "^1.6.2",
    "@heroicons/react": "^2.0.18"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.1.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "@tailwindcss/postcss": "^4.0.0",
    "vite": "^7.0.6"
  }
}
EOF

# Crear archivo de licencia
log "Creando archivo de licencia..."
cat > "$PACKAGE_DIR/LICENSE" << 'EOF'
MIT License

Copyright (c) 2025 Luxae Blockchain

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

# Crear archivo de versión
log "Creando archivo de versión..."
cat > "$PACKAGE_DIR/VERSION" << EOF
Luxae Blockchain Node
Version: 2.0.0
Build Date: $(date)
EOF

# Crear paquete final
log "Creando paquete final..."
cd "$PACKAGE_DIR"
tar -czf "../$DIST_DIR/${PACKAGE_NAME}-v${PACKAGE_VERSION}.tar.gz" .
cd ..

# Mostrar información del paquete
PACKAGE_FILE="$DIST_DIR/${PACKAGE_NAME}-v${PACKAGE_VERSION}.tar.gz"
SIZE=$(du -h "$PACKAGE_FILE" | cut -f1)

echo
echo "🎉 ¡Paquete exportable creado exitosamente!"
echo "📁 Ubicación: $PACKAGE_FILE"
echo "📦 Tamaño: $SIZE"
echo "📋 Contenido:"
echo "   - Nodo blockchain completo"
echo "   - API REST"
echo "   - Frontend React"
echo "   - Scripts de inicio/detención"
echo "   - Documentación"
echo
echo "🚀 Para usar el paquete:"
echo "1. Extraer el archivo .tar.gz"
echo "2. Navegar al directorio extraído"
echo "3. Ejecutar: ./start-node.sh (Linux/macOS) o start-node.bat (Windows)"
echo
echo "🌐 El paquete está listo para ser distribuido e implementado en otros sistemas." 