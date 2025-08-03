#!/bin/bash

echo "🚀 Iniciando Frontend Luxae Blockchain..."

# Verificar si estamos en el directorio correcto
if [ ! -d "frontend-luxae" ]; then
    echo "❌ Error: No se encontró el directorio frontend-luxae"
    echo "💡 Asegúrate de estar en el directorio raíz del proyecto"
    exit 1
fi

# Navegar al directorio del frontend
cd frontend-luxae

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Verificar si el puerto 5173 está disponible
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Puerto 5173 ya está en uso"
    echo "🔄 Intentando liberar el puerto..."
    pkill -f "vite"
    sleep 2
fi

echo "🌐 Iniciando servidor de desarrollo Vite..."
echo "📱 Frontend disponible en: http://localhost:5173"
echo "🔗 API Backend: http://localhost:3000"
echo ""
echo "💡 Para detener el servidor, presiona Ctrl+C"
echo ""

# Iniciar el servidor de desarrollo Vite
npm run dev 