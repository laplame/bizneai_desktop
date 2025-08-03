# 🚀 Sistema de Subida de Productos - BizneAI

## 📋 Resumen Ejecutivo

El sistema de subida de productos en BizneAI es una arquitectura compleja que integra múltiples tecnologías para proporcionar una experiencia de usuario optimizada y funcionalidades avanzadas de IA.

### 🎯 Características Principales
- **Subida de imágenes optimizada** (Multer + Cloudinary)
- **Detección de similitud con IA** (Qdrant + embeddings)
- **Validación robusta** (Zod schemas)
- **Almacenamiento dual** (Local + Cloudinary)
- **Interfaz moderna** (React + TypeScript)

---

## 🏗️ Arquitectura del Sistema

### Frontend (React + TypeScript)

#### ProductUploadPage.tsx - Página Principal
```typescript
// Flujo principal de subida
1. Selección de tipo de tienda → Auto-selección de Model Shop
2. Llenado de formulario → Validación en tiempo real
3. Subida de imágenes → Procesamiento optimizado
4. Verificación de similitud → IA para detectar duplicados
5. Creación del producto → Envío al backend
6. Redirección → Página de productos
```

#### ImageUploadSection.tsx - Componente de Subida
```typescript
// Características principales:
- Drag & Drop con feedback visual
- Captura con cámara
- Preview en tiempo real
- Validación de tipos (JPEG, PNG, WebP)
- Límite de 3 imágenes por producto
- Progreso de subida
```

### Backend (Node.js + Express)

#### Endpoints Principales

**A. Subida de Imágenes**
```http
POST /api/upload/image
Content-Type: multipart/form-data

FormData:
- image: File
- folder: string (default: 'images')
- uploadType: 'both' | 'cloudinary' | 'local'
```

**B. Creación de Productos**
```http
POST /api/products
Content-Type: application/json

Body:
{
  name: string,
  description: string,
  price: number,
  category: string,
  mainCategory: string,
  businessId: string,
  images: string[],
  // ... otros campos
}
```

**C. Verificación de Similitud**
```http
POST /api/products/check-similarity
Content-Type: application/json

Body:
{
  name: string,
  description: string,
  category: string,
  mainCategory: string,
  brand?: string,
  specifications?: object,
  imageUrls?: string[],
  businessId: string,
  threshold: number (default: 0.90)
}
```

---

## 📸 Sistema de Subida de Imágenes

### CloudinaryService.ts - Servicio de Optimización

```typescript
class CloudinaryService {
  // Subida optimizada con transformaciones
  async uploadImage(filePath: string, folder: string, options: {
    generateThumbnail?: boolean;
    generateWebp?: boolean;
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
  }): Promise<OptimizedImageResult>
  
  // Subida múltiple
  async uploadMultipleImages(filePaths: string[], folder: string, options: object)
  
  // URLs optimizadas para diferentes tamaños
  getOptimizedUrl(publicId: string, options: object): string
  getProductCardUrl(publicId: string, options: object): string
  getResponsiveUrls(publicId: string): { sm, md, lg, xl }
}
```

**Características:**
- ✅ Optimización automática (WebP, calidad 80%)
- ✅ Generación de thumbnails (300x300)
- ✅ URLs responsivas para diferentes pantallas
- ✅ Fallback a almacenamiento local
- ✅ Limpieza automática de archivos temporales

### Configuración de Multer

```typescript
// server/src/routes/products.ts
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Almacenamiento dual: privado + público
    const publicDir = path.join(__dirname, '../../../public/images');
    const privateDir = path.join(__dirname, '../../../uploads/products');
    cb(null, privateDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});
```

---

## 🤖 Sistema de Detección de Similitud

### Endpoint de Verificación

