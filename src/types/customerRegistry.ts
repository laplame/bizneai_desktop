/** Cliente del registro local (POS + CRM ligero). Sincronizado con `bizneai-customers-registry`. */

export type CustomerStatus = 'new' | 'active' | 'frequent' | 'vip' | 'inactive';

/** Condiciones comerciales opcionales (paridad con API MCP). */
export interface RegistryCommercialConditions {
  minPurchaseAmount?: number;
  minPurchaseCurrency?: string;
  paymentTermsDays?: number;
  creditLimitAmount?: number;
  agreedDiscountPercent?: number;
  volumePurchaseNotes?: string;
  additionalTerms?: string;
}

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
  /** Id lógico en API MCP (`/api/mcp/:shopId/customers`); el `id` numérico sigue siendo el de la UI local. */
  mcpCustomerId?: string;
  rfc?: string;
  allowCredit?: boolean;
  priceType?: string;
  priceTypeCustomLabel?: string;
  commercialConditions?: RegistryCommercialConditions | null;
}
