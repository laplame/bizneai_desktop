/**
 * Panel OLAP de ventas (desktop) — GET /api/:shopId/sales/stats/olap
 */
import { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  CreditCard,
  DollarSign,
  Loader2,
  Package,
  RefreshCw,
  ShoppingCart,
} from 'lucide-react';
import { getSalesOlapStats, type SalesOlapResult } from '../api/sales';
import { getShopId } from '../utils/shopIdHelper';

type OlapCell = SalesOlapResult['cells'][number];

function periodToDates(dateRange: string): { dateFrom: string; dateTo: string } {
  const dateTo = new Date().toISOString().split('T')[0];
  const from = new Date();
  const days = parseInt(dateRange.replace('d', ''), 10);
  from.setDate(from.getDate() - (Number.isFinite(days) ? days : 7));
  return { dateFrom: from.toISOString().split('T')[0], dateTo };
}

function money(n: number | undefined): string {
  return `$${(n || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`;
}

interface Props {
  dateRange?: string;
}

export default function SalesOlapReportPanel({ dateRange = '7d' }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [byTime, setByTime] = useState<OlapCell[]>([]);
  const [byPayment, setByPayment] = useState<OlapCell[]>([]);
  const [byProduct, setByProduct] = useState<OlapCell[]>([]);

  const load = useCallback(async () => {
    const shopId = getShopId();
    if (!shopId) {
      setError('Configura el shopId en Ajustes');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { dateFrom, dateTo } = periodToDates(dateRange);
      const base = { shopId, dateFrom, dateTo, status: 'active' };

      const [timeRes, payRes, prodRes] = await Promise.all([
        getSalesOlapStats({ ...base, grain: 'day', dimensions: 'time', limit: 60 }),
        getSalesOlapStats({ ...base, dimensions: 'paymentMethod', limit: 20 }),
        getSalesOlapStats({
          ...base,
          dimensions: 'product',
          measures: 'saleCount,revenue,itemsCount',
          limit: 10,
        }),
      ]);

      if (!timeRes.success || !timeRes.data) throw new Error(timeRes.error || 'OLAP tiempo');
      if (!payRes.success || !payRes.data) throw new Error(payRes.error || 'OLAP pagos');
      if (!prodRes.success || !prodRes.data) throw new Error(prodRes.error || 'OLAP productos');

      setTotals(timeRes.data.totals || {});
      setByTime(timeRes.data.cells || []);
      setByPayment(payRes.data.cells || []);
      setByProduct(prodRes.data.cells || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error OLAP');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxDay = Math.max(1, ...byTime.map((c) => c.metrics.saleCount || 0));

  if (loading && !totals.saleCount) {
    return (
      <div className="sales-olap-loading">
        <Loader2 className="spin" size={28} />
        <p>Cargando cubo OLAP…</p>
      </div>
    );
  }

  return (
    <div className="sales-olap-panel">
      <div className="sales-olap-toolbar">
        <div>
          <h3>
            <BarChart3 size={18} /> Ventas OLAP
          </h3>
          <p>Servidor · ShopTransaction · últimos {dateRange.replace('d', ' días')}</p>
        </div>
        <button type="button" className="action-btn" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : undefined} />
          Actualizar
        </button>
      </div>

      {error && <div className="sales-olap-error">{error}</div>}

      <div className="sales-olap-kpis">
        <div className="sales-olap-kpi">
          <ShoppingCart size={16} />
          <strong>{totals.saleCount || 0}</strong>
          <span>Ventas</span>
        </div>
        <div className="sales-olap-kpi highlight">
          <DollarSign size={16} />
          <strong>{money(totals.revenue)}</strong>
          <span>Ingresos</span>
        </div>
        <div className="sales-olap-kpi">
          <BarChart3 size={16} />
          <strong>{money(totals.avgTicket)}</strong>
          <span>Ticket prom.</span>
        </div>
        <div className="sales-olap-kpi">
          <Package size={16} />
          <strong>{totals.itemsCount || 0}</strong>
          <span>Ítems</span>
        </div>
      </div>

      {byTime.length > 0 && (
        <section className="sales-olap-section">
          <h4>Por día</h4>
          <ul className="sales-olap-bars">
            {byTime.map((cell) => {
              const day = String(cell.dimensions.time ?? '—');
              const n = cell.metrics.saleCount || 0;
              return (
                <li key={day}>
                  <span className="label">{day}</span>
                  <div className="track">
                    <div className="fill" style={{ width: `${(n / maxDay) * 100}%` }} />
                  </div>
                  <span className="meta">
                    {n} · {money(cell.metrics.revenue)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="sales-olap-grid">
        {byPayment.length > 0 && (
          <section className="sales-olap-section">
            <h4>
              <CreditCard size={14} /> Método de pago
            </h4>
            <table className="sales-olap-table">
              <thead>
                <tr>
                  <th>Método</th>
                  <th>Ventas</th>
                  <th>$</th>
                </tr>
              </thead>
              <tbody>
                {byPayment.map((cell) => {
                  const m = String(cell.dimensions.paymentMethod ?? '—');
                  return (
                    <tr key={m}>
                      <td>{m}</td>
                      <td>{cell.metrics.saleCount || 0}</td>
                      <td className="money">{money(cell.metrics.revenue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        {byProduct.length > 0 && (
          <section className="sales-olap-section">
            <h4>Top productos</h4>
            <table className="sales-olap-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Uds</th>
                  <th>$</th>
                </tr>
              </thead>
              <tbody>
                {[...byProduct]
                  .sort((a, b) => (b.metrics.revenue || 0) - (a.metrics.revenue || 0))
                  .map((cell) => {
                    const name = String(cell.dimensions.productName ?? 'Producto');
                    return (
                      <tr key={name}>
                        <td>{name}</td>
                        <td>{cell.metrics.itemsCount || cell.metrics.saleCount || 0}</td>
                        <td className="money">{money(cell.metrics.revenue)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}
