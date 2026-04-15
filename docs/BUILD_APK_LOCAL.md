# Construir APK Local con IDs Correspondientes

## 📋 Información del Proyecto

**Package ID**: `com.shatec.BizneAI`  
**Application ID**: `com.shatec.BizneAI`  
**Namespace**: `com.shatec.BizneAI`  
**Version**: `1.21.0`  
**Version Code**: `22`  
**EAS Project ID**: `626303b5-01cc-47b8-a665-17b9697179d3`

## 🚀 Método 1: Build Local con Credenciales EAS (Recomendado)

Este método descarga automáticamente las credenciales de EAS y construye el APK localmente con la firma de producción.

### Prerrequisitos

1. **EAS CLI instalado**:
   ```bash
   npm install -g eas-cli
   ```

2. **Autenticado en EAS**:
   ```bash
   eas login
   ```

3. **Verificar que estás logueado**:
   ```bash
   eas whoami
   ```

### Pasos

1. **Configurar credenciales (primera vez)**:
   ```bash
   npm run setup:eas-credentials
   ```
   
   O manualmente:
   ```bash
   eas credentials -p android
   ```

2. **Construir APK local con credenciales EAS**:
   ```bash
   npm run build:apk:local-eas
   ```

   Este comando:
   - ✅ Ejecuta `expo prebuild --platform android --clean`
   - ✅ Descarga credenciales de EAS automáticamente
   - ✅ Construye el APK con Gradle (`assembleRelease`)
   - ✅ Renombra y mueve el APK a la raíz con formato `build-{timestamp}.apk`

3. **El APK estará en la raíz del proyecto**:
   ```
   build-{timestamp}.apk
   ```

---

## 🔨 Método 2: Build Local con Keystore Manual

Si prefieres usar una keystore local en lugar de EAS:

### Prerrequisitos

1. Tener un archivo keystore de producción (`release.keystore`)

### Pasos

1. **Crear archivo de configuración**:
   ```bash
   cp android/keystore.properties.example android/keystore.properties
   ```

2. **Editar `android/keystore.properties`**:
   ```properties
   storeFile=../app/release.keystore
   keyAlias=tu-key-alias
   storePassword=tu-store-password
   keyPassword=tu-key-password
   ```

3. **Colocar keystore en `android/app/release.keystore`**

4. **Construir APK**:
   ```bash
   npm run build:apk:local
   ```

---

## 📦 Método 3: Build Local Simple (Debug Keystore)

⚠️ **Nota**: Este método usa la keystore de debug. Solo para pruebas, NO para producción.

```bash
npm run build:android-local
```

---

## ✅ Verificación de IDs

Antes de construir, verifica que las IDs estén correctas:

### En `app.json`:
```json
{
  "android": {
    "package": "com.shatec.BizneAI"
  },
  "ios": {
    "bundleIdentifier": "com.shatec.BizneAI"
  }
}
```

### En `android/app/build.gradle`:
```gradle
namespace 'com.shatec.BizneAI'
defaultConfig {
    applicationId 'com.shatec.BizneAI'
    versionCode 22
    versionName "1.21.0"
}
```

---

## 🔍 Verificar el APK Construido

### Verificar información del APK:

```bash
# Ver información del APK
aapt dump badging build-*.apk | grep package

# Verificar firma
jarsigner -verify -verbose -certs build-*.apk
```

### Verificar SHA1 de la firma:

```bash
keytool -printcert -jarfile build-*.apk
```

---

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run build:apk:local-eas` | Build local con credenciales EAS (recomendado) |
| `npm run build:apk:local` | Build local con keystore manual |
| `npm run build:android-local` | Build local simple (debug keystore) |
| `npm run setup:eas-credentials` | Configurar credenciales EAS |
| `npm run build:apk:online` | Build en la nube con EAS Build |
| `npm run build:aab:online` | Build AAB en la nube con EAS Build |

---

## 🐛 Solución de Problemas

### Error: "EAS CLI is not installed"
```bash
npm install -g eas-cli
```

### Error: "Not logged in to EAS"
```bash
eas login
```

### Error: "Could not download credentials"
```bash
# Configurar credenciales manualmente
eas credentials -p android

# Seleccionar "Set up new credentials" o "Use existing credentials"
```

### Error: "APK not found"
- Asegúrate de que el build se completó exitosamente
- Verifica que el APK esté en `android/app/build/outputs/apk/release/app-release.apk`

### Error: "Using debug keystore for release build"
- Esto es normal si no has configurado credenciales de producción
- Para producción, usa `npm run build:apk:local-eas` o configura `keystore.properties`

---

## 📍 Ubicación del APK

Después de construir, el APK estará en:

- **Con script de renombrado**: Raíz del proyecto como `build-{timestamp}.apk`
- **Sin renombrar**: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🎯 Comando Rápido

Para construir el APK local con las IDs correctas y credenciales EAS:

```bash
npm run build:apk:local-eas
```

Este comando:
1. ✅ Verifica que EAS CLI esté instalado y que estés logueado
2. ✅ Ejecuta prebuild con las IDs correctas (`com.shatec.BizneAI`)
3. ✅ Descarga credenciales de producción de EAS
4. ✅ Construye el APK firmado
5. ✅ Renombra el APK con timestamp
6. ✅ Mueve el APK a la raíz del proyecto

---

## 📚 Referencias

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android Signing](https://docs.expo.dev/app-signing/app-signing/)
- `SIGNING_SETUP.md` - Configuración detallada de firma
- `BUILD_INSTRUCTIONS.md` - Instrucciones generales de build

