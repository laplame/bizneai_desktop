export type TaxCalculationMethod = 'exclusive' | 'inclusive';

export interface TaxSettings {
  taxRate: number;
  taxCalculationMethod: TaxCalculationMethod;
  taxInclusive: boolean;
}

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  taxRate: 16,
  taxCalculationMethod: 'exclusive',
  taxInclusive: false,
};

/** True si los precios de línea ya incluyen impuesto. */
export function pricesIncludeTax(settings: TaxSettings): boolean {
  return settings.taxInclusive || settings.taxCalculationMethod === 'inclusive';
}

export interface CartTaxBreakdown {
  subtotalExclTax: number;
  taxAmount: number;
  total: number;
}

/** Campos opcionales en el JSON del producto (API / MCP) para impuestos por artículo. */
export interface ProductTaxFields {
  /** Si true, el precio del artículo ya incluye impuesto (sobrescribe la regla de la tienda). */
  priceIncludesTax?: boolean;
  /** Si true, la línea no lleva impuesto (producto exento). */
  taxExempt?: boolean;
}

function lineTaxBreakdown(
  lineTotal: number,
  settings: TaxSettings,
  product?: ProductTaxFields
): CartTaxBreakdown {
  const sum = Number(lineTotal) || 0;
  if (product?.taxExempt) {
    return { subtotalExclTax: sum, taxAmount: 0, total: sum };
  }
  const rate = settings.taxRate / 100;
  if (rate <= 0 || !Number.isFinite(sum)) {
    return { subtotalExclTax: sum, taxAmount: 0, total: sum };
  }
  const inclusive =
    product?.priceIncludesTax !== undefined
      ? product.priceIncludesTax
      : pricesIncludeTax(settings);
  if (inclusive) {
    const subtotalExclTax = sum / (1 + rate);
    const taxAmount = sum - subtotalExclTax;
    return { subtotalExclTax, taxAmount, total: sum };
  }
  const taxAmount = sum * rate;
  return { subtotalExclTax: sum, taxAmount, total: sum + taxAmount };
}

/** Suma impuestos por línea respetando `priceIncludesTax` / `taxExempt` de cada producto. */
export function computeCartTaxBreakdownFromCartItems(
  items: Array<{ itemTotal: number; product: ProductTaxFields }>,
  settings: TaxSettings
): CartTaxBreakdown {
  let subtotalExclTax = 0;
  let taxAmount = 0;
  let total = 0;
  for (const row of items) {
    const b = lineTaxBreakdown(row.itemTotal, settings, row.product);
    subtotalExclTax += b.subtotalExclTax;
    taxAmount += b.taxAmount;
    total += b.total;
  }
  return { subtotalExclTax, taxAmount, total };
}

export function loadTaxSettings(): TaxSettings {
  try {
    const raw = localStorage.getItem('bizneai-store-config');
    if (raw) {
      const c = JSON.parse(raw) as Partial<TaxSettings>;
      if (typeof c.taxRate === 'number' && !Number.isNaN(c.taxRate)) {
        return {
          taxRate: c.taxRate,
          taxCalculationMethod:
            c.taxCalculationMethod === 'inclusive' ? 'inclusive' : 'exclusive',
          taxInclusive: !!c.taxInclusive,
        };
      }
    }
  } catch {
    /* ignore */
  }
  const legacy = localStorage.getItem('bizneai-tax-rate');
  if (legacy != null) {
    const r = parseFloat(legacy);
    if (!Number.isNaN(r)) {
      return { ...DEFAULT_TAX_SETTINGS, taxRate: r };
    }
  }
  return { ...DEFAULT_TAX_SETTINGS };
}

/** Un solo total de líneas sin flags por producto: usa solo la regla de la tienda. */
export function computeCartTaxBreakdown(
  lineItemsSum: number,
  settings: TaxSettings
): CartTaxBreakdown {
  return computeCartTaxBreakdownFromCartItems(
    [{ itemTotal: lineItemsSum, product: {} }],
    settings
  );
}