```typescript
// server/src/routes/products.ts - POST /api/products/check-similarity
router.post('/check-similarity', async (req: express.Request, res: express.Response) => {
  // 1. Validación de datos de entrada
  // 2. Verificación del servicio de embeddings
  // 3. Búsqueda vectorial en Qdrant
  // 4. Fallback a búsqueda por texto
  // 5. Análisis de similitud y recomendaciones
});
```

### Lógica de Similitud

**Niveles de Similitud:**
- **95%+ (Alta)**: `use_existing` - Usar producto existente
- **90-95% (Moderada)**: `review_required` - Revisar antes de crear
- **<90% (Baja)**: `create_new` - Crear nuevo producto

**Métodos de Búsqueda:**
1. **Vector-based**: Usando embeddings de Qdrant
2. **Text-based**: Búsqueda por texto en MongoDB
3. **Text-based fallback**: Cuando falla el servicio de embeddings

### QdrantService.ts - Servicio de Búsqueda Vectorial

```typescript
class QdrantService {
  // Generación de embeddings
  async generateEmbedding(request: EmbeddingRequest): Promise<number[]>
  
  // Búsqueda por similitud
  async searchSimilarProducts(query: string, mainCategory?: string, limit: number = 10)
  
  // Búsqueda por imagen
  async searchByImage(imageUrl: string, mainCategory?: string, limit: number = 10)
  
  // Detección de duplicados
  async findDuplicateProducts(productBase: IProductBase)
}
```

---

## 🔄 Flujo Completo de Subida

### Paso 1: Selección y Validación
```typescript
// ProductUploadPage.tsx
const handleImageSelect = async (files: FileList | null) => {
  // 1. Validación de tipos y tamaños
  const newFiles = Array.from(files).filter(file => 
    file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024
  );
  
  // 2. Límite de 3 imágenes
  if (selectedImages.length + newFiles.length > 3) {
    setMessage({ type: 'error', text: 'Máximo 3 imágenes permitidas' });
    return;
  }
  
  // 3. Preview inmediato
  newFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreviewUrls(prev => [...prev, e.target?.result as string]);
    };
    reader.readAsDataURL(file);
  });
  
  // 4. Subida al servidor
  const { localUrls, cloudinaryUrls } = await uploadImagesToServer(newFiles);
};
```

### Paso 2: Subida de Imágenes
```typescript
// uploadImagesToServer function
const uploadImagesToServer = async (images: File[]): Promise<{localUrls: string[], cloudinaryUrls: string[]}> => {
  const localUrls: string[] = [];
  const cloudinaryUrls: string[] = [];
  
  for (let i = 0; i < images.length; i++) {
    const formData = new FormData();
    formData.append('image', images[i]);
    formData.append('folder', 'images');
    formData.append('uploadType', 'both');
    
    const response = await fetch(`${API_BASE}/upload/image`, {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    if (result.success) {
      localUrls.push(result.localUrl);
      cloudinaryUrls.push(result.cloudinaryUrl);
    }
  }
  
  return { localUrls, cloudinaryUrls };
};
```

### Paso 3: Verificación de Similitud
```typescript
// checkForSimilarProducts function
const checkForSimilarProducts = async (productData: any): Promise<boolean> => {
  const checkData = {
    name: productData.name,
    description: productData.description,
    category: productData.category,
    mainCategory: productData.mainCategory,
    brand: productData.brand,
    specifications: productData.specifications,
    imageUrls: productData.images || [],
    businessId: selectedBusiness,
    threshold: 0.90
  };

  const response = await fetch(`${API_BASE}/products/check-similarity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checkData),
  });

  const result = await response.json();
  
  if (result.success && result.data.hasSimilarProducts) {
    setSimilarProducts(result.data.similarProducts);
    setSimilarityData({
      recommendation: result.data.recommendation,
      searchMethod: result.data.searchMethod,
      totalFound: result.data.totalFound
    });
    setShowSimilarProducts(true);
    return true;
  }
  
  return false;
};
```

### Paso 4: Creación del Producto
```typescript
// createProduct function
const createProduct = async () => {
  const productData = {
    name: formData.name,
    description: formData.description,
    price: parseFloat(formData.price) || 0,
    cost: formData.cost ? parseFloat(formData.cost) : undefined,
    stock: formData.stock ? parseInt(formData.stock) : 0,
    category: formData.category,
    mainCategory: storeTypes.find(t => t.value === selectedStoreType)?.mainCategory || '',
    businessId: selectedBusiness,
    sku: formData.sku || generateSKU(formData.name, selectedStoreType),
    status: formData.status,
    images: formData.images,
    // ... campos avanzados
  };

  const response = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });

  if (response.ok) {
    const result = await response.json();
    setMessage({ type: 'success', text: 'Producto creado exitosamente' });
    resetForm();
    setTimeout(() => navigate('/products'), 2000);
  }
};
```

---

## 🛡️ Seguridad y Validación

### Validación de Archivos
```typescript
// Tipos permitidos
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

