/** Línea de venta para reconstruir el carrito desde el panel de ventas */
export interface RecoveredSaleLine {
  productId: string | number;
  name: string;
  category: string;
  unitPrice: number;
  quantity: number;
}

export interface RecoveredSalePayload {
  displaySaleId: string;
  paymentMethod: string;
  items: RecoveredSaleLine[];
  subtotal?: number;
  tax?: number;
  total: number;
  customerName?: string;
  notes?: string;
}
