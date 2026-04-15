# 📋 Lista Completa de Features de Configuration y Archivos Involucrados

## 🎯 Vista Configuration

La vista **Configuration** (`app/configuration.tsx`) utiliza el componente principal `UnifiedConfiguration.tsx` para gestionar todas las configuraciones del sistema BizneAI.

---

## 📦 Features Principales

### 1. **Store Settings (Configuración de Tienda)**
Gestión completa de la información de la tienda y sincronización con servidor.

#### Features Incluidas:
- ✅ **Store Name** - Nombre de la tienda
- ✅ **Store Location** - Ubicación/sucursal (para múltiples ubicaciones)
- ✅ **Street Address** - Dirección de la calle
- ✅ **City** - Ciudad
- ✅ **State/Province** - Estado/Provincia
- ✅ **ZIP/Postal Code** - Código postal
- ✅ **GPS Location** - Captura automática de coordenadas GPS
- ✅ **Store Type** - Tipo de tienda (25+ tipos disponibles)
- ✅ **Server Sync** - Sincronización con servidor
  - Estado de sincronización (synced/not synced)
  - Shop ID display
  - Última sincronización
  - Sincronización manual
  - Test de conexión
  - Cargar datos desde URL
  - Cargar datos de prueba (Papelería Centro)

#### Archivos Involucrados:
```
src/components/UnifiedConfiguration.tsx (líneas 1079-1317)
src/context/ConfigContext.tsx
src/services/shopService.ts
  ├── getLocalShopData()
  ├── getShopId()
  ├── getStoreTypes()
  ├── syncShopData()
  └── StoreType interface
src/services/api.ts
src/services/shopIdService.ts
expo-location (permisos y captura GPS)
```

---

### 2. **Business Sync (Sincronización de Negocio)**
Sincronización de datos entre dispositivos usando URLs o códigos QR.

#### Features Incluidas:
- ✅ **QR Code Generator** - Generación de código QR para sincronización
- ✅ **URL Input** - Ingreso de URL para cargar datos
- ✅ **Auto Sync on Complete** - Recarga automática después de sincronización exitosa

#### Archivos Involucrados:
```
src/components/UnifiedConfiguration.tsx (líneas 1319-1340)
src/components/BusinessSyncComponent.tsx
src/services/businessSyncService.ts (posible)
```

---

### 3. **Security (Seguridad)**
Gestión de seguridad y códigos de acceso.

#### Features Incluidas:
- ✅ **Passcode Lock Toggle** - Habilitar/deshabilitar bloqueo con código
- ✅ **Current Passcode Display** - Mostrar código actual (si existe)
- ✅ **New Passcode Setup** - Crear nuevo código de acceso
  - Input con visibilidad toggle (mostrar/ocultar)
  - Confirmación de código
  - Validación (mínimo 4 dígitos)
- ✅ **Reset to Default** - Resetear a código por defecto (1234)

#### Archivos Involucrados:
```
src/components/UnifiedConfiguration.tsx (líneas 1413-1478)
src/context/ConfigContext.tsx
  ├── passcodeLockEnabled
  ├── passcode
  ├── setPasscode()
  └── setPasscodeLockEnabled()
```

---

### 4. **Online Ordering (Pedidos Online / eCommerce)**
Configuración de la tienda online y URL de eCommerce.

#### Features Incluidas:
- ✅ **eCommerce Toggle** - Habilitar/deshabilitar tienda online
- ✅ **eCommerce URL Generation** - Generación automática de URL
  - Formato: `https://www.bizneai.com/shop/{storeId}`
  - Display de URL generada
  - Botón para copiar URL al portapapeles
- ✅ **Crypto Payment Status Display** - Estado de pagos crypto
  - Métodos de pago configurados
  - Lista de criptomonedas habilitadas
- ✅ **Regenerate Store URL** - Regenerar URL de tienda (no implementado)
- ✅ **Info Section** - Instrucciones de uso

#### Archivos Involucrados:
```
src/components/UnifiedConfiguration.tsx (líneas 1479-1538)
src/services/ecommerceService.ts
  └── generateEcommerceUrl()
src/context/ConfigContext.tsx
  └── ecommerceEnabled
expo-clipboard (copiar URL)
```

---

