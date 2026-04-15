# Plan de Migración: OpenAI → Google Gemini

## 📋 Resumen Ejecutivo

Este documento detalla el plan completo para migrar el proveedor de IA de OpenAI (GPT-3.5-turbo) a Google Gemini para la funcionalidad "Chat BizneAI". El cambio será transparente para el usuario final, manteniendo toda la funcionalidad existente.

**Fecha de Planificación:** Noviembre 2025  
**Estado:** 📝 Planificación - NO IMPLEMENTAR AÚN

---

## 🎯 Objetivo

Reemplazar completamente la integración de OpenAI con Google Gemini como proveedor de IA por defecto para el Chat BizneAI, manteniendo:
- ✅ Toda la funcionalidad existente
- ✅ Compatibilidad con el sistema de contexto (MCP)
- ✅ Historial de chat
- ✅ Acciones y sugerencias
- ✅ Soporte de medios (imágenes, audio, video)
- ✅ Interfaz de usuario sin cambios

---

## 📊 Análisis de Dependencias Actuales

### 1. Archivos que Dependen de OpenAI

#### **Archivos Principales:**

1. **`src/services/aiService.ts`** ⚠️ **CRÍTICO**
   - Líneas 4-5: Configuración de URL de API OpenAI
   - Líneas 8-26: Función `getOpenAIKey()` para obtener API key
   - Líneas 29-36: Función `setOpenAIKey()` para guardar API key
   - Líneas 292-396: Método `sendMessage()` que hace llamadas a OpenAI API
   - Línea 317: URL de API: `https://api.openai.com/v1/chat/completions`
   - Líneas 323-328: Configuración del request (model: 'gpt-3.5-turbo', max_tokens, temperature)
   - Líneas 380-394: Mensajes de error que mencionan OpenAI

2. **`src/context/ConfigContext.tsx`** ⚠️ **CRÍTICO**
   - Línea 77-78: Interface `openAIKey: string`
   - Línea 79: Método `setOpenAIKey: (key: string) => Promise<void>`
   - Línea 98: Constante `OPENAI_KEY = '@BizneAI_openai_key'`
   - Líneas 127-128: Estado `openAIKey`
   - Líneas 156-171: Carga de API key desde AsyncStorage
   - Líneas 257-260: Implementación de `setOpenAIKey()`
   - Línea 279: Limpieza de API key en reset
   - Línea 317: Exportación de `openAIKey` y `setOpenAIKey`

3. **`src/components/UnifiedConfiguration.tsx`** ⚠️ **CRÍTICO**
   - Líneas 105-107: Estado para OpenAI API key (`openAIKey`, `showOpenAIKey`)
   - Líneas 1114-1127: Función `handleSaveOpenAIKey()`
   - Líneas 2640-2663: UI para configurar OpenAI API key
   - Referencias a traducciones: `settings.bizneAI.openAIKey`, `settings.bizneAI.saveApiKey`, etc.

4. **`app/bizne-ai.tsx`** ⚠️ **IMPORTANTE**
   - Línea 33: Import de `bizneAI` desde `aiService`
   - Línea 974: Uso de `bizneAI.analyzeBusinessMessage()`
   - Línea 1003: Uso de `bizneAI.clearChatHistory()`
   - (El resto del archivo usa la interfaz genérica, no depende directamente de OpenAI)

#### **Archivos de Traducciones:**

5. **`lib/i18n/translations/en.json`**
   - Líneas 692-708: Sección completa `settings.bizneAI` con referencias a OpenAI
   - Claves: `openAIKey`, `saveApiKey`, `howToGetKey`, `step1` (platform.openai.com), `enterValidApiKey`, `apiKeySaved`, `failedToSaveApiKey`

6. **`lib/i18n/translations/es.json`**
   - Líneas 692-708: Mismas claves en español
   - Todas las referencias a "OpenAI" deben cambiarse a "Gemini"

#### **Archivos de Limpieza/Reset:**

