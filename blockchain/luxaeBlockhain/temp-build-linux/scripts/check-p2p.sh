#!/bin/bash

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

REMOTE_NODE="161.22.47.84"
P2P_PORT=30303

echo "=== Verificación Detallada de P2P ==="

# 1. Verificar si el puerto local está en uso
echo -e "\n1. Verificando puerto local..."
if lsof -i :30303 >/dev/null; then
    echo -e "${GREEN}✓ Puerto local 30303 está en uso (correcto)${NC}"
    echo "Proceso usando el puerto:"
    lsof -i :30303
else
    echo -e "${RED}✗ Puerto local 30303 no está en uso${NC}"
    echo "Verifica que el nodo P2P esté corriendo"
fi

# 2. Verificar firewall
echo -e "\n2. Verificando firewall..."
if command -v ufw >/dev/null; then
    echo "Estado de UFW:"
    sudo ufw status | grep 30303
elif command -v firewall-cmd >/dev/null; then
    echo "Estado de FirewallD:"
    sudo firewall-cmd --list-ports | grep 30303
else
    echo -e "${YELLOW}⚠ No se detectó firewall conocido${NC}"
fi

# 3. Verificar conectividad TCP
echo -e "\n3. Prueba de conexión TCP..."
if command -v nc >/dev/null; then
    if nc -zv $REMOTE_NODE $P2P_PORT 2>/dev/null; then
        echo -e "${GREEN}✓ Conexión TCP exitosa${NC}"
    else
        echo -e "${RED}✗ No se puede establecer conexión TCP${NC}"
    fi
else
    echo -e "${YELLOW}⚠ netcat no está instalado${NC}"
fi

# 4. Verificar ruta de red
echo -e "\n4. Ruta de red al nodo remoto..."
traceroute $REMOTE_NODE 2>/dev/null || mtr -n $REMOTE_NODE || echo -e "${YELLOW}⚠ No hay herramientas de traceroute disponibles${NC}"

# 5. Verificar configuración de red
echo -e "\n5. Configuración de red local..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    ifconfig | grep "inet "
else
    ip addr show | grep "inet "
fi

# 6. Intentar conexión WebSocket
echo -e "\n6. Prueba de conexión WebSocket..."
if command -v wscat >/dev/null; then
    timeout 5 wscat -c "ws://$REMOTE_NODE:$P2P_PORT" 2>/dev/null
    if [ $? -eq 124 ]; then
        echo -e "${RED}✗ Timeout en conexión WebSocket${NC}"
    fi
else
    echo -e "${YELLOW}⚠ wscat no está instalado (npm install -g wscat)${NC}"
fi

echo -e "\nPara solucionar problemas de conectividad P2P:"
echo "1. Verifica que el puerto 30303 esté abierto en tu firewall"
echo "2. Asegúrate de que el nodo P2P esté corriendo"
echo "3. Revisa la configuración de Nginx"
echo "4. Verifica que no haya conflictos de puerto" 