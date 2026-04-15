# BizneAI POS

Aplicación de punto de venta para escritorio (**Electron** + **React**) con servidor **Express** local, tickets virtuales, sincronización con el backend BizneAI y modo offline con datos persistentes en el cliente.

## Características principales

### Punto de venta y catálogo

- Carrito, checkout, variantes y productos por peso
- Escaneo de códigos de barras (Quagga)
- Gestión de productos e inventario; imágenes vía Cloudinary
- Impuestos configurables (IVA, exenciones, precio con o sin impuesto por artículo)
- Clientes locales con historial de compras

### Pagos y tickets

- Varios métodos de pago (incluye integraciones por API, p. ej. Stripe según configuración)
- Tickets virtuales y visualización de comprobantes
- Impresión térmica o cuadro de diálogo del sistema en Electron (`electron-pos-printer`)

### Operación y seguridad

- Bloqueo de pantalla con roles y PIN
- Registro de ventas con cadena Merkle local y widget de bloques
- Recuperación de ventas ante cortes o errores
- Registro de actividad en SQLite (servidor) para caja y eventos

### Tienda y sincronización

- Datos de tienda y productos mediante integración MCP (proxy en el servidor)
- Sincronización periódica y manual desde Configuración
- Modo offline: `localStorage` y reintentos cuando vuelve la red

### Módulos adicionales

- Cocina y lista de espera (waitlist)
- Reportes de ventas
- Chat BizneAI (interfaz integrada)
- Interfaz multiidioma (i18next)

## Tecnologías

| Área | Stack |
|------|--------|
| Frontend | React 19, TypeScript, Vite 7, Lucide React, React Hot Toast, i18next |
| Backend | Node.js, Express 5, Socket.IO, Zod, Multer, better-sqlite3 / sqlite3 |
| Escritorio | Electron 40, electron-builder |
| Calidad | ESLint, TypeScript 5.8 |

## Requisitos

