#!/bin/bash

# Script para crear paquetes de descarga de Luxae Blockchain
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
VERSION="2.0.0"
PROJECT_NAME="luxae-blockchain"
DOWNLOAD_DIR="landing-page/download"
TEMP_DIR="temp-build"

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

# Función para limpiar archivos temporales
cleanup() {
    print_status "Limpiando archivos temporales..."
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
}

# Función para crear directorio de descargas
setup_download_dir() {
    print_status "Configurando directorio de descargas..."
    mkdir -p "$DOWNLOAD_DIR"
    print_success "Directorio de descargas creado: $DOWNLOAD_DIR"
}

# Función para crear paquete completo (ZIP)
create_full_package() {
    print_status "Creando paquete completo ZIP..."
    
    local package_name="${PROJECT_NAME}-v${VERSION}.zip"
    local package_path="$DOWNLOAD_DIR/$package_name"
    
    # Crear directorio temporal
    mkdir -p "$TEMP_DIR"
    
    # Copiar archivos principales (excluyendo node_modules y archivos innecesarios)
    print_status "Copiando archivos del proyecto..."
    rsync -av --exclude='node_modules' \
              --exclude='.git' \
              --exclude='.DS_Store' \
              --exclude='*.log' \
              --exclude='temp-build' \
              --exclude='landing-page' \
              --exclude='dist' \
              --exclude='package-exportable' \
              --exclude='logs' \
              --exclude='data' \
              --exclude='chaindb' \
              --exclude='blockchainDB' \
              --exclude='validator-keys' \
              --exclude='consensus' \
              ./ "$TEMP_DIR/"
    
    # Crear archivo ZIP
    cd "$TEMP_DIR"
    zip -r "../$package_path" . -x "*.DS_Store" "*.log"
    cd ..
    
    print_success "Paquete completo creado: $package_path"
}

# Función para crear paquete específico para Linux
create_linux_package() {
    print_status "Creando paquete para Linux..."
    
    local package_name="${PROJECT_NAME}-linux-v${VERSION}.tar.gz"
    local package_path="$DOWNLOAD_DIR/$package_name"
    
    # Crear directorio temporal para Linux
    mkdir -p "$TEMP_DIR-linux"
    
    # Copiar archivos específicos para Linux
    rsync -av --exclude='node_modules' \
              --exclude='.git' \
              --exclude='.DS_Store' \
              --exclude='*.log' \
              --exclude='temp-build' \
              --exclude='landing-page' \
              --exclude='dist' \
              --exclude='package-exportable' \
              --exclude='logs' \
              --exclude='data' \
              --exclude='chaindb' \
              --exclude='blockchainDB' \
              --exclude='validator-keys' \
              --exclude='consensus' \
              ./ "$TEMP_DIR-linux/"
    
    # Agregar script de instalación para Linux
    cat > "$TEMP_DIR-linux/install-linux.sh" << 'EOF'
#!/bin/bash
# Script de instalación para Linux
echo "Instalando Luxae Blockchain en Linux..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js no está instalado. Instalando..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Instalar dependencias
npm install

# Crear directorios necesarios
mkdir -p data chaindb blockchainDB validator-keys consensus logs

echo "Instalación completada. Ejecuta 'npm start' para iniciar el nodo."
EOF
    
    chmod +x "$TEMP_DIR-linux/install-linux.sh"
    
    # Crear archivo tar.gz
    cd "$TEMP_DIR-linux"
    tar -czf "../$package_path" .
    cd ..
    
    print_success "Paquete Linux creado: $package_path"
}

# Función para crear paquete específico para Windows
create_windows_package() {
    print_status "Creando paquete para Windows..."
    
    local package_name="${PROJECT_NAME}-windows-v${VERSION}.zip"
    local package_path="$DOWNLOAD_DIR/$package_name"
    
    # Crear directorio temporal para Windows
    mkdir -p "$TEMP_DIR-windows"
    
    # Copiar archivos específicos para Windows
    rsync -av --exclude='node_modules' \
              --exclude='.git' \
              --exclude='.DS_Store' \
              --exclude='*.log' \
              --exclude='temp-build' \
              --exclude='landing-page' \
              --exclude='dist' \
              --exclude='package-exportable' \
              --exclude='logs' \
              --exclude='data' \
              --exclude='chaindb' \
              --exclude='blockchainDB' \
              --exclude='validator-keys' \
              --exclude='consensus' \
              ./ "$TEMP_DIR-windows/"
    
    # Agregar script de instalación para Windows
    cat > "$TEMP_DIR-windows/install-windows.bat" << 'EOF'
@echo off
echo Instalando Luxae Blockchain en Windows...

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js no está instalado. Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

REM Instalar dependencias
npm install

REM Crear directorios necesarios
mkdir data 2>nul
mkdir chaindb 2>nul
mkdir blockchainDB 2>nul
mkdir validator-keys 2>nul
mkdir consensus 2>nul
mkdir logs 2>nul

echo Instalacion completada. Ejecuta 'npm start' para iniciar el nodo.
pause
EOF
    
    # Crear archivo ZIP
    cd "$TEMP_DIR-windows"
    zip -r "../$package_path" . -x "*.DS_Store" "*.log"
    cd ..
    
    print_success "Paquete Windows creado: $package_path"
}

