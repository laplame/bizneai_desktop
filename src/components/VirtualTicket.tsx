import { useState, useEffect } from 'react';
import { 
  Receipt, 
  QrCode, 
  Share2, 
  Copy, 
  CheckCircle,
  X,
  Printer,
  Smartphone,
  Globe,
  DollarSign,
  CreditCard
} from 'lucide-react';

interface CartItem {
  product: {
    id: number;
    name: string;
    price: number;
    category: string;
    stock: number;
    barcode?: string;
  };
  quantity: number;
}

interface VirtualTicketProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  saleId: string;
  paymentMethod: string;
  change?: number;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

const VirtualTicket = ({ 
  isOpen, 
  onClose, 
  cart, 
  saleId, 
  paymentMethod, 
  change = 0,
  customerInfo 
}: VirtualTicketProps) => {
  const [ticketUrl, setTicketUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [currentTime] = useState(new Date());

  useEffect(() => {
    if (isOpen && cart.length > 0) {
      generateTicketData();
    }
  }, [isOpen, cart, saleId]);

  const generateTicketData = () => {
    // Generar URL única para el ticket
    const baseUrl = window.location.origin;
    const ticketPath = `/ticket/${saleId}`;
    const fullUrl = `${baseUrl}${ticketPath}`;
    setTicketUrl(fullUrl);

    // Generar datos para el QR (URL del ticket)
    // setQrCode(fullUrl); // This line was removed as per the edit hint
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(ticketUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar URL:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket #${saleId} - BizneAI`,
          text: `Revisa tu ticket de compra: ${ticketUrl}`,
          url: ticketUrl
        });
      } catch (err) {
        console.error('Error al compartir:', err);
      }
    } else {
      handleCopyUrl();
    }
  };

  const getPaymentMethodName = (method: string) => {
    const names: { [key: string]: string } = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      crypto: 'Crypto',
      codi: 'CODI'
    };
    return names[method] || method;
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <DollarSign size={16} />;
      case 'card':
        return <CreditCard size={16} />;
      case 'crypto':
        return <Globe size={16} />;
      case 'codi':
        return <Smartphone size={16} />;
      default:
        return <CreditCard size={16} />;
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.16;
  const finalTotal = subtotal + tax;

  if (!isOpen) return null;

  return (
    <div className="virtual-ticket-overlay">
      <div className="virtual-ticket-modal">
        <div className="ticket-header">
          <h2>Ticket Virtual</h2>
          <div className="header-actions">
            <button className="action-btn" onClick={handlePrint} title="Imprimir">
              <Printer size={20} />
            </button>
            <button className="action-btn" onClick={handleShare} title="Compartir">
              <Share2 size={20} />
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="ticket-content">
          {/* Ticket Principal */}
          <div className="ticket-main">
            <div className="ticket-business-info">
              <div className="business-logo">
                <Receipt size={48} />
              </div>
              <h1>BizneAI</h1>
              <p className="business-tagline">Café & Delicatessen</p>
              <p className="business-address">
                Av. Insurgentes Sur 1234<br />
                Ciudad de México, CDMX 03100<br />
                Tel: +52 55 1234 5678
              </p>
            </div>

            <div className="ticket-details">
              <div className="ticket-row">
                <span className="label">Ticket #:</span>
                <span className="value">{saleId}</span>
              </div>
              <div className="ticket-row">
                <span className="label">Fecha:</span>
                <span className="value">{currentTime.toLocaleDateString()}</span>
              </div>
              <div className="ticket-row">
                <span className="label">Hora:</span>
                <span className="value">{currentTime.toLocaleTimeString()}</span>
              </div>
              <div className="ticket-row">
                <span className="label">Método de Pago:</span>
                <span className="value payment-method">
                  {getPaymentMethodIcon(paymentMethod)}
                  {getPaymentMethodName(paymentMethod)}
                </span>
              </div>
            </div>

            {customerInfo && (
              <div className="customer-section">
                <h3>Cliente</h3>
                <div className="customer-info">
                  <p><strong>{customerInfo.name}</strong></p>
                  <p>{customerInfo.email}</p>
                  <p>{customerInfo.phone}</p>
                </div>
              </div>
            )}

            <div className="items-section">
              <h3>Productos</h3>
              <div className="items-list">
                {cart.map((item, index) => (
                  <div key={index} className="item-row">
                    <div className="item-info">
                      <span className="item-name">{item.product.name}</span>
                      <span className="item-category">{item.product.category}</span>
                    </div>
                    <div className="item-quantity">
                      {item.quantity} x ${item.product.price.toFixed(2)}
                    </div>
                    <div className="item-total">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="totals-section">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>IVA (16%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="total-row total-final">
                <span>Total:</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
              {change > 0 && (
                <div className="total-row">
                  <span>Cambio:</span>
                  <span>${change.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="ticket-footer">
              <p>¡Gracias por tu compra!</p>
              <p>Escanea el QR para ver tu ticket en línea</p>
              <p className="footer-note">
                Este ticket es válido como comprobante de pago
              </p>
            </div>
          </div>

          {/* QR Code y Acciones */}
          <div className="ticket-sidebar">
            <div className="qr-section">
              <h3>Ver Ticket en Línea</h3>
              <div className="qr-container">
                <div className="qr-code">
                  <QrCode size={120} />
                  <div className="qr-overlay">
                    <span className="qr-text">QR</span>
                  </div>
                </div>
                <p className="qr-instructions">
                  Escanea este código QR con tu teléfono para ver el ticket en línea
                </p>
              </div>
            </div>

            <div className="ticket-actions">
              <div className="url-section">
                <h4>Enlace del Ticket</h4>
                <div className="url-container">
                  <input
                    type="text"
                    value={ticketUrl}
                    readOnly
                    className="url-input"
                  />
                  <button 
                    className={`copy-btn ${copied ? 'copied' : ''}`}
                    onClick={handleCopyUrl}
                  >
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                {copied && <span className="copied-message">¡URL copiada!</span>}
              </div>

              <div className="action-buttons">
                <button className="btn-primary" onClick={handlePrint}>
                  <Printer size={16} />
                  Imprimir Ticket
                </button>
                <button className="btn-secondary" onClick={handleShare}>
                  <Share2 size={16} />
                  Compartir
                </button>
                <button className="btn-secondary" onClick={handleCopyUrl}>
                  <Copy size={16} />
                  Copiar URL
                </button>
              </div>
            </div>

            <div className="ticket-features">
              <h4>Características del Ticket Virtual</h4>
              <ul className="features-list">
                <li>
                  <CheckCircle size={16} />
                  <span>Acceso 24/7 desde cualquier dispositivo</span>
                </li>
                <li>
                  <CheckCircle size={16} />
                  <span>Verificación de autenticidad</span>
                </li>
                <li>
                  <CheckCircle size={16} />
                  <span>Historial de compras</span>
                </li>
                <li>
                  <CheckCircle size={16} />
                  <span>Compartir fácilmente</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualTicket; 