# Guía: Build de Linux para BizneAI POS

Este documento explica cómo está implementado el build automático para Linux y cómo utilizarlo.

---

## Resumen

El proyecto genera instaladores para Linux mediante **GitHub Actions**. El workflow compila la aplicación Electron y produce dos formatos:

| Formato | Descripción | Uso recomendado |
|---------|-------------|-----------------|
| **AppImage** | Ejecutable portable, no requiere instalación | Distribución rápida, pruebas |
| **.deb** | Paquete Debian/Ubuntu | Instalación en sistemas basados en Debian |

---

## Cómo ejecutar el build

### Opción 1: Automático (push/PR)

El workflow se ejecuta automáticamente cuando:

- Haces **push** a las ramas `main` o `master`
- Abres un **Pull Request** hacia `main` o `master`

### Opción 2: Manual

1. Ve a tu repositorio en GitHub
2. Abre la pestaña **Actions**
3. En el menú lateral, selecciona **Build Linux**
4. Haz clic en **Run workflow** (botón derecho)
5. Elige la rama y confirma con **Run workflow**

---

## Cómo descargar los artefactos

1. Ve a **Actions** → **Build Linux**
2. Abre la ejecución que quieras (la más reciente o una específica)
3. Espera a que el job **build-linux** termine (icono verde ✓)
4. En la sección **Artifacts**, descarga **BizneAI-POS-Linux**
5. Descomprime el ZIP descargado

Dentro encontrarás:

```
release/
├── BizneAI POS-x.x.x.AppImage    # Ejecutable portable
├── bizneai-pos_x.x.x_amd64.deb   # Instalador para Debian/Ubuntu
└── linux-unpacked/               # Carpeta descomprimida (para desarrollo)
```

---

## Cómo usar los archivos generados

### AppImage

```bash
# Dar permisos de ejecución (solo la primera vez)
chmod +x "BizneAI POS-x.x.x.AppImage"

# Ejecutar
./"BizneAI POS-x.x.x.AppImage"
```

### Paquete .deb

```bash
# Instalar (requiere sudo)
sudo dpkg -i bizneai-pos_x.x.x_amd64.deb

# Si faltan dependencias, ejecutar:
sudo apt-get install -f
```

---

## Implementación técnica

### Archivos involucrados

| Archivo | Función |
|---------|---------|
| `.github/workflows/build-linux.yml` | Definición del workflow de GitHub Actions |
| `package.json` (sección `build.linux`) | Configuración de electron-builder para Linux |
| `build/icon.png` | Icono de la aplicación en Linux |

### Flujo del workflow

```
1. Checkout del código
2. Configuración de Node.js 20
3. npm ci (instalación de dependencias)
4. Generación de iconos (npm run generate-icons)
5. Corrección de dependencias nativas (npm run fix-deps)
6. Build de la aplicación (npm run build)
7. electron-builder --linux --x64
8. Subida de artefactos a GitHub
```

### Configuración en package.json

La sección `build.linux` define los targets:

```json
"linux": {
  "target": [
    { "target": "AppImage", "arch": ["x64"] },
    { "target": "deb", "arch": ["x64"] }
  ],
  "icon": "build/icon.png",
  "category": "Office"
}
```

### Scripts disponibles

```bash
# Build completo (bump version + fix deps + build + electron-builder)
npm run dist:linux

# Alternativa con nombre más descriptivo
npm run build-desktop:linux
```

---

## Build local (en tu máquina Linux)

Si tienes un sistema Linux y quieres compilar localmente:

```bash
# Requisitos previos (Ubuntu/Debian)
sudo apt-get install -y libgtk-3-dev libnotify-dev libnss3 libxss1 libasound2

# Build
npm run dist:linux
```

Los archivos se generarán en la carpeta `release/`.

---

## Solución de problemas

### El workflow falla en "Fix native dependencies"

Algunos módulos nativos (better-sqlite3, etc.) pueden requerir herramientas de compilación. El runner `ubuntu-latest` ya incluye build-essential. Si falla, revisa el script `scripts/fix-dependencies.cjs`.

### AppImage no ejecuta

```bash
# Verificar que tiene permisos
chmod +x "BizneAI POS-x.x.x.AppImage"

# En algunas distribuciones puede necesitar FUSE
# (AppImage usa FUSE para montar el sistema de archivos)
```

### El .deb falla al instalar

```bash
# Instalar dependencias faltantes
sudo apt-get install -f
```

---

## Comparación con otros builds

| Plataforma | Workflow | Runner | Formatos |
|------------|----------|--------|----------|
| Windows | build-windows.yml | windows-latest | NSIS, portable |
| Linux | build-linux.yml | ubuntu-latest | AppImage, deb |
| macOS | (local o futuro) | macos-latest | dmg, zip |

---

## Referencias

- [electron-builder - Linux](https://www.electron.build/configuration/linux)
- [GitHub Actions - workflow_dispatch](https://docs.github.com/en/actions/using-workflows/manually-running-a-workflow)
- [AppImage](https://appimage.org/)
