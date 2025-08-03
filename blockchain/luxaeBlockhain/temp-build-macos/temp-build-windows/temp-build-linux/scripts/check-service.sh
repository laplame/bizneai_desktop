#!/bin/bash

echo "=== Verificando Estado del Servicio ==="

# Verificar API
echo -n "API (3000): "
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✓ OK"
else
    echo "✗ Error"
    # Verificar logs
    echo "Últimas líneas del log:"
    tail -n 5 logs/api.log
fi

# Verificar proceso PM2
echo -n "Proceso PM2: "
if pm2 list | grep luxae-api | grep "online" > /dev/null; then
    echo "✓ OK"
else
    echo "✗ Error"
    pm2 list
fi

# Verificar puertos
echo -n "Puerto 3000: "
if netstat -tulpn 2>/dev/null | grep :3000 > /dev/null; then
    echo "✓ OK"
else
    echo "✗ No está en uso"
fi

# Verificar conectividad
echo "Probando endpoint de salud..."
curl -v http://localhost:3000/health 2>&1 | grep "< HTTP" 