# iOS Build Checklist - BizneAI

Este documento lista todo lo necesario para crear y distribuir la app para iOS.

## ✅ Lo que ya está configurado

1. **Carpeta iOS generada** (`ios/`)
   - ✅ Proyecto Xcode (`BizneAI.xcodeproj`)
   - ✅ Podfile configurado
   - ✅ Info.plist con permisos básicos
   - ✅ Entitlements file
   - ✅ AppDelegate.swift

2. **Configuración básica en `app.json`**
   - ✅ Bundle Identifier: `com.shatec.BizneAI`
   - ✅ Soporte para tablets
   - ✅ Scheme: `bizneai`

3. **Permisos en Info.plist**
   - ✅ Cámara
   - ✅ Galería de fotos
   - ✅ Ubicación
   - ✅ Micrófono

---

## ❌ Lo que falta configurar

### 1. **Configuración en `app.json`**

#### 1.1. Agregar `buildNumber` para iOS
```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.shatec.BizneAI",
  "buildNumber": "18"  // ⚠️ FALTA - Debe coincidir con versionCode de Android
}
```

#### 1.2. Agregar configuración de iconos (opcional pero recomendado)
```json
"ios": {
  "icon": "./assets/images/icon.png",  // ⚠️ FALTA - Icono específico para iOS
  "supportsTablet": true,
  "bundleIdentifier": "com.shatec.BizneAI",
  "buildNumber": "18"
}
```

#### 1.3. Agregar configuración de App Store (opcional)
```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.shatec.BizneAI",
  "buildNumber": "18",
  "config": {
    "usesNonExemptEncryption": false  // ⚠️ FALTA - Para export compliance
  },
  "infoPlist": {
    "ITSAppUsesNonExemptEncryption": false  // ⚠️ FALTA - Para App Store
  }
}
```

---

### 2. **Scripts de build en `package.json`**

#### 2.1. Scripts para build local de iOS
```json
"scripts": {
  "build:ios:local": "npx expo prebuild --platform ios && cd ios && xcodebuild -workspace BizneAI.xcworkspace -scheme BizneAI -configuration Release -archivePath ./build/BizneAI.xcarchive archive && cd ..",
  "build:ipa:local": "npm run build:ios:local && node scripts/rename-ipa.js",
  "ios:pod-install": "cd ios && pod install && cd .."
}
```

#### 2.2. Scripts para build online con EAS
```json
"scripts": {
  "build:ios:online": "eas build --platform ios --profile production-ios",
  "build:ios:preview": "eas build --platform ios --profile preview-ios"
}
```

---

### 3. **Configuración de EAS Build en `eas.json`**

Agregar perfiles de build para iOS:

```json
{
  "build": {
    "production-ios": {
      "ios": {
        "buildConfiguration": "Release",
        "simulator": false
      },
      "distribution": "store",
      "channel": "production"
    },
    "preview-ios": {
      "ios": {
        "buildConfiguration": "Release",
        "simulator": false
      },
      "distribution": "internal",
      "channel": "preview"
    },
    "development-ios": {
      "developmentClient": true,
      "ios": {
        "simulator": true
      },
      "distribution": "internal"
    }
  }
}
```

---

### 4. **Script para renombrar IPA (similar a APK)**

Crear `scripts/rename-ipa.js`:

```javascript
#!/usr/bin/env node
/**
 * Script to rename and move the built IPA to the root directory
 * with timestamp format: build-{timestamp}.ipa
 */

const fs = require('fs');
const path = require('path');

const IPA_SOURCE_DIR = path.join(__dirname, '..', 'ios', 'build');
const ROOT_DIR = path.join(__dirname, '..');

function findIPA() {
  // Buscar el archivo .ipa en el directorio de build
  // El path puede variar según cómo se haya generado
  const possiblePaths = [
    path.join(IPA_SOURCE_DIR, 'BizneAI.xcarchive', 'Products', 'Applications', 'BizneAI.app'),
    path.join(IPA_SOURCE_DIR, '*.ipa')
  ];
  
  // Implementar lógica para encontrar el IPA
  // ...
}

function renameAndMoveIPA() {
  // Similar a rename-apk.js pero para IPA
  // ...
}
```

**Nota:** Para builds locales, el proceso es más complejo porque requiere:
1. Crear un archive con Xcode
2. Exportar el IPA desde el archive
3. Renombrar y mover