// Tamaño máximo
const maxFileSize = 10 * 1024 * 1024; // 10MB

// Límite de archivos
const maxFiles = 3; // Por producto
```

### Validación de Datos
```typescript
// Zod Schema para productos
const ProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  mainCategory: z.string().min(1, 'Main category is required'),
  businessId: z.string().min(1, 'Business ID is required'),
  // ... otros campos
});
```

### Manejo de Errores
```typescript
// Error handling en subida de imágenes
try {
  const result = await uploadImagesToServer(newFiles);
  // Procesar resultado exitoso
} catch (error) {
  console.error('❌ Upload failed:', error);
  toast.error('Error al subir imágenes. Intenta nuevamente.');
  // Mantener archivos para subida manual
}
```

---

## 📊 Métricas y Logging

### Logging Detallado
```typescript
console.log('🚀 Product creation request received');
console.log('📋 Request details:', {
  method: req.method,
  contentType: req.headers['content-type'],
  filesCount: req.files ? req.files.length : 0,
  bodyKeys: Object.keys(req.body)
});
```

### Progreso de Subida
```typescript
setUploadProgress((i / images.length) * 100);
```

### Métricas de Similitud
```typescript
console.log('✅ Similarity check result:', {
  hasSimilarProducts: result.data.hasSimilarProducts,
  totalFound: result.data.totalFound,
  searchMethod: result.data.searchMethod,
  recommendation: result.data.recommendation
});
```

---

## 🔧 Configuración del Entorno

### Variables de Entorno Requeridas
```env
# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=your_preset
CLOUDINARY_FOLDER=products

# Qdrant (para similitud)
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=product_embeddings
PYTHON_EMBEDDING_SERVICE_ENABLED=true
PYTHON_EMBEDDING_SERVICE_URL=http://localhost:8001
```

### Dependencias Principales
```json
{
  "cloudinary": "^2.7.0",
  "multer": "^2.0.1",
  "zod": "^3.22.0",
  "qdrant-client": "^1.7.0"
}
```

---

## 🎯 Características Avanzadas

### Auto-selección de Negocios
```typescript
// Auto-selecciona Model Shop para cada tipo de tienda
const handleStoreTypeChange = (storeType: string) => {
  setSelectedStoreType(storeType);
  setSelectedBusiness('');
  
  const filteredBusinesses = businesses.filter(business => business.storeType === storeType);
  const modelShop = filteredBusinesses.find(business => 
    business.storeName && business.storeName.startsWith('Model Shop')
  );
  
  if (modelShop) {
    setSelectedBusiness(modelShop._id);
  }
};
```

### Generación Automática de SKU
```typescript
const generateSKU = (productName: string, storeType: string) => {
  const prefix = productName.substring(0, 3).toUpperCase();
  const storeTypePrefix = storeType.toUpperCase().replace('_', '').substring(0, 3);
  const randomNumber = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  
  return `${prefix}-${storeTypePrefix}-${randomNumber}`;
};
```

### Modal de Productos Similares
```typescript
// SimilarProductsModal.tsx
const SimilarProductsModal = ({
  isOpen,
  onClose,
  similarProducts,
  newProductData,
  onUseExisting,
  onCreateNew,
  onCopyProduct,
  recommendation,
  searchMethod,
  totalFound
}) => {
  // Interfaz para manejar productos similares
};
```

---

## 📁 Estructura de Archivos

```
src/
├── pages/
│   ├── ProductUploadPage.tsx          # Página principal de subida
│   └── ShopProductUploadPage.tsx      # Subida específica para tiendas
├── components/
│   ├── ProductUpload/
│   │   ├── ImageUploadSection.tsx     # Componente de subida de imágenes
│   │   ├── BasicProductForm.tsx       # Formulario básico
│   │   ├── AdvancedInventorySection.tsx # Inventario avanzado
│   │   └── StoreSpecificFields.tsx    # Campos específicos por tienda
│   ├── CameraModal.tsx                # Modal de cámara
│   └── SimilarProductsModal.tsx       # Modal de productos similares

