# Plan de Implementación: Bloqueo de Cambios de Tienda

## 📋 Resumen

Implementar un sistema de bloqueo que prevenga cambios en la configuración de la tienda una vez que ha sido creada y/o sincronizada con el servidor. Esto asegura la integridad de los datos y previene modificaciones accidentales.

## 🎯 Objetivos

1. **Bloquear cambios** en campos críticos de la tienda después de sincronización exitosa
2. **Indicador visual** claro de que la tienda está bloqueada
3. **Mecanismo de desbloqueo** controlado (con confirmación o passcode)
4. **Campos editables** incluso cuando está bloqueado (ej: GPS, ecommerceEnabled)
5. **Persistencia** del estado de bloqueo entre sesiones

## 🔍 Análisis del Flujo Actual

### Puntos de Sincronización Identificados:

1. **`handleSaveStoreSettings()` en UnifiedConfiguration.tsx**
   - Guarda localmente → Sincroniza con `syncShopData()`
   - Se activa cuando: `syncResult.success && syncResult.shop._id`

2. **`syncShopData()` en shopService.ts**
   - Puede crear (`createShop`) o actualizar (`updateShop`)
   - Retorna `{ success: boolean, shop?: Shop }`

3. **`syncWithBusiness()` en businessSyncService.ts**
   - Sincroniza desde URL de tienda existente
   - Actualiza configuración local con `updateLocalShopConfiguration()`
   - Retorna `SyncResult` con `success: boolean`

4. **`handleSyncFromShopUrl()` en ConfigurationSyncView.tsx**
   - Sincroniza desde URL manual
   - Actualiza configuración local

### Campos que Deben Bloquearse:

**Campos Críticos (Bloqueados):**
- `storeName` - Nombre de la tienda
- `storeLocation` - Ubicación general
- `streetAddress` - Dirección
- `city` - Ciudad
- `state` - Estado
- `zip` - Código postal
- `storeType` - Tipo de tienda

**Campos Opcionales (Editables incluso bloqueado):**
- `gpsLocation` - Ubicación GPS (puede cambiar)
- `ecommerceEnabled` - Habilitar ecommerce
- `kitchenEnabled` - Habilitar cocina
- Configuraciones de crypto, tax, etc.

## 🏗️ Arquitectura Propuesta

### 1. Servicio de Bloqueo (`shopLockService.ts`)

**Nuevo archivo:** `src/services/shopLockService.ts`

```typescript
// Storage keys
const SHOP_LOCKED_KEY = '@BizneAI_shop_locked';
const SHOP_LOCKED_FIELDS_KEY = '@BizneAI_shop_locked_fields';
const SHOP_LOCKED_AT_KEY = '@BizneAI_shop_locked_at';
const SHOP_LOCK_REASON_KEY = '@BizneAI_shop_lock_reason';

// Tipos
export type LockReason = 'created' | 'synced' | 'manual';
export type LockableField = 
  | 'storeName' 
  | 'storeLocation' 
  | 'streetAddress' 
  | 'city' 
  | 'state' 
  | 'zip' 
  | 'storeType';

export interface ShopLockStatus {
  isLocked: boolean;
  lockedFields: LockableField[];
  lockedAt?: string;
  reason?: LockReason;
  shopId?: string;
}

// Funciones principales
export const lockShop = async (
  shopId: string, 
  reason: LockReason,
  fields?: LockableField[]
): Promise<void>

export const unlockShop = async (): Promise<void>

export const getShopLockStatus = async (): Promise<ShopLockStatus>

export const isFieldLocked = async (field: LockableField): Promise<boolean>

export const canEditField = async (field: string): Promise<boolean>
```

### 2. Integración en `shopService.ts`

**Modificar `syncShopData()`:**
- Después de crear/actualizar exitosamente, llamar a `lockShop()`
- Pasar `shopId` y `reason: 'created' | 'synced'`

