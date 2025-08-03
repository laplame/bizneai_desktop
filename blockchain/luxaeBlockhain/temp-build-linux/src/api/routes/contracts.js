import { Router } from 'express';
import path from 'path';
import { body, param } from 'express-validator';

export const contractRoutes = (contractManager) => {
    const router = Router();

    /**
     * @swagger
     * /api/contracts/compile:
     *   post:
     *     summary: Compilar un contrato Solidity
     */
    router.post('/compile', async (req, res) => {
        try {
            const { contractPath } = req.body;
            const contractName = await contractManager.compileContract(contractPath);
            res.json({ success: true, contractName });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/contracts/deploy:
     *   post:
     *     summary: Desplegar un contrato compilado
     */
    router.post('/deploy', async (req, res) => {
        try {
            const { contractName, args, sender } = req.body;
            const result = await contractManager.deployContract(contractName, args, sender);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    /**
     * @swagger
     * /api/contracts/call:
     *   post:
     *     summary: Llamar a un método de un contrato
     */
    router.post('/call', async (req, res) => {
        try {
            const { address, method, args, sender } = req.body;
            const result = await contractManager.callContract(address, method, args, sender);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    router.get('/genesis-message', async (req, res) => {
        try {
            console.log('Getting genesis message...');
            const contract = contractManager.getGenesisMessageContract();
            console.log('Genesis contract found:', contract);

            if (!contract) {
                console.log('No genesis contract found');
                return res.status(404).json({ error: 'Genesis contract not found' });
            }

            console.log('Calling readMessage...');
            const message = await contractManager.callContract(
                contract.address,
                'readMessage'
            );
            console.log('Message result:', message);

            console.log('Calling getMessageInfo...');
            const info = await contractManager.callContract(
                contract.address,
                'getMessageInfo'
            );
            console.log('Info result:', info);

            const response = {
                quote: message.result,
                creator: info.result[0],
                timestamp: Number(info.result[1]) * 1000,
                length: Number(info.result[2])
            };
            console.log('Sending response:', response);
            res.json(response);
        } catch (error) {
            console.error('Error getting genesis message:', error);
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/', async (req, res) => {
        try {
            const contracts = await contractManager.getDeployedContracts();
            res.json(contracts.map(contract => ({
                address: contract.address,
                name: contract.name,
                creator: contract.creator,
                timestamp: contract.timestamp,
                transactionCount: contract.transactionCount,
                methods: contract.abi.filter(item => item.type === 'function')
                    .map(method => ({
                        name: method.name,
                        inputs: method.inputs.map(input => input.type)
                    }))
            })));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/contracts', async (req, res) => {
        try {
            const contracts = await contractManager.getDeployedContracts();
            res.json(contracts);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/contracts/:address', async (req, res) => {
        try {
            const contract = await contractManager.getContractDetails(req.params.address);
            res.json(contract);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    });

    router.get('/contracts/:address/audit', async (req, res) => {
        try {
            const auditTrail = await contractManager.getContractAuditTrail(req.params.address);
            res.json(auditTrail);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    });

    router.get('/contracts/:address/interactions', async (req, res) => {
        try {
            const interactions = await contractManager.getContractInteractions(req.params.address);
            res.json(interactions);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    });

    router.get('/contracts/:address/metrics', async (req, res) => {
        try {
            const metrics = await contractManager.getContractMetrics(req.params.address);
            res.json(metrics);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    });

    router.post('/contracts/:address/verify', 
        body('sourceCode').isString(),
        async (req, res) => {
            try {
                const result = await contractManager.verifyContract(
                    req.params.address,
                    req.body.sourceCode
                );
                res.json(result);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
    });

    return router;
}; 