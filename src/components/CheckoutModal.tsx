import { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Bitcoin,
  QrCode, 
  CheckCircle,
  X,
  Receipt,
  Link as LinkIcon,
  Percent
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onComplete: (paymentMethod: string, amount: number, change?: number) => void;
}

type PaymentMethod = 'cash' | 'card' | 'crypto' | 'codi' | 'mixed';

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    id: 'cash',
    name: 'Efectivo',
    icon: <DollarSign size={24} />,
    description: 'Pago en efectivo',
    color: '#059669'
  },
  {
    id: 'card',
    name: 'Tarjeta',
    icon: <CreditCard size={24} />,
    description: 'Tarjeta de crédito/débito',
    color: '#3b82f6'
  },
  {
    id: 'crypto',
    name: 'Crypto',
    icon: <Bitcoin size={24} />,
    description: 'Bitcoin, Ethereum, etc.',
    color: '#f59e0b'
  },
  {
    id: 'codi',
    name: 'CODI',
    icon: <QrCode size={24} />,
    description: 'Transferencia SPEI',
    color: '#8b5cf6'
  },
  {
    id: 'mixed',
    name: 'Paga con Link4deal',
    icon: <LinkIcon size={24} />,
    description: 'Pago mixto (Efectivo, Tarjeta, CODI, Cupón Crypto)',
    color: '#ec4899'
  }
];

