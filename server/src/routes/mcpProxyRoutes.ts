/**
 * Proxy para API de bizneai.com - evita CORS en desarrollo (localhost)
 */
import express from 'express';
import axios from 'axios';
import { appendMerkleLedgerBlock } from '../services/merkleLedgerStore.js';

const router = express.Router();
const BIZNEAI_ORIGIN = 'https://www.bizneai.com';

function sanitizeSaleBodyForLog(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const b = body as Record<string, unknown>;
  const out: Record<string, unknown> = { ...b };
  if (typeof out.customerEmail === 'string' && out.customerEmail) out.customerEmail = '[redacted-email]';
  if (typeof out.customerPhone === 'string' && out.customerPhone) out.customerPhone = '[redacted-phone]';
  return out;
}

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

    if (response.status >= 400) {
      console.error('[Sales Proxy] Upstream error', {
        targetUrl,
        status: response.status,
        data: response.data,
        requestBody: sanitizeSaleBodyForLog(req.body),
      });
    }
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

    if (response.status >= 400) {
      console.error('[MCP Proxy] Upstream error (sales)', {
        targetUrl,
        status: response.status,
        data: response.data,
        requestBody: sanitizeSaleBodyForLog(req.body),
      });
    }
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

/** POST /api/proxy/mcp/:shopId/luxae-telemetry — métricas Luxae para dashboard (POST /api/mcp/:shopId/luxae-telemetry) */
router.post('/mcp/:shopId/luxae-telemetry', async (req, res) => {
  const { shopId } = req.params;
  const targetUrl = `${BIZNEAI_ORIGIN}/api/mcp/${shopId}/luxae-telemetry`;

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
    console.error('[Luxae telemetry Proxy] Error forwarding to', targetUrl, message);
    res.status(502).json({
      success: false,
      error: message,
    });
  }
});

/** POST /api/proxy/mcp/:shopId/blocks/summary — resumen de bloques + LUX (POST /api/mcp/:shopId/blocks/summary) */
router.post('/mcp/:shopId/blocks/summary', async (req, res) => {
  const { shopId } = req.params;
  const targetUrl = `${BIZNEAI_ORIGIN}/api/mcp/${shopId}/blocks/summary`;
  try {
    const response = await axios.post(targetUrl, req.body, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 15000,
      validateStatus: () => true,
    });
    res.status(response.status).json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    console.error('[MCP blocks/summary POST]', message);
    res.status(502).json({ success: false, error: message });
  }
});

/** POST /api/proxy/blocks/:shopId - Proxy para enviar bloque diario (POST /api/mcp/:shopId/blocks) */
router.post('/blocks/:shopId', async (req, res) => {
  const { shopId } = req.params;
  const targetUrl = `${BIZNEAI_ORIGIN}/api/mcp/${shopId}/blocks`;

  try {
    if (req.body && typeof req.body === 'object') {
      appendMerkleLedgerBlock(shopId, req.body as Record<string, unknown>);
    }
  } catch (e) {
    console.warn('[Blocks Proxy] ledger local:', e);
  }

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
  'customers',
  'inventory/history',
  'inventory/low-stock',
  'inventory/status',
  'products',
  'purchase-orders',
  'reports/consignment',
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

/** POST /api/proxy/mcp/:shopId/purchase-orders — crear orden de compra (proveedor) */
router.post('/mcp/:shopId/purchase-orders', async (req, res) => {
  const { shopId } = req.params;
  const targetUrl = `${BIZNEAI_ORIGIN}/api/mcp/${shopId}/purchase-orders`;
  try {
    const response = await axios.post(targetUrl, req.body, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 15000,
      validateStatus: () => true,
    });
    res.status(response.status).json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    console.error('[Purchase Orders POST]', message);
    res.status(502).json({ success: false, error: message });
  }
});

/** POST /api/proxy/mcp/:shopId/purchase-orders/:orderId/receive — recibir ítems de una orden */
router.post('/mcp/:shopId/purchase-orders/:orderId/receive', async (req, res) => {
  const { shopId, orderId } = req.params;
  const targetUrl = `${BIZNEAI_ORIGIN}/api/mcp/${shopId}/purchase-orders/${encodeURIComponent(orderId)}/receive`;
  try {
    const response = await axios.post(targetUrl, req.body, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 15000,
      validateStatus: () => true,
    });
    res.status(response.status).json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    console.error('[Purchase Orders receive POST]', message);
    res.status(502).json({ success: false, error: message });
  }
});

/** POST /api/proxy/mcp/:shopId/customers — alta de cliente MCP */
router.post('/mcp/:shopId/customers', async (req, res) => {
  const { shopId } = req.params;
  const targetUrl = `${BIZNEAI_ORIGIN}/api/mcp/${shopId}/customers`;
  try {
    const response = await axios.post(targetUrl, req.body, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 15000,
      validateStatus: () => true,
    });
    res.status(response.status).json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    console.error('[MCP customers POST]', message);
    res.status(502).json({ success: false, error: message });
  }
});

