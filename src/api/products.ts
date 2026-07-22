// Products API Service
import { apiRequest, uploadFiles, getApiBaseUrl } from './client';
import { isRetriableHttpStatus, isNetworkFailure } from '../utils/httpRetriable';
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductQueryParams,
  SimilarityCheckRequest,
  SimilarityCheckResponse,
  ImageUploadResponse,
  ProductCategory,
  MainCategory
} from '../types/api';

// Get all products with filtering and pagination
export const getProducts = async (params?: ProductQueryParams) => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.mainCategory) queryParams.append('mainCategory', params.mainCategory);
  if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
  if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  return apiRequest<Product[]>(`/products?${queryParams.toString()}`);
};

// Create a new product
export const createProduct = async (productData: CreateProductRequest) => {
  return apiRequest<Product>('/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  });
};

interface PushProductResult {
  success: boolean;
  error?: string;
  /** true si vale la pena reintentar más tarde (sin conexión, 5xx, timeout). */
  retriable?: boolean;
  /**
   * `_id` real de Mongo del producto creado. El caller DEBE reemplazar el id
   * local (numérico) por este valor y volver a guardar — si no, el próximo
   * sync (`mergeProductsFromServerPreserveImages`) no reconoce que es el
   * mismo producto (normalizeProductId hashea distinto un id numérico local
   * que un `_id` de Mongo) y se pierde cualquier dato solo-local, como la
   * foto cacheada. Ver docs — bug encontrado y arreglado en esta pasada.
   */
  serverId?: string;
}

/**
 * Empuja un producto agregado localmente (ProductManagement "Agregar
 * Producto") a POST /api/products — el mismo endpoint que ya dispara la
 * promoción en tiempo real al catálogo modelo (dedup por barcode,
 * ver docs/PROMOCION_TIEMPO_REAL_CATALOGO_MODELO.md). Antes, agregar un
 * producto en este desktop era 100% local; nunca llegaba al servidor.
 * `mainCategory` se manda vacío a propósito: el backend lo autoasigna desde
 * el storeType de la tienda si viene vacío (products.ts:582), así este
 * cliente no necesita duplicar ese mapeo.
 */
export async function pushLocalProductToServer(
  payload: CreateProductRequest & { barcode?: string }
): Promise<PushProductResult> {
  try {
    const url = `${getApiBaseUrl()}/products`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      return {
        success: false,
        error: data?.error || `Error ${response.status}`,
        retriable: isRetriableHttpStatus(response.status),
      };
    }
    const serverId = data?.data?._id ? String(data.data._id) : undefined;
    return { success: true, serverId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error de conexión',
      retriable: isNetworkFailure(err) || !navigator.onLine,
    };
  }
}

// Get product by ID
export const getProductById = async (id: string) => {
  return apiRequest<Product>(`/products/${id}`);
};

// Update product
export const updateProduct = async (id: string, productData: UpdateProductRequest) => {
  return apiRequest<Product>(`/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  });
};

// Delete product
export const deleteProduct = async (id: string) => {
  return apiRequest<void>(`/products/${id}`, {
    method: 'DELETE',
  });
};

// Upload product images
export const uploadProductImages = async (files: File[]) => {
  return uploadFiles<ImageUploadResponse>('/products/upload-images', files);
};

// Add images to existing product
export const addImagesToProduct = async (productId: string, files: File[]) => {
  return uploadFiles<ImageUploadResponse>(`/products/${productId}/images`, files);
};

// Delete product image
export const deleteProductImage = async (productId: string, imageIndex: number) => {
  return apiRequest<void>(`/products/${productId}/images/${imageIndex}`, {
    method: 'DELETE',
  });
};

// Get product categories
export const getProductCategories = async (language?: string) => {
  const queryParams = new URLSearchParams();
  if (language) queryParams.append('language', language);
  
  return apiRequest<ProductCategory[]>(`/products/categories?${queryParams.toString()}`);
};

// Get main categories
export const getMainCategories = async () => {
  return apiRequest<MainCategory[]>('/products/main-categories');
};

// Get category statistics
export const getCategoryStats = async () => {
  return apiRequest<any>('/products/categories/stats');
};

// Get products by category
export const getProductsByCategory = async (
  category: string, 
  params?: {
    mainCategory?: string;
    businessId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }
) => {
  const queryParams = new URLSearchParams();
  
  if (params?.mainCategory) queryParams.append('mainCategory', params.mainCategory);
  if (params?.businessId) queryParams.append('businessId', params.businessId);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  return apiRequest<Product[]>(`/products/by-category/${category}?${queryParams.toString()}`);
};

// Check for similar products (AI-powered similarity detection)
export const checkSimilarProducts = async (data: SimilarityCheckRequest) => {
  return apiRequest<SimilarityCheckResponse>('/products/check-similarity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};

// Search products by image
export const searchProductsByImage = async (
  imageUrl: string, 
  mainCategory?: string, 
  limit: number = 10
) => {
  return apiRequest<Product[]>('/products/search-by-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl,
      mainCategory,
      limit,
    }),
  });
};

// Upload single image
export const uploadImage = async (
  file: File, 
  folder: string = 'images', 
  uploadType: 'both' | 'cloudinary' | 'local' = 'both'
) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);
  formData.append('uploadType', uploadType);

  return apiRequest<ImageUploadResponse>('/upload/image', {
    method: 'POST',
    body: formData,
  });
};

// Upload multiple images
export const uploadImages = async (
  files: File[], 
  folder: string = 'images', 
  uploadType: 'both' | 'cloudinary' | 'local' = 'both'
) => {
  const formData = new FormData();
  
  files.forEach((file, index) => {
    formData.append('images', file);
  });
  
  formData.append('folder', folder);
  formData.append('uploadType', uploadType);

  return apiRequest<ImageUploadResponse>('/upload/images', {
    method: 'POST',
    body: formData,
  });
};

// Test products endpoint
export const testProductsEndpoint = async () => {
  return apiRequest<any>('/products/test');
}; 