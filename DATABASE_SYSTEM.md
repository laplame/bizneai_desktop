# Almacenamiento local y bases de datos — BizneAI POS

Documento alineado con el código actual. Para el mapa completo (MCP, ventas remotas, proxy y claves `localStorage`), ver **[docs/LOCAL_DATABASE_AND_API_SYNC.md](docs/LOCAL_DATABASE_AND_API_SYNC.md)**.

## Qué usa la aplicación hoy

### 1. `localStorage` (capa principal)

Casi todo el POS persiste en el **renderer** (navegador / ventana Electron) con claves `bizneai-*` y Merkle `@BizneAI_*`: productos, carrito, configuración de tienda, clientes del registro local, cocina, waitlist, roles / bloqueo de pantalla, impuestos, etc.

El **asistente de configuración (setup)** en Configuración guarda identificadores y opciones en `localStorage` (`bizneai-server-config`, `bizneai-store-identifiers`, `bizneai-store-config`, …). **No crea ni abre ningún archivo SQLite** durante el setup.

### 2. SQLite en el servidor Express (`better-sqlite3`) — actividad local

**Archivos:** `server/src/localActivityDb.ts`, rutas `server/src/routes/localActivityRoutes.ts`.

**Base de datos:** `server/data/local-activity.db` (se crea al usar la BD; modo WAL).

**Tablas:**

- `session_events` — eventos de bloqueo / desbloqueo (PIN, rol).
- `sale_cashier_events` — ventas asociadas a cajero / identidad de pantalla.

**Cuándo entra en juego:** solo cuando el proceso **Node** ejecuta la API local, p. ej. `npm run dev`, `npm run dev:server` o `tsx server/src/index.ts`. La primera operación que llama a `getLocalActivityDb()` abre el fichero y ejecuta `CREATE TABLE IF NOT EXISTS`.

El cliente escribe aquí **solo si** la UI corre con origen **localhost** y puede hacer `POST` a `http://localhost:3000/api/local-activity/*`. Siempre mantiene copia en `localStorage` como respaldo (`src/services/localActivityLog.ts`).

### 3. Módulo `src/database/database.ts` (no integrado en el flujo actual)

Define un `DatabaseManager` con **better-sqlite3** y rutas `bizneai.db` (desarrollo: cwd; producción: `userData` de Electron **si** se usara desde el proceso principal).

En la práctica:

- **No** está montado en `server/src/index.ts` (las rutas de `src/server/databaseRoutes.ts` no se registran en el servidor Express del proyecto).
- El hook **`useDatabase`** (`src/hooks/useDatabase.ts`) **no** llama a ese módulo: simula conexión y usa stubs (sin SQLite real en el renderer).
- **Electron** (`electron/main.js`) **no** inicializa esta base de datos ni arranca el servidor Express.

El esquema SQL que aparece más abajo describe lo que **implementaría** `database.ts` si se conectara; no es la fuente de verdad del POS en la build actual.

---

## Esquema legado (`src/database/database.ts`) — referencia

Si en el futuro se cablea este módulo desde un proceso Node/Electron adecuado, las tablas previstas incluyen:

**products** — catálogo local.

**sales** / **sale_items** — ventas e ítems.

**store_config** — configuración por tienda.

**inventory** — movimientos de inventario.

**backups** — metadatos de respaldos.

(Definiciones exactas en el propio `src/database/database.ts`, método `createTables`.)

---

## Contexto de tienda

**Archivo:** `src/contexts/StoreContext.tsx`.

Identificadores (`_id`, `clientId`, nombre, tipo de tienda) se sincronizan con `localStorage` (`bizneai-store-identifiers`) para uso en toda la UI. Esto complementa, no reemplaza, la documentación de sync remota en [LOCAL_DATABASE_AND_API_SYNC.md](docs/LOCAL_DATABASE_AND_API_SYNC.md).

---

## Instalación y ejecución de better-sqlite3

| Paso | Qué ocurre |
|------|------------|
| **`npm install`** | Instala el paquete `better-sqlite3` y, según plataforma, descarga **prebuild** o compila con `node-gyp` para el **Node** con el que ejecutaste el install. No abre ningún `.db` todavía. |
| **`npm run fix-deps`** (p. ej. antes de `dist:*`) | Ejecuta `electron-rebuild --only better-sqlite3` para alinear el binario nativo con **Electron** empaquetado. Útil para el **builder**; el servidor de desarrollo usa el **Node del sistema** (`tsx`), que normalmente usa el binario instalado con `npm install`. |
| **Arranque del servidor** (`server/src/index.ts`) | Carga rutas; **SQLite de actividad** se abre en la **primera** operación que invoque `getLocalActivityDb()` (p. ej. primer `POST` a `/api/local-activity/...`). |
| **Wizard de setup en la app** | Solo **localStorage**. No ejecuta `better-sqlite3`. |
| **App Electron en producción** (solo `dist` + ventana) | **No** arranca Express en `main.js`; salvo que ejecutes el servidor por separado, **no** se usa `local-activity.db` en esa sesión; la actividad queda en `localStorage`. |

---

## Resumen

- **Datos del día a día del POS:** `localStorage` (+ API remota para ventas y catálogo MCP).
- **SQLite activo en repo:** solo `server/data/local-activity.db` cuando corre el servidor Express.
- **`bizneai.db` en `database.ts`:** código presente, **no** conectado al flujo actual; **`useDatabase` no es una capa SQLite real**.

---

*Revisión: abril 2026 — coherente con [docs/LOCAL_DATABASE_AND_API_SYNC.md](docs/LOCAL_DATABASE_AND_API_SYNC.md).*
