# Sistema de Base de Datos Local - BizneAI POS

## 📋 **Descripción General**

El sistema de base de datos local utiliza **SQLite** para almacenar todas las operaciones de la tienda de forma local, proporcionando persistencia de datos y funcionalidad offline. Los identificadores de la tienda (`_id` y `clientId`) se manejan a través de un contexto React para facilitar el acceso en toda la aplicación.

## 🏗️ **Arquitectura del Sistema**

### **1. Contexto de Tienda (StoreContext)**
- **Archivo**: `src/contexts/StoreContext.tsx`
- **Propósito**: Manejar los identificadores de la tienda globalmente
- **Identificadores**:
  - `_id`: ID único generado por MongoDB cuando se crea la tienda
  - `clientId`: ID del cliente para servicios externos
  - `storeName`: Nombre de la tienda
  - `storeType`: Tipo de tienda (Restaurant, CoffeeShop, etc.)

### **2. Base de Datos SQLite**
- **Archivo**: `src/database/database.ts`
- **Propósito**: Almacenar todas las operaciones locales
- **Ubicación**: 
  - Desarrollo: `./bizneai.db`
  - Producción: `userData/bizneai.db`

### **3. Hook de Base de Datos**
- **Archivo**: `src/hooks/useDatabase.ts`
- **Propósito**: Proporcionar una API limpia para operaciones de BD
- **Funcionalidades**: CRUD para productos, ventas, clientes, configuración

## 🗄️ **Estructura de la Base de Datos**

### **Tablas Principales**

#### **1. products**
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  barcode TEXT,
  image TEXT,
  description TEXT,
  cost REAL,
  sku TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### **2. sales**
```sql
CREATE TABLE sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  total_amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  customer_info TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### **3. sale_items**
```sql
CREATE TABLE sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);
```

#### **4. store_config**
```sql
CREATE TABLE store_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  store_name TEXT NOT NULL,
  store_type TEXT NOT NULL,
  config_data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### **5. inventory**
```sql
CREATE TABLE inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  operation_type TEXT NOT NULL,
  reference TEXT,
  reference_id INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);
```

#### **6. backups**
```sql
CREATE TABLE backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id TEXT NOT NULL,
  backup_type TEXT NOT NULL,
  status TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 **Flujo de Configuración Inicial**

### **1. Configuración de Tienda**
```typescript
// En Settings.tsx - Modo setup
const response = await storeAPI.setupStore(setupData);

if (response.success) {
  // Guardar identificadores en contexto
  setStoreIdentifiers({
    _id: storeData._id,
    clientId: storeData.clientId,
    storeName: storeData.storeName,
    storeType: storeData.storeType
  });

  // Guardar en base de datos local
  await saveStoreConfig({
    store_id: storeData._id,
    client_id: storeData.clientId,
    store_name: storeData.storeName,
    store_type: storeData.storeType,
    config_data: JSON.stringify(formData)
  });
}
```

### **2. Persistencia de Identificadores**
- **localStorage**: `bizneai-store-identifiers`
- **Contexto React**: Disponible en toda la aplicación
- **Base de datos**: Tabla `store_config`

## 🛠️ **Uso del Sistema**

### **1. Acceder al Contexto de Tienda**
```typescript
import { useStore } from '../contexts/StoreContext';

const MyComponent = () => {
  const { storeIdentifiers, isStoreConfigured } = useStore();
  
  if (!isStoreConfigured) {
    return <div>Tienda no configurada</div>;
  }
  
  return (
    <div>
      Tienda: {storeIdentifiers.storeName}
      ID: {storeIdentifiers._id}
      Client ID: {storeIdentifiers.clientId}
    </div>
  );
};
```

### **2. Operaciones de Base de Datos**
```typescript
import { useDatabase } from '../hooks/useDatabase';

const MyComponent = () => {
  const { 
    addProduct, 
    getProducts, 
    addSale, 
    getStats,
    isConnected 
  } = useDatabase();

  // Agregar producto
  const handleAddProduct = async () => {
    const productId = await addProduct({
      name: 'Producto Nuevo',
      price: 10.99,
      category: 'General',
      stock: 100
    });
  };

  // Obtener estadísticas
  const loadStats = async () => {
    const stats = await getStats();
    console.log('Ventas totales:', stats.totalSales);
  };
};
```

## 🔌 **Integración con Servicios**

### **1. Kitchen Service**
```typescript
// Los identificadores permiten:
- Crear órdenes específicas de la tienda
- Sincronizar con cocina externa
- Gestionar inventario por tienda
- Reportes de cocina por ubicación
```

### **2. E-commerce Service**
```typescript
// Los identificadores permiten:
- Crear tienda online específica
- Sincronizar productos
- Gestionar pedidos online
- Integrar con plataformas externas
```

### **3. Waitlist Service**
```typescript
// Los identificadores permiten:
- Crear lista de espera por tienda
- Gestionar reservas específicas
- Notificaciones personalizadas
- Integración con sistemas externos
```

## 📊 **Estadísticas Disponibles**

### **Métricas Principales**
- **totalSales**: Número total de ventas
- **totalRevenue**: Ingresos totales
- **totalProducts**: Productos activos
- **lowStockProducts**: Productos con bajo stock
- **recentSales**: Ventas de los últimos 7 días

### **Uso de Estadísticas**
```typescript
const { getStats } = useDatabase();

const loadDashboard = async () => {
  const stats = await getStats();
  
  // Actualizar dashboard
  setDashboardData({
    sales: stats.totalSales,
    revenue: stats.totalRevenue,
    products: stats.totalProducts,
    lowStock: stats.lowStockProducts
  });
};
```

## 🔒 **Seguridad y Validación**

### **1. Validación de Identificadores**
- Todos los endpoints requieren `store_id` y `client_id`
- Middleware de validación automática
- Error handling para identificadores faltantes

### **2. Transacciones**
- Operaciones de venta en transacciones
- Rollback automático en caso de error
- Actualización de inventario atómica

## 🚀 **Próximos Pasos**

### **1. Servicios de Integración**
- [ ] Kitchen Service API
- [ ] E-commerce Service API
- [ ] Waitlist Service API

### **2. Funcionalidades Avanzadas**
- [ ] Sincronización con servidor remoto
- [ ] Backup automático en la nube
- [ ] Multi-ubicación
- [ ] Reportes avanzados

### **3. Optimizaciones**
- [ ] Índices de base de datos
- [ ] Caché de consultas frecuentes
- [ ] Compresión de datos
- [ ] Limpieza automática de datos antiguos

## 📝 **Notas de Desarrollo**

### **Entorno de Desarrollo**
- Base de datos: `./bizneai.db`
- Logs: Console del navegador
- Hot reload: Automático con Vite

### **Entorno de Producción**
- Base de datos: `userData/bizneai.db`
- Logs: Archivos de log de Electron
- Backup: Automático según configuración

### **Depuración**
```typescript
// Verificar conexión
const { isConnected, error } = useDatabase();

// Verificar identificadores
const { storeIdentifiers, isStoreConfigured } = useStore();

console.log('DB Connected:', isConnected);
console.log('Store Configured:', isStoreConfigured);
console.log('Store ID:', storeIdentifiers._id);
```

---

**Sistema de Base de Datos Local - BizneAI POS**  
*Versión 1.0.0*  
*Última actualización: Diciembre 2024* 