#!/bin/bash

echo "=== Iniciando Sistema Luxae ==="

# Verificar que PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "Instalando PM2..."
    npm install -g pm2
fi

# Definir rutas base
BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DATA_DIR="$BASE_DIR/data"
LOG_DIR="$BASE_DIR/logs"

# Crear estructura de directorios
echo "Creando estructura de directorios..."
mkdir -p "$DATA_DIR/blockchain"
mkdir -p "$DATA_DIR/contracts"
mkdir -p "$LOG_DIR"

# Verificar que los puertos necesarios estén libres
echo "Verificando puertos..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:30303 | xargs kill -9 2>/dev/null

# Inicializar blockchain
echo "Inicializando blockchain..."
node "$BASE_DIR/scripts/init-blockchain.js"

if [ $? -eq 0 ]; then
    # Configurar procesos PM2
    echo "Configurando procesos PM2..."
    
    # Detener procesos anteriores si existen
    pm2 delete luxae-api luxae-dashboard 2>/dev/null

    # Iniciar API y Blockchain
    echo "Iniciando nodo validador..."
    pm2 start "$BASE_DIR/scripts/start-validator.js" \
        --name "luxae-api" \
        --time \
        --log "$LOG_DIR/api.log" \
        --merge-logs \
        --env NODE_ENV=production

    # Esperar a que la API esté disponible
    echo "Esperando a que la API esté disponible..."
    max_attempts=60
    attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:3000/health > /dev/null; then
            echo "✓ API está disponible"
            break
        fi
        attempt=$((attempt + 1))
        echo "Intento $attempt de $max_attempts..."
        sleep 2
    done

    if [ $attempt -eq $max_attempts ]; then
        echo "Error: No se pudo conectar a la API"
        exit 1
    fi

    # Iniciar Dashboard
    echo "Iniciando dashboard..."
    cd "$BASE_DIR/src/web/luxae-dashboard"
    
    # Construir el dashboard
    echo "Construyendo dashboard..."
    pnpm build

    # Iniciar el servidor del dashboard con PM2
    pm2 start server.js \
        --name "luxae-dashboard" \
        --time \
        --log "$LOG_DIR/dashboard.log" \
        --merge-logs \
        --env NODE_ENV=production

    # Guardar configuración PM2
    pm2 save

    # Mostrar estado de los procesos
    echo -e "\n=== Estado de los servicios ==="
    pm2 list

    # Mostrar logs en tiempo real
    echo -e "\nMostrando logs en tiempo real (Ctrl+C para salir)..."
    pm2 logs
else
    echo "Error: La inicialización de la blockchain falló"
    exit 1
fi 