/** Última ejecución por lote MCP (`bizneai-mcp-batch-sync-at`). */

const MCP_BATCH_AT = 'bizneai-mcp-batch-sync-at';

export function getMcpBatchMap(): Record<string, number> {
  try {
    const r = localStorage.getItem(MCP_BATCH_AT);
    if (!r) return {};
    const o = JSON.parse(r) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function getMcpBatchSyncedAt(batchId: string): number | null {
  const v = getMcpBatchMap()[batchId];
  return typeof v === 'number' ? v : null;
}

export function setMcpBatchSyncedAt(batchId: string, t: number = Date.now()): void {
  const m = getMcpBatchMap();
  m[batchId] = t;
  try {
    localStorage.setItem(MCP_BATCH_AT, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

export function isMcpBatchDue(batchId: string, intervalMs: number): boolean {
  if (intervalMs <= 0) return true;
  const last = getMcpBatchSyncedAt(batchId);
  if (last == null) return true;
  return Date.now() - last >= intervalMs;
}