### 5. **Tax Settings (Configuración de Impuestos)**
Gestión de tasas de impuestos y cálculos.

#### Features Incluidas:
- ✅ **Tax Rate Input** - Configurar tasa de impuestos (%)
- ✅ **Tax Rate Save** - Guardar nueva tasa
- ✅ **Current Tax Rate Display** - Mostrar tasa actual
- ✅ **Tax Calculation Examples** - Ejemplos de cálculos
  - Ejemplo con $100.00 incluyendo impuesto
  - Cálculo de base + impuesto

#### Archivos Involucrados:
```
src/components/UnifiedConfiguration.tsx (líneas 1539-1559)
src/context/TaxContext.tsx
  ├── taxRate
  ├── setTaxRate()
  ├── calculateTax()
  └── calculateTotalWithTax()
```

---

### 6. **Crypto Payment Configuration (Configuración de Pagos Crypto)**
Configuración global y detallada de pagos con criptomonedas.

#### Features Incluidas:
- ✅ **Global Crypto Payment Toggle** - Habilitar/deshabilitar pagos crypto globalmente
- ✅ **Payment Methods Status** - Estado de métodos configurados
  - Lista de criptomonedas habilitadas
  - Indicadores visuales (✓/✗)
- ✅ **Blockchain Selection Grid** - Selección de blockchain
  - Bitcoin (BTC)
  - Ethereum (ETH)
  - Solana (SOL)
  - USDT (Tether)
  - XRP (Ripple)
- ✅ **Address Configuration per Crypto**
  - Input de dirección de wallet
  - Validación de formato de dirección
  - Guardar dirección
- ✅ **QR Code Generation** - Generar código QR para cada dirección
  - Visualización del QR code
  - Dirección mostrada debajo
  - Botón para guardar QR en fotos
- ✅ **Address Status Display** - Estado de cada dirección (configurada/no configurada)
- ✅ **All Configured Addresses Summary** - Resumen de todas las direcciones
  - Icono de cada crypto
  - Nombre y símbolo
  - Estado (Configured/Not Set)

#### Archivos Involucrados:
```
src/components/UnifiedConfiguration.tsx (líneas 1560-1771)
src/services/cryptoAddressService.ts
  ├── getCryptoAddresses()
  ├── saveCryptoAddress()
  ├── isValidBitcoinAddress()
  ├── isValidEthereumAddress()
  └── isValidSolanaAddress()
src/services/cryptoPaymentConfigService.ts
  ├── getCryptoPaymentConfig()
  ├── updateCryptoPayment()
  ├── getCryptoPaymentDisplay()
  └── CryptoPaymentConfig interface
react-native-qrcode-svg (generación de QR)
expo-media-library (guardar QR en fotos)
expo-file-system (manejo de archivos)
```

---

### 7. **BizneAI Chat Configuration (Configuración de Chat AI)**
Configuración del asistente de IA con OpenAI.

#### Features Incluidas:
- ✅ **OpenAI API Key Input** - Ingreso de clave API
  - Input con visibilidad toggle (mostrar/ocultar)
  - Placeholder: "sk-..."
- ✅ **API Key Status Display** - Estado de configuración
  - ✓ API Key configurada - Chat habilitado
  - ✗ No API Key - Chat deshabilitado
- ✅ **Save OpenAI API Key** - Guardar clave API
- ✅ **Instructions Section** - Instrucciones completas
  - Cómo obtener API key
  - Pasos detallados
  - Advertencia de seguridad

#### Archivos Involucrados:
```
src/components/UnifiedConfiguration.tsx (líneas 1772-1809)
src/context/ConfigContext.tsx
  ├── openAIKey
  └── setOpenAIKey()
```

---

### 8. **Advanced Settings (Configuraciones Avanzadas)**
Utilidades avanzadas para desarrollo, prueba y mantenimiento.

#### Features Incluidas:

##### 8.1 Sample Products (Productos de Muestra)
- ✅ **Add Sample Products** - Agregar 9 productos de prueba
  - Productos con imágenes de Unsplash
  - Para testing de POS
  - Auto-verificación y agregado si no hay productos
- ✅ **Update Product Images** - Actualizar imágenes de productos existentes
  - Agregar imágenes de Unsplash a productos sin imágenes

