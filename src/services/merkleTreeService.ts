/**
 * Merkle Tree Service - Historial inmutable de ventas con árboles Merkle
 * Almacenamiento: localStorage (compatible web/desktop)
 * @see # Merkle Tree Sales – Lógica Completa y .md
 */

import {
  Transaction,
  DailyBlock,
  MerkleProof,
  generateTransactionHash,
  createDailyBlock,
  buildMerkleTree,
  generateMerkleProof,
  verifyMerkleProof,
  verifyBlockIntegrity,
  verifyChainIntegrity,
} from '../utils/merkleTree';

const STORAGE_KEYS = {
  TRANSACTIONS: '@BizneAI_merkle_tree',
  DAILY_BLOCKS: '@BizneAI_daily_blocks',
  LAST_BLOCK_GENERATION: '@BizneAI_lastBlockGeneration',
  BLOCKS_SENT: '@BizneAI_blocks_sent_to_server',
} as const;

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hora

const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('[MerkleTree] Error saving to localStorage:', e);
    }
  },
};

/** Sale mínima para registrar en Merkle */
export interface SaleRecord {
  id?: string;
  saleId?: string;
  items?: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; totalPrice?: number; category?: string }>;
  subtotal?: number;
  tax?: number;
  total?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  transactionId?: string;
  date?: string;
  createdAt?: string;
  customerName?: string;
  notes?: string;
  [key: string]: unknown;
}

function loadTransactions(): Transaction[] {
  return storage.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) ?? [];
}

function loadBlocks(): DailyBlock[] {
  return storage.get<DailyBlock[]>(STORAGE_KEYS.DAILY_BLOCKS) ?? [];
}

function saveData(transactions: Transaction[], blocks: DailyBlock[]): void {
  storage.set(STORAGE_KEYS.TRANSACTIONS, transactions);
  storage.set(STORAGE_KEYS.DAILY_BLOCKS, blocks);
}

/** Convierte SaleRecord a Transaction.data (sanitizado) */
function sanitizeSaleData(sale: SaleRecord): Record<string, unknown> {
  return {
    id: sale.id,
    saleId: sale.saleId ?? sale.transactionId,
    items: sale.items,
    subtotal: sale.subtotal,
    tax: sale.tax,
    total: sale.total,
    paymentMethod: sale.paymentMethod,
    paymentStatus: sale.paymentStatus ?? 'completed',
    transactionId: sale.transactionId,
    date: sale.date ?? sale.createdAt,
    createdAt: sale.createdAt,
    customerName: sale.customerName,
    notes: sale.notes,
  };
}

/**
 * Registra creación de venta → transacción con hash
 */
export async function recordSaleCreation(sale: SaleRecord): Promise<void> {
  const transactions = loadTransactions();
  const blocks = loadBlocks();

  const saleId = sale.saleId ?? sale.id ?? sale.transactionId ?? `sale-${Date.now()}`;
  const id = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const timestamp = new Date().toISOString();

  const txData: Omit<Transaction, 'hash'> = {
    id,
    saleId: typeof saleId === 'string' ? parseInt(saleId.replace(/\D/g, '') || '0', 10) || Date.now() : saleId,
    action: 'create',
    timestamp,
    data: sanitizeSaleData(sale),
  };

  const hash = await generateTransactionHash(txData);
  const transaction: Transaction = { ...txData, hash };
  transactions.push(transaction);
  saveData(transactions, blocks);
}

/**
 * Registra edición de venta
 */
export async function recordSaleUpdate(
  saleId: string,
  updatedSale: SaleRecord,
  previousSale: SaleRecord
): Promise<void> {
  const transactions = loadTransactions();
  const blocks = loadBlocks();

  const id = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const timestamp = new Date().toISOString();

  const txData: Omit<Transaction, 'hash'> = {
    id,
    saleId: parseInt(saleId.replace(/\D/g, '') || '0', 10) || Date.now(),
    action: 'update',
    timestamp,
    data: sanitizeSaleData(updatedSale),
    previousData: sanitizeSaleData(previousSale),
  };

  const hash = await generateTransactionHash(txData);
  transactions.push({ ...txData, hash });
  saveData(transactions, blocks);
}

/**
 * Registra eliminación de venta
 */
export async function recordSaleDeletion(saleId: string, deletedSale: SaleRecord): Promise<void> {
  const transactions = loadTransactions();
  const blocks = loadBlocks();

  const id = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const timestamp = new Date().toISOString();

  const txData: Omit<Transaction, 'hash'> = {
    id,
    saleId: parseInt(saleId.replace(/\D/g, '') || '0', 10) || Date.now(),
    action: 'delete',
    timestamp,
    data: sanitizeSaleData(deletedSale),
  };

  const hash = await generateTransactionHash(txData);
  transactions.push({ ...txData, hash });
  saveData(transactions, blocks);
}

