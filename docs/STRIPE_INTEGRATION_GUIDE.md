# Guía de Integración de Stripe - Paywall System

## 📅 Estado Actual
**Última actualización:** Enero 2025

## ✅ Lo que está implementado

### 1. Componente StripePaywallModal
**Archivo:** `src/components/StripePaywallModal.tsx`

**Características implementadas:**
- ✅ Modal completo con diseño moderno y responsive
- ✅ Selector de planes (Basic, AI, Copilot)
- ✅ Visualización de características por plan
- ✅ Precios y moneda configurados
- ✅ Botón de suscripción con estados de carga
- ✅ Botón de contacto por WhatsApp integrado
- ✅ Internacionalización completa (ES/EN)
- ✅ Manejo de errores y estados
- ✅ Integración con `expo-linking` para abrir Stripe Checkout

**Planes disponibles:**
- **Plan Básico** ($15 USD/mes) - Disponible
- **Plan AI** ($25 USD/mes) - Disponible
- **Plan Copiloto** ($35 USD/mes) - Próximamente

### 2. Integración en UnifiedConfiguration
**Archivo:** `src/components/UnifiedConfiguration.tsx`

**Funcionalidades:**
- ✅ Paywall se muestra al intentar activar ecommerce
- ✅ Toggle de ecommerce bloqueado hasta completar pago
- ✅ Activación automática de ecommerce después de pago exitoso
- ✅ Sincronización con servidor después del pago
- ✅ Generación automática de URL de ecommerce
- ✅ Integración con AI Provider Selector (requiere plan)
- ✅ Integración con Role Menu Visibility (requiere plan)

### 3. Sistema de Listener CRUD
**Archivo:** `src/services/crudEventListenerService.ts`

**Características:**
- ✅ Listener automático para todas las operaciones CRUD
- ✅ Solo envía eventos si `ecommerceEnabled === true`
- ✅ Cola de eventos persistente para reintentos
- ✅ Procesamiento automático cada 30 segundos
- ✅ Soporte para: Productos, Ventas, Inventario, Clientes, Órdenes

**Integración:**
- ✅ Productos: `addProduct()`, `updateProduct()`, `deleteProduct()`
- ✅ Ventas: `createSale()`, `updateSale()`, `deleteSale()`

### 4. Traducciones
**Archivos:** `lib/i18n/translations/es.json`, `lib/i18n/translations/en.json`

**Claves implementadas:**
- ✅ `stripePaywall.title` - Título del modal
- ✅ `stripePaywall.message` - Mensaje explicativo
- ✅ `stripePaywall.plans.basic.*` - Plan Básico
- ✅ `stripePaywall.plans.ai.*` - Plan AI
- ✅ `stripePaywall.plans.copilot.*` - Plan Copiloto
- ✅ `stripePaywall.subscribe` - Botón de suscripción
- ✅ `stripePaywall.checkoutOpened` - Mensaje al abrir checkout
- ✅ `stripePaywall.checkoutMessage` - Instrucciones
- ✅ `stripePaywall.activationSuccess` - Mensaje de éxito
- ✅ `stripePaywall.contactWhatsApp` - Botón WhatsApp
- ✅ `stripePaywall.whatsappMessage` - Mensaje pre-llenado
- ✅ `stripePaywall.footerNote` - Nota de seguridad

### 5. Flujo de Usuario Implementado

```
1. Usuario completa onboarding
   ↓
2. Redirigido a /configuration
   ↓
3. Usuario intenta activar ecommerce
   ↓
4. Se muestra StripePaywallModal
   ↓
5. Usuario selecciona plan
   ↓
6. Usuario hace clic en "Suscribirse"
   ↓
7. Se abre Stripe Checkout en navegador (placeholder URL)
   ↓
8. Usuario completa pago (pendiente verificación real)
   ↓
9. Ecommerce se activa automáticamente
   ↓
10. Sistema CRUD listener comienza a enviar eventos
```

