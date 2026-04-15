# Arquitectura de Configuración - UnifiedConfiguration.tsx

## 🏗️ Estructura General

### **Jerarquía de Contextos**

```
┌─────────────────────────────────────────┐
│     app/_layout.tsx                      │
│  (Provider Setup)                       │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼───────────┐  ┌───▼───────────┐
│ ConfigContext │  │  TaxContext   │
└───────────────┘  └───────────────┘
```

### **Importaciones Críticas**

```typescript
// Contextos de estado global
import { useConfig } from '../context/ConfigContext';
import { useTax } from '../context/TaxContext';

// Servicios de negocio
import { getCryptoAddresses, ... } from '../services/cryptoAddressService';
import { getCryptoPaymentConfig, ... } from '../services/cryptoPaymentConfigService';
import { getLocalShopData, syncShopData } from '../services/shopService';
import { generateEcommerceUrl } from '../services/ecommerceService';
import { exportDataAsJSON } from '../services/dataExportService';
import { addSampleProducts } from '../services/database';
```

---

## 📂 Detalle de Contextos

### **1. ConfigContext** (`src/context/ConfigContext.tsx`)

**Responsabilidades:**
- Gestión del nombre de la tienda
- Información de ubicación (dirección, GPS)
- Tipo de tienda
- Configuración de recibo
- Preferencias de negocio

**Estado:**
```typescript
interface ConfigState {
  storeName: string;
  storeLocation: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  storeType: StoreType;
  gpsLocation: { latitude: number; longitude: number };
  receiptFooter?: string;
  // ... más campos
}
```

**Funciones clave:**
- `updateConfig(config)` - Actualiza configuración completa
- `saveConfig()` - Persiste en AsyncStorage
- `loadConfig()` - Carga de AsyncStorage

---

### **2. TaxContext** (`src/context/TaxContext.tsx`)

**Responsabilidades:**
- Tasa de impuestos configurable
- Cálculo de impuestos
- Cálculo de totales con impuestos incluidos
- Conversión entre precios con/sin impuestos

**Estado:**
```typescript
interface TaxState {
  taxRate: number; // Porcentaje (ej: 8.5 para 8.5%)
}
```

**Funciones clave:**
- `calculateTax(amount)` - Calcula impuesto sobre monto
- `calculateTotalWithTax(amount)` - Calcula total con impuesto
- `calculateTaxFromInclusive(inclusiveAmount)` - Extrae impuesto de un total
- `calculateBaseFromInclusive(inclusiveAmount)` - Obtiene base sin impuesto
- `setTaxRate(rate)` - Guarda nueva tasa

**Storage Key:** `@tax_rate`

---

## 🔧 Servicios Principales

### **1. cryptoAddressService.ts**

**Propósito:** Gestión de direcciones de criptomonedas

**Funciones:**
```typescript
// Obtener todas las direcciones guardadas
getCryptoAddresses(): Promise<{ [key: string]: string }>

// Obtener dirección específica
getCryptoAddress(currency: string): Promise<string | null>

// Guardar dirección
saveCryptoAddress(currency: string, address: string): Promise<void>

// Validadores
isValidBitcoinAddress(address: string): boolean
isValidEthereumAddress(address: string): boolean
isValidSolanaAddress(address: string): boolean
```

**Storage Key:** `@crypto_address`

---

### **2. cryptoPaymentConfigService.ts**

**Propósito:** Configuración de pagos con criptomonedas

**Tipos:**
```typescript
interface CryptoPaymentConfig {
  enabled: boolean;
  currencies: string[];
  displayNames: { [key: string]: string };
}
```

**Funciones:**
```typescript
getCryptoPaymentConfig(): Promise<CryptoPaymentConfig>
updateCryptoPayment(config: CryptoPaymentConfig): Promise<void>
getCryptoPaymentDisplay(): Promise<string[]>
```

---

### **3. shopService.ts**

**Propósito:** Sincronización con servidor y gestión de datos de tienda

**Tipos:**
```typescript
interface LocalShopData {
  id?: string;
  name: string;
  location: string;
  // ... más campos
}

interface StoreType {
  id: string;
  name: string;
  description?: string;
}
```

**Funciones:**
```typescript
// Obtener datos locales de la tienda
getLocalShopData(): Promise<LocalShopData | null>

// Obtener ID de tienda
getShopId(): Promise<string>

// Obtener tipos de tienda desde servidor
getStoreTypes(): Promise<StoreType[]>

// Sincronizar datos con servidor
syncShopData(shopData: LocalShopData): Promise<boolean>
```

---

### **4. ecommerceService.ts**

**Propósito:** Generación de URLs de eCommerce

**Funciones:**
```typescript
generateEcommerceUrl(shopId: string): string
```

**URL Pattern:** `https://www.bizneai.com/shop/{shopId}`

---

### **5. dataExportService.ts**

