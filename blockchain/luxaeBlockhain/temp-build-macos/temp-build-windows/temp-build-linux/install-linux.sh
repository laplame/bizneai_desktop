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
