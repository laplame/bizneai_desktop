#!/bin/bash

echo "Reiniciando servicio P2P..."

# Detener el servicio
pm2 stop luxae-api

# Limpiar el puerto si está en uso
lsof -ti:30303 | xargs kill -9 2>/dev/null

# Esperar un momento
sleep 2

# Reiniciar el servicio
pm2 start luxae-api

# Verificar el estado
echo "Verificando estado..."
sleep 5
pm2 list | grep luxae
netstat -tulpn | grep 30303

# Probar conectividad
echo "Probando conectividad..."
nc -zv localhost 30303 