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
        try {
            const info = {
                blocks: blockchain.chain.length,
                lastBlock: blockchain.getLatestBlock(),
                pendingTransactions: blockchain.pendingTransactions.length,
                validators: blockchain.validators ? blockchain.validators.size : 0
            };
            res.json(info);
        } catch (error) {
            console.error('Error in blockchain info:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/blockchain/blocks:
     *   get:
     *     summary: Obtener todos los bloques
     */
    router.get('/blocks', (req, res) => {
        try {
            res.json(blockchain.chain);
        } catch (error) {
            console.error('Error getting blocks:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/blockchain/blocks/{height}:
     *   get:
     *     summary: Obtener un bloque específico
     */
    router.get('/blocks/:height', (req, res) => {
        try {
            const height = parseInt(req.params.height);
            if (height >= blockchain.chain.length) {
                return res.status(404).json({ error: 'Block not found' });
            }
            res.json(blockchain.chain[height]);
        } catch (error) {
            console.error('Error getting block:', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}; 