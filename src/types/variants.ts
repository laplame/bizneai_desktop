/**
 * Tipos y utilidades para variantes y modificadores de productos (POS tipo cafetería)
 * Ver: Flujos del sistema POS - variaciones y modificadores
 */

export type VariantGroupType = 'size' | 'color' | 'model' | 'custom' | 'weight';

export interface ProductVariant {
  name: string;
  value: string;
  price?: number;
  priceModifier?: number;
  stock?: number;
  isDefault?: boolean;
  order?: number;
}

export interface VariantGroup {
  name: string;
  label: string;
  type: VariantGroupType;
  isPrimary?: boolean;
  order?: number;
  variants: ProductVariant[];
  /** Si true, permite seleccionar múltiples opciones (ej. extras) */
  allowMultiple?: boolean;
}

export interface ProductWithVariants {
  price: number;
  hasVariants?: boolean;
  variantGroups?: VariantGroup[];
  primaryVariantGroup?: string;
  isWeightBased?: boolean;
}

export type SelectedVariants = Record<string, string | string[]>;

/**
 * Calcula el precio final de un producto según variantes seleccionadas.
 * - Grupo principal: usa priceModifier o price según tipo
 * - Grupos secundarios: aplican factor 0.5 al precio (según RestaurantMenuPage)
 * - Productos por peso: usa variant.price directamente si está definido
 */
export function calculateProductPrice(
  product: ProductWithVariants,
  selectedVariants: SelectedVariants
): number {
  if (!product.hasVariants || !product.variantGroups?.length) {
    return product.price;
  }

  let finalPrice = product.price;
  const primaryGroupName = product.primaryVariantGroup || 
    product.variantGroups.find(g => g.isPrimary)?.name || 
    product.variantGroups[0]?.name;

  for (const group of product.variantGroups) {
    const selected = selectedVariants[group.name];
    if (!selected) continue;

    const variantsToProcess = Array.isArray(selected) ? selected : [selected];
    const isPrimary = group.name === primaryGroupName;

    for (const variantValue of variantsToProcess) {
      const variant = findVariant(group.variants, String(variantValue));
      if (!variant) continue;

      if (product.isWeightBased && variant.price != null) {
        finalPrice = variant.price;
      } else if (variant.price != null) {
        finalPrice = variant.price;
      } else if (variant.priceModifier != null) {
        const modifier = isPrimary ? variant.priceModifier : variant.priceModifier * 0.5;
        finalPrice += modifier;
      }
    }
  }

  return Math.max(0, finalPrice);
}

/** Busca variante por value o name (case-insensitive para mayor compatibilidad con API) */
function findVariant(variants: ProductVariant[], value: string): ProductVariant | undefined {
  const vLower = String(value).toLowerCase();
  return variants.find(
    vr =>
      String(vr.value).toLowerCase() === vLower ||
      String(vr.name).toLowerCase() === vLower ||
      vr.value === value ||
      vr.name === value
  );
}

/**
 * Genera el nombre descriptivo del producto con variantes (ej. "Café Latte (Grande, Leche almendras)")
 */
export function buildVariantDisplayName(
  productName: string,
  variantGroups: VariantGroup[],
  selectedVariants: SelectedVariants
): string {
  if (!variantGroups?.length) return productName;

  const parts: string[] = [];
  for (const group of variantGroups) {
    const selected = selectedVariants[group.name];
    if (selected == null || selected === '') continue;
    if (Array.isArray(selected) && selected.length === 0) continue;

    const values = Array.isArray(selected) ? selected : [selected];
    const names = values
      .map(v => {
        const variant = findVariant(group.variants, String(v));
        return variant?.name ?? variant?.value ?? String(v);
      })
      .filter(Boolean);
    if (names.length) {
      parts.push(names.join(', '));
    }
  }

  if (parts.length === 0) return productName;
  return `${productName} (${parts.join(' · ')})`;
}
