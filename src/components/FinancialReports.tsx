import React, { useState, useEffect, useCallback } from 'react';
import {
  Landmark,
  X,
  Plus,
  Trash2,
  Send,
  History,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Scale,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getShopId } from '../utils/shopIdHelper';
import { scheduleMirrorKeyToSqlite } from '../services/posPersistService';
import {
  sendFinancialReport,
  getFinancialReports,
  type FinancialReportEntry,
  type FinancialReportSections,
  type FinancialReportRecord,
  type PaymentScheduleItem,
} from '../api/financialReports';

interface FinancialReportsProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'bizneai-financial-report-sections';
const INVENTORY_ESTIMATE_KEY = 'bizneai-financial-report-inventory-estimate';

type SectionTab = 'assets' | 'liabilities' | 'accountsReceivable' | 'accountsPayable' | 'incomeStatement';

const SECTION_LABELS: Record<SectionTab, { title: string; hint: string; hasDueDate: boolean }> = {
  assets: { title: 'Activos', hint: 'Caja, bancos, equipo, propiedades…', hasDueDate: false },
  liabilities: { title: 'Pasivos', hint: 'Préstamos, deudas, obligaciones…', hasDueDate: false },
  accountsReceivable: { title: 'Cuentas por Cobrar', hint: 'Clientes que te deben', hasDueDate: true },
  accountsPayable: { title: 'Cuentas por Pagar', hint: 'Proveedores y obligaciones pendientes', hasDueDate: true },
  incomeStatement: { title: 'Estado de Resultados', hint: 'Ingresos y gastos del periodo', hasDueDate: false },
};

const EMPTY_SECTIONS: FinancialReportSections = {
  assets: [],
  liabilities: [],
  accountsPayable: [],
  accountsReceivable: [],
  incomeStatement: [],
  capital: [],
};

function loadSections(): FinancialReportSections {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...EMPTY_SECTIONS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...EMPTY_SECTIONS };
}

function saveSections(sections: FinancialReportSections): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  scheduleMirrorKeyToSqlite(STORAGE_KEY);
}

