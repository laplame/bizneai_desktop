/** Cliente del registro local (POS + CRM ligero). Sincronizado con `bizneai-customers-registry`. */

export type CustomerStatus = 'new' | 'active' | 'frequent' | 'vip' | 'inactive';

export interface RegistryCustomer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  birthday: string;
  gender: 'male' | 'female' | 'other';
  membershipLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  totalOrders: number;
  lastPurchase: string;
  isActive: boolean;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  /** Calculado al registrar compras o al guardar en CRM. */
  customerStatus: CustomerStatus;
}
