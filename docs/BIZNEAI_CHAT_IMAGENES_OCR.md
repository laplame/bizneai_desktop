# Revisión: Imágenes y OCR en BizneAI Chat

## Resumen

- **Guardado de imágenes**: Se suben al servidor (Cloudinary + local) antes de enviar el mensaje; luego se persisten en el historial del chat y en la base de medios.
- **OCR**: Se hace con **Gemini** (Vision API), no con Groq. El texto extraído se añade al mensaje y es lo que recibe el modelo de conversación.
- **Groq**: Solo recibe **texto** (incluido el texto ya extraído por OCR). No recibe imágenes en la petición.

---

## 1. Flujo al compartir una imagen en BizneAI Chat

### 1.1 Selección de medios

- **Estado**: `selectedMedia` (`MediaFile[]`) en `app/bizne-ai.tsx`.
- **Origen**: Galería (`launchImageLibraryAsync`), cámara (`launchCameraAsync`) o grabación de audio.
- **Función**: `saveMediaFile(asset, type)` crea un `MediaFile` con `uri` local (p. ej. `file://...`) y lo guarda en `mediaDatabase.saveMediaFile(mediaFile)` (solo metadata; el archivo sigue en disco/almacenamiento del dispositivo).

### 1.2 Envío del mensaje (`sendMessage`)

Orden de operaciones:

1. **Subida al servidor** (solo para imágenes):
   - Por cada imagen en `mediaToSave` se llama a `uploadImageToServer(media.uri, 'chat-images', 'both')`.
   - **Servicio**: `src/services/imageUploader.ts` → `POST /api/upload/image` (multipart).
   - **Servidor**: `server/src/routes/upload.ts` → guarda en `public/images/` y sube a Cloudinary.
   - Tras éxito, el `MediaFile` se actualiza con `uri` de Cloudinary (`uploadResult.cloudinaryUrl || uploadResult.primaryUrl`).

2. **OCR / detección de producto** (solo imágenes, con Gemini):
   - Primero: `detectProductFromImage(media.uri)` (usa la URI local antes de que el mensaje se envíe al AI).
   - Si no hay producto detectado: `extractTextFromImage(media.uri)`.
   - **Servicio**: `src/services/ocrService.ts` → **Gemini Vision API** (`gemini-1.5-flash`), no Groq.
   - El texto/producto detectado se acumula en `extractedTexts`.

3. **Mensaje final**:
   - Se construye `finalMessage`: texto del usuario + bloque `"--- Información extraída de las imágenes ---"` + `extractedTexts` unidos.
   - Se crea `userMessage` con `content: finalMessage` y `mediaFiles: uploadedMediaFiles` (URIs ya en Cloudinary cuando la subida tuvo éxito).

4. **Persistencia**:
   - `mediaDatabase.saveMediaFile(media, messageId)` por cada medio.
   - `chatStorage.saveMessage(userMessage)` (historial en AsyncStorage; metadata de medios en `@BizneAI_chat_media_metadata`).

5. **Envío al AI**:
   - `bizneAI.sendMessage(finalMessage.trim(), userMessage.mediaFiles)`.

---

## 2. Dónde se guardan las imágenes

| Dónde | Qué se guarda |
|-------|----------------|
| **Servidor** | `POST /api/upload/image` → `public/images/<filename>` + Cloudinary. |
| **Chat historial** | `chatStorage.saveMessage()` → AsyncStorage `@BizneAI_chat_history`. Cada mensaje puede tener `mediaFiles` con `uri` (Cloudinary o local). |
| **Metadata de medios** | `ChatStorageService.mediaMetadata` → AsyncStorage `@BizneAI_chat_media_metadata`. |
| **Base de medios** | `mediaDatabase.saveMediaFile()` → AsyncStorage `@BizneAI_media_database` (registros por archivo: id, uri, filename, type, etc.). |
| **Archivo local** | El `uri` original (galería/cámara) sigue en el dispositivo hasta que se sube; después el mensaje usa la URL de Cloudinary. |

Las imágenes no se copian a una carpeta propia del chat en disco; se referencian por URI (local o Cloudinary) en los mensajes y en la base de medios.

---

## 3. Cómo funciona el OCR (Gemini, no Groq)

### 3.1 Servicio

- **Archivo**: `src/services/ocrService.ts`.
- **Modelo**: `gemini-1.5-flash` (comentario en código: "Use gemini-1.5-flash for better OCR capabilities").
- **API**: `getGeminiKey()` desde `aiService`; petición a `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`.

### 3.2 Funciones