### 6. Redirección Post-Onboarding
**Archivo:** `app/screens/OnboardingScreen.tsx`
- ✅ Usuarios redirigidos a `/configuration` después del onboarding
- ✅ Guía directa hacia la activación del plan

---

## ❌ Lo que falta por implementar

### 1. Backend - Endpoint para Stripe Checkout

**Pendiente:**
- [ ] Crear endpoint `POST /api/stripe/create-checkout-session`
- [ ] Generar sesión de Stripe Checkout con shopId y plan
- [ ] Retornar URL de checkout real
- [ ] Incluir `client_reference_id` con shopId
- [ ] Configurar URLs de éxito y cancelación

**Código actual (placeholder):**
```typescript
// src/components/StripePaywallModal.tsx línea 129-131
const checkoutUrl = shopId 
  ? `https://checkout.stripe.com/pay/...?client_reference_id=${shopId}&plan=${selectedPlan}`
  : `https://checkout.stripe.com/pay/...?plan=${selectedPlan}`;
```

**Implementación requerida:**
```typescript
// Backend endpoint necesario
POST /api/stripe/create-checkout-session
Body: {
  shopId: string,
  planType: 'basic' | 'ai' | 'copilot',
  successUrl: string, // Deep link de éxito
  cancelUrl: string   // Deep link de cancelación
}

Response: {
  success: boolean,
  checkoutUrl: string, // URL real de Stripe Checkout
  sessionId: string
}
```

### 2. Webhook de Stripe

**Pendiente:**
- [ ] Crear endpoint `POST /api/stripe/webhook`
- [ ] Verificar firma del webhook (Stripe-Signature header)
- [ ] Manejar eventos:
  - `checkout.session.completed` - Pago exitoso
  - `customer.subscription.created` - Suscripción creada
  - `customer.subscription.updated` - Suscripción actualizada
  - `customer.subscription.deleted` - Suscripción cancelada
  - `invoice.payment_succeeded` - Pago de renovación exitoso
  - `invoice.payment_failed` - Pago fallido
- [ ] Actualizar estado de suscripción en base de datos
- [ ] Notificar a la app (push notification o polling)

**Eventos críticos a manejar:**
```typescript
// checkout.session.completed
- Actualizar shop.ecommerceEnabled = true
- Guardar subscriptionId en shop
- Guardar customerId en shop
- Activar funciones premium

// invoice.payment_failed
- Notificar al usuario
- Permitir reintento de pago
- Desactivar funciones si falla múltiples veces
```

### 3. Deep Linking

**Pendiente:**
- [ ] Configurar esquema de URL en `app.json`
  ```json
  {
    "scheme": "bizneai",
    "associatedDomains": ["applinks:bizneai.com"]
  }
  ```
- [ ] Implementar handler en `app/_layout.tsx`
- [ ] Manejar URLs de retorno:
  - `bizneai://stripe/success?session_id=xxx`
  - `bizneai://stripe/cancel?session_id=xxx`
- [ ] Verificar estado de pago al regresar
- [ ] Actualizar UI según resultado

**Implementación requerida:**
```typescript
// app/_layout.tsx
useEffect(() => {
  const subscription = Linking.addEventListener('url', handleDeepLink);
  return () => subscription.remove();
}, []);

const handleDeepLink = async (event: { url: string }) => {
  const { pathname, queryParams } = Linking.parse(event.url);
  
  if (pathname === 'stripe/success') {
    const sessionId = queryParams?.session_id;
    // Verificar pago con backend
    await verifyPayment(sessionId);
  }
};
```

### 4. Verificación de Pago

**Pendiente:**
- [ ] Crear endpoint `GET /api/stripe/verify-payment/:sessionId`
- [ ] Verificar estado de sesión con Stripe API
- [ ] Actualizar estado local si pago es exitoso
- [ ] Implementar polling como fallback si deep link falla
- [ ] Manejar casos de pago fallido o cancelado

**Código actual (placeholder):**
```typescript
// src/components/StripePaywallModal.tsx línea 150-152
setTimeout(() => {
  onSuccess(selectedPlan);
}, 2000);
```

