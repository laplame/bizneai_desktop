/**
 * Respuesta de GET /api/mcp/:shopId/methods (BizneAI).
 * El campo `methods` suele ser un mapa por verbo HTTP, no un array plano.
 */

/** Ejemplo de tienda documentada (Papelería Centro Histórico) — mismo formato que cualquier otro shopId. */
export const EXAMPLE_MCP_BASE_URL = 'https://www.bizneai.com/api/mcp/691a59f9529b1c88366b342c';

export function extractMcpMethodsField(body: unknown): unknown {
  if (!body || typeof body !== 'object') return [];
  const b = body as Record<string, unknown>;
  const inner = b.data;
  if (inner && typeof inner === 'object') {
    const m = (inner as Record<string, unknown>).methods;
    if (m != null) return m;
  }
  if (b.methods != null) return b.methods;
  return [];
}

/** Cuenta endpoints documentados: array plano o buckets GET/POST/PUT/PATCH/DELETE. */
export function getMcpMethodsEndpointCount(methods: unknown): number {
  if (methods == null) return 0;
  if (Array.isArray(methods)) return methods.length;
  if (typeof methods === 'object') {
    let n = 0;
    for (const v of Object.values(methods as Record<string, unknown>)) {
      if (Array.isArray(v)) n += v.length;
    }
    return n;
  }
  return 0;
}