/** PUT /api/proxy/mcp/:shopId/customers/:customerId — actualización MCP */
router.put('/mcp/:shopId/customers/:customerId', async (req, res) => {
  const { shopId, customerId } = req.params;
  const targetUrl = `${BIZNEAI_ORIGIN}/api/mcp/${shopId}/customers/${encodeURIComponent(customerId)}`;
  try {
    const response = await axios.put(targetUrl, req.body, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 15000,
      validateStatus: () => true,
    });
    res.status(response.status).json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    console.error('[MCP customers PUT]', message);
    res.status(502).json({ success: false, error: message });
  }
});

/**
 * PUT /api/proxy/mcp/:shopId/products/:productId — actualización de producto MCP
 * (usado hoy solo para marcar/editar datos de consignación: isConsignment,
 * consignmentSupplier, consignmentUnitCost, consignmentNotes; el editor local
 * de ProductManagement.tsx sigue siendo solo-local para el resto de campos).
 */
router.put('/mcp/:shopId/products/:productId', async (req, res) => {
  const { shopId, productId } = req.params;
  const targetUrl = `${BIZNEAI_ORIGIN}/api/mcp/${shopId}/products/${encodeURIComponent(productId)}`;
  try {
    const response = await axios.put(targetUrl, req.body, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 15000,
      validateStatus: () => true,
    });
    res.status(response.status).json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    console.error('[MCP products PUT]', message);
    res.status(502).json({ success: false, error: message });
  }
});

/**
 * POST /api/proxy/fx/validate-coupon - Proxy para validar cupón DameCodigo (sin canjear).
 * El endpoint real es /api/fx/validate-coupon; /api/discount-qr/verify (nombre anterior
 * de esta ruta) nunca existió en el backend — corregido aquí.
 */
router.post('/fx/validate-coupon', async (req, res) => {
  const targetUrl = `${BIZNEAI_ORIGIN}/api/fx/validate-coupon`;

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

/**
 * POST /api/proxy/fx/redeem-coupon - Proxy para canjear cupón DameCodigo.
 * Debe llamarse una sola vez, después de que el pago de la venta fue aceptado.
 */
router.post('/fx/redeem-coupon', async (req, res) => {
  const targetUrl = `${BIZNEAI_ORIGIN}/api/fx/redeem-coupon`;

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

/** POST /api/proxy/mcp/:shopId/cash-register/open - Abrir sesión de caja */
router.post('/mcp/:shopId/cash-register/open', async (req, res) => {
  const { shopId } = req.params;
  const targetUrl = `${BIZNEAI_ORIGIN}/api/mcp/${shopId}/cash-register/open`;
  try {
    const response = await axios.post(targetUrl, req.body, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 15000,
      validateStatus: () => true,
    });
    res.status(response.status).json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    console.error('[Cash Register open POST]', message);
    res.status(502).json({ success: false, error: message });
  }
});

/** POST /api/proxy/mcp/:shopId/cash-register/close - Cerrar sesión de caja activa */
router.post('/mcp/:shopId/cash-register/close', async (req, res) => {
  const { shopId } = req.params;
  const targetUrl = `${BIZNEAI_ORIGIN}/api/mcp/${shopId}/cash-register/close`;
  try {
    const response = await axios.post(targetUrl, req.body, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 15000,
      validateStatus: () => true,
    });
    res.status(response.status).json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    console.error('[Cash Register close POST]', message);
    res.status(502).json({ success: false, error: message });
  }
});

/** POST /api/proxy/mcp/:shopId/cash-register/movements - Registrar movimiento de efectivo */
router.post('/mcp/:shopId/cash-register/movements', async (req, res) => {
  const { shopId } = req.params;
  const targetUrl = `${BIZNEAI_ORIGIN}/api/mcp/${shopId}/cash-register/movements`;
  try {
    const response = await axios.post(targetUrl, req.body, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 15000,
      validateStatus: () => true,
    });
    res.status(response.status).json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    console.error('[Cash Register movements POST]', message);
    res.status(502).json({ success: false, error: message });
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

/**
 * Passthrough a https://www.bizneai.com/api/... (waitlist, etc.).
 * GET/POST /api/proxy/bizneai/waitlist?shopId= → https://www.bizneai.com/api/waitlist?shopId=
 * El cliente POS usa esto en localhost/Electron para evitar CORS; el upstream sigue siendo www.bizneai.com.
 */
router.use('/bizneai', async (req, res) => {
  const suffix = req.url.startsWith('/') ? req.url : `/${req.url}`;
  const targetUrl = `${BIZNEAI_ORIGIN}/api${suffix}`;

  try {
    const response = await axios({
      method: req.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      url: targetUrl,
      data: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : req.body,
      headers: {
        'Content-Type': (req.headers['content-type'] as string) || 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
      validateStatus: () => true,
    });

    res.status(response.status).json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    console.error('[BizneAI API passthrough] Error forwarding to', targetUrl, message);
    res.status(502).json({
      success: false,
      error: message,
    });
  }
});

export default router;