**Implementación requerida:**
```typescript
// Reemplazar placeholder con verificación real
const verifyPayment = async (sessionId: string) => {
  const response = await makeApiRequest(`/stripe/verify-payment/${sessionId}`);
  if (response.success && response.data.paid) {
    onSuccess(selectedPlan);
  }
};
```

### 5. Gestión de Suscripciones

**Pendiente:**
- [ ] Pantalla de estado de suscripción
  - Mostrar plan actual
  - Fecha de renovación
  - Historial de pagos
  - Estado de la suscripción
- [ ] Opción para cancelar suscripción
- [ ] Opción para cambiar de plan
- [ ] Manejo de renovaciones automáticas
- [ ] Notificaciones de vencimiento próximo
- [ ] Manejo de pagos fallidos

### 6. Modelo de Datos en Backend

**Pendiente:**
- [ ] Agregar campos a modelo Shop:
  ```typescript
  {
    subscriptionId?: string,      // ID de suscripción en Stripe
    customerId?: string,          // ID de cliente en Stripe
    subscriptionStatus?: string,  // active, canceled, past_due, etc.
    subscriptionPlan?: string,     // basic, ai, copilot
    subscriptionStartDate?: Date,
    subscriptionEndDate?: Date,
    lastPaymentDate?: Date,
    nextPaymentDate?: Date
  }
  ```
- [ ] Crear modelo Subscription en MongoDB
- [ ] Sincronizar estado de suscripción con Stripe

### 7. Seguridad

**Pendiente:**
- [ ] Validar firma de webhook de Stripe
- [ ] Nunca exponer claves secretas en el cliente
- [ ] Verificar siempre el estado en el servidor
- [ ] Implementar rate limiting en endpoints de pago
- [ ] Logging de eventos de pago para auditoría

---

## 🔧 Opciones de Implementación

### Opción 1: SDK Nativo de Stripe (Recomendado para Producción)

**Paquete:** `@stripe/stripe-react-native`

**Ventajas:**
- ✅ Integración nativa dentro de la app
- ✅ Payment Sheet nativo (mejor UX)
- ✅ Soporte para Apple Pay y Google Pay
- ✅ Guardar tarjetas para futuros pagos
- ✅ No requiere salir de la app

**Desventajas:**
- ❌ Requiere desarrollo nativo (no funciona en Expo Go)
- ❌ Necesita EAS Build o desarrollo nativo
- ❌ Configuración más compleja

**Instalación:**
```bash
npx expo install @stripe/stripe-react-native
```

**Requisitos:**
- Expo SDK 53+ (compatible)
- Development build o producción build
- Configuración en `app.json` y código nativo

---

### Opción 2: Stripe Checkout (Página Externa) - **ACTUALMENTE EN USO**

**Método:** Abrir URL de Stripe Checkout en navegador

**Ventajas:**
- ✅ Muy simple de implementar
- ✅ Funciona en Expo Go
- ✅ No requiere código nativo
- ✅ Stripe maneja toda la UI

**Desventajas:**
- ❌ Usuario sale de la app
- ❌ Menor control sobre la experiencia
- ❌ Requiere manejar deep links para volver

**Estado actual:**
- ✅ UI implementada
- ✅ Integración con `expo-linking`
- ❌ URL de checkout es placeholder
- ❌ Falta deep linking de retorno
- ❌ Falta verificación de pago

---

### Opción 3: Payment Element con WebView (Intermedio)

**Método:** Usar `react-native-webview` con Stripe Payment Element

**Ventajas:**
- ✅ No requiere código nativo
- ✅ UI personalizable
- ✅ Permanece en la app (dentro de WebView)

**Desventajas:**
- ❌ WebView puede tener limitaciones
- ❌ Menos nativo que Payment Sheet
- ❌ Requiere manejar comunicación WebView ↔ App

---

## 📋 Checklist de Implementación

