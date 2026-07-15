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

export type PaymentMethod = 'cash' | 'card' | 'crypto' | 'mobile' | 'other' | 'transfer';
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

/** Campos Merkle opcionales en POST /api/mcp/:shopId/sales (MCPSaleSchema). */
export interface SaleMerklePayload {
  merkleTransactionId: string;
  merkleTransactionHash: string;
  /** Vacío hasta cerrar bloque; el servidor persiste `[]` si se envía. */
  merkleProof?: string[];
  blockId?: string | null;
  blockHash?: string | null;
  merkleRoot?: string | null;
}

/** Payload ShopTransaction para POST /api/:shopId/sales o MCP con extensión Merkle */
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
  merkleTransactionId?: string;
  merkleTransactionHash?: string;
  merkleProof?: string[];
  blockId?: string | null;
  blockHash?: string | null;
  merkleRoot?: string | null;
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

export type CreateSaleResult = ApiResponse<ShopTransactionResponse> & {
  /** Si true, conviene reintentar (red, 5xx, timeout). Si false, corregir datos o descartar. */
  retriable?: boolean;
  httpStatus?: number;
};

export interface CreateSaleOptions {
  /** Tienda con la que se registró la venta (cola offline); por defecto `getShopId()`. */
  shopId?: string;
}

function safeJsonStringify(value: unknown, maxLen: number = 8000): string {
  try {
    const seen = new WeakSet<object>();
    const json = JSON.stringify(
      value,
      (k, v) => {
        if (v && typeof v === 'object') {
          if (seen.has(v as object)) return '[Circular]';
          seen.add(v as object);
        }
        if (k === 'customerEmail' && typeof v === 'string' && v) return '[redacted-email]';
        if (k === 'customerPhone' && typeof v === 'string' && v) return '[redacted-phone]';
        return v;
      },
      2
    );
    if (json.length <= maxLen) return json;
    return `${json.slice(0, maxLen)}\n…[truncated ${json.length - maxLen} chars]`;
  } catch {
    return '[unserializable]';
  }
}

const normalizePaymentMethod = (method: string): PaymentMethod => {
  const m = (method || 'cash').toLowerCase();
  /** Venta a crédito: la API remota suele aceptar `other`; el POS guarda el matiz en notas. */
  if (m === 'credit') return 'other';
  if (['cash', 'card', 'crypto', 'mobile', 'other', 'transfer'].includes(m)) return m as PaymentMethod;
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
  /** Si viene con id+hash, se usa POST /api/mcp/:shopId/sales con campos Merkle. */
  saleMerkle?: SaleMerklePayload;
  /** Mismo id en reintentos / cola offline para idempotencia en servidor. */
  clientEventId?: string;
}

function isRetriableHttpStatus(status: number): boolean {
  if (status === 408 || status === 429) return true;
  return status >= 500;
}

