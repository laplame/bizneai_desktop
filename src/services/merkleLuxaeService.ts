import { getShopId } from '../utils/shopIdHelper';

/**
 * Luxae: emisión ligada al cierre de bloque Merkle (ventana ~1h por cooldown de bloque).
 * - Baja interacción: 1 luxae por bloque (equivale a 1/h si se genera un bloque por hora).
 * - Alta interacción: 2 luxae por bloque cuando las operaciones en el bloque superan el umbral.
 */

export const LUXAE_TOKEN = 'luxae' as const;

/** Operaciones en el bloque ≥ este número ⇒ intensidad "alta" (2 luxae en esa ventana). */
export const LUXAE_HIGH_OPS_THRESHOLD = 15;

export const LUXAE_LOW_PER_BLOCK = 1;
export const LUXAE_HIGH_PER_BLOCK = 2;

export type LuxaeIntensity = 'low' | 'high';

export interface LuxaeBlockSettlement {
  earned: number;
  intensity: LuxaeIntensity;
  /** Tasa efectiva asociada a esta ventana (1 u 2 luxae por hora de referencia). */
  ratePerHour: 1 | 2;
  operationsInBlock: number;
  highThreshold: number;
}

const STORAGE_KEY = 'bizneai-merkle-luxae-state';

export interface MerkleLuxaePersistedState {
  cumulativeEarned: number;
  /** IDs de bloque ya contabilizados (idempotencia). */
  appliedBlockIds: string[];
  lastBlockId?: string;
  lastEarned?: number;
  lastIntensity?: LuxaeIntensity;
  lastRatePerHour?: 1 | 2;
  lastOperationsInBlock?: number;
  lastSettlementAt?: string;
  /** Último `totalLuxae` del GET /api/mcp/.../blocks/summary (acumulado tienda / otros dispositivos). */
  lastServerTotalLuxae?: number;
  lastServerLuxaeAt?: string;
  /** Tienda a la que aplica `lastServerTotalLuxae` (evita mezclar totales al cambiar de shop). */
  lastServerLuxaeShopId?: string;
}

const MAX_APPLIED_IDS = 400;

function defaultState(): MerkleLuxaePersistedState {
  return { cumulativeEarned: 0, appliedBlockIds: [] };
}

export function loadLuxaeState(): MerkleLuxaePersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const p = JSON.parse(raw) as MerkleLuxaePersistedState;
    if (typeof p.cumulativeEarned !== 'number' || !Array.isArray(p.appliedBlockIds)) {
      return defaultState();
    }
    const lastSrv =
      typeof p.lastServerTotalLuxae === 'number' && Number.isFinite(p.lastServerTotalLuxae)
        ? Math.max(0, Math.floor(p.lastServerTotalLuxae))
        : undefined;
    return {
      ...defaultState(),
      ...p,
      cumulativeEarned: Math.max(0, p.cumulativeEarned),
      appliedBlockIds: p.appliedBlockIds.filter((x) => typeof x === 'string').slice(0, MAX_APPLIED_IDS),
      ...(lastSrv !== undefined ? { lastServerTotalLuxae: lastSrv } : {}),
      ...(typeof p.lastServerLuxaeAt === 'string' ? { lastServerLuxaeAt: p.lastServerLuxaeAt } : {}),
      ...(typeof p.lastServerLuxaeShopId === 'string' && p.lastServerLuxaeShopId.trim()
        ? { lastServerLuxaeShopId: p.lastServerLuxaeShopId.trim() }
        : {}),
    };
  } catch {
    return defaultState();
  }
}

