# Sistema de Migración de Datos

## 📋 Resumen

El Sistema de Migración de Datos de BizneAI asegura que **nunca se pierdan datos** durante las actualizaciones de la aplicación. Cuando se actualiza de una versión anterior, todos los datos del usuario se preservan y migran automáticamente a la nueva estructura.

## 🎯 Características Principales

### ✅ Preservación de Datos
- **Sin pérdida de datos**: Todos los datos del usuario se preservan durante las actualizaciones
- **Backup automático**: Se crea un backup antes de cada migración
- **Migración incremental**: Las migraciones se ejecutan paso a paso entre versiones

### 🔄 Migración Automática
- **Detección automática**: El sistema detecta automáticamente cuando hay una actualización
- **Ejecución transparente**: Las migraciones se ejecutan al iniciar la app sin intervención del usuario
- **Compatibilidad hacia atrás**: Soporta migración desde cualquier versión anterior

### 🛡️ Seguridad y Recuperación
- **Backup antes de migrar**: Se crea un backup completo antes de ejecutar migraciones
- **Restauración automática**: Si falla la migración, se intenta restaurar desde el backup
- **Marcado de migraciones**: Las migraciones completadas se marcan para evitar duplicación

## 📊 Versiones Soportadas

### Versiones con Migración
- **1.0.0 → 1.1.0**: Migración de productos (agregar productCode)
- **1.1.0 → 1.2.0**: Migración de códigos de productos mejorados
- **1.2.0 → 1.3.0**: (Reservado para futuras migraciones)
- **1.3.0 → 1.4.0**: Migración a Merkle Tree Sales History System

## 🔧 Flujo de Migración

### 1. Detección de Actualización
```typescript
// El sistema detecta automáticamente cuando hay una nueva versión
const { isUpdate, previousVersion } = await isAppUpdate();
```

### 2. Creación de Backup
```typescript
// Se crea un backup de todos los datos antes de migrar
await createBackup(dataKeys, fromVersion);
```

### 3. Ejecución de Migración
```typescript
// Se ejecutan las migraciones paso a paso
const result = await migrateData(previousVersion, currentVersion);
```

### 4. Verificación y Marcado
```typescript
// Se marca la migración como completada
await AsyncStorage.setItem(migrationKey, timestamp);
```

## 📝 Ejemplo de Migración

### Migración 1.3.0 → 1.4.0

Esta migración introduce el **Merkle Tree Sales History System**:

1. **Migración de Ventas Existentes**:
   - Todas las ventas existentes se registran en el Merkle Tree
   - Cada venta se convierte en una transacción 'create' con hash criptográfico
   - Se genera el historial completo de ventas

2. **Inicialización de Estructuras**:
   - Se inicializa el almacenamiento del Merkle Tree
   - Se crean las estructuras de Daily Blocks
   - Se configura el Sales History cache

3. **Preservación de Datos**:
   - Los datos originales se mantienen intactos
   - Se agregan las nuevas estructuras sin modificar las existentes

## 🔍 Estructura de Datos Migradas

### Datos Preservados
- ✅ **Productos**: Todos los productos con sus códigos y metadatos
- ✅ **Ventas**: Todas las ventas con su historial completo
- ✅ **Inventario**: Niveles de inventario y cambios históricos
- ✅ **Usuarios**: Todos los usuarios y permisos
- ✅ **Configuración**: Configuración de la tienda y preferencias
- ✅ **Merkle Tree**: Historial criptográfico completo

### Nuevas Estructuras (v1.4.0)
- 📊 **Merkle Tree Transactions**: Transacciones criptográficas
- 📊 **Daily Blocks**: Bloques diarios con Merkle roots
- 📊 **Sales History**: Cache de historial de ventas
- 📊 **Integrity Reports**: Reportes de integridad del sistema

## 🛠️ API del Servicio de Migración

### `migrateData(fromVersion, toVersion)`
Ejecuta la migración entre dos versiones específicas.

