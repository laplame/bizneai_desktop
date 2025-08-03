# Guía de Instalación y Uso de Luxae Blockchain

## Requisitos del Sistema

### Hardware Mínimo
- CPU: 2 cores
- RAM: 4GB
- Almacenamiento: 50GB SSD
- Conexión a Internet: 10 Mbps

### Hardware Recomendado
- CPU: 4 cores
- RAM: 8GB
- Almacenamiento: 100GB SSD
- Conexión a Internet: 20 Mbps

### Software Requerido
- Node.js v18 o superior
- PM2 (instalación global)
- Nginx
- Git
- pnpm

## Scripts Disponibles

### 1. Instalación Inicial
```bash
# Instalar dependencias globales
npm install -g pm2 pnpm

# Clonar repositorio
git clone https://github.com/tu-usuario/luxae.git
cd luxae

# Instalar dependencias
pnpm install

# Verificar dependencias
./scripts/check-deps.sh
```

### 2. Gestión del Nodo

#### Iniciar Todo el Sistema
```bash
./start-all.sh
```

#### Detener Todo el Sistema
```bash
./stop-all.sh
```

#### Ver Estado del Sistema
```bash
./status.sh
```

#### Reiniciar Solo P2P
```bash
./scripts/restart-p2p.sh
```

### 3. Scripts de Diagnóstico

#### Verificar Red
```bash
./scripts/check-network.sh
```

#### Verificar P2P Específicamente
```bash
./scripts/check-p2p.sh
```

#### Diagnóstico del Dashboard
```bash
cd src/web/luxae-dashboard
./diagnose.sh
```

### 4. Scripts de Mantenimiento

#### Limpiar Datos
```bash
./scripts/clean-data.sh
```

#### Backup
```bash
./scripts/backup.sh
```

#### Restaurar
```bash
./scripts/restore.sh <backup-file>
```

## Estructura de Directorios

```
/data/
  ├── blockchain/    # Datos de la blockchain
  ├── contracts/     # Contratos compilados
  └── backups/       # Backups automáticos
/logs/
  ├── api.log        # Logs de la API
  ├── dashboard.log  # Logs del dashboard
  └── p2p.log        # Logs de P2P
```

## Puertos Utilizados
- 3000: API REST
- 3001: Dashboard Web
- 30303: Comunicación P2P

## Monitoreo

### Ver Logs en Tiempo Real
```bash
# Todos los logs
pm2 logs

# Logs específicos
pm2 logs luxae-api
pm2 logs luxae-dashboard
```

### Monitoreo de Recursos
```bash
pm2 monit
```

### Estado de los Servicios
```bash
pm2 list
```

## Solución de Problemas

### Verificar Conectividad
```bash
# Verificar todos los servicios
./scripts/check-network.sh

# Verificar solo P2P
./scripts/check-p2p.sh
```

### Reiniciar Servicios
```bash
# Reiniciar todo
./restart-all.sh

# Reiniciar servicio específico
pm2 restart luxae-api
pm2 restart luxae-dashboard
```

### Limpiar y Reiniciar
```bash
# Detener servicios
./stop-all.sh

# Limpiar datos
./scripts/clean-data.sh

# Reiniciar todo
./start-all.sh
```

## Mantenimiento

### Backup Automático
Los backups se realizan diariamente a las 00:00 en `/data/backups/`

### Limpieza de Logs
Los logs se rotan automáticamente cada 7 días

### Actualización
```bash
# Actualizar código
git pull

# Actualizar dependencias
pnpm install

# Reiniciar servicios
./restart-all.sh
```

## Notas Importantes
1. Asegúrate de tener suficiente espacio en disco
2. Mantén los puertos requeridos abiertos en el firewall
3. Configura correctamente los límites del sistema (ulimit)
4. Realiza backups regulares
5. Monitorea el uso de recursos

## Soporte
- GitHub Issues: [enlace]
- Documentación: [enlace]
- Canal de Discord: [enlace] 