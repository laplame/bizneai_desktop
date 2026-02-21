# 🔧 Configuración de Build para BizneAI POS

Este documento contiene todas las configuraciones necesarias para construir nuevas versiones de la aplicación.

## 📋 Prerequisitos

### Para Windows (desde macOS):
- Node.js >= 16.0.0
- npm instalado
- electron-builder instalado globalmente (opcional): `npm install -g electron-builder`

## 🚀 Comandos de Build

### Build para Windows (Portable - ZIP)
```bash
# 1. Arreglar dependencias nativas
npm run fix-deps

# 2. Construir la aplicación web
npm run build

# 3. Construir aplicación Windows (solo directorio, sin instalador)
npx electron-builder --win --dir --x64 --config.nodeGypRebuild=false

# 4. Crear ZIP con timestamp
cd release
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
zip -r "../bizneAI_WIN_${TIMESTAMP}.zip" win-unpacked/ -x "*.DS_Store"

# 5. Limpiar carpeta win-unpacked (opcional, para ahorrar espacio)
cd ..
rm -rf release/win-unpacked
```

### Build para Windows (Instalador NSIS)
**Nota:** El instalador NSIS requiere estar en Windows o tener Wine configurado correctamente.

```bash
npm run fix-deps
npm run build
npm run dist:win
```

### Build para macOS
```bash
npm run dist:mac
```

### Build para Linux
```bash
npm run dist:linux
```

## ⚙️ Configuración de Electron Builder

### Ubicación
La configuración principal está en `package.json` bajo la sección `"build"`.

### Configuración Actual

```json
{
  "build": {
    "appId": "com.bizneai.pos",
    "productName": "BizneAI POS",
    "copyright": "Copyright © 2024 BizneAI Team",
    "directories": {
      "output": "release",
      "buildResources": "build"
    },
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        },
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ],
      "icon": "build/icon.ico",
      "requestedExecutionLevel": "asInvoker"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "BizneAI POS"
    }
  }
}
```

## 🎨 Generación de Iconos

Antes de construir, asegúrate de tener los iconos generados:

```bash
npm run generate-icons
```

O usar el script específico para ICO de 256x256:

```bash
node scripts/create-ico.js
```

## 📦 Módulos Nativos

Los siguientes módulos nativos requieren rebuild para Electron:

- `better-sqlite3`
- `sqlite3`

El script `fix-deps` se encarga de esto automáticamente.

## 🔍 Verificación Post-Build

Después de construir, verifica:

1. ✅ El archivo ejecutable existe
2. ✅ El tamaño del archivo es razonable (~134MB para Windows)
3. ✅ Los módulos nativos están incluidos
4. ✅ Los recursos públicos están incluidos

## 📝 Notas Importantes

### Windows Build desde macOS:
- El instalador NSIS puede fallar debido a limitaciones de Wine
- Usar `--dir` para crear solo el directorio sin instalador
- El ZIP portable funciona perfectamente sin instalación

### Limpieza:
Después de crear el ZIP, puedes eliminar `release/win-unpacked/` para ahorrar espacio:
```bash
rm -rf release/win-unpacked
```

### Archivos de Salida:
- **Windows Portable:** `bizneAI_WIN_YYYYMMDD_HHMMSS.zip` (en root)
- **Windows Instalador:** `release/BizneAI POS Setup 1.0.0.exe` (requiere Windows)
- **macOS:** `release/BizneAI POS-1.0.0.dmg`
- **Linux:** `release/BizneAI POS-1.0.0.AppImage`

## 🐛 Troubleshooting

### Error: "unable to read icon from file"
```bash
# Regenerar icono ICO de 256x256
node scripts/create-ico.js
```

### Error: "node-gyp does not support cross-compiling"
```bash
# Usar --config.nodeGypRebuild=false
npx electron-builder --win --dir --x64 --config.nodeGypRebuild=false
```

### Error: "image must be at least 256x256"
```bash
# Regenerar icono con tamaño correcto
node scripts/create-ico.js
```

## 📅 Historial de Versiones

- **v1.0.0** - Versión inicial
  - Build Windows portable exitoso
  - Configuración de electron-builder establecida
  - Scripts de build documentados

---

**Última actualización:** 2024-01-02
**Mantenido por:** BizneAI Team

