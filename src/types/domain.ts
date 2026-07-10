/**
 * Canonical domain types for the desktop POS.
 *
 * Before this file, `Product` / `CartItem` / `CustomerInfo` were re-declared
 * inline in App.tsx, Cart.tsx, ProductManagement.tsx and InventoryManagement.tsx
 * with drifting shapes. This module holds one definition per concept:
 *
 *   • PosProduct / CartItem / CustomerInfo  — runtime shapes for the sales screen.
 *   • ManagedProduct                        — richer admin shape for the
 *                                             product & inventory management screens.
 *
 * The wire DTO (`_id`, `businessId`, …) stays in `types/api.ts`, and the SQLite
 * row type stays in `server/src/legacyDb.ts` — those are different layers on purpose.
 * See docs/ARCHITECTURE.md.
 */
import type { VariantGroup, SelectedVariants } from './variants';
import type { ProductComponentRow } from '../utils/productComponents';

/** Product as used by the point-of-sale screen and cart. */
export interface PosProduct {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  barcode?: string;
  isWeightBased?: boolean;
  hasVariants?: boolean;
  /** Current variant model. */
  variantGroups?: VariantGroup[];
  primaryVariantGroup?: string;
  /** Legacy variant model still read by Cart.tsx (kept optional for back-compat). */
  variants?: { [key: string]: string[] };
  variantModifiers?: { [key: string]: number };
  /** JSON/API: price already includes tax for this item (overrides the store rule). */
  priceIncludesTax?: boolean;
  /** JSON/API: item is tax exempt. */
  taxExempt?: boolean;
}

export interface CartItem {
  id: string;
  product: PosProduct;
  quantity: number;
  weight?: number;
  selectedVariants?: SelectedVariants;
  variantDisplayName?: string;
  unitPrice: number;
  itemTotal: number;
  notes?: string;
}

export interface CustomerInfo {
  name?: string;
  phone?: string;
  email?: string;
  tableNumber?: string;
  waiterName?: string;
  /** Set when chosen from the customer registry (Clientes). */
  customerId?: number;
}

/** Product as used by the Product & Inventory management screens (admin/CRUD). */
export interface ManagedProduct {
  id: number | string;
  name: string;
  description: string;
  price: number;
  cost: number;
  category: string;
  stock: number;
  minStock: number;
  maxStock: number;
  barcode: string;
  sku: string;
  unit: string;
  supplier: string;
  location: string;
  isActive: boolean;
  image?: string;
  tags: string[];
  /** Insumos / BOM / receta (MCP o local). */
  components?: ProductComponentRow[];
  createdAt: string;
  updatedAt: string;
}
