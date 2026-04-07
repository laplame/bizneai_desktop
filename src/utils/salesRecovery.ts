import type { Transaction } from './merkleTree';
import type { RecoveredSalePayload, RecoveredSaleLine } from '../types/salesRecovery';
import { mapMcpTransactionToSale } from './shopIdHelper';

/** Fila de venta unificada (MCP, Merkle o muestra) — compatible con el panel de ventas */
export interface SaleReportRow {
  id: string | number;
  date: string;
  items: Array<{
    product: {
      id: number;
      name: string;
      price: number;
      category: string;
    };
    quantity: number;
  }>;
  total: number;
  paymentMethod: string;
  change: number;
  subtotal?: number;
  tax?: number;
  customerName?: string;
  notes?: string;
  source?: 'mcp' | 'merkle' | 'sample';
}

export function mapMerkleTransactionToSaleRow(tx: Transaction): SaleReportRow | null {
  if (tx.action !== 'create') return null;
  const d = tx.data as Record<string, unknown>;
  const itemsRaw = Array.isArray(d.items) ? d.items : [];
  const items = itemsRaw.map((it: unknown, i: number) => {
    const row = it as Record<string, unknown>;
    const pid = row.productId ?? `p-${i}`;
    const unitPrice = Number(row.unitPrice) || 0;
    const qty = Number(row.quantity) || 1;
    const n =
      typeof pid === 'number'
        ? pid
        : parseInt(String(pid).replace(/\D/g, ''), 10) || 900000 + i;
    return {
      product: {
        id: n,
        name: String(row.productName ?? 'Producto'),
        price: unitPrice,
        category: String(row.category ?? 'General'),
      },
      quantity: qty,
    };
  });
  const saleId = String(d.saleId ?? d.transactionId ?? tx.saleId);
  return {
    id: saleId,
    date: String(d.date ?? d.createdAt ?? tx.timestamp),
    items,
    total: Number(d.total) || 0,
    paymentMethod: String(d.paymentMethod ?? 'cash'),
    change: 0,
    subtotal: d.subtotal !== undefined ? Number(d.subtotal) : undefined,
    tax: d.tax !== undefined ? Number(d.tax) : undefined,
    customerName: d.customerName ? String(d.customerName) : undefined,
    notes: d.notes ? String(d.notes) : undefined,
    source: 'merkle',
  };
}

/** Merkle primero, luego remotas; evita duplicados por id+fecha */
export function mergeSaleRows(merkle: SaleReportRow[], remote: SaleReportRow[]): SaleReportRow[] {
  const seen = new Set<string>();
  const out: SaleReportRow[] = [];
  for (const s of merkle) {
    const k = `${String(s.id)}|${s.date}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(s);
    }
  }
  for (const s of remote) {
    const k = `${String(s.id)}|${s.date}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(s);
    }
  }
  return out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Convierte respuesta MCP al formato del panel (ids numéricos en productos). */
export function mapMcpToSaleRow(mcpTransaction: unknown, index: number): SaleReportRow {
  const raw = mapMcpTransactionToSale(mcpTransaction, index) as Record<string, unknown>;
  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const items = rawItems.map((row: unknown, i: number) => {
    const line = row as { product?: { id?: unknown; name?: string; price?: number; category?: string }; quantity?: number };
    const p = line.product;
    const pid = p?.id;
    const idNum =
      typeof pid === 'number'
        ? pid
        : parseInt(String(pid ?? '').replace(/\D/g, ''), 10) || 800000 + i;
    return {
      product: {
        id: idNum,
        name: String(p?.name ?? ''),
        price: typeof p?.price === 'number' ? p.price : Number(p?.price) || 0,
        category: String(p?.category ?? 'General'),
      },
      quantity:
        typeof line.quantity === 'number' ? line.quantity : Number(line.quantity) || 0,
    };
  });
  const idRaw = raw.id;
  return {
    id: typeof idRaw === 'string' || typeof idRaw === 'number' ? idRaw : `sale_${index}`,
    date: String(raw.date ?? new Date().toISOString()),
    items,
    total: typeof raw.total === 'number' ? raw.total : Number(raw.total) || 0,
    paymentMethod: String(raw.paymentMethod ?? 'cash'),
    change: typeof raw.change === 'number' ? raw.change : Number(raw.change) || 0,
    subtotal: raw.subtotal !== undefined ? Number(raw.subtotal) : undefined,
    tax: raw.tax !== undefined ? Number(raw.tax) : undefined,
    customerName: raw.customer ? String(raw.customer) : undefined,
    notes: undefined,
    source: 'mcp',
  };
}

export function saleRowToRecoveryPayload(sale: SaleReportRow): RecoveredSalePayload {
  const items: RecoveredSaleLine[] = sale.items.map((item) => ({
    productId: item.product.id,
    name: item.product.name,
    category: item.product.category || 'General',
    unitPrice: item.product.price,
    quantity: item.quantity,
  }));
  return {
    displaySaleId: String(sale.id),
    paymentMethod: sale.paymentMethod,
    items,
    subtotal: sale.subtotal,
    tax: sale.tax,
    total: sale.total,
    customerName: sale.customerName,
    notes: sale.notes,
  };
}
