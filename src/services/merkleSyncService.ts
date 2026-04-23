/**
 * Sincronización Merkle POS ↔ API (push de bloques + lectura de cabecera / reconciliación).
 * - Ledger dev: GET `/api/merkle-ledger/:shopId/head` (Express del monorepo, hashes completos).
 * - MCP (BizneAI): GET `/api/mcp/:shopId/blocks/summary` — ver `docs/MERKLE_MCP_BACKEND_RECEPCION.md`.
 */

import { getLocalApiOrigin, shouldUseSalesMcpProxy } from '../utils/localApiBase';
import { getShopId } from '../utils/shopIdHelper';
import { buildMcpResourceUrl } from '../utils/mcpResourceUrl';
import type { DailyBlock } from '../utils/merkleTree';
import { getDailyBlocks } from './merkleTreeService';
import { syncUnsentBlocksToServer } from './blockApiService';
import { applyServerLuxaeTotal } from './merkleLuxaeService';

export interface MerkleHeadDto {
  shopId: string;
  lastBlockId: string | null;
  merkleRoot: string | null;
  previousBlockHash: string | null;
  blockHash: string | null;
  blockCount: number;
  updatedAt: string;
  /** `totalLuxae` del GET blocks/summary (tienda, todos los dispositivos) si la API lo envía. */
  totalLuxae?: number | null;
}

export type ReconcileStatus =
  | 'ok'
  | 'local_ahead'
  | 'remote_ahead'
  | 'diverged'
  | 'no_remote'
  | 'no_local';

export interface ReconcileResult {
  status: ReconcileStatus;
  message: string;
  remote: MerkleHeadDto | null;
  localLast: Pick<DailyBlock, 'id' | 'merkleRoot' | 'blockHash' | 'previousBlockHash'> | null;
}

/**
 * Si GET /api/merkle-ledger/.../head devuelve 404 (build sin ruta o otro host), dejamos de insistir
 * para no llenar la consola; MCP `blocks/summary` sigue siendo la fuente.
 */
const ledgerHead404ByShop = new Map<string, true>();

/** Llamar al cambiar de tienda si quieres volver a probar el ledger tras actualizar el servidor. */
export function clearMerkleLedgerHead404Cache(shopId?: string): void {
  if (shopId) ledgerHead404ByShop.delete(shopId);
  else ledgerHead404ByShop.clear();
}

/** GET /api/merkle-ledger/:shopId/head (solo cuando el POS usa el API local). */
export async function fetchMerkleLedgerHead(shopId: string): Promise<MerkleHeadDto | null> {
  if (!shouldUseSalesMcpProxy()) return null;
  if (ledgerHead404ByShop.has(shopId)) return null;
  const url = `${getLocalApiOrigin().replace(/\/$/, '')}/api/merkle-ledger/${encodeURIComponent(shopId)}/head`;
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (r.status === 404) {
      ledgerHead404ByShop.set(shopId, true);
      return null;
    }
    if (!r.ok) return null;
    const j = (await r.json()) as { success?: boolean; data?: MerkleHeadDto };
    if (j?.success && j.data) {
      ledgerHead404ByShop.delete(shopId);
      return j.data;
    }
    return null;
  } catch {
    return null;
  }
}

/** GET /api/merkle-ledger/:shopId/blocks?after= — para auditoría o futura fusión controlada. */
export async function fetchMerkleLedgerBlocksAfter(
  shopId: string,
  afterBlockId?: string
): Promise<{ records: unknown[]; count: number } | null> {
  if (!shouldUseSalesMcpProxy()) return null;
  const qs = afterBlockId ? `?after=${encodeURIComponent(afterBlockId)}` : '';
  const url = `${getLocalApiOrigin().replace(/\/$/, '')}/api/merkle-ledger/${encodeURIComponent(shopId)}/blocks${qs}`;
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    const j = (await r.json()) as { success?: boolean; data?: unknown[]; count?: number };
    if (!j?.success || !Array.isArray(j.data)) return null;
    return { records: j.data, count: typeof j.count === 'number' ? j.count : j.data.length };
  } catch {
    return null;
  }
}

function parseTotalLuxaeField(data: Record<string, unknown>): number | null {
  const raw = data.totalLuxae;
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(0, Math.floor(raw));
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null;
  }
  return null;
}

