/**
 * KioskView — pantalla de autoservicio para el cliente (modo kiosko).
 *
 * Réplica de la vista de menú de referencia, SIN el menú lateral izquierdo y
 * recoloreada a la identidad de BizneAI (verde esmeralda). Reutiliza los datos
 * y handlers del POS (App) vía props: catálogo, categorías, carrito y cobro.
 */
import { useMemo, useRef, useState } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, X } from 'lucide-react';
import type { PosProduct, CartItem } from '../types/domain';
import { shouldShowImage, markImageFailed } from '../utils/imageCache';

interface KioskViewProps {
  products: PosProduct[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (c: string) => void;
  searchTerm: string;
  onSearch: (s: string) => void;
  cart: CartItem[];
  totals: { subtotal: number; tax: number; total: number };
  itemCount: number;
  onProductClick: (p: PosProduct) => void;
  onChangeQty: (itemId: string, qty: number, weight?: number) => void;
  onRemove: (itemId: string) => void;
  onCheckout: () => void;
}

const MS_30_DAYS = 30 * 24 * 60 * 60 * 1000;

function isNewProduct(p: PosProduct): boolean {
  const c = (p as unknown as { createdAt?: string }).createdAt;
  if (!c) return false;
  const t = new Date(c).getTime();
  return Number.isFinite(t) && Date.now() - t < MS_30_DAYS;
}

function firstLetter(name: string): string {
  const ch = (name || '').trim().charAt(0).toUpperCase();
  return /[A-Z0-9Ñ]/.test(ch) ? ch : '#';
}

export default function KioskView({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  searchTerm,
  onSearch,
  cart,
  totals,
  itemCount,
  onProductClick,
  onChangeQty,
  onRemove,
  onCheckout,
}: KioskViewProps) {
  const [orderOpen, setOrderOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Letras disponibles según los productos visibles (para el índice lateral A–Z).
  const letters = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) set.add(firstLetter(p.name));
    return Array.from(set).sort();
  }, [products]);

  const scrollToLetter = (letter: string) => {
    const grid = gridRef.current;
    if (!grid) return;
    const idx = products.findIndex((p) => firstLetter(p.name) === letter);
    if (idx < 0) return;
    const card = grid.querySelectorAll('.kioskv-card')[idx] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="kioskv">
      <header className="kioskv-header">
        <div className="kioskv-search">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar productos por nombre o escanear código"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <h1 className="kioskv-title">Todos los productos</h1>
        <p className="kioskv-subtitle">Filtrar por categoría</p>
        <div className="kioskv-cats">
          {categories.map((c) => (
            <button
              key={c}
              className={`kioskv-cat ${selectedCategory === c ? 'active' : ''}`}
              onClick={() => onSelectCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      <div className="kioskv-body">
        <div className="kioskv-grid" ref={gridRef}>
          {products.length === 0 ? (
            <div className="kioskv-empty">No hay productos en esta categoría.</div>
          ) : (
            products.map((p) => (
              <button
                key={p.id}
                className="kioskv-card"
                onClick={() => onProductClick(p)}
                title={p.name}
              >
                <div className="kioskv-card-img">
                  {isNewProduct(p) && <span className="kioskv-badge">¡Nuevo!</span>}
                  {shouldShowImage(p.image) ? (
                    <img
                      src={p.image!}
                      alt={p.name}
                      loading="lazy"
                      onError={() => markImageFailed(p.image)}
                    />
                  ) : (
                    <span className="kioskv-card-initial">{firstLetter(p.name)}</span>
                  )}
                </div>
                <div className="kioskv-card-name">{p.name}</div>
                <div className="kioskv-card-price">${p.price.toFixed(2)}</div>
              </button>
            ))
          )}
        </div>

        {letters.length > 1 && (
          <div className="kioskv-az">
            {letters.map((L) => (
              <button key={L} className="kioskv-az-letter" onClick={() => scrollToLetter(L)}>
                {L}
              </button>
            ))}
          </div>
        )}
      </div>

      <footer className="kioskv-footer">
        <div className="kioskv-total">
          <ShoppingCart size={22} />
          <span>${totals.total.toFixed(2)}</span>
        </div>
        <button
          className="kioskv-order-btn"
          onClick={() => setOrderOpen(true)}
          disabled={itemCount === 0}
        >
          Ver mi pedido
          {itemCount > 0 && <span className="kioskv-count">{itemCount}</span>}
        </button>
      </footer>

      {orderOpen && (
        <div className="kioskv-order-overlay" onClick={() => setOrderOpen(false)}>
          <div className="kioskv-order-panel" onClick={(e) => e.stopPropagation()}>
            <div className="kioskv-order-head">
              <h2>Mi pedido</h2>
              <button className="kioskv-order-close" onClick={() => setOrderOpen(false)}>
                <X size={22} />
              </button>
            </div>

            <div className="kioskv-order-items">
              {cart.length === 0 ? (
                <div className="kioskv-empty">Tu pedido está vacío.</div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="kioskv-order-item">
                    <div className="kioskv-order-item-info">
                      <div className="kioskv-order-item-name">{item.product.name}</div>
                      {item.variantDisplayName && (
                        <div className="kioskv-order-item-variant">{item.variantDisplayName}</div>
                      )}
                      <div className="kioskv-order-item-price">${item.unitPrice.toFixed(2)}</div>
                    </div>
                    <div className="kioskv-order-item-qty">
                      <button
                        onClick={() => onChangeQty(item.id, Math.max(1, item.quantity - 1))}
                        aria-label="Menos"
                      >
                        <Minus size={18} />
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => onChangeQty(item.id, item.quantity + 1)} aria-label="Más">
                        <Plus size={18} />
                      </button>
                      <button
                        className="kioskv-order-item-remove"
                        onClick={() => onRemove(item.id)}
                        aria-label="Quitar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="kioskv-order-item-total">${item.itemTotal.toFixed(2)}</div>
                  </div>
                ))
              )}
            </div>

            <div className="kioskv-order-summary">
              <div className="kioskv-order-row">
                <span>Subtotal</span>
                <span>${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="kioskv-order-row">
                <span>Impuesto</span>
                <span>${totals.tax.toFixed(2)}</span>
              </div>
              <div className="kioskv-order-row kioskv-order-row-total">
                <span>Total</span>
                <span>${totals.total.toFixed(2)}</span>
              </div>
              <button
                className="kioskv-pay-btn"
                disabled={cart.length === 0}
                onClick={() => {
                  setOrderOpen(false);
                  onCheckout();
                }}
              >
                Pagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