function saveLuxaeState(s: MerkleLuxaePersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/**
 * Total Luxae a mostrar: máximo entre lo ganado en este dispositivo (bloques Merkle locales)
 * y el acumulado de tienda que reporta la API en `blocks/summary` (web / otros POS / móvil).
 */
export function getDisplayLuxaeTotal(): number {
  const s = loadLuxaeState();
  const local = s.cumulativeEarned;
  const shopId = getShopId();
  const srv =
    shopId &&
    s.lastServerLuxaeShopId === shopId &&
    s.lastServerTotalLuxae != null &&
    Number.isFinite(s.lastServerTotalLuxae)
      ? Math.max(0, Math.floor(s.lastServerTotalLuxae))
      : null;
  if (srv != null) {
    return Math.max(local, srv);
  }
  return local;
}

/** Persiste el total de tienda leído del resumen MCP (no reduce el acumulado local). */
export function applyServerLuxaeTotal(totalLuxae: number | null | undefined): void {
  const shopId = getShopId();
  if (!shopId) return;
  if (totalLuxae == null || !Number.isFinite(totalLuxae)) return;
  const v = Math.max(0, Math.floor(totalLuxae));
  let s = loadLuxaeState();
  if (s.lastServerLuxaeShopId != null && s.lastServerLuxaeShopId !== shopId) {
    s = {
      ...s,
      lastServerTotalLuxae: undefined,
      lastServerLuxaeAt: undefined,
      lastServerLuxaeShopId: undefined,
    };
  }
  if (s.lastServerTotalLuxae === v && s.lastServerLuxaeShopId === shopId) return;
  saveLuxaeState({
    ...s,
    lastServerTotalLuxae: v,
    lastServerLuxaeAt: new Date().toISOString(),
    lastServerLuxaeShopId: shopId,
  });
  try {
    window.dispatchEvent(new CustomEvent('merkle-luxae-updated'));
  } catch {
    /* ignore */
  }
}

export function computeLuxaeForBlock(operationCount: number): LuxaeBlockSettlement {
  const high = operationCount >= LUXAE_HIGH_OPS_THRESHOLD;
  const earned = high ? LUXAE_HIGH_PER_BLOCK : LUXAE_LOW_PER_BLOCK;
  return {
    earned,
    intensity: high ? 'high' : 'low',
    ratePerHour: high ? 2 : 1,
    operationsInBlock: operationCount,
    highThreshold: LUXAE_HIGH_OPS_THRESHOLD,
  };
}

/**
 * Acumula luxae por bloque (una sola vez por blockId).
 * Devuelve el estado actualizado y si fue nueva aplicación.
 */
export function recordLuxaeForMerkleBlock(
  blockId: string,
  operationCount: number
): { settlement: LuxaeBlockSettlement; cumulativeEarned: number; alreadyApplied: boolean } {
  const settlement = computeLuxaeForBlock(operationCount);
  const state = loadLuxaeState();
  if (state.appliedBlockIds.includes(blockId)) {
    return {
      settlement,
      cumulativeEarned: state.cumulativeEarned,
      alreadyApplied: true,
    };
  }
  const next: MerkleLuxaePersistedState = {
    cumulativeEarned: state.cumulativeEarned + settlement.earned,
    appliedBlockIds: [blockId, ...state.appliedBlockIds.filter((id) => id !== blockId)].slice(0, MAX_APPLIED_IDS),
    lastBlockId: blockId,
    lastEarned: settlement.earned,
    lastIntensity: settlement.intensity,
    lastRatePerHour: settlement.ratePerHour,
    lastOperationsInBlock: settlement.operationsInBlock,
    lastSettlementAt: new Date().toISOString(),
  };
  saveLuxaeState(next);
  try {
    window.dispatchEvent(new CustomEvent('merkle-luxae-updated'));
  } catch {
    /* ignore */
  }
  return { settlement, cumulativeEarned: next.cumulativeEarned, alreadyApplied: false };
}

/** Payload anidado para API (bloque Merkle o telemetría). */
export interface LuxaeApiPayload {
  token: typeof LUXAE_TOKEN;
  earnedThisBlock: number;
  intensity: LuxaeIntensity;
  ratePerHour: 1 | 2;
  cumulativeDevice: number;
  operationsInBlock: number;
  highThreshold: number;
  blockId?: string;
  settledAt: string;
}

export function buildLuxaeApiPayload(
  settlement: LuxaeBlockSettlement,
  cumulativeDevice: number,
  blockId?: string
): LuxaeApiPayload {
  return {
    token: LUXAE_TOKEN,
    earnedThisBlock: settlement.earned,
    intensity: settlement.intensity,
    ratePerHour: settlement.ratePerHour,
    cumulativeDevice,
    operationsInBlock: settlement.operationsInBlock,
    highThreshold: settlement.highThreshold,
    blockId,
    settledAt: new Date().toISOString(),
  };
}

/** Telemetría agregada para dashboard (POST dedicado). */
export interface LuxaeTelemetryBody {
  token: typeof LUXAE_TOKEN;
  source: 'bizneai-desktop-pos';
  cumulativeEarned: number;
  lastBlockId?: string;
  lastEarnedThisBlock?: number;
  lastIntensity?: LuxaeIntensity;
  lastRatePerHour?: 1 | 2;
  lastOperationsInBlock?: number;
  lastSettlementAt?: string;
  highThreshold: number;
  emittedAt: string;
}

export function buildLuxaeTelemetryBody(): LuxaeTelemetryBody {
  const s = loadLuxaeState();
  return {
    token: LUXAE_TOKEN,
    source: 'bizneai-desktop-pos',
    cumulativeEarned: s.cumulativeEarned,
    lastBlockId: s.lastBlockId,
    lastEarnedThisBlock: s.lastEarned,
    lastIntensity: s.lastIntensity,
    lastRatePerHour: s.lastRatePerHour,
    lastOperationsInBlock: s.lastOperationsInBlock,
    lastSettlementAt: s.lastSettlementAt,
    highThreshold: LUXAE_HIGH_OPS_THRESHOLD,
    emittedAt: new Date().toISOString(),
  };
}

/** Si el bloque no tiene metadatos luxae (bloques antiguos), calcula solo para el payload sin persistir. */
export function settlementForBlockPayload(
  blockId: string,
  operationCount: number,
  storedEarned?: number,
  storedIntensity?: LuxaeIntensity
): LuxaeBlockSettlement {
  if (storedEarned != null && storedIntensity != null) {
    return {
      earned: storedEarned,
      intensity: storedIntensity,
      ratePerHour: storedIntensity === 'high' ? 2 : 1,
      operationsInBlock: operationCount,
      highThreshold: LUXAE_HIGH_OPS_THRESHOLD,
    };
  }
  return computeLuxaeForBlock(operationCount);
}
