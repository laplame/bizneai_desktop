/**
 * Generación local de wallet Polygon (EVM) para USDLXE — misma familia de
 * direcciones que Ethereum/MetaMask (0x + 40 hex), compatible con Polygon PoS.
 * La frase mnemónica se cifra en disco (ver localSecretsStore.ts) y solo se
 * devuelve en texto claro al generar (para respaldo) o al pedir explícitamente
 * "revelar" — nunca se expone en listados generales.
 */
import express from 'express';
import { Wallet } from 'ethers';
import { writeLocalSecretRecord, readLocalSecretRecord, deleteLocalSecretRecord } from '../services/localSecretsStore.js';

const router = express.Router();

function secretName(shopId: string): string {
  return `polygon-wallet-${shopId}`;
}

interface PolygonWalletRecord {
  address: string;
  mnemonic: string;
  createdAt: string;
}

/** POST /api/local/crypto-wallet/:shopId/generate-polygon — genera y guarda una wallet nueva. */
router.post('/:shopId/generate-polygon', async (req, res) => {
  try {
    const { shopId } = req.params;
    if (!shopId) {
      return res.status(400).json({ success: false, error: 'shopId requerido' });
    }
    const existing = readLocalSecretRecord<PolygonWalletRecord>(secretName(shopId));
    if (existing?.address && !req.body?.force) {
      return res.status(409).json({
        success: false,
        error: 'ALREADY_EXISTS',
        data: { address: existing.address },
      });
    }
    const wallet = Wallet.createRandom();
    const mnemonic = wallet.mnemonic?.phrase;
    if (!mnemonic) {
      return res.status(500).json({ success: false, error: 'NO_MNEMONIC' });
    }
    const record: PolygonWalletRecord = {
      address: wallet.address,
      mnemonic,
      createdAt: new Date().toISOString(),
    };
    writeLocalSecretRecord(secretName(shopId), record);
    res.json({ success: true, data: { address: wallet.address, mnemonic } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error generando wallet';
    console.error('[CryptoWallet] generate-polygon:', message);
    res.status(500).json({ success: false, error: message });
  }
});

/** GET /api/local/crypto-wallet/:shopId/polygon — solo la dirección (nunca la frase). */
router.get('/:shopId/polygon', async (req, res) => {
  const { shopId } = req.params;
  const record = readLocalSecretRecord<PolygonWalletRecord>(secretName(shopId));
  if (!record) {
    return res.json({ success: true, data: null });
  }
  res.json({ success: true, data: { address: record.address, createdAt: record.createdAt } });
});

/** POST /api/local/crypto-wallet/:shopId/reveal-mnemonic — muestra la frase de nuevo bajo demanda. */
router.post('/:shopId/reveal-mnemonic', async (req, res) => {
  const { shopId } = req.params;
  const record = readLocalSecretRecord<PolygonWalletRecord>(secretName(shopId));
  if (!record) {
    return res.status(404).json({ success: false, error: 'No hay wallet generada para esta tienda' });
  }
  res.json({ success: true, data: { address: record.address, mnemonic: record.mnemonic } });
});

/** DELETE /api/local/crypto-wallet/:shopId/polygon — borra la wallet local (no revoca fondos en cadena). */
router.delete('/:shopId/polygon', async (req, res) => {
  const { shopId } = req.params;
  deleteLocalSecretRecord(secretName(shopId));
  res.json({ success: true });
});

export default router;
