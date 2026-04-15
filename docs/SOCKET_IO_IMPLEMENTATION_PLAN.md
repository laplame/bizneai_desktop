# 📡 Plan de Implementación: Socket.IO para Actualizaciones en Tiempo Real

## 🎯 Objetivo

Implementar Socket.IO para recibir actualizaciones en tiempo real de:
- **Inventario**: Cambios en stock de productos
- **Precios**: Cambios en precios de productos
- **Productos**: Creación, actualización o eliminación de productos

---

## 📋 Análisis Actual

### Estado del Servidor
- ❌ Socket.IO no está configurado en el servidor
- ✅ Existe documentación de eventos Socket.IO para Kitchen
- ✅ Endpoints MCP para inventario y productos están implementados

### Estado del Cliente
- ❌ No hay cliente Socket.IO instalado
- ✅ Existen contextos para manejar inventario y productos
- ✅ Existen servicios de sincronización MCP

---

## 🏗️ Arquitectura Propuesta

### 1. **Servidor (Backend)**

#### Instalación y Configuración
```bash
# En el servidor
npm install socket.io
npm install @types/socket.io --save-dev
```

#### Eventos a Emitir

**Inventario:**
- `inventory:update` - Cuando se actualiza el inventario de un producto
  ```typescript
  {
    shopId: string;
    productId: string;
    previousStock: number;
    newStock: number;
    adjustmentType: 'sale' | 'return' | 'damage' | 'purchase' | 'adjustment';
    reason?: string;
    timestamp: Date;
  }
  ```

**Precios:**
- `product:price:update` - Cuando se actualiza el precio de un producto
  ```typescript
  {
    shopId: string;
    productId: string;
    previousPrice: number;
    newPrice: number;
    reason?: string;
    timestamp: Date;
  }
  ```

**Productos:**
- `product:created` - Cuando se crea un nuevo producto
- `product:updated` - Cuando se actualiza un producto
- `product:deleted` - Cuando se elimina un producto

#### Configuración del Servidor
```typescript
// server/src/socket.ts
import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

export function setupSocketIO(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Configurar según necesidad
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
  });

  // Namespace por shopId para mejor organización
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Unirse a la sala del shop
    socket.on('join:shop', (shopId: string) => {
      socket.join(`shop:${shopId}`);
      console.log(`Client ${socket.id} joined shop:${shopId}`);
    });

    // Salir de la sala del shop
    socket.on('leave:shop', (shopId: string) => {
      socket.leave(`shop:${shopId}`);
      console.log(`Client ${socket.id} left shop:${shopId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}
```

#### Integración en Endpoints

**En MCP Inventory Adjust:**
```typescript
// Después de ajustar inventario
io.to(`shop:${shopId}`).emit('inventory:update', {
  shopId,
  productId: adjustment.productId,
  previousStock: product.stock,
  newStock: updatedProduct.stock,
  adjustmentType: adjustment.adjustmentType,
  reason: adjustment.reason,
  timestamp: new Date()
});
```

**En MCP Products Update Price:**
```typescript
// Después de actualizar precio
io.to(`shop:${shopId}`).emit('product:price:update', {
  shopId,
  productId: product._id,
  previousPrice: product.price,
  newPrice: newPrice,
  reason: priceUpdate.reason,
  timestamp: new Date()
});
```

---

### 2. **Cliente (React Native)**

#### Instalación
```bash
npm install socket.io-client
npm install @types/socket.io-client --save-dev
```

#### Servicio de Socket.IO
```typescript
// src/services/socketService.ts
import { io, Socket } from 'socket.io-client';
import { getRealShopId } from './shopIdService';

class SocketService {
  private socket: Socket | null = null;
  private shopId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(): Promise<boolean> {
    try {
      const shopId = await getRealShopId();
      if (!shopId || shopId.startsWith('provisional-')) {
        console.log('[SocketService] No valid shop ID, skipping connection');
        return false;
      }

      this.shopId = shopId;
      const serverUrl = 'https://www.bizneai.com'; // O desde config

      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      // Eventos de conexión
      this.socket.on('connect', () => {
        console.log('[SocketService] ✅ Connected to server');
        this.reconnectAttempts = 0;
        this.joinShop(shopId);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[SocketService] Disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('[SocketService] Connection error:', error);
        this.reconnectAttempts++;
      });

      // Unirse a la sala del shop
      this.joinShop(shopId);

      return true;
    } catch (error) {
      console.error('[SocketService] Error connecting:', error);
      return false;
    }
  }