**Modificar `createShop()` y `updateShop()`:**
- No bloquear directamente aquí (dejar a `syncShopData()`)

### 3. Integración en `businessSyncService.ts`

**Modificar `syncWithBusiness()`:**
- Después de sincronización exitosa, llamar a `lockShop()`
- Pasar `shopId` y `reason: 'synced'`

**Modificar `updateLocalShopConfiguration()`:**
- Después de actualizar configuración, verificar si debe bloquearse

### 4. Modificaciones en `UnifiedConfiguration.tsx`

**Estado:**
```typescript
const [shopLocked, setShopLocked] = useState(false);
const [lockedFields, setLockedFields] = useState<LockableField[]>([]);
```

**useEffect para cargar estado:**
```typescript
useEffect(() => {
  loadLockStatus();
}, []);

const loadLockStatus = async () => {
  const lockStatus = await getShopLockStatus();
  setShopLocked(lockStatus.isLocked);
  setLockedFields(lockStatus.lockedFields);
};
```

**Modificar `handleSaveStoreSettings()`:**
- Después de `syncResult.success`, llamar a `lockShop()`
- Actualizar estado local

**Modificar campos del formulario:**
- Agregar `editable={!isFieldLocked(field)}` a cada campo bloqueable
- Mostrar indicador visual (icono de candado, texto, etc.)

**Agregar función de desbloqueo:**
```typescript
const handleUnlockShop = async () => {
  // Mostrar confirmación o pedir passcode
  Alert.alert(
    'Desbloquear Tienda',
    '¿Está seguro que desea desbloquear la configuración de la tienda?',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desbloquear',
        style: 'destructive',
        onPress: async () => {
          await unlockShop();
          await loadLockStatus();
        }
      }
    ]
  );
};
```

### 5. UI/UX - Indicadores Visuales

**Banner de Bloqueo:**
```tsx
{shopLocked && (
  <View style={styles.lockBanner}>
    <Ionicons name="lock-closed" size={20} color="#FF9800" />
    <Text style={styles.lockText}>
      Configuración bloqueada - Sincronizada con servidor
    </Text>
    <TouchableOpacity onPress={handleUnlockShop}>
      <Text style={styles.unlockLink}>Desbloquear</Text>
    </TouchableOpacity>
  </View>
)}
```

**Campos Deshabilitados:**
```tsx
<TextInput
  value={storeName}
  onChangeText={setStoreName}
  editable={!isFieldLocked('storeName')}
  style={[
    styles.input,
    isFieldLocked('storeName') && styles.inputLocked
  ]}
  placeholder="Store Name"
/>
{isFieldLocked('storeName') && (
  <Ionicons 
    name="lock-closed" 
    size={16} 
    color="#999" 
    style={styles.lockIcon}
  />
)}
```

### 6. Persistencia

**AsyncStorage Keys:**
- `@BizneAI_shop_locked` - Boolean (si está bloqueado)
- `@BizneAI_shop_locked_fields` - Array de campos bloqueados
- `@BizneAI_shop_locked_at` - Timestamp de bloqueo
- `@BizneAI_shop_lock_reason` - Razón del bloqueo
- `@BizneAI_shop_lock_shop_id` - ID de la tienda bloqueada

## 📝 Plan de Implementación (Pasos)

### Fase 1: Servicio Base
1. ✅ Crear `shopLockService.ts` con funciones básicas
2. ✅ Implementar `lockShop()`, `unlockShop()`, `getShopLockStatus()`
3. ✅ Implementar `isFieldLocked()` y `canEditField()`
4. ✅ Tests básicos del servicio

### Fase 2: Integración Backend
5. ✅ Modificar `syncShopData()` para bloquear después de éxito
6. ✅ Modificar `syncWithBusiness()` para bloquear después de sincronización
7. ✅ Verificar que el bloqueo persiste entre sesiones

