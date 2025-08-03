import crypto from 'crypto';

class ERC721NFT {
    constructor() {
        this.address = this.generateAddress();
        this.name = 'ERC721NFT';
        this.version = '1.0.0';
        this.owner = null;
        this.tokens = new Map();
        this.tokenOwners = new Map();
        this.tokenApprovals = new Map();
        this.operatorApprovals = new Map();
        this.tokenCounter = 0;
        this.transactions = [];
        
        console.log(`🖼️ ERC-721 NFT desplegado en ${this.address}`);
    }

    generateAddress() {
        return '0x' + crypto.randomBytes(20).toString('hex');
    }

    // Desplegar contrato
    deploy(contractData) {
        this.name = contractData.name || 'MyNFT';
        this.symbol = contractData.symbol || 'MNFT';
        this.owner = contractData.ownerAddress || this.generateAddress();
        
        console.log(`📋 ERC-721 NFT desplegado: ${this.name} (${this.symbol})`);
        console.log(`👤 Owner: ${this.owner}`);
        
        return {
            success: true,
            contractAddress: this.address,
            name: this.name,
            symbol: this.symbol,
            owner: this.owner
        };
    }

    // Mint NFT
    mint(to, tokenURI) {
        if (!to) {
            throw new Error('Dirección de destino requerida');
        }

        this.tokenCounter++;
        const tokenId = this.tokenCounter;

        // Crear token
        this.tokens.set(tokenId, {
            id: tokenId,
            owner: to,
            tokenURI: tokenURI || `https://api.example.com/token/${tokenId}`,
            createdAt: Date.now(),
            metadata: {
                name: `${this.name} #${tokenId}`,
                description: `Token único #${tokenId}`,
                image: `https://api.example.com/images/${tokenId}.png`,
                attributes: []
            }
        });

        this.tokenOwners.set(tokenId, to);

        // Registrar transacción
        this.transactions.push({
            type: 'mint',
            tokenId: tokenId,
            to: to,
            tokenURI: tokenURI,
            timestamp: Date.now()
        });

        console.log(`🎨 NFT minted: Token #${tokenId} -> ${to}`);

        return {
            success: true,
            tokenId: tokenId,
            to: to,
            tokenURI: tokenURI
        };
    }

    // Transferir NFT
    transfer(from, to, tokenId) {
        if (!this.tokenOwners.has(tokenId)) {
            throw new Error('Token no existe');
        }

        const currentOwner = this.tokenOwners.get(tokenId);
        if (currentOwner !== from) {
            throw new Error('No es el propietario del token');
        }

        // Actualizar propietario
        this.tokenOwners.set(tokenId, to);
        this.tokens.get(tokenId).owner = to;

        // Limpiar aprobaciones
        this.tokenApprovals.delete(tokenId);

        // Registrar transacción
        this.transactions.push({
            type: 'transfer',
            tokenId: tokenId,
            from: from,
            to: to,
            timestamp: Date.now()
        });

        console.log(`🔄 NFT transferido: Token #${tokenId} ${from} -> ${to}`);

        return {
            success: true,
            tokenId: tokenId,
            from: from,
            to: to
        };
    }

    // Aprobar token
    approve(to, tokenId) {
        const owner = this.tokenOwners.get(tokenId);
        if (!owner) {
            throw new Error('Token no existe');
        }

        this.tokenApprovals.set(tokenId, to);

        console.log(`✅ Aprobación: Token #${tokenId} ${owner} -> ${to}`);

        return {
            success: true,
            tokenId: tokenId,
            owner: owner,
            approved: to
        };
    }

    // Transferir desde (con aprobación)
    transferFrom(from, to, tokenId) {
        if (!this.tokenOwners.has(tokenId)) {
            throw new Error('Token no existe');
        }

        const currentOwner = this.tokenOwners.get(tokenId);
        if (currentOwner !== from) {
            throw new Error('No es el propietario del token');
        }

        const approved = this.tokenApprovals.get(tokenId);
        if (approved !== to) {
            throw new Error('No está aprobado para transferir');
        }

        // Transferir
        this.tokenOwners.set(tokenId, to);
        this.tokens.get(tokenId).owner = to;

        // Limpiar aprobación
        this.tokenApprovals.delete(tokenId);

        // Registrar transacción
        this.transactions.push({
            type: 'transferFrom',
            tokenId: tokenId,
            from: from,
            to: to,
            timestamp: Date.now()
        });

        console.log(`🔄 TransferFrom: Token #${tokenId} ${from} -> ${to}`);

        return {
            success: true,
            tokenId: tokenId,
            from: from,
            to: to
        };
    }

    // Obtener propietario del token
    ownerOf(tokenId) {
        return this.tokenOwners.get(tokenId) || null;
    }

    // Obtener tokens de un propietario
    tokensOfOwner(owner) {
        const tokens = [];
        for (const [tokenId, tokenOwner] of this.tokenOwners.entries()) {
            if (tokenOwner === owner) {
                tokens.push(tokenId);
            }
        }
        return tokens;
    }

    // Obtener información del token
    getTokenInfo(tokenId) {
        const token = this.tokens.get(tokenId);
        if (!token) {
            return null;
        }

        return {
            id: tokenId,
            owner: token.owner,
            tokenURI: token.tokenURI,
            metadata: token.metadata,
            createdAt: token.createdAt
        };
    }

    // Obtener balance de tokens
    balanceOf(owner) {
        let count = 0;
        for (const tokenOwner of this.tokenOwners.values()) {
            if (tokenOwner === owner) {
                count++;
            }
        }
        return count;
    }

    // Obtener aprobación de token
    getApproved(tokenId) {
        return this.tokenApprovals.get(tokenId) || null;
    }

    // Obtener información del contrato
    getContractInfo() {
        return {
            address: this.address,
            name: this.name,
            symbol: this.symbol,
            owner: this.owner,
            totalTokens: this.tokenCounter,
            transactions: this.transactions.length
        };
    }

    // Obtener métodos disponibles
    getMethods() {
        return [
            'mint(address,string)',
            'transfer(address,address,uint256)',
            'approve(address,uint256)',
            'transferFrom(address,address,uint256)',
            'ownerOf(uint256)',
            'balanceOf(address)',
            'getApproved(uint256)',
            'tokensOfOwner(address)',
            'getTokenInfo(uint256)',
            'name()',
            'symbol()',
            'totalSupply()'
        ];
    }

    // Ejecutar método
    executeMethod(methodName, params = {}) {
        switch (methodName) {
            case 'mint':
                return this.mint(params.to, params.tokenURI);
            case 'transfer':
                return this.transfer(params.from, params.to, params.tokenId);
            case 'approve':
                return this.approve(params.to, params.tokenId);
            case 'transferFrom':
                return this.transferFrom(params.from, params.to, params.tokenId);
            case 'ownerOf':
                return this.ownerOf(params.tokenId);
            case 'balanceOf':
                return this.balanceOf(params.owner);
            case 'getApproved':
                return this.getApproved(params.tokenId);
            case 'tokensOfOwner':
                return this.tokensOfOwner(params.owner);
            case 'getTokenInfo':
                return this.getTokenInfo(params.tokenId);
            case 'name':
                return this.name;
            case 'symbol':
                return this.symbol;
            case 'totalSupply':
                return this.tokenCounter;
            default:
                throw new Error(`Método ${methodName} no encontrado`);
        }
    }
}

export default ERC721NFT; 