  private joinShop(shopId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join:shop', shopId);
      console.log('[SocketService] Joined shop room:', shopId);
    }
  }

  // Escuchar actualizaciones de inventario
  onInventoryUpdate(callback: (data: InventoryUpdateEvent) => void) {
    this.socket?.on('inventory:update', callback);
  }

  // Escuchar actualizaciones de precios
  onPriceUpdate(callback: (data: PriceUpdateEvent) => void) {
    this.socket?.on('product:price:update', callback);
  }

  // Escuchar actualizaciones de productos
  onProductCreated(callback: (data: ProductEvent) => void) {
    this.socket?.on('product:created', callback);
  }

  onProductUpdated(callback: (data: ProductEvent) => void) {
    this.socket?.on('product:updated', callback);
  }

  onProductDeleted(callback: (data: { shopId: string; productId: string }) => void) {
    this.socket?.on('product:deleted', callback);
  }

  // Desconectar
  disconnect() {
    if (this.socket) {
      if (this.shopId) {
        this.socket.emit('leave:shop', this.shopId);
      }
      this.socket.disconnect();
      this.socket = null;
      console.log('[SocketService] Disconnected');
    }
  }

  // Verificar estado de conexión
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();

// Tipos de eventos
export interface InventoryUpdateEvent {
  shopId: string;
  productId: string;
  previousStock: number;
  newStock: number;
  adjustmentType: 'sale' | 'return' | 'damage' | 'purchase' | 'adjustment';
  reason?: string;
  timestamp: Date;
}

export interface PriceUpdateEvent {
  shopId: string;
  productId: string;
  previousPrice: number;
  newPrice: number;
  reason?: string;
  timestamp: Date;
}

export interface ProductEvent {
  shopId: string;
  product: any; // Product data
  timestamp: Date;
}
```

#### Contexto de Socket.IO
```typescript
// src/context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { socketService, InventoryUpdateEvent, PriceUpdateEvent } from '../services/socketService';
import { updateInventoryItem, getInventoryItem } from '../services/inventoryDatabase';
import { updateProduct } from '../services/database';

interface SocketContextType {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Conectar al montar
    connectSocket();