##### 8.2 Data Export (Exportación de Datos)
- ✅ **Export Data** - Exportar todos los datos a JSON
  - Exportación completa
  - Metadata de registros
  - Filename generado
  - Alert con resumen

##### 8.3 Reset & Clear (Resetear y Limpiar)
- ✅ **Reset Setup Wizard** - Resetear configuración de wizard
  - Confirmación requerida
  - Resetea toda la configuración
- ✅ **Clear All Data** - Eliminar TODOS los datos
  - Confirmación destructiva requerida
  - Elimina productos, ventas, inventario, configuraciones
  - Acción irreversible

##### 8.4 Developer Contact (Contacto con Desarrollador)
- ✅ **Contact Developer** - Contactar vía WhatsApp
  - Botón con logo de WhatsApp
  - Abre WhatsApp con mensaje pre-cargado
  - Número: +52 5527947775
  - Fallback si WhatsApp no está disponible

#### Archivos Involucrados:
```
src/components/UnifiedConfiguration.tsx (líneas 1810-1874)
src/services/database.ts
  ├── addSampleProducts()
  ├── updateSampleProductsWithImages()
  └── getProducts()
src/services/dataExportService.ts
  └── exportDataAsJSON()
src/services/clearAllDataService.ts
  └── clearAllApplicationData()
src/context/ConfigContext.tsx
  └── resetConfig()
react-native Linking (WhatsApp)
```

---

## 📁 Archivos Principales

### Componentes
```
app/configuration.tsx                          - Pantalla principal de configuración
app/screens/ConfigurationScreen.tsx           - Screen component wrapper
app/screens/ConfigurationHorizontalLayout.tsx - Layout horizontal
src/components/UnifiedConfiguration.tsx       - Componente principal (2393 líneas)
src/components/BusinessSyncComponent.tsx      - Componente de sincronización
src/components/ShopIdStatus.tsx                - Status del Shop ID
```

### Contextos (State Management)
```
src/context/ConfigContext.tsx                 - Configuración general de la tienda
src/context/TaxContext.tsx                    - Sistema de impuestos
src/context/SettingsContext.tsx               - Settings generales
src/context/UserContext.tsx                    - Autenticación y usuarios
src/context/OrientationContext.tsx             - Gestión de orientación
```

### Servicios de Negocio

#### Crypto Payments
```
src/services/cryptoAddressService.ts          - Gestión de direcciones crypto
src/services/cryptoPaymentConfigService.ts    - Configuración de pagos crypto
```

#### Shop & Store
```
src/services/shopService.ts                   - Gestión de tiendas y sincronización
src/services/shopIdService.ts                - Gestión de Shop ID
src/services/ecommerceService.ts             - Servicios de eCommerce
src/services/storeTypeApiService.ts          - API de tipos de tienda
```

#### Data Management
```
src/services/database.ts                      - Operaciones de base de datos
src/services/dataExportService.ts             - Exportación de datos
src/services/dataImportService.ts             - Importación de datos
src/services/clearAllDataService.ts           - Limpieza de datos
```

#### API & Sync
```
src/services/api.ts                           - Llamadas API generales
src/services/businessSyncService.ts           - Sincronización de negocio
src/services/appInitializationService.ts      - Inicialización de app
```

#### Otros Servicios Relacionados
```
src/services/ecommerceUploadService.ts        - Upload a eCommerce
src/services/productSyncService.ts            - Sincronización de productos
src/services/cloudinaryService.ts             - Upload de imágenes
```

### Librerías Externas
```
@expo/vector-icons                             - Iconos (Ionicons)
expo-file-system                               - Sistema de archivos
expo-location                                  - Servicios de ubicación
expo-media-library                             - Biblioteca de medios
expo-clipboard                                 - Portapapeles
react-native-qrcode-svg                       - Generación de QR codes
react-native Linking                           - Abrir URLs externas
```

---

## 📊 Resumen por Sección

