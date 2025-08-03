# API v2 - Luxae Blockchain

## 🎯 **Descripción General**

La **API v2** es una capa moderna de intermediación entre el frontend y la blockchain P2P de Luxae. Proporciona endpoints RESTful para interactuar con la red blockchain de manera segura y eficiente.

## 🏗️ **Arquitectura**

### **Flujo de Datos**
```
Frontend (React) ←→ API v2 (Express) ←→ Blockchain (PoS) ←→ P2P Network
```

### **Componentes Principales**

1. **BlockchainAPI** (`src/api/v2/BlockchainAPI.js`)
   - Servidor Express con middleware de seguridad
   - Integración directa con la blockchain PoS
   - Comunicación con la red P2P
   - Documentación automática con Swagger

2. **Endpoints RESTful**
   - `/api/v2/blockchain` - Información de la blockchain
   - `/api/v2/transactions` - Gestión de transacciones
   - `/api/v2/validators` - Información de validadores
   - `/api/v2/network` - Estado de la red P2P
   - `/api/v2/status` - Estado del sistema

## 🔧 **Características Técnicas**

### **Seguridad**
- **CORS** configurado para frontend
- **Helmet** para headers de seguridad
- **Rate Limiting** (1000 requests/15min por IP)
- **Validación de entrada** en todos los endpoints
- **Manejo de errores** robusto

### **Performance**
- **Middleware optimizado** para alta concurrencia
- **Caching** de respuestas frecuentes
- **Compresión** automática de respuestas
- **Logging** de requests para debugging

### **Compatibilidad**
- **API v2** - Endpoints modernos
- **Legacy API** - Compatibilidad con versiones anteriores
- **Swagger UI** - Documentación interactiva

## 📡 **Endpoints Principales**

### **Blockchain Info**
```http
GET /api/v2/blockchain
```
**Respuesta:**
```json
{
  "chain": [...],
  "pendingTransactions": [...],
  "consensus": "pos",
  "totalBlocks": 1,
  "totalTransactions": 12,
  "miningReward": 100,
  "minimumStake": 1000
}
```

### **Latest Blocks**
```http
GET /api/v2/blockchain/blocks?limit=10
```

### **Create Transaction**
```http
POST /api/v2/transactions
Content-Type: application/json

{
  "fromAddress": "sender_address",
  "toAddress": "receiver_address",
  "amount": 100.5
}
```

### **Network Status**
```http
GET /api/v2/network/status
```

### **System Status**
```http
GET /api/v2/status
```

## 🚀 **Scripts de Inicio**

### **Iniciar API v2**
```bash
npm run start:api-v2
```

### **Iniciar Sistema Completo**
```bash
./start-system-v2.sh
```

### **Desarrollo con Hot Reload**
```bash
npm run dev:api
```

## 🌐 **URLs de Acceso**

- **API v2**: http://localhost:3000
- **Documentación**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **Frontend**: http://localhost:5173

## 🔌 **Integración con Frontend**

### **Configuración del Frontend**
El frontend se conecta automáticamente a la API v2 a través del servicio `api.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000';

export const blockchainAPI = {
  getBlockchainInfo: () => api.get('/api/v2/blockchain'),
  getLatestBlocks: (limit) => api.get(`/api/v2/blockchain/blocks?limit=${limit}`),
  createTransaction: (transaction) => api.post('/api/v2/transactions', transaction),
  // ... más endpoints
};
```

### **Actualizaciones en Tiempo Real**
- **Auto-refresh** cada 30 segundos
- **WebSocket** preparado para futuras implementaciones
- **Estado reactivo** con React hooks

## 📊 **Monitorización**

### **Health Check**
```http
GET /health
```
**Respuesta:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-27T15:17:54.491Z",
  "version": "2.0.0",
  "services": {
    "blockchain": "available",
    "p2p": "available"
  }
}
```

### **Logs**
- **Request logging** automático
- **Error tracking** detallado
- **Performance metrics** integrados

## 🔄 **Flujo de Transacciones**

1. **Frontend** envía transacción a `/api/v2/transactions`
2. **API v2** valida los datos de entrada
3. **Blockchain** añade la transacción a pending
4. **P2P Manager** broadcast la transacción a la red
5. **Validadores** procesan y confirman la transacción
6. **Frontend** recibe confirmación

## 🛠️ **Desarrollo**

### **Estructura de Archivos**
```
src/api/v2/
├── BlockchainAPI.js      # Clase principal de la API
└── routes/               # Rutas específicas (futuro)
```

### **Extensibilidad**
- **Middleware modular** para nuevas funcionalidades
- **Sistema de plugins** preparado
- **Versionado** de API para futuras actualizaciones

## 🎯 **Ventajas de la API v2**

### **Frente a la API Legacy**
- ✅ **Mejor rendimiento** y escalabilidad
- ✅ **Seguridad mejorada** con middleware moderno
- ✅ **Documentación automática** con Swagger
- ✅ **Manejo de errores** más robusto
- ✅ **Compatibilidad** con frontend moderno
- ✅ **Integración directa** con P2P

### **Características Únicas**
- 🔄 **Auto-sincronización** con la blockchain
- 🌐 **Broadcast automático** a la red P2P
- 📊 **Métricas en tiempo real**
- 🔒 **Validación de transacciones**
- 📱 **Optimizado para frontend React**

## 🚀 **Próximos Pasos**

1. **WebSocket Integration** para actualizaciones en tiempo real
2. **Authentication & Authorization** para endpoints protegidos
3. **Caching Layer** con Redis para mejor performance
4. **Load Balancing** para alta disponibilidad
5. **Metrics Dashboard** para monitorización avanzada

---

**API v2** - La puerta de entrada moderna a la blockchain Luxae 🚀 