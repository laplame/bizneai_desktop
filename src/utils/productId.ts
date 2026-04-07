/**
 * Id estable para productos POS (coincide con hidratación en App y emparejado post-sync).
 */
export function normalizeProductId(rawId: unknown, fallbackIndex: number): number {
  if (typeof rawId === 'number' && Number.isFinite(rawId)) return rawId;

  if (typeof rawId === 'string') {
    const numeric = Number(rawId);
    if (Number.isFinite(numeric)) return numeric;

    let hash = 0;
    for (let i = 0; i < rawId.length; i++) {
      hash = (hash * 31 + rawId.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  return fallbackIndex + 1;
}
