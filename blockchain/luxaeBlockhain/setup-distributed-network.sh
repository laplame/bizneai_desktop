#!/bin/bash

# Script para configurar red distribuida de Luxae Blockchain
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

# Configuración de servidores
SERVERS=(
    "local:127.0.0.1:3000:30303"
    "server1:TU_SERVIDOR_IP:3000:30303"
    "server2:SERVIDOR2_IP:3000:30303"
    "server3:SERVIDOR3_IP:3000:30303"
    "server4:SERVIDOR4_IP:3000:30303"
    "server5:SERVIDOR5_IP:3000:30303"
)

# Función para actualizar configuración P2P
update_p2p_config() {
    local server_name=$1
    local server_ip=$2
    local api_port=$3
    local p2p_port=$4
    
    print_status "Actualizando configuración P2P para $server_name ($server_ip)..."
    
    # Crear archivo de configuración específico para cada servidor
    cat > "config/p2p-$server_name.json" << EOF
{
    "server_name": "$server_name",
    "server_ip": "$server_ip",
    "api_port": $api_port,
    "p2p_port": $p2p_port,
    "bootstrap_nodes": [
        "/ip4/127.0.0.1/tcp/30303/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N",
        "/ip4/$server_ip/tcp/$p2p_port/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N"
    ],
    "network_type": "distributed"
}
EOF
    
    print_success "Configuración P2P actualizada para $server_name"
}

