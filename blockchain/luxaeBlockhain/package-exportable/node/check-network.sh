#!/bin/bash

# Colores para la salida
if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    NC=''
fi

# Detectar sistema operativo
echo "=== Diagnóstico de Red Luxae ==="
echo "Sistema Operativo: $OSTYPE"

# Función para verificar disponibilidad
check_endpoint() {
    local url=$1
    local name=$2
    
    echo -e "\nVerificando $name..."
    
    # Para Windows usar curl si está disponible, sino usar Invoke-WebRequest
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        if command -v curl &> /dev/null; then
            if curl -s -m 5 "$url/health" > /dev/null; then
                echo -e "${GREEN}✓ $name está disponible${NC}"
                return 0
            else
                echo -e "${RED}✗ $name no responde${NC}"
                return 1
            fi
        else
            powershell -Command "try { \
                Invoke-WebRequest -Uri '$url/health' -UseBasicParsing -TimeoutSec 5 | Out-Null; \
                Write-Host '${GREEN}✓ $name está disponible${NC}' \
            } catch { \
                Write-Host '${RED}✗ $name no responde${NC}' \
            }"
        fi
    else
        # Para Mac y Linux usar curl
        if curl -s -m 5 "$url/health" > /dev/null; then
            echo -e "${GREEN}✓ $name está disponible${NC}"
            return 0
        else
            echo -e "${RED}✗ $name no responde${NC}"
            return 1
        fi
    fi
}

# Verificar nodo local
LOCAL_API="http://localhost:3000"
LOCAL_DASHBOARD="http://localhost:3001"
check_endpoint "$LOCAL_API" "API Local"
check_endpoint "$LOCAL_DASHBOARD" "Dashboard Local"

# Verificar nodo remoto
REMOTE_API="http://161.22.47.84/api"
REMOTE_DASHBOARD="http://161.22.47.84"
check_endpoint "$REMOTE_API" "API Remota"
check_endpoint "$REMOTE_DASHBOARD" "Dashboard Remoto"

# Verificar conectividad P2P
echo -e "\nVerificando conectividad P2P..."
if command -v nc &> /dev/null; then
    if nc -zv 161.22.47.84 30303 2>/dev/null; then
        echo -e "${GREEN}✓ Puerto P2P (30303) accesible${NC}"
    else
        echo -e "${RED}✗ Puerto P2P (30303) no accesible${NC}"
    fi
else
    echo -e "${YELLOW}⚠ No se puede verificar el puerto P2P (nc no disponible)${NC}"
fi

# Mostrar información de red
echo -e "\nInformación de Red:"
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    ipconfig | grep "IPv4"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    ifconfig | grep "inet " | grep -v 127.0.0.1
else
    ip addr | grep "inet " | grep -v 127.0.0.1
fi

# Verificar latencia
echo -e "\nVerificando latencia al servidor..."
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    ping -n 4 161.22.47.84
else
    ping -c 4 161.22.47.84
fi 