# Archivos que intervienen en el componente BizneAI Chat

Listado y verificación de todos los archivos involucrados en la pantalla y flujo de **BizneAI Chat**.

---

## 1. Pantalla principal (ruta)

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `app/bizne-ai.tsx` | Pantalla principal del chat: UI, mensajes, input, acciones, intents, inventario, ventas, sincronización MCP. | ✅ Existe |

**Ruta en app:** `/bizne-ai` (definida por nombre de archivo en Expo Router).

---

## 2. Navegación y layout

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `app/_layout.tsx` | Layout raíz; proveedores (User, Config, etc.) que envuelven la app, incluida la pantalla bizne-ai. | ✅ Existe |
| `lib/components/CollapsibleMenu.tsx` | Menú lateral; ítem "BizneAI Chat" con `route: '/bizne-ai'` y etiqueta `pos.bizneAI`. | ✅ Existe |

---

## 3. Componentes UI usados por bizne-ai.tsx

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `lib/components/AssistantSelectionModal.tsx` | Modal para elegir asistente (Otto/Anna). | ✅ Existe |
| `lib/components/CollapsibleMenu.tsx` | Menú colapsable y referencia `CollapsibleMenuRef`. | ✅ Existe |
| `lib/components/HeaderBar.tsx` | Barra superior de la pantalla. | ✅ Existe |
| `lib/components/IntentConfirmationModal.tsx` | Modal de confirmación para acciones/intents (ej. agregar inventario, capturar venta). | ✅ Existe |
| `lib/components/OCRResultModal.tsx` | Modal para mostrar resultado de OCR en imágenes. | ✅ Existe |
| `lib/components/QuickAddInventoryModal.tsx` | Modal para agregar inventario rápido desde el chat. | ✅ Existe |

---

## 4. Servicios de IA y chat

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `src/services/aiService.ts` | Servicio principal: `bizneAI`, `ChatMessage`, `ChatAction`, Gemini, MCP middleware, system prompt, intents. | ✅ Existe |
| `src/services/aiProviderService.ts` | Proveedor activo de IA (Gemini/Groq), clave API, `getActiveAIProviderConfig`. | ✅ Existe |
| `src/services/assistantContextService.ts` | Contexto del asistente: Otto/Anna, saludo, personalidad; `getAssistantGreeting`, `getAssistantName`, `getFullAssistantContext`. | ✅ Existe |
| `src/services/chatStorageService.ts` | Persistencia del historial de chat (AsyncStorage, FileSystem); usa `ChatMessage` y `MediaFile` de tipos. | ✅ Existe |

---

## 5. Intents y parámetros

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `src/services/intentDefinitions.ts` | Definición de intents (`IntentType`) y detección de intenciones. | ✅ Existe |
| `src/services/parameterExtractionService.ts` | Extracción de parámetros desde mensajes/intents; usa `Product` de database. | ✅ Existe |

---

## 6. Datos locales (productos, inventario, ventas, medios)

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `src/services/database.ts` | Productos: `getProducts`, tipo `Product`. | ✅ Existe |
| `src/services/inventoryDatabase.ts` | Inventario: `addInventory`, `getAllInventory`, `updateInventoryItem`, tipo `InventoryItem`. | ✅ Existe |
| `src/services/salesDatabase.ts` | Ventas locales (crear/actualizar ventas desde el chat). | ✅ Existe |
| `src/services/salesHistoryService.ts` | Historial de ventas (usado en flujo de ventas desde chat). | ✅ Existe |
| `src/services/mediaDatabase.ts` | Almacenamiento de archivos multimedia asociados al chat. | ✅ Existe |

---

## 7. Sincronización MCP e inventario

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `src/services/mcpSalesService.ts` | Ventas en servidor MCP: `syncSaleToMCP`, `getSalesFromServer`, `getRealShopId`. | ✅ Existe |
| `src/services/mcpInventoryService.ts` | Inventario MCP: `smartSyncProductStock`. | ✅ Existe |
| `src/services/syncInventoryStockService.ts` | Sincronización de stock: `syncAllInventoryStocks`. | ✅ Existe |
| `src/services/shopIdService.ts` | ID de tienda real; usado por aiService para URL MCP (`getRealShopId`). | ✅ Existe |
| `src/services/shopService.ts` | Fallback de ID de tienda para MCP (`getShopId`). | ✅ Existe |

