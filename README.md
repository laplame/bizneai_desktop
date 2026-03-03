# �� BizneAI POS System

Un sistema de punto de venta moderno y completo con integración blockchain, gestión de productos con IA, y soporte multi-plataforma.

## ✨ Características Principales

### 🛍️ Gestión de Productos
- **Subida de productos con IA**: Detección automática de productos similares
- **Optimización de imágenes**: Integración con Cloudinary para procesamiento automático
- **Categorización inteligente**: Sistema de categorías jerárquicas
- **Escaneo de códigos de barras**: Soporte para múltiples formatos

### 💰 Sistema de Pagos
- **Múltiples métodos de pago**: Tarjeta, efectivo, transferencias
- **Pagos con criptomonedas**: Soporte para Bitcoin, Ethereum, Luxae
- **Gestión de tickets virtuales**: Generación automática de comprobantes
- **Reportes de ventas**: Análisis detallado de transacciones

### 🔗 Integración Blockchain
- **Blockchain Luxae**: Red privada para transacciones seguras
- **Smart Contracts**: Contratos inteligentes para promociones y descuentos
- **Minería integrada**: Sistema de recompensas para validadores
- **API REST completa**: Endpoints para integración externa

### 🏪 Gestión de Negocios
- **Múltiples tiendas**: Soporte para cadenas de comercios
- **Gestión de inventario**: Control automático de stock
- **Sistema de cocina**: Órdenes en tiempo real
- **Lista de espera**: Gestión de clientes en espera

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 19** con TypeScript
- **Vite** para desarrollo rápido
- **Lucide React** para iconografía
- **React Hot Toast** para notificaciones

### Backend
- **Node.js** con Express
- **SQLite** para base de datos local
- **Multer** para manejo de archivos
- **Zod** para validación de esquemas

### Desktop
- **Electron** para aplicación de escritorio
- **electron-builder** para empaquetado
- **Soporte multi-plataforma**: Windows, macOS, Linux

### Blockchain
- **Luxae Blockchain**: Red privada personalizada
- **Web3.js** para interacción con blockchain
- **Smart Contracts** en Solidity
- **P2P Networking** con libp2p

## 📦 Instalación

### Prerrequisitos
- Node.js 16+ 
- npm o yarn
- Git

### Instalación Local
```bash
# Clonar el repositorio
git clone https://github.com/laplame/bizneai_desktop.git
cd bizneai_desktop

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

### Ejecutar la aplicación Electron

Hay varias formas de ejecutar la app como aplicación de escritorio:

**Opción 1: Modo desarrollo completo (recomendado)**  
Arranca el frontend (Vite), el backend y Electron en un solo comando:

```bash
npm run electron:dev
```

O alternativamente:

```bash
npm run start:all
```

**Opción 2: Solo Electron**  
Si ya tienes la app construida o el servidor de Vite corriendo:

```bash
# Primero construye la app (si no está construida)
npm run build

