import React, { useState, useEffect, useCallback } from 'react';
import { Truck, X, RefreshCw, HandCoins, TrendingUp, Calculator, ChevronLeft, ChevronRight } from 'lucide-react';
import { getShopId } from '../utils/shopIdHelper';
import {
  getConsignmentReport,
  type ConsignmentReportData,
  type ConsignmentSupplierRow,
  type ConsignmentProductRow,
} from '../api/consignment';

interface ConsignmentReportProps {
  isOpen: boolean;
  onClose: () => void;
}

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
];

const SORT_OPTIONS: Array<{ value: 'revenue' | 'storeProfit' | 'unitsSold' | 'supplierPayable'; label: string }> = [
  { value: 'revenue', label: 'Ventas' },
  { value: 'storeProfit', label: 'Ganancia tienda' },
  { value: 'supplierPayable', label: 'Por pagar proveedor' },
  { value: 'unitsSold', label: 'Unidades' },
];

const formatMoney = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const ConsignmentReport: React.FC<ConsignmentReportProps> = ({ isOpen, onClose }) => {
  const [period, setPeriod] = useState('30d');
  const [sortBy, setSortBy] = useState<'revenue' | 'storeProfit' | 'unitsSold' | 'supplierPayable'>('revenue');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ConsignmentReportData | null>(null);

  const shopId = getShopId();

  const fetchReport = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    const res = await getConsignmentReport(shopId, { period, sortBy, page, limit: 15 });
    if (res.success && res.data) {
      setReport(res.data);
    } else {
      setError(res.error || 'Error al cargar el reporte');
      setReport(null);
    }
    setLoading(false);
  }, [shopId, period, sortBy, page]);

  useEffect(() => {
    if (isOpen) {
      setPage(1);
    }
  }, [isOpen, period, sortBy]);

  useEffect(() => {
    if (isOpen) void fetchReport();
  }, [isOpen, fetchReport]);

  if (!isOpen) return null;

  const summary = report?.summary;
  const accounting = report?.accounting;
  const supplierBreakdown = report?.supplierBreakdown || [];
  const byProduct = report?.byProduct || [];
  const pagination = report?.pagination;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Truck size={20} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />
            Consignación
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Periodo</label>
              <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                {PERIOD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Ordenar por</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn-secondary" onClick={() => void fetchReport()} disabled={loading} style={{ alignSelf: 'flex-end' }}>
              <RefreshCw size={16} />
              Actualizar
            </button>
          </div>

          {!shopId ? (
            <div className="empty-state">
              <Truck size={48} style={{ opacity: 0.5 }} />
              <h3>Sin tienda configurada</h3>
              <p>Configura el ID de tienda en Ajustes para ver el reporte de consignación.</p>
            </div>
          ) : loading ? (
            <div className="empty-state">
              <RefreshCw size={32} className="spinner" />
              <p>Cargando reporte...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <p style={{ color: '#dc2626' }}>{error}</p>
            </div>
          ) : (
            <>
              {summary && (
                <div className="example-calculations" style={{ marginTop: '1rem' }}>
                  <div className="example-item">
                    <span>Ventas consignación:</span>
                    <strong>{formatMoney(summary.totalRevenue)}</strong>
                  </div>
                  <div className="example-item">
                    <span>
                      <TrendingUp size={14} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
                      Ganancia tienda:
                    </span>
                    <strong style={{ color: '#059669' }}>{formatMoney(summary.storeProfit)}</strong>
                  </div>
                  <div className="example-item">
                    <span>
                      <HandCoins size={14} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
                      Por pagar proveedor:
                    </span>
                    <strong style={{ color: '#b45309' }}>{formatMoney(summary.supplierPayable)}</strong>
                  </div>
                  <div className="example-item">
                    <span>Unidades vendidas:</span>
                    <strong>{summary.totalUnitsSold}</strong>
                  </div>
                  <div className="example-item">
                    <span>SKUs en consignación:</span>
                    <strong>{summary.consignmentProductCount}</strong>
                  </div>
                  <div className="example-item total">
                    <span>Margen ganancia:</span>
                    <strong>{summary.profitMarginPercent}%</strong>
                  </div>
                </div>
              )}

              {accounting && accounting.incomeStatement.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calculator size={16} />
                    Estado de resultados — consignación
                  </h4>
                  <div className="invoice-list">
                    {accounting.incomeStatement.map((row) => (
                      <div key={row.line} className="invoice-card">
                        <div className="invoice-body">
                          <div className="invoice-info">
                            <span>{row.line}</span>
                          </div>
                          <div
                            className="invoice-total"
                            style={{ color: row.type === 'profit' ? '#059669' : row.amount < 0 ? '#dc2626' : undefined }}
                          >
                            <strong>{formatMoney(row.amount)}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {supplierBreakdown.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4>Pasivo por proveedor</h4>
                  <SupplierTable rows={supplierBreakdown} />
                </div>
              )}

              <div style={{ marginTop: '1.5rem' }}>
                <h4>Detalle por producto</h4>
                {byProduct.length === 0 ? (
                  <div className="empty-state">
                    <p>Sin ventas de consignación en el periodo</p>
                  </div>
                ) : (
                  <ProductTable rows={byProduct} />
                )}
                {pagination && pagination.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                      Página {pagination.currentPage} de {pagination.totalPages} ({pagination.totalInReport} total)
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={!pagination.hasPrev}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={!pagination.hasNext}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function SupplierTable({ rows }: { rows: ConsignmentSupplierRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="products-table">
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>SKUs</th>
            <th>Ventas</th>
            <th>Por pagar</th>
            <th>Ganancia</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.supplier}>
              <td className="product-name">{row.supplier}</td>
              <td>{row.productCount}</td>
              <td>{formatMoney(row.revenue)}</td>
              <td style={{ color: '#b45309', fontWeight: 600 }}>{formatMoney(row.supplierPayable)}</td>
              <td style={{ color: '#059669', fontWeight: 600 }}>{formatMoney(row.storeProfit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductTable({ rows }: { rows: ConsignmentProductRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="products-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Proveedor</th>
            <th>Vendidos</th>
            <th>Ventas</th>
            <th>Por pagar</th>
            <th>Ganancia</th>
            <th>Margen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.productId}>
              <td>
                <div className="product-name">{row.productName}</div>
                <div className="product-description">
                  {row.category} · costo {formatMoney(row.consignmentUnitCost)}/u
                </div>
              </td>
              <td>{row.supplier}</td>
              <td>{row.unitsSold}</td>
              <td>{formatMoney(row.revenue)}</td>
              <td style={{ color: '#b45309', fontWeight: 600 }}>{formatMoney(row.supplierPayable)}</td>
              <td style={{ color: '#059669', fontWeight: 600 }}>{formatMoney(row.storeProfit)}</td>
              <td>{row.profitMarginPercent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ConsignmentReport;
