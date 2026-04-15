# Componente Provisional Shop ID

## 📍 Archivos Encontrados

1. **Componente UI:** `src/components/ShopIdStatus.tsx`
2. **Servicio:** `src/services/shopIdService.ts`

---

## 🔍 Descripción del Componente

### **ShopIdStatus.tsx**
Componente que muestra el estado del Shop ID (Provisional o Sincronizado) y permite configurar la sincronización con un negocio real.

#### **Características Principales:**
- ✅ Muestra estado (Provisional en naranja, Sincronizado en verde)
- ✅ Muestra el ID del shop (ej: "provisional-shop-123456789-abc123")
- ✅ Muestra nombre del negocio
- ✅ Permite configurar sincronización con URL de negocio
- ✅ Permite resetear a modo provisional
- ✅ Muestra warning cuando está en modo provisional

#### **Props:**
```typescript
interface ShopIdStatusProps {
  onShopIdChange?: () => void;
}
```

#### **Estados del Componente:**
- `shopInfo` - Información del shop (ID, nombre, URL, última sync)
- `isProvisional` - Si es provisional (true) o sincronizado (false)
- `showConfigModal` - Modal de configuración
- `businessUrl` - URL del negocio para sincronizar
- `loading` - Estado de carga

#### **Funciones:**
- `loadShopInfo()` - Carga información del shop
- `handleConfigureBusiness()` - Configura sincronización con URL
- `handleResetToProvisional()` - Vuelve a modo provisional

---

## 🛠️ Servicio: shopIdService.ts

### **Funciones Principales:**

#### 1. **getShopId()**
```typescript
getShopId(): Promise<string | null>
```
- Obtiene el ID del shop (provisional o real)
- Si no existe, crea uno provisional
- Formato: `provisional-shop-{timestamp}-{random}`
- Storage key: `bizneai_shop_id` o `bizneai_provisional_shop_id`

#### 2. **getShopInfo()**
```typescript
getShopInfo(): Promise<ShopInfo | null>
```
- Obtiene información completa del shop
- Retorna:
  ```typescript
  {
    id: string;
    name: string;
    isProvisional: boolean;
    businessUrl?: string;
    lastSync?: Date;
    createdAt: Date;
  }
  ```

#### 3. **setRealShopId()**
```typescript
setRealShopId(
  realShopId: string, 
  businessUrl: string, 
  shopName: string
): Promise<void>
```
- Configura un ID real de sincronización
- Limpia el ID provisional
- Guarda información de sincronización
- Storage keys:
  - `bizneai_shop_id` - ID real
  - `bizneai_business_sync` - Info de sincronización
  - `bizneai_shop_id_info` - Info del shop

#### 4. **isProvisionalShop()**
```typescript
isProvisionalShop(): Promise<boolean>
```
- Verifica si el shop usa ID provisional
- Retorna `true` si el ID empieza con "provisional-"

#### 5. **clearShopData()**
```typescript
clearShopData(): Promise<void>
```
- Limpia todos los datos del shop
- Usado para resetear o testing

#### 6. **initializeShopId()**
```typescript
initializeShopId(): Promise<string>
```
- Inicializa el sistema de shop ID
- Crea provisional si no existe

---

## 📊 Storage Keys

```typescript
// ID real del shop
'bizneai_shop_id'

// ID provisional (backup)
'bizneai_provisional_shop_id'

// Información del shop
'bizneai_shop_id_info'

// Información de sincronización
'bizneai_business_sync'
```

---

## 🎨 UI del Componente

### **Status Card:**
- Border izquierdo (naranja para provisional, verde para sincronizado)
- Icono de estado
- Nombre del shop
- ID del shop
- URL del negocio (si está sincronizado)
- Última sincronización
- Warning box si es provisional

### **Modal de Configuración:**
- Input para URL del negocio
- Botón "Configurar Sincronización"
- Botón "Volver a Provisional" (si está sincronizado)

---

## 🔧 Cómo Modificar

### **Para Cambiar el Formato del ID Provisional:**

**En:** `src/services/shopIdService.ts`

```typescript
// Línea 32-33
provisionalId = `provisional-shop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Cambiar a:
provisionalId = `prov-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
```

### **Para Cambiar el Nombre por Defecto:**

**En:** `src/services/shopIdService.ts`

```typescript
// Línea 60
name: 'My business (Provisional)',

// Cambiar a:
name: 'Tienda Temporal',
```

### **Para Agregar Nuevos Campos:**

**En:** `src/services/shopIdService.ts`

```typescript
export interface ShopInfo {
  id: string;
  name: string;
  isProvisional: boolean;
  businessUrl?: string;
  lastSync?: Date;
  createdAt: Date;
  // NUEVO CAMPO
  customField?: string;
}
```

### **Para Modificar el Warning:**

**En:** `src/components/ShopIdStatus.tsx`

```typescript
// Líneas 180-185
<View style={styles.provisionalWarning}>
  <Ionicons name="information-circle-outline" size={16} color="#FF9800" />
  <Text style={styles.warningText}>
    Tu texto personalizado aquí
  </Text>
</View>
```

---

## 📝 Flujo de Uso

### **1. Aplicación Inicia (Sin ID):**
```
initializeShopId() 
  → Crea provisional ID
  → Guarda en AsyncStorage
  → ShopInfo: { name: 'Mi Negocio (Provisional)', isProvisional: true }
```

### **2. Usuario Sincroniza:**
```
handleConfigureBusiness(businessUrl)
  → setRealShopId(realId, url, name)
  → Limpia provisional
  → Guarda real ID
  → ShopInfo: { name: 'Negocio Sincronizado', isProvisional: false }
```

### **3. Usuario Resetea:**
```
handleResetToProvisional()
  → clearShopData()
  → initializeShopId()
  → Crea nuevo provisional
  → Vuelve a { isProvisional: true }
```

---

## 🎯 Integraciones

### **Uso en UnifiedConfiguration:**
Actualmente NO está importado directamente en UnifiedConfiguration.

### **Uso en BusinessSyncComponent:**
El componente `BusinessSyncComponent` usa el servicio para:
- Obtener el shop ID actual
- Generar QR codes con el shop ID
- Sincronizar con URLs de negocio

### **Ubicación Visual:**
No aparece en UnifiedConfiguration actualmente. Puede estar en otra pantalla o componente.

---

## 🚀 Mejoras Propuestas

1. **Integrar en UnifiedConfiguration:**
   ```typescript
   import ShopIdStatus from './ShopIdStatus';
   
   // En el render:
   <ShopIdStatus onShopIdChange={loadShopInfo} />
   ```

2. **Agregar más validación del URL:**
   - Verificar que el URL sea accesible
   - Validar formato
   - Verificar autenticación

3. **Agregar sincronización automática:**
   - Sync cada X horas
   - Notificar cuando falte sync
   - Auto-sync en background

4. **Mejorar feedback visual:**
   - Loading spinner
   - Success animation
   - Error messages más claros

