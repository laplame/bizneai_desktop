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
