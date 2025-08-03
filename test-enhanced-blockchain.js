import SimpleBlockchainService from './electron/simple-blockchain-service.js';

async function testEnhancedBlockchain() {
    console.log('🧪 Testing Enhanced Blockchain Service...');
    const blockchainService = new SimpleBlockchainService();
    
    try {
        // Test 1: Start blockchain
        console.log('\n1️⃣ Starting blockchain...');
        const startResult = await blockchainService.startBlockchain();
        console.log('Start result:', startResult);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 2: Get blockchain status
        console.log('\n2️⃣ Getting blockchain status...');
        const status = await blockchainService.getBlockchainStatus();
        console.log('Status:', status);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 3: Get mining status
        console.log('\n3️⃣ Getting mining status...');
        const miningStatus = await blockchainService.getMiningInfo();
        console.log('Mining status:', miningStatus);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 4: Start mining
        console.log('\n4️⃣ Starting mining...');
        const miningResult = await blockchainService.startMining();
        console.log('Mining result:', miningResult);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 5: Get blockchain data
        console.log('\n5️⃣ Getting blockchain data...');
        const blockchainData = await blockchainService.getBlockchainData();
        console.log('Blockchain data:', blockchainData);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 6: Get network status
        console.log('\n6️⃣ Getting network status...');
        const networkStatus = await blockchainService.getNetworkStatus();
        console.log('Network status:', networkStatus);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 7: Get network nodes
        console.log('\n7️⃣ Getting network nodes...');
        const networkNodes = await blockchainService.getNetworkNodes();
        console.log('Network nodes:', networkNodes);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 8: Start discrete mining
        console.log('\n8️⃣ Starting discrete mining...');
        const discreteResult = await blockchainService.startDiscreteMining();
        console.log('Discrete mining result:', discreteResult);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 9: Send POS transaction
        console.log('\n9️⃣ Sending POS transaction...');
        const posTransaction = await blockchainService.sendPosTransaction(
            'SALE-001',
            150.50,
            [
                { name: 'Café Americano', price: 2.50, quantity: 2 },
                { name: 'Croissant', price: 2.00, quantity: 1 }
            ]
        );
        console.log('POS transaction result:', posTransaction);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 10: Get wallet info
        console.log('\n🔟 Getting wallet info...');
        const walletInfo = await blockchainService.getWalletInfo('test-wallet-123');
        console.log('Wallet info:', walletInfo);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 11: Stop discrete mining
        console.log('\n1️⃣1️⃣ Stopping discrete mining...');
        const stopDiscreteResult = await blockchainService.stopDiscreteMining();
        console.log('Stop discrete mining result:', stopDiscreteResult);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 12: Stop mining
        console.log('\n1️⃣2️⃣ Stopping mining...');
        const stopMiningResult = await blockchainService.stopMining();
        console.log('Stop mining result:', stopMiningResult);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 13: Stop blockchain
        console.log('\n1️⃣3️⃣ Stopping blockchain...');
        const stopResult = await blockchainService.stopBlockchain();
        console.log('Stop result:', stopResult);

        console.log('\n✅ Enhanced blockchain test completed successfully!');
        
    } catch (error) {
        console.error('❌ Enhanced blockchain test failed:', error);
    }
}

testEnhancedBlockchain(); 