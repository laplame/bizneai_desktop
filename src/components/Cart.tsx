import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  CreditCard,
  Clock,
  ChefHat,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  Edit,
  Save,
  Package,
  DollarSign,
  Loader
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  barcode?: string;
  isWeightBased?: boolean;
  hasVariants?: boolean;
  variants?: { [key: string]: string[] };
  variantModifiers?: { [key: string]: number };
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  weight?: number;
  selectedVariants?: { [key: string]: string };
  unitPrice: number;
  itemTotal: number;
  notes?: string;
}

interface CustomerInfo {
  name?: string;
  phone?: string;
  email?: string;
  tableNumber?: string;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number, weight?: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onCheckout: (checkoutType: 'pay-now' | 'waitlist' | 'kitchen') => void;
  taxRate?: number;
  onAddCustomerInfo?: (info: CustomerInfo) => void;
  onAddOrderNotes?: (notes: string) => void;
  customerInfo?: CustomerInfo;
  orderNotes?: string;
  isProcessing?: boolean;
}

const Cart: React.FC<CartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  taxRate = 0.16,
  onAddCustomerInfo,
  onAddOrderNotes,
  customerInfo = {},
  orderNotes = '',
  isProcessing = false
}) => {
  const [localCustomerInfo, setLocalCustomerInfo] = useState<CustomerInfo>(customerInfo);
  const [localOrderNotes, setLocalOrderNotes] = useState<string>(orderNotes);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editWeight, setEditWeight] = useState<number>(0);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showNotesForm, setShowNotesForm] = useState(false);
  const [showCheckoutOptions, setShowCheckoutOptions] = useState(false);

  useEffect(() => {
    setLocalCustomerInfo(customerInfo);
  }, [customerInfo]);

  useEffect(() => {
    setLocalOrderNotes(orderNotes);
  }, [orderNotes]);

  // Calcular totales
  const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  // Total de items
  const totalItems = items.reduce((sum, item) => {
    if (item.product.isWeightBased) {
      return sum + (item.weight || 0);
    }
    return sum + item.quantity;
  }, 0);

  // Manejar edición de cantidad
  const handleEditQuantity = (item: CartItem) => {
    setEditingItem(item.id);
    if (item.product.isWeightBased) {
      setEditWeight(item.weight || 0);
    } else {
      setEditQuantity(item.quantity);
    }
  };

  // Guardar edición
  const handleSaveEdit = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (item.product.isWeightBased) {
      if (editWeight <= 0) {
        toast.error('El peso debe ser mayor a 0');
        return;
      }
      if (editWeight > item.product.stock) {
        toast.error(`Stock insuficiente. Disponible: ${item.product.stock}kg`);
        return;
      }
      onUpdateQuantity(itemId, 1, editWeight);
    } else {
      if (editQuantity <= 0) {
        onRemoveItem(itemId);
        return;
      }
      if (editQuantity > item.product.stock) {
        toast.error(`Stock insuficiente. Disponible: ${item.product.stock}`);
        return;
      }
      onUpdateQuantity(itemId, editQuantity);
    }
    setEditingItem(null);
    toast.success('Cantidad actualizada');
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditQuantity(0);
    setEditWeight(0);
  };

  // Incrementar cantidad
  const handleIncrement = (item: CartItem) => {
    if (item.product.isWeightBased) {
      const newWeight = (item.weight || 0) + 0.25;
      if (newWeight > item.product.stock) {
        toast.error(`Stock insuficiente. Disponible: ${item.product.stock}kg`);
        return;
      }
      onUpdateQuantity(item.id, 1, newWeight);
    } else {
      if (item.quantity >= item.product.stock) {
        toast.error(`Stock insuficiente. Disponible: ${item.product.stock}`);
        return;
      }
      onUpdateQuantity(item.id, item.quantity + 1);
    }
  };

  // Decrementar cantidad
  const handleDecrement = (item: CartItem) => {
    if (item.product.isWeightBased) {
      const newWeight = Math.max(0, (item.weight || 0) - 0.25);
      if (newWeight === 0) {
        onRemoveItem(item.id);
      } else {
        onUpdateQuantity(item.id, 1, newWeight);
      }
    } else {
      if (item.quantity <= 1) {
        onRemoveItem(item.id);
      } else {
        onUpdateQuantity(item.id, item.quantity - 1);
      }
    }
  };

  // Guardar información de cliente
  const handleSaveCustomerInfo = () => {
    if (onAddCustomerInfo) {
      onAddCustomerInfo(localCustomerInfo);
      toast.success('Información de cliente guardada');
    }
    setShowCustomerForm(false);
  };

  // Guardar notas
  const handleSaveNotes = () => {
    if (onAddOrderNotes) {
      onAddOrderNotes(localOrderNotes);
      toast.success('Notas guardadas');
    }
    setShowNotesForm(false);
  };

  // Limpiar carrito con confirmación
  const handleClearCart = () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar el carrito?')) {
      onClearCart();
      toast.success('Carrito limpiado');
    }
  };

  // Manejar checkout
  const handleCheckoutClick = () => {
    if (items.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    setShowCheckoutOptions(true);
  };

  const handleCheckoutOption = (type: 'pay-now' | 'waitlist' | 'kitchen') => {
    setShowCheckoutOptions(false);
    onCheckout(type);
  };

  // Verificar stock bajo
  const hasLowStock = (item: CartItem) => {
    if (item.product.isWeightBased) {
      return (item.weight || 0) > item.product.stock * 0.8;
    }
    return item.quantity > item.product.stock * 0.8;
  };

  // Formatear variantes
  const formatVariants = (item: CartItem) => {
    if (!item.selectedVariants || Object.keys(item.selectedVariants).length === 0) {
      return null;
    }
    return Object.entries(item.selectedVariants)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  if (items.length === 0) {
    return (
      <div className="cart-container empty">
        <div className="empty-cart">
          <div className="empty-cart-icon">
            <ShoppingCart size={64} />
          </div>
          <h3>Tu carrito está vacío</h3>
          <p>Agrega productos para comenzar una venta</p>
          <button className="btn-primary" onClick={() => window.location.hash = '#pos'}>
            Comenzar a Vender
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      {/* Header con badge de cantidad */}
      <div className="cart-header">
        <div className="cart-header-left">
          <ShoppingCart size={20} />
          <span>Carrito de Compras</span>
          {totalItems > 0 && (
            <span className="cart-badge">{totalItems}</span>
          )}
        </div>
        <div className="cart-header-right">
          <button
            className="icon-btn"
            onClick={handleClearCart}
            title="Limpiar carrito"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Items del carrito */}
      <div className="cart-items">
        {items.map(item => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-info">
              <div className="cart-item-name-row">
                <h4>{item.product.name}</h4>
                {hasLowStock(item) && (
                  <span className="stock-warning">
                    <AlertTriangle size={14} />
                    Stock bajo
                  </span>
                )}
              </div>

              {/* Variantes */}
              {item.selectedVariants && formatVariants(item) && (
                <div className="cart-item-variants">
                  {formatVariants(item)}
                </div>
              )}

              {/* Detalles del item */}
              <div className="cart-item-details">
                <div className="cart-item-quantity-display">
                  {item.product.isWeightBased ? (
                    <>
                      <span>Peso: {item.weight?.toFixed(2)} kg</span>
                      <span className="cart-item-unit-price">
                        ${item.unitPrice.toFixed(2)}/kg
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Cantidad: {item.quantity}</span>
                      <span className="cart-item-unit-price">
                        ${item.unitPrice.toFixed(2)} c/u
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Notas del item */}
              {item.notes && (
                <div className="cart-item-notes">
                  <FileText size={12} />
                  {item.notes}
                </div>
              )}

              {/* Total del item */}
              <div className="cart-item-total">
                ${item.itemTotal.toFixed(2)}
              </div>
            </div>

            {/* Controles */}
            <div className="cart-item-actions">
              {editingItem === item.id ? (
                <div className="cart-item-edit">
                  {item.product.isWeightBased ? (
                    <div className="edit-weight">
                      <label>Peso (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={item.product.stock}
                        value={editWeight}
                        onChange={(e) => setEditWeight(parseFloat(e.target.value) || 0)}
                        autoFocus
                      />
                      <small>Disponible: {item.product.stock}kg</small>
                      <div className="quick-weights">
                        {[0.25, 0.5, 1, 2].map(w => (
                          <button
                            key={w}
                            onClick={() => setEditWeight(w)}
                            className="quick-weight-btn"
                          >
                            +{w}kg
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="edit-quantity">
                      <label>Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        max={item.product.stock}
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                        autoFocus
                      />
                      <small>Disponible: {item.product.stock}</small>
                    </div>
                  )}
                  <div className="edit-actions">
                    <button
                      className="btn-small btn-secondary"
                      onClick={handleCancelEdit}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn-small btn-primary"
                      onClick={() => handleSaveEdit(item.id)}
                    >
                      <Save size={14} />
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="cart-item-controls">
                  <button
                    className="quantity-btn"
                    onClick={() => handleDecrement(item)}
                    disabled={isProcessing}
                  >
                    <Minus size={14} />
                  </button>
                  <button
                    className="quantity-btn edit-btn"
                    onClick={() => handleEditQuantity(item)}
                    disabled={isProcessing}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className="quantity-btn"
                    onClick={() => handleIncrement(item)}
                    disabled={isProcessing || (item.product.isWeightBased ? (item.weight || 0) >= item.product.stock : item.quantity >= item.product.stock)}
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    className="quantity-btn remove-btn"
                    onClick={() => onRemoveItem(item.id)}
                    disabled={isProcessing}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Información de cliente */}
      <div className="cart-customer-section">
        <button
          className="cart-section-btn"
          onClick={() => setShowCustomerForm(!showCustomerForm)}
        >
          <User size={16} />
          {localCustomerInfo.name ? 'Cliente: ' + localCustomerInfo.name : 'Agregar Cliente'}
          {showCustomerForm ? <X size={16} /> : <Plus size={16} />}
        </button>
        {showCustomerForm && (
          <div className="cart-customer-form">
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={localCustomerInfo.name || ''}
              onChange={(e) => setLocalCustomerInfo({ ...localCustomerInfo, name: e.target.value })}
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={localCustomerInfo.phone || ''}
              onChange={(e) => setLocalCustomerInfo({ ...localCustomerInfo, phone: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={localCustomerInfo.email || ''}
              onChange={(e) => setLocalCustomerInfo({ ...localCustomerInfo, email: e.target.value })}
            />
            <input
              type="text"
              placeholder="Número de mesa"
              value={localCustomerInfo.tableNumber || ''}
              onChange={(e) => setLocalCustomerInfo({ ...localCustomerInfo, tableNumber: e.target.value })}
            />
            <button className="btn-small btn-primary" onClick={handleSaveCustomerInfo}>
              <Save size={14} />
              Guardar
            </button>
          </div>
        )}
      </div>

      {/* Notas de orden */}
      <div className="cart-customer-section">
        <button
          className="cart-section-btn"
          onClick={() => setShowNotesForm(!showNotesForm)}
        >
          <FileText size={16} />
          {localOrderNotes ? 'Notas: ' + localOrderNotes.substring(0, 30) + '...' : 'Agregar Notas'}
          {showNotesForm ? <X size={16} /> : <Plus size={16} />}
        </button>
        {showNotesForm && (
          <div className="cart-notes-form">
            <textarea
              placeholder="Notas de la orden (ej: sin cebolla, extra queso, etc.)"
              value={localOrderNotes}
              onChange={(e) => setLocalOrderNotes(e.target.value)}
              rows={3}
            />
            <button className="btn-small btn-primary" onClick={handleSaveNotes}>
              <Save size={14} />
              Guardar
            </button>
          </div>
        )}
      </div>

      {/* Totales */}
      <div className="cart-totals">
        <div className="cart-total-row">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {taxRate > 0 && (
          <div className="cart-total-row">
            <span>IVA ({(taxRate * 100).toFixed(0)}%):</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="cart-total-row total">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Acciones */}
      <div className="cart-actions">
        <button
          className="action-btn btn-primary"
          onClick={handleCheckoutClick}
          disabled={isProcessing || items.length === 0}
        >
          {isProcessing ? (
            <>
              <Loader size={18} className="spinner" />
              Procesando...
            </>
          ) : (
            <>
              <CreditCard size={18} />
              Proceder al Pago
            </>
          )}
        </button>
      </div>

      {/* Modal de opciones de checkout */}
      {showCheckoutOptions && (
        <div className="modal-overlay" onClick={() => setShowCheckoutOptions(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Opciones de Checkout</h3>
              <button className="close-btn" onClick={() => setShowCheckoutOptions(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="checkout-options">
                <button
                  className="checkout-option-btn btn-primary"
                  onClick={() => handleCheckoutOption('pay-now')}
                >
                  <CreditCard size={24} />
                  <div>
                    <h4>Pagar Ahora</h4>
                    <p>Procesar pago inmediato</p>
                  </div>
                </button>
                <button
                  className="checkout-option-btn btn-secondary"
                  onClick={() => handleCheckoutOption('waitlist')}
                >
                  <Clock size={24} />
                  <div>
                    <h4>Agregar a Lista de Espera</h4>
                    <p>Guardar orden para procesar después</p>
                  </div>
                </button>
                <button
                  className="checkout-option-btn btn-secondary"
                  onClick={() => handleCheckoutOption('kitchen')}
                >
                  <ChefHat size={24} />
                  <div>
                    <h4>Enviar a Cocina</h4>
                    <p>Enviar orden directamente a cocina</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;

