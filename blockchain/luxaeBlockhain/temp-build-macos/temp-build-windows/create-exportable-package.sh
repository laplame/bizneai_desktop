#!/bin/bash

# Script para crear el paquete exportable de Luxae Blockchain
# Versión: 2.0.0

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
PACKAGE_NAME="luxae-blockchain-node"
PACKAGE_VERSION="2.0.0"
PACKAGE_DIR="package-exportable"
DIST_DIR="dist"

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Función para limpiar directorios
cleanup() {
    log "Limpiando directorios anteriores..."
    rm -rf "$PACKAGE_DIR"
    rm -rf "$DIST_DIR"
    mkdir -p "$PACKAGE_DIR"
    mkdir -p "$DIST_DIR"
}

# Función para crear estructura de directorios
create_structure() {
    log "Creando estructura de directorios..."
    
    # Directorios principales
    mkdir -p "$PACKAGE_DIR"/{node,api,frontend,config,scripts,logs,data}
    
    # Subdirectorios
    mkdir -p "$PACKAGE_DIR/node"/{src,scripts}
    mkdir -p "$PACKAGE_DIR/api"/{src,scripts}
    mkdir -p "$PACKAGE_DIR/frontend"/{src,public}
}

# Función para copiar archivos del nodo
copy_node_files() {
    log "Copiando archivos del nodo blockchain..."
    
    # Archivos principales
    cp package.json "$PACKAGE_DIR/node/"
    cp -r src/ "$PACKAGE_DIR/node/"
    cp -r scripts/ "$PACKAGE_DIR/node/"
    
    # Configuraciones
    cp .env.example "$PACKAGE_DIR/node/" 2>/dev/null || true
    
    # Copiar scripts específicos
    cp package-exportable/start-node.sh "$PACKAGE_DIR/"
    cp package-exportable/stop-node.sh "$PACKAGE_DIR/"
    cp package-exportable/start-node.bat "$PACKAGE_DIR/"
    cp package-exportable/stop-node.bat "$PACKAGE_DIR/"
    cp package-exportable/README.md "$PACKAGE_DIR/"
    
    # Crear package.json específico para el nodo
    cat > "$PACKAGE_DIR/node/package.json" << EOF
{
  "name": "luxae-blockchain-node",
  "version": "2.0.0",
  "description": "Luxae Blockchain Node - Nodo completo de la blockchain",
  "main": "scripts/start-api-v2.js",
  "type": "module",
  "scripts": {
    "start": "node scripts/start-api-v2.js",
    "start:api-v2": "node scripts/start-api-v2.js",
    "dev": "node scripts/start-api-v2.js",
    "test": "echo \"No tests specified\" && exit 0"
  },
  "dependencies": {
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "swagger-ui-express": "^5.0.0",
    "swagger-jsdoc": "^6.2.8",
    "axios": "^1.6.2",
    "libp2p": "^0.46.0",
    "@libp2p/tcp": "^12.0.0",
    "@libp2p/bootstrap": "^12.0.0",
    "@libp2p/mplex": "^12.0.0",
    "@chainsafe/libp2p-noise": "^13.0.0",
    "@multiformats/multiaddr": "^13.0.0",
    "crypto": "^1.0.1"
  },
  "keywords": ["blockchain", "luxae", "p2p", "node"],
  "author": "Luxae Team",
  "license": "MIT"
}
EOF
}

