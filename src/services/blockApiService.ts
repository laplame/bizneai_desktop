/**
 * Block API Service - Envía bloques diarios al servidor
 * POST /api/mcp/:shopId/blocks (o /api/:shopId/blocks según API)
 * @see # Merkle Tree Sales – Lógica Completa y .md
 */

import { getShopId } from '../utils/shopIdHelper';
import { getLocalApiOrigin, shouldUseSalesMcpProxy } from '../utils/localApiBase';
import { DailyBlock } from '../utils/merkleTree';
import { getDailyBlocks, getBlocksSentToServer, markBlockSent } from './merkleTreeService';

const getApiOrigin = (): string => 'https://www.bizneai.com';

/** Payload para POST /api/mcp/:shopId/blocks - formato esperado por la API */
export interface BlockPayload {
  id: string;
  date: string;
  merkleRoot: string;
  blockHash: string;
  previousBlockHash: string | null;
  transactionCount: number;
  unixTime: number;
  createdAt: string;
  transactions: Array<{
    id: string;
    type: string;
    saleId: string;
    hash: string;
    merkleProof: string[];
    timestamp: string;
  }>;
}

function blockToPayload(block: DailyBlock): BlockPayload {
  return {
    id: block.id,
    date: block.date,
    merkleRoot: block.merkleRoot,
    blockHash: block.blockHash,
    previousBlockHash: block.previousBlockHash,
    transactionCount: block.transactions.length,
    unixTime: Math.floor(new Date(block.createdAt).getTime() / 1000),
    createdAt: block.createdAt,
    transactions: block.transactions.map((t) => ({
      id: t.id,
      type: t.action,
      saleId: String(t.saleId),
      hash: t.hash,
      merkleProof: t.merkleProof ?? [],
      timestamp: t.timestamp,
    })),
  };
}

/**
 * Envía un bloque al servidor
 */
export async function sendBlockToServer(block: DailyBlock): Promise<{ success: boolean; error?: string }> {
  const shopId = getShopId();
  if (!shopId) {
    return { success: false, error: 'Shop ID no configurado' };
  }

  const url = shouldUseSalesMcpProxy()
    ? `${getLocalApiOrigin()}/api/proxy/blocks/${shopId}`
    : `${getApiOrigin()}/api/mcp/${shopId}/blocks`;

  const payload = blockToPayload(block);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error || err?.message || err?.details || `Error ${response.status}`;
      console.warn('[BlockAPI] Respuesta API:', {
        status: response.status,
        error: msg,
        details: err?.details ?? err,
      });
      return { success: false, error: typeof msg === 'string' ? msg : JSON.stringify(msg) };
    }

    markBlockSent(block.id);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error de conexión';
    return { success: false, error: message };
  }
}

/**
 * Sincroniza bloques no enviados al abrir Sales
 */
export async function syncUnsentBlocksToServer(): Promise<{ sent: number; failed: number }> {
  const blocks = getDailyBlocks();
  const sentIds = new Set(getBlocksSentToServer());
  const unsent = blocks.filter((b) => !sentIds.has(b.id));

  let sent = 0;
  let failed = 0;

  for (const block of unsent) {
    const result = await sendBlockToServer(block);
    if (result.success) {
      sent++;
    } else {
      failed++;
      console.warn('[BlockAPI] Envío fallido:', block.id, result.error);
    }
  }

  return { sent, failed };
}
