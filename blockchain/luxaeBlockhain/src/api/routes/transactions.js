import { Router } from 'express';
import Transaction from '../../Transaction.js';

export const transactionRoutes = (blockchain, p2pManager) => {
    const router = Router();

    /**
     * @swagger
     * /api/transactions:
     *   post:
     *     summary: Crear nueva transacción
     */
    router.post('/', async (req, res) => {
        try {
            const { from, to, amount } = req.body;
            const transaction = new Transaction(from, to, amount);
            
            blockchain.createTransaction(transaction);
            await p2pManager.broadcastTransaction(transaction);
            
            res.status(201).json(transaction);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/transactions/pending:
     *   get:
     *     summary: Obtener transacciones pendientes
     */
    router.get('/pending', (req, res) => {
        res.json(blockchain.pendingTransactions);
    });

    /**
     * @swagger
     * /api/transactions/address/{address}:
     *   get:
     *     summary: Obtener transacciones por dirección
     */
    router.get('/address/:address', (req, res) => {
        const { address } = req.params;
        const balance = blockchain.getBalanceOfAddress(address);
        const transactions = blockchain.chain
            .flatMap(block => block.transactions)
            .filter(tx => tx.fromAddress === address || tx.toAddress === address);

        res.json({ balance, transactions });
    });

    return router;
}; 