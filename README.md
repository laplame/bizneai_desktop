# BizneAI POS

Sistema de punto de venta de escritorio (Electron + React) con servidor Express local, tickets virtuales, sincronización con backend BizneAI y modo offline con datos persistentes en el cliente.

## Características principales

### Punto de venta y catálogo
- Carrito, checkout, variantes de producto y productos por peso
- Escaneo de códigos de barras (Quagga)
- Gestión de productos e inventario, subida con imágenes (Cloudinary)
- Impuestos configurables (IVA, exenciones, precio con/sin impuesto por artículo)
- Clientes locales con registro de compras

### Pagos y tickets
- Múltiples métodos de pago (incluye integraciones vía API, p. ej. Stripe según configuración)
- Tickets virtuales y visualización de comprobantes
- Impresión térmica o diálogo del sistema en Electron (`electron-pos-printer`)

### Operación y seguridad
- Bloqueo de pantalla con roles y PIN
- Registro de ventas con cadena Merkle local y widget de bloques
- Recuperación de ventas ante cortes o errores
- Log de actividad local en SQLite (servidor) para caja / eventos

### Tienda y sincronización
- Datos de tienda y productos vía integración MCP (proxy en el servidor)
- Sincronización periódica y manual desde Configuración
- Modo offline: `localStorage` + reintentos cuando hay red

### Módulos adicionales
- Cocina y lista de espera (waitlist)
- Reportes de ventas
- Chat BizneAI (UI integrada)
- Interfaz multiidioma (i18next)

## Tecnologías

| Área | Stack |
|------|--------|
| Frontend | React 19, TypeScript, Vite 7, Lucide React, React Hot Toast, i18next |
| Backend | Node.js, Express 5, Socket.IO, Zod, Multer, better-sqlite3 / sqlite3 |
| Escritorio | Electron 40, electron-builder |
| Calidad | ESLint, TypeScript 5.8 |

## Requisitos

- **Node.js** 18 LTS o superior (incluye **npm**)
- **Git** (solo para clonar el repositorio en desarrollo)

### Instalar Node.js antes del proyecto (desarrollo o build local)

Sigue estos pasos **en el orden indicado** en la máquina donde vas a ejecutar `npm install` o generar el instalador.

#### Windows

