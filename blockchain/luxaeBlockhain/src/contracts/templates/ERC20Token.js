import crypto from 'crypto';

class ERC20Token {
    constructor() {
        this.address = this.generateAddress();
        this.name = 'ERC20Token';
        this.version = '1.0.0';
        this.owner = null;
        this.balances = new Map();
        this.allowances = new Map();
        this.totalSupply = 0;
        this.symbol = '';
        this.decimals = 18;
        this.transactions = [];
        
        console.log(`🪙 ERC-20 Token desplegado en ${this.address}`);
    }

    generateAddress() {
        return '0x' + crypto.randomBytes(20).toString('hex');
    }

    // Desplegar contrato
    deploy(contractData) {
        this.name = contractData.name || 'MyToken';
        this.symbol = contractData.symbol || 'MTK';
        this.totalSupply = parseInt(contractData.totalSupply) || 1000000;
        this.owner = contractData.ownerAddress || this.generateAddress();
        
        // Asignar supply total al owner
        this.balances.set(this.owner, this.totalSupply);
        
        console.log(`📋 ERC-20 Token desplegado: ${this.name} (${this.symbol})`);
        console.log(`💰 Supply Total: ${this.totalSupply}`);
        console.log(`👤 Owner: ${this.owner}`);
        
        return {
            success: true,
            contractAddress: this.address,
            name: this.name,
            symbol: this.symbol,
            totalSupply: this.totalSupply,
            owner: this.owner,
            decimals: this.decimals
        };
    }

    // Obtener balance
    balanceOf(address) {
        return this.balances.get(address) || 0;
    }

    // Transferir tokens
    transfer(to, amount) {
        const from = this.owner; // Simplificado para demo
        
        if (this.balanceOf(from) < amount) {
            throw new Error('Saldo insuficiente');
        }

        // Actualizar balances
        this.balances.set(from, this.balanceOf(from) - amount);
        this.balances.set(to, this.balanceOf(to) + amount);

        // Registrar transacción
        this.transactions.push({
            type: 'transfer',
            from: from,
            to: to,
            amount: amount,
            timestamp: Date.now()
        });

        console.log(`💸 Transferencia: ${from} -> ${to} (${amount} ${this.symbol})`);

        return {
            success: true,
            from: from,
            to: to,
            amount: amount
        };
    }

    // Aprobar gasto
    approve(spender, amount) {
        const owner = this.owner; // Simplificado para demo
        
        this.allowances.set(`${owner}-${spender}`, amount);

        console.log(`✅ Aprobación: ${owner} -> ${spender} (${amount} ${this.symbol})`);

        return {
            success: true,
            owner: owner,
            spender: spender,
            amount: amount
        };
    }

    // Transferir desde (con aprobación)
    transferFrom(from, to, amount) {
        const spender = this.owner; // Simplificado para demo
        const allowance = this.allowances.get(`${from}-${spender}`) || 0;

        if (allowance < amount) {
            throw new Error('Allowance insuficiente');
        }

        if (this.balanceOf(from) < amount) {
            throw new Error('Saldo insuficiente');
        }

        // Actualizar balances
        this.balances.set(from, this.balanceOf(from) - amount);
        this.balances.set(to, this.balanceOf(to) + amount);

        // Actualizar allowance
        this.allowances.set(`${from}-${spender}`, allowance - amount);

        // Registrar transacción
        this.transactions.push({
            type: 'transferFrom',
            from: from,
            to: to,
            spender: spender,
            amount: amount,
            timestamp: Date.now()
        });

        console.log(`💸 TransferFrom: ${from} -> ${to} via ${spender} (${amount} ${this.symbol})`);

        return {
            success: true,
            from: from,
            to: to,
            spender: spender,
            amount: amount
        };
    }

    // Obtener allowance
    allowance(owner, spender) {
        return this.allowances.get(`${owner}-${spender}`) || 0;
    }

    // Obtener información del contrato
    getContractInfo() {
        return {
            address: this.address,
            name: this.name,
            symbol: this.symbol,
            totalSupply: this.totalSupply,
            decimals: this.decimals,
            owner: this.owner,
            transactions: this.transactions.length
        };
    }

    // Obtener métodos disponibles
    getMethods() {
        return [
            'balanceOf(address)',
            'transfer(address,uint256)',
            'approve(address,uint256)',
            'transferFrom(address,address,uint256)',
            'allowance(address,address)',
            'totalSupply()',
            'name()',
            'symbol()',
            'decimals()'
        ];
    }

    // Ejecutar método
    executeMethod(methodName, params = {}) {
        switch (methodName) {
            case 'balanceOf':
                return this.balanceOf(params.address);
            case 'transfer':
                return this.transfer(params.to, params.amount);
            case 'approve':
                return this.approve(params.spender, params.amount);
            case 'transferFrom':
                return this.transferFrom(params.from, params.to, params.amount);
            case 'allowance':
                return this.allowance(params.owner, params.spender);
            case 'totalSupply':
                return this.totalSupply;
            case 'name':
                return this.name;
            case 'symbol':
                return this.symbol;
            case 'decimals':
                return this.decimals;
            default:
                throw new Error(`Método ${methodName} no encontrado`);
        }
    }
}

export default ERC20Token; 