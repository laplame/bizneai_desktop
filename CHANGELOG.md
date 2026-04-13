# Changelog

Todos los cambios notables del proyecto BizneAI POS se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y el proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.0.19] - 2026-04-13

### Modificado
- **Impresión de tickets (Electron)**: impresora por defecto de Windows resuelta en el proceso principal cuando no hay nombre en ajustes (mejora impresión silenciosa con `electron-pos-printer`). Tras la venta, si «Impresión automática» está desactivada ya no se abre el cuadro del sistema; la impresión manual desde ticket virtual o reportes de ventas sigue pudiendo abrir el cuadro (`forceInteractive`).

---

## [1.0.3] - 2026-03-03

### Añadido
- **Build Linux**: Workflow de GitHub Actions para generar instaladores Linux (AppImage y .deb)
- **Documentación**: Guía completa en `docs/BUILD-LINUX.md` para build de Linux
- **Internacionalización (i18n)**: Soporte multi-idioma
- **Variantes de productos**: Selector modal para variantes de productos
- **MCP Proxy**: Rutas de proxy para integración MCP
- **Build info**: Información de versión y timestamp en tiempo de compilación
- **Script bump-version**: Automatización de versionado en builds

### Modificado
- **Kitchen**: Mejoras en el componente de cocina
- **Settings**: Actualizaciones en configuración
- **Taxes**: Mejoras en gestión de impuestos
- **API**: Ajustes en kitchen y sales
- **README**: Documentación de builds Windows y Linux, enlace a guía BUILD-LINUX
- **Iconos**: Actualización de iconos de build

### Técnico
- Workflow `build-linux.yml` con runner ubuntu-latest
- Configuración electron-builder para Linux (AppImage x64, deb x64)

---

## [1.0.2] - 2026-02-21

### Añadido
- Build de Windows con GitHub Actions
- Sistema de start único

### Modificado
- Corrección en envío de ventas al servidor

---

## [1.0.1] - 2026-02

### Modificado
- StoreProvider y componente Settings simplificados
- Mejoras en contraste de botones
- Requisito de mining para procesamiento de ventas
- Botón de mining en header del carrito
- Actualización de .gitignore y componentes

---

## [1.0.0] - 2024-07

### Añadido
- Lanzamiento inicial del sistema BizneAI POS
- Gestión de productos con IA
- Integración blockchain Luxae
- Sistema de punto de venta con tickets virtuales
- Soporte multi-plataforma (Windows, macOS, Linux)
- Escaneo de códigos de barras
- Sistema de cocina y lista de espera