function sumEntries(entries: FinancialReportEntry[]): number {
  return entries.reduce((s, e) => s + (Number.isFinite(e.amount) ? e.amount : 0), 0);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const FinancialReports: React.FC<FinancialReportsProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<SectionTab | 'summary' | 'history'>('summary');
  const [sections, setSections] = useState<FinancialReportSections>(EMPTY_SECTIONS);
  const [inventoryEstimate, setInventoryEstimate] = useState<string>('0');
  const [isSending, setIsSending] = useState(false);

  const [history, setHistory] = useState<FinancialReportRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Formulario de nueva entrada (compartido entre las secciones tipo tabla)
  const [formConcept, setFormConcept] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(todayISO());
  const [formNotes, setFormNotes] = useState('');
  const [formDueDate, setFormDueDate] = useState('');

  const shopId = getShopId();

  useEffect(() => {
    if (isOpen) {
      setSections(loadSections());
      const savedEstimate = localStorage.getItem(INVENTORY_ESTIMATE_KEY);
      if (savedEstimate) setInventoryEstimate(savedEstimate);
      setTab('summary');
    }
  }, [isOpen]);

  const loadHistory = useCallback(async () => {
    if (!shopId) return;
    setIsLoadingHistory(true);
    const res = await getFinancialReports(shopId, { limit: 20 });
    if (res.success) {
      setHistory(res.reports || []);
    } else if (res.error) {
      console.warn('[FinancialReports] history:', res.error);
    }
    setIsLoadingHistory(false);
  }, [shopId]);

  useEffect(() => {
    if (isOpen && tab === 'history') {
      void loadHistory();
    }
  }, [isOpen, tab, loadHistory]);

  const resetForm = () => {
    setFormConcept('');
    setFormAmount('');
    setFormDate(todayISO());
    setFormNotes('');
    setFormDueDate('');
  };

  const handleAddEntry = (key: SectionTab) => {
    const amount = parseFloat(formAmount);
    if (!formConcept.trim() || !Number.isFinite(amount) || amount <= 0) {
      toast.error('Ingresa un concepto y un monto válido.');
      return;
    }
    if (SECTION_LABELS[key].hasDueDate && !formDueDate) {
      toast.error('Ingresa la fecha de vencimiento.');
      return;
    }
    const entry: FinancialReportEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      concept: formConcept.trim(),
      amount,
      date: formDate || todayISO(),
      notes: formNotes.trim() || undefined,
      ...(SECTION_LABELS[key].hasDueDate && formDueDate ? { dueDate: formDueDate } : {}),
    };
    const next = { ...sections, [key]: [entry, ...sections[key]] };
    setSections(next);
    saveSections(next);
    resetForm();
    toast.success('Entrada agregada');
  };

  const handleDeleteEntry = (key: SectionTab, id: string) => {
    const next = { ...sections, [key]: sections[key].filter((e) => e.id !== id) };
    setSections(next);
    saveSections(next);
  };

  const totalAssets = sumEntries(sections.assets);
  const totalLiabilities = sumEntries(sections.liabilities);
  const totalAccountsPayable = sumEntries(sections.accountsPayable);
  const totalAccountsReceivable = sumEntries(sections.accountsReceivable);
  const capital = totalAssets - totalLiabilities;

  const handleSendReport = async () => {
    if (!shopId) {
      toast.error('Configura el ID de tienda antes de enviar el reporte.');
      return;
    }
    setIsSending(true);
    const inventoryEstimateNum = parseFloat(inventoryEstimate) || 0;

    const paymentSchedule: PaymentScheduleItem[] = [
      ...sections.accountsPayable
        .filter((e) => e.dueDate)
        .map((e) => ({
          id: e.id,
          type: 'payable' as const,
          concept: e.concept,
          amount: e.amount,
          dueDate: e.dueDate as string,
          entryDate: e.date,
          notes: e.notes,
          daysUntilDue: Math.round(
            (new Date(e.dueDate as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ),
        })),
      ...sections.accountsReceivable
        .filter((e) => e.dueDate)
        .map((e) => ({
          id: e.id,
          type: 'receivable' as const,
          concept: e.concept,
          amount: e.amount,
          dueDate: e.dueDate as string,
          entryDate: e.date,
          notes: e.notes,
          daysUntilDue: Math.round(
            (new Date(e.dueDate as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ),
        })),
    ];

    const calculationFlow =
      `totalAssets = Σ(activos) = ${sections.assets.length} entradas → ${totalAssets.toFixed(2)}\n` +
      `totalLiabilities = Σ(pasivos) = ${sections.liabilities.length} entradas → ${totalLiabilities.toFixed(2)}\n` +
      `capital = totalAssets - totalLiabilities → ${capital.toFixed(2)}`;

    const res = await sendFinancialReport(shopId, {
      timestamp: new Date().toISOString(),
      sourceDeviceId: 'desktop',
      clientTimestampUnixMs: Date.now(),
      sections,
      calculations: {
        totalAssets,
        totalLiabilities,
        capital,
        inventoryEstimate: inventoryEstimateNum,
        totalAccountsPayable,
        totalAccountsReceivable,
        calculationFlow,
      },
      paymentSchedule,
    });
    setIsSending(false);
    if (res.success) {
      toast.success('Reporte financiero enviado al servidor');
    } else {
      toast.error(res.error || 'No se pudo enviar el reporte');
    }
  };

  if (!isOpen) return null;

  const renderSectionTab = (key: SectionTab) => {
    const meta = SECTION_LABELS[key];
    const entries = sections[key];
    return (
      <div>
        <p style={{ fontSize: '0.875rem', color: 'var(--bs-dark-text-muted, #64748b)', marginBottom: '1rem' }}>
          {meta.hint}
        </p>
        <div className="form-row">
          <div className="form-group">
            <label>Concepto *</label>
            <input type="text" value={formConcept} onChange={(e) => setFormConcept(e.target.value)} placeholder="Ej: Renta local" />
          </div>
          <div className="form-group">
            <label>Monto *</label>
            <input type="number" min="0" step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0.00" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Fecha</label>
            <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
          </div>
          {meta.hasDueDate && (
            <div className="form-group">
              <label>Vencimiento *</label>
              <input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
            </div>
          )}
        </div>
        <div className="form-group">
          <label>Notas</label>
          <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Opcional" />
        </div>
        <button className="btn-primary" onClick={() => handleAddEntry(key)}>
          <Plus size={18} />
          Agregar
        </button>

        <div className="invoice-list" style={{ marginTop: '1.5rem' }}>
          {entries.length === 0 ? (
            <div className="empty-state">
              <Scale size={40} style={{ opacity: 0.5 }} />
              <p>Sin entradas todavía</p>
            </div>
          ) : (
            entries.map((e) => (
              <div key={e.id} className="invoice-card">
                <div className="invoice-header">
                  <div>
                    <h4>{e.concept}</h4>
                    <span className="invoice-date">
                      {e.date}
                      {e.dueDate ? ` · vence ${e.dueDate}` : ''}
                    </span>
                  </div>
                  <button className="close-btn" onClick={() => handleDeleteEntry(key, e.id)} title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="invoice-body">
                  <div className="invoice-info">{e.notes && <span>{e.notes}</span>}</div>
                  <div className="invoice-total">
                    <strong>${e.amount.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Landmark size={20} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />
            Reportes Financieros
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="taxes-tabs">
          <button className={`taxes-tab ${tab === 'summary' ? 'active' : ''}`} onClick={() => setTab('summary')}>
            <Scale size={18} />
            Resumen
          </button>
          <button className={`taxes-tab ${tab === 'assets' ? 'active' : ''}`} onClick={() => setTab('assets')}>
            <TrendingUp size={18} />
            Activos
          </button>
          <button className={`taxes-tab ${tab === 'liabilities' ? 'active' : ''}`} onClick={() => setTab('liabilities')}>
            <TrendingDown size={18} />
            Pasivos
          </button>
          <button
            className={`taxes-tab ${tab === 'accountsReceivable' ? 'active' : ''}`}
            onClick={() => setTab('accountsReceivable')}
          >
            Por Cobrar
          </button>
          <button className={`taxes-tab ${tab === 'accountsPayable' ? 'active' : ''}`} onClick={() => setTab('accountsPayable')}>
            Por Pagar
          </button>
          <button
            className={`taxes-tab ${tab === 'incomeStatement' ? 'active' : ''}`}
            onClick={() => setTab('incomeStatement')}
          >
            Resultados
          </button>
          <button className={`taxes-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            <History size={18} />
            Historial
          </button>
        </div>

        <div className="modal-body">
          {tab === 'summary' && (
            <div className="taxes-section">
              <div className="tax-rate-card">
                <div className="tax-rate-display">
                  <h3>Capital (Activos − Pasivos)</h3>
                  <div className="tax-rate-value">
                    <Scale size={32} />
                    <span>${capital.toFixed(2)}</span>
                  </div>
                </div>
                <div className="example-calculations">
                  <div className="example-item">
                    <span>Total Activos:</span>
                    <strong>${totalAssets.toFixed(2)}</strong>
                  </div>
                  <div className="example-item">
                    <span>Total Pasivos:</span>
                    <strong>${totalLiabilities.toFixed(2)}</strong>
                  </div>
                  <div className="example-item">
                    <span>Por Cobrar:</span>
                    <strong>${totalAccountsReceivable.toFixed(2)}</strong>
                  </div>
                  <div className="example-item">
                    <span>Por Pagar:</span>
                    <strong>${totalAccountsPayable.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label>Estimado de inventario (manual)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={inventoryEstimate}
                  onChange={(e) => {
                    setInventoryEstimate(e.target.value);
                    localStorage.setItem(INVENTORY_ESTIMATE_KEY, e.target.value);
                  }}
                  placeholder="0.00"
                />
              </div>

              <button className="btn-primary" onClick={handleSendReport} disabled={isSending || !shopId} style={{ marginTop: '1rem' }}>
                <Send size={18} />
                {isSending ? 'Enviando...' : 'Enviar reporte al servidor'}
              </button>
              {!shopId && (
                <p style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '0.5rem' }}>
                  Configura el ID de tienda en Ajustes para poder enviar el reporte.
                </p>
              )}
            </div>
          )}

          {tab === 'assets' && renderSectionTab('assets')}
          {tab === 'liabilities' && renderSectionTab('liabilities')}
          {tab === 'accountsReceivable' && renderSectionTab('accountsReceivable')}
          {tab === 'accountsPayable' && renderSectionTab('accountsPayable')}
          {tab === 'incomeStatement' && renderSectionTab('incomeStatement')}

          {tab === 'history' && (
            <>
              {isLoadingHistory ? (
                <div className="empty-state">
                  <RefreshCw size={32} className="spinner" />
                  <p>Cargando historial...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="empty-state">
                  <History size={48} style={{ opacity: 0.5 }} />
                  <h3>Sin reportes enviados</h3>
                </div>
              ) : (
                <div className="invoice-list">
                  {history.map((r) => (
                    <div key={r.reportId} className="invoice-card">
                      <div className="invoice-header">
                        <div>
                          <h4>Reporte {new Date(r.createdAt || r.timestamp).toLocaleDateString('es-MX')}</h4>
                          <span className="invoice-date">{new Date(r.createdAt || r.timestamp).toLocaleString('es-MX')}</span>
                        </div>
                      </div>
                      <div className="invoice-body">
                        <div className="invoice-info">
                          <span>
                            <strong>Capital:</strong> ${r.reportsData?.calculations?.capital?.toFixed(2) ?? '—'}
                          </span>
                          <span>
                            <strong>Activos:</strong> ${r.reportsData?.calculations?.totalAssets?.toFixed(2) ?? '—'}
                          </span>
                          <span>
                            <strong>Pasivos:</strong> ${r.reportsData?.calculations?.totalLiabilities?.toFixed(2) ?? '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
