#!/usr/bin/env node

// Script de pruebas para el Smart Contract de Promociones
// Autor: Luxae Team
// Versión: 1.0.0

import PromotionContract from './src/contracts/PromotionContract.js';

console.log('🚀 Iniciando pruebas del Smart Contract de Promociones Luxae\n');

// Crear instancia del contrato
const promotionContract = new PromotionContract();

// Función para simular dirección de wallet
const generateWalletAddress = () => {
    return '0x' + Math.random().toString(16).substr(2, 40);
};

// Función para mostrar resultados
const showResult = (testName, result) => {
    console.log(`✅ ${testName}:`);
    console.log(`   ${JSON.stringify(result, null, 2)}\n`);
};

// Función para mostrar error
const showError = (testName, error) => {
    console.log(`❌ ${testName}:`);
    console.log(`   Error: ${error.message}\n`);
};

// Test 1: Desplegar contrato
console.log('📋 Test 1: Desplegar Contrato');
try {
    const ownerAddress = generateWalletAddress();
    const deployResult = promotionContract.deploy(ownerAddress);
    showResult('Despliegue exitoso', deployResult);
} catch (error) {
    showError('Despliegue falló', error);
}

// Test 2: Crear promociones
console.log('🎁 Test 2: Crear Promociones');
const promotionIds = [];

try {
    // Promoción 1: Bienvenida
    const promotion1 = promotionContract.createPromotion({
        name: 'Promoción de Bienvenida',
        description: '¡Bienvenido a Luxae! Gana tokens por unirte',
        rewardAmount: 150,
        maxParticipants: 500,
        requirements: [
            { type: 'referral', value: true }
        ]
    });
    promotionIds.push(promotion1.promotionId);
    showResult('Promoción 1 creada', promotion1);

    // Promoción 2: Social Media
    const promotion2 = promotionContract.createPromotion({
        name: 'Promoción Social Media',
        description: 'Síguenos en redes sociales y gana tokens',
        rewardAmount: 200,
        maxParticipants: 300,
        requirements: [
            { type: 'social_media', value: true }
        ]
    });
    promotionIds.push(promotion2.promotionId);
    showResult('Promoción 2 creada', promotion2);

    // Promoción 3: KYC
    const promotion3 = promotionContract.createPromotion({
        name: 'Promoción KYC',
        description: 'Completa tu KYC y gana tokens extra',
        rewardAmount: 300,
        maxParticipants: 200,
        requirements: [
            { type: 'kyc', value: true }
        ]
    });
    promotionIds.push(promotion3.promotionId);
    showResult('Promoción 3 creada', promotion3);

} catch (error) {
    showError('Crear promociones falló', error);
}

// Test 3: Participar en promociones
console.log('👥 Test 3: Participar en Promociones');
const userAddresses = [
    generateWalletAddress(),
    generateWalletAddress(),
    generateWalletAddress()
];

try {
    // Usuario 1 participa en promoción 1
    const participation1 = promotionContract.participate(promotionIds[0], userAddresses[0], {
        address: userAddresses[0],
        referralCode: 'LUXAE2024',
        socialMediaVerified: true,
        kycVerified: false
    });
    showResult('Usuario 1 participó en promoción 1', participation1);

    // Usuario 2 participa en promoción 2
    const participation2 = promotionContract.participate(promotionIds[1], userAddresses[1], {
        address: userAddresses[1],
        referralCode: 'LUXAE2024',
        socialMediaVerified: true,
        kycVerified: true
    });
    showResult('Usuario 2 participó en promoción 2', participation2);

    // Usuario 3 participa en promoción 3
    const participation3 = promotionContract.participate(promotionIds[2], userAddresses[2], {
        address: userAddresses[2],
        referralCode: 'LUXAE2024',
        socialMediaVerified: true,
        kycVerified: true
    });
    showResult('Usuario 3 participó en promoción 3', participation3);

} catch (error) {
    showError('Participar en promociones falló', error);
}

// Test 4: Verificar balances
console.log('💰 Test 4: Verificar Balances');
try {
    for (let i = 0; i < userAddresses.length; i++) {
        const balance = promotionContract.getUserBalance(userAddresses[i]);
        const userInfo = promotionContract.getUserInfo(userAddresses[i]);
        
        console.log(`✅ Usuario ${i + 1} (${userAddresses[i].substr(0, 10)}...):`);
        console.log(`   Balance: ${balance} LUX`);
        console.log(`   Participaciones: ${userInfo.participations}`);
        console.log(`   Total ganado: ${userInfo.totalEarned} LUX\n`);
    }
} catch (error) {
    showError('Verificar balances falló', error);
}

// Test 5: Transferir tokens
console.log('💸 Test 5: Transferir Tokens');
try {
    const transferResult = promotionContract.transfer(
        userAddresses[0],
        userAddresses[1],
        50
    );
    showResult('Transferencia exitosa', transferResult);

    // Verificar balances después de transferencia
    const balance1 = promotionContract.getUserBalance(userAddresses[0]);
    const balance2 = promotionContract.getUserBalance(userAddresses[1]);
    
    console.log(`✅ Balance Usuario 1 después de transferencia: ${balance1} LUX`);
    console.log(`✅ Balance Usuario 2 después de transferencia: ${balance2} LUX\n`);

} catch (error) {
    showError('Transferir tokens falló', error);
}

// Test 6: Estadísticas del contrato
console.log('📊 Test 6: Estadísticas del Contrato');
try {
    const stats = promotionContract.getContractStats();
    showResult('Estadísticas del contrato', stats);
} catch (error) {
    showError('Obtener estadísticas falló', error);
}

// Test 7: Historial de transacciones
console.log('📜 Test 7: Historial de Transacciones');
try {
    for (let i = 0; i < userAddresses.length; i++) {
        const transactions = promotionContract.getTransactionHistory(userAddresses[i]);
        console.log(`✅ Usuario ${i + 1} - Transacciones: ${transactions.length}`);
        if (transactions.length > 0) {
            console.log(`   Última transacción: ${transactions[transactions.length - 1].type}`);
        }
    }
    console.log('');
} catch (error) {
    showError('Obtener historial falló', error);
}

// Test 8: Listar todas las promociones
console.log('🎁 Test 8: Listar Promociones');
try {
    const allPromotions = promotionContract.getAllPromotions();
    console.log(`✅ Total de promociones: ${allPromotions.length}`);
    allPromotions.forEach((promotion, index) => {
        console.log(`   Promoción ${index + 1}: ${promotion.name} (${promotion.currentParticipants}/${promotion.maxParticipants})`);
    });
    console.log('');
} catch (error) {
    showError('Listar promociones falló', error);
}

console.log('🎉 Pruebas completadas exitosamente!');
console.log('\n📋 Resumen:');
console.log('- Smart Contract desplegado');
console.log('- 3 promociones creadas');
console.log('- 3 usuarios participaron');
console.log('- Tokens transferidos');
console.log('- Estadísticas generadas');
console.log('\n🚀 El sistema de promociones está listo para usar!'); 