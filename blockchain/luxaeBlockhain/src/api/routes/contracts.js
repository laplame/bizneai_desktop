import { Router } from 'express';

export const contractRoutes = (contractManager) => {
    const router = Router();

    /**
     * @swagger
     * /api/contracts/deploy:
     *   post:
     *     summary: Desplegar contrato desde plantilla
     */
    router.post('/deploy', (req, res) => {
        try {
            const { template, ...contractData } = req.body;
            
            if (!template) {
                return res.status(400).json({ error: 'Plantilla requerida' });
            }

            const result = contractManager.deployContract(template, contractData);
            
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
     * /api/contracts/list:
     *   get:
     *     summary: Obtener lista de contratos
     */
    router.get('/list', (req, res) => {
        try {
            const contracts = contractManager.getContracts();
            
            res.json({
                success: true,
                data: contracts
            });
        } catch (error) {
            console.error('Error obteniendo contratos:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/contracts/templates:
     *   get:
     *     summary: Obtener plantillas disponibles
     */
    router.get('/templates', (req, res) => {
        try {
            const templates = contractManager.getTemplates();
            
            res.json({
                success: true,
                data: templates
            });
        } catch (error) {
            console.error('Error obteniendo plantillas:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/contracts/stats:
     *   get:
     *     summary: Obtener estadísticas de contratos
     */
    router.get('/stats', (req, res) => {
        try {
            const stats = contractManager.getStats();
            
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/contracts/execute:
     *   post:
     *     summary: Ejecutar método de contrato
     */
    router.post('/execute', (req, res) => {
        try {
            const { contractAddress, method, params } = req.body;
            
            if (!contractAddress || !method) {
                return res.status(400).json({ error: 'Dirección de contrato y método requeridos' });
            }

            const result = contractManager.executeMethod(contractAddress, method, params);
            
            res.json({
                success: true,
                message: 'Método ejecutado exitosamente',
                data: result
            });
        } catch (error) {
            console.error('Error ejecutando método:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/contracts/verify:
     *   post:
     *     summary: Verificar contrato
     */
    router.post('/verify', (req, res) => {
        try {
            const { contractAddress } = req.body;
            
            if (!contractAddress) {
                return res.status(400).json({ error: 'Dirección de contrato requerida' });
            }

            const result = contractManager.verifyContract(contractAddress);
            
            res.json({
                success: true,
                message: 'Contrato verificado exitosamente',
                data: result
            });
        } catch (error) {
            console.error('Error verificando contrato:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/contracts/{contractAddress}:
     *   get:
     *     summary: Obtener información de contrato específico
     */
    router.get('/:contractAddress', (req, res) => {
        try {
            const { contractAddress } = req.params;
            const contractInfo = contractManager.getContractInfo(contractAddress);
            
            if (!contractInfo) {
                return res.status(404).json({ error: 'Contrato no encontrado' });
            }

            res.json({
                success: true,
                data: contractInfo
            });
        } catch (error) {
            console.error('Error obteniendo contrato:', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}; 