#!/bin/bash

echo "Deteniendo nodo Luxae..."

# Encontrar y terminar procesos
pkill -f "start-validator.js"

# Verificar puertos y terminar procesos
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:30303 | xargs kill -9 2>/dev/null

echo "Nodo detenido" 