/**
 * Sales API - POST /api/:shopId/sales (Sales API principal)
 * Crear venta según ShopTransactionSchema.
 * - source por defecto: 'local'
 * - totalPrice obligatorio en cada ítem
 * - clientEventId para idempotencia
 * - No descuenta stock automáticamente
 */

import { getShopId } from '../utils/shopIdHelper';
import { getLocalApiOrigin, shouldUseSalesMcpProxy } from '../utils/localApiBase';

const getApiOrigin = (): string => {
  return 'https://www.bizneai.com';
};

export type PaymentMethod = 'cash' | 'card' | 'crypto' | 'mobile' | 'other';
export type OrderType = 'dine-in' | 'takeaway' | 'delivery';
export type Source = 'local' | 'online' | 'phone';

/** Item según ShopTransactionSchema: totalPrice obligatorio */
export interface ShopTransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

/** Payload ShopTransaction para POST /api/:shopId/sales */
export interface ShopTransactionPayload {
  clientEventId: string;
  clientTimestampUnixMs?: number;
  sourcePlatform?: string;
  sourceDeviceId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  items: ShopTransactionItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  paymentMethod?: PaymentMethod;
  orderType?: OrderType;
  source?: Source;
  tableNumber?: string;
  waiterName?: string;
  notes?: string;
}

export interface ShopTransactionResponse {
  transactionId?: string;
  receiptNumber?: string;
  transaction?: Record<string, unknown>;
  message?: string;
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

/** Genera UUID v4 para clientEventId */
const generateClientEventId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/** Payload de entrada desde App - se normaliza a ShopTransaction */
export interface CreateSaleInput {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  tableNumber?: string;
  waiterName?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
    category?: string;
    variantDescription?: string;
    notes?: string;
  }>;
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  paymentMethod?: string;
  orderType?: OrderType;
  source?: Source;
  notes?: string;
}

/**
 * Crea una venta en la Sales API principal.
 * POST /api/:shopId/sales
 * - source por defecto: 'local'
 * - totalPrice obligatorio en cada ítem
 * - clientEventId para idempotencia
 */
export const createSale = async (payload: CreateSaleInput): Promise<ApiResponse<ShopTransactionResponse>> => {
  const shopId = getShopId();
  if (!shopId) {
    return { success: false, error: 'Shop ID no configurado' };
  }

  if (!payload.items?.length) {
    return { success: false, error: 'Items array is required and must not be empty' };
  }

  const clientEventId = generateClientEventId();
  const clientTimestampUnixMs = Date.now();

  // Normalizar items: obligatorios productId, productName, quantity, unitPrice, totalPrice, category
  const items: ShopTransactionItem[] = payload.items.map((item) => {
    const qty = item.quantity;
    const qtyInt = Number.isInteger(qty) ? qty : Math.max(1, Math.round(qty));
    const unitPrice = Number(item.unitPrice) > 0 ? Number(item.unitPrice) : 0;
    const totalPrice = item.totalPrice != null
      ? Number(item.totalPrice)
      : unitPrice * qtyInt;
    return {
      productId: String(item.productId).trim(),
      productName: (item.productName || '').trim() || 'Producto',
      quantity: qtyInt > 0 ? qtyInt : 1,
      unitPrice,
      totalPrice: totalPrice > 0 ? totalPrice : unitPrice * (qtyInt > 0 ? qtyInt : 1),
      category: (item.category || '').trim() || 'General',
    };
  });

  // Validar items
  const invalidItem = items.find(
    (i) =>
      !i.productId ||
      !i.productName ||
      i.quantity <= 0 ||
      i.unitPrice <= 0 ||
      i.totalPrice <= 0 ||
      !i.category
  );
  if (invalidItem) {
    return {
      success: false,
      error: 'Items are missing required fields (productId, productName, quantity, unitPrice, totalPrice, category)',
    };
  }

  const apiPayload: ShopTransactionPayload = {
    clientEventId,
    clientTimestampUnixMs,
    sourcePlatform: 'desktop',
    sourceDeviceId: undefined,
    customerName: (payload.customerName || '').trim().slice(0, 100) || 'Cliente General',
    items,
    subtotal: Number(payload.subtotal) > 0 ? Number(payload.subtotal) : payload.total,
    total: Number(payload.total) > 0 ? Number(payload.total) : payload.subtotal,
    tax: payload.tax ?? 0,
    discount: payload.discount ?? 0,
    paymentMethod: normalizePaymentMethod(payload.paymentMethod ?? 'cash'),
    orderType: payload.orderType ?? 'dine-in',
    source: payload.source ?? 'local',
    tableNumber: payload.tableNumber || undefined,
    waiterName: payload.waiterName || undefined,
    notes: payload.notes || undefined,
    customerPhone: payload.customerPhone || undefined,
    customerEmail: payload.customerEmail || undefined,
  };

  const url = shouldUseSalesMcpProxy()
    ? `${getLocalApiOrigin()}/api/proxy/sales/${shopId}`
    : `${getApiOrigin()}/api/${shopId}/sales`;

  console.log('[SALE] POST Sales API iniciando:', { url, shopId, total: apiPayload.total, itemsCount: apiPayload.items.length, clientEventId });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(apiPayload),
    });

    const result = await response.json();

    console.log('[SALE] POST Sales API respuesta:', { status: response.status, ok: response.ok, hasData: !!result?.data });

    if (!response.ok) {
      const errMsg = result?.error || result?.message || result?.details || `Error ${response.status}`;
      console.warn('[SALE] POST Sales API falló:', { status: response.status, error: errMsg });
      return {
        success: false,
        error: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg),
      };
    }

    if (response.status === 200 || response.status === 201) {
      console.log('[SALE] POST Sales API 200/201 OK - venta sincronizada:', {
        transactionId: result?.data?.transactionId ?? result?.transactionId,
        receiptNumber: result?.data?.receiptNumber ?? result?.receiptNumber,
      });
    }

    return {
      success: true,
      data: result?.data ?? result,
    };
  } catch (err) {
    console.error('[SALE] POST Sales API error de conexión:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error de conexión',
    };
  }
};