# Luego ejecuta Electron
npm run electron
```

Si ya tienes `npm run dev` corriendo en otra terminal, puedes ejecutar `npm run electron` directamente.

### Construir Instaladores

#### macOS
```bash
npm run dist:mac
```

#### Windows
```bash
npm run dist:win
```

> **Nota para usuarios de macOS:** El build de Windows desde Mac puede fallar por módulos nativos. Usa [GitHub Actions](#-build-automático-con-github-actions) para generar el instalador de Windows automáticamente.

#### Linux
```bash
npm run dist:linux
```

### 🤖 Build automático con GitHub Actions

El proyecto incluye workflows de CI que generan instaladores automáticamente:
- **Build Windows (PC)** — para Windows
- **Build Linux** — para Linux (AppImage y .deb)

**¿Cuándo se ejecutan?**
- En cada push a `main` o `master`
- En cada Pull Request hacia `main` o `master`
- Manualmente desde la pestaña **Actions** del repositorio

**Cómo descargar el build de Windows:**
1. Ve a la pestaña **Actions** en GitHub
2. Selecciona el workflow **Build Windows (PC)**
3. Abre la ejecución más reciente (o la que quieras)
4. En la sección **Artifacts** descarga **BizneAI-POS-Windows**
5. Descomprime el archivo y ejecuta `BizneAI POS.exe` dentro de `win-unpacked/` o usa el instalador `.exe` (NSIS)

**Cómo descargar el build de Linux:**
1. Ve a la pestaña **Actions** en GitHub
2. Selecciona el workflow **Build Linux**
3. Abre la ejecución más reciente (o la que quieras)
4. En la sección **Artifacts** descarga **BizneAI-POS-Linux**
5. Usa el `.AppImage` (ejecutable portable) o el `.deb` (instalador para Debian/Ubuntu)

> 📄 **Documentación detallada:** Ver [docs/BUILD-LINUX.md](docs/BUILD-LINUX.md) para la guía completa de implementación, uso local y solución de problemas.

## 🔧 Scripts Disponibles

### Desarrollo
```bash
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Construir para producción
npm run lint             # Ejecutar ESLint
```

### Electron
```bash
npm run electron:dev     # Iniciar app Electron en modo desarrollo (recomendado)
npm run start:all        # Alternativa: inicia dev + Electron
npm run electron         # Ejecutar Electron (requiere build o dev corriendo)
```

### Blockchain
```bash
npm run blockchain:init  # Inicializar blockchain
npm run blockchain:start # Iniciar validador
npm run blockchain:api   # Iniciar API blockchain
```

### Instaladores
```bash
npm run fix-deps         # Reparar dependencias
npm run dist:mac         # Construir para macOS
npm run dist:win         # Construir para Windows (o usar GitHub Actions)
npm run dist:linux       # Construir para Linux
```

## 📴 Modo Offline / Standalone

El sistema está diseñado para funcionar **sin conexión** con datos persistentes:

- **Datos locales**: Productos, configuración y ventas se guardan en localStorage.
- **Sincronización**: Una vez al día (si hay conexión) se sincroniza con el servidor.
- **Sin conexión**: Si no hay red, el sistema usa los datos descargados la primera vez.
- **Sincronización manual**: En Configuración → "Sincronizar con Servidor" o "Cargar datos del Shop" para forzar una actualización.

## 🚀 Características Avanzadas

### IA y Machine Learning
- **Detección de similitud de productos**: Algoritmos de comparación de imágenes
- **Categorización automática**: Clasificación inteligente de productos
- **Optimización de inventario**: Predicción de demanda

### Seguridad
- **Cifrado de datos**: Protección de información sensible
- **Autenticación multi-factor**: Múltiples niveles de seguridad
- **Auditoría completa**: Registro de todas las transacciones

### Integración
- **APIs RESTful**: Endpoints para integración externa
- **Webhooks**: Notificaciones en tiempo real
- **Exportación de datos**: Múltiples formatos (CSV, JSON, XML)

## 📁 Estructura del Proyecto

```
bizneai_desktop/
├── src/                    # Código fuente principal
│   ├── components/         # Componentes React
│   ├── api/               # Cliente API
│   ├── types/             # Definiciones TypeScript
│   └── utils/             # Utilidades
├── server/                # Backend Express
│   ├── src/
│   │   ├── routes/        # Rutas API
│   │   ├── middleware/    # Middleware
│   │   └── schemas/       # Esquemas de validación
├── blockchain/            # Integración blockchain
│   └── luxaeBlockhain/    # Código blockchain
├── electron/              # Configuración Electron
├── scripts/               # Scripts de automatización
└── build/                 # Recursos de construcción
```

## 🔧 Solución de Problemas

### Error de Módulos
Si encuentras el error `Cannot find module 'call-bind-apply-helpers'`:

```bash
npm run fix-deps
npm run dist:mac
```

### Problemas de Construcción
```bash
# Limpiar caché
rm -rf node_modules package-lock.json
npm install
npm run fix-deps
```

### Build de Windows desde macOS
Si `npm run dist:win` falla con errores de módulos nativos (better-sqlite3, node-gyp), es porque la compilación cruzada no está soportada. **Solución:** usa el workflow de GitHub Actions (ver [Build automático](#-build-automático-con-github-actions) arriba) para generar el instalador de Windows en un runner nativo.

## 📚 Documentación

- [Changelog / Historial de versiones](CHANGELOG.md)
- [Build Linux - Guía completa](docs/BUILD-LINUX.md)
- [Guía de Instalación](INSTALLERS.md)
- [Solución de Problemas](TROUBLESHOOTING.md)
- [Integración Blockchain](BLOCKCHAIN_INTEGRATION.md)
- [Sistema de Base de Datos](DATABASE_SYSTEM.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

- **GitHub Issues**: [Reportar problemas](https://github.com/laplame/bizneai_desktop/issues)
- **Documentación**: [Guías completas](https://docs.bizneai.com)
- **Email**: support@bizneai.com

## 🎯 Roadmap

- [ ] Integración con más criptomonedas
- [ ] Sistema de fidelización con tokens
- [ ] Análisis avanzado de datos
- [ ] Integración con sistemas contables
- [ ] App móvil complementaria

---

**Desarrollado con ❤️ por el equipo BizneAI**

*Versión 1.0.3 - Marzo 2026*