### Fase 1: Backend Básico (Prioridad Alta)
- [ ] Instalar Stripe SDK en backend
- [ ] Configurar claves de API de Stripe
- [ ] Crear endpoint `POST /api/stripe/create-checkout-session`
- [ ] Crear endpoint `POST /api/stripe/webhook`
- [ ] Crear endpoint `GET /api/stripe/verify-payment/:sessionId`
- [ ] Actualizar modelo Shop con campos de suscripción

### Fase 2: Deep Linking (Prioridad Alta)
- [ ] Configurar esquema de URL en `app.json`
- [ ] Implementar handler de deep links en `app/_layout.tsx`
- [ ] Actualizar `StripePaywallModal` para usar URL real del backend
- [ ] Implementar verificación de pago al regresar

### Fase 3: Webhooks (Prioridad Media)
- [ ] Configurar webhook en Stripe Dashboard
- [ ] Implementar verificación de firma
- [ ] Manejar eventos de suscripción
- [ ] Actualizar estado en base de datos
- [ ] Notificar cambios a la app

### Fase 4: Gestión de Suscripciones (Prioridad Media)
- [ ] Crear pantalla de estado de suscripción
- [ ] Implementar cancelación de suscripción
- [ ] Implementar cambio de plan
- [ ] Manejar renovaciones automáticas
- [ ] Notificaciones de vencimiento

### Fase 5: Mejoras (Prioridad Baja)
- [ ] Migrar a SDK nativo de Stripe (opcional)
- [ ] Implementar analytics de conversión
- [ ] A/B testing de precios
- [ ] Promociones y descuentos

---

## 🔐 Seguridad - Mejores Prácticas

### ✅ Implementado
- Verificación de `ecommerceEnabled` antes de enviar eventos CRUD
- No se exponen claves secretas en el cliente
- Operaciones sensibles preparadas para backend

### ❌ Pendiente
- [ ] Validar firma de webhook de Stripe
- [ ] Verificar siempre el estado de pago en el servidor
- [ ] Implementar rate limiting
- [ ] Logging de eventos de pago
- [ ] Manejo seguro de datos de tarjeta (nunca en cliente)

---

## 📚 Referencias

- [Documentación de Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Expo Linking API](https://docs.expo.dev/versions/latest/sdk/linking/)
- [Stripe React Native SDK](https://stripe.dev/stripe-react-native/)

---

## 🎯 Próximos Pasos Recomendados

1. **Implementar backend básico** (Fase 1)
   - Crear endpoints de checkout y verificación
   - Configurar webhook básico
   - Actualizar modelo de datos

2. **Configurar deep linking** (Fase 2)
   - Esquema de URL
   - Handler de retorno
   - Verificación de pago

3. **Completar webhooks** (Fase 3)
   - Manejar todos los eventos críticos
   - Sincronizar estado con app

4. **Gestión de suscripciones** (Fase 4)
   - Pantalla de estado
   - Cancelación y cambios de plan

---

## 📊 Estado Actual del Sistema

### ✅ Funcional
- UI del paywall completa
- Integración con configuración
- Sistema de listener CRUD (solo si ecommerceEnabled)
- Traducciones completas
- WhatsApp contact integrado

### ⚠️ Parcialmente Funcional
- Apertura de checkout (usa placeholder URL)
- Activación de ecommerce (sin verificación real de pago)

### ❌ No Implementado
- Backend de Stripe
- Webhooks
- Deep linking
- Verificación real de pago
- Gestión de suscripciones

---

## 💡 Notas de Desarrollo

### URL de Checkout Actual
```typescript
// Placeholder - necesita reemplazo con endpoint real
const checkoutUrl = shopId 
  ? `https://checkout.stripe.com/pay/...?client_reference_id=${shopId}&plan=${selectedPlan}`
  : `https://checkout.stripe.com/pay/...?plan=${selectedPlan}`;
```

### Verificación de Pago Actual
```typescript
// Placeholder - necesita verificación real
setTimeout(() => {
  onSuccess(selectedPlan);
}, 2000);
```

**TODO:** Implementar verificación real mediante:
- Webhook de Stripe (recomendado)
- Polling del estado de pago
- Deep link con parámetros de verificación
