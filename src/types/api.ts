// API Types for BizneAI
// Comprehensive type definitions for all API entities

// ===== BASE TYPES =====
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  details?: any[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ===== SHOP TYPES =====
export interface Shop {
  _id: string;
  storeName: string;
  storeType: string;
  storeLocation: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  clientId: string;
  ecommerceEnabled: boolean;
  kitchenEnabled: boolean;
  crypto: boolean;
  acceptedCryptocurrencies: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateShopRequest {
  storeName: string;
  storeType: string;
  storeLocation: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  clientId: string;
  ecommerceEnabled: boolean;
  kitchenEnabled: boolean;
  crypto: boolean;
  acceptedCryptocurrencies: string[];
}

export interface StoreType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// ===== PRODUCT TYPES =====
export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  cost?: number;
  category: string;
  mainCategory: string;
  businessId: string;
  stock: number;
  sku: string;
  status: 'active' | 'inactive';
  brand?: string;
  images: string[];
  specifications?: Record<string, any>;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  cost?: number;
  category: string;
  mainCategory: string;
  businessId: string;
  stock: number;
  sku: string;
  status: 'active' | 'inactive';
  brand?: string;
  images: string[];
  specifications?: Record<string, any>;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  // Partial update - all fields optional
}

export interface ProductQueryParams extends PaginationParams, SortParams {
  status?: 'active' | 'inactive';
  search?: string;
  category?: string;
  mainCategory?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  mainCategory: string;
}

export interface MainCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  storeTypes: string[];
}

// Product Upload and Similarity Interfaces
export interface SimilarityCheckRequest {
  name: string;
  description: string;
  category: string;
  mainCategory: string;
  brand?: string;
  specifications?: Record<string, any>;
  imageUrls?: string[];
  businessId: string;
  threshold?: number; // Default: 0.90
}

export interface SimilarityCheckResponse {
  hasSimilarProducts: boolean;
  similarProducts: Product[];
  recommendation: 'use_existing' | 'review_required' | 'create_new';
  searchMethod: 'vector-based' | 'text-based' | 'text-based-fallback';
  totalFound: number;
  similarityScores: Array<{
    productId: string;
    score: number;
    reason: string;
  }>;
}

export interface ProductUploadFormData {
  name: string;
  description: string;
  price: number;
  cost?: number;
  stock?: number;
  category: string;
  mainCategory: string;
  businessId: string;
  sku?: string;
  status?: 'active' | 'inactive';
  images: string[];
  brand?: string;
  specifications?: Record<string, any>;
  // Advanced fields
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  tags?: string[];
  metadata?: Record<string, any>;
}

