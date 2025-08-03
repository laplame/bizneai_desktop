#!/bin/bash

echo "=== Estado del Sistema Luxae ==="

# Verificar procesos PM2
echo -e "\nProcesos PM2:"
pm2 list | grep luxae

# Verificar puertos
echo -e "\nPuertos en uso:"
echo "API (3000):"
lsof -i :3000 || echo "- No en uso"
echo "Dashboard (3001):"
lsof -i :3001 || echo "- No en uso"
echo "P2P (30303):"
lsof -i :30303 || echo "- No en uso"

# Verificar logs
echo -e "\nÚltimas líneas de logs:"
echo "API:"
tail -n 5 logs/api.log
echo "Dashboard:"
tail -n 5 logs/dashboard.log 