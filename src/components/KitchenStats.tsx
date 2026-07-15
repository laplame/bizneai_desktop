/**
 * Estadísticas de cocina (desktop) — alimentadas por GET /api/kitchen/stats/olap
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  RefreshCw,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import { kitchenAPI } from '../api/kitchen';
import { getShopId } from '../utils/shopIdHelper';

type Grain = 'hour' | 'day' | 'week' | 'month';

interface OlapCell {
  dimensions: Record<string, string | number | null>;
  metrics: Record<string, number>;
}

interface KitchenStatsProps {
  onBack?: () => void;
}

const MEASURES_CORE =
  'orderCount,avgPrep,avgActual,avgEstimated,onTimeRate,onTimeCount,lateCount,itemsCount';

function formatTime(minutes: number | null | undefined): string {
  if (minutes == null || Number.isNaN(minutes)) return '—';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}min`;
}

function perfTone(pct: number): string {
  if (pct >= 80) return 'good';
  if (pct >= 60) return 'mid';
  return 'bad';
}

export default function KitchenStats({ onBack }: KitchenStatsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [grain, setGrain] = useState<Grain>('day');

  const [totals, setTotals] = useState<Record<string, number>>({});
  const [byTime, setByTime] = useState<OlapCell[]>([]);
  const [byWaiter, setByWaiter] = useState<OlapCell[]>([]);
  const [byProduct, setByProduct] = useState<OlapCell[]>([]);
  const [truncated, setTruncated] = useState(false);

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
      const base = {
        shopId,
        dateFrom,
        dateTo,
        status: 'served',
        measures: MEASURES_CORE,
      };

      const [timeRes, waiterRes, productRes] = await Promise.all([
        kitchenAPI.getOlapStats({ ...base, grain, dimensions: 'time', limit: 200 }),
        kitchenAPI.getOlapStats({ ...base, dimensions: 'waiter', limit: 50 }),
        kitchenAPI.getOlapStats({
          ...base,
          dimensions: 'product',
          measures: 'orderCount,itemsCount,avgPrep,onTimeRate',
          limit: 100,
        }),
      ]);

      if (!timeRes.success || !timeRes.data) {
        throw new Error(timeRes.error || 'Error OLAP tiempo');
      }
      if (!waiterRes.success || !waiterRes.data) {
        throw new Error(waiterRes.error || 'Error OLAP meseros');
      }
      if (!productRes.success || !productRes.data) {
        throw new Error(productRes.error || 'Error OLAP productos');
      }

      setTotals(timeRes.data.totals || {});
      setByTime(timeRes.data.cells || []);
      setByWaiter(waiterRes.data.cells || []);
      setByProduct(productRes.data.cells || []);
      setTruncated(
        Boolean(
          timeRes.data.meta?.truncated ||
            waiterRes.data.meta?.truncated ||
            productRes.data.meta?.truncated
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, grain]);

  useEffect(() => {
    load();
  }, [load]);

  const maxTimeOrders = Math.max(1, ...byTime.map((c) => c.metrics.orderCount || 0));
  const onTimeRate = totals.onTimeRate ?? 0;

  return (
    <div className="kitchen-stats-panel">
      <div className="kitchen-stats-toolbar">
        <div className="kitchen-stats-toolbar-left">
          {onBack && (
            <button type="button" className="action-btn" onClick={onBack} title="Volver a cocina">
              <ArrowLeft size={18} />
              <span>Cocina</span>
            </button>
          )}
          <div className="kitchen-stats-title">
            <BarChart3 size={22} />
            <div>
              <h2>Estadísticas de cocina</h2>
              <p>OLAP operativo (sin $) · órdenes servidas</p>
            </div>
          </div>
        </div>
        <button type="button" className="action-btn" onClick={load} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : undefined} />
          <span>Actualizar</span>
        </button>
      </div>

      <div className="kitchen-stats-filters">
        <label>
          Desde
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        <label>
          Grain
          <select value={grain} onChange={(e) => setGrain(e.target.value as Grain)}>
            <option value="hour">Hora</option>
            <option value="day">Día</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </select>
        </label>
        <span className="kitchen-stats-filter-hint">
          <Filter size={14} /> status=served
        </span>
      </div>

      {error && <div className="kitchen-stats-error">{error}</div>}
      {truncated && (
        <div className="kitchen-stats-warn">Series truncadas — reduce el rango o el grain.</div>
      )}

      {loading ? (
        <div className="kitchen-stats-loading">
          <Loader2 className="spin" size={32} />
          <p>Cargando OLAP…</p>
        </div>
      ) : (
        <>
          <div className="kitchen-stats-kpis">
            <div className="kitchen-stats-kpi">
              <div className="kpi-head">
                <span>Órdenes</span>
                <UtensilsCrossed size={16} />
              </div>
              <strong>{totals.orderCount || 0}</strong>
              <small>{totals.itemsCount || 0} ítems</small>
            </div>
            <div className="kitchen-stats-kpi">
              <div className="kpi-head">
                <span>Tiempo real</span>
                <Clock size={16} />
              </div>
              <strong>{formatTime(totals.avgActual)}</strong>
              <small>Est. {formatTime(totals.avgEstimated)}</small>
            </div>
            <div className="kitchen-stats-kpi">
              <div className="kpi-head">
                <span>Prep.</span>
                <BarChart3 size={16} />
              </div>
              <strong>{formatTime(totals.avgPrep)}</strong>
              <small>preparing → ready</small>
            </div>
            <div className={`kitchen-stats-kpi tone-${perfTone(onTimeRate)}`}>
              <div className="kpi-head">
                <span>A tiempo</span>
                <CheckCircle2 size={16} />
              </div>
              <strong>{Math.round(onTimeRate * 10) / 10}%</strong>
              <small>
                {totals.onTimeCount || 0} ok · {totals.lateCount || 0} tarde
              </small>
            </div>
          </div>

          <section className="kitchen-stats-section">
            <h3>Por {grain === 'day' ? 'día' : grain}</h3>
            {byTime.length === 0 ? (
              <p className="kitchen-stats-empty">
                Sin órdenes servidas en el rango. Completa pedidos a “served” para poblar KitchenStats.
              </p>
            ) : (
              <ul className="kitchen-stats-bars">
                {byTime.map((cell) => {
                  const t = String(cell.dimensions.time ?? '—');
                  const orders = cell.metrics.orderCount || 0;
                  const pct = (orders / maxTimeOrders) * 100;
                  return (
                    <li key={t}>
                      <span className="bar-label">{t}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="bar-meta">
                        {orders} · {formatTime(cell.metrics.avgPrep)} ·{' '}
                        <em className={`tone-${perfTone(cell.metrics.onTimeRate || 0)}`}>
                          {Math.round(cell.metrics.onTimeRate || 0)}%
                        </em>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="kitchen-stats-section">
            <h3>
              <User size={16} /> Por mesero
            </h3>
            {byWaiter.length === 0 ? (
              <p className="kitchen-stats-empty">Sin datos por mesero.</p>
            ) : (
              <div className="kitchen-stats-table-wrap">
                <table className="kitchen-stats-table">
                  <thead>
                    <tr>
                      <th>Mesero</th>
                      <th>Órdenes</th>
                      <th>Avg prep</th>
                      <th>A tiempo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byWaiter.map((cell) => {
                      const name = String(cell.dimensions.waiter ?? 'N/A');
                      return (
                        <tr key={name}>
                          <td>{name}</td>
                          <td>{cell.metrics.orderCount || 0}</td>
                          <td>{formatTime(cell.metrics.avgPrep)}</td>
                          <td className={`tone-${perfTone(cell.metrics.onTimeRate || 0)}`}>
                            {Math.round(cell.metrics.onTimeRate || 0)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="kitchen-stats-section">
            <h3>
              <UtensilsCrossed size={16} /> Por platillo
            </h3>
            {byProduct.length === 0 ? (
              <p className="kitchen-stats-empty">Sin productos en el rango.</p>
            ) : (
              <div className="kitchen-stats-table-wrap">
                <table className="kitchen-stats-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Órdenes</th>
                      <th>Ítems</th>
                      <th>Avg prep</th>
                      <th>A tiempo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...byProduct]
                      .sort((a, b) => (b.metrics.orderCount || 0) - (a.metrics.orderCount || 0))
                      .map((cell) => {
                        const id = String(
                          cell.dimensions.productId ?? cell.dimensions.productName ?? ''
                        );
                        const name = String(cell.dimensions.productName ?? 'Producto');
                        return (
                          <tr key={id || name}>
                            <td>{name}</td>
                            <td>{cell.metrics.orderCount || 0}</td>
                            <td>{cell.metrics.itemsCount || 0}</td>
                            <td>{formatTime(cell.metrics.avgPrep)}</td>
                            <td className={`tone-${perfTone(cell.metrics.onTimeRate || 0)}`}>
                              {Math.round(cell.metrics.onTimeRate || 0)}%
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