---

## 8. OCR, imágenes y subida

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `src/services/ocrService.ts` | OCR: `extractTextFromImage`, `detectProductFromImage`. | ✅ Existe |
| `src/services/imageUploader.ts` | Subida de imágenes al servidor: `uploadImageToServer`. | ✅ Existe |

---

## 9. Logbook y tipos de chat

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `src/services/logbookService.ts` | Entradas de logbook; `getLogbookService`. | ✅ Existe |
| `src/types/chatTypes.ts` | Tipos: `ChatMessage`, `MediaFile`, `LogbookEntry`, `ChatAction`; usado por chatStorage y pantalla. | ✅ Existe |

---

## 10. Contextos y configuración

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `src/context/UserContext.tsx` | Usuario actual; usado para nombre de cajero en ventas desde chat y permisos. | ✅ Existe |
| `src/context/ConfigContext.tsx` | Configuración general; clave Gemini `@BizneAI_gemini_key` (también leída por aiService vía AsyncStorage). | ✅ Existe |
| `src/constants/index.ts` | `COLORS`, `LAYOUT` y otras constantes usadas en la UI del chat. | ✅ Existe |

---

## 11. Configuración de BizneAI en Settings

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `src/components/UnifiedConfiguration.tsx` | Pantalla de configuración unificada; sección "BizneAI Chat" (activar IA, clave Gemini, mensajes de límite). | ✅ Existe |

---

## 12. Internacionalización (i18n)

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `lib/i18n/i18n.ts` | Configuración de i18n. | ✅ Existe |
| `lib/i18n/translations/en.json` | Claves `pos.bizneAI`, `settings.bizneAI.*` (título, mensajes, límites, API key). | ✅ Existe |
| `lib/i18n/translations/es.json` | Traducciones al español para las mismas claves. | ✅ Existe |

---

## 13. Documentación y pruebas

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `features/ai-assistant.feature` | Escenarios Gherkin del asistente de IA (BizneAI Chat). | ✅ Existe |
| `docs/SISTEMA_STOCK_CHAT_BIZNEAI.md` | Documentación del sistema de stock desde el chat. | ✅ Existe |
| `README.md` | Referencias a BizneAI Chat y configuración. | ✅ Existe |

---

## Resumen por categoría

| Categoría | Cantidad de archivos |
|-----------|----------------------|
| Pantalla y ruta | 1 |
| Navegación / layout | 2 |
| Componentes UI | 6 |
| Servicios IA y chat | 4 |
| Intents y parámetros | 2 |
| Datos locales | 5 |
| MCP y sincronización | 5 |
| OCR e imágenes | 2 |
| Logbook y tipos | 2 |
| Contextos y constantes | 3 |
| Configuración (Settings) | 1 |
| i18n | 3 |
| Docs / tests | 3 |
| **Total** | **39** |

---

## Flujo de datos resumido

1. **Entrada:** Usuario escribe/envía medios en `app/bizne-ai.tsx`.
2. **IA:** `aiService.ts` usa Gemini (vía `aiProviderService`), contexto de asistente (`assistantContextService`) y contexto MCP (datos de negocio desde `https://www.bizneai.com/api/mcp/{shopId}`).
3. **Persistencia:** Mensajes y medios se guardan con `chatStorageService` y `mediaDatabase`; tipos en `src/types/chatTypes.ts`.
4. **Intents:** `intentDefinitions` + `parameterExtractionService` para detectar acciones (inventario, venta, navegación).
5. **Ejecución:** Inventario con `inventoryDatabase`, `mcpInventoryService`, `syncInventoryStockService`; ventas con `salesDatabase`, `salesHistoryService`, `mcpSalesService`.
6. **Configuración:** Clave Gemini y estado de IA en Settings (`UnifiedConfiguration`) y en runtime vía `ConfigContext` / AsyncStorage; `shopIdService` y `shopService` para MCP.

Todos los archivos listados han sido comprobados y existen en el repositorio.