1. **`extractTextFromImage(imageUri)`**
   - Convierte la imagen a base64 (`expo-file-system`).
   - Envía a Gemini con el prompt: *"Extract all text from this image. Include all visible text, numbers, prices..."*.
   - Devuelve `{ success, text?, error? }`.

2. **`detectProductFromImage(imageUri)`**
   - Misma conversión a base64.
   - Prompt orientado a producto (nombre, precio, descripción, categoría, código de barras, SKU, stock).
   - Respuesta esperada en JSON; si falla el parse, se usa texto plano.
   - Devuelve `{ success, product?, confidence?, error? }`.

### 3.3 Integración en el chat

- En `app/bizne-ai.tsx`, dentro de `sendMessage`, por cada imagen:
  - Se llama a `detectProductFromImage(media.uri)` y, si no hay producto, a `extractTextFromImage(media.uri)`.
  - El resultado se añade a `extractedTexts` y luego a `finalMessage`.
- Ese `finalMessage` (texto + “Información extraída de las imágenes”) es el que se envía al modelo de conversación (Groq o Gemini).

Conclusión: **todo el OCR y “visión” sobre la imagen se hace con Gemini**. Groq no recibe la imagen ni hace OCR.

---

## 4. Uso de Groq en el chat (sin visión)

- **Archivo**: `src/services/aiService.ts`.
- **Proveedor por defecto**: `groq` (p. ej. modelo tipo `llama-3.1-70b-versatile`).
- Cuando `provider === 'groq'` (o `'openai'`):
  - El cuerpo de la petición se arma con `messages: [{ role, content }]` donde `content` es **siempre string** (el texto del usuario, ya con el bloque de “Información extraída de las imágenes”).
  - No se construye ningún `content` multimodal (sin imágenes ni base64).
- Cuando `provider === 'gemini'`:
  - Sí se construye `contents` con `parts`: texto + `inline_data` (base64 + mime_type) para cada imagen.
  - Gemini sí recibe las imágenes en la misma petición del mensaje.

Por tanto: con Groq, el modelo solo “ve” el texto, incluido el texto que Gemini extrajo de la imagen (OCR).

---

## 5. Diagrama del flujo (resumido)

```
Usuario selecciona imagen
       ↓
selectedMedia (uri local)
       ↓
Usuario envía mensaje → sendMessage()
       ↓
1) uploadImageToServer(uri, 'chat-images', 'both')
   → POST /api/upload/image → Cloudinary + local
   → media.uri pasa a cloudinaryUrl
       ↓
2) detectProductFromImage(uri local)  ──→ Gemini Vision (gemini-1.5-flash)
   Si no producto → extractTextFromImage(uri local) ──→ Gemini Vision
       ↓
3) finalMessage = texto usuario + "--- Información extraída ---" + extractedTexts
       ↓
4) chatStorage.saveMessage(userMessage)
   mediaDatabase.saveMediaFile(media, messageId)
       ↓
5) bizneAI.sendMessage(finalMessage, mediaFiles)
   → Si provider === 'groq': solo se envía finalMessage (texto)
   → Si provider === 'gemini': se envía contents con texto + imágenes (base64)
```

---

## 6. Posible extensión: OCR / visión con Groq

Si se quisiera usar Groq también para “ver” la imagen (o hacer OCR):

- Groq ofrece modelos con visión (p. ej. LLaVA). Habría que:
  - En `aiService`, cuando `provider === 'groq'` y hay `mediaFiles` con imágenes, construir el `content` del mensaje de usuario en formato multimodal (p. ej. array de `{ type: 'text', text }` y `{ type: 'image_url', image_url: { url } }` si la API lo soporta).
  - O bien dejar el OCR en Gemini y solo usar Groq con el texto (flujo actual); la decisión depende de si se quiere un solo proveedor para visión o seguir usando Gemini solo para OCR.

---

## 7. Referencia rápida de archivos

| Archivo | Responsabilidad |
|---------|------------------|
| `app/bizne-ai.tsx` | UI del chat, `sendMessage`, subida de imágenes, llamadas a OCR y construcción de `finalMessage`. |
| `src/services/imageUploader.ts` | `uploadImageToServer` → POST /api/upload/image. |
| `src/services/ocrService.ts` | `extractTextFromImage`, `detectProductFromImage` con Gemini Vision. |
| `src/services/aiService.ts` | `sendMessage`: Groq/Gemini/OpenAI/Claude; solo Gemini recibe imágenes en el payload. |
| `src/services/chatStorageService.ts` | Historial de mensajes y metadata de medios (AsyncStorage). |
| `src/services/mediaDatabase.ts` | Registro de archivos de medios por mensaje/archivo. |
| `server/src/routes/upload.ts` | Recepción de imagen, guardado local y subida a Cloudinary. |
