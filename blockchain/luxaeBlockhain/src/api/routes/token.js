import { Router } from 'express';

export const tokenRoutes = (token) => {
    const router = Router();

    /**
     * @swagger
     * /api/token/info:
     *   get:
     *     summary: Obtener información del token
     */
    router.get('/info', (req, res) => {
        const info = {
            name: token.name(),
            symbol: token.symbol(),
            decimals: token.decimals(),
            totalSupply: token.totalSupply().toString()
        };
        res.json(info);
    });

    /**
     * @swagger
     * /api/token/balance/{address}:
     *   get:
     *     summary: Obtener balance de una dirección
     */
    router.get('/balance/:address', (req, res) => {
        try {
            const balance = token.balanceOf(req.params.address);
            res.json({ balance: balance.toString() });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/token/transfer:
     *   post:
     *     summary: Transferir tokens
     */
    router.post('/transfer', (req, res) => {
        try {
            const { from, to, amount } = req.body;
            token.transfer(from, to, amount);
            res.status(200).json({ success: true });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/token/approve:
     *   post:
     *     summary: Aprobar gasto de tokens
     */
    router.post('/approve', (req, res) => {
        try {
            const { owner, spender, amount } = req.body;
            token.approve(owner, spender, amount);
            res.status(200).json({ success: true });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    return router;
}; 