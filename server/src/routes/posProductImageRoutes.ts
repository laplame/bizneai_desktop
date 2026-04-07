/**
 * Descarga y sirve fotos de producto desde disco (API local) para uso offline en el POS.
 */
import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import net from 'net';
import { ensureBizneaiDataDir } from '../dataPaths';

const router = express.Router();

function productImagesDir(): string {
  const dir = path.join(ensureBizneaiDataDir(), 'product-images');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const FILE_NAME_RE = /^[a-f0-9]{24}\.(jpe?g|png|webp|gif)$/i;

function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h === '0.0.0.0') return true;
  const v = net.isIP(h);
  if (v === 4) {
    const p = h.split('.').map(Number);
    const [a, b] = p;
    if (a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
      return true;
    }
    return false;
  }
  if (v === 6) {
    const lower = h.toLowerCase();
    if (lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) {
      return true;
    }
  }
  return false;
}

function assertFetchableImageUrl(urlStr: string): URL {
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    throw new Error('invalid url');
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('bad protocol');
  }
  if (isBlockedHostname(u.hostname)) {
    throw new Error('blocked host');
  }
  return u;
}

function extFromContentType(ct: string): string {
  const c = ct.toLowerCase();
  if (c.includes('png')) return '.png';
  if (c.includes('webp')) return '.webp';
  if (c.includes('gif')) return '.gif';
  return '.jpg';
}

async function downloadOne(url: string): Promise<{ fileName: string }> {
  assertFetchableImageUrl(url);
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'BizneAI-POS-ImageCache/1.0' },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 8 * 1024 * 1024) {
    throw new Error('image too large');
  }
  const ct = res.headers.get('content-type') || '';
  const ext = extFromContentType(ct);
  const hash = crypto.createHash('sha256').update(url).digest('hex').slice(0, 24);
  const fileName = `${hash}${ext}`;
  const fp = path.join(productImagesDir(), fileName);
  await fs.promises.writeFile(fp, buf);
  return { fileName };
}

router.post('/product-images/cache', express.json({ limit: '4mb' }), async (req, res) => {
  const items = req.body?.items;
  if (!Array.isArray(items)) {
    return res.status(400).json({ ok: false, error: 'items debe ser un array' });
  }
  if (items.length > 600) {
    return res.status(400).json({ ok: false, error: 'máximo 600 imágenes por solicitud' });
  }

  const concurrency = 6;
  const results: { id: string; path: string | null; error?: string }[] = new Array(items.length);

  let cursor = 0;
  async function worker() {
    for (;;) {
      const i = cursor++;
      if (i >= items.length) return;
      const raw = items[i];
      const id = String(raw?.id ?? '').trim();
      const url = String(raw?.url ?? '').trim();
      if (!id || !url) {
        results[i] = { id: id || '?', path: null, error: 'id o url vacío' };
        continue;
      }
      try {
        const { fileName } = await downloadOne(url);
        results[i] = { id, path: `/api/pos/product-images/file/${fileName}` };
      } catch (e) {
        results[i] = { id, path: null, error: e instanceof Error ? e.message : String(e) };
      }
    }
  }

  try {
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
    res.json({ ok: true, results });
  } catch (e) {
    console.error('[product-images/cache]', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

router.get('/product-images/file/:name', (req, res) => {
  const name = path.basename(String(req.params.name || ''));
  if (!FILE_NAME_RE.test(name)) {
    return res.status(400).end();
  }
  const dir = productImagesDir();
  const fp = path.join(dir, name);
  const resolved = path.resolve(fp);
  const base = path.resolve(dir);
  const rel = path.relative(base, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return res.status(400).end();
  }
  if (!fs.existsSync(resolved)) {
    return res.status(404).end();
  }
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.sendFile(resolved);
});

export default router;
