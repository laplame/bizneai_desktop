/**
 * Sincronización opcional de clientes con GET/POST/PUT MCP (desktop).
 * No bloquea la UI ni el modo offline: si falla, el registro local sigue siendo la fuente de uso.
 */

import { buildMcpResourceUrl } from '../utils/mcpResourceUrl';
import { getShopId } from '../utils/shopIdHelper';
import type { RegistryCommercialConditions, RegistryCustomer } from '../types/customerRegistry';
import { computeCustomerStatus, loadCustomers, saveCustomers } from './customerRegistry';
import { MCP_SNAPSHOT, mirrorMcpPayloadToLocalSql } from './mcpSnapshotMirror';

export function isProvisionalOrLocalShopId(shopId: string | null): boolean {
  if (!shopId) return true;
  if (shopId === 'local-unconfigured') return true;
  return shopId.startsWith('provisional-');
}

export function canSyncCustomersToMcp(): boolean {
  const id = getShopId();
  return !!id && !isProvisionalOrLocalShopId(id);
}

/** Respuesta flexible del backend MCP (solo campos que usamos). */
interface McpCustomerRow {
  id: string;
  name?: string;
  rfc?: string;
  status?: string;
  allowCredit?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  priceType?: string;
  priceTypeCustomLabel?: string;
  commercialConditions?: RegistryCommercialConditions | null;
  taxData?: {
    email?: string;
    phone?: string;
    postalCode?: string;
    legalName?: string;
  };
  salesStats?: {
    totalSales?: number;
    totalRevenue?: number;
    lastSaleDate?: string;
  };
}

function parseCustomersPayload(data: unknown): McpCustomerRow[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data as McpCustomerRow[];
  if (typeof data !== 'object') return [];
  const o = data as Record<string, unknown>;
  if (Array.isArray(o.customers)) return o.customers as McpCustomerRow[];
  if (Array.isArray(o.data)) return o.data as McpCustomerRow[];
  if (o.data && typeof o.data === 'object') {
    const inner = o.data as Record<string, unknown>;
    if (Array.isArray(inner.customers)) return inner.customers as McpCustomerRow[];
    if (Array.isArray(inner.data)) return inner.data as McpCustomerRow[];
  }
  return [];
}

function splitName(full: string): { firstName: string; lastName: string } {
  const t = full.trim();
  if (!t) return { firstName: 'Cliente', lastName: '-' };
  const parts = t.split(/\s+/);
  return { firstName: parts[0]!, lastName: parts.slice(1).join(' ') || '-' };
}

function mapMcpToRegistry(r: McpCustomerRow, numericId: number): RegistryCustomer {
  const { firstName, lastName } = splitName(r.name ?? '');
  const totalOrders = r.salesStats?.totalSales ?? 0;
  const totalSpent = r.salesStats?.totalRevenue ?? 0;
  const lastPurchase = r.salesStats?.lastSaleDate ?? '';
  const base: Omit<RegistryCustomer, 'customerStatus'> = {
    id: numericId,
    mcpCustomerId: String(r.id),
    firstName,
    lastName,
    email: r.taxData?.email ?? '',
    phone: r.taxData?.phone ?? '',
    address: '',
    city: '',
    state: '',
    zipCode: r.taxData?.postalCode ?? '',
    birthday: '',
    gender: 'other',
    membershipLevel: 'bronze',
    totalSpent,
    totalOrders,
    lastPurchase,
    isActive: r.status !== 'inactive',
    notes: r.notes ?? '',
    tags: [],
    createdAt: r.createdAt ?? r.updatedAt ?? new Date().toISOString(),
    updatedAt: r.updatedAt ?? new Date().toISOString(),
    rfc: r.rfc,
    allowCredit: r.allowCredit ?? false,
    priceType: r.priceType,
    priceTypeCustomLabel: r.priceTypeCustomLabel,
    commercialConditions: r.commercialConditions ?? null,
  };
  return { ...base, customerStatus: computeCustomerStatus(base) };
}

function pickNewer(a: RegistryCustomer, b: RegistryCustomer): RegistryCustomer {
  const ta = new Date(a.updatedAt || 0).getTime();
  const tb = new Date(b.updatedAt || 0).getTime();
  return tb >= ta ? { ...b, id: a.id } : a;
}