/**
 * Genera bloque diario con Merkle root y proofs
 * Cooldown: 1h entre generaciones
 */
export async function generateDailyBlock(date?: string): Promise<DailyBlock | null> {
  const lastGen = storage.get<number>(STORAGE_KEYS.LAST_BLOCK_GENERATION);
  if (lastGen && Date.now() - lastGen < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastGen)) / 60000);
    throw new Error(`Cooldown activo. Espera ${remaining} minutos.`);
  }

  const targetDate = date ?? new Date().toISOString().split('T')[0];
  const transactions = loadTransactions();
  const blocks = loadBlocks();

  const dayTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.timestamp).toISOString().split('T')[0];
    return txDate === targetDate;
  });

  const blockedTxIds = new Set<string>();
  blocks.forEach((b) => b.transactions.forEach((t) => blockedTxIds.add(t.id)));
  const unblocked = dayTransactions.filter((tx) => !blockedTxIds.has(tx.id));

  if (unblocked.length === 0) {
    throw new Error('No hay transacciones sin bloquear para esta fecha.');
  }

  const lastBlock = blocks.length > 0 ? blocks[blocks.length - 1] : null;
  const previousBlockHash = lastBlock ? lastBlock.blockHash : null;

  const newBlock = await createDailyBlock(targetDate, unblocked, previousBlockHash);

  const { tree } = await buildMerkleTree(unblocked);
  const blocksWithProofs = newBlock.transactions.map((tx) => ({
    ...tx,
    merkleProof: generateMerkleProof(tx.hash, unblocked, tree).proof,
  }));

  const blockWithProofs: DailyBlock = {
    ...newBlock,
    transactions: blocksWithProofs,
  };

  blocks.push(blockWithProofs);
  storage.set(STORAGE_KEYS.LAST_BLOCK_GENERATION, Date.now());
  saveData(transactions, blocks);

  return blockWithProofs;
}

/**
 * Datos Merkle para sincronizar venta con API
 */
export interface MerkleDataForSale {
  transactionId: string;
  transactionHash: string;
  merkleProof: string[];
  blockId?: string;
  blockHash?: string;
  merkleRoot?: string;
}

export function getMerkleDataForSale(saleId: string): MerkleDataForSale | null {
  const transactions = loadTransactions();
  const blocks = loadBlocks();

  const tx = transactions.find(
    (t) =>
      String(t.saleId) === String(saleId) ||
      (t.data as Record<string, unknown>)?.saleId === saleId ||
      (t.data as Record<string, unknown>)?.transactionId === saleId
  );
  if (!tx) return null;

  const block = blocks.find((b) => b.transactions.some((t) => t.id === tx.id));
  if (!block) return null;

  const txInBlock = block.transactions.find((t) => t.id === tx.id);
  const proof = (txInBlock as Transaction & { merkleProof?: string[] })?.merkleProof ?? [];

  return {
    transactionId: tx.id,
    transactionHash: tx.hash,
    merkleProof: proof,
    blockId: block.id,
    blockHash: block.blockHash,
    merkleRoot: block.merkleRoot,
  };
}

export function getDailyBlocks(): DailyBlock[] {
  return loadBlocks();
}

export function getTransactions(): Transaction[] {
  return loadTransactions();
}

export async function verifyTransaction(transactionId: string): Promise<boolean> {
  const blocks = loadBlocks();
  let transaction: Transaction | undefined;
  let block: DailyBlock | undefined;

  for (const b of blocks) {
    transaction = b.transactions.find((t) => t.id === transactionId);
    if (transaction) {
      block = b;
      break;
    }
  }
  if (!transaction || !block) return false;

  const { tree } = await buildMerkleTree(block.transactions);
  const proof = generateMerkleProof(transaction.hash, block.transactions, tree);
  return verifyMerkleProof(proof);
}

export async function verifyChainIntegrityService(): Promise<{ valid: boolean; errors: string[] }> {
  const blocks = loadBlocks();
  return verifyChainIntegrity(blocks);
}

export function getLastBlockGeneration(): number | null {
  return storage.get<number>(STORAGE_KEYS.LAST_BLOCK_GENERATION);
}

export function getBlocksSentToServer(): string[] {
  return storage.get<string[]>(STORAGE_KEYS.BLOCKS_SENT) ?? [];
}

export function markBlockSent(blockId: string): void {
  const sent = getBlocksSentToServer();
  if (!sent.includes(blockId)) {
    sent.push(blockId);
    storage.set(STORAGE_KEYS.BLOCKS_SENT, sent);
  }
}
