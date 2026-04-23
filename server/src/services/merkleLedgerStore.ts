/**
 * Copia local de bloques Merkle enviados desde el POS (dev / respaldo / pull).
 * La API pública de BizneAI puede evolucionar; este ledger permite head/pull sin depender solo del upstream.
 */
import fs from 'fs';
import path from 'path';
import { ensureBizneaiDataDir } from '../dataPaths.js';

const DIRNAME = 'merkle-ledger';

export interface MerkleLedgerBlockRecord {
  id: string;
  date?: string;
  merkleRoot?: string;
  blockHash?: string;
  previousBlockHash?: string | null;
  transactionCount?: number;
  createdAt?: string;
  /** Payload completo tal cual lo envió el cliente. */
  payload: Record<string, unknown>;
  storedAt: string;
}

export interface MerkleLedgerFile {
  shopId: string;
  blocks: MerkleLedgerBlockRecord[];
  updatedAt: string;
}

function ledgerPath(shopId: string): string {
  const safe = String(shopId).replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(ensureBizneaiDataDir(), DIRNAME, `${safe}.json`);
}

function readLedger(shopId: string): MerkleLedgerFile {
  const p = ledgerPath(shopId);
  try {
    const raw = fs.readFileSync(p, 'utf8');
    const j = JSON.parse(raw) as MerkleLedgerFile;
    if (j && Array.isArray(j.blocks)) return j;
  } catch {
    /* missing */
  }
  return { shopId, blocks: [], updatedAt: new Date().toISOString() };
}

function writeLedger(shopId: string, data: MerkleLedgerFile): void {
  const p = ledgerPath(shopId);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

/** Añade un bloque si no existe ya (idempotente por `id`). */
export function appendMerkleLedgerBlock(shopId: string, body: Record<string, unknown>): void {
  const id = typeof body.id === 'string' ? body.id : body.id != null ? String(body.id) : '';
  if (!id) throw new Error('Block payload missing id');

  const ledger = readLedger(shopId);
  if (ledger.blocks.some((b) => b.id === id)) return;

  const rec: MerkleLedgerBlockRecord = {
    id,
    date: typeof body.date === 'string' ? body.date : undefined,
    merkleRoot: typeof body.merkleRoot === 'string' ? body.merkleRoot : undefined,
    blockHash: typeof body.blockHash === 'string' ? body.blockHash : undefined,
    previousBlockHash:
      typeof body.previousBlockHash === 'string'
        ? body.previousBlockHash
        : body.previousBlockHash === null
          ? null
          : undefined,
    transactionCount: typeof body.transactionCount === 'number' ? body.transactionCount : undefined,
    createdAt: typeof body.createdAt === 'string' ? body.createdAt : undefined,
    payload: body,
    storedAt: new Date().toISOString(),
  };
  ledger.blocks.push(rec);
  ledger.updatedAt = new Date().toISOString();
  writeLedger(shopId, ledger);
}

export function listMerkleLedgerBlocks(shopId: string, afterBlockId?: string): MerkleLedgerBlockRecord[] {
  const { blocks } = readLedger(shopId);
  if (!afterBlockId) return [...blocks];
  const idx = blocks.findIndex((b) => b.id === afterBlockId);
  if (idx === -1) return [...blocks];
  return blocks.slice(idx + 1);
}

export function getMerkleLedgerHead(shopId: string): {
  shopId: string;
  lastBlockId: string | null;
  merkleRoot: string | null;
  previousBlockHash: string | null;
  blockHash: string | null;
  blockCount: number;
  updatedAt: string;
} {
  const ledger = readLedger(shopId);
  const last = ledger.blocks.length > 0 ? ledger.blocks[ledger.blocks.length - 1] : null;
  return {
    shopId,
    lastBlockId: last?.id ?? null,
    merkleRoot: last?.merkleRoot ?? null,
    previousBlockHash: last?.previousBlockHash ?? null,
    blockHash: last?.blockHash ?? null,
    blockCount: ledger.blocks.length,
    updatedAt: ledger.updatedAt,
  };
}
