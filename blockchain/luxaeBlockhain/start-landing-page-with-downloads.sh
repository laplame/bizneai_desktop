#!/bin/bash

# Script para iniciar la Landing Page de Luxae con descargas habilitadas
# Autor: Luxae Team
# Versión: 2.0.0

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
LANDING_DIR="landing-page"
DOWNLOAD_DIR="$LANDING_DIR/download"
PORT="8080"

# Función para imprimir mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para verificar dependencias
check_dependencies() {
    print_status "Verificando dependencias..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js no está instalado. Por favor instala Node.js."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm no está instalado. Por favor instala npm."
        exit 1
    fi
    
    print_success "Dependencias verificadas"
}

# Función para verificar archivos de descarga
check_downloads() {
    print_status "Verificando archivos de descarga..."
    
    if [ ! -d "$DOWNLOAD_DIR" ]; then
        print_warning "Directorio de descargas no encontrado. Creando paquetes..."
        ./create-download-packages.sh
    fi
    
    if [ -d "$DOWNLOAD_DIR" ]; then
        local file_count=$(ls -1 "$DOWNLOAD_DIR"/*.zip "$DOWNLOAD_DIR"/*.tar.gz 2>/dev/null | wc -l)
        print_success "Encontrados $file_count archivos de descarga"
        
        echo "📦 Archivos disponibles:"
        ls -la "$DOWNLOAD_DIR"/*.zip "$DOWNLOAD_DIR"/*.tar.gz 2>/dev/null || echo "No hay archivos de descarga"
    else
        print_error "No se pudo crear el directorio de descargas"
        exit 1
    fi
}

# Función para instalar dependencias de la landing page
install_landing_deps() {
    print_status "Instalando dependencias de la landing page..."
    
    if [ ! -d "$LANDING_DIR/node_modules" ]; then
        cd "$LANDING_DIR"
        npm install
        cd ..
        print_success "Dependencias instaladas"
    else
        print_status "Dependencias ya instaladas"
    fi
}

# Función para iniciar el servidor
start_server() {
    print_status "Iniciando servidor de landing page..."
    
    cd "$LANDING_DIR"
    
    print_success "🚀 Servidor iniciado en http://localhost:$PORT"
    print_success "📦 Descargas disponibles en: http://localhost:$PORT/download/"
    print_success "📊 API de descargas: http://localhost:$PORT/api/downloads"
    print_success "🏥 Health check: http://localhost:$PORT/health"
    echo ""
    print_status "Presiona Ctrl+C para detener el servidor"
    echo ""
    
    npm start
}

# Función principal
main() {
    print_status "Iniciando Landing Page de Luxae con descargas..."
    
    # Verificar dependencias
    check_dependencies
    
    # Verificar archivos de descarga
    check_downloads
    
    # Instalar dependencias
    install_landing_deps
    
    # Iniciar servidor
    start_server
}

# Manejar señales de interrupción
trap 'print_status "Servidor detenido por el usuario"; exit 0' INT TERM

# Ejecutar función principal
main "$@" 