```typescript
const result = await migrateData('1.3.0', '1.4.0');
// result: { success: boolean, migratedData: {...}, errors: [...] }
```

### `restoreFromBackup(version)`
Restaura datos desde un backup específico.

```typescript
const restored = await restoreFromBackup('1.3.0');
// restored: boolean
```

### `getMigrationStatus()`
Obtiene el estado de todas las migraciones.

```typescript
const status = await getMigrationStatus();
// status: { completed: string[], pending: string[] }
```

## 📦 Ubicación de Backups

Los backups se almacenan en AsyncStorage con el sufijo:
```
@BizneAI_{original_key}_backup_v{version}
```

Ejemplo:
- Original: `@BizneAI_products`
- Backup: `@BizneAI_products_backup_v1.3.0`

## ⚠️ Consideraciones Importantes

### No Borrar Datos en Actualizaciones
El sistema **NO** borra datos automáticamente durante las actualizaciones. Solo se borran datos si:
- Es una instalación completamente nueva (first install)
- El usuario explícitamente solicita borrar datos (`forceClearData: true`)

### Compatibilidad hacia Atrás
El sistema soporta migración desde cualquier versión anterior:
- Si el usuario tiene v1.0.0 y actualiza a v1.4.0, se ejecutarán todas las migraciones en orden
- Las migraciones intermedias (1.0.0→1.1.0→1.2.0→1.3.0→1.4.0) se ejecutan automáticamente

### Errores en Migraciones
Si una migración falla:
1. Se registran los errores en el resultado
2. Se intenta restaurar desde el backup
3. La app continúa funcionando (no se bloquea el inicio)
4. Los datos originales se preservan

## 🧪 Testing de Migraciones

Para probar migraciones:

1. **Instalar versión antigua**: Instalar APK de versión anterior
2. **Crear datos de prueba**: Agregar productos, ventas, etc.
3. **Actualizar a nueva versión**: Instalar APK de nueva versión
4. **Verificar datos**: Confirmar que todos los datos se preservaron

## 📚 Código Relacionado

- **Servicio de Migración**: `src/services/dataMigrationService.ts`
- **Inicialización de App**: `src/services/appInitializationService.ts`
- **Merkle Tree Service**: `src/services/merkleTreeService.ts`
- **Sales History Service**: `src/services/salesHistoryService.ts`

## 🔄 Agregar Nuevas Migraciones

Para agregar una nueva migración:

1. **Actualizar `version`** en `app.json` (origen de la versión; se usa en `appInitializationService`)
2. **Agregar versión a `VERSION_ORDER`** en `dataMigrationService.ts`
3. **Crear función de migración**: `migrateFromX_Y_Z_to_X_Y_W()`
4. **Agregar case en `executeMigration()`**: Conectar la nueva función
5. **Probar migración**: Verificar que los datos se migran correctamente

Ejemplo:
```typescript
async function migrateFrom1_4_0_to_1_5_0(): Promise<Partial<MigrationResult['migratedData']>> {
  // Lógica de migración aquí
}
```

## ✅ Checklist de Migración

Antes de lanzar una nueva versión:

- [ ] Verificar que `version` en `app.json` está actualizada
- [ ] Crear función de migración para la nueva versión
- [ ] Agregar versión a `VERSION_ORDER`
- [ ] Conectar función en `executeMigration()`
- [ ] Probar migración desde versión anterior
- [ ] Verificar que backups se crean correctamente
- [ ] Confirmar que datos se preservan
- [ ] Documentar cambios en este archivo

## 🎉 Beneficios

1. **Experiencia de Usuario**: Los usuarios no pierden datos al actualizar
2. **Confianza**: Los usuarios pueden actualizar sin preocupaciones
3. **Integridad**: Todos los datos históricos se preservan
4. **Trazabilidad**: Historial completo de migraciones con backups
5. **Recuperación**: Capacidad de restaurar desde backups si es necesario




