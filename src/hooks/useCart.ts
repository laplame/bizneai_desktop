/**
 * useCart — owns the POS cart array and exposes pure-backed operations.
 *
 * The cart state and its transforms used to live inline in App.tsx. This hook
 * centralises them on top of the pure functions in utils/cartOperations, while
 * leaving side effects (toasts, order counters, persistence) to the caller:
 * the mutating methods return a `CartOpResult` so the caller can react to an
 * `insufficient-stock` error however it likes.
 *
 * `setCart` is exposed directly because several flows (sale recovery, waitlist,
 * hydration from localStorage) replace the whole cart wholesale.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import type { CartItem } from '../types/domain';
import type { PosProduct as Product } from '../types/domain';
import {
  addProductToCart,
  updateCartLineQuantity,
  removeCartLine,
  setCartLineNotes,
  cartSubtotal,
  type AddToCartOptions,
  type CartOpResult,
} from '../utils/cartOperations';

export function useCart(initial: CartItem[] = []) {
  const [cart, setCart] = useState<CartItem[]>(initial);

  // Always-current snapshot so the callbacks below stay stable (no deps) while
  // still operating on the latest cart when a user event fires.
  const cartRef = useRef(cart);
  cartRef.current = cart;

  const subtotal = useMemo(() => cartSubtotal(cart), [cart]);

  const addProduct = useCallback((product: Product, opts: AddToCartOptions = {}): CartOpResult => {
    const result = addProductToCart(cartRef.current, product, opts);
    if (!result.error) setCart(result.cart);
    return result;
  }, []);

  const changeQuantity = useCallback(
    (itemId: string, newQuantity: number, weight?: number): CartOpResult => {
      const result = updateCartLineQuantity(cartRef.current, itemId, newQuantity, weight);
      if (!result.error) setCart(result.cart);
      return result;
    },
    []
  );

  const removeLine = useCallback((itemId: string) => {
    setCart((prev) => removeCartLine(prev, itemId));
  }, []);

  const setLineNotes = useCallback((itemId: string, notes: string) => {
    setCart((prev) => setCartLineNotes(prev, itemId, notes));
  }, []);

  const clear = useCallback(() => setCart([]), []);

  return { cart, setCart, subtotal, addProduct, changeQuantity, removeLine, setLineNotes, clear };
}
