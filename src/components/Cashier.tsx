import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, X, DollarSign, ArrowDownCircle, ArrowUpCircle, Lock, History, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getShopId } from '../utils/shopIdHelper';
import {
  openCashRegister,
  closeCashRegister,
  getCashRegisterStatus,
  addCashMovement,
  getCashRegisterSessions,
  type CashRegisterStatusData,
  type CashRegisterSessionData,
} from '../api/cashRegister';
import { getScreenLockIdentity } from '../services/rolesScreenLock';
import { enqueueOfflineWrite, getOfflineWriteQueueCount } from '../services/offlineWriteQueue';
import { scheduleMirrorKeyToSqlite } from '../services/posPersistService';
import { kitchenAPI } from '../api/kitchen';

interface CashierProps {
  isOpen: boolean;
  onClose: () => void;
}

const CASH_REGISTER_KINDS = ['cash-register-open', 'cash-register-close', 'cash-register-movement'] as const;
const SHADOW_KEY = 'bizneai-cash-register-shadow';

function pendingCashRegisterWrites(): number {
  return CASH_REGISTER_KINDS.reduce((sum, kind) => sum + getOfflineWriteQueueCount(kind), 0);
}

function readShadowStatus(): CashRegisterStatusData | null {
  try {
    const raw = localStorage.getItem(SHADOW_KEY);
    return raw ? (JSON.parse(raw) as CashRegisterStatusData) : null;
  } catch {
    return null;
  }
}

function writeShadowStatus(status: CashRegisterStatusData | null): void {
  if (status == null) {
    localStorage.removeItem(SHADOW_KEY);
  } else {
    localStorage.setItem(SHADOW_KEY, JSON.stringify(status));
  }
  scheduleMirrorKeyToSqlite(SHADOW_KEY);
}

