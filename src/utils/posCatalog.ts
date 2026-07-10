/**
 * POS catalog hydration & sample data.
 *
 * Extracted verbatim from App.tsx (which was ~2,970 lines) to shrink that file
 * and isolate a cohesive, side-effect-free concern: turning raw API/MCP product
 * rows into the `PosProduct` shape the sales screen expects, applying known
 * variant templates, and the built-in demo catalog used before a store is synced.
 *
 * These are pure module-scope helpers — they do not touch React state.
 */
import type { PosProduct as Product } from '../types/domain';
import { normalizeProductId } from './productId';

export const sampleProducts: Product[] = [
  { id: 1, name: 'Café Americano', price: 2.50, category: 'Bebidas', stock: 50, barcode: '1234567890123' },
  {
    id: 2,
    name: 'Café Latte',
    price: 4.00,
    category: 'Bebidas',
    stock: 45,
    barcode: '1234567890124',
    hasVariants: true,
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
          { name: 'Grande', value: 'L', priceModifier: 1.0, order: 2 }
        ]
      },
      {
        name: 'Milk',
        label: 'Tipo de leche',
        type: 'custom',
        order: 1,
        variants: [
          { name: 'Normal', value: 'normal', priceModifier: 0, isDefault: true, order: 0 },
          { name: 'Leche almendras', value: 'almond', priceModifier: 0.5, order: 1 },
          { name: 'Leche avena', value: 'oat', priceModifier: 0.5, order: 2 }
        ]
      },
      {
        name: 'Extras',
        label: 'Extras',
        type: 'custom',
        allowMultiple: true,
        order: 2,
        variants: [
          { name: 'Shot extra', value: 'extra_shot', priceModifier: 1.0, order: 0 },
          { name: 'Crema batida', value: 'whipped', priceModifier: 0.5, order: 1 }
        ]
      }
    ],
    primaryVariantGroup: 'Size'
  },
  { id: 3, name: 'Cappuccino', price: 3.00, category: 'Bebidas', stock: 40, barcode: '1234567890125' },
  { id: 4, name: 'Croissant', price: 2.00, category: 'Panadería', stock: 30, barcode: '1234567890126' },
  { id: 5, name: 'Muffin de Chocolate', price: 2.50, category: 'Panadería', stock: 25, barcode: '1234567890127' },
  { id: 6, name: 'Sándwich de Pollo', price: 5.50, category: 'Comida', stock: 20, barcode: '1234567890128' },
  { id: 7, name: 'Ensalada César', price: 6.00, category: 'Comida', stock: 15, barcode: '1234567890129' },
  { id: 8, name: 'Pizza Margherita', price: 8.50, category: 'Comida', stock: 10, barcode: '1234567890130' },
  { id: 9, name: 'Agua Mineral', price: 1.50, category: 'Bebidas', stock: 100, barcode: '1234567890131' },
  { id: 10, name: 'Jugo de Naranja', price: 2.00, category: 'Bebidas', stock: 35, barcode: '1234567890132' },
  { id: 11, name: 'Tarta de Manzana', price: 3.50, category: 'Postres', stock: 20, barcode: '1234567890133' },
  { id: 12, name: 'Helado de Vainilla', price: 2.50, category: 'Postres', stock: 30, barcode: '1234567890134' },
];

const CLOUDINARY_PRODUCTS_BASE_URL = 'https://res.cloudinary.com/pin-pos/image/upload';
const IMAGE_FILENAME_REGEX = /^(images-\d{13}-[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp|gif))$/i;

const getApiOriginFromConfig = (): string => {
  try {
    const serverConfigRaw = localStorage.getItem('bizneai-server-config');
    if (!serverConfigRaw) return 'https://www.bizneai.com';

    const serverConfig = JSON.parse(serverConfigRaw);
    if (serverConfig?.mcpUrl) return new URL(serverConfig.mcpUrl).origin;
    if (serverConfig?.serverUrl) return new URL(serverConfig.serverUrl).origin;
  } catch {
    // Use default origin
  }

  return 'https://www.bizneai.com';
};

const normalizeProductImageUrl = (value?: string): string => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const filename = trimmed.split('?')[0].split('#')[0].split('/').pop() || trimmed;
  if (IMAGE_FILENAME_REGEX.test(filename)) {
    const millisMatch = filename.match(/^images-(\d{13})-/i);
    if (millisMatch) {
      const version = millisMatch[1].slice(0, 10);
      return `${CLOUDINARY_PRODUCTS_BASE_URL}/v${version}/products/${filename}`;
    }
  }

  if (trimmed.startsWith('/')) {
    return `${getApiOriginFromConfig()}${trimmed}`;
  }

  return trimmed;
};

