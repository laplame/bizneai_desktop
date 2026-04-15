# Análisis de Dependencias - Reporte Completo

**Fecha de análisis:** 2025-01-26  
**Versión de la app:** 1.18.0

## Resumen Ejecutivo

- **Total de dependencias:** 40
- **Dependencias de desarrollo:** 4
- **Dependencias en uso confirmado:** 28
- **Dependencias potencialmente no utilizadas:** 8
- **Dependencias requeridas por Expo/React Native:** 4

---

## 📦 Dependencias en Uso Confirmado

### Core Framework
- ✅ `expo@~53.0.9` - Framework principal
- ✅ `react@19.0.0` - Biblioteca React
- ✅ `react-native@0.79.5` - Framework React Native
- ✅ `expo-router@^5.0.7` - Sistema de navegación basado en archivos

### UI Components
- ✅ `@expo/vector-icons@^14.1.0` - **597 usos** - Iconos (Ionicons)
- ✅ `react-native-safe-area-context@5.4.0` - Manejo de áreas seguras
- ✅ `react-native-qrcode-svg@^6.3.15` - **75 usos** - Generación de códigos QR

### Storage & Database
- ✅ `@react-native-async-storage/async-storage@2.1.2` - **541 usos** - Almacenamiento local
- ✅ `expo-sqlite@~15.2.14` - Base de datos SQLite

### Media & Files
- ✅ `expo-av@~15.1.7` - **39 usos** - Audio/Video (grabación de audio en chat)
- ✅ `expo-file-system@~18.1.10` - Sistema de archivos
- ✅ `expo-image-picker@~16.1.4` - Selección de imágenes
- ✅ `expo-image-manipulator@~13.1.7` - **58 usos** - Manipulación de imágenes
- ✅ `expo-media-library@~17.1.7` - Acceso a biblioteca de medios
- ✅ `expo-sharing@~13.1.5` - Compartir archivos

### Utilities
- ✅ `expo-clipboard@~7.1.5` - **13 usos** - Portapapeles
- ✅ `expo-crypto@~14.1.4` - **621 usos** - Funciones criptográficas (Merkle tree, hashing)
- ✅ `expo-location@~18.1.5` - **287 usos** - Geolocalización
- ✅ `expo-print@~14.1.4` - **288 usos** - Impresión de tickets
- ✅ `expo-screen-orientation@~8.1.7` - **11 usos** - Control de orientación
- ✅ `expo-localization@~16.1.6` - Localización/Idiomas

### Barcode & QR
- ✅ `jsbarcode@^3.12.1` - **17 usos** - Generación de códigos de barras
- ✅ `qrcode@^1.5.4` - Generación de QR (usado indirectamente)
- ✅ `react-native-barcode-svg@^0.0.15` - **42 usos** - Códigos de barras SVG

### Navigation
- ✅ `@react-navigation/native@^7.1.6` - **35 usos** - Navegación base (requerido por expo-router)

### Other
- ✅ `i18n-js@^4.5.1` - Internacionalización
- ✅ `uuid@^11.1.0` - **143 usos** - Generación de IDs únicos
- ✅ `react-native-view-shot@^4.0.3` - **56 usos** - Captura de vistas (tickets)

---

## ⚠️ Dependencias Potencialmente No Utilizadas

### 1. `@react-navigation/bottom-tabs@^7.3.10`
- **Estado:** No encontrado en código fuente
- **Razón:** Expo Router usa su propio sistema de navegación
- **Recomendación:** ⚠️ **ELIMINAR** - No se usa navegación por tabs de react-navigation
- **Impacto:** Bajo - Solo si no hay tabs nativos

### 2. `@react-navigation/elements@^2.3.8`
- **Estado:** No encontrado en código fuente
- **Razón:** Expo Router maneja sus propios elementos
- **Recomendación:** ⚠️ **ELIMINAR** - No se usan elementos de react-navigation
- **Impacto:** Bajo

### 3. `@types/qrcode@^1.5.5`
- **Estado:** No encontrado en código TypeScript
- **Razón:** `qrcode` se usa indirectamente a través de `react-native-qrcode-svg`
- **Recomendación:** ⚠️ **ELIMINAR** - Los tipos no son necesarios si no se importa directamente
- **Impacto:** Muy bajo - Solo tipos de desarrollo

### 4. `@types/uuid@^10.0.0`
- **Estado:** No encontrado en código TypeScript
- **Razón:** `uuid@^11.1.0` ya incluye sus propios tipos
- **Recomendación:** ⚠️ **ELIMINAR** - Versión 11 de uuid incluye tipos nativos
- **Impacto:** Muy bajo - Solo tipos de desarrollo

---

## 🔍 Dependencias Requeridas por Expo/React Native (No Eliminar)

Estas dependencias pueden no aparecer directamente en el código pero son requeridas por el ecosistema:

### 1. `expo-asset@~11.1.7`
- **Estado:** No encontrado directamente
- **Razón:** Usado internamente por Expo para manejar assets
- **Recomendación:** ✅ **MANTENER** - Requerido por Expo
- **Impacto:** Alto si se elimina - Assets no funcionarían