---

### 5. **Certificados y Provisioning Profiles**

#### 5.1. Requisitos de Apple Developer Account
- ⚠️ **FALTA:** Cuenta de Apple Developer ($99/año)
- ⚠️ **FALTA:** Certificado de distribución
- ⚠️ **FALTA:** Provisioning Profile para App Store
- ⚠️ **FALTA:** Provisioning Profile para distribución interna (Ad Hoc)

#### 5.2. Configuración automática con EAS
Si usas EAS Build, puedes dejar que EAS maneje los certificados automáticamente:
```bash
eas credentials
```

---

### 6. **Iconos de la app**

#### 6.1. Verificar iconos existentes
- ✅ Existe: `ios/BizneAI/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png`
- ⚠️ **FALTA:** Verificar que todos los tamaños requeridos estén presentes

#### 6.2. Tamaños requeridos para iOS
- 20x20 (@2x, @3x) - Notification
- 29x29 (@2x, @3x) - Settings
- 40x40 (@2x, @3x) - Spotlight
- 60x60 (@2x, @3x) - App Icon
- 1024x1024 (@1x) - App Store

#### 6.3. Generar iconos automáticamente
Puedes usar herramientas como:
- `expo-asset-generator`
- `app-icon` (npm package)
- O configurar en `app.json` para que Expo los genere

---

### 7. **Splash Screen**

- ✅ Existe: `ios/BizneAI/SplashScreen.storyboard`
- ✅ Existe: `ios/BizneAI/Images.xcassets/SplashScreenLogo.imageset/`
- ⚠️ **VERIFICAR:** Que el splash screen coincida con la configuración de Android

---

### 8. **Permisos adicionales (si es necesario)**

Revisar si faltan permisos en `Info.plist`:

- ⚠️ **VERIFICAR:** `NSFaceIDUsageDescription` (si usas autenticación biométrica)
- ⚠️ **VERIFICAR:** `NSBluetoothAlwaysUsageDescription` (si usas Bluetooth)
- ⚠️ **VERIFICAR:** `NSBluetoothPeripheralUsageDescription` (si usas Bluetooth)
- ⚠️ **VERIFICAR:** `NSContactsUsageDescription` (si accedes a contactos)
- ⚠️ **VERIFICAR:** `NSCalendarsUsageDescription` (si accedes al calendario)

---

### 9. **Configuración de versiones**

#### 9.1. Sincronizar versiones
- ✅ `CFBundleShortVersionString` en Info.plist: `1.18.0` (coincide con app.json)
- ⚠️ **FALTA:** `CFBundleVersion` debe incrementarse con cada build (actualmente es `1`)
- ⚠️ **FALTA:** `buildNumber` en app.json para iOS

#### 9.2. Script para actualizar versiones
Similar a Android, crear un script que actualice:
- `app.json` → `ios.buildNumber`
- `ios/BizneAI/Info.plist` → `CFBundleVersion`

---

### 10. **Documentación de build**

#### 10.1. Actualizar `BUILD_INSTRUCTIONS.md`
- ⚠️ **FALTA:** Sección para iOS (similar a Android)
- ⚠️ **FALTA:** Instrucciones para build local
- ⚠️ **FALTA:** Instrucciones para build con EAS
- ⚠️ **FALTA:** Requisitos del sistema (Xcode, CocoaPods, etc.)

---

### 11. **Dependencias y herramientas**

#### 11.1. Opción A: Build Local (requiere Xcode completo)

**Requisitos:**
- ⚠️ **INSTALAR:** Xcode completo desde Mac App Store (~15 GB)
- ⚠️ **VERIFICAR:** CocoaPods instalado (`sudo gem install cocoapods` o `brew install cocoapods`)
- ⚠️ **VERIFICAR:** Command Line Tools de Xcode (`xcode-select --install`)

**Instalación de Xcode:**
1. Abrir Mac App Store
2. Buscar "Xcode"
3. Instalar (puede tardar mucho tiempo, ~15 GB)
4. Abrir Xcode una vez para aceptar términos
5. Ejecutar: `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer`

**Instalar dependencias de iOS:**
```bash
cd ios
pod install
cd ..
```

#### 11.2. Opción B: Build con EAS (NO requiere Xcode)