const Cashier: React.FC<CashierProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'status' | 'history'>('status');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<CashRegisterStatusData | null>(null);
  const [sessions, setSessions] = useState<CashRegisterSessionData[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [openedBy, setOpenedBy] = useState('');
  const [openingAmount, setOpeningAmount] = useState('');
  const [openNotes, setOpenNotes] = useState('');
  const [isOpening, setIsOpening] = useState(false);

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closingAmount, setClosingAmount] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const [movementType, setMovementType] = useState<'cashIn' | 'cashOut'>('cashIn');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementNotes, setMovementNotes] = useState('');
  const [isAddingMovement, setIsAddingMovement] = useState(false);

  const shopId = getShopId();

  const loadStatus = useCallback(async () => {
    if (!shopId) return;
    // Mientras haya aperturas/movimientos/cierres sin sincronizar, el servidor
    // todavía no sabe de ellos — confiar en el estado local (shadow) en vez de
    // pisarlo con una respuesta del servidor que aún no los refleja.
    if (pendingCashRegisterWrites() > 0) {
      const shadow = readShadowStatus();
      if (shadow) {
        setStatus(shadow);
        return;
      }
    }
    setLoading(true);
    const res = await getCashRegisterStatus(shopId);
    if (res.success && res.data) {
      setStatus(res.data);
      writeShadowStatus(null);
    } else if (res.error) {
      console.warn('[Cashier] status:', res.error);
      const shadow = readShadowStatus();
      if (shadow) setStatus(shadow);
    }
    setLoading(false);
  }, [shopId]);

  const loadSessions = useCallback(async () => {
    if (!shopId) return;
    setLoadingSessions(true);
    const res = await getCashRegisterSessions(shopId, { limit: 30 });
    if (res.success && res.data) {
      setSessions(res.data.sessions);
    }
    setLoadingSessions(false);
  }, [shopId]);

  useEffect(() => {
    if (isOpen) {
      setTab('status');
      void loadStatus();
    }
  }, [isOpen, loadStatus]);

  useEffect(() => {
    if (isOpen && tab === 'history') {
      void loadSessions();
    }
  }, [isOpen, tab, loadSessions]);

  const handleOpen = async () => {
    if (!shopId) {
      toast.error('Configura el ID de tienda antes de abrir caja.');
      return;
    }
    const amount = parseFloat(openingAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error('Ingresa un monto inicial válido.');
      return;
    }
    setIsOpening(true);
    const identity = getScreenLockIdentity();
    const openParams = {
      openedBy: openedBy.trim() || identity?.name || undefined,
      openingAmount: amount,
      notes: openNotes.trim() || undefined,
    };
    const res = await openCashRegister(shopId, openParams);
    setIsOpening(false);
    if (res.success) {
      toast.success('Caja abierta');
      setOpenedBy('');
      setOpeningAmount('');
      setOpenNotes('');
      void loadStatus();
    } else if (res.retriable) {
      enqueueOfflineWrite('cash-register-open', { shopId, params: openParams });
      const shadow: CashRegisterStatusData = {
        hasActiveSession: true,
        openedAt: new Date().toISOString(),
        openedBy: openParams.openedBy,
        openingAmount: amount,
        balance: amount,
        status: 'open',
      };
      writeShadowStatus(shadow);
      setStatus(shadow);
      toast.success('Sin conexión: caja abierta localmente, se sincronizará al reconectar.');
      setOpenedBy('');
      setOpeningAmount('');
      setOpenNotes('');
    } else {
      toast.error(res.error || 'No se pudo abrir la caja');
    }
  };

  const handleClose = async () => {
    const amount = parseFloat(closingAmount);
    if (!shopId || !Number.isFinite(amount) || amount < 0) {
      toast.error('Ingresa un monto de cierre válido.');
      return;
    }
    setIsClosing(true);
    const identity = getScreenLockIdentity();
    const closeParams = {
      closingAmount: amount,
      closedBy: identity?.name || undefined,
      notes: closeNotes.trim() || undefined,
    };
    const res = await closeCashRegister(shopId, closeParams);
    setIsClosing(false);
    if (res.success && res.data) {
      const variance = res.data.variance ?? 0;
      toast.success(
        `Caja cerrada · esperado $${(res.data.expectedAmount ?? 0).toFixed(2)} · diferencia $${variance.toFixed(2)}`
      );
      // Al conciliar: ayer+ (todos los estados) + hoy solo entregados
      try {
        const past = await kitchenAPI.purgeOrders(shopId, 'beforeToday');
        const todayServed = await kitchenAPI.purgeOrders(shopId, 'servedToday');
        const deleted = (past?.data?.deleted ?? 0) + (todayServed?.data?.deleted ?? 0);
        if (deleted > 0) {
          localStorage.removeItem('bizneai-kitchen-orders');
          scheduleMirrorKeyToSqlite('bizneai-kitchen-orders');
          try {
            const day = new Intl.DateTimeFormat('en-CA', {
              timeZone: 'America/Mexico_City',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }).format(new Date());
            localStorage.setItem(`bizneai-kitchen-last-purge-date:${shopId}`, day);
          } catch {
            /* ignore */
          }
          toast.success(`Cocina: ${deleted} pedido(s) purgados (ayer todos + hoy entregados)`);
          window.dispatchEvent(new Event('kitchen-updated'));
        }
      } catch (e) {
        console.warn('Kitchen purge after cash close failed (non-fatal)', e);
      }
      setIsCloseModalOpen(false);
      setClosingAmount('');
      setCloseNotes('');
      void loadStatus();
    } else if (res.retriable) {
      enqueueOfflineWrite('cash-register-close', { shopId, params: closeParams });
      const expectedAmount = status?.balance ?? 0;
      const variance = amount - expectedAmount;
      writeShadowStatus({
        hasActiveSession: false,
        lastSession: { sessionId: status?.sessionId || 'pending', closedAt: new Date().toISOString(), closingAmount: amount },
      });
      setStatus({
        hasActiveSession: false,
        lastSession: { sessionId: status?.sessionId || 'pending', closedAt: new Date().toISOString(), closingAmount: amount },
      });
      toast.success(
        `Sin conexión: caja cerrada localmente · esperado $${expectedAmount.toFixed(2)} · diferencia $${variance.toFixed(2)} — se sincronizará al reconectar.`
      );
      setIsCloseModalOpen(false);
      setClosingAmount('');
      setCloseNotes('');
    } else {
      toast.error(res.error || 'No se pudo cerrar la caja');
    }
  };

  const handleAddMovement = async () => {
    const amount = parseFloat(movementAmount);
    if (!shopId || !Number.isFinite(amount) || amount <= 0) {
      toast.error('Ingresa un monto válido.');
      return;
    }
    setIsAddingMovement(true);
    const signedAmount = movementType === 'cashOut' ? -Math.abs(amount) : Math.abs(amount);
    const movementParams = { type: movementType, amount: signedAmount, notes: movementNotes.trim() || undefined };
    const res = await addCashMovement(shopId, movementParams);
    setIsAddingMovement(false);
    if (res.success) {
      toast.success(movementType === 'cashIn' ? 'Ingreso registrado' : 'Retiro registrado');
      setMovementAmount('');
      setMovementNotes('');
      void loadStatus();
    } else if (res.retriable) {
      enqueueOfflineWrite('cash-register-movement', { shopId, params: movementParams });
      const updatedStatus: CashRegisterStatusData = {
        ...(status || { hasActiveSession: true }),
        balance: (status?.balance ?? 0) + signedAmount,
      };
      writeShadowStatus(updatedStatus);
      setStatus(updatedStatus);
      toast.success('Sin conexión: movimiento guardado localmente, se sincronizará al reconectar.');
      setMovementAmount('');
      setMovementNotes('');
    } else {
      toast.error(res.error || 'No se pudo registrar el movimiento');
    }
  };

  if (!isOpen) return null;

  const hasActiveSession = Boolean(status?.hasActiveSession);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Wallet size={20} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />
            Caja
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="taxes-tabs">
          <button className={`taxes-tab ${tab === 'status' ? 'active' : ''}`} onClick={() => setTab('status')}>
            <DollarSign size={18} />
            Estado
          </button>
          <button className={`taxes-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            <History size={18} />
            Historial
          </button>
        </div>

        <div className="modal-body">
          {tab === 'status' && (
            <>
              {loading ? (
                <div className="empty-state">
                  <RefreshCw size={32} className="spinner" />
                  <p>Cargando estado de caja...</p>
                </div>
              ) : !shopId ? (
                <div className="empty-state">
                  <Lock size={48} style={{ opacity: 0.5 }} />
                  <h3>Sin tienda configurada</h3>
                  <p>Configura el ID de tienda en Ajustes para usar la caja.</p>
                </div>
              ) : hasActiveSession ? (
                <div>
                  <div className="tax-rate-card">
                    <div className="tax-rate-display">
                      <h3>Balance actual</h3>
                      <div className="tax-rate-value">
                        <DollarSign size={32} />
                        <span>${(status?.balance ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="example-calculations" style={{ marginTop: '1rem' }}>
                      <div className="example-item">
                        <span>Apertura:</span>
                        <strong>${(status?.openingAmount ?? 0).toFixed(2)}</strong>
                      </div>
                      {status?.openedBy && (
                        <div className="example-item">
                          <span>Cajero:</span>
                          <strong>{status.openedBy}</strong>
                        </div>
                      )}
                      {status?.openedAt && (
                        <div className="example-item">
                          <span>Abierta:</span>
                          <strong>{new Date(status.openedAt).toLocaleString('es-MX')}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-row" style={{ marginTop: '1.5rem' }}>
                    <div className="form-group">
                      <label>Tipo de movimiento</label>
                      <select
                        value={movementType}
                        onChange={(e) => setMovementType(e.target.value as 'cashIn' | 'cashOut')}
                      >
                        <option value="cashIn">Ingreso (Cash In)</option>
                        <option value="cashOut">Retiro (Cash Out)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Monto</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={movementAmount}
                        onChange={(e) => setMovementAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Notas</label>
                    <input
                      type="text"
                      value={movementNotes}
                      onChange={(e) => setMovementNotes(e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>
                  <button
                    className="btn-primary"
                    onClick={handleAddMovement}
                    disabled={isAddingMovement || !movementAmount}
                  >
                    {movementType === 'cashIn' ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
                    {isAddingMovement ? 'Registrando...' : movementType === 'cashIn' ? 'Registrar ingreso' : 'Registrar retiro'}
                  </button>

                  <button className="btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setIsCloseModalOpen(true)}>
                    <Lock size={18} />
                    Cerrar caja
                  </button>
                </div>
              ) : (
                <div>
                  {status?.lastSession && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--bs-dark-text-muted, #64748b)', marginBottom: '1rem' }}>
                      Última sesión cerrada el {new Date(status.lastSession.closedAt).toLocaleString('es-MX')} con $
                      {status.lastSession.closingAmount.toFixed(2)}.
                    </p>
                  )}
                  <div className="form-group">
                    <label>Cajero</label>
                    <input
                      type="text"
                      value={openedBy}
                      onChange={(e) => setOpenedBy(e.target.value)}
                      placeholder="Nombre (opcional)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Monto inicial *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={openingAmount}
                      onChange={(e) => setOpeningAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Notas</label>
                    <input
                      type="text"
                      value={openNotes}
                      onChange={(e) => setOpenNotes(e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>
                  <button className="btn-primary" onClick={handleOpen} disabled={isOpening || !openingAmount}>
                    <Wallet size={18} />
                    {isOpening ? 'Abriendo...' : 'Abrir caja'}
                  </button>
                </div>
              )}
            </>
          )}

          {tab === 'history' && (
            <>
              {loadingSessions ? (
                <div className="empty-state">
                  <RefreshCw size={32} className="spinner" />
                  <p>Cargando historial...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="empty-state">
                  <History size={48} style={{ opacity: 0.5 }} />
                  <h3>Sin sesiones registradas</h3>
                </div>
              ) : (
                <div className="invoice-list">
                  {sessions.map((s) => (
                    <div key={s.id} className="invoice-card">
                      <div className="invoice-header">
                        <div>
                          <h4>{s.status === 'open' ? 'Sesión abierta' : 'Sesión cerrada'}</h4>
                          <span className="invoice-date">{new Date(s.openedAt).toLocaleString('es-MX')}</span>
                        </div>
                        <span className="invoice-type">{s.status}</span>
                      </div>
                      <div className="invoice-body">
                        <div className="invoice-info">
                          <span>
                            <strong>Apertura:</strong> ${s.openingAmount.toFixed(2)}
                          </span>
                          {s.openedBy && (
                            <span>
                              <strong>Cajero:</strong> {s.openedBy}
                            </span>
                          )}
                          {s.closingAmount != null && (
                            <span>
                              <strong>Cierre:</strong> ${s.closingAmount.toFixed(2)}
                            </span>
                          )}
                          {s.variance != null && (
                            <span>
                              <strong>Diferencia:</strong> ${s.variance.toFixed(2)}
                            </span>
                          )}
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

      {isCloseModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCloseModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cerrar caja</h3>
              <button className="close-btn" onClick={() => setIsCloseModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Monto de cierre (conteo físico) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Notas</label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsCloseModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleClose} disabled={isClosing || !closingAmount}>
                {isClosing ? 'Cerrando...' : 'Confirmar cierre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cashier;