    // Limpiar al desmontar
    return () => {
      socketService.disconnect();
    };
  }, []);

  const connectSocket = async () => {
    const connected = await socketService.connect();
    setIsConnected(connected);

    if (connected) {
      // Escuchar actualizaciones de inventario
      socketService.onInventoryUpdate(async (data: InventoryUpdateEvent) => {
        console.log('[SocketContext] Inventory update received:', data);
        
        // Actualizar inventario local
        const currentItem = await getInventoryItem(data.productId);
        if (currentItem) {
          await updateInventoryItem({
            ...currentItem,
            quantity: data.newStock
          });
        }
      });

      // Escuchar actualizaciones de precios
      socketService.onPriceUpdate(async (data: PriceUpdateEvent) => {
        console.log('[SocketContext] Price update received:', data);
        
        // Actualizar precio del producto local
        // Necesitamos obtener el producto y actualizarlo
        // Esto requeriría una función para obtener producto por ID del servidor
      });

      // Escuchar creación/actualización de productos
      socketService.onProductUpdated(async (data) => {
        console.log('[SocketContext] Product updated received:', data);
        // Sincronizar producto actualizado
      });
    }
  };

  return (
    <SocketContext.Provider value={{ isConnected, connect: connectSocket, disconnect: socketService.disconnect }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
```

---

## 📝 Pasos de Implementación

### Fase 1: Configuración del Servidor

1. **Instalar Socket.IO en el servidor**
   ```bash
   cd server
   npm install socket.io
   ```

2. **Crear archivo de configuración Socket.IO**
   - `server/src/socket.ts` - Configuración básica
   - `server/src/socketHandlers/inventory.ts` - Handlers de inventario
   - `server/src/socketHandlers/products.ts` - Handlers de productos

3. **Integrar en `server/src/index.ts`**
   - Inicializar Socket.IO con el servidor HTTP
   - Configurar namespaces y rooms

4. **Emitir eventos en endpoints MCP**
   - `POST /api/mcp/:shopId/inventory/adjust` → emit `inventory:update`
   - `POST /api/mcp/:shopId/products/update-price` → emit `product:price:update`
   - `POST /api/mcp/:shopId/products` → emit `product:created`
   - `PUT /api/mcp/:shopId/products/:id` → emit `product:updated`

### Fase 2: Configuración del Cliente

1. **Instalar socket.io-client**
   ```bash
   npm install socket.io-client
   npm install @types/socket.io-client --save-dev
   ```

2. **Crear servicio de Socket.IO**
   - `src/services/socketService.ts` - Cliente Socket.IO
   - Manejo de conexión/desconexión
   - Listeners de eventos

3. **Crear contexto de Socket.IO**
   - `src/context/SocketContext.tsx` - Context para React
   - Integrar con contextos existentes (Inventory, Products)

4. **Integrar en `app/_layout.tsx`**
   - Agregar `SocketProvider` al árbol de providers
   - Conectar automáticamente al iniciar la app

### Fase 3: Actualización de Estado Local

1. **Actualizar inventario cuando llegue evento**
   - En `SocketContext`, actualizar `inventoryDatabase` cuando llegue `inventory:update`
   - Notificar a componentes que usan inventario

2. **Actualizar precios cuando llegue evento**
   - Actualizar productos en `database.ts` cuando llegue `product:price:update`
   - Notificar a componentes que muestran precios

3. **Sincronizar productos cuando llegue evento**
   - Actualizar o crear productos cuando llegue `product:created/updated`

### Fase 4: UI y Notificaciones

1. **Indicador de conexión**
   - Mostrar estado de conexión Socket.IO en la UI
   - Indicador visual cuando hay actualizaciones en tiempo real

2. **Notificaciones de actualizaciones**
   - Toast/Alert cuando se actualice inventario o precio
   - Opción para el usuario de aceptar/rechazar actualización

---

## 🔧 Consideraciones Técnicas

### 1. **Manejo de Reconexión**
- Reintentos automáticos con backoff exponencial
- Sincronización de estado perdido al reconectar
- Queue de eventos perdidos durante desconexión

### 2. **Filtrado por ShopId**
- Usar rooms de Socket.IO para filtrar por shopId
- Solo recibir eventos del shop actual

### 3. **Conflictos de Datos**
- Qué hacer si el usuario está editando y llega una actualización
- Estrategia de resolución de conflictos (último en ganar, merge, etc.)

### 4. **Performance**
- Throttling de actualizaciones muy frecuentes
- Debounce para actualizaciones de UI
- Lazy loading de datos cuando sea necesario

### 5. **Seguridad**
- Autenticación de conexión Socket.IO
- Validación de shopId en el servidor
- Rate limiting para prevenir abuso

---

## 📊 Eventos Propuestos

### Inventario
| Evento | Descripción | Payload |
|--------|-------------|---------|
| `inventory:update` | Stock actualizado | `{ shopId, productId, previousStock, newStock, adjustmentType, reason }` |
| `inventory:low-stock` | Producto con bajo stock | `{ shopId, productId, currentStock, minStock }` |
| `inventory:out-of-stock` | Producto sin stock | `{ shopId, productId }` |

### Precios
| Evento | Descripción | Payload |
|--------|-------------|---------|
| `product:price:update` | Precio actualizado | `{ shopId, productId, previousPrice, newPrice, reason }` |
| `product:price:bulk-update` | Precios actualizados masivamente | `{ shopId, updates: [{ productId, newPrice }] }` |

### Productos
| Evento | Descripción | Payload |
|--------|-------------|---------|
| `product:created` | Producto creado | `{ shopId, product }` |
| `product:updated` | Producto actualizado | `{ shopId, product }` |
| `product:deleted` | Producto eliminado | `{ shopId, productId }` |

---

## 🚀 Ventajas de la Implementación

1. **Tiempo Real**: Actualizaciones instantáneas sin polling
2. **Eficiencia**: Menos carga en el servidor (no polling constante)
3. **UX Mejorada**: Los usuarios ven cambios inmediatamente
4. **Sincronización**: Múltiples dispositivos sincronizados automáticamente
5. **Escalabilidad**: Socket.IO maneja muchas conexiones eficientemente

---

## ⚠️ Desafíos y Soluciones

### Desafío 1: Reconexión en React Native
**Solución**: Usar `socket.io-client` con configuración de reconnection automática

### Desafío 2: Estado de la App en Background
**Solución**: Mantener conexión activa, pero pausar actualizaciones de UI si la app está en background

### Desafío 3: Conflictos de Datos
**Solución**: Timestamp de última actualización, mostrar diálogo al usuario si hay conflicto

### Desafío 4: Batería y Datos
**Solución**: Opción para deshabilitar Socket.IO, usar solo cuando la app está activa

---

## 📦 Dependencias Necesarias

### Servidor
```json
{
  "socket.io": "^4.7.0"
}
```

### Cliente
```json
{
  "socket.io-client": "^4.7.0",
  "@types/socket.io-client": "^3.0.0"
}
```

---

## 🔄 Flujo de Actualización

```
Servidor actualiza inventario/precio
  ↓
Emit evento Socket.IO a room del shop
  ↓
Cliente recibe evento
  ↓
Actualizar estado local (inventoryDatabase/database)
  ↓
Notificar componentes (React Context)
  ↓
UI se actualiza automáticamente
```

---

## ✅ Checklist de Implementación

### Servidor
- [ ] Instalar Socket.IO
- [ ] Configurar Socket.IO en index.ts
- [ ] Crear handlers de eventos
- [ ] Emitir eventos en endpoints MCP
- [ ] Configurar rooms por shopId
- [ ] Agregar autenticación (opcional)

### Cliente
- [ ] Instalar socket.io-client
- [ ] Crear socketService.ts
- [ ] Crear SocketContext.tsx
- [ ] Integrar en _layout.tsx
- [ ] Actualizar inventoryDatabase al recibir eventos
- [ ] Actualizar database.ts al recibir eventos
- [ ] Agregar indicador de conexión
- [ ] Agregar notificaciones de actualizaciones

### Testing
- [ ] Probar conexión/desconexión
- [ ] Probar recepción de eventos
- [ ] Probar actualización de estado local
- [ ] Probar reconexión automática
- [ ] Probar con múltiples dispositivos

---

## 📚 Referencias

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Socket.IO Client for React Native](https://socket.io/docs/v4/client-api/)
- [React Native WebSocket Alternatives](https://reactnative.dev/docs/network#websocket-support)

---

**Última actualización:** Noviembre 2024  
**Estado:** Planificación completa - Listo para implementar

