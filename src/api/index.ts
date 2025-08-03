// API Client Exports
// Central export file for all API services

// Export all API services
export * from './shops';
export * from './products';
export * from './kitchen';
export * from './waitlist';
export * from './payments';
export * from './chat';
export * from './inventory';
export * from './tickets';
export * from './orders';
export * from './users';
export * from './crypto';

// Export types
export type {
  ApiResponse,
  PaginationParams,
  SortParams,
  Shop,
  CreateShopRequest,
  StoreType,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductQueryParams,
  ProductCategory,
  MainCategory,
  SimilarityCheckRequest,
  SimilarityCheckResponse,
  ProductUploadFormData,
  KitchenOrder,
  KitchenOrderItem,
  CreateKitchenOrderRequest,
  KitchenOrderQueryParams,
  WaitlistEntry,
  WaitlistItem,
  CustomerInfo,
  CreateWaitlistEntryRequest,
  WaitlistQueryParams,
  Payment,
  CreatePaymentRequest,
  PaymentStats,
  PaymentQueryParams,
  ChatMessage,
  CreateChatMessageRequest,
  ChatSession,
  ChatQueryParams,
  InventoryUpdate,
  CreateInventoryUpdateRequest,
  InventoryStatus,
  InventoryAlert,
  InventoryStats,
  InventoryQueryParams,
  Ticket,
  TicketItem,
  CreateTicketRequest,
  TicketStats,
  TicketQueryParams,
  Order,
  OrderItem,
  Address,
  CreateOrderRequest,
  User,
  CreateUserRequest,
  Distributor,
  CreateDistributorRequest,
  UserQueryParams,
  CryptoSettings,
  CryptoPayment,
  CryptoRate,
  SupportedCryptocurrency,
  ImageUploadResponse,
  ShopQueryParams
} from '../types/api';

// Legacy store API (for backward compatibility)
export { storeAPI } from './store';

// Export products API for backward compatibility
export { 
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  addImagesToProduct,
  deleteProductImage,
  getProductCategories,
  getMainCategories,
  getCategoryStats,
  getProductsByCategory,
  checkSimilarProducts,
  searchProductsByImage,
  uploadImage,
  uploadImages,
  testProductsEndpoint
} from './products'; 