import { describe, it, expect } from 'vitest';
import {
  mapMerkleTransactionToSaleRow,
  mergeSaleRows,
  saleRowToRecoveryPayload,
  type SaleReportRow,
} from '../salesRecovery';
import type { Transaction } from '../merkleTree';

function tx(partial: Partial<Transaction> & { action: Transaction['action']; data: unknown }): Transaction {
  return {
    id: 'tx-1',
    saleId: 1,
    timestamp: '2026-01-01T00:00:00.000Z',
    hash: 'h',
    ...partial,
  } as Transaction;
}

describe('mapMerkleTransactionToSaleRow', () => {
  it('ignores non-create transactions', () => {
    expect(mapMerkleTransactionToSaleRow(tx({ action: 'update', data: {} }))).toBeNull();
    expect(mapMerkleTransactionToSaleRow(tx({ action: 'delete', data: {} }))).toBeNull();
  });

  it('maps a create transaction into a sale row', () => {
    const row = mapMerkleTransactionToSaleRow(
      tx({
        action: 'create',
        data: {
          saleId: 42,
          date: '2026-02-01T10:00:00.000Z',
          total: 116,
          subtotal: 100,
          tax: 16,
          paymentMethod: 'card',
          items: [{ productId: 7, productName: 'Coffee', unitPrice: 58, quantity: 2, category: 'Bebidas' }],
        },
      })
    );
    expect(row).not.toBeNull();
    expect(row!.id).toBe('42');
    expect(row!.total).toBe(116);
    expect(row!.subtotal).toBe(100);
    expect(row!.tax).toBe(16);
    expect(row!.paymentMethod).toBe('card');
    expect(row!.source).toBe('merkle');
    expect(row!.items).toHaveLength(1);
    expect(row!.items[0]).toMatchObject({
      product: { id: 7, name: 'Coffee', price: 58, category: 'Bebidas' },
      quantity: 2,
    });
  });

  it('derives a numeric product id from a string productId', () => {
    const row = mapMerkleTransactionToSaleRow(
      tx({ action: 'create', data: { saleId: 1, items: [{ productId: 'prod-123', quantity: 1 }] } })
    );
    expect(row!.items[0].product.id).toBe(123);
  });
});

describe('mergeSaleRows', () => {
  const mk = (id: string | number, date: string): SaleReportRow => ({
    id,
    date,
    items: [],
    total: 0,
    paymentMethod: 'cash',
    change: 0,
  });

  it('deduplicates by id+date, keeping the merkle copy', () => {
    const merkle = [mk(1, '2026-01-02T00:00:00.000Z')];
    const remote = [mk(1, '2026-01-02T00:00:00.000Z'), mk(2, '2026-01-03T00:00:00.000Z')];
    const out = mergeSaleRows(merkle, remote);
    expect(out.map((r) => r.id)).toEqual([2, 1]); // sorted by date desc
  });

  it('sorts merged rows by date descending', () => {
    const out = mergeSaleRows(
      [mk('a', '2026-01-01T00:00:00.000Z')],
      [mk('b', '2026-03-01T00:00:00.000Z'), mk('c', '2026-02-01T00:00:00.000Z')]
    );
    expect(out.map((r) => r.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('saleRowToRecoveryPayload', () => {
  it('flattens a sale row into a recovery payload', () => {
    const row: SaleReportRow = {
      id: 55,
      date: '2026-01-01T00:00:00.000Z',
      items: [{ product: { id: 3, name: 'Tea', price: 20, category: 'Bebidas' }, quantity: 2 }],
      total: 40,
      subtotal: 34,
      tax: 6,
      paymentMethod: 'cash',
      change: 0,
      customerName: 'Ana',
      notes: 'sin azúcar',
    };
    expect(saleRowToRecoveryPayload(row)).toEqual({
      displaySaleId: '55',
      paymentMethod: 'cash',
      items: [{ productId: 3, name: 'Tea', category: 'Bebidas', unitPrice: 20, quantity: 2 }],
      subtotal: 34,
      tax: 6,
      total: 40,
      customerName: 'Ana',
      notes: 'sin azúcar',
    });
  });
});
