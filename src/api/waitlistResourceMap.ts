/**
 * Mapeo entre el contrato público de waitlist (www.bizneai.com) y el modelo del modal Lista de espera.
 *
 * - POST /api/waitlist/shop/:shopId — cuerpo según WaitlistEntrySchema (shopId va en URL).
 * - GET /api/waitlist/orders?shopId= — filas “app” con orderName, id, ítems aplanados (productId, …).
 * - GET /api/waitlist/entries?shopId= — documentos anidados (items[].product.*).
 */
import type { CreateWaitlistEntryRequest, WaitlistEntry, WaitlistItem } from '../types/api';

/** Cuerpo JSON para POST /waitlist/shop/:shopId (sin shopId en body; lo fuerza la URL). */
export function buildShopWaitlistPostPayload(body: CreateWaitlistEntryRequest): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: body.name.trim(),
    items: body.items.map((it) => ({
      product: {
        id: String(it.product.id),
        name: it.product.name,
        price: Number(it.product.price),
        category: (it.product.category || 'General').trim() || 'General',
        ...(it.product.image && /^https?:\/\//i.test(it.product.image.trim())
          ? { image: it.product.image.trim() }
          : {}),
      },
      quantity: Math.max(1, Math.floor(Number(it.quantity))),
    })),
    total: Number(body.total),
  };

  if (body.source) payload.source = body.source;
  if (body.notes?.trim()) payload.notes = body.notes.trim();
  if (body.estimatedTime != null && Number.isFinite(body.estimatedTime)) {
    payload.estimatedTime = Math.floor(Number(body.estimatedTime));
  }
  if (body.customerInfo?.name?.trim()) {
    const ci = body.customerInfo;
    payload.customerInfo = {
      name: ci.name.trim(),
      ...(ci.phone != null && String(ci.phone).trim() ? { phone: String(ci.phone).trim() } : {}),
      ...(ci.email != null && String(ci.email).trim() ? { email: String(ci.email).trim() } : {}),
    };
  }

  return payload;
}

function normalizeOneItem(raw: unknown): WaitlistItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  if (o.product && typeof o.product === 'object') {
    const p = o.product as Record<string, unknown>;
    const product: WaitlistItem['product'] = {
      id: String(p.id ?? ''),
      name: String(p.name ?? 'Producto'),
      price: typeof p.price === 'number' ? p.price : Number(p.price) || 0,
      category: String(p.category ?? 'General'),
    };
    if (typeof p.image === 'string' && p.image.trim()) {
      product.image = p.image.trim();
    }
    return {
      product,
      quantity: typeof o.quantity === 'number' ? o.quantity : Number(o.quantity) || 1,
    };
  }

  if ('productId' in o || 'productName' in o) {
    const product: WaitlistItem['product'] = {
      id: String(o.productId ?? ''),
      name: String(o.productName ?? 'Producto'),
      price: typeof o.price === 'number' ? o.price : Number(o.price) || 0,
      category: String(o.category ?? 'General'),
    };
    if (typeof o.image === 'string' && o.image) {
      product.image = String(o.image);
    }
    return {
      product,
      quantity: typeof o.quantity === 'number' ? o.quantity : Number(o.quantity) || 1,
    };
  }

  return null;
}

/** Normaliza items[] tanto formato entries (anidado) como orders (aplanado). */
export function normalizeWaitlistItemsArray(items: unknown): WaitlistItem[] {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeOneItem).filter((x): x is WaitlistItem => x != null);
}

function normalizeEntryStatus(raw: unknown): WaitlistEntry['status'] {
  const t = String(raw ?? 'waiting');
  if (t === 'waiting' || t === 'preparing' || t === 'ready' || t === 'completed') return t;
  return 'waiting';
}

function timestampToIso(raw: unknown): string {
  if (typeof raw === 'string' && raw) return raw;
  if (raw instanceof Date) return raw.toISOString();
  return new Date().toISOString();
}

/** Fila devuelta por GET /waitlist/orders (formato app). */
export function mapOrdersApiRowToWaitlistEntry(row: Record<string, unknown>): WaitlistEntry {
  const _id = String(row.id ?? row._id ?? '');
  const name = String(row.orderName ?? row.name ?? 'Pedido').trim() || 'Pedido';
  const items = normalizeWaitlistItemsArray(row.items);
  const ts = timestampToIso(row.timestamp);
  const cust = row.customerInfo;
  const customerInfo: WaitlistEntry['customerInfo'] =
    cust && typeof cust === 'object' && cust != null && 'name' in cust && typeof (cust as { name?: unknown }).name === 'string'
      ? {
          name: String((cust as { name: string }).name),
          ...('phone' in cust && (cust as { phone?: string }).phone
            ? { phone: String((cust as { phone?: string }).phone) }
            : {}),
          ...('email' in cust && (cust as { email?: string }).email
            ? { email: String((cust as { email?: string }).email) }
            : {}),
        }
      : { name };

  const entry: WaitlistEntry = {
    _id,
    shopId: String(row.shopId ?? ''),
    name,
    items,
    total: typeof row.total === 'number' ? row.total : Number(row.total) || 0,
    source: row.source === 'online' ? 'online' : 'local',
    status: normalizeEntryStatus(row.status),
    customerInfo,
    timestamp: ts,
  };

  if (typeof row.notes === 'string' && row.notes) entry.notes = row.notes;
  if (typeof row.estimatedTime === 'number') entry.estimatedTime = row.estimatedTime;
  if (typeof row.elapsedTime === 'number') entry.elapsedTime = row.elapsedTime;
  if (typeof row.hasKitchen === 'boolean') entry.hasKitchen = row.hasKitchen;

  return entry;
}

export function mapGetOrdersResponseToEntries(body: unknown): {
  success: boolean;
  data: WaitlistEntry[];
  error?: string;
} {
  if (!body || typeof body !== 'object') {
    return { success: false, data: [] };
  }
  const o = body as Record<string, unknown>;
  if (o.success !== true || !Array.isArray(o.data)) {
    return {
      success: false,
      data: [],
      error: typeof o.error === 'string' ? o.error : undefined,
    };
  }
  return {
    success: true,
    data: (o.data as Record<string, unknown>[]).map((r) => mapOrdersApiRowToWaitlistEntry(r)),
  };
}
