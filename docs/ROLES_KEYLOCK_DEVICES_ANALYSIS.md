# Análisis: Keylock, Roles y Dispositivos

Documento que resume cómo se guardan el keylock de 4 dígitos, los roles, y qué se envía al servidor. Incluye recomendaciones para dispositivos con roles y accesos.

---

## 1. Keylock (Passcode de 4 dígitos)

### Almacenamiento local

| Aspecto | Detalle |
|---------|---------|
| **Storage key** | `@passcode` |
| **Ubicación** | `ConfigContext.tsx` → `AsyncStorage` |
| **Valor por defecto** | `1234` |
| **Master key (superadmin)** | `8044` (siempre funciona además del passcode del owner) |
| **Habilitación** | `bizneai_passcode_lock_enabled` (boolean como string 'true'/'false') |

### Flujo de guardado

1. **Configuración** → `UnifiedConfiguration.tsx` (sección Seguridad)
2. Usuario cambia passcode → `config.updateConfig({ passcode: newPasscode })`
3. `ConfigContext` → `AsyncStorage.setItem('@passcode', newPasscode)`
4. Al guardar tienda → `syncShopData({ unlockPassword: config.passcode })`

### Envío al servidor

- **Campo**: `unlockPassword`
- **Endpoint**: `POST /api/shop` (crear) y `PUT /api/shop/:shopId` (actualizar)
- **Servicio**: `shopService.syncShopData()`
- **Cuándo**: Al guardar configuración de tienda o al cambiar solo el passcode

```typescript
// UnifiedConfiguration - al cambiar passcode
await syncShopData({
  storeName: '...',  // mínimo requerido
  unlockPassword: newPasscode,
  gpsLocation: { latitude, longitude }
});
```

---

## 2. Roles

### Dos flujos distintos

#### A) rolePermissions (configuración de permisos por rol)

| Aspecto | Detalle |
|---------|---------|
| **Storage key** | `@BizneAI_roleMenuVisibility` |
| **Servicio** | `roleMenuVisibilityService.ts` |
| **Ubicación** | `UnifiedConfiguration.tsx` (sección Usuarios/Roles) |

**Estructura enviada al servidor**:

```json
{
  "rolePermissions": {
    "owner": {
      "name": "Owner",
      "description": "...",
      "permissions": ["product_create", "product_read", ...],
      "menuVisibility": ["/screens/POSSCreen", "/cart", "/products", ...]
    },
    "cashier": { ... },
    "mesero": { ... }
  }
}
```

- Se envía en `syncShopData()` como `rolePermissions`
- Endpoints: `POST /api/shop`, `PUT /api/shop/:shopId` (junto con unlockPassword)

#### B) Roles en uso (sync de roles activos)

| Aspecto | Detalle |
|---------|---------|
| **Storage key** | `@BizneAI_roleSyncStatus` |
| **Servicio** | `roleSyncService.ts` |
| **Endpoint** | `POST /api/shops/:shopId/roles/sync` |

**Payload**:

```json
{
  "shopId": "shop123",
  "roles": [
    {
      "roleId": "cashier",
      "roleName": "Caja",
      "isActive": true,
      "lastUsed": "2025-01-26T10:00:00.000Z"
    }
  ],
  "timestamp": "2025-01-26T10:00:00.000Z"
}
```

- Roles activos = usuarios con `isActive` y `role` en `userDatabase`
- `syncRolesToServer()` obtiene roles de `getUsers()` y los envía
- El servidor valida contra el contrato (allowedRoles vs usedRoles)

### Roles disponibles

| ID | Nombre |
|----|--------|
| owner | Owner |
| admin | Administrator |
| administrativo | Administrativo |
| manager | Manager |
| cashier | Cashier |
| mesero | Waiter |
| kitchen | Kitchen |
| bodega | Warehouse |

---

## 3. Dispositivos

### Estado actual

- No hay registro explícito de dispositivos en el código
- No hay modelo `Device` ni endpoint `device`
- Cada dispositivo usa el mismo `shopId` y sincroniza datos de tienda

### Lo que falta para “dispositivos con roles y keylock”

- **Registro de dispositivo**: asociar dispositivo a shop y rol
- **Keylock por dispositivo** (opcional): permitir passcode por dispositivo o por rol
- **Sincronización**: enviar lista de dispositivos al servidor

---

## 4. Resumen de endpoints

| Endpoint | Método | Datos clave |
|----------|--------|-------------|
| `POST /api/shop` | POST | storeName, unlockPassword, rolePermissions, gpsLocation |
| `PUT /api/shop/:shopId` | PUT | unlockPassword, rolePermissions, gpsLocation |
| `POST /api/shops/:shopId/roles/sync` | POST | roles (array de roles activos) |

---

## 5. Recomendaciones para implementar dispositivos

### Opción A: Modelo simple (sin dispositivo por rol)

- Mantener `unlockPassword` y `rolePermissions` globales por shop
- Cada dispositivo usa el mismo passcode y configuración de roles
- Usuario elige rol al iniciar sesión en el dispositivo

### Opción B: Modelo con dispositivos

1. **Modelo Device en servidor**:
   ```json
   {
     "deviceId": "uuid",
     "shopId": "shop123",
     "assignedRole": "cashier",
     "deviceName": "Caja 1",
     "unlockCode": "5678",  // opcional, por dispositivo
     "lastSeen": "2025-03-10T..."
   }
   ```

2. **App**:
   - Enviar `deviceId` al registrar/actualizar dispositivo
   - Enviar `assignedRole` y `unlockCode` si se usa
   - Endpoint: `POST /api/shops/:shopId/devices` o `PUT /api/shops/:shopId/devices/:deviceId`

3. **Configuración**:
   - En la sección de configuración, agregar “Dispositivos”
   - Lista de dispositivos con rol asignado y opcionalmente keylock por dispositivo

### Opción C: Usar solo keylock actual

- Mantener un solo passcode por shop
- Usar roles solo para visibilidad de menú (como ya está)
- No registrar dispositivos; solo validar roles contra contrato

---

## 6. Archivos relevantes

| Archivo | Función |
|---------|---------|
| `src/context/ConfigContext.tsx` | Guardado y carga de passcode |
| `src/components/UnifiedConfiguration.tsx` | UI passcode, roles y sync |
| `src/services/shopService.ts` | syncShopData, unlockPassword, rolePermissions |
| `src/services/roleMenuVisibilityService.ts` | Configuración de menú por rol |
| `src/services/roleSyncService.ts` | Sync de roles activos al servidor |
| `src/services/userDatabase.ts` | Usuarios y roles |
| `docs/BACKEND_ROLE_SYNC_MODEL.md` | Modelo de roles en backend |

---

**Versión**: 1.0  
**Fecha**: Marzo 2025