- **Node.js** 18 LTS o superior (incluye **npm**) para desarrollo habitual (`npm run dev`, etc.).
- Para generar **`BizneAI-Local-API-Backend.exe`** en Windows (empaquetado con `pkg`), usa **Node.js 24.14.1 LTS** — misma versión que CI y el archivo **`.nvmrc`** en la raíz; detalle en [Crear los ejecutables en Windows](#crear-los-ejecutables-en-windows-paso-a-paso-desde-el-código).
- **Git** (solo si vas a clonar el repositorio para desarrollo)

### Instalar Node.js antes del proyecto (desarrollo o build local)

En la máquina donde ejecutarás `npm install` o generarás el instalador, sigue estos pasos **en orden**.

#### Windows

1. Entra en [nodejs.org](https://nodejs.org) y descarga el instalador **LTS** (p. ej. **24.x**). Para el **API como .exe** (`build:local-api-exe`), instala **24.14.1** o usa [nvm-windows](https://github.com/coreybutler/nvm-windows) con la versión del **`.nvmrc`**.
2. Ejecuta el `.msi` y acepta la licencia.
3. Deja activada la opción **Add to PATH** / **añadir al PATH** (suele venir marcada).
4. Completa la instalación con las opciones por defecto (incluye **npm**).
5. **Cierra sesión o reinicia el equipo** para que el PATH quede aplicado en todas las aplicaciones.
6. Abre **Símbolo del sistema** o **PowerShell** y comprueba:
   ```cmd
   node -v
   npm -v
   ```
   Deberías ver versiones (p. ej. `v20.x.x` y `10.x.x`). Si el comando no se reconoce, repite el paso 5 o revisa la instalación.

#### macOS

1. Descarga el instalador **LTS** desde [nodejs.org](https://nodejs.org) (`.pkg`) o instala con Homebrew: `brew install node@20` (ajusta la versión si tu entorno lo requiere).
2. Tras instalar, abre **Terminal** y ejecuta:
   ```bash
   node -v
   npm -v
   ```

#### Linux (ejemplo Debian/Ubuntu)

```bash
# Ejemplo con NodeSource; usa el método oficial que prefiera tu distribución
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

---

## Instalación del proyecto (desarrollo)

Con **Node instalado** y comprobado (`node -v`):

1. **Clona** el repositorio (o haz `git pull` si ya lo tienes):
   ```bash
   git clone https://github.com/bizneai/pos-system.git
   cd pos-system
   ```
   Si la carpeta tiene otro nombre (p. ej. `bizneai_desktop`), entra con `cd bizneai_desktop`.

2. **Instala dependencias:**
   ```bash
   npm install
   ```

3. **Arranca en desarrollo** (elige una opción en las subsecciones siguientes).

### Desarrollo (web + API local)

```bash
npm run dev
```

Levanta **Vite** (puerto 5173) y el servidor **Express** (puerto 3000) a la vez.

### Aplicación Electron

**Recomendado (todo en uno):**

```bash
npm run electron:dev
```

Equivalente:

```bash
npm run start:all
```

**Solo Electron** (con `npm run dev` en otra terminal, o después de `npm run build`):

```bash
npm run electron
```

**Atajo:** solo cliente Vite + Electron, sin levantar el servidor local:

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
npm run dist:win     # Windows (NSIS / portable + API .exe solo en Windows); en Mac/Linux el .exe del API se omite; el build del front puede fallar por nativos → usar CI
npm run dist:linux   # Linux (AppImage / deb)
```

### Windows: instalar ambos — Win Setup y servidor de base de datos (API local)

En un PC de tienda con **Windows** intervienen **dos componentes**, que instalas o despliegas por separado:

| Pieza | Función | Archivo o resultado |
|--------|---------|------------------------|
| **Servidor BD** (API local) | Escucha en `http://127.0.0.1:3000` y persiste en **SQLite** (POS KV, actividad, etc.). Sin él no hay persistencia local completa. | `BizneAI-Local-API-Backend.exe`, o la carpeta portable generada con `npm run pack:local-api` (ver [standalone-local-api/LEEME.txt](standalone-local-api/LEEME.txt)). |
| **Win Setup** (front) | Instalador **NSIS** de la aplicación **Electron** (interfaz del POS). | `BizneAI-POS-Front-<versión>-Setup.exe` (o el `.exe` portable equivalente). |

**Orden recomendado:** primero el **servidor BD** (en ejecución y con [http://127.0.0.1:3000/health](http://127.0.0.1:3000/health) respondiendo bien), después el **Win Setup** del POS. Si el puerto 3000 ya está ocupado por el API, el POS **no** levanta un segundo servidor: reutiliza el existente.

**Resumen:** obtén ambos artefactos desde CI ([Build Windows](#build-automático-con-github-actions)) o, en **Windows** con Node, con `npm run dist:win` (front + `BizneAI-Local-API-Backend.exe`; en otros SO el script omite el `.exe` del API). Deja el API en una ruta fija; ejecuta el `.exe` del API (o los `.bat` del paquete portable); instala el **Setup** del front y abre el POS. Para arranque automático del API, usa los scripts de `standalone-local-api/` (detalle en [LEEME.txt](standalone-local-api/LEEME.txt)).

Guía detallada en la misma máquina: [Windows en la tienda: usar el POS y el API local en el mismo PC](#windows-en-la-tienda-usar-el-pos-y-el-api-local-en-el-mismo-pc).

**Generación de los dos `.exe` en Windows (resumen):**

- **Front (Electron):** `npm run dist:win:front` → en `release/`: `BizneAI-POS-Front-<versión>-Setup.exe` (NSIS) y `BizneAI-POS-Front-<versión>-Portable.exe`.
- **API local (un solo .exe):** `npm run build:local-api-exe` → `release/BizneAI-Local-API-Backend.exe` (Node embebido con `pkg`; en tienda no hace falta instalar Node).
- **Ambos a la vez (recomendado en Windows):** `npm run dist:win` (equivale a `dist:win:front` + `build:local-api-exe`; alias retrocompatible: `dist:win:all`).

Si el API ya usa el puerto 3000, el POS reutiliza ese servicio y no inicia otro servidor.

> En macOS, el build de Windows a menudo falla por módulos nativos (`better-sqlite3`, etc.). Conviene usar [GitHub Actions](#build-automático-con-github-actions) con un runner Windows.

### Crear los ejecutables en Windows (paso a paso, desde el código)

Hazlo en un PC **Windows x64** con el repositorio clonado y una terminal (PowerShell o **cmd** como administrador solo si hace falta para enlaces simbólicos de `npm`).

#### 1. Requisitos

| Requisito | Notas |
|-----------|--------|
| **Node.js 24.14.1 LTS** | Para **`npm run build:local-api-exe`** y **`npm run pack:local-api`**: el `.exe` del API embebe la misma línea que **@yao-pkg/pkg** (base **v24.14.1**); `better-sqlite3` debe instalarse con la **misma ABI** (`NODE_MODULE_VERSION` **137**). Si tienes **Node 25** u otra versión, instala **24.14.1** aparte (p. ej. [nvm-windows](https://github.com/coreybutler/nvm-windows): `nvm install 24.14.1`, `nvm use 24.14.1`) solo al compilar el API. En la raíz hay **`.nvmrc`** con `24.14.1` → `nvm use` (Unix) o el equivalente en Windows. |
| **npm** | Viene con Node; `npm ci` en CI o `npm install` en local. |
| **Git** y espacio en disco | El build de Electron y dependencias ocupa varios GB. |
| **Iconos** | Antes del instalador: `npm run generate-icons` (el workflow de GitHub Actions también lo ejecuta). |

Para el **solo front** (`dist:win:front`), suele bastar con Node 20+ y `npm run fix-deps`; para el **`.exe` del API** (incluido en `dist:win` en Windows), mantén **Node 24.14.1** activo en los pasos que generan `standalone-local-api\node_modules` y el binario `pkg`.

#### 2. Instalar dependencias del proyecto

En la **raíz** del repo:

```bash
git clone <url-del-repo>
cd bizneai_desktop
npm install
```

(O `npm ci` si copias `package-lock.json` íntegro y quieres un árbol reproducible.)

#### 3. Generar **ambos** `.exe` (recomendado)

Con **Node 24.14.1** activo (`node -v` → `v24.14.1`):

```bash
npm run generate-icons
npm run dist:win
```

Eso ejecuta, en orden: ajuste de dependencias nativas, build del cliente, bundle del servidor, **electron-builder** (front) y empaquetado **pkg** del API. Los artefactos quedan en **`release/`**, entre otros:

- `BizneAI-POS-Front-<versión>-Setup.exe`, `BizneAI-POS-Front-<versión>-Portable.exe`
- `BizneAI-Local-API-Backend.exe`
- `win-unpacked\`, `latest.yml`, etc. (metadatos del front)

Los scripts `dist:*` incluyen **bump de versión** en `package.json` (script `bump-version`); si no quieres subir versión en cada prueba, revisa `package.json` o usa solo los subpasos de la siguiente tabla.

#### 4. Generar **solo** el front o **solo** el API

| Objetivo | Comando (Windows, raíz del repo) |
|----------|-----------------------------------|
| Solo instalador / portable **Electron** | `npm run dist:win:front` |
| Solo carpeta **portable del API** (Node + `start.cjs`, sin `.exe` único) | `npm run pack:local-api` → `release/bizneai-local-api-portable\` |
| Solo **`BizneAI-Local-API-Backend.exe`** | Con **Node 24.14.1**: `npm run build:local-api-exe` (ya incluye `pack:local-api`) |

#### 5. Si el API `.exe` falla al usar SQLite (`NODE_MODULE_VERSION` / `ERR_DLOPEN_FAILED`)

Significa que `better-sqlite3` se compiló para otra versión de Node que la que lleva el `.exe` embebido.

1. Activa **Node 24.14.1 LTS** (`nvm use 24.14.1` o `nvm use` leyendo `.nvmrc`).
2. Borra módulos y caché de `pkg` y vuelve a empaquetar:

   ```text
   rmdir /s /q standalone-local-api\node_modules
   rmdir /s /q %USERPROFILE%\.cache\pkg
   npm run build:local-api-exe
   ```

3. Sustituye el `.exe` antiguo por el nuevo en la carpeta de despliegue.

Más contexto: [standalone-local-api/LEEME.txt](standalone-local-api/LEEME.txt).

#### 6. Sin generar el `.exe` del API (solo Node 25 u otra versión)

Puedes seguir usando **`npm run pack:local-api`** y en tienda la carpeta **`bizneai-local-api-portable`** con **`iniciar-api-local.bat`** y el **Node** que tengas instalado (la ABI coincide con ese Node). El `.exe` único **sí** exige **Node 24.14.1** (o la versión fijada en `.nvmrc`) en la máquina que compila.

#### 7. Alternativa: no compilar en local

Descarga el artefacto **[Build Windows (PC)](#build-automático-con-github-actions)** (zip con `release/`). El workflow usa **Node 24.14.1** y genera front + `BizneAI-Local-API-Backend.exe`.

### Windows en la tienda: usar el POS y el API local en el mismo PC

En un solo equipo hacen falta el **API** (puerto 3000, SQLite y persistencia) y el **POS** (Electron). El POS comprueba si `:3000` está en uso; si es así, **no** abre un segundo servidor.

#### 1. Obtener los instalables

- **Desde CI:** descarga el artefacto [Build Windows (PC)](#build-automático-con-github-actions) y descomprime `release/`. Incluirá, entre otros, `BizneAI-POS-Front-<versión>-Setup.exe` (o el portable) y `BizneAI-Local-API-Backend.exe`.
- **Desde el código en Windows:** sigue [Crear los ejecutables en Windows (paso a paso, desde el código)](#crear-los-ejecutables-en-windows-paso-a-paso-desde-el-código) (`npm install`, **Node 24.14.1** para el API `.exe`, `npm run dist:win` o los comandos por partes).

#### 2. Instalar o colocar el API local

- **Opción A — un solo `.exe`:** copia `BizneAI-Local-API-Backend.exe` a una carpeta estable (p. ej. `C:\BizneAI\api\`). La primera ejecución creará `data\` junto al ejecutable para SQLite y demás archivos (salvo que uses `BIZNEAI_USER_DATA`).
- **Opción B — paquete portable con Node:** si usas `release/bizneai-local-api-portable/` (tras `npm run pack:local-api`), copia la carpeta completa y sigue [standalone-local-api/LEEME.txt](standalone-local-api/LEEME.txt) (`.bat`, Node portable en `node\`, etc.).

#### 3. Arrancar el API antes que el POS

1. Ejecuta **BizneAI-Local-API-Backend.exe** (o `iniciar-api-local.bat` en el paquete portable).
2. En el navegador, abre [http://127.0.0.1:3000/health](http://127.0.0.1:3000/health): debe responder JSON con estado correcto.
3. Si no responde, comprueba que **ningún otro programa** use el puerto 3000 y que el firewall permita conexiones locales al proceso del API.

#### 4. Instalar y abrir el POS

1. Ejecuta el instalador **BizneAI-POS-Front-…-Setup.exe** (o el `.exe` portable).
2. Abre el POS. La aplicación usará `http://127.0.0.1:3000` para datos locales; si el API ya está en marcha, el POS **reutiliza** ese servicio.

#### 5. Uso diario y arranque automático

- **Al encender el PC:** conviene iniciar primero el API y después el POS (o dejar el API en una tarea de inicio).
- Para que el **API** arranque al iniciar sesión o con Windows, usa los scripts de `standalone-local-api/` (`instalar-inicio-sesion-windows.bat`, `instalar-arranque-equipo-windows.bat`, etc.). Más información en [standalone-local-api/LEEME.txt](standalone-local-api/LEEME.txt).

#### 6. Desarrollo en el mismo PC (código fuente)

Si trabajas con el repositorio clonado en lugar de los `.exe`:

```bash
npm install
npm run dev
```

Eso levanta Vite (5173) y el API (3000). En otra terminal, `npm run electron:dev` abre Electron. No necesitas el `.exe` del API mientras `npm run dev` mantenga el puerto 3000 activo.

## Build automático con GitHub Actions

Los workflows de CI generan artefactos para Windows y Linux:

- **Build Windows (PC):** instalador o portable de Electron más `BizneAI-Local-API-Backend.exe` (API independiente).
- **Build Linux:** AppImage y `.deb`.

Se ejecutan en push y PR hacia `main` o `master`, y también manualmente desde la pestaña **Actions**.

**Descargar build Windows:** Actions → workflow **Build Windows (PC)** → ejecución concreta → artefacto **BizneAI-POS-Windows** (carpeta `release/` con los `.exe` del front y del API).

**Descargar build Linux:** Actions → **Build Linux** → artefacto **BizneAI-POS-Linux**.

Guía ampliada: [docs/BUILD-LINUX.md](docs/BUILD-LINUX.md).

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Vite + servidor Express en modo watch (`tsx`) |
| `npm run dev:client` | Solo Vite |
| `npm run dev:server` | Solo API |
| `npm run dev:full` | `dev` + Electron cuando 5173 y 3000 están listos |
| `npm run build` | `tsc -b` + `vite build` |
| `npm run build:server` | Empaqueta el API Express en `dist-backend/bizneai-server.cjs` (para Electron embebido) |
| `npm run pack:local-api` | Genera un **paquete portable solo del API** (Node + dependencias + bundle) en `release/bizneai-local-api-portable/` para ejecutarlo aparte del POS (ver `standalone-local-api/LEEME.txt`) |
| `npm run build:local-api-exe` | Solo **Windows:** empaqueta el API en `release/BizneAI-Local-API-Backend.exe` (tras `pack:local-api`; incluye `better-sqlite3` win32) |
| `npm run dist:win:front` | Instalador/portable **Electron** (sin generar el `.exe` del API) |
| `npm run dist:win` | Tras el front, en **Windows** ejecuta `build:local-api-exe`; en otros SO omite el API con mensaje (dos `.exe` en `release/` solo en Windows) |
| `npm run dist:win:all` | Alias de `dist:win` |
| `npm run lint` | ESLint |
| `npm run electron:dev` | Desarrollo completo con Electron |
| `npm run fix-deps` | Ajuste de dependencias (p. ej. antes de `dist:*`) |
| `npm run dist:*` | Incluye bump de versión y generación del instalador |

Los scripts `dist:*` y `npm start` suelen ejecutar también `build:server` para incluir el API en el instalador. Consulta `package.json` para el detalle.

## Modo offline / standalone

- **Caché en cliente:** productos y ajustes pueden permanecer en `localStorage` para la interfaz.
- **Persistencia local:** con el API en `http://127.0.0.1:3000`, SQLite mantiene un espejo vía `/api/pos/kv` (`pos-local-store.sqlite`, `local-activity.db`, `bizneai.db` en la carpeta de datos del usuario cuando Electron define `BIZNEAI_USER_DATA`).
- Al **guardar la configuración** (setup), se llama a `POST /api/pos/init` y se escriben claves importantes en el SQLite del equipo.
- En **Electron empaquetado**, el proceso principal arranca el bundle `dist-backend/bizneai-server.cjs` si el puerto 3000 está libre. Con `npm run electron:dev`, se usa el servidor de `npm run dev` en paralelo.
- **Solo servidor (sin Electron):** `npm run pack:local-api` produce una carpeta lista para copiar en tienda (`release/bizneai-local-api-portable/`). En Windows: `iniciar-api-local.bat` para arranque manual; **`instalar-inicio-sesion-windows.bat`** registra el API al iniciar sesión; **`ejecutar-api-con-reintento.cmd`** lo reinicia si cae. Para arranque al encender el equipo (como administrador): `instalar-arranque-equipo-windows.bat`. Detalles en `standalone-local-api/LEEME.txt`. Los datos suelen ir en `data\` (o la ruta de `BIZNEAI_USER_DATA`).
- Con red, la sincronización remota (MCP / ventas) sigue el flujo habitual desde **Configuración** y las ventas.

## Node.js, API embebida y puerto 3000

No hace falta instalar SQLite ni otro motor aparte: los ficheros SQLite se crean al usar el API local en la carpeta de datos del usuario. Ese API es un **servicio HTTP** en **`http://127.0.0.1:3000`** (Express + `better-sqlite3` empaquetado en `dist-backend/bizneai-server.cjs`).

### ¿Por qué Node no se «instala solo» en el sistema?

- **No** instalamos Node con un MSI silencioso: implicaría permisos de administrador, riesgos de versión y fricción con antivirus. Sería poco fiable y poco claro para el usuario final.
- Lo que sí hacemos es **incluir el ejecutable de Node en el paquete** del POS: carpeta `embedded-node/` (p. ej. `node.exe` en Windows). Al arrancar, Electron prueba **primero** ese binario; si no existe, usa el comando **`node` del PATH** (desarrollo o equipos con Node instalado a mano).

Instrucciones para empaquetar ese binario: [embedded-node/README.md](embedded-node/README.md).

### Resumen para quien instala el POS en tienda

| Situación | Qué necesita el usuario |
|-----------|-------------------------|
| Instalador **con** `embedded-node/node.exe` (o `node` en macOS/Linux) | **Nada más:** no requiere instalar Node por separado. |
| Instalador **sin** Node embebido | Instalar **Node.js LTS** según los pasos siguientes y volver a abrir el POS. |

Si no hay API en `:3000`, pueden aparecer errores de red (p. ej. «Failed to fetch») en la consola SQLite o en funciones que dependan del servidor local.

### Pasos en la tienda: instalar Node.js en Windows (solo si hace falta)

Usa esta lista **solo** si el instalador del POS **no** incluye Node embebido y ves fallos al cargar datos locales o la consola de BD (síntomas de API caído).

1. Descarga **Node.js LTS** desde [nodejs.org](https://nodejs.org) (botón «LTS»).
2. Ejecuta el `.msi` como administrador si Windows lo solicita.
3. Marca **añadir Node.js al PATH**.
4. Finaliza el asistente y **reinicia** o **cierra sesión y vuelve a entrar**.
5. En **cmd** (Win+R → `cmd`), comprueba:
   ```cmd
   node -v
   ```
   Debe mostrar una versión (p. ej. `v20.x.x`).
6. Abre **BizneAI POS** de nuevo desde el acceso directo o el menú Inicio.

**Orden:** primero Node (pasos 1–5) y, si el POS ya estaba instalado, basta con reiniciar tras instalar Node; no suele ser necesario reinstalar el POS.

### Pasos en la tienda: macOS o Linux (solo si hace falta)

1. Instala Node **LTS** desde [nodejs.org](https://nodejs.org) (`.pkg` en Mac) o con el gestor de paquetes de tu distro.
2. En la terminal, `node -v` debe mostrar una versión.
3. Vuelve a abrir BizneAI POS.

### Dónde se hace el build (repositorio vs carpeta instalada)

- **Generar el instalador** (`.exe`, `.dmg`, etc.) se hace en un **clone del repositorio** en tu máquina de desarrollo o en **CI (GitHub Actions)**:
  1. `git pull` (o clonar) para tener el código al día.
  2. `npm install`
  3. `npm run build` y **`npm run build:server`** (el API embebido queda en `dist-backend/`)
  4. Opcional: copiar Node portátil a `embedded-node/` según [embedded-node/README.md](embedded-node/README.md)
  5. `npm run dist:win`, `dist:mac`, etc.

- **No** generes el instalador desde `C:\Program Files\...` ni desde la carpeta donde el usuario final instaló la app: allí solo están los binarios ya compilados.

- El **usuario final** ejecuta el **instalador descargado** (releases o artefacto de Actions); no necesita Git ni el repositorio.

### Otros requisitos

1. Ejecutar **`build:server`** antes de empaquetar: los scripts `dist:*` y `npm start` suelen encadenarlo; sin `dist-backend/bizneai-server.cjs` el API no va dentro del paquete.

2. **Puerto 3000 libre** en el PC de tienda. Si otro proceso lo usa, el arranque fallará. En Windows: `netstat -ano | findstr :3000` en **cmd** o Monitor de recursos → Red.

Más detalle sobre almacenamiento y sincronización: [docs/LOCAL_DATABASE_AND_API_SYNC.md](docs/LOCAL_DATABASE_AND_API_SYNC.md). Clientes por tienda, backup local y API: [docs/CUSTOMERS_SHOP_AND_SYNC.md](docs/CUSTOMERS_SHOP_AND_SYNC.md). Qué documentación aplica al POS Electron frente a la app móvil: [docs/ELECTRON_DESKTOP_REFERENCE.md](docs/ELECTRON_DESKTOP_REFERENCE.md).

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

1. Si el instalador **no** incluye Node embebido, sigue los [pasos para instalar Node.js en Windows en tienda](#pasos-en-la-tienda-instalar-nodejs-en-windows-solo-si-hace-falta) (solo si aplica).
2. Revisa [Node.js, API embebida y puerto 3000](#nodejs-api-embebida-y-puerto-3000): `build:server` al empaquetar y puerto 3000 libre.

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

Usa GitHub Actions (sección anterior); no dependas de compilación cruzada de módulos nativos.

## Documentación

- [CHANGELOG.md](CHANGELOG.md)
- [docs/BUILD-LINUX.md](docs/BUILD-LINUX.md)
- [docs/backend-impuestos-producto.md](docs/backend-impuestos-producto.md)
- [docs/LOCAL_DATABASE_AND_API_SYNC.md](docs/LOCAL_DATABASE_AND_API_SYNC.md) — almacenamiento local (`localStorage`, SQLite del servidor), MCP, ventas y proxy
- [docs/CUSTOMERS_SHOP_AND_SYNC.md](docs/CUSTOMERS_SHOP_AND_SYNC.md) — clientes por tienda, condiciones comerciales opcionales, backup local y sincronización con la API MCP
- [docs/ELECTRON_DESKTOP_REFERENCE.md](docs/ELECTRON_DESKTOP_REFERENCE.md) — alcance escritorio vs docs móviles; modelo `RegistryCustomer` y sync MCP
- [API_ENDPOINTS.md](API_ENDPOINTS.md)
- [INSTALLERS.md](INSTALLERS.md)
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- [DATABASE_SYSTEM.md](DATABASE_SYSTEM.md)

## Contribuir

1. Haz un fork del repositorio.
2. Crea una rama: `git checkout -b feature/nombre`.
3. Haz commits y push.
4. Abre un Pull Request hacia `main`.

## Licencia

MIT — ver [LICENSE](LICENSE).

## Soporte

- **Incidencias:** [GitHub Issues](https://github.com/bizneai/pos-system/issues) (cambia la URL si usas otro fork u organización)

---

BizneAI Team — versión **1.0.19** (abril 2026)
