import { describe, it, expect } from 'vitest';
import {
  createCartLine,
  addProductToCart,
  updateCartLineQuantity,
  removeCartLine,
  setCartLineNotes,
  cartSubtotal,
} from '../cartOperations';
import type { PosProduct as Product } from '../../types/domain';
import type { SelectedVariants } from '../../types/variants';

// Deterministic id generator for tests.
let idCounter = 0;
const seqId = () => `line-${++idCounter}`;

function prod(over: Partial<Product> = {}): Product {
  return { id: 1, name: 'Café', price: 10, category: 'Bebidas', stock: 5, ...over };
}

const variantProduct = prod({
  id: 2,
  name: 'Latte',
  hasVariants: true,
  stock: 100,
  variantGroups: [
    {
      name: 'Size',
      label: 'Tamaño',
      type: 'size',
      isPrimary: true,
      order: 0,
      variants: [
        { name: 'Chico', value: 'S', priceModifier: 0, isDefault: true, order: 0 },
        { name: 'Mediano', value: 'M', priceModifier: 0.5, order: 1 },
      ],
    },
  ],
  primaryVariantGroup: 'Size',
});

describe('createCartLine', () => {
  it('prices a simple line and uses the injected id generator', () => {
    const line = createCartLine(prod(), { quantity: 2 }, () => 'fixed-id');
    expect(line.id).toBe('fixed-id');
    expect(line.unitPrice).toBe(10);
    expect(line.itemTotal).toBe(20);
    expect(line.quantity).toBe(2);
    expect(line.weight).toBeUndefined();
  });

  it('stores weight and forces quantity 1 for weight-based products', () => {
    const line = createCartLine(prod({ isWeightBased: true }), { weight: 2.5 }, seqId);
    expect(line.quantity).toBe(1);
    expect(line.weight).toBe(2.5);
    expect(line.itemTotal).toBe(25); // price 10 * 2.5kg
  });
});

describe('addProductToCart', () => {
  it('appends a new line', () => {
    const r = addProductToCart([], prod(), { quantity: 3 }, seqId);
    expect(r.error).toBeUndefined();
    expect(r.cart).toHaveLength(1);
    expect(r.cart[0].itemTotal).toBe(30);
  });

  it('merges a matching product and recomputes the total', () => {
    const first = addProductToCart([], prod(), { quantity: 2 }, seqId).cart;
    const r = addProductToCart(first, prod(), { quantity: 2 }, seqId);
    expect(r.cart).toHaveLength(1);
    expect(r.cart[0].quantity).toBe(4);
    expect(r.cart[0].itemTotal).toBe(40);
  });

  it('rejects an initial quantity above stock and leaves the cart untouched', () => {
    const r = addProductToCart([], prod({ stock: 5 }), { quantity: 6 }, seqId);
    expect(r.error).toBe('insufficient-stock');
    expect(r.available).toBe(5);
    expect(r.cart).toEqual([]);
  });

  it('rejects a merge that would exceed stock', () => {
    const first = addProductToCart([], prod({ stock: 5 }), { quantity: 4 }, seqId).cart;
    const r = addProductToCart(first, prod({ stock: 5 }), { quantity: 2 }, seqId);
    expect(r.error).toBe('insufficient-stock');
    expect(r.cart[0].quantity).toBe(4); // unchanged
  });

  it('accumulates weight for weight-based products', () => {
    const first = addProductToCart([], prod({ isWeightBased: true, stock: 100 }), { weight: 2 }, seqId).cart;
    const r = addProductToCart(first, prod({ isWeightBased: true, stock: 100 }), { weight: 1.5 }, seqId);
    expect(r.cart).toHaveLength(1);
    expect(r.cart[0].weight).toBe(3.5);
    expect(r.cart[0].itemTotal).toBe(35);
  });

  it('keeps different variant selections as separate lines but merges identical ones', () => {
    const s: SelectedVariants = { Size: 'S' };
    const m: SelectedVariants = { Size: 'M' };
    let cart = addProductToCart([], variantProduct, { variants: s }, seqId).cart;
    cart = addProductToCart(cart, variantProduct, { variants: m }, seqId).cart;
    expect(cart).toHaveLength(2);
    cart = addProductToCart(cart, variantProduct, { variants: s }, seqId).cart;
    expect(cart).toHaveLength(2); // 'S' merged, not appended
    const sLine = cart.find((l) => JSON.stringify(l.selectedVariants) === JSON.stringify(s));
    expect(sLine?.quantity).toBe(2);
  });
});

describe('updateCartLineQuantity', () => {
  it('updates quantity and total', () => {
    const cart = addProductToCart([], prod({ stock: 10 }), { quantity: 1 }, seqId).cart;
    const r = updateCartLineQuantity(cart, cart[0].id, 3);
    expect(r.error).toBeUndefined();
    expect(r.cart[0].quantity).toBe(3);
    expect(r.cart[0].itemTotal).toBe(30);
  });

  it('rejects a quantity above stock', () => {
    const cart = addProductToCart([], prod({ stock: 5 }), { quantity: 1 }, seqId).cart;
    const r = updateCartLineQuantity(cart, cart[0].id, 9);
    expect(r.error).toBe('insufficient-stock');
    expect(r.cart[0].quantity).toBe(1); // unchanged
  });
});

describe('removeCartLine / setCartLineNotes / cartSubtotal', () => {
  it('removes a line by id', () => {
    const cart = addProductToCart([], prod(), { quantity: 1 }, seqId).cart;
    expect(removeCartLine(cart, cart[0].id)).toEqual([]);
    expect(removeCartLine(cart, 'nope')).toHaveLength(1);
  });

  it('sets and clears notes', () => {
    const cart = addProductToCart([], prod(), { quantity: 1 }, seqId).cart;
    expect(setCartLineNotes(cart, cart[0].id, '  sin azúcar ')[0]?.notes).toBe('sin azúcar');
    expect(setCartLineNotes(cart, cart[0].id, '   ')[0]?.notes).toBeUndefined();
  });

  it('sums line totals', () => {
    let cart = addProductToCart([], prod({ id: 1 }), { quantity: 2 }, seqId).cart; // 20
    cart = addProductToCart(cart, prod({ id: 3, price: 5, stock: 10 }), { quantity: 4 }, seqId).cart; // 20
    expect(cartSubtotal(cart)).toBe(40);
  });
});
