import React, { useState, useEffect, useCallback } from 'react';
import { Truck, X, Plus, Trash2, PackageCheck, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getShopId, getProductsFromMcp } from '../utils/shopIdHelper';
import {
  createPurchaseOrder,
  getPurchaseOrders,
  receivePurchaseOrder,
  type PurchaseOrder,
  type PurchaseOrderItem,
  type CreatePurchaseOrderPayload,
} from '../api/purchaseOrders';
import { enqueueOfflineWrite } from '../services/offlineWriteQueue';

interface PurchaseOrdersProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CatalogProduct {
  id: string;
  name: string;
  sku?: string;
  cost?: number;
  price?: number;
}

interface DraftItem {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitCost: number;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  ordered: 'Ordenada',
  partial: 'Recibida parcial',
  received: 'Recibida',
  cancelled: 'Cancelada',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  ordered: '#3b82f6',
  partial: '#8b5cf6',
  received: '#059669',
  cancelled: '#dc2626',
};

const PurchaseOrders: React.FC<PurchaseOrdersProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'list' | 'new'>('list');
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [tax, setTax] = useState('0');
  const [shipping, setShipping] = useState('0');
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, string>>({});
  const [isReceiving, setIsReceiving] = useState(false);

  const shopId = getShopId();

  const loadOrders = useCallback(async () => {
    if (!shopId) return;
    setIsLoading(true);
    const res = await getPurchaseOrders(shopId, { limit: 50 });
    if (res.success && res.data) {
      setOrders(res.data.orders);
    } else if (res.error) {
      console.warn('[PurchaseOrders] list:', res.error);
    }
    setIsLoading(false);
  }, [shopId]);

  const loadCatalog = useCallback(async () => {
    try {
      const mcpProducts = await getProductsFromMcp();
      if (mcpProducts) {
        setCatalog(
          mcpProducts.map((p: Record<string, unknown>) => ({
            id: String(p._id ?? ''),
            name: String(p.name ?? ''),
            sku: p.sku != null ? String(p.sku) : undefined,
            cost: typeof p.cost === 'number' ? p.cost : Number(p.cost) || undefined,
            price: typeof p.price === 'number' ? p.price : Number(p.price) || undefined,
          })).filter((p) => p.id)
        );
      }
    } catch (err) {
      console.warn('[PurchaseOrders] catalog:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTab('list');
      void loadOrders();
      void loadCatalog();
    }
  }, [isOpen, loadOrders, loadCatalog]);

  const resetForm = () => {
    setSupplierName('');
    setSupplierContact('');
    setExpectedDeliveryDate('');
    setNotes('');
    setTax('0');
    setShipping('0');
    setDraftItems([]);
  };

  const handleAddDraftItem = (product: CatalogProduct) => {
    if (draftItems.some((i) => i.productId === product.id)) {
      toast.error('Ese producto ya está en la orden');
      return;
    }
    setDraftItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        unitCost: product.cost || product.price || 0,
      },
    ]);
    setProductSearch('');
  };

  const handleUpdateDraftItem = (productId: string, field: 'quantity' | 'unitCost', value: number) => {
    setDraftItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, [field]: value } : i)));
  };

  const handleRemoveDraftItem = (productId: string) => {
    setDraftItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const subtotal = draftItems.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const taxNum = parseFloat(tax) || 0;
  const shippingNum = parseFloat(shipping) || 0;
  const total = subtotal + taxNum + shippingNum;

  const filteredCatalog = productSearch.trim()
    ? catalog.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          (p.sku || '').toLowerCase().includes(productSearch.toLowerCase())
      )
    : [];

  const handleSubmitOrder = async () => {
    if (!shopId) {
      toast.error('Configura el ID de tienda antes de crear órdenes de compra.');
      return;
    }
    if (!supplierName.trim()) {
      toast.error('Ingresa el nombre del proveedor.');
      return;
    }
    if (draftItems.length === 0) {
      toast.error('Agrega al menos un producto.');
      return;
    }
    if (draftItems.some((i) => i.quantity <= 0 || i.unitCost <= 0)) {
      toast.error('Cantidad y costo unitario deben ser mayores a cero.');
      return;
    }
    setIsSubmitting(true);
    const orderPayload: CreatePurchaseOrderPayload = {
      supplierName: supplierName.trim(),
      supplierContact: supplierContact.trim() || undefined,
      items: draftItems.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        sku: i.sku,
        quantity: i.quantity,
        unitCost: i.unitCost,
        totalCost: i.quantity * i.unitCost,
      })),
      subtotal,
      tax: taxNum,
      shipping: shippingNum,
      total,
      notes: notes.trim() || undefined,
      createdBy: 'desktop',
      expectedDeliveryDate: expectedDeliveryDate || undefined,
    };
    const res = await createPurchaseOrder(shopId, orderPayload);
    setIsSubmitting(false);
    if (res.success) {
      toast.success('Orden de compra creada');
      resetForm();
      setTab('list');
      void loadOrders();
    } else if (res.retriable) {
      enqueueOfflineWrite('purchase-order-create', { shopId, payload: orderPayload });
      toast.success('Sin conexión: la orden se guardó y se enviará al servidor al reconectar.');
      resetForm();
      setTab('list');
    } else {
      toast.error(res.error || 'No se pudo crear la orden');
    }
  };

  const openReceiveModal = (order: PurchaseOrder) => {
    setReceivingOrder(order);
    const initial: Record<string, string> = {};
    order.items.forEach((item) => {
      const pending = item.quantity - item.receivedQuantity;
      initial[item.productId] = pending > 0 ? String(pending) : '0';
    });
    setReceiveQuantities(initial);
  };

  const handleConfirmReceive = async () => {
    if (!shopId || !receivingOrder) return;
    const receivedItems = Object.entries(receiveQuantities)
      .map(([productId, qty]) => ({ productId, quantity: parseFloat(qty) || 0 }))
      .filter((i) => i.quantity > 0);
    if (receivedItems.length === 0) {
      toast.error('Ingresa alguna cantidad a recibir.');
      return;
    }
    setIsReceiving(true);
    const res = await receivePurchaseOrder(shopId, receivingOrder._id, receivedItems);
    setIsReceiving(false);
    if (res.success) {
      toast.success('Recepción registrada · stock actualizado');
      setReceivingOrder(null);
      void loadOrders();
    } else if (res.retriable) {
      enqueueOfflineWrite('purchase-order-receive', { shopId, orderId: receivingOrder._id, receivedItems });
      toast.success('Sin conexión: la recepción se guardó y se enviará al servidor al reconectar.');
      setReceivingOrder(null);
    } else {
      toast.error(res.error || 'No se pudo registrar la recepción');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Truck size={20} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />
            Proveedores · Órdenes de Compra
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="taxes-tabs">
          <button className={`taxes-tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>
            Órdenes
          </button>
          <button className={`taxes-tab ${tab === 'new' ? 'active' : ''}`} onClick={() => setTab('new')}>
            <Plus size={18} />
            Nueva orden
          </button>
        </div>

        <div className="modal-body">
          {tab === 'list' &&
            (isLoading ? (
              <div className="empty-state">
                <RefreshCw size={32} className="spinner" />
                <p>Cargando órdenes...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <Truck size={48} style={{ opacity: 0.5 }} />
                <h3>Sin órdenes de compra</h3>
                <p>Crea una nueva orden para registrar compras a proveedores</p>
              </div>
            ) : (
              <div className="invoice-list">
                {orders.map((order) => {
                  const pendingItems = order.items.filter((i) => i.receivedQuantity < i.quantity);
                  return (
                    <div key={order._id} className="invoice-card">
                      <div className="invoice-header">
                        <div>
                          <h4>{order.supplierName}</h4>
                          <span className="invoice-date">
                            {order.orderNumber} · {new Date(order.orderDate).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                        <span className="invoice-type" style={{ background: STATUS_COLORS[order.status], color: '#fff' }}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </div>
                      <div className="invoice-body">
                        <div className="invoice-info">
                          <span>
                            <strong>Items:</strong> {order.items.length}
                          </span>
                          {order.supplierContact && (
                            <span>
                              <strong>Contacto:</strong> {order.supplierContact}
                            </span>
                          )}
                        </div>
                        <div className="invoice-total">
                          <strong>${order.total.toFixed(2)}</strong>
                        </div>
                      </div>
                      {pendingItems.length > 0 && order.status !== 'cancelled' && (
                        <button
                          className="btn-secondary"
                          style={{ marginTop: '0.75rem' }}
                          onClick={() => openReceiveModal(order)}
                        >
                          <PackageCheck size={16} />
                          Recibir mercancía
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

          {tab === 'new' && (
            <div>
              <div className="form-row">
                <div className="form-group">
                  <label>Proveedor *</label>
                  <input type="text" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Nombre del proveedor" />
                </div>
                <div className="form-group">
                  <label>Contacto</label>
                  <input type="text" value={supplierContact} onChange={(e) => setSupplierContact(e.target.value)} placeholder="Teléfono / email" />
                </div>
              </div>
              <div className="form-group">
                <label>Fecha esperada de entrega</label>
                <input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Agregar producto</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar por nombre o SKU..."
                  />
                  {filteredCatalog.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'var(--bs-dark-card, #1e293b)',
                        border: '1px solid rgba(148,163,184,0.3)',
                        borderRadius: 8,
                        maxHeight: 220,
                        overflowY: 'auto',
                        zIndex: 20,
                      }}
                    >
                      {filteredCatalog.slice(0, 20).map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleAddDraftItem(p)}
                          style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                        >
                          <span>{p.name}</span>
                          <span style={{ opacity: 0.7 }}>{p.sku}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {draftItems.length > 0 && (
                <div className="invoice-list" style={{ marginTop: '1rem' }}>
                  {draftItems.map((item) => (
                    <div key={item.productId} className="invoice-card">
                      <div className="invoice-header">
                        <div>
                          <h4>{item.productName}</h4>
                          {item.sku && <span className="invoice-date">SKU: {item.sku}</span>}
                        </div>
                        <button className="close-btn" onClick={() => handleRemoveDraftItem(item.productId)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Cantidad</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateDraftItem(item.productId, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Costo unitario</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) => handleUpdateDraftItem(item.productId, 'unitCost', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Subtotal</label>
                          <input type="text" disabled value={`$${(item.quantity * item.unitCost).toFixed(2)}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-row" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Impuestos</label>
                  <input type="number" min="0" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Envío</label>
                  <input type="number" min="0" step="0.01" value={shipping} onChange={(e) => setShipping(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Notas</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
              </div>

              <div className="example-calculations">
                <div className="example-item">
                  <span>Subtotal:</span>
                  <strong>${subtotal.toFixed(2)}</strong>
                </div>
                <div className="example-item total">
                  <span>Total:</span>
                  <strong>${total.toFixed(2)}</strong>
                </div>
              </div>

              <button className="btn-primary" onClick={handleSubmitOrder} disabled={isSubmitting} style={{ marginTop: '1rem' }}>
                {isSubmitting ? 'Creando...' : 'Crear orden de compra'}
              </button>
            </div>
          )}
        </div>
      </div>

      {receivingOrder && (
        <div className="modal-overlay" onClick={() => setReceivingOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Recibir · {receivingOrder.supplierName}</h3>
              <button className="close-btn" onClick={() => setReceivingOrder(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {receivingOrder.items.map((item: PurchaseOrderItem) => (
                <div className="form-group" key={item.productId}>
                  <label>
                    {item.productName} (pedido {item.quantity}, recibido {item.receivedQuantity})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={receiveQuantities[item.productId] ?? '0'}
                    onChange={(e) =>
                      setReceiveQuantities((prev) => ({ ...prev, [item.productId]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setReceivingOrder(null)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleConfirmReceive} disabled={isReceiving}>
                <PackageCheck size={18} />
                {isReceiving ? 'Registrando...' : 'Confirmar recepción'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