server/
├── src/
│   ├── routes/
│   │   ├── products.ts                # Endpoints de productos
│   │   ├── upload.ts                  # Endpoints de subida
│   │   └── productBase.ts             # Endpoints de productos base
│   ├── services/
│   │   ├── cloudinaryService.ts       # Servicio de Cloudinary
│   │   ├── qdrantService.ts          # Servicio de Qdrant
│   │   └── productBaseService.ts      # Servicio de productos base
│   └── models/
│       └── Product.ts                 # Modelo de producto
```

---

## 🔍 Endpoints Detallados

### Subida de Imágenes
```http
POST /api/upload/image
POST /api/upload/images
POST /api/products/upload-images
POST /api/products/:id/images
```

### Gestión de Productos
```http
GET /api/products
POST /api/products
GET /api/products/:id
PUT /api/products/:id
DELETE /api/products/:id
```

### Verificación de Similitud
```http
POST /api/products/check-similarity
POST /api/products/search-by-image
POST /api/product-base/check-duplicates
```

---

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias
```bash
npm install cloudinary multer zod qdrant-client
```

### 2. Configurar Variables de Entorno
```bash
cp .env.example .env
# Editar .env con las credenciales necesarias
```

### 3. Iniciar Servicios
```bash
# Backend principal
npm run dev

# Servicio de embeddings (Python)
cd server_py && python main.py

# Qdrant (vector database)
docker run -p 6333:6333 qdrant/qdrant
```

---

## 📈 Monitoreo y Debugging

### Logs del Sistema
```typescript
// Habilitar logs detallados
console.log('🔍 Checking for similar products...');
console.log('📋 Similarity check data:', checkData);
console.log('✅ Similarity check result:', result);
```

### Métricas de Rendimiento
- Tiempo de subida de imágenes
- Tiempo de verificación de similitud
- Tasa de éxito en creación de productos
- Uso de almacenamiento (local vs Cloudinary)

---

## 🔮 Roadmap y Mejoras Futuras

### Funcionalidades Planificadas
- [ ] Búsqueda por imagen en tiempo real
- [ ] Optimización automática de imágenes
- [ ] Integración con más proveedores de almacenamiento
- [ ] Análisis de tendencias de productos
- [ ] Recomendaciones personalizadas

### Optimizaciones Técnicas
- [ ] Caché de embeddings
- [ ] Compresión de imágenes avanzada
- [ ] CDN global para imágenes
- [ ] Búsqueda semántica mejorada

---

## 📞 Soporte y Contacto

Para soporte técnico o preguntas sobre el sistema de subida de productos:

- **Email**: soporte@bizneai.com
- **Documentación**: https://docs.bizneai.com
- **GitHub**: https://github.com/bizneai/product-upload-system

---

*Última actualización: Diciembre 2024* 