7. **`src/services/clearAllDataService.ts`**
   - Línea 41: `'@BizneAI_openai_key'` en lista de claves a limpiar
   - Línea 116: `'bizneai_openai_key'` en limpieza de AsyncStorage
   - Línea 150: `'@BizneAI_openai_key'` en limpieza de configuración
   - Línea 202: `'bizneai_openai_key'` en limpieza completa
   - Línea 417: `'bizneai_openai_key'` en limpieza de datos de usuario

#### **Archivos de Documentación:**

8. **`README.md`**
   - Líneas 84-101: Sección completa "OpenAI API Key Setup"
   - Línea 140: Menciona "OpenAI Integration: GPT-3.5-turbo"
   - Línea 251: Menciona "AI Integration: OpenAI GPT-3.5-turbo"

9. **`features/ai-assistant.feature`**
   - Línea 8: Menciona "OpenAI integration"
   - Línea 13: "I have configured my OpenAI API key"

10. **`features/configuration.feature`**
    - Líneas 96-98: Escenario de configuración de OpenAI API key
    - Línea 305: Tabla con "OpenAI API key"
    - Líneas 312-313: Escenario de establecer OpenAI API key

11. **`docs/FEATURES_CONFIGURATION_COMPLETE.md`**
    - Línea 190: Menciona "Configuración del asistente de IA con OpenAI"
    - Líneas 209-210: Menciona `openAIKey` y `setOpenAIKey()`

12. **`features/FEATURES_SUMMARY.md`**
    - Línea 126: Menciona "OpenAI" en servicios de terceros

---

## 🔄 Plan de Migración Detallado

### **Fase 1: Preparación y Configuración**

#### 1.1 Instalación de Dependencias
- [ ] Verificar si necesitamos instalar el SDK de Google Gemini
- [ ] Revisar si `@google/generative-ai` está disponible para React Native
- [ ] Si no hay SDK oficial, usar API REST directamente (como actualmente con OpenAI)

#### 1.2 Configuración de API Key de Gemini
- [ ] Obtener información sobre cómo obtener API key de Gemini
- [ ] Documentar el proceso de obtención de API key
- [ ] Preparar instrucciones para usuarios

### **Fase 2: Cambios en el Código Core**

#### 2.1 `src/services/aiService.ts` - CAMBIOS PRINCIPALES

**Cambios Requeridos:**

1. **Configuración de API:**
   ```typescript
   // ANTES:
   const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
   
   // DESPUÉS:
   const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
   // O usar: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
   ```

2. **Función getOpenAIKey() → getGeminiKey():**
   ```typescript
   // ANTES:
   const getOpenAIKey = async (): Promise<string | null> => {
     const storedKey = await AsyncStorage.getItem('@BizneAI_openai_key');
     // ...
   };
   
   // DESPUÉS:
   const getGeminiKey = async (): Promise<string | null> => {
     const storedKey = await AsyncStorage.getItem('@BizneAI_gemini_key');
     // ...
   };
   ```

3. **Función setOpenAIKey() → setGeminiKey():**
   ```typescript
   // ANTES:
   export const setOpenAIKey = async (apiKey: string): Promise<void> => {
     await AsyncStorage.setItem('@BizneAI_openai_key', apiKey);
   };
   
   // DESPUÉS:
   export const setGeminiKey = async (apiKey: string): Promise<void> => {
     await AsyncStorage.setItem('@BizneAI_gemini_key', apiKey);
   };
   ```

