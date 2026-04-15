# 📸 API de Subida de Imágenes MCP - Documentación Completa

## Descripción General

Este documento describe el proceso completo de subida de imágenes a productos mediante el servidor MCP (Model Context Protocol). El sistema permite subir hasta 5 imágenes por request, procesándolas automáticamente en Cloudinary y guardando copias locales como respaldo.

---

## 🔗 Endpoint

### POST `/api/mcp/:shopId/products/:productId/images`

**Método:** `POST`  
**Content-Type:** `multipart/form-data`  
**Autenticación:** No requerida (puede requerirse según configuración)

### Parámetros de URL

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `shopId` | String (MongoDB ObjectId) | ✅ Sí | ID de la tienda (24 caracteres) | `6930e44559353894cdc47c86` |
| `productId` | String (MongoDB ObjectId) | ✅ Sí | ID del producto (24 caracteres) | `507f1f77bcf86cd799439011` |

### Parámetros del Body (FormData)

| Campo | Tipo | Requerido | Descripción | Límites |
|-------|------|-----------|-------------|---------|
| `images` | File[] | ✅ Sí | Array de archivos de imagen | Máximo 5 imágenes, 10MB cada una |
| | | | Formatos permitidos: JPEG, PNG, WebP | |

---

## 📋 Modelo de Datos

### Estructura `imageMetadata`

El modelo de producto almacena información detallada sobre las imágenes en el campo `imageMetadata`:

```typescript
interface ImageMetadata {
  cloudinaryUrls: string[];      // URLs optimizadas de Cloudinary
  localUrls: string[];            // URLs locales como respaldo
  totalImages: number;            // Total de imágenes del producto
  primarySource: 'cloudinary' | 'local';  // Fuente principal de imágenes
}
```

### Estructura del Producto (Mongoose)

```typescript
{
  _id: ObjectId,
  name: string,
  description: string,
  // ... otros campos ...
  images: string[],              // Array principal de URLs de imágenes
  imageMetadata: {
    cloudinaryUrls: string[],   // URLs de Cloudinary (prioridad alta)
    localUrls: string[],         // URLs locales (fallback)
    totalImages: number,         // Contador total
    primarySource: 'cloudinary' | 'local'
  }
}
```

---

## 🔄 Proceso de Subida

### 1. Validación de Parámetros

El sistema valida:
- ✅ Formato de `shopId` (24 caracteres, MongoDB ObjectId)
- ✅ Formato de `productId` (24 caracteres, MongoDB ObjectId)
- ✅ Existencia de la tienda en la base de datos
- ✅ Existencia del producto y que pertenezca a la tienda
- ✅ Presencia de al menos una imagen en el request

### 2. Procesamiento de Imágenes

#### Paso 1: Subida a Cloudinary
- **Servicio:** `cloudinaryService.uploadMultipleImages()`
- **Carpeta:** `products`
- **Optimizaciones aplicadas:**
  - Redimensionamiento: máximo 1200x1200px
  - Calidad: 80%
  - Formato: WebP (si es compatible)
  - Thumbnail: generado automáticamente (300x300px)

#### Paso 2: Guardado Local (Respaldo)
- **Directorio:** `public/images/`
- **Optimización:** Sharp (JPEG, WebP, thumbnails)
- **Tamaño máximo:** 1200x1200px
- **Calidad:** 80%

#### Paso 3: Filtrado de URLs
- Se filtran automáticamente URLs `file://` (no accesibles desde web)
- Se normalizan rutas relativas
- Se eliminan URLs vacías o inválidas

#### Paso 4: Actualización del Producto
- Se combinan las nuevas imágenes con las existentes
- Se actualiza `imageMetadata` con las nuevas URLs
- Se recalcula `totalImages` y `primarySource`

### 3. Eventos en Tiempo Real

Se emite un evento Socket.IO:
- **Evento:** `product:updated`
- **Datos:** Producto completo actualizado
- **Audiencia:** Clientes conectados al shop

---

## 📍 Rutas Finales de Cloudinary

### Formato de URL

```
https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}.{format}
```

### Ejemplo Real

```
https://res.cloudinary.com/demo/image/upload/w_1200,h_1200,c_fill,q_80,f_auto/products/image-1234567890.jpg
```

### Transformaciones Aplicadas

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `w_1200` | 1200px | Ancho máximo |
| `h_1200` | 1200px | Alto máximo |
| `c_fill` | fill | Modo de recorte (llenar manteniendo aspecto) |
| `q_80` | 80% | Calidad de compresión |
| `f_auto` | auto | Formato automático (WebP si es compatible) |

### Thumbnail

Para thumbnails, se agrega la transformación:
```
w_300,h_300,c_fill,q_70,f_auto
```

URL de ejemplo:
```
https://res.cloudinary.com/demo/image/upload/w_300,h_300,c_fill,q_70,f_auto/products/image-1234567890.jpg
```