**Propósito:** Exportación y backup de datos

**Funciones:**
```typescript
exportDataAsJSON(): Promise<string>
```

**Datos incluidos:**
- Productos
- Ventas
- Inventario
- Configuración
- Usuarios
- Tasa de impuestos

---

### **6. database.ts**

**Propósito:** Operaciones de base de datos SQLite

**Funciones:**
```typescript
// Agregar productos de ejemplo
addSampleProducts(): Promise<void>

// Actualizar productos con imágenes
updateSampleProductsWithImages(): Promise<void>

// Obtener productos
getProducts(): Promise<Product[]>

// ... más operaciones CRUD
```

---

## 🔄 Flujo de Configuración

### **1. Actualización de Configuración de Tienda**

```mermaid
User Input
    ↓
UnifiedConfiguration Component
    ↓
config.updateConfig()
    ↓
ConfigContext setConfig()
    ↓
AsyncStorage.setItem()
    ↓
App-wide sync
```

### **2. Actualización de Tasa de Impuestos**

```mermaid
User Input Tax Rate
    ↓
tax.setTaxRate(rate)
    ↓
TaxContext setTaxRate()
    ↓
AsyncStorage.setItem('@tax_rate')
    ↓
calculateTax() updated app-wide
```

### **3. Guardado de Dirección Crypto**

```mermaid
User Input Address + Validation
    ↓
saveCryptoAddress(currency, address)
    ↓
AsyncStorage.setItem('@crypto_address', {...})
    ↓
getCryptoAddresses() updated
```

---

## 📱 Integración con Pantallas

### **Pantallas que Usan Config**

1. **POS Screen** (`app/pos.tsx`)
   - Accede a `storeName` para mostrar en header
   - Usa taxRate para cálculos

2. **Ticket/Cashier** (`app/cashier.tsx`)
   - Usa `receiptFooter` para tickets
   - Usa `storeName`, address para encabezado

3. **Configuration** (`app/configuration.tsx`)
   - Edita directamente configuración
   - Usa UnifiedConfiguration como contenido

4. **Cart** (`app/cart.tsx`)
   - Usa `taxRate` para cálculo de impuestos
   - Usa configuración para display

---

## 🔐 Storage Keys

```typescript
// Configuración general
'@BizneAI_config' - Configuración completa de tienda

// Impuestos
'@tax_rate' - Tasa de impuestos

// Criptomonedas
'@crypto_address' - Direcciones de criptomonedas
'@crypto_payment_config' - Configuración de pagos crypto

// Shop
'@shop_data' - Datos de tienda local
'@shop_id' - ID de tienda

// Otros
'@BizneAI_settings' - Settings generales
```

---

## 🎯 Puntos de Extensión

### **Para Agregar Nuevos Campos de Configuración:**

1. **Actualizar ConfigContext:**
   - Agregar campo a `ConfigState` interface
   - Agregar getter/setter en `ConfigProvider`
   - Actualizar `loadConfig()` y `saveConfig()`

2. **Actualizar UnifiedConfiguration:**
   - Agregar state local para el campo
   - Agregar UI (input, switch, etc.)
   - Conectar con `config.updateConfig()`

3. **Actualizar Storage:**
   - Agregar clave de AsyncStorage si es necesario
   - Actualizar export/import en dataExportService

### **Para Agregar Nuevo Tipo de Configuración:**

1. Crear nuevo servicio en `src/services/`
2. Agregar Context si requiere estado global
3. Importar y usar en UnifiedConfiguration
4. Agregar UI en sección apropiada

---

## 🚨 Consideraciones Importantes

### **Migración de Datos**
- Si se cambian nombres de campos, implementar migración
- Mantener compatibilidad con versiones anteriores
- Validar datos al cargar

### **Validación**
- Usar `validation.ts` para validar inputs
- Validar antes de guardar
- Mostrar mensajes de error claros

### **Performance**
- Debounce en inputs de texto
- Lazy loading de store types
- Cache de configuración

### **Error Handling**
- Try-catch en todas las operaciones async
- Mostrar feedback al usuario
- Log de errores para debugging

---

## 📊 Estructura de Datos

### **Config State Example**
```typescript
{
  storeName: "My Store",
  storeLocation: "Downtown",
  streetAddress: "123 Main St",
  city: "New York",
  state: "NY",
  zip: "10001",
  storeType: "Restaurant",
  gpsLocation: {
    latitude: 40.7128,
    longitude: -74.0060
  },
  receiptFooter: "Thank you for your visit!",
  theme: "dark",
  currency: "USD",
  lowStockAlerts: true,
  autoBackup: true
}
```

### **Tax State Example**
```typescript
{
  taxRate: 8.5  // 8.5%
}
```

### **Crypto Addresses Example**
```typescript
{
  "bitcoin": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "ethereum": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "solana": "SOL123456789..."
}
```

