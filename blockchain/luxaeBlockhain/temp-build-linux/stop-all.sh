#!/bin/bash

echo "Deteniendo servicios Luxae..."

# Detener procesos PM2
pm2 stop luxae-api luxae-dashboard

# Verificar y matar procesos en puertos específicos
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:30303 | xargs kill -9 2>/dev/null

echo "Servicios detenidos"

# Opcional: Eliminar procesos de PM2
read -p "¿Desea eliminar los procesos de PM2? (s/N) " response
if [[ "$response" =~ ^([sS][iI]|[sS])$ ]]; then
    pm2 delete luxae-api luxae-dashboard
    pm2 save
    echo "Procesos eliminados de PM2"
fi 