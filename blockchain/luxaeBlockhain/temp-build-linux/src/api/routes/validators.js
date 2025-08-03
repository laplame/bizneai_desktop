import { Router } from 'express';

export const validatorRoutes = (blockchain) => {
    const router = Router();

    /**
     * @swagger
     * /api/validators:
     *   get:
     *     summary: Obtener lista de validadores
     */
    router.get('/', (req, res) => {
        try {
            const validators = blockchain.participants.getAllNodes().map(participant => ({
                address: participant.address,
                balance: participant.balance || 0,
                stake: participant.stake || 0,
                active: participant.status === 'active',
                blocksValidated: participant.blocksValidated || 0,
                lastSeen: participant.lastSeen
            }));
            
            console.log('Sending validators data:', validators); // Debug log
            res.json(validators);
        } catch (error) {
            console.error('Error getting validators:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/validators/{address}:
     *   get:
     *     summary: Obtener información de un validador
     */
    router.get('/:address', (req, res) => {
        const { address } = req.params;
        const validator = blockchain.participants.getNodeInfo(address);
        if (!validator) {
            return res.status(404).json({ error: 'Validator not found' });
        }
        res.json(validator);
    });

    return router;
}; 