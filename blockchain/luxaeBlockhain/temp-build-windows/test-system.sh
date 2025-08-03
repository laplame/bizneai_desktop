#!/bin/bash

echo "🧪 Probando Sistema Luxae Blockchain v2..."
echo "=========================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar resultados
show_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Función para mostrar información
show_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Función para mostrar advertencia
show_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo ""
show_info "Verificando servicios..."

# 1. Verificar API v2
echo -n "Probando API v2 (puerto 3001)... "
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    show_result 0 "API v2 funcionando"
else
    show_result 1 "API v2 no responde"
fi

# 2. Verificar Frontend
echo -n "Probando Frontend (puerto 5173)... "
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    show_result 0 "Frontend funcionando"
else
    show_result 1 "Frontend no responde"
fi

# 3. Verificar endpoints de la API
echo ""
show_info "Probando endpoints de la API..."

# Blockchain info
echo -n "GET /api/v2/blockchain... "
if curl -s http://localhost:3001/api/v2/blockchain > /dev/null 2>&1; then
    show_result 0 "OK"
else
    show_result 1 "Error"
fi

# Network status
echo -n "GET /api/v2/network/status... "
if curl -s http://localhost:3001/api/v2/network/status > /dev/null 2>&1; then
    show_result 0 "OK"
else
    show_result 1 "Error"
fi

# System status
echo -n "GET /api/v2/status... "
if curl -s http://localhost:3001/api/v2/status > /dev/null 2>&1; then
    show_result 0 "OK"
else
    show_result 1 "Error"
fi

# 4. Verificar documentación
echo -n "GET /api-docs... "
if curl -s http://localhost:3001/api-docs > /dev/null 2>&1; then
    show_result 0 "Documentación disponible"
else
    show_result 1 "Documentación no disponible"
fi

echo ""
show_info "Información del sistema:"

# Mostrar información de la blockchain
echo -n "Información de la blockchain: "
BLOCKCHAIN_INFO=$(curl -s http://localhost:3001/api/v2/blockchain 2>/dev/null)
if [ $? -eq 0 ]; then
    TOTAL_BLOCKS=$(echo $BLOCKCHAIN_INFO | grep -o '"totalBlocks":[0-9]*' | cut -d':' -f2)
    CONSENSUS=$(echo $BLOCKCHAIN_INFO | grep -o '"consensus":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}${TOTAL_BLOCKS} bloques, consenso: ${CONSENSUS}${NC}"
else
    echo -e "${RED}No disponible${NC}"
fi

# Mostrar información de la red
echo -n "Estado de la red: "
NETWORK_INFO=$(curl -s http://localhost:3001/api/v2/network/status 2>/dev/null)
if [ $? -eq 0 ]; then
    PEER_COUNT=$(echo $NETWORK_INFO | grep -o '"peerCount":[0-9]*' | cut -d':' -f2)
    IS_CONNECTED=$(echo $NETWORK_INFO | grep -o '"isConnected":[^,]*' | cut -d':' -f2)
    if [ "$IS_CONNECTED" = "true" ]; then
        echo -e "${GREEN}Conectado (${PEER_COUNT} peers)${NC}"
    else
        echo -e "${YELLOW}Desconectado (${PEER_COUNT} peers)${NC}"
    fi
else
    echo -e "${RED}No disponible${NC}"
fi

echo ""
show_info "URLs de acceso:"
echo "🌐 API v2: http://localhost:3001"
echo "📚 Documentación: http://localhost:3001/api-docs"
echo "🏥 Health Check: http://localhost:3001/health"
echo "📱 Frontend: http://localhost:5173"

echo ""
show_info "Prueba completada!"
echo "==========================================" 