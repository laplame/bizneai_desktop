/**
 * Registro central de "cómo reintentar" cada tipo de escritura encolada por
 * offlineWriteQueue.ts. Se llama una sola vez al arrancar la app (App.tsx),
 * antes de installOfflineWriteQueueListeners().
 */
import { registerOfflineExecutor } from './offlineWriteQueue';
import { createPurchaseOrder, receivePurchaseOrder, type CreatePurchaseOrderPayload } from '../api/purchaseOrders';
import { updateProductConsignment, type ConsignmentFields } from '../api/consignment';
import { openCashRegister, closeCashRegister, addCashMovement, type CashMovementType } from '../api/cashRegister';

let registered = false;

export function registerAllOfflineExecutors(): void {
  if (registered) return;
  registered = true;

  registerOfflineExecutor('purchase-order-create', async (payload) => {
    const { shopId, payload: body } = payload as { shopId: string; payload: CreatePurchaseOrderPayload };
    const res = await createPurchaseOrder(shopId, body);
    return { success: res.success, retriable: res.retriable, error: res.error };
  });

  registerOfflineExecutor('purchase-order-receive', async (payload) => {
    const { shopId, orderId, receivedItems } = payload as {
      shopId: string;
      orderId: string;
      receivedItems: Array<{ productId: string; quantity: number }>;
    };
    const res = await receivePurchaseOrder(shopId, orderId, receivedItems);
    return { success: res.success, retriable: res.retriable, error: res.error };
  });

  registerOfflineExecutor('consignment-update', async (payload) => {
    const { shopId, productId, fields } = payload as { shopId: string; productId: string; fields: ConsignmentFields };
    const res = await updateProductConsignment(shopId, productId, fields);
    return { success: res.success, retriable: res.retriable, error: res.error };
  });

  registerOfflineExecutor('cash-register-open', async (payload) => {
    const { shopId, params } = payload as {
      shopId: string;
      params: { openedBy?: string; openingAmount: number; notes?: string };
    };
    const res = await openCashRegister(shopId, params);
    return { success: res.success, retriable: res.retriable, error: res.error };
  });

  registerOfflineExecutor('cash-register-close', async (payload) => {
    const { shopId, params } = payload as {
      shopId: string;
      params: { closingAmount: number; closedBy?: string; notes?: string };
    };
    const res = await closeCashRegister(shopId, params);
    return { success: res.success, retriable: res.retriable, error: res.error };
  });

  registerOfflineExecutor('cash-register-movement', async (payload) => {
    const { shopId, params } = payload as {
      shopId: string;
      params: { type: CashMovementType; amount: number; notes?: string };
    };
    const res = await addCashMovement(shopId, params);
    return { success: res.success, retriable: res.retriable, error: res.error };
  });
}
