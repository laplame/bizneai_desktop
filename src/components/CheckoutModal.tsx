import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Bitcoin,
  QrCode, 
  CheckCircle,
  X,
  Receipt
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onComplete: (paymentMethod: string, amount: number, change?: number) => void;
}

type PaymentMethod = 'cash' | 'card' | 'crypto' | 'codi';

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

  const subtotal = total;
  const tax = total * 0.16;
  const finalTotal = subtotal + tax;
  const change = parseFloat(cashAmount) - finalTotal;

  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setSelectedMethod(null);
      setCashAmount('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setCryptoAddress('');
      setCodiQr('');
      setIsProcessing(false);
    }
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
      onComplete(selectedMethod!, finalTotal, change);
      onClose();
    }, 2000);
  };

  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case 'cash':
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