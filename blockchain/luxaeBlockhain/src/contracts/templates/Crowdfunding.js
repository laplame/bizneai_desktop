import crypto from 'crypto';

class Crowdfunding {
    constructor() {
        this.address = this.generateAddress();
        this.name = 'Crowdfunding';
        this.version = '1.0.0';
        this.owner = null;
        this.contributors = new Map();
        this.contributions = [];
        this.targetAmount = 0;
        this.deadline = 0;
        this.description = '';
        this.status = 'active';
        this.transactions = [];
        
        console.log(`💰 Crowdfunding desplegado en ${this.address}`);
    }

    generateAddress() {
        return '0x' + crypto.randomBytes(20).toString('hex');
    }

    // Desplegar contrato
    deploy(contractData) {
        this.name = contractData.name || 'MyCrowdfunding';
        this.targetAmount = parseInt(contractData.targetAmount) || 1000;
        this.description = contractData.description || 'Proyecto de crowdfunding';
        this.owner = contractData.ownerAddress || this.generateAddress();
        this.deadline = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 días por defecto
        
        console.log(`📋 Crowdfunding desplegado: ${this.name}`);
        console.log(`💰 Meta: ${this.targetAmount} LUX`);
        console.log(`📅 Deadline: ${new Date(this.deadline).toLocaleDateString()}`);
        console.log(`👤 Owner: ${this.owner}`);
        
        return {
            success: true,
            contractAddress: this.address,
            name: this.name,
            targetAmount: this.targetAmount,
            description: this.description,
            owner: this.owner,
            deadline: this.deadline
        };
    }

    // Contribuir al proyecto
    contribute(contributor, amount) {
        if (this.status !== 'active') {
            throw new Error('Proyecto no está activo');
        }

        if (Date.now() > this.deadline) {
            throw new Error('Proyecto ha expirado');
        }

        if (amount <= 0) {
            throw new Error('Monto debe ser mayor a 0');
        }

        // Actualizar contribución del usuario
        const currentContribution = this.contributors.get(contributor) || 0;
        this.contributors.set(contributor, currentContribution + amount);

        // Registrar contribución
        this.contributions.push({
            contributor: contributor,
            amount: amount,
            timestamp: Date.now()
        });

        // Registrar transacción
        this.transactions.push({
            type: 'contribute',
            contributor: contributor,
            amount: amount,
            timestamp: Date.now()
        });

        console.log(`💸 Contribución: ${contributor} -> ${amount} LUX`);

        return {
            success: true,
            contributor: contributor,
            amount: amount,
            totalRaised: this.getTotalRaised()
        };
    }

    // Finalizar campaña (solo owner)
    finalize() {
        if (this.owner !== this.owner) { // Simplificado para demo
            throw new Error('Solo el owner puede finalizar');
        }

        if (this.status !== 'active') {
            throw new Error('Proyecto ya no está activo');
        }

        if (Date.now() < this.deadline) {
            throw new Error('Proyecto aún no ha expirado');
        }

        const totalRaised = this.getTotalRaised();
        
        if (totalRaised >= this.targetAmount) {
            this.status = 'successful';
            console.log(`🎉 Proyecto exitoso! Recaudado: ${totalRaised} LUX`);
        } else {
            this.status = 'failed';
            console.log(`❌ Proyecto fallido. Recaudado: ${totalRaised} LUX`);
        }

        // Registrar transacción
        this.transactions.push({
            type: 'finalize',
            status: this.status,
            totalRaised: totalRaised,
            timestamp: Date.now()
        });

        return {
            success: true,
            status: this.status,
            totalRaised: totalRaised,
            targetAmount: this.targetAmount
        };
    }

    // Reclamar reembolso (si el proyecto falló)
    claimRefund(contributor) {
        if (this.status !== 'failed') {
            throw new Error('Proyecto no falló');
        }

        const contribution = this.contributors.get(contributor);
        if (!contribution || contribution <= 0) {
            throw new Error('No hay contribuciones para reclamar');
        }

        // Limpiar contribución
        this.contributors.set(contributor, 0);

        // Registrar transacción
        this.transactions.push({
            type: 'claimRefund',
            contributor: contributor,
            amount: contribution,
            timestamp: Date.now()
        });

        console.log(`💰 Reembolso: ${contributor} <- ${contribution} LUX`);

        return {
            success: true,
            contributor: contributor,
            amount: contribution
        };
    }

    // Obtener total recaudado
    getTotalRaised() {
        let total = 0;
        for (const amount of this.contributors.values()) {
            total += amount;
        }
        return total;
    }

    // Obtener contribución de un usuario
    getContribution(contributor) {
        return this.contributors.get(contributor) || 0;
    }

    // Obtener tiempo restante
    getTimeRemaining() {
        const remaining = this.deadline - Date.now();
        return remaining > 0 ? remaining : 0;
    }

    // Obtener porcentaje de progreso
    getProgress() {
        const totalRaised = this.getTotalRaised();
        return Math.min((totalRaised / this.targetAmount) * 100, 100);
    }

    // Obtener información del proyecto
    getProjectInfo() {
        return {
            name: this.name,
            description: this.description,
            targetAmount: this.targetAmount,
            totalRaised: this.getTotalRaised(),
            progress: this.getProgress(),
            status: this.status,
            deadline: this.deadline,
            timeRemaining: this.getTimeRemaining(),
            contributors: this.contributors.size,
            owner: this.owner
        };
    }

    // Obtener lista de contribuciones
    getContributions() {
        return this.contributions;
    }

    // Obtener información del contrato
    getContractInfo() {
        return {
            address: this.address,
            name: this.name,
            targetAmount: this.targetAmount,
            totalRaised: this.getTotalRaised(),
            status: this.status,
            owner: this.owner,
            transactions: this.transactions.length
        };
    }

    // Obtener métodos disponibles
    getMethods() {
        return [
            'contribute(address,uint256)',
            'finalize()',
            'claimRefund(address)',
            'getTotalRaised()',
            'getContribution(address)',
            'getTimeRemaining()',
            'getProgress()',
            'getProjectInfo()',
            'getContributions()'
        ];
    }

    // Ejecutar método
    executeMethod(methodName, params = {}) {
        switch (methodName) {
            case 'contribute':
                return this.contribute(params.contributor, params.amount);
            case 'finalize':
                return this.finalize();
            case 'claimRefund':
                return this.claimRefund(params.contributor);
            case 'getTotalRaised':
                return this.getTotalRaised();
            case 'getContribution':
                return this.getContribution(params.contributor);
            case 'getTimeRemaining':
                return this.getTimeRemaining();
            case 'getProgress':
                return this.getProgress();
            case 'getProjectInfo':
                return this.getProjectInfo();
            case 'getContributions':
                return this.getContributions();
            default:
                throw new Error(`Método ${methodName} no encontrado`);
        }
    }
}

export default Crowdfunding; 