4. **Método sendMessage() - Cambio de Request:**
   ```typescript
   // ANTES (OpenAI):
   const response = await fetch(OPENAI_API_URL, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${apiKey}`
     },
     body: JSON.stringify({
       model: 'gpt-3.5-turbo',
       messages,
       max_tokens: 500,
       temperature: 0.7
     })
   });
   
   // DESPUÉS (Gemini):
   const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       contents: [{
         parts: messages.map(msg => ({
           text: msg.content
         }))
       }],
       generationConfig: {
         maxOutputTokens: 500,
         temperature: 0.7
       }
     })
   });
   ```

5. **Procesamiento de Respuesta:**
   ```typescript
   // ANTES (OpenAI):
   const data = await response.json();
   const aiMessage = data.choices[0].message.content;
   
   // DESPUÉS (Gemini):
   const data = await response.json();
   const aiMessage = data.candidates[0].content.parts[0].text;
   ```

6. **Mensajes de Error:**
   ```typescript
   // Cambiar todas las referencias de "OpenAI" a "Gemini"
   // Ejemplo:
   throw new Error('Gemini API key not configured...');
   ```

#### 2.2 `src/context/ConfigContext.tsx` - CAMBIOS REQUERIDOS

**Cambios:**

1. **Interface:**
   ```typescript
   // ANTES:
   openAIKey: string;
   setOpenAIKey: (key: string) => Promise<void>;
   
   // DESPUÉS:
   geminiKey: string;
   setGeminiKey: (key: string) => Promise<void>;
   ```

2. **Constante:**
   ```typescript
   // ANTES:
   const OPENAI_KEY = '@BizneAI_openai_key';
   
   // DESPUÉS:
   const GEMINI_KEY = '@BizneAI_gemini_key';
   ```

3. **Estado:**
   ```typescript
   // ANTES:
   const [openAIKey, setOpenAIKeyState] = useState('');
   
   // DESPUÉS:
   const [geminiKey, setGeminiKeyState] = useState('');
   ```

4. **Carga desde AsyncStorage:**
   ```typescript
   // Cambiar todas las referencias de OPENAI_KEY a GEMINI_KEY
   ```

5. **Función setOpenAIKey → setGeminiKey:**
   ```typescript
   // Renombrar y actualizar referencias
   ```

#### 2.3 `src/components/UnifiedConfiguration.tsx` - CAMBIOS REQUERIDOS

**Cambios:**

1. **Estado:**
   ```typescript
   // ANTES:
   const [openAIKey, setOpenAIKeyState] = useState('');
   const [showOpenAIKey, setShowOpenAIKey] = useState(false);
   
   // DESPUÉS:
   const [geminiKey, setGeminiKeyState] = useState('');
   const [showGeminiKey, setShowGeminiKey] = useState(false);
   ```

2. **Función handleSaveOpenAIKey → handleSaveGeminiKey:**
   ```typescript
   // ANTES:
   const handleSaveOpenAIKey = async () => {
     await config.setOpenAIKey(openAIKey.trim());
   };
   
   // DESPUÉS:
   const handleSaveGeminiKey = async () => {
     await config.setGeminiKey(geminiKey.trim());
   };
   ```

3. **UI - Cambiar labels y placeholders:**
   ```typescript
   // Cambiar todas las referencias de:
   // - i18n.t('settings.bizneAI.openAIKey')
   // - i18n.t('settings.bizneAI.saveApiKey')
   // A las nuevas claves de Gemini
   ```

#### 2.4 `src/services/clearAllDataService.ts` - CAMBIOS REQUERIDOS

**Cambios:**

Reemplazar todas las referencias:
- `'@BizneAI_openai_key'` → `'@BizneAI_gemini_key'`
- `'bizneai_openai_key'` → `'bizneai_gemini_key'`

### **Fase 3: Cambios en Traducciones**

#### 3.1 `lib/i18n/translations/en.json`

**Cambios en `settings.bizneAI`:**

```json
{
  "bizneAI": {
    "title": "BizneAI Chat Configuration",
    "geminiKey": "Google Gemini API Key",  // ANTES: "openAIKey": "OpenAI API Key"
    "apiKeyConfigured": "API Key configured - BizneAI chat features enabled",
    "noApiKey": "No API Key set - BizneAI chat features disabled",
    "saveApiKey": "Save Gemini API Key",  // ANTES: "Save OpenAI API Key"
    "howToGetKey": "How to get your Google Gemini API key",  // ANTES: "How to get your OpenAI API key"
    "step1": "Visit aistudio.google.com",  // ANTES: "Visit platform.openai.com"
    "step2": "Sign up or log in to your Google account",
    "step3": "Navigate to API Keys section",
    "step4": "Create a new API key",
    "step5": "Copy and paste it here",
    "keepSecure": "Keep your API key secure and never share it publicly",
    "invalidApiKey": "Invalid API Key",
    "enterValidApiKey": "Please enter a valid Google Gemini API key",  // ANTES: "Please enter a valid OpenAI API key"
    "apiKeySaved": "Google Gemini API key saved successfully. BizneAI chat features are now enabled!",  // ANTES: "OpenAI API key saved..."
    "failedToSaveApiKey": "Failed to save Gemini API key"  // ANTES: "Failed to save OpenAI API key"
  }
}
```

#### 3.2 `lib/i18n/translations/es.json`

**Mismos cambios pero en español:**

```json
{
  "bizneAI": {
    "title": "Configuración de Chat BizneAI",
    "geminiKey": "Clave API de Google Gemini",
    "saveApiKey": "Guardar Clave API de Gemini",
    "howToGetKey": "Cómo obtener tu clave API de Google Gemini",
    "step1": "Visita aistudio.google.com",
    "enterValidApiKey": "Por favor ingresa una clave API válida de Google Gemini",
    "apiKeySaved": "Clave API de Google Gemini guardada exitosamente. ¡Las funciones de chat BizneAI están ahora activadas!",
    "failedToSaveApiKey": "Error al guardar clave API de Gemini"
  }
}
```

### **Fase 4: Cambios en Documentación**

#### 4.1 `README.md`

**Cambios:**

1. **Sección "OpenAI API Key Setup" → "Google Gemini API Key Setup":**
   ```markdown
   #### Google Gemini API Key Setup
   To enable BizneAI Chat features:
   
   1. **Get Google Gemini API Key**:
      - Visit [aistudio.google.com](https://aistudio.google.com)
      - Sign up or log in to your Google account
      - Navigate to API Keys section
      - Create a new API key
   
   2. **Configure in App**:
      - Open the app and navigate to Configuration
      - Scroll to "BizneAI Chat Configuration"
      - Enter your Google Gemini API key
      - Save the configuration
   
   3. **Alternative: Environment Variable**:
      - Create a `.env` file in the project root
      - Add: `GEMINI_API_KEY=your-actual-api-key-here`
   ```

2. **Actualizar referencias:**
   - Línea 140: "Google Gemini Integration" en lugar de "OpenAI Integration"
   - Línea 251: "AI Integration: Google Gemini" en lugar de "OpenAI GPT-3.5-turbo"

#### 4.2 `features/ai-assistant.feature`

**Cambios:**
- Línea 8: "Google Gemini integration" en lugar de "OpenAI integration"
- Línea 13: "I have configured my Google Gemini API key"

#### 4.3 `features/configuration.feature`

**Cambios:**
- Actualizar escenarios para mencionar "Gemini API key" en lugar de "OpenAI API key"

#### 4.4 Otros archivos de documentación

- Actualizar todas las referencias a OpenAI en:
  - `docs/FEATURES_CONFIGURATION_COMPLETE.md`
  - `features/FEATURES_SUMMARY.md`

### **Fase 5: Migración de Datos Existentes (Opcional)**

#### 5.1 Migración de API Keys Existentes

**Consideración:** Si hay usuarios con API keys de OpenAI guardadas, podemos:

**Opción A:** No migrar automáticamente (recomendado)
- Los usuarios deberán ingresar su nueva API key de Gemini
- Más seguro y claro

**Opción B:** Migración automática con notificación
- Detectar si existe `@BizneAI_openai_key`
- Mostrar un mensaje informativo pidiendo que configuren Gemini
- No migrar automáticamente la key (no es compatible)

**Recomendación:** Opción A - No migrar automáticamente.

---

## 🔧 Detalles Técnicos de la API de Gemini

### Endpoint de Gemini

**URL Base:**
```
https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
```

**Modelos Disponibles:**
- `gemini-pro` - Modelo estándar
- `gemini-1.5-flash` - Modelo rápido (recomendado para chat)
- `gemini-1.5-pro` - Modelo avanzado

**Recomendación:** Usar `gemini-1.5-flash` para mejor rendimiento en chat.

### Autenticación

**Método 1: Query Parameter (Recomendado)**
```
GET/POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY
```

**Método 2: Header**
```
Authorization: Bearer YOUR_API_KEY
```

### Formato de Request

```json
{
  "contents": [{
    "parts": [{
      "text": "Hello, how can you help me?"
    }]
  }],
  "generationConfig": {
    "maxOutputTokens": 500,
    "temperature": 0.7,
    "topP": 0.8,
    "topK": 40
  }
}
```

### Formato de Response

```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "I can help you with..."
      }]
    },
    "finishReason": "STOP"
  }]
}
```

### Conversación con Historial

Para mantener el historial de conversación, Gemini requiere enviar todo el contexto en cada request:

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{"text": "Hello"}]
    },
    {
      "role": "model",
      "parts": [{"text": "Hi! How can I help?"}]
    },
    {
      "role": "user",
      "parts": [{"text": "What's the weather?"}]
    }
  ]
}
```