| Sección | Features | Archivos Principales |
|---------|----------|---------------------|
| **Store Settings** | 8 features principales + 7 de sync | `shopService.ts`, `ConfigContext.tsx`, `shopIdService.ts` |
| **Business Sync** | 3 features | `BusinessSyncComponent.tsx` |
| **Security** | 4 features | `ConfigContext.tsx` |
| **Online Ordering** | 6 features | `ecommerceService.ts`, `cryptoPaymentConfigService.ts` |
| **Tax Settings** | 4 features | `TaxContext.tsx` |
| **Crypto Payment** | 9 features | `cryptoAddressService.ts`, `cryptoPaymentConfigService.ts` |
| **BizneAI Chat** | 4 features | `ConfigContext.tsx` |
| **Advanced Settings** | 8 features | `database.ts`, `dataExportService.ts`, `clearAllDataService.ts` |

**Total: 46 features principales** distribuidas en 8 secciones

---

## 🔄 Flujo de Datos

```
Usuario (Interacción)
    ↓
UnifiedConfiguration.tsx (UI Component)
    ↓
Contextos (State Management)
    ├── ConfigContext.tsx
    ├── TaxContext.tsx
    └── UserContext.tsx
    ↓
Servicios (Business Logic)
    ├── shopService.ts
    ├── cryptoAddressService.ts
    ├── ecommerceService.ts
    └── database.ts
    ↓
Storage Layer
    ├── AsyncStorage
    ├── SQLite Database
    └── Server API
    ↓
Persistencia y Sincronización
```

---

## 📝 Features Documentadas en Gherkin

El archivo `features/configuration.feature` documenta **20 escenarios** que cubren:

1. ✅ Ver pantalla de configuración
2. ✅ Configurar información de tienda
3. ✅ Establecer nombre de tienda
4. ✅ Establecer ubicación de tienda
5. ✅ Establecer dirección de tienda
6. ✅ Establecer tipo de tienda
7. ✅ Establecer ubicación GPS
8. ✅ Configurar ajustes de negocio
9. ✅ Establecer horarios de negocio
10. ✅ Establecer zona horaria
11. ✅ Establecer moneda
12. ✅ Configurar ajustes de pago
13. ✅ Habilitar métodos de pago
14. ✅ Configurar pagos crypto
15. ✅ Establecer direcciones crypto
16. ✅ Configurar ajustes de impuestos
17. ✅ Establecer tasa de impuestos
18. ✅ Configurar cálculo de impuestos
19. ✅ Configurar ajustes de IA
20. ✅ Establecer API key de OpenAI
21. ✅ Configurar preferencias de IA
22. ✅ Configurar ajustes de seguridad
23. ✅ Habilitar bloqueo con código
24. ✅ Establecer timeout de sesión
25. ✅ Configurar backup de datos
26. ✅ Establecer backup automático
27. ✅ Exportar configuración
28. ✅ Importar configuración
29. ✅ Resetear configuración
30. ✅ Validar configuración
31. ✅ Guardar configuración
32. ✅ Cancelar cambios de configuración
33. ✅ Ver historial de configuración
34. ✅ Backup de configuración

---

## 🎯 Características Especiales

### Auto-Features (Automáticas)
- ✅ **Auto-check de productos de muestra** - Verifica y agrega productos si la base está vacía
- ✅ **Auto-reload de configuración** - Recarga desde servidor después de sincronización
- ✅ **Auto-generación de URL eCommerce** - Genera URL automáticamente basada en nombre de tienda

### Validaciones
- ✅ Validación de formato de direcciones crypto (Bitcoin, Ethereum, Solana)
- ✅ Validación de código de acceso (mínimo 4 dígitos)
- ✅ Validación de tasa de impuestos (>= 0)
- ✅ Validación de formato de Shop URL

### Permisos Requeridos
- 📍 **Location** - Para capturar GPS
- 📸 **Media Library** - Para guardar QR codes en fotos
- 🔗 **Linking** - Para abrir WhatsApp

---

## 📚 Documentación Relacionada

- `docs/CONFIGURATION_FILES_LIST.md` - Lista detallada de archivos
- `docs/CONFIGURATION_ARCHITECTURE.md` - Arquitectura del sistema
- `features/configuration.feature` - Features documentadas en Gherkin
- `features/FEATURES_SUMMARY.md` - Resumen general de features

---

**Última actualización:** Enero 2025  
**Estado:** ✅ COMPLETADO  
**Componente principal:** `src/components/UnifiedConfiguration.tsx` (2393 líneas)

