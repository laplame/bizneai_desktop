#!/bin/bash
echo "🛑 Deteniendo Luxae Blockchain Node..."
pkill -f "start-api-v2"
pkill -f "vite"
echo "✅ Nodo detenido"
