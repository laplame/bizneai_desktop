#!/bin/bash

echo "🚀 Iniciando Sistema Luxae Blockchain v2..."

# Verificar si estamos en el directorio correcto
if [ ! -d "frontend-luxae" ]; then
    echo "❌ Error: No se encontró el directorio frontend-luxae"
    echo "💡 Asegúrate de estar en el directorio raíz del proyecto"
    exit 1
fi

# Verificar si node_modules existe en el proyecto principal
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias del proyecto principal..."
    npm install
fi

# Verificar si node_modules existe en el frontend
if [ ! -d "frontend-luxae/node_modules" ]; then
    echo "📦 Instalando dependencias del frontend..."
    cd frontend-luxae
    npm install
    cd ..
fi

# Verificar y liberar puertos
echo "🔍 Verificando puertos..."

# Puerto 3001 (API v2)
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Puerto 3001 ya está en uso"
    echo "🔄 Intentando liberar el puerto..."
    pkill -f "node.*start-api-v2"
    sleep 2
fi

# Puerto 5173 (Frontend)
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Puerto 5173 ya está en uso"
    echo "🔄 Intentando liberar el puerto..."
    pkill -f "vite"
    sleep 2
fi

# Puerto 30303 (P2P)
if lsof -Pi :30303 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Puerto 30303 ya está en uso"
    echo "🔄 Intentando liberar el puerto..."
    pkill -f "libp2p"
    sleep 2
fi

echo "✅ Puertos verificados y liberados"

# Iniciar el sistema completo
echo "🌐 Iniciando sistema completo..."
echo "📱 Frontend: http://localhost:5173"
echo "🔗 API v2: http://localhost:3001"
echo "📚 Documentación: http://localhost:3001/api-docs"
echo "🏥 Health Check: http://localhost:3001/health"
echo ""
echo "💡 Para detener el sistema, presiona Ctrl+C"
echo ""

# Iniciar el sistema con concurrently
npm run dev 