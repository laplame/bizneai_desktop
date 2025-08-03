#!/bin/bash

echo "=== Iniciando Luxae Dashboard ==="

# Matar procesos existentes en los puertos
echo "Limpiando puertos..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Limpiar build anterior
echo "Limpiando build anterior..."
pnpm clean

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias..."
    pnpm install
fi

# Construir y iniciar
echo "Construyendo y iniciando..."
pnpm build && node server.js 