---

## ✅ Respuestas de Éxito

### Status Code: `200 OK`

```json
{
  "success": true,
  "data": {
    "product": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Producto Ejemplo",
      "images": [
        "https://res.cloudinary.com/demo/image/upload/w_1200,h_1200,c_fill,q_80,f_auto/products/image-1234567890.jpg",
        "/images/image-1234567890.webp"
      ],
      "imageMetadata": {
        "cloudinaryUrls": [
          "https://res.cloudinary.com/demo/image/upload/w_1200,h_1200,c_fill,q_80,f_auto/products/image-1234567890.jpg"
        ],
        "localUrls": [
          "/images/image-1234567890.webp"
        ],
        "totalImages": 2,
        "primarySource": "cloudinary"
      }
    },
    "images": {
      "cloudinaryUrls": [
        "https://res.cloudinary.com/demo/image/upload/w_1200,h_1200,c_fill,q_80,f_auto/products/image-1234567890.jpg"
      ],
      "localUrls": [
        "/images/image-1234567890.webp"
      ],
      "totalImages": 1
    },
    "message": "1 image(s) uploaded successfully via MCP integration"
  }
}
```

### Mensajes de Confirmación

| Escenario | Mensaje |
|-----------|---------|
| Éxito con Cloudinary | `"{count} image(s) uploaded successfully via MCP integration"` |
| Éxito solo local | `"{count} image(s) uploaded successfully via MCP integration"` (fallback) |

---

## ❌ Respuestas de Error

### 1. Shop ID Inválido

**Status Code:** `400 Bad Request`

```json
{
  "success": false,
  "error": "Invalid shop ID format"
}
```

**Causas:**
- `shopId` no tiene 24 caracteres
- `shopId` no es un ObjectId válido

---

### 2. Product ID Inválido

**Status Code:** `400 Bad Request`

```json
{
  "success": false,
  "error": "Invalid product ID format"
}
```

**Causas:**
- `productId` no tiene 24 caracteres
- `productId` no es un ObjectId válido

---

### 3. Tienda No Encontrada

**Status Code:** `404 Not Found`

```json
{
  "success": false,
  "error": "Shop not found"
}
```

**Causas:**
- La tienda con el `shopId` proporcionado no existe en la base de datos

---

### 4. Producto No Encontrado

**Status Code:** `404 Not Found`

```json
{
  "success": false,
  "error": "Product not found"
}
```

**Causas:**
- El producto con el `productId` proporcionado no existe
- El producto existe pero no pertenece a la tienda especificada

---

### 5. Sin Imágenes

**Status Code:** `400 Bad Request`

```json
{
  "success": false,
  "error": "No images provided"
}
```

**Causas:**
- No se enviaron archivos en el campo `images`
- El array de imágenes está vacío

---

### 6. Error de Subida a Cloudinary

**Status Code:** `200 OK` (con fallback local)

**Comportamiento:**
- Si Cloudinary falla, el sistema automáticamente guarda las imágenes localmente
- La respuesta es exitosa pero solo contiene `localUrls`
- Se registra el error en los logs del servidor

**Log del servidor:**
```
Error uploading images to Cloudinary: [detalles del error]
```

**Respuesta (con fallback):**
```json
{
  "success": true,
  "data": {
    "product": { /* ... */ },
    "images": {
      "cloudinaryUrls": [],
      "localUrls": [
        "/images/image-1234567890.jpg"
      ],
      "totalImages": 1
    },
    "message": "1 image(s) uploaded successfully via MCP integration"
  }
}
```

---

### 7. Error General del Servidor

**Status Code:** `500 Internal Server Error`

```json
{
  "success": false,
  "error": "Failed to upload images via MCP integration"
}
```

**Causas:**
- Error inesperado en el procesamiento
- Error de base de datos
- Error de sistema de archivos

---

## 📝 Ejemplos de Uso

### cURL

```bash
curl -X POST \
  https://www.bizneai.com/api/mcp/6930e44559353894cdc47c86/products/507f1f77bcf86cd799439011/images \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.png" \
  -F "images=@/path/to/image3.webp"
```

### JavaScript (Fetch API)

```javascript
const formData = new FormData();
formData.append('images', fileInput.files[0]);
formData.append('images', fileInput.files[1]);

const response = await fetch(
  `https://www.bizneai.com/api/mcp/${shopId}/products/${productId}/images`,
  {
    method: 'POST',
    body: formData
  }
);

const result = await response.json();

if (result.success) {
  console.log('Imágenes subidas:', result.data.images);
  console.log('URLs Cloudinary:', result.data.images.cloudinaryUrls);
  console.log('URLs locales:', result.data.images.localUrls);
} else {
  console.error('Error:', result.error);
}
```

### Python (requests)

```python
import requests

