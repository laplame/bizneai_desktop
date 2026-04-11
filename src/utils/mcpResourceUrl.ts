/**
 * URLs de subrecursos GET bajo /api/mcp/:shopId/…
 * En dev (localhost / file) usa proxy :3000 para evitar CORS.
 */

import { getLocalApiOrigin, shouldUseSalesMcpProxy } from './localApiBase';

const BIZNEAI_ORIGIN = 'https://www.bizneai.com';

export function buildMcpResourceUrl(
  shopId: string,
  resourcePath: string,
  searchParams?: Record<string, string | number | undefined>
): string {
  const path = resourcePath.replace(/^\/+/, '');
  const qs = new URLSearchParams();
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (v === undefined || v === '') continue;
      qs.set(k, String(v));
    }
  }
  const q = qs.toString();

  if (shouldUseSalesMcpProxy()) {
    return `${getLocalApiOrigin()}/api/proxy/mcp/${shopId}/${path}${q ? `?${q}` : ''}`;
  }
  return `${BIZNEAI_ORIGIN}/api/mcp/${shopId}/${path}${q ? `?${q}` : ''}`;
}
