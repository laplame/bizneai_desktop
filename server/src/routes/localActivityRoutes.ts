/**
 * Registro local de sesiones (bloqueo PIN) y ventas por cajero — SQLite (server/data/local-activity.db)
 */
import express from 'express';
import {
  insertSessionEvent,
  insertSaleCashierEvent,
  listSessionEvents,
  listSaleCashierEvents,
} from '../localActivityDb.js';

const router = express.Router();

router.post('/session', (req, res) => {
  try {
    const { shopId, eventType, source, role, name, email } = req.body || {};
    if (!shopId || typeof shopId !== 'string') {
      return res.status(400).json({ error: 'shopId requerido' });
    }
    if (!eventType || !['unlock', 'lock'].includes(String(eventType))) {
      return res.status(400).json({ error: 'eventType debe ser unlock o lock' });
    }
    if (!source || !['role', 'legacy', 'super'].includes(String(source))) {
      return res.status(400).json({ error: 'source debe ser role, legacy o super' });
    }
    const created_at = new Date().toISOString();
    const id = insertSessionEvent({
      shop_id: shopId,
      event_type: String(eventType),
      source: String(source),
      role: role != null ? String(role) : null,
      name: name != null ? String(name) : null,
      email: email != null ? String(email) : null,
      created_at,
    });
    res.status(201).json({ id, created_at });
  } catch (e) {
    console.error('[local-activity] session', e);
    res.status(500).json({ error: 'Error al guardar evento de sesión' });
  }
});

router.post('/sale', (req, res) => {
  try {
    const { shopId, transactionId, clientEventId, total, paymentMethod, itemsSummary, cashier } = req.body || {};
    if (!shopId || typeof shopId !== 'string') {
      return res.status(400).json({ error: 'shopId requerido' });
    }
    const totalNum = Number(total);
    if (!Number.isFinite(totalNum)) {
      return res.status(400).json({ error: 'total numérico requerido' });
    }
    const c = cashier || {};
    const created_at = new Date().toISOString();
    const id = insertSaleCashierEvent({
      shop_id: shopId,
      transaction_id: transactionId != null ? String(transactionId) : null,
      client_event_id: clientEventId != null ? String(clientEventId) : null,
      total: totalNum,
      payment_method: paymentMethod != null ? String(paymentMethod) : null,
      cashier_source: c.source != null ? String(c.source) : null,
      cashier_role: c.role != null ? String(c.role) : null,
      cashier_name: c.name != null ? String(c.name) : null,
      cashier_email: c.email != null ? String(c.email) : null,
      items_summary: itemsSummary != null ? String(itemsSummary).slice(0, 2000) : null,
      created_at,
    });
    res.status(201).json({ id, created_at });
  } catch (e) {
    console.error('[local-activity] sale', e);
    res.status(500).json({ error: 'Error al guardar venta (cajero)' });
  }
});

router.get('/sessions', (req, res) => {
  try {
    const shopId = String(req.query.shopId || '');
    if (!shopId) {
      return res.status(400).json({ error: 'shopId query requerido' });
    }
    const limit = Math.min(500, Math.max(1, parseInt(String(req.query.limit || '200'), 10) || 200));
    const rows = listSessionEvents(shopId, limit);
    res.json(rows);
  } catch (e) {
    console.error('[local-activity] list sessions', e);
    res.status(500).json({ error: 'Error al listar sesiones' });
  }
});

router.get('/sales', (req, res) => {
  try {
    const shopId = String(req.query.shopId || '');
    if (!shopId) {
      return res.status(400).json({ error: 'shopId query requerido' });
    }
    const limit = Math.min(500, Math.max(1, parseInt(String(req.query.limit || '200'), 10) || 200));
    const rows = listSaleCashierEvents(shopId, limit);
    res.json(rows);
  } catch (e) {
    console.error('[local-activity] list sales', e);
    res.status(500).json({ error: 'Error al listar ventas por cajero' });
  }
});

export default router;
