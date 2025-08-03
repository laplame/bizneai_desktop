#!/bin/bash

# Script para iniciar la Landing Page de Luxae Blockchain
# Versión: 2.0.0

set -e

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

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Directorios
LANDING_DIR="landing-page"
PORT=8080

echo
echo "🌐 Iniciando Landing Page de Luxae Blockchain"
echo "============================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "$LANDING_DIR/index.html" ]; then
    error "No se encontró la landing page. Asegúrese de estar en el directorio correcto."
    exit 1
fi

# Navegar al directorio de la landing page
cd "$LANDING_DIR"

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
    log "Instalando dependencias..."
    npm install
fi

# Verificar si el puerto está disponible
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    warn "Puerto $PORT está en uso"
    read -p "¿Desea continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Iniciar el servidor
log "Iniciando servidor en puerto $PORT..."
npm start 