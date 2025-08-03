import { useState, useEffect } from 'react';
import { 
  Receipt, 
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  CreditCard,
  Smartphone,
  Globe,
  Package,
  ArrowLeft,
  Share2,
  Download
} from 'lucide-react';

interface TicketItem {
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

interface TicketViewerProps {
  ticketId: string;
}

const TicketViewer = ({ ticketId }: TicketViewerProps) => {
  const [ticketData, setTicketData] = useState<{
    saleId: string;
    date: string;
    items: TicketItem[];
    total: number;
    paymentMethod: string;
    change?: number;
    customerInfo?: {
      name: string;
      email: string;
      phone: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simular carga de datos del ticket
    // En una aplicación real, aquí harías una llamada a la API
    setTimeout(() => {
      // Datos de ejemplo - en producción vendrían de la base de datos
      const mockTicketData = {
        saleId: ticketId,
        date: new Date().toISOString(),
        items: [
          {
            product: {
              id: 1,
              name: 'Café Americano',
              price: 2.50,
              category: 'Bebidas',
              stock: 50,
              barcode: '1234567890123'
            },
            quantity: 2
          },
          {
            product: {
              id: 4,
              name: 'Croissant',
              price: 2.00,
              category: 'Panadería',
              stock: 30,
              barcode: '1234567890126'
            },
            quantity: 1
          }
        ],
        total: 7.00,
        paymentMethod: 'card',
        change: 0,
        customerInfo: {
          name: 'María González',
          email: 'maria.gonzalez@email.com',
          phone: '+52 55 1234 5678'
        }
      };
      
      setTicketData(mockTicketData);
      setLoading(false);
    }, 1000);
  }, [ticketId]);

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket #${ticketId} - BizneAI`,
          text: `Revisa mi ticket de compra en BizneAI`,
          url: window.location.href
        });
      } catch (err) {
        console.error('Error al compartir:', err);
      }
    }
  };

  const handleDownload = () => {
    // En una aplicación real, aquí generarías un PDF
    alert('Función de descarga en desarrollo');
  };

  if (loading) {
    return (
      <div className="ticket-viewer-loading">
        <div className="loading-spinner">
          <Receipt size={48} />
        </div>
        <p>Cargando ticket...</p>
      </div>
    );
  }

  if (error || !ticketData) {
    return (
      <div className="ticket-viewer-error">
        <div className="error-icon">❌</div>
        <h2>Ticket no encontrado</h2>
        <p>El ticket que buscas no existe o ha expirado.</p>
        <button className="btn-primary" onClick={() => window.history.back()}>
          <ArrowLeft size={16} />
          Volver
        </button>
      </div>
    );
  }

  const subtotal = ticketData.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.16;
  const finalTotal = subtotal + tax;

  return (
    <div className="ticket-viewer">
      <div className="ticket-viewer-header">
        <div className="header-content">
          <div className="business-info">
            <div className="business-logo">
              <Receipt size={32} />
            </div>
            <div>
              <h1>BizneAI</h1>
              <p>Café & Delicatessen</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="action-btn" onClick={handleShare} title="Compartir">
              <Share2 size={20} />
            </button>
            <button className="action-btn" onClick={handleDownload} title="Descargar">
              <Download size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="ticket-viewer-content">
        <div className="ticket-status">
          <div className="status-badge valid">
            <CheckCircle size={16} />
            Ticket Válido
          </div>
        </div>

        <div className="ticket-details">
          <div className="detail-row">
            <span className="label">Ticket #:</span>
            <span className="value">{ticketData.saleId}</span>
          </div>
          <div className="detail-row">
            <span className="label">Fecha:</span>
            <span className="value">
              <Calendar size={14} />
              {new Date(ticketData.date).toLocaleDateString()}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Hora:</span>
            <span className="value">
              <Clock size={14} />
              {new Date(ticketData.date).toLocaleTimeString()}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Método de Pago:</span>
            <span className="value payment-method">
              {getPaymentMethodIcon(ticketData.paymentMethod)}
              {getPaymentMethodName(ticketData.paymentMethod)}
            </span>
          </div>
        </div>

        {ticketData.customerInfo && (
          <div className="customer-section">
            <h3>Cliente</h3>
            <div className="customer-info">
              <p><strong>{ticketData.customerInfo.name}</strong></p>
              <p>{ticketData.customerInfo.email}</p>
              <p>{ticketData.customerInfo.phone}</p>
            </div>
          </div>
        )}

        <div className="items-section">
          <h3>Productos</h3>
          <div className="items-list">
            {ticketData.items.map((item, index) => (
              <div key={index} className="item-card">
                <div className="item-header">
                  <div className="item-icon">
                    <Package size={20} />
                  </div>
                  <div className="item-info">
                    <span className="item-name">{item.product.name}</span>
                    <span className="item-category">{item.product.category}</span>
                  </div>
                  <div className="item-quantity">
                    x{item.quantity}
                  </div>
                </div>
                <div className="item-details">
                  <span className="item-price">${item.product.price.toFixed(2)} c/u</span>
                  <span className="item-total">${(item.product.price * item.quantity).toFixed(2)}</span>
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
          {ticketData.change && ticketData.change > 0 && (
            <div className="total-row">
              <span>Cambio:</span>
              <span>${ticketData.change.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="ticket-footer">
          <p>¡Gracias por tu compra!</p>
          <p>Este ticket es válido como comprobante de pago</p>
          <div className="verification-info">
            <p>Ticket verificado y autenticado por BizneAI</p>
            <small>ID de verificación: {ticketData.saleId}</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketViewer; 