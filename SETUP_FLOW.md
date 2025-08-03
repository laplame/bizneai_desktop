# Flujo de Configuración Inicial - BizneAI POS

## 🎯 Descripción

El flujo de configuración inicial se ejecuta la primera vez que se abre la aplicación. Permite al usuario configurar su tienda con toda la información necesaria para comenzar a operar.

## 📋 Pasos del Flujo

### Paso 1: Información Básica de la Tienda
- **Nombre de la Tienda**: Nombre comercial del negocio
- **Tipo de Negocio**: Selección entre diferentes tipos predefinidos:
  - Cafetería
  - Restaurante
  - Tienda Minorista
  - Comida Rápida
  - Panadería
  - Bar
  - Supermercado
  - Otro

### Paso 2: Ubicación
- **Ubicación/Área**: Área o zona donde se encuentra
- **Dirección**: Dirección específica de la tienda
- **Ciudad**: Ciudad donde opera
- **Estado/Provincia**: Estado o provincia
- **Código Postal**: Código postal

### Paso 3: Métodos de Pago
- **Métodos Tradicionales** (siempre habilitados):
  - Efectivo
  - Tarjetas de crédito/débito
- **Criptomonedas** (opcionales):
  - Bitcoin (BTC)
  - Ethereum (ETH)
  - Luxae (LUX)
  - Cardano (ADA)
  - Solana (SOL)
  - Polkadot (DOT)

### Paso 4: Funcionalidades Avanzadas
- **E-commerce**: Habilitar ventas online
- **Sistema de Cocina**: Gestión de pedidos y preparación
- **Pagos con Criptomonedas**: Aceptar pagos en criptomonedas

## 🔧 Estructura de Datos

### Payload del Endpoint `/api/store/setup`

```json
{
  "storeName": "Mi Tienda",
  "storeType": "CoffeeShop",
  "storeLocation": "Centro Comercial",
  "streetAddress": "Av. Principal 123",
  "city": "Ciudad",
  "state": "Estado",
  "zip": "12345",
  "clientId": "client-001",
  "ecommerceEnabled": true,
  "kitchenEnabled": true,
  "crypto": true,
  "acceptedCryptocurrencies": ["bitcoin", "ethereum", "luxae"]
}
```

## 🚀 Implementación

### Componentes Principales

1. **`InitialSetup.tsx`**: Componente principal del flujo de configuración
2. **`store.ts`** (API): Servicios para manejar la configuración
3. **`store.ts`** (Types): Interfaces TypeScript
4. **`api.ts`**: Configuración de endpoints

### Flujo de la Aplicación

1. **Verificación Inicial**: Al cargar la app, se verifica si ya existe configuración
2. **Pantalla de Configuración**: Si no hay configuración, se muestra el flujo
3. **Persistencia**: Los datos se guardan en localStorage y se envían al servidor
4. **Redirección**: Una vez completado, se redirige al POS principal

### Estados de la Aplicación

```typescript
// Estado de configuración
const [isSetupComplete, setIsSetupComplete] = useState<boolean>(false);

// Si no está configurado, mostrar pantalla de configuración
if (!isSetupComplete) {
  return <InitialSetup onSetupComplete={() => setIsSetupComplete(true)} />;
}
```

## 📱 Características de la UI

### Diseño Responsivo
- **Desktop**: Layout de 2 columnas para tipos de negocio
- **Mobile**: Layout de 1 columna adaptativo
- **Tablet**: Layout híbrido

### Elementos Visuales
- **Barra de Progreso**: Muestra el avance del flujo
- **Iconos**: Representación visual de cada tipo de negocio
- **Colores**: Esquema de colores consistente con la marca
- **Animaciones**: Transiciones suaves entre pasos

### Validaciones
- **Campos Requeridos**: Validación en tiempo real
- **Formato de Datos**: Validación de códigos postales, emails, etc.
- **Feedback Visual**: Indicadores de éxito y error

## 🔄 Persistencia de Datos

### LocalStorage
```javascript
// Guardar configuración
localStorage.setItem('bizneai-store-config', JSON.stringify(config));
localStorage.setItem('bizneai-setup-complete', 'true');

// Recuperar configuración
const config = localStorage.getItem('bizneai-store-config');
const isComplete = localStorage.getItem('bizneai-setup-complete') === 'true';
```

### API Endpoints
- **GET** `/api/store/status` - Verificar estado de configuración
- **POST** `/api/store/setup` - Configurar tienda inicialmente
- **GET** `/api/store/config` - Obtener configuración actual
- **PUT** `/api/store/update` - Actualizar configuración

## 🧪 Testing

### Casos de Prueba
1. **Configuración Completa**: Flujo completo sin errores
2. **Validaciones**: Campos requeridos y formatos
3. **Persistencia**: Verificar que los datos se guarden correctamente
4. **Errores de Red**: Manejo de errores de conexión
5. **Navegación**: Botones anterior/siguiente funcionando

### Mock API
Para desarrollo, se incluye un mock API que simula:
- Delays de red (1 segundo)
- Persistencia en localStorage
- Manejo de errores
- Respuestas exitosas

## 🎨 Personalización

### Temas de Colores
```css
/* Colores principales */
--primary-color: #3B82F6;    /* Azul */
--success-color: #10B981;    /* Verde */
--warning-color: #F59E0B;    /* Amarillo */
--error-color: #EF4444;      /* Rojo */
```

### Tipos de Negocio
Los tipos de negocio se pueden personalizar editando el array `storeTypes` en `InitialSetup.tsx`.

### Criptomonedas
Las criptomonedas disponibles se pueden modificar en el array `cryptocurrencies`.

## 📞 Soporte

Para problemas o consultas sobre el flujo de configuración:
- **Email**: info@bizneai.com
- **GitHub**: https://github.com/bizneai/pos-system/issues 