# Función para generar archivo de configuración de red
generate_network_config() {
    print_status "Generando configuración de red distribuida..."
    
    # Crear directorio de configuración
    mkdir -p config
    
    # Generar configuración para cada servidor
    for server_config in "${SERVERS[@]}"; do
        IFS=':' read -r server_name server_ip api_port p2p_port <<< "$server_config"
        update_p2p_config "$server_name" "$server_ip" "$api_port" "$p2p_port"
    done
    
    # Generar archivo de configuración global
    cat > "config/network-global.json" << EOF
{
    "network_name": "Luxae Blockchain Network",
    "network_type": "distributed",
    "total_servers": ${#SERVERS[@]},
    "servers": [
EOF
    
    for server_config in "${SERVERS[@]}"; do
        IFS=':' read -r server_name server_ip api_port p2p_port <<< "$server_config"
        cat >> "config/network-global.json" << EOF
        {
            "name": "$server_name",
            "ip": "$server_ip",
            "api_port": $api_port,
            "p2p_port": $p2p_port,
            "status": "active"
        }$(if [[ "$server_config" != "${SERVERS[-1]}" ]]; then echo ","; fi)
EOF
    done
    
    cat >> "config/network-global.json" << EOF
    ],
    "consensus": {
        "type": "proof_of_stake",
        "min_validators": 3,
        "block_time": 10
    },
    "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
    
    print_success "Configuración de red global generada"
}

# Función para verificar conectividad entre servidores
check_connectivity() {
    print_status "Verificando conectividad entre servidores..."
    
    for server_config in "${SERVERS[@]}"; do
        IFS=':' read -r server_name server_ip api_port p2p_port <<< "$server_config"
        
        if [[ "$server_ip" != "127.0.0.1" ]]; then
            print_status "Verificando $server_name ($server_ip)..."
            
            # Verificar API
            if curl -s --connect-timeout 5 "http://$server_ip:$api_port/health" > /dev/null 2>&1; then
                print_success "✅ $server_name API accesible"
            else
                print_warning "⚠️ $server_name API no accesible"
            fi
            
            # Verificar P2P
            if nc -z -w5 "$server_ip" "$p2p_port" 2>/dev/null; then
                print_success "✅ $server_name P2P accesible"
            else
                print_warning "⚠️ $server_name P2P no accesible"
            fi
        fi
    done
}

# Función para mostrar información de la red
show_network_info() {
    print_status "Información de la red distribuida:"
    echo ""
    
    if [ -f "config/network-global.json" ]; then
        echo "=== Configuración Global ==="
        cat config/network-global.json | jq '.' 2>/dev/null || cat config/network-global.json
        echo ""
    fi
    
    echo "=== Servidores Configurados ==="
    for server_config in "${SERVERS[@]}"; do
        IFS=':' read -r server_name server_ip api_port p2p_port <<< "$server_config"
        echo "🔗 $server_name: $server_ip (API:$api_port, P2P:$p2p_port)"
    done
    echo ""
}

# Función para generar documentación de despliegue
generate_deployment_docs() {
    print_status "Generando documentación de despliegue..."
    
    cat > "DEPLOYMENT_GUIDE.md" << 'EOF'
# 🚀 Guía de Despliegue - Red Distribuida Luxae Blockchain

## 📋 Requisitos por Servidor

### Sistema Operativo
- Ubuntu 20.04 LTS o superior
- 4GB RAM mínimo
- 50GB espacio en disco
- Conexión a internet estable

### Software Requerido
```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Nginx
sudo apt install nginx -y

# PM2
sudo npm install -g pm2

# Herramientas adicionales
sudo apt install git curl wget unzip -y
```

## 🔧 Configuración por Servidor

### 1. Preparar Servidor
```bash
# Crear directorio del proyecto
sudo mkdir -p /var/www/luxae-blockchain
sudo chown $USER:$USER /var/www/luxae-blockchain
cd /var/www/luxae-blockchain

# Clonar repositorio
git clone <tu-repositorio> .

# Instalar dependencias
npm install
```

### 2. Configurar PM2
```bash
# Copiar ecosystem.config.js al servidor
# Ajustar IPs y puertos según el servidor

# Crear directorios de logs
sudo mkdir -p /var/log/luxae
sudo chown $USER:$USER /var/log/luxae
```

### 3. Configurar Nginx
```bash
# Copiar configuración de nginx
sudo cp nginx-config /etc/nginx/sites-available/luxae-blockchain
sudo ln -sf /etc/nginx/sites-available/luxae-blockchain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Configurar Firewall
```bash
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000:3005/tcp  # APIs
sudo ufw allow 30303:30308/tcp  # P2P
sudo ufw enable
```

### 5. Iniciar Nodos
```bash
# Iniciar con PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🌐 Configuración de Red

### Bootstrap Nodes
Cada servidor debe conocer los bootstrap nodes de todos los demás servidores:

```javascript
const bootstrapNodes = [
    '/ip4/SERVIDOR1_IP/tcp/30303/p2p/PEER_ID',
    '/ip4/SERVIDOR2_IP/tcp/30303/p2p/PEER_ID',
    '/ip4/SERVIDOR3_IP/tcp/30303/p2p/PEER_ID',
    // ... más servidores
];
```

### Puertos por Servidor
- **API**: 3000-3005
- **P2P**: 30303-30308
- **WebSocket**: 3000

## 🔍 Verificación

### Comandos de Verificación
```bash
# Verificar estado de nodos
pm2 status

# Verificar APIs
curl http://localhost:3000/health
curl http://localhost:3001/health
# ... etc

# Verificar conectividad P2P
netstat -tlnp | grep :3030

# Ver logs
pm2 logs luxae-main
pm2 logs luxae-validator1
# ... etc
```

### URLs de Acceso
- **API Principal**: https://tu-dominio.com/api/
- **Health Check**: https://tu-dominio.com/health
- **WebSocket**: wss://tu-dominio.com/ws
- **Documentación**: https://tu-dominio.com/api-docs

## 📊 Monitoreo

### Scripts de Monitoreo
```bash
# Estado general
./deploy-scripts.sh status

# Logs específicos
./deploy-scripts.sh logs main

# Monitoreo completo
./deploy-scripts.sh monitor
```

### Métricas Importantes
- Uso de CPU y memoria por nodo
- Latencia de red entre servidores
- Número de peers conectados
- Estado de sincronización de blockchain

## 🔄 Actualizaciones

### Actualizar Código
```bash
# En cada servidor
git pull origin main
npm install
pm2 restart all
```

### Agregar Nuevo Servidor
1. Configurar nuevo servidor según esta guía
2. Actualizar bootstrap nodes en todos los servidores
3. Reiniciar todos los nodos
4. Verificar conectividad

## 🚨 Troubleshooting

### Problemas Comunes
1. **Nodos no se conectan**: Verificar firewalls y puertos
2. **API no responde**: Verificar PM2 y logs
3. **P2P no funciona**: Verificar configuración de bootstrap nodes
4. **Alta latencia**: Optimizar configuración de red

### Logs Importantes
- `/var/log/luxae/*.log` - Logs de aplicación
- `/var/log/nginx/error.log` - Logs de nginx
- `pm2 logs` - Logs de PM2
EOF
    
    print_success "Documentación de despliegue generada"
}

# Función principal
main() {
    case "${1:-help}" in
        "setup")
            generate_network_config
            generate_deployment_docs
            print_success "Configuración de red distribuida completada"
            ;;
        "check")
            check_connectivity
            ;;
        "info")
            show_network_info
            ;;
        "docs")
            generate_deployment_docs
            ;;
        "help"|*)
            echo "Uso: $0 {setup|check|info|docs|help}"
            echo ""
            echo "Comandos:"
            echo "  setup - Configurar red distribuida"
            echo "  check - Verificar conectividad"
            echo "  info  - Mostrar información de red"
            echo "  docs  - Generar documentación"
            echo "  help  - Mostrar esta ayuda"
            echo ""
            echo "Configuración de servidores:"
            for server_config in "${SERVERS[@]}"; do
                IFS=':' read -r server_name server_ip api_port p2p_port <<< "$server_config"
                echo "  $server_name: $server_ip (API:$api_port, P2P:$p2p_port)"
            done
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@" 