/**
 * Proxy para API de bizneai.com - evita CORS en desarrollo (localhost)
 */
import express from 'express';
import axios from 'axios';

const router = express.Router();
const BIZNEAI_ORIGIN = 'https://www.bizneai.com';

/** POST /api/proxy/sales/:shopId - Proxy para Sales API principal (POST /api/:shopId/sales) */
router.post('/sales/:shopId', async (req, res) => {
  const { shopId } = req.params;
  const targetUrl = `${BIZNEAI_ORIGIN}/api/${shopId}/sales`;

  try {
    const response = await axios.post(targetUrl, req.body, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 15000,
      validateStatus: () => true,
    });

    res.status(response.status).json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    console.error('[Sales Proxy] Error forwarding to', targetUrl, message);
    res.status(502).json({
      success: false,
      error: message,
    });
  }
});

/** POST /api/proxy/mcp/:shopId/sales - Proxy para crear venta (MCP, legacy) */
router.post('/mcp/:shopId/sales', async (req, res) => {
  const { shopId } = req.params;
  const targetUrl = `${BIZNEAI_ORIGIN}/api/mcp/${shopId}/sales`;

  try {
    const response = await axios.post(targetUrl, req.body, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 15000,
      validateStatus: () => true,
    });

    res.status(response.status).json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    console.error('[MCP Proxy] Error forwarding to', targetUrl, message);
    res.status(502).json({
      success: false,
      error: message,
    });
  }
});

/** POST /api/proxy/blocks/:shopId - Proxy para enviar bloque diario (POST /api/mcp/:shopId/blocks) */
router.post('/blocks/:shopId', async (req, res) => {
  const { shopId } = req.params;
  const targetUrl = `${BIZNEAI_ORIGIN}/api/mcp/${shopId}/blocks`;

  try {
    const response = await axios.post(targetUrl, req.body, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 15000,
      validateStatus: () => true,
    });

    res.status(response.status).json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    console.error('[Blocks Proxy] Error forwarding to', targetUrl, message);
    res.status(502).json({
      success: false,
      error: message,
    });
  }
});

/** GET /api/proxy/mcp/:shopId - Proxy para datos del shop */
router.get('/mcp/:shopId', async (req, res) => {
  const { shopId } = req.params;
  const targetUrl = `${BIZNEAI_ORIGIN}/api/mcp/${shopId}`;

  try {
    const response = await axios.get(targetUrl, {
      headers: { Accept: 'application/json' },
      timeout: 10000,
      validateStatus: () => true,
    });

    res.status(response.status).json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    console.error('[MCP Proxy] Error forwarding to', targetUrl, message);
    res.status(502).json({
      success: false,
      error: message,
    });
  }
});

/** GET /api/proxy/mcp/:shopId/methods - Proxy para métodos MCP */
router.get('/mcp/:shopId/methods', async (req, res) => {
  const { shopId } = req.params;
  const targetUrl = `${BIZNEAI_ORIGIN}/api/mcp/${shopId}/methods`;

  try {
    const response = await axios.get(targetUrl, {
      headers: { Accept: 'application/json' },
      timeout: 10000,
      validateStatus: () => true,
    });

    res.status(response.status).json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    console.error('[MCP Proxy] Error forwarding to', targetUrl, message);
    res.status(502).json({
      success: false,
      error: message,
    });
  }
});

/** Subrutas GET de MCP (backup / informes). Query string se reenvía tal cual. */
const MCP_GET_SUBPATHS = [
  'analytics',
  'blocks/summary',
  'cash-register/sessions',
  'cash-register/status',
  'inventory/history',
  'inventory/low-stock',
  'inventory/status',
  'products',
  'purchase-orders',
  'sales/stats',
  'sales',
  'tickets/stats',
  'tickets',
] as const;

function registerMcpGetProxy(subpath: string) {
  router.get(`/mcp/:shopId/${subpath}`, async (req, res) => {
    const { shopId } = req.params;
    const qs = new URLSearchParams(req.query as Record<string, string>).toString();
    const targetUrl = `${BIZNEAI_ORIGIN}/api/mcp/${shopId}/${subpath}${qs ? `?${qs}` : ''}`;
    try {
      const response = await axios.get(targetUrl, {
        headers: { Accept: 'application/json' },
        timeout: 120000,
        validateStatus: () => true,
      });
      res.status(response.status).json(response.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Proxy error';
      console.error('[MCP GET Proxy]', subpath, message);
      res.status(502).json({
        success: false,
        error: message,
      });
    }
  });
}

for (const sub of MCP_GET_SUBPATHS) {
  registerMcpGetProxy(sub);
}

/** POST /api/proxy/discount-qr/verify - Proxy para verificar código QR de descuento */
router.post('/discount-qr/verify', async (req, res) => {
  const targetUrl = `${BIZNEAI_ORIGIN}/api/discount-qr/verify`;

  try {
    const response = await axios.post(targetUrl, req.body, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 10000,
      validateStatus: () => true,
    });

    res.status(response.status).json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    console.error('[Discount QR Proxy] Error forwarding to', targetUrl, message);
    res.status(502).json({
      success: false,
      error: message,
    });
  }
});

/** POST /api/proxy/shops/:shopId/roles/sync - Proxy para sincronizar roles */
router.post('/shops/:shopId/roles/sync', async (req, res) => {
  const { shopId } = req.params;
  const targetUrl = `${BIZNEAI_ORIGIN}/api/shops/${shopId}/roles/sync`;

  try {
    const response = await axios.post(targetUrl, req.body, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 15000,
      validateStatus: () => true,
    });

    res.status(response.status).json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    console.error('[Roles Proxy] Error forwarding to', targetUrl, message);
    res.status(502).json({
      success: false,
      error: message,
    });
  }
});

export default router;
