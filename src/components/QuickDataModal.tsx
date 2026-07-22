import { useEffect, useState } from 'react';
import { Zap, X, Loader2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getApiBaseUrl } from '../api/client';

interface Facet {
  value: string;
  count: number;
}

interface VerticalTemplate {
  storeType: string;
  labelEs: string;
  labelEn: string;
  modelShopId: string | null;
  totalProducts: number;
  categories: Facet[];
  brands: Facet[];
  collections: Facet[];
}

type CatalogSelector =
  | { type: 'all' }
  | { type: 'category'; value: string }
  | { type: 'collection'; value: string }
  | { type: 'brand'; value: string };

export interface QuickDataModalProps {
  open: boolean;
  onClose: () => void;
  shopId: string | null;
  storeType: string | null;
  /** Se llama tras una importación exitosa (parcial o total) para refrescar la lista local. */
  onImported: () => void;
}

export default function QuickDataModal({ open, onClose, shopId, storeType, onImported }: QuickDataModalProps) {
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<VerticalTemplate | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectAll, setSelectAll] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [brandSearch, setBrandSearch] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectAll(false);
    setSelectedCategories(new Set());
    setSelectedCollections(new Set());
    setSelectedBrands(new Set());
    setBrandSearch('');
    setTemplate(null);
    setLoadError(null);

    if (!storeType) {
      setLoadError('no-store-type');
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`${getApiBaseUrl()}/verticals/${encodeURIComponent(storeType)}/template`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setTemplate(data.data as VerticalTemplate);
        } else {
          setLoadError(data.error || 'error');
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, storeType]);

  if (!open) return null;

  const filteredBrands = template
    ? template.brands.filter((b) => b.value.toLowerCase().includes(brandSearch.trim().toLowerCase()))
    : [];

  const approxCount = (() => {
    if (!template) return 0;
    if (selectAll) return template.totalProducts;
    let sum = 0;
    for (const c of template.categories) if (selectedCategories.has(c.value)) sum += c.count;
    for (const c of template.collections) if (selectedCollections.has(c.value)) sum += c.count;
    for (const b of template.brands) if (selectedBrands.has(b.value)) sum += b.count;
    return sum;
  })();

  const hasSelection =
    selectAll || selectedCategories.size > 0 || selectedCollections.size > 0 || selectedBrands.size > 0;

  const toggleSelectAll = () => {
    setSelectAll((prev) => {
      const next = !prev;
      if (next) {
        setSelectedCategories(new Set());
        setSelectedCollections(new Set());
        setSelectedBrands(new Set());
      }
      return next;
    });
  };

  const toggleInSet = (set: Set<string>, setter: (s: Set<string>) => void, value: string) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setSelectAll(false);
    setter(next);
  };

  const handleConfirm = async () => {
    if (!shopId || !hasSelection) {
      toast.error('Selecciona al menos una categoría, colección o marca');
      return;
    }

    const selectors: CatalogSelector[] = selectAll
      ? [{ type: 'all' }]
      : [
          ...Array.from(selectedCategories).map((value): CatalogSelector => ({ type: 'category', value })),
          ...Array.from(selectedCollections).map((value): CatalogSelector => ({ type: 'collection', value })),
          ...Array.from(selectedBrands).map((value): CatalogSelector => ({ type: 'brand', value })),
        ];

    setImporting(true);
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Secuencial a propósito: categorías y colecciones suelen traslaparse
    // (mismo producto matchea una categoría Y una colección). En paralelo,
    // dos llamadas pueden chocar insertando el mismo producto base al
    // mismo tiempo (E11000 duplicate key) — ya lo vimos al construir la
    // versión web de este modal.
    for (const selector of selectors) {
      try {
        const res = await fetch(`${getApiBaseUrl()}/shop/${shopId}/catalog-import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selector, customizations: {} }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        created += data.data.created || 0;
        skipped += data.data.skippedExisting || 0;
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }

    setImporting(false);

    if (errors.length === 0) {
      toast.success(`Se agregaron ${created} productos nuevos (${skipped} ya los tenías)`);
      onImported();
      onClose();
    } else if (created > 0 || skipped > 0) {
      toast.error(`Se agregaron algunos productos, pero hubo errores: ${errors.join(', ')}`);
      onImported();
    } else {
      toast.error('No se pudieron agregar los productos');
    }
  };

  return (
    <div className="quick-data-overlay">
      <div className="quick-data-modal">
        <div className="quick-data-header">
          <div className="quick-data-title">
            <Zap size={20} />
            <h2>Obtener Datos Rápidos</h2>
          </div>
          <button type="button" className="close-btn" aria-label="Cerrar" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="quick-data-content">
          {loading ? (
            <div className="quick-data-empty">
              <Loader2 size={24} className="quick-data-spin" />
              <span>Cargando catálogo...</span>
            </div>
          ) : loadError || !template || !template.modelShopId || template.totalProducts === 0 ? (
            <div className="quick-data-empty">
              <span>
                {!storeType
                  ? 'Configura el tipo de tienda antes de usar Datos Rápidos.'
                  : 'Aún no hay catálogo modelo para este tipo de tienda.'}
              </span>
            </div>
          ) : (
            <>
              <p className="quick-data-subtitle">
                Catálogo modelo de {template.labelEs} · {template.totalProducts} productos disponibles
              </p>

              <label className={`quick-data-row quick-data-row-all ${selectAll ? 'checked' : ''}`}>
                <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
                <span>Todo el catálogo ({template.totalProducts})</span>
              </label>

              <fieldset disabled={selectAll} className="quick-data-fieldset">
                <div className="quick-data-section">
                  <h3>Categorías</h3>
                  <div className="quick-data-grid">
                    {template.categories.map((c) => (
                      <label key={c.value} className={`quick-data-row ${selectedCategories.has(c.value) ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selectedCategories.has(c.value)}
                          onChange={() => toggleInSet(selectedCategories, setSelectedCategories, c.value)}
                        />
                        <span>
                          {c.value} ({c.count})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {template.collections.length > 0 && (
                  <div className="quick-data-section">
                    <h3>Colecciones</h3>
                    <div className="quick-data-chips">
                      {template.collections.map((c) => (
                        <label key={c.value} className={`quick-data-chip ${selectedCollections.has(c.value) ? 'checked' : ''}`}>
                          <input
                            type="checkbox"
                            checked={selectedCollections.has(c.value)}
                            onChange={() => toggleInSet(selectedCollections, setSelectedCollections, c.value)}
                          />
                          <span>
                            {c.value} ({c.count})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {template.brands.length > 0 && (
                  <div className="quick-data-section">
                    <h3>Marcas</h3>
                    <div className="quick-data-search">
                      <Search size={14} />
                      <input
                        type="text"
                        placeholder="Buscar marca..."
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                      />
                    </div>
                    <div className="quick-data-grid quick-data-grid-scroll">
                      {filteredBrands.map((b) => (
                        <label key={b.value} className={`quick-data-row ${selectedBrands.has(b.value) ? 'checked' : ''}`}>
                          <input
                            type="checkbox"
                            checked={selectedBrands.has(b.value)}
                            onChange={() => toggleInSet(selectedBrands, setSelectedBrands, b.value)}
                          />
                          <span>
                            {b.value} ({b.count})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </fieldset>

              {hasSelection && (
                <div className="quick-data-count">~{approxCount} productos seleccionados</div>
              )}
            </>
          )}
        </div>

        <div className="quick-data-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={importing || loading || !template || !hasSelection}
            onClick={() => void handleConfirm()}
          >
            {importing ? <Loader2 size={18} className="quick-data-spin" /> : <Zap size={18} />}
            {importing ? 'Agregando...' : 'Agregar a mi inventario'}
          </button>
        </div>
      </div>
    </div>
  );
}
