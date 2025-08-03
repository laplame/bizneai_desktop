# Resumen del Codebase - Luxae Blockchain

## 📋 Descripción General

**Luxae** es una blockchain Proof of Stake (PoS) completa con un token nativo ERC-777 compatible. El proyecto implementa una red descentralizada con consenso PoS, red P2P, API REST moderna, dashboard web y smart contracts.

## 🏗️ Arquitectura del Sistema

### Estructura Principal
```
luxaeBlockchain/
├── src/                    # Código fuente principal
│   ├── blockchain/         # Lógica de blockchain
│   ├── consensus/          # Algoritmos de consenso
│   ├── p2p/               # Red P2P
│   ├── api/               # API REST (legacy)
│   ├── api/v2/            # 🆕 API REST moderna
│   ├── web/               # Dashboard web (legacy)
│   ├── contracts/         # Gestión de contratos
│   └── monitoring/        # Monitorización
├── frontend-luxae/         # 🆕 Nuevo Frontend React
├── contracts/             # Smart contracts Solidity
├── scripts/               # Scripts de gestión
├── consensus/             # Implementaciones de consenso
└── docs/                  # Documentación
```

## 🔧 Componentes Principales

### 1. **Blockchain Core** (`src/Blockchain.js`)
- **Funcionalidad**: Implementación principal de la blockchain
- **Características**:
  - Soporte para múltiples algoritmos de consenso (PoW, PoS, PoA)
  - Gestión de bloques y transacciones
  - Sistema de participantes y validadores
  - Validación de cadena
  - Recompensas de minería

### 2. **Algoritmos de Consenso**
- **Proof of Work** (`consensus/proof-of-work.js`)
- **Proof of Stake** (`consensus/proof-of-stake.js`) - **Principal**
- **Proof of Authority** (`consensus/proof-of-authority.js`)

### 3. **Red P2P** (`src/p2p/`)
- **P2P Manager** (`p2p-manager.js`): Gestión de conexiones peer-to-peer
- **Configuración** (`config.js`): Configuración de nodos bootstrap
- **Características**:
  - Sincronización automática de blockchain
  - Broadcast de transacciones y bloques
  - Descubrimiento de peers
  - Comunicación encriptada

### 4. **🆕 API REST v2** (`src/api/v2/`)
- **BlockchainAPI** (`BlockchainAPI.js`): API moderna con Express
- **Características principales**:
  - Middleware de seguridad avanzado (CORS, Helmet, Rate Limiting)
  - Documentación automática con Swagger
  - Integración directa con blockchain y P2P
  - Endpoints RESTful completos
  - Manejo de errores robusto
- **Endpoints principales**:
  - `/api/v2/blockchain` - Información de la blockchain
  - `/api/v2/transactions` - Gestión de transacciones
  - `/api/v2/validators` - Lista de validadores
  - `/api/v2/network` - Estado de la red P2P
  - `/api/v2/status` - Estado del sistema
  - `/health` - Health check
  - `/api-docs` - Documentación Swagger

### 5. **API REST Legacy** (`src/api/`)
- **Servidor Express** con middleware de seguridad
- **Endpoints principales**:
  - `/api/blockchain` - Información de la blockchain
  - `/api/transactions` - Gestión de transacciones
  - `/api/validators` - Lista de validadores
  - `/api/status` - Estado del nodo
  - `/api/contracts` - Gestión de contratos
  - `/api/network` - Información de red

### 6. **Smart Contracts** (`contracts/`)
- **GenesisToken** (`contratoBase.sol`): Token ERC-777 principal
  - Suministro total: 110,000 tokens
  - Distribución: Brand (30k), Influencer (30k), Link4Deal (30k)
  - Recompensas por bloque: 10,000 tokens
  - Sistema de cupones: 5 tokens por uso

### 7. **🆕 Nuevo Frontend React** (`frontend-luxae/`)
- **Tecnologías**: React 18, Vite, Tailwind CSS, React Router
- **Características**:
  - Dashboard en tiempo real con estadísticas
  - Explorador de bloques detallado
  - Navegación responsive y moderna
  - Actualizaciones automáticas cada 30 segundos
  - Integración completa con la API v2
- **Componentes principales**:
  - Navigation: Navegación principal responsive
  - Dashboard: Estadísticas y datos en tiempo real
  - BlockchainPage: Explorador detallado de bloques
  - useBlockchain: Hook personalizado para gestión de estado
- **Puerto**: 5173 (desarrollo)

### 8. **Dashboard Web Legacy** (`src/web/luxae-dashboard/`)
- **Frontend React** con Vite
- **Componentes principales**:
  - Dashboard principal
  - Estado de red y nodos
  - Transacciones en tiempo real
  - Lista de validadores
  - Gestión de contratos
  - Documentación integrada

## 🚀 Scripts de Gestión

### Scripts Principales
- `start-all.sh` - Inicia todo el sistema (legacy)
- `🆕 start-system-v2.sh` - Inicia sistema completo con API v2 y nuevo frontend
- `stop-all.sh` - Detiene todos los servicios
- `status.sh` - Verifica estado de servicios
- `check-network.sh` - Diagnóstico de red
- `🆕 start-frontend.sh` - Inicia el nuevo frontend React

### Scripts Node.js
- `scripts/start-validator.js` - Inicia nodo validador
- `scripts/start-api.js` - Inicia servidor API legacy
- `🆕 scripts/start-api-v2.js` - Inicia servidor API v2 moderna
- `scripts/generate-keys.js` - Genera claves de validador
- `scripts/deploy-genesis.js` - Despliega bloque génesis

