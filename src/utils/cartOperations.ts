/**
 * Pure cart operations for the POS.
 *
 * Extracted from App.tsx so the cart math (line pricing, quantity merge, stock
 * limits, removal, subtotal) can be unit-tested in isolation and reused by the
 * `useCart` hook. These functions are pure: given the previous cart they return
 * a new cart (never mutate) plus an optional error signal. Side effects — toasts,
 * order counters, persistence — stay in the caller.
 *
 * Behaviour here mirrors the original App.tsx handlers exactly.
 */
import type { CartItem } from '../types/domain';
import type { PosProduct as Product } from '../types/domain';
import type { SelectedVariants } from '../types/variants';
import { calculateProductPrice, buildVariantDisplayName } from '../types/variants';

export interface AddToCartOptions {
  quantity?: number;
  weight?: number;
  variants?: SelectedVariants;
  notes?: string;
}

export type CartOpError = 'insufficient-stock';

export interface CartOpResult {
  cart: CartItem[];
  error?: CartOpError;
  /** Stock available, present when error === 'insufficient-stock'. */
  available?: number;
  /** Unit label for stock messages ('' for units, 'kg' for weight-based). */
  unit?: string;
  /** The product involved, so the caller can build a restock toast. */
  product?: Product;
}

/** Default line-id generator; injectable so tests can be deterministic. */
export const defaultLineId = (product: Product): string =>
  `${product.id}-${Date.now()}-${Math.random()}`;

/** Build a fully-priced cart line from a product + options. */
export function createCartLine(
  product: Product,
  opts: AddToCartOptions = {},
  makeId: (p: Product) => string = defaultLineId
): CartItem {
  const { quantity = 1, weight, variants, notes } = opts;
  const unitPrice =
    variants && product.hasVariants ? calculateProductPrice(product, variants) : product.price;
  const finalQuantity = product.isWeightBased && weight ? weight : quantity;
  const itemTotal = unitPrice * finalQuantity;
  const variantDisplayName =
    variants && product.variantGroups?.length
      ? buildVariantDisplayName(product.name, product.variantGroups, variants)
      : undefined;

  return {
    id: makeId(product),
    product,
    quantity: product.isWeightBased ? 1 : quantity,
    weight: product.isWeightBased ? weight || 1 : undefined,
    selectedVariants: variants,
    variantDisplayName,
    unitPrice,
    itemTotal,
    notes,
  };
}

/**
 * Add a product to the cart, merging with an existing matching line (same
 * product id + same selected variants) or appending a new one. Enforces stock
 * for non-weight products both up-front and after the merge.
 */
export function addProductToCart(
  prevCart: CartItem[],
  product: Product,
  opts: AddToCartOptions = {},
  makeId: (p: Product) => string = defaultLineId
): CartOpResult {
  const { quantity = 1, weight, variants, notes } = opts;

  if (!product.isWeightBased && quantity > product.stock) {
    return { cart: prevCart, error: 'insufficient-stock', available: product.stock, unit: '', product };
  }

  const productIdStr = String(product.id);
  const existingItem = prevCart.find((item) => {
    if (String(item.product.id) !== productIdStr) return false;
    if (product.hasVariants && variants) {
      return JSON.stringify(item.selectedVariants || {}) === JSON.stringify(variants);
    }
    return !product.hasVariants;
  });

  if (existingItem) {
    let stockError: CartOpResult | null = null;
    const cart = prevCart.map((item) => {
      if (item.id !== existingItem.id) return item;
      const newQuantity = product.isWeightBased
        ? (item.weight || 0) + (weight || 0)
        : item.quantity + quantity;

      if (!product.isWeightBased && newQuantity > product.stock) {
        stockError = {
          cart: prevCart,
          error: 'insufficient-stock',
          available: product.stock,
          unit: '',
          product,
        };
        return item;
      }

      const itemTotal = item.unitPrice * newQuantity;
      return {
        ...item,
        quantity: product.isWeightBased ? 1 : newQuantity,
        weight: product.isWeightBased ? newQuantity : item.weight,
        itemTotal,
      };
    });
    if (stockError) return stockError;
    return { cart };
  }

  const newItem = createCartLine(product, { quantity, weight, variants, notes }, makeId);
  return { cart: [...prevCart, newItem] };
}

/** Change the quantity (or weight, for weight-based products) of one line. */
export function updateCartLineQuantity(
  prevCart: CartItem[],
  itemId: string,
  newQuantity: number,
  weight?: number
): CartOpResult {
  let error: CartOpResult | null = null;
  const cart = prevCart.map((item) => {
    if (item.id !== itemId) return item;
    const product = item.product;
    const quantity = product.isWeightBased ? 1 : newQuantity;
    const finalWeight = product.isWeightBased ? weight || newQuantity : item.weight;

    if (!product.isWeightBased && newQuantity > product.stock) {
      error = { cart: prevCart, error: 'insufficient-stock', available: product.stock, unit: '', product };
      return item;
    }
    if (product.isWeightBased && finalWeight && finalWeight > product.stock) {
      error = { cart: prevCart, error: 'insufficient-stock', available: product.stock, unit: 'kg', product };
      return item;
    }

    const finalQuantity = product.isWeightBased ? finalWeight || 0 : quantity;
    const itemTotal = item.unitPrice * finalQuantity;
    return { ...item, quantity, weight: finalWeight, itemTotal };
  });
  if (error) return error;
  return { cart };
}

/** Remove a line by id. */
export function removeCartLine(prevCart: CartItem[], itemId: string): CartItem[] {
  return prevCart.filter((item) => item.id !== itemId);
}

/** Set (or clear) the per-line note. */
export function setCartLineNotes(prevCart: CartItem[], itemId: string, notes: string): CartItem[] {
  return prevCart.map((item) =>
    item.id === itemId ? { ...item, notes: notes.trim() || undefined } : item
  );
}

/** Sum of line totals (pre-tax subtotal). */
export function cartSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.itemTotal, 0);
}
