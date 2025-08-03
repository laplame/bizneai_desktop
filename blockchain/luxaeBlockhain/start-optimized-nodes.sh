#!/bin/bash

# Script optimizado para 3 nodos por servidor
# Autor: Luxae Team
# Versión: 1.0.0

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuración optimizada de nodos (3 por servidor)
NODES=(
    "main:3000:30303"
    "validator1:3001:30304"
    "validator2:3002:30305"
)

# Función para detener todos los nodos
stop_all_nodes() {
    print_status "Deteniendo todos los nodos..."
    pkill -f "node scripts/start-validator.js" || true
    pkill -f "luxae-node" || true
    sleep 2
    print_success "Todos los nodos detenidos"
}

# Función para iniciar un nodo
start_node() {
    local node_name=$1
    local api_port=$2
    local p2p_port=$3
    
    print_status "Iniciando nodo $node_name (API: $api_port, P2P: $p2p_port)..."
    
    # Crear directorio de logs si no existe
    mkdir -p logs
    
    # Iniciar nodo en background
    API_PORT=$api_port P2P_PORT=$p2p_port node scripts/start-validator.js > "logs/${node_name}.log" 2>&1 &
    
    local pid=$!
    echo $pid > "logs/${node_name}.pid"
    
    # Esperar un poco para que el nodo se inicialice
    sleep 3
    
    # Verificar que el nodo esté funcionando
    if curl -s "http://localhost:$api_port/health" > /dev/null 2>&1; then
        print_success "Nodo $node_name iniciado correctamente (PID: $pid)"
        return 0
    else
        print_error "Error iniciando nodo $node_name"
        return 1
    fi
}

# Función para verificar estado de los nodos
check_nodes_status() {
    print_status "Verificando estado de los nodos optimizados..."
    echo ""
    
    for node_config in "${NODES[@]}"; do
        IFS=':' read -r node_name api_port p2p_port <<< "$node_config"
        
        if [ -f "logs/${node_name}.pid" ]; then
            local pid=$(cat "logs/${node_name}.pid")
            if ps -p $pid > /dev/null 2>&1; then
                if curl -s "http://localhost:$api_port/health" > /dev/null 2>&1; then
                    print_success "✅ $node_name (API:$api_port, P2P:$p2p_port) - Activo"
                else
                    print_warning "⚠️ $node_name (API:$api_port, P2P:$p2p_port) - API no responde"
                fi
            else
                print_error "❌ $node_name (API:$api_port, P2P:$p2p_port) - Proceso no encontrado"
            fi
        else
            print_error "❌ $node_name (API:$api_port, P2P:$p2p_port) - No iniciado"
        fi
    done
    echo ""
}

# Función principal
main() {
    case "${1:-start}" in
        "start")
            print_status "Iniciando red optimizada de 3 nodos..."
            
            # Detener nodos existentes
            stop_all_nodes
            
            # Crear directorio de logs
            mkdir -p logs
            
            # Iniciar nodos
            local success_count=0
            for node_config in "${NODES[@]}"; do
                IFS=':' read -r node_name api_port p2p_port <<< "$node_config"
                
                if start_node "$node_name" "$api_port" "$p2p_port"; then
                    ((success_count++))
                fi
                
                # Esperar entre nodos para evitar conflictos
                sleep 2
            done
            
            print_success "Iniciados $success_count de ${#NODES[@]} nodos optimizados"
            
            # Mostrar estado
            sleep 5
            check_nodes_status
            ;;
            
        "stop")
            stop_all_nodes
            ;;
            
        "status")
            check_nodes_status
            ;;
            
        "restart")
            stop_all_nodes
            sleep 3
            exec "$0" start
            ;;
            
        *)
            echo "Uso: $0 {start|stop|status|restart}"
            echo ""
            echo "Comandos:"
            echo "  start   - Iniciar 3 nodos optimizados"
            echo "  stop    - Detener todos los nodos"
            echo "  status  - Mostrar estado de los nodos"
            echo "  restart - Reiniciar todos los nodos"
            echo ""
            echo "Configuración optimizada:"
            for node_config in "${NODES[@]}"; do
                IFS=':' read -r node_name api_port p2p_port <<< "$node_config"
                echo "  $node_name (API:$api_port, P2P:$p2p_port)"
            done
            exit 1
            ;;
    esac
}

# Manejar señales de interrupción
trap 'print_status "Deteniendo nodos..."; stop_all_nodes; exit 0' INT TERM

# Ejecutar función principal
main "$@" 