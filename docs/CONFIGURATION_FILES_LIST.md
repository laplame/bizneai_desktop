# Lista de Archivos de Lógica de Configuración

## 📋 Archivos Usados en UnifiedConfiguration.tsx

### 🔧 **Contextos (State Management)**
```
src/context/
├── ConfigContext.tsx         - Configuración general de la tienda
│   ├── storeName, storeLocation
│   ├── streetAddress, city, state, zip
│   ├── storeType (restaurant, retail, etc.)
│   ├── gpsLocation
│   ├── theme settings
│   └── receiptFooter
│
├── TaxContext.tsx            - Sistema de impuestos
│   ├── taxRate (tasa de impuestos)
│   ├── calculateTax()
│   ├── calculateTotalWithTax()
│   └── calculateBaseFromInclusive()
│
├── SettingsContext.tsx        - Settings generales
│   ├── debugMode
│   └── loadSettings()
│
└── UserContext.tsx           - Autenticación y usuarios
    ├── user management
    ├── passcode settings
    └── permissions
```

### 🛠️ **Servicios Importados Directamente**

#### 1. **Crypto Payment Services**
```typescript
src/services/cryptoAddressService.ts
├── getCryptoAddresses()
├── saveCryptoAddress()
├── getCryptoAddress(currency)
├── isValidBitcoinAddress()
├── isValidEthereumAddress()
└── isValidSolanaAddress()

src/services/cryptoPaymentConfigService.ts
├── getCryptoPaymentConfig()
├── updateCryptoPayment()
├── getCryptoPaymentDisplay()
└── CryptoPaymentConfig interface
```

#### 2. **Shop & Store Services**
```typescript
src/services/shopService.ts
├── getLocalShopData()
├── getShopId()
├── getStoreTypes()
├── syncShopData()
├── StoreType interface
└── store sync logic

src/services/ecommerceService.ts
├── generateEcommerceUrl()
└── eCommerce integration logic
```

#### 3. **Data Management Services**
```typescript
src/services/database.ts
├── addSampleProducts()
├── updateSampleProductsWithImages()
├── getProducts()
└── database operations

src/services/dataExportService.ts
├── exportDataAsJSON()
└── backup functionality
```

### 📁 **Servicios Relacionados (No Importados Pero Críticos)**

#### 4. **Backend Services**
```typescript
src/services/api.ts              - API calls
src/services/apiMonitor.ts       - API monitoring
src/services/businessSyncService.ts - Business sync
src/services/cloudinaryService.ts  - Image upload
src/services/config.ts            - Configuration constants
```

#### 5. **Payment & Transactions**
```typescript
src/services/cryptoPriceService.ts    - Crypto price fetching
src/services/salesDatabase.ts         - Sales storage
src/services/ticketService.ts         - Ticket generation
src/services/ticketConfigService.ts   - Ticket configuration
```

#### 6. **Inventory & Products**
```typescript
src/services/inventoryDatabase.ts      - Inventory management
src/services/productSyncService.ts    - Product synchronization
src/services/productApiService.ts     - Product API calls
src/services/providersService.ts       - Providers management
```

#### 7. **System Services**
```typescript
src/services/appInitializationService.ts - App initialization
src/services/clearAllDataService.ts      - Data clearing
src/services/dataImportService.ts        - Data import
src/services/errorHandler.ts              - Error handling
src/services/logbookService.ts           - Activity logging
src/services/shopIdService.ts            - Shop ID management
src/services/storeTypeApiService.ts      - Store types API
```

#### 8. **Media & Storage**
```typescript
src/services/imageProcessor.ts           - Image processing
src/services/imageUploader.ts            - Image upload
src/services/localPhotoStorage.ts        - Local photo storage
src/services/ticketBluetoothService.ts   - Bluetooth printing
src/services/ticketPrintService.ts       - Ticket printing
```

#### 9. **Ecommerce & Online**
```typescript
src/services/ecommerceUploadService.ts   - Ecommerce upload
src/services/testDataDetectionService.ts - Test data detection
```

#### 10. **Utilities**
```typescript
src/services/validation.ts               - Input validation
src/services/ticketFormatExamples.ts     - Ticket examples
```

### 🎨 **Componentes Visuales**

```typescript
src/components/
└── BusinessSyncComponent.tsx    - Componente de sincronización
```

### 📊 **Estructura de Configuración**

#### **ConfigContext** (`src/context/ConfigContext.tsx`)
- **Store Information**:
  - `storeName` - Nombre de la tienda
  - `storeLocation` - Ubicación
  - `streetAddress` - Dirección
  - `city` - Ciudad
  - `state` - Estado
  - `zip` - Código postal
  - `storeType` - Tipo de tienda
  - `gpsLocation` - Ubicación GPS

- **Business Settings**:
  - `receiptFooter` - Pie de página del recibo
  - `theme` - Tema de la aplicación
  - `currency` - Moneda
  - `lowStockAlerts` - Alertas de stock bajo
  - `autoBackup` - Backup automático

#### **TaxContext** (`src/context/TaxContext.tsx`)
- `taxRate` - Tasa de impuestos (%)
- `calculateTax(amount)` - Calcula impuesto
- `calculateTotalWithTax(amount)` - Calcula total con impuesto
- `setTaxRate(rate)` - Guarda tasa de impuestos

### 🔑 **Funcionalidades Clave en UnifiedConfiguration**

1. **Store Configuration**
   - Store name, location, address
   - Store type selection
   - GPS location capture

2. **Tax Settings**
   - Tax rate configuration
   - Tax calculation examples

3. **Crypto Payments**
   - Cryptocurrency addresses
   - Payment configuration
   - QR code generation

4. **eCommerce**
   - Online store URL
   - eCommerce URL generation

5. **Backup & Export**
   - Data export functionality
   - JSON backup creation

6. **Sample Data**
   - Add sample products
   - Update with images

### 🔄 **Flujo de Datos**

```
User Input (UnifiedConfiguration.tsx)
    ↓
Context Updates (ConfigContext, TaxContext)
    ↓
Service Layer (services/*.ts)
    ↓
Storage (AsyncStorage, Database)
    ↓
App-Wide Availability
```

### 📝 **NOTAS IMPORTANTES**

1. **ConfigContext** es el contexto principal para toda la configuración de la tienda
2. **TaxContext** maneja todos los cálculos de impuestos
3. Los servicios se encargan de la lógica de negocio y persistencia
4. Todos los contextos deben estar provistos en `app/_layout.tsx`

### 🎯 **Archivos para Modificaciones Avanzadas**

**Prioridad Alta:**
- `src/context/ConfigContext.tsx` - Configuración general
- `src/context/TaxContext.tsx` - Sistema de impuestos
- `src/services/config.ts` - Constantes de configuración
- `src/services/database.ts` - Operaciones de base de datos
- `src/services/dataExportService.ts` - Exportación de datos

**Prioridad Media:**
- `src/services/cryptoAddressService.ts` - Pagos crypto
- `src/services/shopService.ts` - Sincronización de tiendas
- `src/services/ecommerceService.ts` - Tienda online
- `src/services/inventoryDatabase.ts` - Inventario

**Prioridad Baja:**
- `src/services/validation.ts` - Validaciones
- `src/services/errorHandler.ts` - Manejo de errores