const CheckoutModal = ({ isOpen, onClose, total, onComplete }: CheckoutModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [cashAmount, setCashAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [codiQr, setCodiQr] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'method' | 'payment' | 'success'>('method');
  
  // Estados para pago mixto
  const [mixedCashPercent, setMixedCashPercent] = useState<number>(0);
  const [mixedCardPercent, setMixedCardPercent] = useState<number>(0);
  const [mixedCodiPercent, setMixedCodiPercent] = useState<number>(0);
  const [mixedCryptoPercent, setMixedCryptoPercent] = useState<number>(0);
  const [mixedCashAmount, setMixedCashAmount] = useState('');
  const [mixedCardNumber, setMixedCardNumber] = useState('');
  const [mixedCardExpiry, setMixedCardExpiry] = useState('');
  const [mixedCardCvv, setMixedCardCvv] = useState('');
  const [mixedCryptoCoupon, setMixedCryptoCoupon] = useState('');

  const subtotal = total;
  const tax = total * 0.16;
  const finalTotal = subtotal + tax;
  const change = parseFloat(cashAmount) - finalTotal;

  const wasOpenRef = useRef(false);
  useEffect(() => {
    // Solo resetear cuando el modal pasa de cerrado a abierto, no en cada render
    if (isOpen && !wasOpenRef.current) {
      setStep('method');
      setSelectedMethod(null);
      setCashAmount('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setCryptoAddress('');
      setCodiQr('');
      setIsProcessing(false);
      // Reset mixed payment
      setMixedCashPercent(0);
      setMixedCardPercent(0);
      setMixedCodiPercent(0);
      setMixedCryptoPercent(0);
      setMixedCashAmount('');
      setMixedCardNumber('');
      setMixedCardExpiry('');
      setMixedCardCvv('');
      setMixedCryptoCoupon('');
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setStep('payment');
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simular procesamiento de pago
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setStep('success');
    
    // Simular cierre automático después de mostrar éxito
    setTimeout(() => {
      if (selectedMethod === 'mixed') {
        // Para pago mixto, pasar el total y los detalles
        onComplete('mixed', finalTotal, 0);
      } else {
        onComplete(selectedMethod!, finalTotal, change);
      }
      onClose();
    }, 2000);
  };

  // Calcular totales para pago mixto
  const mixedTotal = finalTotal;
  const mixedCashTotal = (mixedTotal * mixedCashPercent) / 100;
  const mixedCardTotal = (mixedTotal * mixedCardPercent) / 100;
  const mixedCodiTotal = (mixedTotal * mixedCodiPercent) / 100;
  const mixedCryptoTotal = (mixedTotal * mixedCryptoPercent) / 100;
  const mixedTotalPercent = mixedCashPercent + mixedCardPercent + mixedCodiPercent + mixedCryptoPercent;
  const mixedChange = parseFloat(mixedCashAmount) - mixedCashTotal;

  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case 'cash': {
        // Montos lógicos: exacto, redondear a billetes comunes (20, 50, 100, 500)
        const roundTo = (n: number, step: number) => Math.ceil(n / step) * step;
        const exactAmount = finalTotal;
        const amount20 = roundTo(finalTotal, 20);
        const amount50 = roundTo(finalTotal, 50);
        const amount100 = roundTo(finalTotal, 100);
        const amount500 = finalTotal <= 500 ? 500 : roundTo(finalTotal, 500);

        const quickAmounts = [
          { label: 'Pago exacto', value: exactAmount },
          ...(amount20 !== exactAmount ? [{ label: `$${amount20}`, value: amount20 }] : []),
          ...(amount50 !== amount20 && amount50 !== exactAmount ? [{ label: `$${amount50}`, value: amount50 }] : []),
          ...(amount100 !== amount50 && amount100 !== amount20 ? [{ label: `$${amount100}`, value: amount100 }] : []),
          ...(amount500 !== amount100 ? [{ label: `$${amount500}`, value: amount500 }] : [])
        ];

        return (
          <div className="payment-form">
            <h3>Pago en Efectivo</h3>
            <div className="amount-display">
              <div className="amount-row">
                <span>Total a pagar:</span>
                <span className="total-amount">${finalTotal.toFixed(2)}</span>
              </div>
            </div>
            <div className="input-group">
              <label>Monto recibido:</label>
              <div className="quick-amounts">
                {quickAmounts.map(({ label, value }) => (
                  <button
                    key={`${label}-${value}`}
                    type="button"
                    className={`quick-amount-btn ${Math.abs(parseFloat(cashAmount) - value) < 0.01 ? 'selected' : ''}`}
                    onClick={() => setCashAmount(value.toFixed(2))}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min={finalTotal}
              />
            </div>
            {parseFloat(cashAmount) >= finalTotal && (
              <div className="change-display">
                <span>Cambio:</span>
                <span className="change-amount">${change.toFixed(2)}</span>
              </div>
            )}
            <button
              className="payment-btn"
              onClick={handlePayment}
              disabled={parseFloat(cashAmount) < finalTotal || isProcessing}
            >
              {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
            </button>
          </div>
        );
      }

      case 'card':
        return (
          <div className="payment-form">
            <h3>Pago con Tarjeta</h3>
            <div className="amount-display">
              <span>Total: ${finalTotal.toFixed(2)}</span>
            </div>
            <div className="input-group">
              <label>Número de tarjeta:</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
            </div>
            <div className="card-row">
              <div className="input-group">
                <label>Vencimiento:</label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM/AA"
                  maxLength={5}
                />
              </div>
              <div className="input-group">
                <label>CVV:</label>
                <input
                  type="text"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>
            <button
              className="payment-btn"
              onClick={handlePayment}
              disabled={!cardNumber || !cardExpiry || !cardCvv || isProcessing}
            >
              {isProcessing ? 'Procesando...' : 'Procesar Pago'}
            </button>
          </div>
        );

      case 'crypto':
        return (
          <div className="payment-form">
            <h3>Pago con Crypto</h3>
            <div className="amount-display">
              <span>Total: ${finalTotal.toFixed(2)}</span>
              <small>≈ 0.000123 BTC</small>
            </div>
            <div className="crypto-options">
              <div className="crypto-option">
                <Bitcoin size={20} />
                <span>Bitcoin</span>
                <span className="crypto-amount">0.000123 BTC</span>
              </div>
              <div className="crypto-option">
                <div className="eth-icon">Ξ</div>
                <span>Ethereum</span>
                <span className="crypto-amount">0.0018 ETH</span>
              </div>
            </div>
            <div className="input-group">
              <label>Dirección de pago:</label>
              <input
                type="text"
                value={cryptoAddress}
                onChange={(e) => setCryptoAddress(e.target.value)}
                placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
              />
            </div>
            <div className="qr-code-placeholder">
              <QrCode size={80} />
              <p>Código QR para pago</p>
            </div>
            <button
              className="payment-btn"
              onClick={handlePayment}
              disabled={!cryptoAddress || isProcessing}
            >
              {isProcessing ? 'Verificando...' : 'Verificar Pago'}
            </button>
          </div>
        );

      case 'codi':
        return (
          <div className="payment-form">
            <h3>Pago con CODI (SPEI)</h3>
            <div className="amount-display">
              <span>Total: ${finalTotal.toFixed(2)}</span>
            </div>
            <div className="codi-info">
              <p>Escanea el código QR con tu app bancaria</p>
              <div className="qr-code-placeholder">
                <QrCode size={120} />
                <p>CODI QR</p>
              </div>
              <div className="codi-details">
                <div className="codi-row">
                  <span>Referencia:</span>
                  <span>CODI{Date.now()}</span>
                </div>
                <div className="codi-row">
                  <span>Banco:</span>
                  <span>Banco Ejemplo</span>
                </div>
                <div className="codi-row">
                  <span>Cuenta:</span>
                  <span>****1234</span>
                </div>
              </div>
            </div>
            <button
              className="payment-btn"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? 'Verificando...' : 'Verificar Pago'}
            </button>
          </div>
        );

      case 'mixed':
        return (
          <div className="payment-form">
            <div className="link4deal-header">
              <LinkIcon size={28} style={{ color: '#ec4899' }} />
              <h3>Paga con Link4deal</h3>
            </div>
            <div className="amount-display">
              <div className="amount-row">
                <span>Total a pagar:</span>
                <span className="total-amount">${mixedTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mixed-payment-section">
              <h4>Distribución del Pago (%)</h4>
              <div className="percent-summary" style={{ 
                marginBottom: '1rem',
                padding: '0.75rem',
                background: mixedTotalPercent === 100 ? '#d1fae5' : '#fee2e2',
                borderRadius: '8px',
                textAlign: 'center',
                fontWeight: 600,
                color: mixedTotalPercent === 100 ? '#059669' : '#dc2626'
              }}>
                Total: {mixedTotalPercent}% {mixedTotalPercent === 100 ? '✓' : '(Debe sumar 100%)'}
              </div>

              <div className="percent-inputs">
                <div className="input-group">
                  <label>
                    <DollarSign size={16} />
                    Efectivo (%)
                  </label>
                  <input
                    type="number"
                    value={mixedCashPercent}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                      setMixedCashPercent(val);
                    }}
                    min="0"
                    max="100"
                    step="1"
                  />
                  <span className="amount-preview">${mixedCashTotal.toFixed(2)}</span>
                </div>

                <div className="input-group">
                  <label>
                    <CreditCard size={16} />
                    Tarjeta (%)
                  </label>
                  <input
                    type="number"
                    value={mixedCardPercent}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                      setMixedCardPercent(val);
                    }}
                    min="0"
                    max="100"
                    step="1"
                  />
                  <span className="amount-preview">${mixedCardTotal.toFixed(2)}</span>
                </div>

                <div className="input-group">
                  <label>
                    <QrCode size={16} />
                    CODI (%)
                  </label>
                  <input
                    type="number"
                    value={mixedCodiPercent}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                      setMixedCodiPercent(val);
                    }}
                    min="0"
                    max="100"
                    step="1"
                  />
                  <span className="amount-preview">${mixedCodiTotal.toFixed(2)}</span>
                </div>

                <div className="input-group">
                  <label>
                    <Bitcoin size={16} />
                    Cupón Crypto (%)
                  </label>
                  <input
                    type="number"
                    value={mixedCryptoPercent}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                      setMixedCryptoPercent(val);
                    }}
                    min="0"
                    max="100"
                    step="1"
                  />
                  <span className="amount-preview">${mixedCryptoTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Campos de pago según porcentajes */}
            {mixedCashPercent > 0 && (() => {
              const roundTo = (n: number, step: number) => Math.ceil(n / step) * step;
              const exact = mixedCashTotal;
              const a20 = roundTo(mixedCashTotal, 20);
              const a50 = roundTo(mixedCashTotal, 50);
              const a100 = roundTo(mixedCashTotal, 100);
              const a500 = mixedCashTotal <= 500 ? 500 : roundTo(mixedCashTotal, 500);
              const mixedQuickAmounts = [
                { label: 'Pago exacto', value: exact },
                ...(a20 !== exact ? [{ label: `$${a20}`, value: a20 }] : []),
                ...(a50 !== a20 && a50 !== exact ? [{ label: `$${a50}`, value: a50 }] : []),
                ...(a100 !== a50 && a100 !== a20 ? [{ label: `$${a100}`, value: a100 }] : []),
                ...(a500 !== a100 ? [{ label: `$${a500}`, value: a500 }] : [])
              ];
              return (
              <div className="mixed-payment-detail">
                <h4>Pago en Efectivo: ${mixedCashTotal.toFixed(2)}</h4>
                <div className="input-group">
                  <label>Monto recibido:</label>
                  <div className="quick-amounts">
                    {mixedQuickAmounts.map(({ label, value }) => (
                      <button
                        key={`mixed-${label}-${value}`}
                        type="button"
                        className={`quick-amount-btn ${Math.abs(parseFloat(mixedCashAmount) - value) < 0.01 ? 'selected' : ''}`}
                        onClick={() => setMixedCashAmount(value.toFixed(2))}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={mixedCashAmount}
                    onChange={(e) => setMixedCashAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min={mixedCashTotal}
                  />
                </div>
                {parseFloat(mixedCashAmount) >= mixedCashTotal && (
                  <div className="change-display">
                    <span>Cambio:</span>
                    <span className="change-amount">${mixedChange.toFixed(2)}</span>
                  </div>
                )}
              </div>
              );
            })()}

            {mixedCardPercent > 0 && (
              <div className="mixed-payment-detail">
                <h4>Pago con Tarjeta: ${mixedCardTotal.toFixed(2)}</h4>
                <div className="input-group">
                  <label>Número de tarjeta:</label>
                  <input
                    type="text"
                    value={mixedCardNumber}
                    onChange={(e) => setMixedCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>
                <div className="card-row">
                  <div className="input-group">
                    <label>Vencimiento:</label>
                    <input
                      type="text"
                      value={mixedCardExpiry}
                      onChange={(e) => setMixedCardExpiry(e.target.value)}
                      placeholder="MM/AA"
                      maxLength={5}
                    />
                  </div>
                  <div className="input-group">
                    <label>CVV:</label>
                    <input
                      type="text"
                      value={mixedCardCvv}
                      onChange={(e) => setMixedCardCvv(e.target.value)}
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            )}

            {mixedCodiPercent > 0 && (
              <div className="mixed-payment-detail">
                <h4>Pago con CODI: ${mixedCodiTotal.toFixed(2)}</h4>
                <div className="codi-info">
                  <p>Escanea el código QR con tu app bancaria</p>
                  <div className="qr-code-placeholder">
                    <QrCode size={100} />
                    <p>CODI QR</p>
                  </div>
                </div>
              </div>
            )}

            {mixedCryptoPercent > 0 && (
              <div className="mixed-payment-detail">
                <h4>Cupón Crypto: ${mixedCryptoTotal.toFixed(2)}</h4>
                <div className="input-group">
                  <label>Código del cupón:</label>
                  <input
                    type="text"
                    value={mixedCryptoCoupon}
                    onChange={(e) => setMixedCryptoCoupon(e.target.value)}
                    placeholder="Ingresa el código del cupón"
                  />
                </div>
              </div>
            )}

            <button
              className="payment-btn"
              onClick={handlePayment}
              disabled={
                mixedTotalPercent !== 100 ||
                (mixedCashPercent > 0 && parseFloat(mixedCashAmount) < mixedCashTotal) ||
                (mixedCardPercent > 0 && (!mixedCardNumber || !mixedCardExpiry || !mixedCardCvv)) ||
                (mixedCryptoPercent > 0 && !mixedCryptoCoupon) ||
                isProcessing
              }
              style={{ 
                background: mixedTotalPercent === 100 ? '#ec4899' : '#9ca3af',
                marginTop: '1.5rem'
              }}
            >
              {isProcessing ? 'Procesando...' : 'Confirmar Pago Mixto'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="checkout-overlay">
      <div className="checkout-modal">
        <div className="checkout-header">
          <h2>Checkout</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="checkout-content">
          {step === 'method' && (
            <div className="payment-methods">
              <h3>Selecciona método de pago</h3>
              <div className="methods-grid">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    className="method-card"
                    onClick={() => handleMethodSelect(method.id)}
                    style={{ borderColor: method.color }}
                  >
                    <div className="method-icon" style={{ color: method.color }}>
                      {method.icon}
                    </div>
                    <div className="method-info">
                      <h4>{method.name}</h4>
                      <p>{method.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="payment-step">
              <button 
                className="back-btn"
                onClick={() => setStep('method')}
              >
                ← Volver
              </button>
              {renderPaymentForm()}
            </div>
          )}

          {step === 'success' && (
            <div className="success-step">
              <div className="success-icon">
                <CheckCircle size={60} />
              </div>
              <h3>¡Pago Exitoso!</h3>
              <p>Tu transacción ha sido procesada correctamente</p>
              <div className="receipt-preview">
                <Receipt size={20} />
                <span>Generando ticket...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal; 