// ===== KITCHEN TYPES =====
export interface KitchenOrder {
  _id: string;
  shopId: string;
  customerName: string;
  tableNumber: string;
  waiterName: string;
  items: KitchenOrderItem[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimatedTime: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface KitchenOrderItem {
  name: string;
  quantity: number;
  notes?: string;
}

export interface CreateKitchenOrderRequest {
  shopId: string;
  customerName: string;
  tableNumber: string;
  waiterName: string;
  items: KitchenOrderItem[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimatedTime: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
}

export interface KitchenOrderQueryParams extends PaginationParams, SortParams {
  status?: 'pending' | 'preparing' | 'ready' | 'completed';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  shopId?: string;
}

// ===== WAITLIST TYPES =====
export interface WaitlistEntry {
  _id: string;
  shopId: string;
  name: string;
  items: WaitlistItem[];
  total: number;
  source: 'local' | 'online';
  status: 'waiting' | 'preparing' | 'ready' | 'completed';
  notes?: string;
  customerInfo: CustomerInfo;
  timestamp: string;
}

export interface WaitlistItem {
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
  };
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  phone?: string;
  email?: string;
}

export interface CreateWaitlistEntryRequest {
  name: string;
  items: WaitlistItem[];
  total: number;
  source: 'local' | 'online';
  notes?: string;
  customerInfo: CustomerInfo;
}

export interface WaitlistQueryParams extends PaginationParams, SortParams {
  source?: 'local' | 'online';
  status?: 'waiting' | 'preparing' | 'ready' | 'completed';
  search?: string;
}

// ===== PAYMENT TYPES =====
export interface Payment {
  _id: string;
  shopId: string;
  type: 'sale' | 'refund' | 'adjustment';
  amount: number;
  currency: string;
  paymentMethod: 'cash' | 'card' | 'crypto' | 'mobile';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  transactionId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  type: 'sale' | 'refund' | 'adjustment';
  amount: number;
  currency: string;
  paymentMethod: 'cash' | 'card' | 'crypto' | 'mobile';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  transactionId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentStats {
  totalAmount: number;
  totalTransactions: number;
  averageAmount: number;
  byPaymentMethod: Record<string, number>;
  byStatus: Record<string, number>;
  period: string;
}

export interface PaymentQueryParams extends PaginationParams {
  status?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}

// ===== CHAT TYPES =====
export interface ChatMessage {
  _id: string;
  shopId: string;
  content: string;
  context: Record<string, any>;
  senderType: 'customer' | 'ai' | 'staff';
  messageType: 'text' | 'image' | 'file';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  metadata?: Record<string, any>;
}

export interface CreateChatMessageRequest {
  content: string;
  context: Record<string, any>;
  senderType: 'customer' | 'ai' | 'staff';
  messageType: 'text' | 'image' | 'file';
  metadata?: Record<string, any>;
}

export interface ChatSession {
  sessionId: string;
  customerId?: string;
  status: 'active' | 'closed';
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatQueryParams extends PaginationParams {
  sessionId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

// ===== INVENTORY TYPES =====
export interface InventoryUpdate {
  _id: string;
  shopId: string;
  productId: string;
  quantity: number;
  action: 'add' | 'remove' | 'set';
  reason: string;
  locationId?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CreateInventoryUpdateRequest {
  productId: string;
  quantity: number;
  action: 'add' | 'remove' | 'set';
  reason: string;
  locationId?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface InventoryStatus {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  locationId?: string;
  lastUpdated: string;
}

export interface InventoryAlert {
  type: 'low_stock' | 'out_of_stock' | 'overstock';
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  message: string;
  createdAt: string;
}

export interface InventoryStats {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  lastUpdated: string;
}

export interface InventoryQueryParams extends PaginationParams {
  locationId?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
}

// ===== TICKET TYPES =====
export interface Ticket {
  _id: string;
  shopId: string;
  saleId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: TicketItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TicketItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface CreateTicketRequest {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: TicketItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  notes?: string;
  metadata?: Record<string, any>;
}

export interface TicketStats {
  totalTickets: number;
  totalSales: number;
  averageTicketValue: number;
  byStatus: Record<string, number>;
  byPaymentMethod: Record<string, number>;
  period: string;
}

export interface TicketQueryParams extends PaginationParams {
  status?: string;
  startDate?: string;
  endDate?: string;
  customerName?: string;
}

// ===== ORDER TYPES =====
export interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: Address;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  shippingAddress: Address;
  paymentMethod: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface CreateOrderRequest {
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: Address;
  paymentMethod: string;
}

// ===== USER TYPES =====
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  businessType: string;
  message: string;
  userId: string;
  userLocation: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  businessType: string;
  message: string;
  userId: string;
  userLocation: string;
}

export interface Distributor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  businessType: string;
  territory: string;
  experience: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CreateDistributorRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  businessType: string;
  territory: string;
  experience: string;
  message: string;
}

export interface UserQueryParams extends PaginationParams, SortParams {
  search?: string;
  businessType?: string;
}

// ===== CRYPTO TYPES =====
export interface CryptoSettings {
  crypto: boolean;
  cryptoAddress?: string;
  acceptedCryptocurrencies: string[];
}

export interface CryptoPayment {
  orderId: string;
  cryptocurrency: string;
  amount: number;
  walletAddress: string;
  transactionHash: string;
}

export interface CryptoRate {
  currency: string;
  rate: number;
  lastUpdated: string;
}

export interface SupportedCryptocurrency {
  id: string;
  name: string;
  symbol: string;
  icon: string;
}

// ===== IMAGE UPLOAD TYPES =====
export interface ImageUploadResponse {
  urls: string[];
  publicIds: string[];
}

// ===== QUERY PARAMETER TYPES =====
export interface ShopQueryParams extends PaginationParams, SortParams {
  storeType?: string;
  status?: 'active' | 'inactive';
  city?: string;
  state?: string;
  search?: string;
  ecommerceEnabled?: boolean;
  kitchenEnabled?: boolean;
  language?: string;
} 