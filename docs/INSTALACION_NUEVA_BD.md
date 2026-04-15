# Instalación nueva y actualización

## Regla principal

| Tipo | Borrar BD | Datos |
|------|------------|-------|
| **Instalación nueva** | Sí, siempre | Vacía |
| **Actualización** (nueva versión) | No | Se preservan |
| **Mismo inicio** (reabrir app) | No | Se preservan |

## Detección de instalación nueva

Se considera **instalación nueva** cuando no existe la clave `@BizneAI_app_installed` en AsyncStorage.

- En desinstalación normal (Android/iOS), el SO borra los datos de la app.
- En reinstalación, AsyncStorage está vacío, así que la clave no existirá.
- Si hay error al leer, se asume instalación nueva por seguridad.

**Ubicación:** `src/services/appInitializationService.ts` → `isFirstInstall()`

## Detección de actualización

Se considera **actualización** cuando existe `@BizneAI_app_version` en AsyncStorage y su valor es distinto de la versión actual (leída de `app.json`).

- La versión viene de `app.json` → `expo.version` para que coincida con el build.
- En actualización nunca se borra la BD; solo se ejecutan migraciones si aplican.

## Borrado de BD solo en instalación nueva

En instalación nueva se ejecuta `clearAllApplicationData()` antes de inicializar:

1. Productos (SQLite + AsyncStorage)
2. Usuarios
3. Ventas
4. Inventario
5. Fotos locales
6. Caché BizneAI Chat (MCP)
7. Resto de claves AsyncStorage

**Orden:** borrado → `initializeAppDatabases()` → `markAppAsInstalled()`.

## Usuario puede usar sus productos

El usuario puede usar el sistema con sus productos en cualquier estado (registrado, provisional, sin registro).

- En **actualización**: todos los datos se mantienen.
- Al borrar datos de tienda (`clearShopData`): los productos locales se mantienen.
- Solo en **instalación nueva** se borra toda la BD.

## Logs de verificación

En consola, en instalación nueva deberías ver:

```
[AppInit] Instalación nueva detectada (sin @BizneAI_app_installed)
[AppInit] 🆕 Nueva instalación detectada – borrando BD y todos los datos...
[ClearData] Starting complete data clearing process...
[ClearData] Clearing database tables...
[DB] Clearing all data...
[DB] Dropped products table
[DB] Recreated products table
...
[AppInit] ✅ BD y datos borrados – instalación nueva limpia
```
