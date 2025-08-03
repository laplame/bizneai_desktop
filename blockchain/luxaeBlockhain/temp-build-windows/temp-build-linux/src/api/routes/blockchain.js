import { Router } from 'express';

export const blockchainRoutes = (blockchain) => {
    const router = Router();

    /**
     * @swagger
     * /api/blockchain/info:
     *   get:
     *     summary: Obtener información de la blockchain
     */
    router.get('/info', (req, res) => {
        const info = {
            blocks: blockchain.chain.length,
            lastBlock: blockchain.getLatestBlock(),
            pendingTransactions: blockchain.pendingTransactions.length,
            validators: blockchain.participants.length
        };
        res.json(info);
    });

    /**
     * @swagger
     * /api/blockchain/blocks:
     *   get:
     *     summary: Obtener todos los bloques
     */
    router.get('/blocks', (req, res) => {
        res.json(blockchain.chain);
    });

    /**
     * @swagger
     * /api/blockchain/blocks/{height}:
     *   get:
     *     summary: Obtener un bloque específico
     */
    router.get('/blocks/:height', (req, res) => {
        const height = parseInt(req.params.height);
        if (height >= blockchain.chain.length) {
            return res.status(404).json({ error: 'Block not found' });
        }
        res.json(blockchain.chain[height]);
    });

    return router;
}; 