# Función para crear paquete específico para macOS
create_macos_package() {
    print_status "Creando paquete para macOS..."
    
    local package_name="${PROJECT_NAME}-macos-v${VERSION}.tar.gz"
    local package_path="$DOWNLOAD_DIR/$package_name"
    
    # Crear directorio temporal para macOS
    mkdir -p "$TEMP_DIR-macos"
    
    # Copiar archivos específicos para macOS
    rsync -av --exclude='node_modules' \
              --exclude='.git' \
              --exclude='.DS_Store' \
              --exclude='*.log' \
              --exclude='temp-build' \
              --exclude='landing-page' \
              --exclude='dist' \
              --exclude='package-exportable' \
              --exclude='logs' \
              --exclude='data' \
              --exclude='chaindb' \
              --exclude='blockchainDB' \
              --exclude='validator-keys' \
              --exclude='consensus' \
              ./ "$TEMP_DIR-macos/"
    
    # Agregar script de instalación para macOS
    cat > "$TEMP_DIR-macos/install-macos.sh" << 'EOF'
#!/bin/bash
# Script de instalación para macOS
echo "Instalando Luxae Blockchain en macOS..."

# Verificar Homebrew
if ! command -v brew &> /dev/null; then
    echo "Homebrew no está instalado. Instalando..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js no está instalado. Instalando..."
    brew install node
fi

# Instalar dependencias
npm install

# Crear directorios necesarios
mkdir -p data chaindb blockchainDB validator-keys consensus logs

echo "Instalación completada. Ejecuta 'npm start' para iniciar el nodo."
EOF
    
    chmod +x "$TEMP_DIR-macos/install-macos.sh"
    
    # Crear archivo tar.gz
    cd "$TEMP_DIR-macos"
    tar -czf "../$package_path" .
    cd ..
    
    print_success "Paquete macOS creado: $package_path"
}

# Función para crear archivo de información de descargas
create_download_info() {
    print_status "Creando archivo de información de descargas..."
    
    cat > "$DOWNLOAD_DIR/download-info.json" << EOF
{
  "version": "$VERSION",
  "release_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "packages": {
    "full": {
      "name": "${PROJECT_NAME}-v${VERSION}.zip",
      "size": "$(du -h "$DOWNLOAD_DIR/${PROJECT_NAME}-v${VERSION}.zip" | cut -f1)",
      "description": "Paquete completo para todas las plataformas"
    },
    "linux": {
      "name": "${PROJECT_NAME}-linux-v${VERSION}.tar.gz",
      "size": "$(du -h "$DOWNLOAD_DIR/${PROJECT_NAME}-linux-v${VERSION}.tar.gz" | cut -f1)",
      "description": "Paquete específico para Linux"
    },
    "windows": {
      "name": "${PROJECT_NAME}-windows-v${VERSION}.zip",
      "size": "$(du -h "$DOWNLOAD_DIR/${PROJECT_NAME}-windows-v${VERSION}.zip" | cut -f1)",
      "description": "Paquete específico para Windows"
    },
    "macos": {
      "name": "${PROJECT_NAME}-macos-v${VERSION}.tar.gz",
      "size": "$(du -h "$DOWNLOAD_DIR/${PROJECT_NAME}-macos-v${VERSION}.tar.gz" | cut -f1)",
      "description": "Paquete específico para macOS"
    }
  },
  "git_repository": "https://github.com/tu-usuario/luxae.git",
  "documentation": "https://github.com/tu-usuario/luxae#readme"
}
EOF
    
    print_success "Archivo de información creado: $DOWNLOAD_DIR/download-info.json"
}

# Función principal
main() {
    print_status "Iniciando creación de paquetes de descarga para Luxae Blockchain v$VERSION"
    
    # Configurar directorio de descargas
    setup_download_dir
    
    # Crear paquetes
    create_full_package
    create_linux_package
    create_windows_package
    create_macos_package
    
    # Crear archivo de información
    create_download_info
    
    # Limpiar archivos temporales
    cleanup
    
    print_success "¡Todos los paquetes han sido creados exitosamente!"
    print_status "Archivos creados en: $DOWNLOAD_DIR"
    ls -la "$DOWNLOAD_DIR"
}

# Manejar señales de interrupción
trap cleanup EXIT
trap 'print_error "Interrumpido por el usuario"; exit 1' INT TERM

# Ejecutar función principal
main "$@" 