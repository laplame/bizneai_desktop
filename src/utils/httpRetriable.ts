/**
 * Clasifica una falla de red/HTTP como reintentable (sin conexión, timeout,
 * rate limit, error del servidor) o no (validación, 404, etc. — reintentar
 * no cambiaría el resultado). Mismo criterio que ya usaba `src/api/sales.ts`
 * para su cola de reintentos; centralizado para reusarlo en cualquier
 * feature que necesite guardar local + sincronizar después.
 */
export function isRetriableHttpStatus(status: number): boolean {
  if (status === 408 || status === 429) return true;
  return status >= 500;
}

/** true si el fetch ni siquiera obtuvo respuesta (offline, DNS, timeout de red). */
export function isNetworkFailure(err: unknown): boolean {
  return err instanceof TypeError || (err instanceof Error && err.name === 'AbortError');
}