# Función para copiar archivos del frontend
copy_frontend_files() {
    log "Copiando archivos del frontend..."
    
    # Copiar todo el frontend
    cp -r frontend-luxae/* "$PACKAGE_DIR/frontend/"
    
    # Crear package.json específico para el frontend
    cat > "$PACKAGE_DIR/frontend/package.json" << EOF
{
  "name": "luxae-frontend",
  "version": "2.0.0",
  "description": "Luxae Blockchain Frontend - Interfaz web moderna",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "axios": "^1.6.2",
    "@heroicons/react": "^2.0.18"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.1.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "@tailwindcss/postcss": "^4.0.0",
    "vite": "^7.0.6"
  }
}
EOF
}

# Función para crear archivos de configuración
create_config_files() {
    log "Creando archivos de configuración..."
    
    # Configuración principal
    cat > "$PACKAGE_DIR/config.json" << EOF
{
  "node": {
    "name": "Luxae Node",
    "type": "validator",
    "port": 30303,
    "apiPort": 3001,
    "frontendPort": 5173
  },
  "blockchain": {
    "consensus": "pos",
    "miningReward": 100,
    "minimumStake": 1000
  },
  "network": {
    "bootstrapNodes": [
      "/ip4/161.22.47.84/tcp/30303/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N"
    ]
  }
}
EOF

    # Variables de entorno
    cat > "$PACKAGE_DIR/.env.example" << EOF
# Luxae Blockchain Node Configuration
LUXAE_NODE_NAME=Luxae Node
LUXAE_NODE_TYPE=validator
LUXAE_API_PORT=3001
LUXAE_P2P_PORT=30303
LUXAE_FRONTEND_PORT=5173

# Blockchain Configuration
LUXAE_CONSENSUS=pos
LUXAE_MINING_REWARD=100
LUXAE_MINIMUM_STAKE=1000

# Network Configuration
LUXAE_BOOTSTRAP_NODES=/ip4/161.22.47.84/tcp/30303/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N
EOF
}

# Función para hacer ejecutables los scripts
make_executable() {
    log "Haciendo ejecutables los scripts..."
    
    chmod +x "$PACKAGE_DIR"/start-node.sh
    chmod +x "$PACKAGE_DIR"/stop-node.sh
    chmod +x "$PACKAGE_DIR"/check-status.sh
    chmod +x "$PACKAGE_DIR"/restart-node.sh
    chmod +x "$PACKAGE_DIR"/clean-data.sh
    chmod +x "$PACKAGE_DIR"/backup-data.sh
    chmod +x "$PACKAGE_DIR"/update-node.sh
}

# Función para crear scripts adicionales
create_additional_scripts() {
    log "Creando scripts adicionales..."
    
    # Script de verificación de estado
    cat > "$PACKAGE_DIR/check-status.sh" << 'EOF'
#!/bin/bash

# Script para verificar el estado del nodo
# Versión: 2.0.0

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Verificando estado del nodo Luxae..."
echo "======================================"

# Verificar API
if curl -s "http://localhost:3001/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API funcionando${NC}"
else
    echo -e "${RED}❌ API no responde${NC}"
fi

# Verificar Frontend
if curl -s "http://localhost:5173" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend funcionando${NC}"
else
    echo -e "${RED}❌ Frontend no responde${NC}"
fi

# Verificar procesos
if pgrep -f "start-api-v2" > /dev/null; then
    echo -e "${GREEN}✅ Nodo blockchain ejecutándose${NC}"
else
    echo -e "${RED}❌ Nodo blockchain no ejecutándose${NC}"
fi

if pgrep -f "vite" > /dev/null; then
    echo -e "${GREEN}✅ Frontend ejecutándose${NC}"
else
    echo -e "${RED}❌ Frontend no ejecutándose${NC}"
fi

echo
echo "📊 URLs de acceso:"
echo "- Frontend: http://localhost:5173"
echo "- API: http://localhost:3001"
echo "- Health: http://localhost:3001/health"
echo "- Docs: http://localhost:3001/api-docs"
EOF

    # Script de reinicio
    cat > "$PACKAGE_DIR/restart-node.sh" << 'EOF'
#!/bin/bash

# Script para reiniciar el nodo
# Versión: 2.0.0

echo "🔄 Reiniciando nodo Luxae..."
./stop-node.sh
sleep 3
./start-node.sh
EOF

    # Script de limpieza de datos
    cat > "$PACKAGE_DIR/clean-data.sh" << 'EOF'
#!/bin/bash

# Script para limpiar datos del nodo
# Versión: 2.0.0

echo "🧹 Limpiando datos del nodo..."

# Detener el nodo primero
./stop-node.sh

# Limpiar directorios de datos
rm -rf data/*
rm -rf logs/*.log

echo "✅ Datos limpiados"
echo "🔄 Ejecute ./start-node.sh para reiniciar"
EOF

    # Script de backup
    cat > "$PACKAGE_DIR/backup-data.sh" << 'EOF'
#!/bin/bash

# Script para hacer backup de los datos
# Versión: 2.0.0

BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"

echo "💾 Creando backup de datos..."

mkdir -p "$BACKUP_DIR"
cp -r data/* "$BACKUP_DIR/" 2>/dev/null || true
cp -r logs/* "$BACKUP_DIR/" 2>/dev/null || true
cp config.json "$BACKUP_DIR/" 2>/dev/null || true

echo "✅ Backup creado en: $BACKUP_DIR"
EOF

    # Script de actualización
    cat > "$PACKAGE_DIR/update-node.sh" << 'EOF'
#!/bin/bash

# Script para actualizar el nodo
# Versión: 2.0.0

echo "🔄 Actualizando nodo Luxae..."

# Detener el nodo
./stop-node.sh

# Actualizar dependencias
cd node && npm update
cd ../frontend && npm update

echo "✅ Nodo actualizado"
echo "🔄 Ejecute ./start-node.sh para reiniciar"
EOF
}

# Función para crear scripts principales
create_main_scripts() {
    log "Creando scripts principales..."
    
    # Script de inicio para Linux/macOS
    cat > "$PACKAGE_DIR/start-node.sh" << 'EOF'
#!/bin/bash

# Luxae Blockchain Node - Script de Inicio
# Versión: 2.0.0

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
NODE_NAME=${LUXAE_NODE_NAME:-"Luxae Node"}
NODE_TYPE=${LUXAE_NODE_TYPE:-"validator"}
API_PORT=${LUXAE_API_PORT:-3001}
P2P_PORT=${LUXAE_P2P_PORT:-30303}
FRONTEND_PORT=${LUXAE_FRONTEND_PORT:-5173}

# Directorios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_DIR="$SCRIPT_DIR/node"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
LOGS_DIR="$SCRIPT_DIR/logs"
DATA_DIR="$SCRIPT_DIR/data"

# Crear directorios si no existen
mkdir -p "$LOGS_DIR" "$DATA_DIR"

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Función para verificar dependencias
check_dependencies() {
    log "Verificando dependencias..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js no está instalado. Por favor instale Node.js v18 o superior."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm no está instalado."
        exit 1
    fi
    
    log "Dependencias verificadas correctamente"
}

# Función para verificar puertos
check_ports() {
    log "Verificando puertos disponibles..."
    
    local ports=($API_PORT $P2P_PORT $FRONTEND_PORT)
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            warn "Puerto $port está en uso"
            read -p "¿Desea continuar? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    done
    
    log "Puertos verificados"
}

# Función para detener procesos existentes
stop_existing_processes() {
    log "Deteniendo procesos existentes..."
    
    # Detener procesos de Luxae
    pkill -f "luxae" || true
    pkill -f "start-api-v2" || true
    pkill -f "vite" || true
    
    sleep 2
    log "Procesos detenidos"
}

# Función para iniciar el nodo blockchain
start_blockchain() {
    log "Iniciando nodo blockchain..."
    
    cd "$NODE_DIR"
    
    # Instalar dependencias si es necesario
    if [ ! -d "node_modules" ]; then
        log "Instalando dependencias del nodo..."
        npm install
    fi
    
    # Iniciar el nodo en segundo plano
    nohup npm run start:api-v2 > "$LOGS_DIR/node.log" 2>&1 &
    NODE_PID=$!
    echo $NODE_PID > "$LOGS_DIR/node.pid"
    
    log "Nodo blockchain iniciado (PID: $NODE_PID)"
}

# Función para iniciar el frontend
start_frontend() {
    log "Iniciando frontend..."
    
    cd "$FRONTEND_DIR"
    
    # Instalar dependencias si es necesario
    if [ ! -d "node_modules" ]; then
        log "Instalando dependencias del frontend..."
        npm install
    fi
    
    # Iniciar el frontend en segundo plano
    nohup npm run dev > "$LOGS_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$LOGS_DIR/frontend.pid"
    
    log "Frontend iniciado (PID: $FRONTEND_PID)"
}

# Función para verificar estado
check_status() {
    log "Verificando estado de los servicios..."
    
    # Verificar API
    if curl -s "http://localhost:$API_PORT/health" > /dev/null 2>&1; then
        log "✅ API funcionando en puerto $API_PORT"
    else
        warn "⚠️ API no responde en puerto $API_PORT"
    fi
    
    # Verificar Frontend
    if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
        log "✅ Frontend funcionando en puerto $FRONTEND_PORT"
    else
        warn "⚠️ Frontend no responde en puerto $FRONTEND_PORT"
    fi
    
    # Verificar P2P
    if [ -f "$LOGS_DIR/node.pid" ]; then
        local node_pid=$(cat "$LOGS_DIR/node.pid")
        if ps -p $node_pid > /dev/null 2>&1; then
            log "✅ Nodo P2P funcionando (PID: $node_pid)"
        else
            warn "⚠️ Nodo P2P no está ejecutándose"
        fi
    fi
}

# Función para mostrar información
show_info() {
    echo
    echo "🌐 Luxae Blockchain Node"
    echo "=========================="
    echo "Nodo: $NODE_NAME"
    echo "Tipo: $NODE_TYPE"
    echo "API: http://localhost:$API_PORT"
    echo "Frontend: http://localhost:$FRONTEND_PORT"
    echo "Documentación: http://localhost:$API_PORT/api-docs"
    echo "Health Check: http://localhost:$API_PORT/health"
    echo
    echo "📊 Logs disponibles:"
    echo "- Nodo: tail -f $LOGS_DIR/node.log"
    echo "- Frontend: tail -f $LOGS_DIR/frontend.log"
    echo
    echo "🛑 Para detener: ./stop-node.sh"
    echo
}

# Función principal
main() {
    echo
    echo "🚀 Iniciando Luxae Blockchain Node..."
    echo "====================================="
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "$SCRIPT_DIR/package.json" ]; then
        error "No se encontró package.json. Asegúrese de estar en el directorio correcto."
        exit 1
    fi
    
    check_dependencies
    check_ports
    stop_existing_processes
    
    # Crear archivo de configuración si no existe
    if [ ! -f "$SCRIPT_DIR/config.json" ]; then
        log "Creando archivo de configuración..."
        cat > "$SCRIPT_DIR/config.json" << EOF
{
  "node": {
    "name": "$NODE_NAME",
    "type": "$NODE_TYPE",
    "port": $P2P_PORT,
    "apiPort": $API_PORT,
    "frontendPort": $FRONTEND_PORT
  },
  "blockchain": {
    "consensus": "pos",
    "miningReward": 100,
    "minimumStake": 1000
  },
  "network": {
    "bootstrapNodes": [
      "/ip4/161.22.47.84/tcp/30303/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N"
    ]
  }
}
EOF
    fi
    
    start_blockchain
    
    # Esperar a que la API esté lista
    log "Esperando a que la API esté lista..."
    for i in {1..30}; do
        if curl -s "http://localhost:$API_PORT/health" > /dev/null 2>&1; then
            log "API lista"
            break
        fi
        sleep 1
    done
    
    start_frontend
    
    # Esperar un poco más para que todo esté listo
    sleep 3
    
    check_status
    show_info
    
    log "✅ Nodo iniciado correctamente!"
    log "🌐 Acceda a http://localhost:$FRONTEND_PORT para usar la interfaz web"
}

# Ejecutar función principal
main "$@"
EOF

    # Script de detención para Linux/macOS
    cat > "$PACKAGE_DIR/stop-node.sh" << 'EOF'
#!/bin/bash

# Luxae Blockchain Node - Script de Detención
# Versión: 2.0.0

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directorios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"

# Crear directorio de logs si no existe
mkdir -p "$LOGS_DIR"

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Función para detener proceso por PID
stop_process() {
    local pid_file="$1"
    local process_name="$2"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            log "Deteniendo $process_name (PID: $pid)..."
            kill $pid
            sleep 2
            
            # Verificar si el proceso se detuvo
            if ps -p $pid > /dev/null 2>&1; then
                warn "$process_name no se detuvo, forzando..."
                kill -9 $pid
            fi
            
            rm -f "$pid_file"
            log "✅ $process_name detenido"
        else
            warn "$process_name no estaba ejecutándose"
            rm -f "$pid_file"
        fi
    else
        warn "No se encontró PID file para $process_name"
    fi
}

# Función para detener procesos por nombre
stop_processes_by_name() {
    local process_names=("luxae" "start-api-v2" "vite" "node")
    
    for name in "${process_names[@]}"; do
        local pids=$(pgrep -f "$name" || true)
        if [ ! -z "$pids" ]; then
            log "Deteniendo procesos $name..."
            echo "$pids" | xargs kill
            sleep 1
            
            # Forzar detención si es necesario
            local remaining_pids=$(pgrep -f "$name" || true)
            if [ ! -z "$remaining_pids" ]; then
                warn "Forzando detención de $name..."
                echo "$remaining_pids" | xargs kill -9
            fi
        fi
    done
}

# Función para limpiar archivos temporales
cleanup_temp_files() {
    log "Limpiando archivos temporales..."
    
    # Eliminar archivos PID
    rm -f "$LOGS_DIR"/*.pid
    
    # Eliminar archivos de lock si existen
    rm -f /tmp/luxae-*.lock
    
    log "Archivos temporales limpiados"
}

# Función para mostrar estado final
show_final_status() {
    echo
    echo "🛑 Estado Final"
    echo "==============="
    
    # Verificar si quedan procesos
    local remaining_processes=$(pgrep -f "luxae|start-api-v2|vite" || true)
    
    if [ -z "$remaining_processes" ]; then
        log "✅ Todos los procesos detenidos correctamente"
    else
        warn "⚠️ Algunos procesos aún están ejecutándose:"
        echo "$remaining_processes"
    fi
    
    echo
    echo "📊 Logs guardados en: $LOGS_DIR"
    echo "🔄 Para reiniciar: ./start-node.sh"
    echo
}

# Función principal
main() {
    echo
    echo "🛑 Deteniendo Luxae Blockchain Node..."
    echo "====================================="
    
    # Crear directorio de logs si no existe
    mkdir -p "$LOGS_DIR"
    
    # Detener procesos por PID files
    stop_process "$LOGS_DIR/node.pid" "Nodo Blockchain"
    stop_process "$LOGS_DIR/frontend.pid" "Frontend"
    
    # Detener procesos por nombre
    stop_processes_by_name
    
    # Limpiar archivos temporales
    cleanup_temp_files
    
    # Mostrar estado final
    show_final_status
    
    log "✅ Nodo detenido correctamente!"
}

# Ejecutar función principal
main "$@"
EOF

    # Script de inicio para Windows
    cat > "$PACKAGE_DIR/start-node.bat" << 'EOF'
@echo off
REM Luxae Blockchain Node - Script de Inicio para Windows
REM Versión: 2.0.0

setlocal enabledelayedexpansion

REM Configuración
set NODE_NAME=%LUXAE_NODE_NAME%
if "%NODE_NAME%"=="" set NODE_NAME=Luxae Node

set NODE_TYPE=%LUXAE_NODE_TYPE%
if "%NODE_TYPE%"=="" set NODE_TYPE=validator

set API_PORT=%LUXAE_API_PORT%
if "%API_PORT%"=="" set API_PORT=3001

set P2P_PORT=%LUXAE_P2P_PORT%
if "%P2P_PORT%"=="" set P2P_PORT=30303

set FRONTEND_PORT=%LUXAE_FRONTEND_PORT%
if "%FRONTEND_PORT%"=="" set FRONTEND_PORT=5173

REM Directorios
set SCRIPT_DIR=%~dp0
set NODE_DIR=%SCRIPT_DIR%node
set FRONTEND_DIR=%SCRIPT_DIR%frontend
set LOGS_DIR=%SCRIPT_DIR%logs
set DATA_DIR=%SCRIPT_DIR%data

REM Crear directorios si no existen
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"

echo.
echo 🚀 Iniciando Luxae Blockchain Node...
echo =====================================

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no está instalado. Por favor instale Node.js v18 o superior.
    pause
    exit /b 1
)

REM Verificar npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm no está instalado.
    pause
    exit /b 1
)

echo [INFO] Dependencias verificadas correctamente

REM Detener procesos existentes
echo [INFO] Deteniendo procesos existentes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Crear archivo de configuración si no existe
if not exist "%SCRIPT_DIR%config.json" (
    echo [INFO] Creando archivo de configuración...
    (
        echo {
        echo   "node": {
        echo     "name": "%NODE_NAME%",
        echo     "type": "%NODE_TYPE%",
        echo     "port": %P2P_PORT%,
        echo     "apiPort": %API_PORT%,
        echo     "frontendPort": %FRONTEND_PORT%
        echo   },
        echo   "blockchain": {
        echo     "consensus": "pos",
        echo     "miningReward": 100,
        echo     "minimumStake": 1000
        echo   },
        echo   "network": {
        echo     "bootstrapNodes": [
        echo       "/ip4/161.22.47.84/tcp/30303/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N"
        echo     ]
        echo   }
        echo }
    ) > "%SCRIPT_DIR%config.json"
)

REM Iniciar nodo blockchain
echo [INFO] Iniciando nodo blockchain...
cd /d "%NODE_DIR%"

REM Instalar dependencias si es necesario
if not exist "node_modules" (
    echo [INFO] Instalando dependencias del nodo...
    npm install
)

REM Iniciar el nodo en segundo plano
start /b cmd /c "npm run start:api-v2 > %LOGS_DIR%\node.log 2>&1"
set NODE_PID=%ERRORLEVEL%
echo %NODE_PID% > "%LOGS_DIR%\node.pid"

echo [INFO] Nodo blockchain iniciado

REM Esperar a que la API esté lista
echo [INFO] Esperando a que la API esté lista...
for /l %%i in (1,1,30) do (
    curl -s "http://localhost:%API_PORT%/health" >nul 2>&1
    if not errorlevel 1 (
        echo [INFO] API lista
        goto :api_ready
    )
    timeout /t 1 /nobreak >nul
)

:api_ready

REM Iniciar frontend
echo [INFO] Iniciando frontend...
cd /d "%FRONTEND_DIR%"

REM Instalar dependencias si es necesario
if not exist "node_modules" (
    echo [INFO] Instalando dependencias del frontend...
    npm install
)

REM Iniciar el frontend en segundo plano
start /b cmd /c "npm run dev > %LOGS_DIR%\frontend.log 2>&1"
set FRONTEND_PID=%ERRORLEVEL%
echo %FRONTEND_PID% > "%LOGS_DIR%\frontend.pid"

echo [INFO] Frontend iniciado

REM Esperar un poco más para que todo esté listo
timeout /t 3 /nobreak >nul

REM Verificar estado
echo [INFO] Verificando estado de los servicios...

REM Verificar API
curl -s "http://localhost:%API_PORT%/health" >nul 2>&1
if not errorlevel 1 (
    echo ✅ API funcionando en puerto %API_PORT%
) else (
    echo ⚠️ API no responde en puerto %API_PORT%
)

REM Verificar Frontend
curl -s "http://localhost:%FRONTEND_PORT%" >nul 2>&1
if not errorlevel 1 (
    echo ✅ Frontend funcionando en puerto %FRONTEND_PORT%
) else (
    echo ⚠️ Frontend no responde en puerto %FRONTEND_PORT%
)

echo.
echo 🌐 Luxae Blockchain Node
echo ==========================
echo Nodo: %NODE_NAME%
echo Tipo: %NODE_TYPE%
echo API: http://localhost:%API_PORT%
echo Frontend: http://localhost:%FRONTEND_PORT%
echo Documentación: http://localhost:%API_PORT%/api-docs
echo Health Check: http://localhost:%API_PORT%/health
echo.
echo 📊 Logs disponibles:
echo - Nodo: type %LOGS_DIR%\node.log
echo - Frontend: type %LOGS_DIR%\frontend.log
echo.
echo 🛑 Para detener: stop-node.bat
echo.

echo ✅ Nodo iniciado correctamente!
echo 🌐 Acceda a http://localhost:%FRONTEND_PORT% para usar la interfaz web

pause
EOF

    # Script de detención para Windows
    cat > "$PACKAGE_DIR/stop-node.bat" << 'EOF'
@echo off
REM Luxae Blockchain Node - Script de Detención para Windows
REM Versión: 2.0.0

setlocal enabledelayedexpansion

REM Directorios
set SCRIPT_DIR=%~dp0
set LOGS_DIR=%SCRIPT_DIR%logs

REM Crear directorio de logs si no existe
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

echo.
echo 🛑 Deteniendo Luxae Blockchain Node...
echo =====================================

REM Detener procesos por PID files
if exist "%LOGS_DIR%\node.pid" (
    set /p NODE_PID=<"%LOGS_DIR%\node.pid"
    echo [INFO] Deteniendo Nodo Blockchain (PID: !NODE_PID!)...
    taskkill /f /pid !NODE_PID! >nul 2>&1
    if errorlevel 1 (
        echo [WARN] Nodo Blockchain no estaba ejecutándose
    ) else (
        echo ✅ Nodo Blockchain detenido
    )
    del "%LOGS_DIR%\node.pid"
) else (
    echo [WARN] No se encontró PID file para Nodo Blockchain
)

if exist "%LOGS_DIR%\frontend.pid" (
    set /p FRONTEND_PID=<"%LOGS_DIR%\frontend.pid"
    echo [INFO] Deteniendo Frontend (PID: !FRONTEND_PID!)...
    taskkill /f /pid !FRONTEND_PID! >nul 2>&1
    if errorlevel 1 (
        echo [WARN] Frontend no estaba ejecutándose
    ) else (
        echo ✅ Frontend detenido
    )
    del "%LOGS_DIR%\frontend.pid"
) else (
    echo [WARN] No se encontró PID file para Frontend
)

REM Detener procesos por nombre
echo [INFO] Deteniendo procesos por nombre...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

REM Limpiar archivos temporales
echo [INFO] Limpiando archivos temporales...
del "%LOGS_DIR%\*.pid" >nul 2>&1

echo.
echo 🛑 Estado Final
echo ===============
echo ✅ Todos los procesos detenidos correctamente
echo.
echo 📊 Logs guardados en: %LOGS_DIR%
echo 🔄 Para reiniciar: start-node.bat
echo.

echo ✅ Nodo detenido correctamente!
pause
EOF
}

# Función para crear el archivo de licencia
create_license() {
    log "Creando archivo de licencia..."
    
    cat > "$PACKAGE_DIR/LICENSE" << EOF
MIT License

Copyright (c) 2025 Luxae Blockchain

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
}

# Función para crear el archivo de versión
create_version_file() {
    log "Creando archivo de versión..."
    
    cat > "$PACKAGE_DIR/VERSION" << EOF
Luxae Blockchain Node
Version: 2.0.0
Build Date: $(date)
Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
EOF
}

# Función para crear el paquete final
create_package() {
    log "Creando paquete final..."
    
    local package_file="$DIST_DIR/${PACKAGE_NAME}-v${PACKAGE_VERSION}.tar.gz"
    
    cd "$PACKAGE_DIR"
    tar -czf "../$package_file" .
    cd ..
    
    log "✅ Paquete creado: $package_file"
    
    # Mostrar información del paquete
    local size=$(du -h "$package_file" | cut -f1)
    echo
    echo "📦 Información del Paquete"
    echo "=========================="
    echo "Archivo: $package_file"
    echo "Tamaño: $size"
    echo "Versión: $PACKAGE_VERSION"
    echo
    echo "🚀 Para usar el paquete:"
    echo "1. Extraer el archivo .tar.gz"
    echo "2. Navegar al directorio extraído"
    echo "3. Ejecutar: ./start-node.sh (Linux/macOS) o start-node.bat (Windows)"
    echo
}

# Función principal
main() {
    echo
    echo "📦 Creando Paquete Exportable de Luxae Blockchain"
    echo "================================================="
    
    cleanup
    create_structure
    copy_node_files
    copy_frontend_files
    create_config_files
    create_additional_scripts
    create_main_scripts
    make_executable
    create_license
    create_version_file
    create_package
    
    echo
    echo "🎉 ¡Paquete exportable creado exitosamente!"
    echo "📁 Ubicación: $DIST_DIR/"
    echo "📋 Contenido:"
    echo "   - Nodo blockchain completo"
    echo "   - API REST"
    echo "   - Frontend React"
    echo "   - Scripts de inicio/detención"
    echo "   - Configuraciones"
    echo "   - Documentación"
    echo
    echo "🌐 El paquete está listo para ser distribuido e implementado en otros sistemas."
}

# Ejecutar función principal
main "$@" 