## 📊 Especificaciones Técnicas

### Token Luxae (LXA)
- **Nombre**: Luxae
- **Símbolo**: LXA
- **Decimales**: 18
- **Suministro Total**: 1,000,000,000 LXA
- **Estándar**: ERC-777

### Configuración de Red
- **Tiempo de bloque**: 15 segundos
- **Recompensa por bloque**: 0.5 LXA
- **Stake mínimo**: 1,000 LXA
- **Período de bloqueo**: 7 días

### Puertos Utilizados
- **3000**: API Blockchain v2 y P2P
- **3001**: Dashboard Web Legacy
- **🆕 5173**: Nuevo Frontend React
- **30303**: Comunicación P2P entre nodos

## 🔐 Seguridad y Dependencias

### Dependencias Principales
- **Blockchain**: @ethereumjs/* (blockchain, vm, tx, util)
- **P2P**: libp2p, @libp2p/* (tcp, mplex, noise)
- **API Legacy**: express, helmet, cors, rate-limit
- **🆕 API v2**: express, helmet, cors, rate-limit, swagger-jsdoc, swagger-ui-express
- **Smart Contracts**: @openzeppelin/contracts, solc
- **Frontend Legacy**: React, Vite
- **🆕 Nuevo Frontend**: React 18, Vite, Tailwind CSS, React Router, Axios, Heroicons

### Medidas de Seguridad
- Rate limiting en API (1000 requests/15min por IP)
- Helmet para headers de seguridad
- CORS configurado para frontend
- Validación de entrada
- Encriptación P2P con Noise
- **🆕 Middleware de seguridad avanzado en API v2**

## 📈 Monitorización

### Dashboard Features (Nuevo Frontend)
- Estado de red en tiempo real
- Lista de validadores activos
- Transacciones pendientes
- Estadísticas de blockchain
- Información del token
- Logs del sistema
- **🆕 Navegación moderna y responsive**
- **🆕 Actualizaciones automáticas**

### Scripts de Monitorización
- `scripts/check-network.sh` - Diagnóstico completo
- `scripts/check-p2p.sh` - Verificación P2P
- `scripts/check-service.sh` - Estado de servicios

## 🛠️ Deployment

### Configuración Nginx
- Script automático de configuración
- SSL con Certbot
- Proxy reverso para servicios
- Logs centralizados

### Requisitos del Sistema
- Node.js ≥ 16.0.0
- 2GB RAM mínimo
- 50GB espacio en disco
- Conexión a internet estable

## 🔄 Flujo de Trabajo

### Inicio del Sistema (v2)
1. Verificación de puertos
2. Instalación de dependencias
3. Generación de claves (si es necesario)
4. Inicio del nodo blockchain
5. Inicio del servidor P2P
6. **🆕 Inicio de la API v2**
7. **🆕 Construcción y despliegue del nuevo frontend**

### Sincronización P2P
1. Conexión a nodos bootstrap
2. Descubrimiento de peers
3. Sincronización de blockchain
4. Broadcast de transacciones
5. Validación de bloques

## 📝 Estado Actual

### ✅ Implementado
- Blockchain core con múltiples consensos
- Red P2P funcional
- API REST completa (legacy)
- **🆕 API REST v2 moderna**
- Dashboard web reactivo (legacy)
- **🆕 Nuevo frontend React moderno**
- Smart contracts ERC-777
- Sistema de validadores PoS
- Scripts de gestión y monitorización

### 🔄 En Desarrollo
- Optimizaciones de rendimiento
- Mejoras en la UI/UX
- Documentación adicional
- Tests automatizados
- **🆕 Páginas adicionales del nuevo frontend**

## 🎯 Próximos Pasos

1. **Testing**: Implementar suite de tests completa
2. **Optimización**: Mejorar rendimiento de sincronización
3. **Escalabilidad**: Implementar sharding
4. **Interoperabilidad**: Integración con otras blockchains
5. **Governance**: Sistema de gobernanza descentralizada
6. **🆕 Frontend**: Completar páginas de transacciones, validadores y red
7. **🆕 API v2**: WebSocket integration para tiempo real

## 🆕 API v2 - Características Destacadas

### Arquitectura Moderna
- **Express.js** con middleware avanzado
- **Swagger UI** para documentación automática
- **Rate Limiting** configurado
- **CORS** optimizado para frontend
- **Error Handling** robusto

### Integración Blockchain
- **Acceso directo** a la blockchain PoS
- **Broadcast automático** a red P2P
- **Validación de transacciones**
- **Métricas en tiempo real**
- **Health checks** automáticos

### Endpoints Principales
- **GET /api/v2/blockchain** - Información completa
- **GET /api/v2/blockchain/blocks** - Bloques recientes
- **POST /api/v2/transactions** - Crear transacciones
- **GET /api/v2/network/status** - Estado de red
- **GET /api/v2/status** - Estado del sistema

### Ventajas sobre API Legacy
- ✅ **Mejor rendimiento** y escalabilidad
- ✅ **Seguridad mejorada** con middleware moderno
- ✅ **Documentación automática** con Swagger
- ✅ **Manejo de errores** más robusto
- ✅ **Compatibilidad** con frontend moderno
- ✅ **Integración directa** con P2P

---

*Este resumen representa el estado actual del codebase Luxae Blockchain con la nueva API v2 y frontend moderno. Para más detalles, consultar la documentación específica de cada componente.* 