function sumRowsLuxaeEarned(rows: Record<string, unknown>[]): number {
  return Math.floor(
    rows.reduce((s, row) => {
      const le = row.luxaeEarned;
      const n = typeof le === 'number' ? le : typeof le === 'string' ? Number(le) : NaN;
      return s + (Number.isFinite(n) ? Math.max(0, n) : 0);
    }, 0)
  );
}

/** GET `/api/mcp/:shopId/blocks/summary` (proxy local o www.bizneai.com según `buildMcpResourceUrl`). */
export async function fetchMcpBlocksSummary(shopId: string): Promise<unknown | null> {
  const url = buildMcpResourceUrl(shopId, 'blocks/summary');
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

/**
 * Interpreta la respuesta de `blocks/summary` como cabecera para reconciliar.
 * Si los ítems de `blocks[]` no traen `merkleRoot`/`blockHash`, esos campos quedan en null (solo id + conteos).
 */
export function parseBlocksSummaryToHead(shopId: string, body: unknown): MerkleHeadDto | null {
  if (body == null || typeof body !== 'object') return null;
  const root = body as Record<string, unknown>;
  const data =
    root.data != null && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : root;
  const totalBlocks =
    typeof data.totalBlocks === 'number'
      ? data.totalBlocks
      : typeof data.totalBlocks === 'string'
        ? Number(data.totalBlocks)
        : 0;
  const blocksRaw = data.blocks;
  const updatedAt = new Date().toISOString();
  if (!Array.isArray(blocksRaw) || blocksRaw.length === 0) {
    const totalLuxae = parseTotalLuxaeField(data);
    return {
      shopId,
      lastBlockId: null,
      merkleRoot: null,
      previousBlockHash: null,
      blockHash: null,
      blockCount: Number.isFinite(totalBlocks) ? Math.max(0, totalBlocks) : 0,
      updatedAt,
      totalLuxae: totalLuxae ?? null,
    };
  }
  const rows = blocksRaw.filter((x): x is Record<string, unknown> => x != null && typeof x === 'object');
  rows.sort((a, b) => {
    const da = String(a.date ?? '');
    const db = String(b.date ?? '');
    if (da !== db) return da.localeCompare(db);
    return String(a.id ?? '').localeCompare(String(b.id ?? ''));
  });
  const tip = rows[rows.length - 1];
  const lastId = typeof tip.id === 'string' ? tip.id : tip.id != null ? String(tip.id) : null;
  const merkleRoot = typeof tip.merkleRoot === 'string' ? tip.merkleRoot : null;
  const blockHash = typeof tip.blockHash === 'string' ? tip.blockHash : null;
  const previousBlockHash =
    typeof tip.previousBlockHash === 'string'
      ? tip.previousBlockHash
      : tip.previousBlockHash === null
        ? null
        : null;
  const count = Number.isFinite(totalBlocks) && totalBlocks > 0 ? totalBlocks : rows.length;
  const fromField = parseTotalLuxaeField(data);
  const totalLuxae = fromField != null ? fromField : sumRowsLuxaeEarned(rows);
  return {
    shopId,
    lastBlockId: lastId,
    merkleRoot,
    previousBlockHash,
    blockHash,
    blockCount: count,
    updatedAt,
    totalLuxae,
  };
}

/**
 * Cabecera Merkle: en dev se fusiona ledger (hashes) + GET MCP `blocks/summary` (incl. totalLuxae tienda).
 * El resumen MCP se consulta siempre que haya proxy para alinear Luxae entre dispositivos.
 */
export async function fetchRemoteMerkleHead(shopId: string): Promise<MerkleHeadDto | null> {
  const useLedger = shouldUseSalesMcpProxy();
  const [rawSummary, ledger] = await Promise.all([
    fetchMcpBlocksSummary(shopId),
    useLedger ? fetchMerkleLedgerHead(shopId) : Promise.resolve(null),
  ]);
  const fromSummary = parseBlocksSummaryToHead(shopId, rawSummary);
  if (useLedger && ledger && (ledger.lastBlockId != null || ledger.blockCount > 0)) {
    return {
      ...ledger,
      totalLuxae: fromSummary?.totalLuxae ?? null,
    };
  }
  return fromSummary;
}

export function reconcileMerkleHead(localBlocks: DailyBlock[], remote: MerkleHeadDto | null): ReconcileResult {
  const localLast = localBlocks.length > 0 ? localBlocks[localBlocks.length - 1] : null;
  const localPick = localLast
    ? {
        id: localLast.id,
        merkleRoot: localLast.merkleRoot,
        blockHash: localLast.blockHash,
        previousBlockHash: localLast.previousBlockHash ?? null,
      }
    : null;

  if (!remote) {
    return {
      status: 'no_remote',
      message:
        'No se obtuvo cabecera: comprueba Shop ID (24 hex para MCP), red, y GET /api/mcp/:shopId/blocks/summary. En dev, el ledger /api/merkle-ledger también aplica.',
      remote: null,
      localLast: localPick,
    };
  }

  if (!remote.lastBlockId && remote.blockCount === 0) {
    if (!localLast) {
      return {
        status: 'ok',
        message: 'Sin bloques en este equipo ni en el ledger del servidor.',
        remote,
        localLast: null,
      };
    }
    return {
      status: 'local_ahead',
      message: 'Hay bloques en este POS; el ledger del servidor aún no tiene ninguno (usa Sincronizar para enviar).',
      remote,
      localLast: localPick,
    };
  }

  if (!localLast) {
    const remoteTip = remote.lastBlockId ? ` Punta remota: ${remote.lastBlockId}.` : '';
    return {
      status: 'remote_ahead',
      message:
        `En la API hay ${remote.blockCount} bloque(s) registrado(s) para esta tienda; este equipo aún no ha generado ningún bloque diario.${remoteTip} Cierra el día en Ventas e informes para generar un bloque, o continúa en un POS donde ya existan bloques locales.`,
      remote,
      localLast: null,
    };
  }

  const remoteHashesKnown = Boolean(remote.merkleRoot && remote.blockHash);
  const sameTipId = localLast.id === remote.lastBlockId;
  const sameCount = localBlocks.length === remote.blockCount;

  if (sameTipId && sameCount) {
    if (!remoteHashesKnown) {
      return {
        status: 'ok',
        message:
          'Último bloque (id y conteo) alineado con GET blocks/summary; el resumen MCP no incluye raíz/hash por bloque.',
        remote,
        localLast: localPick,
      };
    }
    if (localLast.merkleRoot === remote.merkleRoot && localLast.blockHash === remote.blockHash) {
      return {
        status: 'ok',
        message: 'Último bloque local coincide con el remoto (id, raíz y hash).',
        remote,
        localLast: localPick,
      };
    }
    return {
      status: 'diverged',
      message: 'Mismo id de bloque y conteo, pero distinto Merkle root o block hash (auditoría).',
      remote,
      localLast: localPick,
    };
  }

  if (sameTipId && !sameCount) {
    return {
      status: 'diverged',
      message: 'Mismo id de punta pero distinto número de bloques entre POS y remoto.',
      remote,
      localLast: localPick,
    };
  }

  if (localBlocks.length < remote.blockCount) {
    return {
      status: 'remote_ahead',
      message: 'El servidor tiene más bloques registrados que este POS.',
      remote,
      localLast: localPick,
    };
  }
  if (localBlocks.length > remote.blockCount) {
    return {
      status: 'local_ahead',
      message: 'Este POS tiene más bloques que el ledger del servidor; envía pendientes o revisa otro dispositivo.',
      remote,
      localLast: localPick,
    };
  }

  return {
    status: 'diverged',
    message: 'Misma cantidad de bloques pero distinta punta de cadena (ids distintos).',
    remote,
    localLast: localPick,
  };
}

/**
 * 1) Push de bloques no enviados (`POST /api/mcp/:shopId/blocks` vía proxy).
 * 2) Cabecera: ledger local dev o `GET /api/mcp/:shopId/blocks/summary`, y reconciliación.
 */
export async function runFullMerkleSync(): Promise<{
  push: { sent: number; failed: number };
  reconcile: ReconcileResult;
}> {
  const push = await syncUnsentBlocksToServer();
  const shopId = getShopId();
  const head = shopId ? await fetchRemoteMerkleHead(shopId) : null;
  if (head) applyServerLuxaeTotal(head.totalLuxae);
  const reconcile = reconcileMerkleHead(getDailyBlocks(), head);
  try {
    window.dispatchEvent(new CustomEvent('merkle-sync-finished', { detail: reconcile }));
  } catch {
    /* SSR / tests */
  }
  return { push, reconcile };
}
