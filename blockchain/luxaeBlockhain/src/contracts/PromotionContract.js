import crypto from 'crypto';

class PromotionContract {
    constructor() {
        this.address = this.generateAddress();
        this.name = 'LuxaePromotion';
        this.version = '1.0.0';
        this.owner = null;
        this.promotions = new Map();
        this.users = new Map();
        this.totalSupply = 1000000; // 1M LUX tokens iniciales
        this.circulatingSupply = 0;
        this.promotionHistory = [];
        
        console.log(`🎉 Smart Contract ${this.name} desplegado en ${this.address}`);
    }

    generateAddress() {
        return '0x' + crypto.randomBytes(20).toString('hex');
    }

    // Inicializar contrato
    deploy(ownerAddress) {
        this.owner = ownerAddress;
        this.circulatingSupply = 0;
        
        console.log(`📋 Contrato desplegado por: ${ownerAddress}`);
        return {
            success: true,
            contractAddress: this.address,
            owner: this.owner,
            totalSupply: this.totalSupply
        };
    }

    // Crear nueva promoción
    createPromotion(promotionData) {
        if (!this.owner) {
            throw new Error('Contrato no desplegado');
        }

        const promotionId = crypto.randomBytes(16).toString('hex');
        const promotion = {
            id: promotionId,
            name: promotionData.name,
            description: promotionData.description,
            rewardAmount: promotionData.rewardAmount || 100,
            maxParticipants: promotionData.maxParticipants || 1000,
            currentParticipants: 0,
            startDate: promotionData.startDate || Date.now(),
            endDate: promotionData.endDate || (Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
            requirements: promotionData.requirements || [],
            participants: [],
            status: 'active',
            createdBy: promotionData.createdBy || this.owner,
            createdAt: Date.now()
        };

        this.promotions.set(promotionId, promotion);
        
        console.log(`🎁 Promoción creada: ${promotion.name} (${promotionId})`);
        
        return {
            success: true,
            promotionId: promotionId,
            promotion: promotion
        };
    }

    // Participar en promoción
    participate(promotionId, userAddress, userData = {}) {
        const promotion = this.promotions.get(promotionId);
        
        if (!promotion) {
            throw new Error('Promoción no encontrada');
        }

        if (promotion.status !== 'active') {
            throw new Error('Promoción no está activa');
        }

        if (promotion.currentParticipants >= promotion.maxParticipants) {
            throw new Error('Promoción llena');
        }

        if (promotion.participants.includes(userAddress)) {
            throw new Error('Usuario ya participó');
        }

        // Verificar requisitos
        if (!this.verifyRequirements(promotion.requirements, userData)) {
            throw new Error('No cumple con los requisitos');
        }

        // Agregar participante
        promotion.participants.push(userAddress);
        promotion.currentParticipants++;

        // Generar recompensa
        const reward = this.generateReward(promotion.rewardAmount, userAddress);
        
        // Actualizar balance del usuario
        this.updateUserBalance(userAddress, reward);

        console.log(`🎉 Usuario ${userAddress} participó en promoción ${promotion.name}`);
        console.log(`💰 Recompensa generada: ${reward.amount} LUX`);

        return {
            success: true,
            reward: reward,
            participationId: crypto.randomBytes(16).toString('hex'),
            promotion: {
                id: promotionId,
                name: promotion.name,
                currentParticipants: promotion.currentParticipants,
                maxParticipants: promotion.maxParticipants
            }
        };
    }

    // Verificar requisitos de promoción
    verifyRequirements(requirements, userData) {
        if (!requirements || requirements.length === 0) {
            return true;
        }

        for (const requirement of requirements) {
            switch (requirement.type) {
                case 'min_balance':
                    const userBalance = this.getUserBalance(userData.address);
                    if (userBalance < requirement.value) {
                        return false;
                    }
                    break;
                    
                case 'referral':
                    if (!userData.referralCode) {
                        return false;
                    }
                    break;
                    
                case 'social_media':
                    if (!userData.socialMediaVerified) {
                        return false;
                    }
                    break;
                    
                case 'kyc':
                    if (!userData.kycVerified) {
                        return false;
                    }
                    break;
                    
                default:
                    return true;
            }
        }
        
        return true;
    }

    // Generar recompensa
    generateReward(baseAmount, userAddress) {
        const bonusMultiplier = this.calculateBonusMultiplier(userAddress);
        const finalAmount = Math.floor(baseAmount * bonusMultiplier);
        
        const reward = {
            id: crypto.randomBytes(16).toString('hex'),
            amount: finalAmount,
            currency: 'LUX',
            userAddress: userAddress,
            timestamp: Date.now(),
            bonusMultiplier: bonusMultiplier,
            baseAmount: baseAmount
        };

        return reward;
    }

    // Calcular multiplicador de bonus
    calculateBonusMultiplier(userAddress) {
        const user = this.users.get(userAddress);
        let multiplier = 1.0;

        // Bonus por primera participación
        if (!user || user.participations === 0) {
            multiplier += 0.5; // 50% bonus
        }

        // Bonus por referidos
        if (user && user.referrals > 0) {
            multiplier += (user.referrals * 0.1); // 10% por referido
        }

        // Bonus por participación frecuente
        if (user && user.participations > 5) {
            multiplier += 0.2; // 20% bonus
        }

        return Math.min(multiplier, 3.0); // Máximo 3x
    }

    // Actualizar balance del usuario
    updateUserBalance(userAddress, reward) {
        let user = this.users.get(userAddress);
        
        if (!user) {
            user = {
                address: userAddress,
                balance: 0,
                participations: 0,
                referrals: 0,
                totalEarned: 0,
                lastActivity: Date.now(),
                transactions: []
            };
        }

        user.balance += reward.amount;
        user.participations++;
        user.totalEarned += reward.amount;
        user.lastActivity = Date.now();
        user.transactions.push({
            type: 'promotion_reward',
            amount: reward.amount,
            timestamp: Date.now(),
            rewardId: reward.id
        });

        this.users.set(userAddress, user);
        this.circulatingSupply += reward.amount;

        // Registrar en historial
        this.promotionHistory.push({
            type: 'reward_generated',
            userAddress: userAddress,
            reward: reward,
            timestamp: Date.now()
        });
    }

    // Obtener balance del usuario
    getUserBalance(userAddress) {
        const user = this.users.get(userAddress);
        return user ? user.balance : 0;
    }

    // Obtener información de promoción
    getPromotion(promotionId) {
        return this.promotions.get(promotionId);
    }

    // Obtener todas las promociones
    getAllPromotions() {
        return Array.from(this.promotions.values());
    }

    // Obtener información del usuario
    getUserInfo(userAddress) {
        return this.users.get(userAddress);
    }

    // Obtener estadísticas del contrato
    getContractStats() {
        return {
            address: this.address,
            name: this.name,
            version: this.version,
            owner: this.owner,
            totalSupply: this.totalSupply,
            circulatingSupply: this.circulatingSupply,
            totalPromotions: this.promotions.size,
            totalUsers: this.users.size,
            totalRewardsGenerated: this.promotionHistory.filter(h => h.type === 'reward_generated').length
        };
    }

    // Transferir tokens
    transfer(fromAddress, toAddress, amount) {
        const fromUser = this.users.get(fromAddress);
        const toUser = this.users.get(toAddress);

        if (!fromUser || fromUser.balance < amount) {
            throw new Error('Saldo insuficiente');
        }

        // Actualizar balance del remitente
        fromUser.balance -= amount;
        fromUser.transactions.push({
            type: 'transfer_out',
            amount: amount,
            to: toAddress,
            timestamp: Date.now()
        });

        // Actualizar balance del destinatario
        if (!toUser) {
            this.users.set(toAddress, {
                address: toAddress,
                balance: amount,
                participations: 0,
                referrals: 0,
                totalEarned: 0,
                lastActivity: Date.now(),
                transactions: []
            });
        } else {
            toUser.balance += amount;
            toUser.transactions.push({
                type: 'transfer_in',
                amount: amount,
                from: fromAddress,
                timestamp: Date.now()
            });
        }

        console.log(`💸 Transferencia: ${fromAddress} -> ${toAddress} (${amount} LUX)`);

        return {
            success: true,
            from: fromAddress,
            to: toAddress,
            amount: amount,
            timestamp: Date.now()
        };
    }

    // Obtener historial de transacciones
    getTransactionHistory(userAddress) {
        const user = this.users.get(userAddress);
        return user ? user.transactions : [];
    }

    // Obtener historial de promociones
    getPromotionHistory() {
        return this.promotionHistory;
    }
}

export default PromotionContract; 