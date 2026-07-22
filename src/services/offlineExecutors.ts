/**
 * Registro central de "cómo reintentar" cada tipo de escritura encolada por
 * offlineWriteQueue.ts. Se llama una sola vez al arrancar la app (App.tsx),
 * antes de installOfflineWriteQueueListeners().
 */
import { registerOfflineExecutor } from './offlineWriteQueue';
import { createPurchaseOrder, receivePurchaseOrder, type CreatePurchaseOrderPayload } from '../api/purchaseOrders';
import { updateProductConsignment, type ConsignmentFields } from '../api/consignment';
import { openCashRegister, closeCashRegister, addCashMovement, type CashMovementType } from '../api/cashRegister';
import { pushLocalProductToServer } from '../api/products';
import type { CreateProductRequest } from '../types/api';

let registered = false;

/**
 * Mismo arreglo que `reconcileLocalProductId` en ProductManagement.tsx,
 * pero para cuando el push exitoso llega tarde (reintento de la cola
 * offline, sin componente React montado): reemplaza el id local por el
 * `_id` real de Mongo directo en localStorage, para que el próximo sync no
 * pierda datos solo-locales (como la foto) de este producto.
 */
function reconcileLocalProductIdInStorage(localId: unknown, serverId: string): void {
  try {
    const raw = localStorage.getItem('bizneai-products');
    if (!raw) return;
    const products = JSON.parse(raw);
    if (!Array.isArray(products)) return;
    const idx = products.findIndex((p) => p && typeof p === 'object' && p.id === localId);
    if (idx === -1) return;
    products[idx] = { ...products[idx], id: serverId };
    localStorage.setItem('bizneai-products', JSON.stringify(products));
    window.dispatchEvent(new Event('products-updated'));
  } catch (err) {
    console.warn('[offlineExecutors] No se pudo reconciliar el id del producto:', err);
  }
}

export function registerAllOfflineExecutors(): void {
  if (registered) return;
  registered = true;

  registerOfflineExecutor('product-create', async (payload) => {
    const { localId, ...body } = payload as CreateProductRequest & { barcode?: string; localId?: unknown };
    const res = await pushLocalProductToServer(body);
    if (res.success && res.serverId && localId !== undefined) {
      reconcileLocalProductIdInStorage(localId, res.serverId);
    }
    return { success: res.success, retriable: res.retriable, error: res.error };
  });

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
