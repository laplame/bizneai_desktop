/**
 * Sales API - POST /api/mcp/:shopId/sales (MCP)
 * Crear venta según documentación MCP.
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

export type PaymentMethod = 'cash' | 'card' | 'crypto' | 'mobile' | 'other';
export type OrderType = 'dine-in' | 'takeaway' | 'delivery';
export type Source = 'local' | 'online' | 'phone' | 'mcp';

/** Item según MCP: productId, productName, quantity, unitPrice, category obligatorios */
export interface McpSaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  category: string;
}

/** Payload MCP - campos obligatorios y opcionales */
export interface McpCreateSalePayload {
  customerName: string;
  items: McpSaleItem[];
  subtotal: number;
  total: number;
  customerPhone?: string;
  customerEmail?: string;
  tax?: number;
  discount?: number;
  paymentMethod?: PaymentMethod;
  orderType?: OrderType;
  source?: Source;
  tableNumber?: string;
  waiterName?: string;
  notes?: string;
}

export interface McpSaleResponse {
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

/** Payload de entrada desde App - se normaliza a formato MCP */
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
 * Crea una venta en la API MCP.
 * POST /api/mcp/:shopId/sales
 */
export const createSale = async (payload: CreateSaleInput): Promise<ApiResponse<McpSaleResponse>> => {
  const shopId = getShopId();
  if (!shopId) {
    return { success: false, error: 'Shop ID no configurado' };
  }

  if (!payload.items?.length) {
    return { success: false, error: 'Items array is required and must not be empty' };
  }

  // Normalizar items: obligatorios productId, productName, quantity, unitPrice, category
  const items: McpSaleItem[] = payload.items.map((item) => {
    const qty = item.quantity;
    const qtyInt = Number.isInteger(qty) ? qty : Math.max(1, Math.round(qty));
    return {
      productId: String(item.productId).trim(),
      productName: (item.productName || '').trim() || 'Producto',
      quantity: qtyInt > 0 ? qtyInt : 1,
      unitPrice: Number(item.unitPrice) > 0 ? Number(item.unitPrice) : 0,
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
      !i.category
  );
  if (invalidItem) {
    return {
      success: false,
      error: 'Items are missing required fields (productId, productName, quantity, unitPrice, category)',
    };
  }

  const mcpPayload: McpCreateSalePayload = {
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

  const mcpUrl = getMcpUrl();
  const url = mcpUrl ? `${mcpUrl}/sales` : `${getApiOrigin()}/api/mcp/${shopId}/sales`;

  console.log('[SALE] POST MCP iniciando:', { url, shopId, total: mcpPayload.total, itemsCount: mcpPayload.items.length });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(mcpPayload),
    });

    const result = await response.json();

    console.log('[SALE] POST MCP respuesta:', { status: response.status, ok: response.ok, hasData: !!result?.data });

    if (!response.ok) {
      const errMsg = result?.error || result?.message || result?.details || `Error ${response.status}`;
      console.warn('[SALE] POST MCP falló:', { status: response.status, error: errMsg });
      return {
        success: false,
        error: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg),
      };
    }

    if (response.status === 200 || response.status === 201) {
      console.log('[SALE] POST MCP 200/201 OK - venta sincronizada:', {
        transactionId: result?.data?.transactionId ?? result?.transactionId,
        receiptNumber: result?.data?.receiptNumber ?? result?.receiptNumber,
      });
    }

    return {
      success: true,
      data: result?.data ?? result,
    };
  } catch (err) {
    console.error('[SALE] POST MCP error de conexión:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error de conexión',
    };
  }
};
