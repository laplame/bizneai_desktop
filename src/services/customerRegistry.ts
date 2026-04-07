import type { CustomerStatus, RegistryCustomer } from '../types/customerRegistry';
import { scheduleMirrorKeyToSqlite } from './posPersistService';

const STORAGE_KEY = 'bizneai-customers-registry';

const INITIAL_CUSTOMERS: Omit<RegistryCustomer, 'customerStatus'>[] = [
  {
    id: 1,
    firstName: 'María',
    lastName: 'González',
    email: 'maria.gonzalez@email.com',
    phone: '+52 55 1234 5678',
    address: 'Av. Insurgentes Sur 1234',
    city: 'Ciudad de México',
    state: 'CDMX',
    zipCode: '03100',
    birthday: '1985-03-15',
    gender: 'female',
    membershipLevel: 'gold',
    totalSpent: 2847.5,
    totalOrders: 23,
    lastPurchase: '2024-01-10T14:30:00.000Z',
    isActive: true,
    notes: 'Cliente frecuente',
    tags: ['frecuente', 'café'],
    createdAt: '2023-01-15T10:00:00.000Z',
    updatedAt: '2024-01-10T14:30:00.000Z',
  },
  {
    id: 2,
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    email: 'carlos.rodriguez@email.com',
    phone: '+52 55 9876 5432',
    address: 'Calle Reforma 567',
    city: 'Guadalajara',
    state: 'Jalisco',
    zipCode: '44100',
    birthday: '1990-07-22',
    gender: 'male',
    membershipLevel: 'silver',
    totalSpent: 1245.75,
    totalOrders: 12,
    lastPurchase: '2024-01-08T16:45:00.000Z',
    isActive: true,
    notes: '',
    tags: ['oficina'],
    createdAt: '2023-06-20T10:00:00.000Z',
    updatedAt: '2024-01-08T16:45:00.000Z',
  },
  {
    id: 3,
    firstName: 'Ana',
    lastName: 'Martínez',
    email: 'ana.martinez@email.com',
    phone: '+52 55 5555 1234',
    address: 'Blvd. Constitución 890',
    city: 'Monterrey',
    state: 'Nuevo León',
    zipCode: '64000',
    birthday: '1988-11-08',
    gender: 'female',
    membershipLevel: 'platinum',
    totalSpent: 5678.9,
    totalOrders: 45,
    lastPurchase: '2024-01-12T09:15:00.000Z',
    isActive: true,
    notes: 'VIP',
    tags: ['vip'],
    createdAt: '2022-08-10T10:00:00.000Z',
    updatedAt: '2024-01-12T09:15:00.000Z',
  },
  {
    id: 4,
    firstName: 'Luis',
    lastName: 'Hernández',
    email: 'luis.hernandez@email.com',
    phone: '+52 55 4444 5678',
    address: 'Calle Juárez 234',
    city: 'Puebla',
    state: 'Puebla',
    zipCode: '72000',
    birthday: '1995-04-30',
    gender: 'male',
    membershipLevel: 'bronze',
    totalSpent: 345.25,
    totalOrders: 4,
    lastPurchase: '2024-01-05T12:20:00.000Z',
    isActive: true,
    notes: 'Cliente nuevo',
    tags: ['nuevo'],
    createdAt: '2023-12-15T10:00:00.000Z',
    updatedAt: '2024-01-05T12:20:00.000Z',
  },
  {
    id: 5,
    firstName: 'Sofia',
    lastName: 'López',
    email: 'sofia.lopez@email.com',
    phone: '+52 55 3333 9999',
    address: 'Av. Hidalgo 456',
    city: 'Querétaro',
    state: 'Querétaro',
    zipCode: '76000',
    birthday: '1992-09-12',
    gender: 'female',
    membershipLevel: 'silver',
    totalSpent: 1890.3,
    totalOrders: 18,
    lastPurchase: '2023-11-15T10:00:00.000Z',
    isActive: false,
    notes: 'Inactiva',
    tags: ['inactivo'],
    createdAt: '2023-03-05T10:00:00.000Z',
    updatedAt: '2023-11-15T10:00:00.000Z',
  },
];

export function computeCustomerStatus(c: Partial<RegistryCustomer>): CustomerStatus {
  if (c.isActive === false) return 'inactive';
  const orders = c.totalOrders ?? 0;
  const spent = c.totalSpent ?? 0;
  if (spent >= 5000 || c.membershipLevel === 'platinum') return 'vip';
  if (orders >= 15 || spent >= 2500) return 'frequent';
  if (orders <= 3) return 'new';
  return 'active';
}

function withStatus(c: Omit<RegistryCustomer, 'customerStatus'>): RegistryCustomer {
  return { ...c, customerStatus: computeCustomerStatus(c) };
}

function seedFromInitial(): RegistryCustomer[] {
  const list = INITIAL_CUSTOMERS.map(withStatus);
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
