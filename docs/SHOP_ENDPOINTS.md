# Shop Endpoints Documentation

## 📍 Base URL
```typescript
Production: https://www.bizneai.com/api
Local: http://localhost:3000/api (commented out, always uses production)
```

## 🔗 Endpoints Utilizados

### 1. **GET /shop/store-types**
**Propósito:** Obtener tipos de tienda disponibles desde el servidor

**Función:**
```typescript
getStoreTypes(): Promise<StoreType[]>
```

**Ubicación:** `src/services/shopService.ts` líneas 155-210

**Descripción:**
- Fetch de tipos de tienda con traducción (inglés/español)
- Incluye categorías principales (food_beverage, retail, healthcare, etc.)
- Si falla, usa tipos de fallback locales

**Respuesta:**
```typescript
StoreType[] = [
  {
    value: 'CoffeeShop',
    mainCategory: 'food_beverage',
    label: { en: 'Coffee Shop', es: 'Cafetería' }
  },
  // ... más tipos
]
```

---

### 2. **GET /shop?storeType={type}&search={name}&status=active&page=1&limit=12**
**Propósito:** Buscar tienda existente

**Función:**
```typescript
findExistingShop(storeType: string, storeName?: string): Promise<Shop | null>
```

**Ubicación:** `src/services/shopService.ts` líneas 213-251

**Parámetros:**
- `storeType` - Tipo de tienda
- `search` (opcional) - Nombre de la tienda
- `status` - 'active'
- `page` - 1
- `limit` - 12

**Descripción:**
- Busca tienda existente por tipo y nombre
- Si encuentra, guarda ID y datos localmente
- Usado antes de crear nueva tienda

**Respuesta:**
```typescript
{
  shops: Shop[],
  pagination: {
    total: number,
    pages: number,
    current: number
  }
}
```

---

### 3. **POST /shop**
**Propósito:** Crear nueva tienda en el servidor

**Función:**
```typescript
createShop(shopData: Omit<Shop, '_id'>): Promise<Shop | null>
```

**Ubicación:** `src/services/shopService.ts` líneas 254-277

**Payload:**
```typescript
{
  storeName: string,
  storeLocation: string,
  streetAddress: string,
  city: string,
  state: string,
  zip: string,
  storeType: string,
  ecommerceEnabled: boolean,
  kitchenEnabled: boolean,
  gpsLocation?: {
    latitude: number,
    longitude: number
  },
  status: 'active'
}
```

**Descripción:**
- Crea nueva tienda en el servidor
- Guarda ID y datos localmente en AsyncStorage
- Retorna el shop creado con `_id`

**Respuesta:**
```typescript
Shop {
  _id: string,
  storeName: string,
  // ... todos los campos
  createdAt: string,
  updatedAt: string
}
```

---

### 4. **GET /shop/{shopId}**
**Propósito:** Obtener tienda por ID

**Función:**
```typescript
getShopById(shopId: string): Promise<Shop | null>
```

**Ubicación:** `src/services/shopService.ts` líneas 280-297

**Descripción:**
- Fetch de tienda específica por ID
- Actualiza datos locales con los del servidor

**Respuesta:**
```typescript
Shop {
  _id: string,
  storeName: string,
  // ... todos los campos
}
```

---

### 5. **PUT /shop/{shopId}**
**Propósito:** Actualizar tienda existente

**Función:**
```typescript
updateShop(shopId: string, shopData: Partial<Shop>): Promise<Shop | null>
```

**Ubicación:** `src/services/shopService.ts` líneas 300-320

**Payload:**
```typescript
Partial<Shop> // Campos a actualizar
```

**Descripción:**
- Actualiza datos de tienda existente
- Actualiza caché local con los nuevos datos

**Respuesta:**
```typescript
Shop // Tienda actualizada
```

---

## 🔄 Flujo de Sincronización (`syncShopData`)

**Función:** `src/services/shopService.ts` líneas 323-398

### **Lógica de Sincronización:**

```typescript
1. Obtener shopId local
   ↓
2. Si existe shopId:
   └─→ GET /shop/{shopId}
      ↓
      Si existe:
      └─→ PUT /shop/{shopId} (actualizar)
      ↓
      Retorna success
   ↓
3. Si no existe shopId:
   └─→ GET /shop?storeType={type}&search={name}
      ↓
      Si encuentra tienda existente:
      └─→ PUT /shop/{shopId} (actualizar)
      ↓
      Retorna success
   ↓
4. Si no encuentra tienda:
   └─→ POST /shop (crear nueva)
      ↓
      Retorna success
```

### **Uso en UnifiedConfiguration:**

**Función:** `handleSaveStoreSettings()` líneas 523-587

```typescript
// 1. Guardar localmente primero
await config.setStoreName(storeName);
await config.setStoreLocation(storeLocation);
// ... más campos

// 2. Sincronizar con servidor
const syncResult = await syncShopData({
  storeName,
  storeLocation,
  streetAddress,
  city,
  state: stateVal,
  zip,
  storeType,
  ecommerceEnabled: config.ecommerceEnabled,
  gpsLocation: { latitude, longitude }
});

// 3. Mostrar resultado
if (syncResult.success) {
  Alert.alert('Success', 'Store saved and synced');
} else {
  Alert.alert('Error', syncResult.error);
}
```

---

## 💾 Storage Local

### **AsyncStorage Keys:**
```typescript
'@BizneAI_shop_id' // ID de la tienda
'@BizneAI_shop_data' // Datos completos de la tienda
```

### **Funciones de Storage:**
- `saveShopId(shopId)` - Guarda ID
- `getShopId()` - Obtiene ID
- `saveShopDataLocally(shopData)` - Guarda datos
- `getLocalShopData()` - Obtiene datos
- `clearLocalShopData()` - Limpia datos

---

## 🎯 Flujo Completo de Creación/Actualización de Store

### **Escenario 1: Nueva Tienda**
```
Usuario completa formulario
    ↓
handleSaveStoreSettings()
    ↓
1. Guardar localmente (ConfigContext)
    ↓
2. syncShopData({ ...configData })
    ↓
3. Buscar tienda existente (GET /shop?search=name)
    ↓
No encuentra → CREATE (POST /shop)
    ↓
Guarda ID localmente
    ↓
Retorna success
```

### **Escenario 2: Actualizar Tienda Existente**
```
Usuario modifica configuración
    ↓
handleSaveStoreSettings()
    ↓
1. Guardar localmente
    ↓
2. syncShopData({ ...configData })
    ↓
3. Tiene shopId local
    ↓
GET /shop/{shopId}
    ↓
Encuentra → UPDATE (PUT /shop/{shopId})
    ↓
Actualiza datos locales
    ↓
Retorna success
```

---

## ⚙️ Configuración

### **Headers por Defecto:**
```typescript
{
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}
```

### **Error Handling:**
```typescript
try {
  // API call
} catch (error) {
  return {
    success: false,
    error: error.message,
    details: []
  };
}
```

---

## 📝 Notas Importantes

1. **Siempre usa producción API** - `https://www.bizneai.com/api`
2. **Datos se guardan localmente** después de cada operación exitosa
3. **Fallback a tipos locales** si no se pueden cargar desde servidor
4. **Sync busca existente antes de crear** para evitar duplicados
5. **GPS location** es opcional pero se incluye si está disponible