async function parseJsonResponse(response: Response): Promise<Record<string, unknown>> {
  try {
    const text = await response.text();
    if (!text.trim()) return {};
    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function stripMerkleFields(p: ShopTransactionPayload): ShopTransactionPayload {
  const {
    merkleTransactionId: _a,
    merkleTransactionHash: _b,
    merkleProof: _c,
    blockId: _d,
    blockHash: _e,
    merkleRoot: _f,
    ...rest
  } = p;
  return rest as ShopTransactionPayload;
}

/**
 * Crea una venta: Sales API principal (`POST /api/:shopId/sales`) o, si `saleMerkle`
 * trae id+hash de transacción Merkle, `POST /api/mcp/:shopId/sales` con campos Merkle.
 * Si MCP falla, reintenta la Sales API sin campos Merkle.
 */
export const createSale = async (
  payload: CreateSaleInput,
  options?: CreateSaleOptions
): Promise<CreateSaleResult> => {
  const shopId = options?.shopId?.trim() || getShopId();
  if (!shopId) {
    return { success: false, error: 'Shop ID no configurado', retriable: false };
  }

  if (!payload.items?.length) {
    return { success: false, error: 'Items array is required and must not be empty', retriable: false };
  }

  const clientEventId = payload.clientEventId?.trim() || generateClientEventId();
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
      retriable: false,
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

  const saleMerkle = payload.saleMerkle;
  const useMcpSales = Boolean(
    saleMerkle?.merkleTransactionId &&
    saleMerkle?.merkleTransactionHash
  );
  if (useMcpSales && saleMerkle) {
    apiPayload.merkleTransactionId = saleMerkle.merkleTransactionId;
    apiPayload.merkleTransactionHash = saleMerkle.merkleTransactionHash;
    apiPayload.merkleProof = saleMerkle.merkleProof ?? [];
    if (saleMerkle.blockId !== undefined) apiPayload.blockId = saleMerkle.blockId;
    if (saleMerkle.blockHash !== undefined) apiPayload.blockHash = saleMerkle.blockHash;
    if (saleMerkle.merkleRoot !== undefined) apiPayload.merkleRoot = saleMerkle.merkleRoot;
  }

  const legacyUrl = shouldUseSalesMcpProxy()
    ? `${getLocalApiOrigin()}/api/proxy/sales/${shopId}`
    : `${getApiOrigin()}/api/${shopId}/sales`;
  const mcpSalesUrl = shouldUseSalesMcpProxy()
    ? `${getLocalApiOrigin()}/api/proxy/mcp/${shopId}/sales`
    : `${getApiOrigin()}/api/mcp/${shopId}/sales`;

  let url = useMcpSales ? mcpSalesUrl : legacyUrl;
  let body: ShopTransactionPayload = apiPayload;

  // En Electron, algunos logs de objetos salen como "[object Object]".
  // Loguear como string garantiza que el JSON aparezca completo.
  console.log(
    `[SALE] POST venta iniciando ${safeJsonStringify({
      url,
      shopId,
      total: apiPayload.total,
      itemsCount: apiPayload.items.length,
      clientEventId,
      clientTimestampUnixMs,
      mcpMerkle: useMcpSales,
      body,
    })}`
  );

  try {
    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok && useMcpSales) {
      console.warn('[SALE] MCP sales falló, reintentando Sales API sin Merkle:', response.status);
      body = stripMerkleFields(apiPayload);
      url = legacyUrl;
      console.log(`[SALE] Reintento Sales API (sin Merkle) ${safeJsonStringify({ url, body })}`);
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
    }

    const result = await parseJsonResponse(response);

    console.log('[SALE] POST Sales API respuesta:', { status: response.status, ok: response.ok, hasData: !!result?.data });

    if (!response.ok) {
      const rawMsg = result.error ?? result.message ?? result.details ?? `Error ${response.status}`;
      const errMsg = typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg);
      console.warn('[SALE] POST Sales API falló:', { status: response.status, error: errMsg });
      return {
        success: false,
        error: errMsg,
        httpStatus: response.status,
        retriable: isRetriableHttpStatus(response.status),
      };
    }

    if (response.status === 200 || response.status === 201) {
      const data = result.data as Record<string, unknown> | undefined;
      console.log('[SALE] POST Sales API 200/201 OK - venta sincronizada:', {
        transactionId: data?.transactionId ?? result.transactionId,
        receiptNumber: data?.receiptNumber ?? result.receiptNumber,
      });
    }

    return {
      success: true,
      data: (result.data ?? result) as unknown as ShopTransactionResponse,
      httpStatus: response.status,
    };
  } catch (err) {
    console.error('[SALE] POST Sales API error de conexión:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error de conexión',
      retriable: true,
    };
  }
};

export interface SalesOlapCell {
  dimensions: Record<string, string | number | null>;
  metrics: Record<string, number>;
}

export interface SalesOlapResult {
  scope: { mode: 'shop' | 'shops' | 'all'; shopId?: string; shopIds?: string[] };
  grain: string;
  dimensions: string[];
  measures: string[];
  filters: Record<string, string | undefined>;
  cells: SalesOlapCell[];
  totals: Record<string, number>;
  meta: { factCollection: string; cellCount: number; truncated: boolean };
}

/**
 * OLAP de ventas — por tienda o multi-tienda.
 * - Shop: GET /api/:shopId/sales/stats/olap
 * - Multi / global: GET /api/reports/olap?allShops=true | shopIds=…
 */
export async function getSalesOlapStats(params: {
  shopId?: string;
  shopIds?: string[];
  allShops?: boolean;
  dateFrom?: string;
  dateTo?: string;
  grain?: 'hour' | 'day' | 'week' | 'month';
  dimensions?: string;
  measures?: string;
  status?: string;
  transactionType?: string;
  paymentMethod?: string;
  limit?: number;
}): Promise<{ success: boolean; data?: SalesOlapResult; error?: string }> {
  try {
    const q = new URLSearchParams();
    if (params.dateFrom) q.set('dateFrom', params.dateFrom);
    if (params.dateTo) q.set('dateTo', params.dateTo);
    if (params.grain) q.set('grain', params.grain);
    if (params.dimensions) q.set('dimensions', params.dimensions);
    if (params.measures) q.set('measures', params.measures);
    if (params.status) q.set('status', params.status);
    if (params.transactionType) q.set('transactionType', params.transactionType);
    if (params.paymentMethod) q.set('paymentMethod', params.paymentMethod);
    if (params.limit != null) q.set('limit', String(params.limit));

    let path: string;
    if (params.allShops || (params.shopIds && params.shopIds.length > 0) || !params.shopId) {
      if (params.allShops) q.set('allShops', 'true');
      if (params.shopIds?.length) q.set('shopIds', params.shopIds.join(','));
      if (params.shopId && !params.allShops && !params.shopIds?.length) q.set('shopId', params.shopId);
      path = `/reports/olap?${q}`;
    } else {
      path = `/${params.shopId}/sales/stats/olap?${q}`;
    }
    const url = shouldUseSalesMcpProxy()
      ? `${getLocalApiOrigin()}/api/proxy/bizneai${path}`
      : `${getApiOrigin()}/api${path}`;

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    const result = await parseJsonResponse(response);
    if (!response.ok) {
      return {
        success: false,
        error: String(result.error ?? result.message ?? `Error ${response.status}`),
      };
    }
    return { success: true, data: (result.data ?? result) as SalesOlapResult };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error de conexión',
    };
  }
};