### Fase 3: UI/UX
8. ✅ Agregar estado de bloqueo en `UnifiedConfiguration.tsx`
9. ✅ Implementar banner de bloqueo
10. ✅ Deshabilitar campos bloqueados visualmente
11. ✅ Agregar función de desbloqueo con confirmación
12. ✅ Agregar iconos de candado en campos bloqueados

### Fase 4: Validación y Edge Cases
13. ✅ Manejar caso cuando se desbloquea y se vuelve a sincronizar
14. ✅ Manejar caso cuando se sincroniza sin shopId previo
15. ✅ Manejar caso cuando se limpia la configuración
16. ✅ Validar que campos opcionales siguen editables

### Fase 5: Documentación y Testing
17. ✅ Documentar el sistema de bloqueo
18. ✅ Agregar logs para debugging
19. ✅ Testing manual del flujo completo

## 🔐 Consideraciones de Seguridad

1. **Desbloqueo Controlado:**
   - Requerir confirmación explícita
   - Opcional: Requerir passcode de administrador
   - Log de eventos de bloqueo/desbloqueo

2. **Validación:**
   - Verificar que shopId existe antes de bloquear
   - No permitir bloqueo si no hay sincronización exitosa

3. **Sincronización:**
   - Si se desbloquea y se vuelve a sincronizar, volver a bloquear
   - Mantener consistencia entre servidor y local

## 🎨 Diseño de UI

### Banner de Bloqueo:
- Color: Naranja/Warning (#FF9800)
- Icono: lock-closed
- Texto: "Configuración bloqueada - Sincronizada con servidor"
- Botón: "Desbloquear" (texto, no botón grande)

### Campos Bloqueados:
- Fondo: Gris claro (#f5f5f5)
- Texto: Gris (#999)
- Icono de candado pequeño al lado del label
- Tooltip: "Este campo está bloqueado porque la tienda está sincronizada"

### Botón de Guardar:
- Si está bloqueado: Deshabilitado o mostrar mensaje
- Mensaje: "La configuración está bloqueada. Desbloquee para editar."

## 📊 Flujo de Estados

```
Estado Inicial (Sin tienda)
    ↓
Usuario completa formulario
    ↓
handleSaveStoreSettings()
    ↓
syncShopData() → success
    ↓
lockShop(shopId, 'created')
    ↓
Estado: BLOQUEADO
    ↓
[Usuario puede desbloquear]
    ↓
unlockShop()
    ↓
Estado: DESBLOQUEADO
    ↓
[Usuario puede editar]
    ↓
handleSaveStoreSettings() → syncShopData() → success
    ↓
lockShop(shopId, 'synced')
    ↓
Estado: BLOQUEADO (nuevamente)
```

## 🚀 Beneficios

1. **Integridad de Datos:** Previene cambios accidentales
2. **Consistencia:** Mantiene sincronización con servidor
3. **UX Claro:** Usuario sabe qué puede y no puede editar
4. **Flexibilidad:** Permite editar campos no críticos
5. **Control:** Desbloqueo controlado cuando sea necesario

## ⚠️ Consideraciones Adicionales

1. **Migración:** Tiendas existentes que ya están sincronizadas
   - Opción: Detectar si hay shopId y bloquear automáticamente
   - Opción: Permitir primera sincronización sin bloqueo

2. **Múltiples Dispositivos:**
   - El bloqueo es local por dispositivo
   - Cada dispositivo puede tener su propio estado

3. **Sincronización Bidireccional:**
   - Si el servidor actualiza la tienda, ¿debe bloquearse automáticamente?
   - Considerar webhook o polling para detectar cambios del servidor

## 📝 Notas de Implementación

- El bloqueo es **opcional** - el usuario puede desbloquear cuando quiera
- El bloqueo es **local** - no se sincroniza con el servidor
- El bloqueo es **persistente** - se mantiene entre sesiones
- El bloqueo es **granular** - solo campos específicos están bloqueados