**Nota:** Gemini no usa un mensaje "system" separado como OpenAI. El contexto del sistema debe incluirse en el primer mensaje del usuario o como parte del prompt.

---

## 📝 Checklist de Implementación

### Pre-Implementación
- [ ] Revisar documentación oficial de Gemini API
- [ ] Obtener API key de prueba de Gemini
- [ ] Probar llamadas a la API de Gemini en Postman/curl
- [ ] Verificar límites de rate y costos
- [ ] Comparar capacidades: OpenAI vs Gemini

### Implementación Core
- [ ] Actualizar `src/services/aiService.ts`
  - [ ] Cambiar URL de API
  - [ ] Cambiar función getOpenAIKey → getGeminiKey
  - [ ] Cambiar función setOpenAIKey → setGeminiKey
  - [ ] Actualizar método sendMessage() con formato Gemini
  - [ ] Actualizar procesamiento de respuesta
  - [ ] Actualizar mensajes de error
- [ ] Actualizar `src/context/ConfigContext.tsx`
  - [ ] Cambiar interface openAIKey → geminiKey
  - [ ] Cambiar constante OPENAI_KEY → GEMINI_KEY
  - [ ] Actualizar estado y funciones
- [ ] Actualizar `src/components/UnifiedConfiguration.tsx`
  - [ ] Cambiar estado y handlers
  - [ ] Actualizar UI con nuevas traducciones
