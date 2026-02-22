/**
 * Sales API - basado en Sales Sync Model (Desktop + Mobile)
 * POST /api/:shopId/sales - Crear ventas con clientEventId para idempotencia
 */

import { getShopId, getMcpUrl } from '../utils/shopIdHelper';

const getApiOrigin = (): string => {
  const mcpUrl = getMcpUrl();
  if (mcpUrl) {
    try {
      return new URL(mcpUrl).origin;
    } catch {
      // fall through
    }
  }
  return 'https://www.bizneai.com';
};

/** Genera UUID v4 para clientEventId */
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/** ID estable del dispositivo para sourceDeviceId */
const getSourceDeviceId = (): string => {
  try {
    let id = localStorage.getItem('bizneai-device-id');
    if (!id) {
      id = `desktop-${generateUUID().slice(0, 8)}`;
      localStorage.setItem('bizneai-device-id', id);
    }
    return id;
  } catch {
    return `desktop-${Date.now()}`;
  }
};

export type PaymentMethod = 'cash' | 'card' | 'crypto' | 'mobile' | 'other';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type TransactionType = 'sale' | 'refund' | 'exchange';
export type OrderType = 'dine-in' | 'takeaway' | 'delivery';
export type SourcePlatform = 'desktop' | 'mobile' | 'web' | 'server' | 'unknown';
export type Source = 'local' | 'online' | 'phone';
export type SaleStatus = 'active' | 'cancelled' | 'archived';

export interface SaleItemPayload {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

export interface CreateSalePayload {
  clientEventId: string;
  sourcePlatform: SourcePlatform;
  sourceDeviceId: string;
  clientTimestampUnixMs: number;

  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;

  items: SaleItemPayload[];

  subtotal: number;
  tax: number;
  discount: number;
  total: number;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionType?: TransactionType;
  orderType?: OrderType;
  tableNumber?: string;
  waiterName?: string;
  notes?: string;
  source?: Source;
  status?: SaleStatus;
}

export interface ShopTransactionResponse {
  _id: string;
  shopId: string;
  transactionId: string;
  receiptNumber?: string;
  clientEventId: string;
  items: SaleItemPayload[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  sourcePlatform: SourcePlatform;
  sourceDeviceId: string;
  clientTimestampUnixMs: number;
  serverTimestampUnixMs: number;
  lastMutationUnixMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

const normalizePaymentMethod = (method: string): PaymentMethod => {
  const m = (method || 'cash').toLowerCase();
  if (['cash', 'card', 'crypto', 'mobile', 'other'].includes(m)) return m as PaymentMethod;
  return 'other';
};

/** Payload de entrada: paymentMethod puede ser string (se normaliza internamente) */
export type CreateSaleInput = Omit<CreateSalePayload, 'clientEventId' | 'sourcePlatform' | 'sourceDeviceId' | 'clientTimestampUnixMs' | 'paymentMethod'> & {
  paymentMethod?: string;
};

/**
 * Crea una venta en la API según el Sales Sync Model.
 * Usa clientEventId para idempotencia: si llega duplicado, la API devuelve la ya creada.
 */
export const createSale = async (payload: CreateSaleInput): Promise<ApiResponse<ShopTransactionResponse>> => {
  const shopId = getShopId();
  if (!shopId) {
    return { success: false, error: 'Shop ID no configurado' };
  }

  const now = Date.now();
  const fullPayload: CreateSalePayload = {
    ...payload,
    clientEventId: generateUUID(),
    sourcePlatform: 'desktop',
    sourceDeviceId: getSourceDeviceId(),
    clientTimestampUnixMs: now,
    paymentMethod: normalizePaymentMethod(payload.paymentMethod ?? 'cash'),
  };

  const url = `${getApiOrigin()}/api/${shopId}/sales`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(fullPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result?.error || result?.message || `Error ${response.status}`,
      };
    }

    return {
      success: true,
      data: result?.data ?? result,
    };
  } catch (err) {
    console.error('createSale failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error de conexión',
    };
  }
};