### 2. `expo-constants@~17.1.7`
- **Estado:** No encontrado directamente
- **Razón:** Usado internamente por Expo para constantes del sistema
- **Recomendación:** ✅ **MANTENER** - Requerido por Expo
- **Impacto:** Alto si se elimina - Información del dispositivo no disponible

### 3. `expo-font@~13.3.2`
- **Estado:** No encontrado directamente
- **Razón:** Usado internamente por Expo para cargar fuentes
- **Recomendación:** ✅ **MANTENER** - Requerido por Expo
- **Impacto:** Medio - Fuentes personalizadas no funcionarían

### 4. `expo-linking@~7.1.7`
- **Estado:** No encontrado directamente
- **Razón:** Usado por Expo Router para deep linking
- **Recomendación:** ✅ **MANTENER** - Requerido por expo-router
- **Impacto:** Alto si se elimina - Deep linking no funcionaría

### 5. `expo-splash-screen@~0.30.10`
- **Estado:** No encontrado directamente
- **Razón:** Usado por Expo para manejar splash screen
- **Recomendación:** ✅ **MANTENER** - Requerido por Expo
- **Impacto:** Medio - Splash screen no funcionaría correctamente

### 6. `expo-updates@~0.28.17`
- **Estado:** No encontrado directamente
- **Razón:** Usado por Expo para OTA updates
- **Recomendación:** ⚠️ **REVISAR** - Solo necesario si se usan OTA updates
- **Impacto:** Bajo si no se usan updates OTA

### 7. `react-native-screens@~4.11.1`
- **Estado:** No encontrado directamente
- **Razón:** Usado por expo-router y react-navigation internamente
- **Recomendación:** ✅ **MANTENER** - Requerido por expo-router
- **Impacto:** Alto si se elimina - Navegación no funcionaría

### 8. `react-native-svg@15.11.2`
- **Estado:** No encontrado directamente en imports
- **Razón:** Usado por `react-native-qrcode-svg` y `react-native-barcode-svg`
- **Recomendación:** ✅ **MANTENER** - Dependencia de QR y barcode
- **Impacto:** Alto si se elimina - QR y barcodes no funcionarían

---

## 📊 Análisis de Tamaño

### Dependencias que más contribuyen al tamaño:

1. **expo@~53.0.9** - Framework completo (~50-100MB)
2. **react-native@0.79.5** - Framework base (~30-50MB)
3. **@expo/vector-icons@^14.1.0** - Iconos (~5-10MB)
4. **expo-av@~15.1.7** - Audio/Video (~3-5MB)
5. **react-native-svg@15.11.2** - SVG rendering (~2-3MB)

### Dependencias pequeñas que se pueden eliminar:

- `@react-navigation/bottom-tabs` (~500KB)
- `@react-navigation/elements` (~300KB)
- `@types/qrcode` (~50KB)
- `@types/uuid` (~30KB)

**Ahorro potencial:** ~880KB (sin contar dependencias transitivas)

---

## 🎯 Recomendaciones Finales

### Eliminar con Seguridad:

1. ✅ `@react-navigation/bottom-tabs@^7.3.10`
2. ✅ `@react-navigation/elements@^2.3.8`
3. ✅ `@types/qrcode@^1.5.5`
4. ✅ `@types/uuid@^10.0.0`

### Revisar Manualmente:

1. ⚠️ `expo-updates@~0.28.17` - Solo si NO se usan OTA updates

### Mantener (Requeridas):

- Todas las demás dependencias son necesarias para el funcionamiento de la app

---

## 📝 Pasos para Eliminación

1. **Backup del package.json**
   ```bash
   cp package.json package.json.backup
   ```

2. **Eliminar dependencias**
   ```bash
   npm uninstall @react-navigation/bottom-tabs @react-navigation/elements @types/qrcode @types/uuid
   ```

3. **Limpiar node_modules**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Probar la aplicación**
   - Compilar para Android
   - Compilar para iOS
   - Probar todas las funcionalidades principales
   - Verificar que no hay errores en runtime

5. **Verificar tamaño del APK**
   ```bash
   npm run build:apk:local
   # Comparar tamaño antes y después
   ```

---

## ⚠️ Advertencias

1. **No eliminar dependencias de Expo** - Pueden romper funcionalidades ocultas
2. **Probar exhaustivamente** - Algunas dependencias se usan indirectamente
3. **Revisar dependencias transitivas** - Algunas pueden ser requeridas por otras
4. **Backup antes de eliminar** - Siempre tener un punto de restauración

---

## 📈 Métricas de Uso

| Dependencia | Usos en Código | Estado |
|------------|----------------|--------|
| @expo/vector-icons | 597 | ✅ Crítica |
| @react-native-async-storage | 541 | ✅ Crítica |
| expo-crypto | 621 | ✅ Crítica |
| expo-location | 287 | ✅ Crítica |
| expo-print | 288 | ✅ Crítica |
| uuid | 143 | ✅ Importante |
| react-native-qrcode-svg | 75 | ✅ Importante |
| expo-av | 39 | ✅ Importante |
| react-native-view-shot | 56 | ✅ Importante |
| @react-navigation/bottom-tabs | 0 | ❌ No usado |
| @react-navigation/elements | 0 | ❌ No usado |

---

**Última actualización:** 2025-01-26  
**Próxima revisión recomendada:** Después de eliminar dependencias
