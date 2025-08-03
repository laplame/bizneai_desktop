#!/bin/bash
echo "🚀 Iniciando Luxae Blockchain Node..."
cd node && npm install && npm run start:api-v2 &
cd ../frontend && npm install && npm run dev &
echo "✅ Nodo iniciado en http://localhost:5173"
