/**
 * Componentes de producto (BOM / receta / insumos) desde MCP o metadata local.
 */

export interface ProductComponentRow {
  name: string;
  quantity?: number;
  unit?: string;
}

function normalizeComponentItem(item: unknown): ProductComponentRow | null {
  if (typeof item === 'string' && item.trim()) {
    return { name: item.trim() };
  }
  if (item && typeof item === 'object') {
    const o = item as Record<string, unknown>;
    const name = String(o.name ?? o.ingredient ?? o.title ?? o.label ?? '').trim();
    if (!name) return null;
    const q = o.quantity;
    const quantity =
      typeof q === 'number' && Number.isFinite(q)
        ? q
        : q != null && String(q).trim() !== ''
          ? Number(q)
          : undefined;
    const unit = o.unit != null ? String(o.unit).trim() : undefined;
    return {
      name,
      ...(quantity != null && !Number.isNaN(quantity) ? { quantity } : {}),
      ...(unit ? { unit } : {}),
    };
  }
  return null;
}

export function parseProductComponents(source: unknown): ProductComponentRow[] {
  if (!source) return [];
  if (!Array.isArray(source)) return [];
  const out: ProductComponentRow[] = [];
  for (const item of source) {
    const row = normalizeComponentItem(item);
    if (row) out.push(row);
  }
  return out;
}

/** Extrae lista de componentes desde un producto MCP o fila local enriquecida. */
export function getComponentsFromProductRecord(p: Record<string, unknown>): ProductComponentRow[] {
  const direct = parseProductComponents(p.components);
  if (direct.length > 0) return direct;

  const meta =
    p.metadata && typeof p.metadata === 'object' ? (p.metadata as Record<string, unknown>) : null;
  if (meta) {
    const m = parseProductComponents(meta.components ?? meta.ingredients ?? meta.bom);
    if (m.length > 0) return m;
  }

  const spec =
    p.specifications && typeof p.specifications === 'object'
      ? (p.specifications as Record<string, unknown>)
      : null;
  if (spec) {
    const s = parseProductComponents(spec.components ?? spec.ingredients);
    if (s.length > 0) return s;
  }

  return [];
}