- [ ] Actualizar `src/services/clearAllDataService.ts`
  - [ ] Cambiar todas las referencias de claves

### Traducciones
- [ ] Actualizar `lib/i18n/translations/en.json`
- [ ] Actualizar `lib/i18n/translations/es.json`
- [ ] Verificar que todas las claves estén traducidas

### Documentación
- [ ] Actualizar `README.md`
- [ ] Actualizar `features/ai-assistant.feature`
- [ ] Actualizar `features/configuration.feature`
- [ ] Actualizar otros archivos de documentación

### Testing
- [ ] Probar configuración de API key
- [ ] Probar envío de mensajes simples
- [ ] Probar historial de conversación
- [ ] Probar con contexto de negocio (MCP)
- [ ] Probar generación de acciones y sugerencias
- [ ] Probar manejo de errores
- [ ] Probar en modo offline (debe mostrar error apropiado)
- [ ] Probar limpieza de datos (debe limpiar nueva key)

### Post-Implementación
- [ ] Actualizar changelog
- [ ] Notificar a usuarios sobre el cambio (si aplica)
- [ ] Documentar proceso de migración para usuarios existentes

---

## ⚠️ Consideraciones Importantes

### 1. Compatibilidad de Modelos

**OpenAI GPT-3.5-turbo:**
- Modelo: `gpt-3.5-turbo`
- Max tokens: 4096 (input + output)
- Costo: ~$0.002 por 1K tokens

