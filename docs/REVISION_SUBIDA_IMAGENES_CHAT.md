# Revisión: Subida de Imágenes en Chat BizneAI

## Fecha de Revisión
2025-01-27

## Resumen
Se revisó el flujo de subida de imágenes a través del Chat BizneAI, verificando el envío POST y la dirección de recuperación de Cloudinary.

---

## 1. Verificación del POST Request

### ✅ Endpoint Configurado Correctamente
- **URL del Cliente**: `${apiBaseUrl}/upload/image`
- **Archivo**: `src/services/imageUploader.ts` (línea 117)
- **Método**: POST
- **Base URL**: `https://www.bizneai.com/api` (configurado en `src/services/api.ts`)

### ✅ FormData Configurado Correctamente
```typescript
formData.append('image', {
  uri: imageUri,
  type: mimeType,
  name: filename,
} as any);
formData.append('folder', folder);
formData.append('uploadType', uploadType);
```

### ✅ Headers Correctos
```typescript
headers: {
  'Accept': 'application/json',
  // NO se establece 'Content-Type' - React Native lo maneja automáticamente
}
```

**Nota importante**: No se debe establecer `Content-Type` manualmente porque React Native lo configura automáticamente con el boundary correcto para `multipart/form-data`.

---

## 2. Verificación de Cloudinary

### ✅ Configuración del Servidor
- **Archivo**: `server/src/routes/upload.ts`
- **Línea 182**: `cloudinaryUrl = cloudinaryResult.secure_url;`
- **Línea 238**: Se devuelve `cloudinaryUrl: cloudinaryUrl || undefined`

### ✅ Respuesta del Servidor
El servidor devuelve la siguiente estructura:
```json
{
  "success": true,
  "filename": "image-1234567890-987654321.jpg",
  "localUrl": "/images/image-1234567890-987654321.jpg",
  "cloudinaryUrl": "https://res.cloudinary.com/[cloud_name]/image/upload/...",
  "primaryUrl": "https://res.cloudinary.com/[cloud_name]/image/upload/...",
  "uploadInfo": {
    "localStorage": {
      "saved": true,
      "url": "/images/image-1234567890-987654321.jpg"
    },
    "cloudinary": {
      "uploaded": true,
      "url": "https://res.cloudinary.com/[cloud_name]/image/upload/..."
    }
  }
}
```

### ✅ URL de Cloudinary
- **Formato**: `https://res.cloudinary.com/[cloud_name]/image/upload/...`
- **Tipo**: `secure_url` (HTTPS)
- **Recuperación**: Disponible en `result.cloudinaryUrl` y `result.primaryUrl`

---

## 3. Flujo Actual en Chat BizneAI

### ⚠️ Observación Importante
En el Chat BizneAI (`app/bizne-ai.tsx`), las imágenes se manejan de la siguiente manera:

1. **Selección de Imágenes**: Se guardan en `selectedMedia` (línea 110)
2. **Envío del Mensaje**: Se incluyen como `mediaFiles` en el mensaje (línea 552)
3. **Almacenamiento Local**: Se guardan en la base de datos local (líneas 564-570)
4. **Envío al AI**: Se pasan como `mediaFiles` al servicio AI (línea 593)

### ⚠️ Problema Identificado
**Las imágenes NO se suben automáticamente al servidor/Cloudinary cuando se envían en el chat.**

Las imágenes solo se guardan localmente y se pasan al AI como URIs locales. Si el AI necesita acceder a las imágenes, estas deben estar disponibles públicamente (en Cloudinary o en un servidor accesible).

---

## 4. Recomendaciones

### Opción 1: Subir Imágenes Antes de Enviar al AI
Modificar `sendMessage` en `app/bizne-ai.tsx` para subir las imágenes antes de enviarlas:

```typescript
// En sendMessage, antes de enviar al AI:
if (mediaToSave.length > 0) {
  for (const media of mediaToSave) {
    if (media.type === 'image') {
      try {
        const uploadResult = await uploadImageToServer(
          media.uri,
          'chat-images',
          'both'
        );
        if (uploadResult.success && uploadResult.cloudinaryUrl) {
          // Actualizar media.uri con la URL de Cloudinary
          media.uri = uploadResult.cloudinaryUrl;
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  }
}
```

### Opción 2: Subir Imágenes al Seleccionarlas
Subir las imágenes inmediatamente cuando se seleccionan, antes de enviar el mensaje.

### Opción 3: Mantener Comportamiento Actual
Si el AI puede procesar imágenes locales o si se manejan de otra manera, mantener el comportamiento actual.

---

## 5. Verificación de Endpoints

### Endpoint Principal
- **POST** `/api/upload/image`
- **Archivo del Servidor**: `server/src/routes/upload.ts` (línea 106)
- **Validación**: ✅ Schema de validación con Zod
- **Límites**: ✅ 10MB máximo, tipos permitidos: JPEG, PNG, WebP

### Endpoint Alternativo (Múltiples Imágenes)
- **POST** `/api/upload/images`
- **Archivo del Servidor**: `server/src/routes/upload.ts` (línea 260)
- **Límite**: Hasta 5 imágenes por request

---

## 6. Conclusión

### ✅ Aspectos Correctos
1. El POST request está correctamente configurado
2. La URL de Cloudinary se devuelve correctamente como `secure_url`
3. El servidor maneja correctamente la subida dual (local + Cloudinary)
4. La respuesta incluye todas las URLs necesarias

### ⚠️ Aspectos a Considerar
1. Las imágenes en el Chat no se suben automáticamente a Cloudinary
2. Si el AI necesita acceso a las imágenes, deben subirse antes de enviarlas
3. Considerar implementar subida automática para mejorar la funcionalidad del chat

---

## 7. Próximos Pasos Sugeridos

1. **Decidir si se necesita subir imágenes automáticamente** en el Chat
2. **Implementar subida automática** si es necesario
3. **Probar el flujo completo** con imágenes reales
4. **Verificar que el AI puede acceder** a las URLs de Cloudinary

---

## Archivos Revisados

- `src/services/imageUploader.ts` - Cliente de subida de imágenes
- `server/src/routes/upload.ts` - Endpoint del servidor
- `app/bizne-ai.tsx` - Componente del Chat
- `src/services/api.ts` - Configuración de API base URL
- `src/services/aiService.ts` - Servicio de AI