/**
 * Fusiona respuesta remota con filas locales: conserva clientes sin `mcpCustomerId`;
 * para mismos `mcpCustomerId` gana el `updatedAt` más reciente.
 */
export function mergeRemoteCustomersIntoLocal(
  localRows: RegistryCustomer[],
  remote: McpCustomerRow[]
): RegistryCustomer[] {
  const soloLocal = localRows.filter((c) => !c.mcpCustomerId);
  const withMcp = localRows.filter((c) => c.mcpCustomerId);
  const byMcp = new Map(withMcp.map((c) => [c.mcpCustomerId!, c]));
  let maxId = localRows.reduce((m, c) => Math.max(m, c.id), 0);

  const merged: RegistryCustomer[] = [];
  const seenMcp = new Set<string>();

  for (const r of remote) {
    const mid = String(r.id);
    seenMcp.add(mid);
    const existing = byMcp.get(mid);
    const candidate = mapMcpToRegistry(r, existing?.id ?? ++maxId);
    if (existing) {
      merged.push(pickNewer(existing, candidate));
      byMcp.delete(mid);
    } else {
      merged.push(candidate);
    }
  }

  // Filas que tenían mcp id pero el servidor no las devolvió (ej. filtro): conservarlas
  const orphanMcp = [...byMcp.values()];

  return [...soloLocal, ...merged, ...orphanMcp].sort((a, b) => a.id - b.id);
}

function customersUrl(shopId: string): string {
  return buildMcpResourceUrl(shopId, 'customers');
}

function registryToMcpPayload(c: RegistryCustomer, logicalId: string): Record<string, unknown> {
  const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Cliente';
  const payload: Record<string, unknown> = {
    id: logicalId,
    name,
    rfc: (c.rfc && c.rfc.trim()) || 'XAXX010101000',
    status: c.isActive ? 'active' : 'inactive',
    allowCredit: c.allowCredit ?? false,
    notes: c.notes || '',
  };
  if (c.priceType) payload.priceType = c.priceType;
  if (c.priceTypeCustomLabel) payload.priceTypeCustomLabel = c.priceTypeCustomLabel;
  if (c.commercialConditions !== undefined) payload.commercialConditions = c.commercialConditions;
  const email = c.email?.trim();
  const phone = c.phone?.trim();
  const postalCode = c.zipCode?.trim();
  if (email || phone || postalCode) {
    payload.taxData = {
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(postalCode ? { postalCode } : {}),
    };
  }
  return payload;
}

function generateMcpLogicalId(): string {
  try {
    const u = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `pos_${String(u).replace(/-/g, '').slice(0, 16)}`;
  } catch {
    return `pos_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export async function pullCustomersFromMcp(): Promise<{ ok: boolean; error?: string; count?: number }> {
  if (!canSyncCustomersToMcp()) {
    return { ok: true, count: 0 };
  }
  const shopId = getShopId()!;
  const url = customersUrl(shopId);
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const data: unknown = await res.json();
    try {
      const q = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
      void mirrorMcpPayloadToLocalSql({
        shopId,
        resourcePath: MCP_SNAPSHOT.customers,
        queryKey: q,
        payload: data,
      });
    } catch {
      /* ignore mirror errors */
    }
    const rows = parseCustomersPayload(data);
    const local = loadCustomers();
    const merged = mergeRemoteCustomersIntoLocal(local, rows);
    saveCustomers(merged);
    return { ok: true, count: rows.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Tras guardar en local: intenta POST (nuevo) o PUT (si ya hay `mcpCustomerId`).
 * Devuelve el cliente con `mcpCustomerId` rellenado si hubo alta remota.
 */
export async function syncCustomerToMcpAfterSave(c: RegistryCustomer): Promise<RegistryCustomer | null> {
  if (!canSyncCustomersToMcp()) return null;
  const shopId = getShopId()!;
  const base = customersUrl(shopId).split('?')[0];

  try {
    if (c.mcpCustomerId) {
      const url = `${base}/${encodeURIComponent(c.mcpCustomerId)}`;
      const body = registryToMcpPayload(c, c.mcpCustomerId);
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      return res.ok ? c : null;
    }

    const logicalId = generateMcpLogicalId();
    const body = registryToMcpPayload(c, logicalId);
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return { ...c, mcpCustomerId: logicalId, updatedAt: new Date().toISOString() };
  } catch {
    return null;
  }
}
