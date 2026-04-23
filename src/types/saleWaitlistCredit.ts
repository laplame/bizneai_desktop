/**
 * Ciclo de venta con lista de espera (reserva de inventario) y cuenta corriente del cliente.
 */

/** Estados del modelo de venta / pedido en relación con lista de espera y cobro. */
export type SaleFulfillmentState = 'waitlist_reserved' | 'pending_settlement' | 'completed';

/**
 * Movimientos manuales de ajuste de cuenta (sección cliente).
 * - cobranza: cargo al cliente (aumenta saldo adeudado).
 * - anticipo: abono / pago anticipado (reduce saldo adeudado).
 * - cobro_sobre_nota: cobro aplicado a un documento (reduce saldo; requiere id de nota).
 */
export type CustomerAccountAdjustmentKind = 'cobranza' | 'anticipo' | 'cobro_sobre_nota';

export interface CustomerAccountLedgerEntry {
  id: string;
  customerId: number;
  kind: CustomerAccountAdjustmentKind;
  /** Monto siempre positivo; el efecto en saldo lo define `kind`. */
  amount: number;
  note?: string;
  /** Obligatorio cuando kind === cobro_sobre_nota */
  notaId?: string;
  createdAt: string;
}