1. Abre [https://nodejs.org](https://nodejs.org) y descarga el instalador **LTS** (recomendado, p. ej. «20.x LTS»).
2. Ejecuta el `.msi`. Acepta la licencia.
3. En el asistente, deja marcada la opción **«Add to PATH»** / **«añadir al PATH»** (viene activada por defecto).
4. Completa la instalación con las opciones por defecto (incluye **npm**).
5. **Cierra sesión en Windows o reinicia el PC** para que el PATH se aplique en todas las aplicaciones.
6. Abre **Símbolo del sistema** o **PowerShell** y comprueba:
   ```cmd
   node -v
   npm -v
   ```
   Deben mostrarse números de versión (por ejemplo `v20.x.x` y `10.x.x`). Si dice que no reconoce el comando, repite el paso 5 o revisa la instalación.

#### macOS

1. Descarga el instalador **LTS** desde [https://nodejs.org](https://nodejs.org) (paquete `.pkg`) o usa Homebrew: `brew install node@20` (ajusta la versión si tu equipo lo requiere).
2. Completa el instalador y abre **Terminal**:
   ```bash
   node -v
   npm -v
   ```

#### Linux (Debian/Ubuntu ejemplo)

```bash
# Opción recomendada: NodeSource o paquete oficial según tu distro
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

---

## Instalación del proyecto (desarrollo)

Con **Node ya instalado** y verificado (`node -v`):

1. **Clonar** el repositorio (o `git pull` si ya lo tienes):
   ```bash
   git clone https://github.com/bizneai/pos-system.git
   cd pos-system
   ```
   Si tu carpeta se llama distinto (p. ej. `bizneai_desktop`), entra con `cd bizneai_desktop`.

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Arrancar en desarrollo** (elige una opción más abajo en esta misma sección).

### Desarrollo (web + API local)

```bash
npm run dev
```

Arranca Vite (puerto 5173) y el servidor Express (puerto 3000) en paralelo.

### Aplicación Electron

**Recomendado — todo en uno:**

```bash
npm run electron:dev
```

Equivalente:

```bash
npm run start:all
```

**Solo Electron** (con `npm run dev` ya corriendo en otra terminal, o tras `npm run build`):

```bash
npm run electron
```

**Atajo** (solo cliente Vite + Electron, sin servidor local):

```bash
npm run electron:dev:pos
```

### Build de producción (solo frontend)

```bash
npm run build
npm run preview   # vista previa del build estático
```

## Instaladores por plataforma

```bash
npm run dist:mac     # macOS (DMG / ZIP)
npm run dist:win     # Windows (NSIS / portable); en Mac puede fallar por nativos → CI
npm run dist:linux   # Linux (AppImage / deb)
```

> En macOS, el build de Windows suele fallar por módulos nativos (`better-sqlite3`, etc.). Usa [GitHub Actions](#build-automático-con-github-actions) en un runner Windows.

## Build automático con GitHub Actions

Workflows de CI generan artefactos para Windows y Linux:

- **Build Windows (PC)** — instalador / portable Windows
- **Build Linux** — AppImage y `.deb`

Se disparan en push y PR hacia `main` o `master`, y pueden ejecutarse manualmente desde la pestaña **Actions**.

**Descargar build Windows:** Actions → workflow **Build Windows (PC)** → ejecución → artefacto **BizneAI-POS-Windows**.

**Descargar build Linux:** Actions → **Build Linux** → artefacto **BizneAI-POS-Linux**.

Guía detallada: [docs/BUILD-LINUX.md](docs/BUILD-LINUX.md).

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Vite + servidor Express en watch (`tsx`) |
| `npm run dev:client` | Solo Vite |
| `npm run dev:server` | Solo API |
| `npm run dev:full` | `dev` + Electron cuando 5173 y 3000 están listos |
| `npm run build` | `tsc -b` + `vite build` |
| `npm run build:server` | Empaqueta el API Express a `dist-backend/bizneai-server.cjs` (Electron embebido) |
| `npm run lint` | ESLint |
| `npm run electron:dev` | Desarrollo completo con Electron |
| `npm run fix-deps` | Ajuste de dependencias (p. ej. antes de `dist:*`) |
| `npm run dist:*` | Incluye bump de versión y build de instalador |

Los scripts `dist:*` y `npm start` ejecutan también `build:server` para incluir el API en el instalador. Ver `package.json`.

## Modo offline / standalone

- **Caché rápida:** productos y ajustes siguen en `localStorage` para la UI.
- **Persistencia local:** con el API en `http://127.0.0.1:3000`, SQLite guarda un espejo vía `/api/pos/kv` (`pos-local-store.sqlite`, `local-activity.db`, `bizneai.db` en la carpeta de datos del usuario cuando Electron define `BIZNEAI_USER_DATA`).
- Al **guardar la configuración** (setup), se llama a `POST /api/pos/init` y se suben claves críticas al SQLite del equipo.
- En **Electron empaquetado**, el proceso principal arranca el bundle `dist-backend/bizneai-server.cjs` si el puerto 3000 está libre. Con `npm run electron:dev`, sigue usándose el servidor de `npm run dev` en paralelo.
- Con conexión, la sincronización remota (MCP / ventas) se hace como antes desde **Configuración** y el flujo de ventas.

## Node.js, API embebida y puerto 3000

La aplicación **no** requiere instalar SQLite ni otro motor de base de datos aparte: los ficheros SQLite se crean solos en la carpeta de datos del usuario cuando el API local está en marcha. Ese API es un **servicio HTTP** en **`http://127.0.0.1:3000`** (Express + `better-sqlite3` empaquetado en `dist-backend/bizneai-server.cjs`).

### ¿Por qué hace falta Node y no «se instala solo»?

- **No** intentamos instalar Node.js en el sistema (MSI silencioso, permisos de administrador, conflictos de versión y antivirus). Eso sería frágil y poco transparente para el usuario final.
- Lo que sí podemos hacer es **incluir el ejecutable de Node dentro del instalador** del POS: carpeta `embedded-node/` (por ejemplo `node.exe` en Windows). Al arrancar, Electron usa **primero** ese binario si existe; si no, intenta el comando **`node` del PATH** (desarrollo o equipos donde ya instalaron Node a mano).

Instrucciones para empaquetar ese binario: [embedded-node/README.md](embedded-node/README.md).

### Resumen para quien instala el POS en la tienda

| Situación | Qué necesita el usuario |
|-----------|-------------------------|
| Instalador **con** `embedded-node/node.exe` (o `node` en macOS/Linux) | **Nada más**: no hace falta instalar Node aparte. |
| Instalador **sin** Node embebido | Instalar **Node.js LTS** siguiendo los pasos de abajo, luego abrir de nuevo el POS. |

Sin API en `:3000` verás errores de red (p. ej. «Failed to fetch») en la consola SQLite o en funciones que dependan del servidor local.

### Pasos en la tienda: instalar Node.js en Windows (solo si hace falta)

Usa esta lista **solo** si el instalador del POS **no** trae Node embebido y la app no carga bien datos locales / consola BD (síntomas de API caído).

1. Descarga **Node.js LTS** desde [https://nodejs.org](https://nodejs.org) (botón verde «LTS»).
2. Ejecuta el instalador `.msi` como administrador si Windows lo pide.
3. Asegúrate de que quede marcado **añadir Node.js al PATH**.
4. Finaliza el asistente y **reinicia el PC** o **cierra sesión y vuelve a entrar**.
5. Comprueba en **cmd** (Win+R → `cmd`):
   ```cmd
   node -v
   ```
   Si muestra una versión (p. ej. `v20.x.x`), está bien.
6. Abre **BizneAI POS** de nuevo desde el acceso directo o el menú Inicio.

**Orden recomendado:** primero Node (pasos 1–5), **después** el POS ya instalado; si el POS ya estaba instalado, no hace falta reinstalarlo, solo reiniciar tras instalar Node.

### Pasos en la tienda: macOS o Linux (solo si hace falta)

1. Instala Node **LTS** desde [nodejs.org](https://nodejs.org) (instalador `.pkg` en Mac) o el gestor de paquetes de tu distro.
2. En Terminal: `node -v` debe mostrar versión.
3. Vuelve a abrir BizneAI POS.

### Dónde se hace el build (git pull vs carpeta de instalación)

- **Generar el instalador (.exe, .dmg, etc.)** se hace en una **carpeta de proyecto / clone del repositorio** en tu máquina de desarrollo o en **CI (GitHub Actions)**:
  1. `git pull` (o clonar) para tener el código actualizado.
  2. `npm install`
  3. `npm run build` y **`npm run build:server`** (el API embebido va a `dist-backend/`)
  4. Opcional: copiar Node portátil a `embedded-node/` según [embedded-node/README.md](embedded-node/README.md)
  5. `npm run dist:win` / `dist:mac` / etc.

- **No** se construye el instalador desde `C:\Program Files\...` ni desde la carpeta donde el usuario final instaló la app: ahí solo están los binarios ya compilados.

- El **usuario final** en la tienda solo ejecuta el **instalador descargado** (releases o artefacto de Actions); no necesita Git ni esta carpeta del repo.

### Otros requisitos

1. **`build:server`** antes de empaquetar: los scripts `dist:*` y `npm start` suelen encadenarlo; sin `dist-backend/bizneai-server.cjs` el API no existe dentro del paquete.

2. **Puerto 3000 libre** en el PC de la tienda. Si otro programa lo usa, el arranque falla. En Windows: `netstat -ano | findstr :3000` en **cmd** o Monitor de recursos → Red.

Para más detalle del almacenamiento y sync: [docs/LOCAL_DATABASE_AND_API_SYNC.md](docs/LOCAL_DATABASE_AND_API_SYNC.md).

## Estructura del proyecto

```
bizneai_desktop/
├── src/
│   ├── components/     # UI React (POS, informes, ajustes, bloqueo, Merkle, etc.)
│   ├── api/            # Cliente HTTP hacia API local / remota
│   ├── services/       # Impresión, Merkle, actividad local, clientes, roles/bloqueo
│   ├── contexts/       # Estado global (p. ej. tienda)
│   ├── utils/          # Sync, impuestos, shop ID, Merkle helpers, etc.
│   ├── types/          # Tipos TypeScript
│   └── i18n/           # Traducciones
├── server/src/
│   ├── routes/         # REST (productos, tickets, MCP proxy, actividad local, …)
│   ├── middleware/
│   └── schemas/
├── electron/           # main, preload, ventana
├── embedded-node/      # opcional: node.exe / node portátil para el instalador (sin PATH)
├── scripts/            # build, iconos, fix-deps, bump-version
├── public/
└── build/              # Recursos electron-builder (iconos, entitlements)
```

## Solución de problemas

### «Failed to fetch», consola BD vacía o API local en Windows

1. Si el instalador **no** incluye Node embebido, sigue los **[pasos numerados para Windows en tienda](#pasos-en-la-tienda-instalar-nodejs-en-windows-solo-si-hace-falta)** (más abajo en la misma página).
2. Revisa **[Node.js, API embebida y puerto 3000](#nodejs-api-embebida-y-puerto-3000)** (`build:server` al empaquetar, puerto 3000 libre).

### Error `Cannot find module 'call-bind-apply-helpers'` (u otros módulos)

```bash
npm run fix-deps
npm run dist:mac
```

### Limpieza profunda

```bash
rm -rf node_modules package-lock.json
npm install
npm run fix-deps
```

### Windows desde macOS

Usar GitHub Actions (sección arriba); no depender de compilación cruzada de módulos nativos.

## Documentación

- [CHANGELOG.md](CHANGELOG.md)
- [docs/BUILD-LINUX.md](docs/BUILD-LINUX.md)
- [docs/backend-impuestos-producto.md](docs/backend-impuestos-producto.md)
- [docs/LOCAL_DATABASE_AND_API_SYNC.md](docs/LOCAL_DATABASE_AND_API_SYNC.md) — almacenamiento local (`localStorage`, SQLite del servidor), MCP, ventas y proxy
- [API_ENDPOINTS.md](API_ENDPOINTS.md)
- [INSTALLERS.md](INSTALLERS.md)
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- [DATABASE_SYSTEM.md](DATABASE_SYSTEM.md)

## Contribuir

1. Fork del repositorio
2. Rama de feature: `git checkout -b feature/nombre`
3. Commits y push
4. Abrir un Pull Request hacia `main`

## Licencia

MIT — ver [LICENSE](LICENSE).

## Soporte

- **Incidencias:** [GitHub Issues](https://github.com/bizneai/pos-system/issues) (ajusta la URL si usas un fork u org distinta)

---

BizneAI Team — versión **1.0.11** (abril 2026)
