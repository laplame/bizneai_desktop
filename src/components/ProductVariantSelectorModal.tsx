import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Minus, Package } from 'lucide-react';
import type { VariantGroup, ProductVariant, SelectedVariants } from '../types/variants';
import { calculateProductPrice, buildVariantDisplayName } from '../types/variants';

export interface ProductForVariant {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  isWeightBased?: boolean;
  hasVariants?: boolean;
  variantGroups?: VariantGroup[];
  primaryVariantGroup?: string;
}

interface ProductVariantSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductForVariant | null;
  onAddToCart: (product: ProductForVariant, quantity: number, weight?: number, variants?: SelectedVariants, notes?: string) => void;
}

const ProductVariantSelectorModal: React.FC<ProductVariantSelectorModalProps> = ({
  isOpen,
  onClose,
  product,
  onAddToCart
}) => {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState<number>(0.5);
  const [selectedVariants, setSelectedVariants] = useState<SelectedVariants>({});
  const [notes, setNotes] = useState('');

  // Inicializar selecciones por defecto cuando cambia el producto
  useEffect(() => {
    if (!product?.variantGroups) return;

    const defaults: SelectedVariants = {};
    for (const group of product.variantGroups) {
      if (group.allowMultiple) {
        defaults[group.name] = [];
      } else {
        const defaultVariant = group.variants.find(v => v.isDefault) || group.variants[0];
        if (defaultVariant) defaults[group.name] = defaultVariant.value;
      }
    }
    setSelectedVariants(defaults);
    setQuantity(1);
    setWeight(0.5);
    setNotes('');
  }, [product]);

  if (!isOpen || !product) return null;

  const hasVariants = product.hasVariants && product.variantGroups?.length;
  const sortedGroups = [...(product.variantGroups || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const unitPrice = hasVariants
    ? calculateProductPrice(product, selectedVariants)
    : product.price;

  const variantDisplayName = hasVariants
    ? buildVariantDisplayName(product.name, product.variantGroups || [], selectedVariants)
    : product.name;

  const handleToggleVariant = (group: VariantGroup, variant: ProductVariant) => {
    if (group.allowMultiple) {
      setSelectedVariants(prev => {
        const current = (prev[group.name] as string[]) || [];
        const exists = current.includes(variant.value);
        const next = exists
          ? current.filter(v => v !== variant.value)
          : [...current, variant.value];
        return { ...prev, [group.name]: next };
      });
    } else {
      setSelectedVariants(prev => ({ ...prev, [group.name]: variant.value }));
    }
  };

  const handleAdd = () => {
    if (product.isWeightBased && (!weight || weight <= 0)) return;
    if (!product.isWeightBased && quantity < 1) return;

    onAddToCart(
      product,
      product.isWeightBased ? 1 : quantity,
      product.isWeightBased ? weight : undefined,
      hasVariants ? selectedVariants : undefined,
      notes.trim() || undefined
    );
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content variant-selector-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('variantModal.addToCart')}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="variant-modal-body">
          <div className="variant-product-info">
            {product.image ? (
              <img src={product.image} alt={product.name} className="variant-product-image" />
            ) : (
              <div className="variant-product-placeholder">
                <Package size={48} />
              </div>
            )}
            <div className="variant-product-details">
              <h4 className="variant-product-name">{product.name}</h4>
              <div className="variant-product-price-display">
                ${unitPrice.toFixed(2)}
                {product.isWeightBased && '/kg'}
              </div>
            </div>
          </div>

          {hasVariants && (
            <div className="variant-groups">
              {sortedGroups.map(group => (
                <div key={group.name} className="variant-group">
                  <label className="variant-group-label">{group.label}</label>
                  <div className="variant-options">
                    {[...group.variants].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(variant => {
                      const isSelected = group.allowMultiple
                        ? (selectedVariants[group.name] as string[])?.includes(variant.value)
                        : selectedVariants[group.name] === variant.value;
                      return (
                        <button
                          key={variant.value}
                          type="button"
                          className={`variant-option-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleVariant(group, variant)}
                        >
                          <span>{variant.name}</span>
                          {variant.priceModifier != null && variant.priceModifier !== 0 && (
                            <span className="variant-option-price">
                              {variant.priceModifier > 0 ? '+' : ''}${variant.priceModifier.toFixed(2)}
                            </span>
                          )}
                          {variant.price != null && variant.price !== unitPrice && (
                            <span className="variant-option-price">${variant.price.toFixed(2)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="variant-quantity-section">
            {product.isWeightBased ? (
              <>
                <label>{t('variantModal.quantityKg')}</label>
                <div className="quantity-controls">
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={() => setWeight(w => Math.max(0.1, w - 0.1))}
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={weight}
                    onChange={e => setWeight(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="quantity-input"
                  />
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={() => setWeight(w => w + 0.1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <label>{t('variantModal.quantity')}</label>
                <div className="quantity-controls">
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="quantity-input"
                  />
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={() => setQuantity(q => q + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="variant-notes-section">
            <label>{t('variantModal.notes')}</label>
            <textarea
              placeholder={t('variantModal.notesPlaceholder')}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="variant-notes-input"
            />
          </div>

          <div className="variant-total-summary">
            <span>{t('variantModal.total')}: </span>
            <strong>
              ${(unitPrice * (product.isWeightBased ? weight : quantity)).toFixed(2)}
            </strong>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t('variantModal.cancel')}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleAdd}
          >
            {t('variantModal.addToCart')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductVariantSelectorModal;
