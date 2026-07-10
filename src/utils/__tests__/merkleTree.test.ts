import { describe, it, expect } from 'vitest';
import {
  generateTransactionHash,
  buildMerkleTree,
  createDailyBlock,
  verifyBlockIntegrity,
  verifyChainIntegrity,
  type Transaction,
} from '../merkleTree';

/** Build a fully-formed transaction with a valid content hash. */
async function makeTx(saleId: number, data: Record<string, unknown>): Promise<Transaction> {
  const base = {
    id: `tx-${saleId}`,
    saleId,
    action: 'create' as const,
    timestamp: `2026-01-0${saleId}T00:00:00.000Z`,
    data,
  };
  const hash = await generateTransactionHash(base);
  return { ...base, hash };
}

describe('buildMerkleTree', () => {
  it('returns an empty root for no transactions', async () => {
    const { root, tree } = await buildMerkleTree([]);
    expect(root).toBe('');
    expect(tree).toEqual([]);
  });

  it('is deterministic for the same input', async () => {
    const txs = [await makeTx(1, { total: 10 }), await makeTx(2, { total: 20 })];
    const a = await buildMerkleTree(txs);
    const b = await buildMerkleTree(txs);
    expect(a.root).toBe(b.root);
    expect(a.root).toHaveLength(64); // SHA-256 hex
  });

  it('changes the root when a transaction hash changes', async () => {
    const t1 = await makeTx(1, { total: 10 });
    const t2 = await makeTx(2, { total: 20 });
    const rootA = (await buildMerkleTree([t1, t2])).root;
    const t2b = await makeTx(2, { total: 999 });
    const rootB = (await buildMerkleTree([t1, t2b])).root;
    expect(rootA).not.toBe(rootB);
  });
});

describe('verifyBlockIntegrity', () => {
  it('accepts an untampered block', async () => {
    const block = await createDailyBlock('2026-01-01', [await makeTx(1, { total: 10 })]);
    const res = await verifyBlockIntegrity(block);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('detects a tampered transaction payload', async () => {
    const block = await createDailyBlock('2026-01-01', [await makeTx(1, { total: 10 })]);
    // Mutate the stored data without recomputing the transaction hash.
    block.transactions[0].data = { total: 9999 };
    const res = await verifyBlockIntegrity(block);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('hash mismatch'))).toBe(true);
  });

  it('detects a forged merkle root', async () => {
    const block = await createDailyBlock('2026-01-01', [await makeTx(1, { total: 10 })]);
    block.merkleRoot = 'deadbeef';
    const res = await verifyBlockIntegrity(block);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Merkle root mismatch');
  });

  it('throws when building a block with no transactions', async () => {
    await expect(createDailyBlock('2026-01-01', [])).rejects.toThrow();
  });
});

describe('verifyChainIntegrity', () => {
  it('accepts a correctly linked chain', async () => {
    const b1 = await createDailyBlock('2026-01-01', [await makeTx(1, { total: 10 })]);
    const b2 = await createDailyBlock('2026-01-02', [await makeTx(2, { total: 20 })], b1.blockHash);
    const res = await verifyChainIntegrity([b1, b2]);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('rejects a broken chain linkage', async () => {
    const b1 = await createDailyBlock('2026-01-01', [await makeTx(1, { total: 10 })]);
    const b2 = await createDailyBlock('2026-01-02', [await makeTx(2, { total: 20 })], 'wrong-parent-hash');
    const res = await verifyChainIntegrity([b1, b2]);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });
});