// Plantillas de variantes para productos conocidos (cafetería). Se aplican al cargar si el producto no tiene variantGroups.
const VARIANT_TEMPLATES: Record<string, Partial<Product>> = {
  'café latte': {
    hasVariants: true,
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
          { name: 'Grande', value: 'L', priceModifier: 1.0, order: 2 }
        ]
      },
      {
        name: 'Milk',
        label: 'Tipo de leche',
        type: 'custom',
        order: 1,
        variants: [
          { name: 'Normal', value: 'normal', priceModifier: 0, isDefault: true, order: 0 },
          { name: 'Leche almendras', value: 'almond', priceModifier: 0.5, order: 1 },
          { name: 'Leche avena', value: 'oat', priceModifier: 0.5, order: 2 }
        ]
      },
      {
        name: 'Extras',
        label: 'Extras',
        type: 'custom',
        allowMultiple: true,
        order: 2,
        variants: [
          { name: 'Shot extra', value: 'extra_shot', priceModifier: 1.0, order: 0 },
          { name: 'Crema batida', value: 'whipped', priceModifier: 0.5, order: 1 }
        ]
      }
    ],
    primaryVariantGroup: 'Size'
  },
  'cappuccino': {
    hasVariants: true,
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
          { name: 'Grande', value: 'L', priceModifier: 1.0, order: 2 }
        ]
      }
    ],
    primaryVariantGroup: 'Size'
  },
  'café americano': {
    hasVariants: true,
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
          { name: 'Grande', value: 'L', priceModifier: 1.0, order: 2 }
        ]
      }
    ],
    primaryVariantGroup: 'Size'
  },
  'smoothie': {
    hasVariants: true,
    variantGroups: [
      {
        name: 'Size',
        label: 'Tamaño',
        type: 'size',
        isPrimary: true,
        order: 0,
        variants: [
          { name: 'Chico', value: 'S', priceModifier: -5, isDefault: true, order: 0 },
          { name: 'Mediano', value: 'M', priceModifier: 0, order: 1 },
          { name: 'Grande', value: 'L', priceModifier: 5, order: 2 }
        ]
      }
    ],
    primaryVariantGroup: 'Size'
  }
};

/** Fila API MCP para variantes (shape flexible) */
type ApiVariantRow = Record<string, unknown>;
type ApiProductRow = Record<string, unknown>;

/** Normaliza variantGroups de API (p. ej. "options" -> "variants", nombres de variante) */
const normalizeVariantGroups = (groups: unknown): ApiVariantRow[] => {
  if (!Array.isArray(groups)) return [];
  return groups.map((g) => {
    const row = (g && typeof g === 'object' ? g : {}) as ApiVariantRow;
    const rawV = row.variants ?? row.options;
    const variants = Array.isArray(rawV) ? rawV : [];
    return {
      ...row,
      name: row.name ?? row.id ?? '',
      label: row.label ?? row.name ?? '',
      variants: variants.map((v) => {
        const vr = (v && typeof v === 'object' ? v : {}) as ApiVariantRow;
        return {
          name: vr.name ?? vr.label ?? vr.optionName ?? vr.value ?? '',
          value: String(vr.value ?? vr.name ?? vr.id ?? ''),
          price: vr.price,
          priceModifier: vr.priceModifier,
          stock: vr.stock,
          isDefault: vr.isDefault ?? vr.default ?? false,
          order: vr.order ?? 0,
        };
      }),
    };
  });
};

const applyVariantTemplates = (product: ApiProductRow): ApiProductRow => {
  const vg = product.variantGroups;
  if (Array.isArray(vg) && vg.length > 0) {
    return {
      ...product,
      variantGroups: normalizeVariantGroups(vg),
      hasVariants: true,
      primaryVariantGroup:
        (product.primaryVariantGroup as string | undefined) ??
        (typeof (vg[0] as ApiVariantRow)?.name === 'string' ? (vg[0] as ApiVariantRow).name : undefined),
    };
  }
  const name = String(product.name || '')
    .toLowerCase()
    .trim();
  const template = VARIANT_TEMPLATES[name];
  if (!template) return product;
  return { ...product, ...template };
};

export const hydrateProductsForPos = (productsList: unknown[]): Product[] => {
  const list = Array.isArray(productsList) ? productsList : [];
  return list.map((product: unknown, index: number) => {
    const withVariants = applyVariantTemplates(
      (product && typeof product === 'object' ? product : {}) as ApiProductRow
    );
    const meta =
      withVariants.imageMetadata && typeof withVariants.imageMetadata === 'object'
        ? (withVariants.imageMetadata as Record<string, unknown>)
        : {};
    const cy = meta.cloudinaryUrls;
    const lu = meta.localUrls;
    const imgs = withVariants.images;
    const imageCandidate =
      withVariants.image ||
      (Array.isArray(imgs) ? imgs[0] : undefined) ||
      (Array.isArray(cy) ? cy[0] : undefined) ||
      (Array.isArray(lu) ? lu[0] : undefined) ||
      '';

    return {
      ...withVariants,
      id: normalizeProductId(withVariants?.id, index),
      image: normalizeProductImageUrl(
        typeof imageCandidate === 'string' ? imageCandidate : String(imageCandidate ?? '')
      ),
      hasVariants: Boolean(withVariants?.hasVariants),
      variantGroups: withVariants?.variantGroups,
      primaryVariantGroup: withVariants?.primaryVariantGroup,
    } as Product;
  });
};

export const looksLikeSampleCatalog = (productsList: Product[]): boolean => {
  if (!productsList || productsList.length === 0) return false;
  const sampleNames = new Set(sampleProducts.map((p) => p.name));
  const matches = productsList.filter((p) => sampleNames.has(p.name)).length;
  const threshold = Math.min(3, sampleProducts.length);
  return matches >= threshold;
};

export const getConfiguredMcpUrl = (): string => {
  try {
    const serverConfigRaw = localStorage.getItem('bizneai-server-config');
    if (!serverConfigRaw) return '';
    const serverConfig = JSON.parse(serverConfigRaw);
    return serverConfig?.mcpUrl || '';
  } catch {
    return '';
  }
};