**Google Gemini 1.5 Flash:**
- Modelo: `gemini-1.5-flash`
- Max tokens: 8192 (input + output)
- Costo: Gratis en tier gratuito (con límites)

**Ventajas de Gemini:**
- ✅ Gratis en tier gratuito
- ✅ Mayor contexto (hasta 1M tokens en modelos avanzados)
- ✅ Mejor soporte para imágenes nativo
- ✅ Integración con ecosistema Google

**Desventajas/Consideraciones:**
- ⚠️ Formato de request diferente
- ⚠️ No tiene mensaje "system" separado
- ⚠️ Estructura de respuesta diferente
- ⚠️ Límites de rate pueden ser diferentes

### 2. Migración de Historial de Chat

**Consideración:** El historial de chat existente debería funcionar sin cambios, ya que:
- Los mensajes se guardan en formato genérico (`ChatMessage`)
- Solo cambia el proveedor de IA que genera las respuestas
- El formato de almacenamiento no depende del proveedor

### 3. Soporte de Medios (Imágenes, Audio, Video)

**OpenAI:**
- Soporta imágenes en GPT-4 Vision
- No soporta audio/video directamente

**Gemini:**
- Soporta imágenes nativamente en todos los modelos
- Soporta audio en modelos avanzados
- Mejor integración con medios

**Nota:** Necesitamos verificar si el código actual envía medios a la API o solo los almacena localmente. Si se envían, necesitaremos adaptar el formato para Gemini.

### 4. Rate Limits y Costos

**Verificar antes de implementar:**
- Límites de requests por minuto/hora/día
- Costos por token/request
- Límites del tier gratuito
- Políticas de uso comercial

### 5. Fallback y Manejo de Errores

**Mantener:**
- Mensajes de error claros
- Fallback cuando no hay API key
- Manejo de errores de red
- Timeouts apropiados

---

## 🚀 Orden de Implementación Recomendado

1. **Fase 1:** Preparación
   - Investigar API de Gemini
   - Probar llamadas básicas
   - Documentar diferencias

2. **Fase 2:** Core Service
   - Actualizar `aiService.ts`
   - Probar con API key de prueba
   - Verificar que funciona end-to-end

3. **Fase 3:** Context y Config
   - Actualizar `ConfigContext.tsx`
   - Actualizar `UnifiedConfiguration.tsx`
   - Probar configuración de API key

4. **Fase 4:** Traducciones
   - Actualizar archivos i18n
   - Verificar en ambos idiomas

5. **Fase 5:** Limpieza
   - Actualizar `clearAllDataService.ts`
   - Verificar que limpia correctamente

6. **Fase 6:** Documentación
   - Actualizar README y docs
   - Actualizar features

7. **Fase 7:** Testing Completo
   - Probar todos los escenarios
   - Verificar edge cases

8. **Fase 8:** Deploy
   - Merge a main
   - Monitorear en producción

---

## 📚 Referencias

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini API Quick Start](https://ai.google.dev/tutorials/rest_quickstart)
- [Gemini Models Overview](https://ai.google.dev/models/gemini)
- [Gemini API Reference](https://ai.google.dev/api/rest)

---

## ✅ Conclusión

Este plan detalla todos los cambios necesarios para migrar de OpenAI a Google Gemini. La migración es factible y mantendrá toda la funcionalidad existente. El cambio principal está en el formato de las llamadas a la API y el procesamiento de respuestas.

**Próximos Pasos:**
1. Revisar y aprobar este plan
2. Obtener API key de Gemini para pruebas
3. Implementar cambios en orden sugerido
4. Testing exhaustivo antes de deploy

---

**Documento creado:** 2025-11-17  
**Última actualización:** 2025-11-17  
**Estado:** 📝 Planificación Completa - Listo para Revisión

