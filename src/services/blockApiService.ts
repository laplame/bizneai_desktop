/**
 * Block API Service - Envía bloques diarios al servidor
 * POST /api/mcp/:shopId/blocks (o /api/:shopId/blocks según API)
 * @see # Merkle Tree Sales – Lógica Completa y .md
 */

import { getShopId } from '../utils/shopIdHelper';
import { getLocalApiOrigin, shouldUseSalesMcpProxy } from '../utils/localApiBase';
import { DailyBlock } from '../utils/merkleTree';
import { getDailyBlocks, getBlocksSentToServer, markBlockSent } from './merkleTreeService';
import {
  buildLuxaeApiPayload,
  buildLuxaeTelemetryBody,
  loadLuxaeState,
  getDisplayLuxaeTotal,
  recordLuxaeForMerkleBlock,
  settlementForBlockPayload,
  type LuxaeApiPayload,
} from './merkleLuxaeService';

/** Body para POST /api/mcp/:shopId/blocks/summary (coerción numérica en servidor). */
export interface BlocksSummaryPayload {
  totalBlocks: number;
  totalSalesInBlocks: number;
  totalLuxae: number;
  blocks: Array<{
    id: string;
    date: string;
    transactionCount: number;
    luxaeEarned: number;
  }>;
  sourceDeviceId?: string;
  clientTimestampUnixMs?: number;
}

export function buildBlocksSummaryPayload(): BlocksSummaryPayload | null {
  const blocks = getDailyBlocks();
  if (blocks.length === 0) return null;
  const rows = blocks.map((b) => {
    const transactionCount = b.transactions.length;
    const luxaeEarned = typeof b.luxaeEarned === 'number' && Number.isFinite(b.luxaeEarned) ? b.luxaeEarned : 0;
    return { id: b.id, date: b.date, transactionCount, luxaeEarned };
  });
  const totalSalesInBlocks = rows.reduce((s, r) => s + r.transactionCount, 0);
  const totalLuxae = Math.max(
    getDisplayLuxaeTotal(),
    rows.reduce((s, r) => s + r.luxaeEarned, 0)
  );
  return {
    totalBlocks: blocks.length,
    totalSalesInBlocks,
    totalLuxae,
    blocks: rows,
    sourceDeviceId: 'desktop',
    clientTimestampUnixMs: Date.now(),
  };
}

/**
 * Envía el resumen acumulado de bloques al MCP (tras generar/enviar bloques).
 * Errores de red o 4xx no bloquean el POS; se registran en consola.
 */
export async function sendBlocksSummaryToServer(): Promise<{ success: boolean; error?: string }> {
  const shopId = getShopId();
  if (!shopId) {
    return { success: false, error: 'Shop ID no configurado' };
  }
  const body = buildBlocksSummaryPayload();
  if (!body) {
    return { success: true };
  }

  const url = shouldUseSalesMcpProxy()
    ? `${getLocalApiOrigin()}/api/proxy/mcp/${shopId}/blocks/summary`
    : `${getApiOrigin()}/api/mcp/${shopId}/blocks/summary`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error || err?.message || `HTTP ${response.status}`;
      console.warn('[BlockAPI] blocks/summary:', msg);
      return { success: false, error: typeof msg === 'string' ? msg : JSON.stringify(msg) };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error de conexión';
    console.warn('[BlockAPI] blocks/summary fetch:', message);
    return { success: false, error: message };
  }
}

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
  /** Emisión Luxae para dashboard (bizneai.com). */
  luxae?: LuxaeApiPayload;
}

function blockToPayload(block: DailyBlock): BlockPayload {
  const opCount = block.transactions.length;
  const settlement = settlementForBlockPayload(
    block.id,
    opCount,
    block.luxaeEarned,
    block.luxaeIntensity
  );
  const cumulative = loadLuxaeState().cumulativeEarned;
  const luxae = buildLuxaeApiPayload(settlement, cumulative, block.id);

  return {
    id: block.id,
    date: block.date,
    merkleRoot: block.merkleRoot,
    blockHash: block.blockHash,
    previousBlockHash: block.previousBlockHash,
    transactionCount: opCount,
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
    luxae,
  };
}

/**
 * Telemetría Luxae para el dashboard (POST aparte; el bloque ya incluye `luxae` anidado).
 * No lanza: errores 404 u offline se ignoran.
 */
export async function sendLuxaeTelemetryToServer(): Promise<{ success: boolean; error?: string }> {
  const shopId = getShopId();
  if (!shopId) {
    return { success: false, error: 'Shop ID no configurado' };
  }

  const url = shouldUseSalesMcpProxy()
    ? `${getLocalApiOrigin()}/api/proxy/mcp/${shopId}/luxae-telemetry`
    : `${getApiOrigin()}/api/mcp/${shopId}/luxae-telemetry`;

  const body = buildLuxaeTelemetryBody();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error de conexión';
    return { success: false, error: message };
  }
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

  recordLuxaeForMerkleBlock(block.id, block.transactions.length);
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

  if (sent > 0) {
    void sendLuxaeTelemetryToServer().catch(() => {
      /* dashboard opcional */
    });
    void sendBlocksSummaryToServer().catch(() => {
      /* resumen MCP opcional */
    });
  }

  return { sent, failed };
}
