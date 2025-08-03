import crypto from 'crypto';
import ERC20Token from './templates/ERC20Token.js';
import ERC721NFT from './templates/ERC721NFT.js';
import Crowdfunding from './templates/Crowdfunding.js';
import PromotionContract from './PromotionContract.js';

class ContractManager {
    constructor() {
        this.contracts = new Map();
        this.templates = {
            'erc20': ERC20Token,
            'erc721': ERC721NFT,
            'crowdfunding': Crowdfunding,
            'promotion': PromotionContract
        };
        
        console.log('🔧 Contract Manager inicializado');
    }

    // Desplegar contrato desde plantilla
    deployContract(templateId, contractData) {
        const TemplateClass = this.templates[templateId];
        
        if (!TemplateClass) {
            throw new Error(`Plantilla ${templateId} no encontrada`);
        }

        const contract = new TemplateClass();
        const result = contract.deploy(contractData);

        // Almacenar contrato
        this.contracts.set(contract.address, {
            address: contract.address,
            name: contract.name,
            type: templateId,
            status: 'deployed',
            verified: false,
            methods: contract.getMethods(),
            createdAt: Date.now(),
            contract: contract
        });

        console.log(`✅ Contrato desplegado: ${contract.name} en ${contract.address}`);

        return {
            success: true,
            contractAddress: contract.address,
            template: templateId,
            data: result
        };
    }

    // Ejecutar método de contrato
    executeMethod(contractAddress, methodName, params = {}) {
        const contractInfo = this.contracts.get(contractAddress);
        
        if (!contractInfo) {
            throw new Error('Contrato no encontrado');
        }

        const contract = contractInfo.contract;
        const result = contract.executeMethod(methodName, params);

        console.log(`🔧 Método ejecutado: ${methodName} en ${contractAddress}`);

        return {
            success: true,
            contractAddress: contractAddress,
            method: methodName,
            result: result
        };
    }

    // Verificar contrato
    verifyContract(contractAddress) {
        const contractInfo = this.contracts.get(contractAddress);
        
        if (!contractInfo) {
            throw new Error('Contrato no encontrado');
        }

        contractInfo.verified = true;

        console.log(`✅ Contrato verificado: ${contractAddress}`);

        return {
            success: true,
            contractAddress: contractAddress,
            verified: true
        };
    }

    // Obtener lista de contratos
    getContracts() {
        return Array.from(this.contracts.values()).map(contractInfo => ({
            address: contractInfo.address,
            name: contractInfo.name,
            type: contractInfo.type,
            status: contractInfo.status,
            verified: contractInfo.verified,
            methods: contractInfo.methods,
            createdAt: contractInfo.createdAt
        }));
    }

    // Obtener información de contrato
    getContractInfo(contractAddress) {
        const contractInfo = this.contracts.get(contractAddress);
        
        if (!contractInfo) {
            return null;
        }

        return {
            address: contractInfo.address,
            name: contractInfo.name,
            type: contractInfo.type,
            status: contractInfo.status,
            verified: contractInfo.verified,
            methods: contractInfo.methods,
            createdAt: contractInfo.createdAt,
            info: contractInfo.contract.getContractInfo()
        };
    }

    // Obtener plantillas disponibles
    getTemplates() {
        return Object.keys(this.templates).map(templateId => ({
            id: templateId,
            name: this.getTemplateName(templateId),
            description: this.getTemplateDescription(templateId)
        }));
    }

    // Obtener nombre de plantilla
    getTemplateName(templateId) {
        const names = {
            'erc20': 'ERC-20 Token',
            'erc721': 'ERC-721 NFT',
            'crowdfunding': 'Crowdfunding',
            'promotion': 'Promoción Luxae'
        };
        return names[templateId] || templateId;
    }

    // Obtener descripción de plantilla
    getTemplateDescription(templateId) {
        const descriptions = {
            'erc20': 'Contrato estándar para tokens fungibles con funcionalidades básicas de transferencia.',
            'erc721': 'Contrato para tokens no fungibles (NFTs) con metadatos únicos.',
            'crowdfunding': 'Contrato para campañas de crowdfunding con objetivos y recompensas.',
            'promotion': 'Contrato para gestionar promociones y generar tokens LUX.'
        };
        return descriptions[templateId] || 'Plantilla de contrato inteligente.';
    }

    // Obtener estadísticas
    getStats() {
        const contracts = this.getContracts();
        
        return {
            total: contracts.length,
            deployed: contracts.filter(c => c.status === 'deployed').length,
            verified: contracts.filter(c => c.verified).length,
            pending: contracts.filter(c => c.status === 'pending').length,
            byType: {
                erc20: contracts.filter(c => c.type === 'erc20').length,
                erc721: contracts.filter(c => c.type === 'erc721').length,
                crowdfunding: contracts.filter(c => c.type === 'crowdfunding').length,
                promotion: contracts.filter(c => c.type === 'promotion').length
            }
        };
    }
}

export default ContractManager; 