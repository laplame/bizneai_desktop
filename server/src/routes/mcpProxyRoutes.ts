/**
 * Proxy para API MCP de bizneai.com - evita CORS en desarrollo (localhost)
 */
import express from 'express';
import axios from 'axios';

const router = express.Router();
const BIZNEAI_ORIGIN = 'https://www.bizneai.com';

/** POST /api/proxy/mcp/:shopId/sales - Proxy para crear venta */
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

export default router;
