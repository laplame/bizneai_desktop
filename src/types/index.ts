// Main Types Exports
// Export all type definitions for the BizneAI application

// Store types (legacy)
export type { StoreConfig, StoreType, Cryptocurrency } from './store';

// API types (comprehensive)
export type {
  // Core API types
  ApiResponse,
  PaginationParams,
  SortParams,
  
  // Shop types
  Shop,
  CreateShopRequest,
  StoreType as ApiStoreType,
  ShopQueryParams,
  
  // Product types
  Product,
  CreateProductRequest,
  ProductCategory,
  MainCategory,
  ProductQueryParams,
  ImageUploadResponse,
  
  // Kitchen types
  KitchenOrder,
  KitchenOrderItem,
  CreateKitchenOrderRequest,
  KitchenOrderQueryParams,
  
  // Waitlist types
  WaitlistEntry,
  WaitlistItem,
  CustomerInfo,
  CreateWaitlistEntryRequest,
  WaitlistQueryParams,
  
  // Payment types
  Payment,
  CreatePaymentRequest,
  PaymentStats,
  PaymentQueryParams,
  
  // Chat types
  ChatMessage,
  CreateChatMessageRequest,
  ChatSession,
  ChatQueryParams,
  
  // Inventory types
  InventoryUpdate,
  CreateInventoryUpdateRequest,
  InventoryStatus,
  InventoryAlert,
  InventoryStats,
  InventoryQueryParams,
  
  // Ticket types
  Ticket,
  TicketItem,
  CreateTicketRequest,
  TicketStats,
  TicketQueryParams,
  
  // Order types
  Order,
  OrderItem,
  Address,
  CreateOrderRequest,
  
  // User types
  User,
  CreateUserRequest,
  Distributor,
  CreateDistributorRequest,
  UserQueryParams,
  
  // Crypto types
  CryptoSettings,
  CryptoPayment,
  CryptoRate,
  SupportedCryptocurrency,
} from './api';

// Quagga types
export interface QuaggaJSConfigObject {
  inputStream: {
    name: string;
    type: string;
    target?: string | HTMLElement;
    constraints?: {
      width?: number;
      height?: number;
      facingMode?: string;
    };
  };
  locator: {
    patchSize: string;
    halfSample: boolean;
  };
  numOfWorkers: number;
  frequency: number;
  decoder: {
    readers: string[];
  };
  locate: boolean;
}

export interface QuaggaJSStatic {
  init(config: QuaggaJSConfigObject, callback: (err: any) => void): void;
  start(): void;
  stop(): void;
  pause(): void;
  unpause(): void;
  onDetected(callback: (result: any) => void): void;
  offDetected(callback?: (result: any) => void): void;
  decodeSingle(config: QuaggaJSConfigObject, callback: (result: any) => void): void;
  onProcessed(callback: (result: any) => void): void;
  offProcessed(callback?: (result: any) => void): void;
  canvas: {
    ctx: {
      overlay: HTMLCanvasElement;
    };
  };
} 