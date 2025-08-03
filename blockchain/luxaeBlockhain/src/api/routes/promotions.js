import { Router } from 'express';

export const promotionRoutes = (promotionContract) => {
    const router = Router();

    /**
     * @swagger
     * /api/promotions/deploy:
     *   post:
     *     summary: Desplegar contrato de promociones
     */
    router.post('/deploy', (req, res) => {
        try {
            const { ownerAddress } = req.body;
            
            if (!ownerAddress) {
                return res.status(400).json({ error: 'Dirección del propietario requerida' });
            }

            const result = promotionContract.deploy(ownerAddress);
            
            res.json({
                success: true,
                message: 'Contrato desplegado exitosamente',
                data: result
            });
        } catch (error) {
            console.error('Error desplegando contrato:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/promotions/create:
     *   post:
     *     summary: Crear nueva promoción
     */
    router.post('/create', (req, res) => {
        try {
            const promotionData = req.body;
            
            if (!promotionData.name || !promotionData.description) {
                return res.status(400).json({ error: 'Nombre y descripción son requeridos' });
            }

            const result = promotionContract.createPromotion(promotionData);
            
            res.json({
                success: true,
                message: 'Promoción creada exitosamente',
                data: result
            });
        } catch (error) {
            console.error('Error creando promoción:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/promotions/participate:
     *   post:
     *     summary: Participar en promoción
     */
    router.post('/participate', (req, res) => {
        try {
            const { promotionId, userAddress, userData } = req.body;
            
            if (!promotionId || !userAddress) {
                return res.status(400).json({ error: 'ID de promoción y dirección de usuario requeridos' });
            }

            const result = promotionContract.participate(promotionId, userAddress, userData);
            
            res.json({
                success: true,
                message: 'Participación exitosa',
                data: result
            });
        } catch (error) {
            console.error('Error participando en promoción:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/promotions/list:
     *   get:
     *     summary: Obtener todas las promociones
     */
    router.get('/list', (req, res) => {
        try {
            const promotions = promotionContract.getAllPromotions();
            
            res.json({
                success: true,
                data: promotions
            });
        } catch (error) {
            console.error('Error obteniendo promociones:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/promotions/{promotionId}:
     *   get:
     *     summary: Obtener promoción específica
     */
    router.get('/:promotionId', (req, res) => {
        try {
            const { promotionId } = req.params;
            const promotion = promotionContract.getPromotion(promotionId);
            
            if (!promotion) {
                return res.status(404).json({ error: 'Promoción no encontrada' });
            }

            res.json({
                success: true,
                data: promotion
            });
        } catch (error) {
            console.error('Error obteniendo promoción:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/promotions/user/{userAddress}:
     *   get:
     *     summary: Obtener información del usuario
     */
    router.get('/user/:userAddress', (req, res) => {
        try {
            const { userAddress } = req.params;
            const userInfo = promotionContract.getUserInfo(userAddress);
            
            if (!userInfo) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            res.json({
                success: true,
                data: userInfo
            });
        } catch (error) {
            console.error('Error obteniendo información de usuario:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/promotions/balance/{userAddress}:
     *   get:
     *     summary: Obtener balance del usuario
     */
    router.get('/balance/:userAddress', (req, res) => {
        try {
            const { userAddress } = req.params;
            const balance = promotionContract.getUserBalance(userAddress);
            
            res.json({
                success: true,
                data: {
                    address: userAddress,
                    balance: balance,
                    currency: 'LUX'
                }
            });
        } catch (error) {
            console.error('Error obteniendo balance:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/promotions/transfer:
     *   post:
     *     summary: Transferir tokens
     */
    router.post('/transfer', (req, res) => {
        try {
            const { fromAddress, toAddress, amount } = req.body;
            
            if (!fromAddress || !toAddress || !amount) {
                return res.status(400).json({ error: 'Direcciones y monto requeridos' });
            }

            const result = promotionContract.transfer(fromAddress, toAddress, amount);
            
            res.json({
                success: true,
                message: 'Transferencia exitosa',
                data: result
            });
        } catch (error) {
            console.error('Error en transferencia:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/promotions/transactions/{userAddress}:
     *   get:
     *     summary: Obtener historial de transacciones
     */
    router.get('/transactions/:userAddress', (req, res) => {
        try {
            const { userAddress } = req.params;
            const transactions = promotionContract.getTransactionHistory(userAddress);
            
            res.json({
                success: true,
                data: transactions
            });
        } catch (error) {
            console.error('Error obteniendo transacciones:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/promotions/history:
     *   get:
     *     summary: Obtener historial de promociones
     */
    router.get('/history', (req, res) => {
        try {
            const history = promotionContract.getPromotionHistory();
            
            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            console.error('Error obteniendo historial:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/promotions/stats:
     *   get:
     *     summary: Obtener estadísticas del contrato
     */
    router.get('/stats', (req, res) => {
        try {
            const stats = promotionContract.getContractStats();
            
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}; 