**Requisitos:**
- ✅ **NO NECESITA:** Xcode local
- ⚠️ **INSTALAR:** EAS CLI (`npm install -g eas-cli`)
- ⚠️ **VERIFICAR:** Autenticado con Expo (`eas login`)

**Ventajas:**
- No requiere instalar Xcode (ahorra ~15 GB)
- Builds consistentes en la nube
- Funciona en cualquier máquina
- Ideal para CI/CD

**Desventajas:**
- Requiere conexión a internet
- Más lento (depende de la cola)
- Consume cuota de EAS Build

**Recomendación:** Para la mayoría de casos, usar EAS Build es más práctico.

---

### 12. **Configuración de App Store Connect**

#### 12.1. Preparación para distribución
- ⚠️ **FALTA:** Crear app en App Store Connect
- ⚠️ **FALTA:** Configurar información de la app (descripción, screenshots, etc.)
- ⚠️ **FALTA:** Configurar pricing y disponibilidad
- ⚠️ **FALTA:** Configurar categorías y keywords

#### 12.2. Screenshots requeridos
- iPhone 6.7" (iPhone 14 Pro Max, etc.)
- iPhone 6.5" (iPhone 11 Pro Max, etc.)
- iPhone 5.5" (iPhone 8 Plus, etc.)
- iPad Pro 12.9"
- iPad Pro 11"

---

### 13. **Testing y validación**

#### 13.1. Build de prueba
- ⚠️ **FALTA:** Probar build local en simulador
- ⚠️ **FALTA:** Probar build local en dispositivo físico
- ⚠️ **FALTA:** Probar build con EAS en TestFlight

#### 13.2. Validación de funcionalidades
- ⚠️ **FALTA:** Verificar que todas las funcionalidades funcionen en iOS
- ⚠️ **FALTA:** Verificar permisos (cámara, galería, ubicación)
- ⚠️ **FALTA:** Verificar que las notificaciones funcionen (si aplica)
- ⚠️ **FALTA:** Verificar que el deep linking funcione

---

## 📋 Resumen de prioridades

### 🔴 Alta prioridad (necesario para build)

**Si usas EAS Build (recomendado - NO requiere Xcode):**
1. Agregar `buildNumber` en `app.json` para iOS
2. Agregar scripts de build en `package.json` (para EAS)
3. Configurar perfiles de iOS en `eas.json`
4. Instalar EAS CLI: `npm install -g eas-cli`
5. Autenticarse con Expo: `eas login`

**Si usas Build Local (requiere Xcode):**
1. Agregar `buildNumber` en `app.json` para iOS
2. Agregar scripts de build en `package.json` (para local)
3. **Instalar Xcode completo desde Mac App Store (~15 GB)**
4. Instalar CocoaPods y ejecutar `pod install`
5. Configurar Xcode: `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer`

### 🟡 Media prioridad (recomendado)
6. Crear script `rename-ipa.js`
7. Verificar/actualizar iconos de la app
8. Agregar configuración de App Store en `app.json`
9. Actualizar documentación de build

### 🟢 Baja prioridad (para distribución)
10. Configurar App Store Connect
11. Preparar screenshots
12. Configurar certificados y provisioning profiles (o usar EAS automático)

---

## 🚀 Pasos siguientes recomendados

### Opción Recomendada: EAS Build (sin Xcode)

1. **Primero:** Agregar configuración básica en `app.json` y `eas.json`
2. **Segundo:** Instalar EAS CLI: `npm install -g eas-cli`
3. **Tercero:** Autenticarse: `eas login`
4. **Cuarto:** Crear scripts de build en `package.json` (para EAS)
5. **Quinto:** Probar build con EAS: `npm run build:ios:online`
6. **Sexto:** Probar en TestFlight

### Opción Alternativa: Build Local (con Xcode)

1. **Primero:** Instalar Xcode desde Mac App Store (~15 GB, puede tardar horas)
2. **Segundo:** Configurar Xcode: `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer`
3. **Tercero:** Agregar configuración básica en `app.json` y `eas.json`
4. **Cuarto:** Instalar CocoaPods: `cd ios && pod install && cd ..`
5. **Quinto:** Crear scripts de build en `package.json` (para local)
6. **Sexto:** Probar build local: `npm run build:ios:local`

---

**Última actualización:** 2025-11-30

