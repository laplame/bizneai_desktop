import type { CustomerStatus, RegistryCustomer } from '../types/customerRegistry';
import { scheduleMirrorKeyToSqlite } from './posPersistService';

const STORAGE_KEY = 'bizneai-customers-registry';

export function computeCustomerStatus(c: Partial<RegistryCustomer>): CustomerStatus {
  if (c.isActive === false) return 'inactive';
  const orders = c.totalOrders ?? 0;
  const spent = c.totalSpent ?? 0;
  if (spent >= 5000 || c.membershipLevel === 'platinum') return 'vip';
  if (orders >= 15 || spent >= 2500) return 'frequent';
  if (orders <= 3) return 'new';
  return 'active';
}

function seedFromInitial(): RegistryCustomer[] {
  const list: RegistryCustomer[] = [];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    scheduleMirrorKeyToSqlite(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return list;
}

export function loadCustomers(): RegistryCustomer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RegistryCustomer[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((row) => ({
          ...row,
          customerStatus: row.customerStatus ?? computeCustomerStatus(row),
        }));
      }
    }
  } catch {
    /* ignore */
  }
  return seedFromInitial();
}

export function saveCustomers(customers: RegistryCustomer[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    scheduleMirrorKeyToSqlite(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('customers-updated'));
  } catch {
    /* ignore */
  }
}

/** Registra una venta completada para un cliente del listado (actualiza totales y estado). */
export function recordPurchaseForCustomer(customerId: number, saleTotal: number): void {
  if (!Number.isFinite(saleTotal) || saleTotal < 0) return;
  const list = loadCustomers();
  const idx = list.findIndex((c) => c.id === customerId);
  if (idx === -1) return;

  const c = { ...list[idx] };
  c.totalOrders = (c.totalOrders || 0) + 1;
  c.totalSpent = (c.totalSpent || 0) + saleTotal;
  c.lastPurchase = new Date().toISOString();
  c.updatedAt = c.lastPurchase;
  c.isActive = true;
  c.customerStatus = computeCustomerStatus(c);

  list[idx] = c;
  saveCustomers(list);
}

export function getCustomerFullName(c: Pick<RegistryCustomer, 'firstName' | 'lastName'>): string {
  return `${c.firstName || ''} ${c.lastName || ''}`.trim();
}

const STATUS_LABELS: Record<CustomerStatus, string> = {
  new: 'Nuevo',
  active: 'Activo',
  frequent: 'Frecuente',
  vip: 'VIP',
  inactive: 'Inactivo',
};

export function getCustomerStatusLabel(status: CustomerStatus): string {
  return STATUS_LABELS[status] ?? status;
}