url = f"https://www.bizneai.com/api/mcp/{shop_id}/products/{product_id}/images"

files = [
    ('images', ('image1.jpg', open('image1.jpg', 'rb'), 'image/jpeg')),
    ('images', ('image2.png', open('image2.png', 'rb'), 'image/png')),
]

response = requests.post(url, files=files)
result = response.json()

if result['success']:
    print(f"Imágenes subidas: {result['data']['images']['totalImages']}")
    print(f"URLs Cloudinary: {result['data']['images']['cloudinaryUrls']}")
    print(f"URLs locales: {result['data']['images']['localUrls']}")
else:
    print(f"Error: {result['error']}")
```

### React (con input file)

```jsx
const handleImageUpload = async (productId, shopId, files) => {
  const formData = new FormData();
  
  // Agregar hasta 5 imágenes
  Array.from(files).slice(0, 5).forEach(file => {
    formData.append('images', file);
  });

  try {
    const response = await fetch(
      `/api/mcp/${shopId}/products/${productId}/images`,
      {
        method: 'POST',
        body: formData
      }
    );

    const result = await response.json();

    if (result.success) {
      console.log('✅ Imágenes subidas exitosamente');
      console.log('Cloudinary URLs:', result.data.images.cloudinaryUrls);
      console.log('Local URLs:', result.data.images.localUrls);
      
      // Actualizar UI con las nuevas imágenes
      setProductImages(result.data.product.images);
    } else {
      console.error('❌ Error:', result.error);
      alert(`Error al subir imágenes: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Error de red:', error);
    alert('Error de conexión al subir imágenes');
  }
};
```

---

## 🔍 Características Adicionales

### Filtrado Automático de URLs

El sistema filtra automáticamente:
- ❌ URLs `file://` (rutas de dispositivos móviles no accesibles desde web)
- ❌ URLs vacías o inválidas
- ✅ Normaliza rutas relativas (agrega `/` si falta)

### Combinación con Imágenes Existentes

- Las nuevas imágenes se agregan a las existentes (no las reemplazan)
- Se filtran las imágenes existentes antes de combinar
- Se actualiza `totalImages` con el total combinado

### Optimización Automática

- **Cloudinary:** Optimización automática con transformaciones
- **Local:** Optimización con Sharp (JPEG, WebP, thumbnails)
- **Formato preferido:** WebP cuando es compatible

### Límites y Restricciones

| Restricción | Valor |
|-------------|-------|
| Máximo de imágenes por request | 5 |
| Tamaño máximo por imagen | 10MB |
| Formatos permitidos | JPEG, PNG, WebP |
| Dimensiones máximas | 1200x1200px (optimizado) |

---

## 📊 Flujo Completo

```
1. Cliente envía POST con imágenes (FormData)
   ↓
2. Validación de shopId y productId
   ↓
3. Verificación de existencia de shop y product
   ↓
4. Subida a Cloudinary (con optimización)
   ↓
5. Guardado local (respaldo con Sharp)
   ↓
6. Filtrado de URLs (elimina file://)
   ↓
7. Combinación con imágenes existentes
   ↓
8. Actualización de imageMetadata
   ↓
9. Guardado en base de datos
   ↓
10. Emisión de evento Socket.IO
   ↓
11. Respuesta exitosa al cliente
```

---

## 🛠️ Troubleshooting

### Problema: Imágenes no se muestran en el frontend

**Solución:**
1. Verificar que las URLs no sean `file://` (se filtran automáticamente)
2. Verificar que `primarySource` sea `'cloudinary'` o `'local'`
3. Usar `imageMetadata.cloudinaryUrls` o `imageMetadata.localUrls` según corresponda

### Problema: Error al subir a Cloudinary

**Solución:**
- El sistema automáticamente hace fallback a almacenamiento local
- Verificar configuración de Cloudinary en variables de entorno
- Revisar logs del servidor para detalles del error

### Problema: Imágenes duplicadas

**Solución:**
- El sistema combina imágenes, no las reemplaza
- Para reemplazar, eliminar imágenes existentes primero usando el endpoint DELETE

---

## 🔗 Endpoints Relacionados

- **Eliminar imagen:** `DELETE /api/mcp/:shopId/products/:productId/images/:imageIndex`
- **Crear producto con imágenes:** `POST /api/mcp/:shopId/products`
- **Actualizar producto:** `PUT /api/mcp/:shopId/products/:productId`

---

## 📚 Referencias

- [Documentación MCP Product API](./MCP_PRODUCT_API_EXAMPLES.md)
- [Cloudinary Transformation Reference](https://cloudinary.com/documentation/image_transformations)
- [Mongoose Schema Documentation](https://mongoosejs.com/docs/guide.html)

---

**Última actualización:** 2025-01-26  
**Versión del API:** 1.0.0

