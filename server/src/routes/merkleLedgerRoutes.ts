/**
 * Ledger Merkle local (GET head / GET blocks / POST bloque).
 * Montado en /api/merkle-ledger — usado por el POS vía getLocalApiOrigin() en dev.
 */
import express from 'express';
import { z } from 'zod';
import {
  appendMerkleLedgerBlock,
  getMerkleLedgerHead,
  listMerkleLedgerBlocks,
} from '../services/merkleLedgerStore.js';

const router = express.Router();

const shopParam = z.object({ shopId: z.string().min(1) });

router.get('/:shopId/head', (req, res) => {
  try {
    const { shopId } = shopParam.parse(req.params);
    res.json({ success: true, data: getMerkleLedgerHead(shopId) });
  } catch (e) {
    res.status(400).json({ success: false, error: e instanceof Error ? e.message : 'Bad request' });
  }
});

router.get('/:shopId/blocks', (req, res) => {
  try {
    const { shopId } = shopParam.parse(req.params);
    const after = typeof req.query.after === 'string' && req.query.after.trim() ? req.query.after.trim() : undefined;
    const blocks = listMerkleLedgerBlocks(shopId, after);
    res.json({ success: true, data: blocks, count: blocks.length });
  } catch (e) {
    res.status(400).json({ success: false, error: e instanceof Error ? e.message : 'Bad request' });
  }
});

router.post('/:shopId/blocks', (req, res) => {
  try {
    const { shopId } = shopParam.parse(req.params);
    const body = req.body as Record<string, unknown>;
    appendMerkleLedgerBlock(shopId, body);
    res.status(201).json({ success: true, message: 'Bloque almacenado en ledger local' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    res.status(400).json({ success: false, error: msg });
  }
});

export default router;
