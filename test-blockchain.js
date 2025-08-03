import SimpleBlockchainService from './electron/simple-blockchain-service.js';

async function testBlockchain() {
    console.log('🧪 Testing Blockchain Service...');
    
    const blockchainService = new SimpleBlockchainService();
    
    try {
        // Start blockchain
        console.log('1. Starting blockchain...');
        const startResult = await blockchainService.startBlockchain();
        console.log('Start result:', startResult);
        
        if (startResult) {
            // Wait a moment for server to start
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Test status
            console.log('2. Testing status...');
            const status = await blockchainService.getBlockchainStatus();
            console.log('Status:', status);
            
            // Test mining
            console.log('3. Testing mining...');
            const miningResult = await blockchainService.startMining();
            console.log('Mining start result:', miningResult);
            
            // Wait for mining to start
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Test mining status
            const miningStatus = await blockchainService.getMiningInfo();
            console.log('Mining status:', miningStatus);
            
            // Test blockchain data
            console.log('4. Testing blockchain data...');
            const blockchainData = await blockchainService.getBlockchainData();
            console.log('Blockchain data:', blockchainData);
            
            // Test wallet
            console.log('5. Testing wallet...');
            const walletInfo = await blockchainService.getWalletInfo('test-address');
            console.log('Wallet info:', walletInfo);
            
            // Test transaction
            console.log('6. Testing transaction...');
            const transactionResult = await blockchainService.sendTransaction(
                'from-address',
                'to-address',
                50
            );
            console.log('Transaction result:', transactionResult);
            
            // Stop mining
            console.log('7. Stopping mining...');
            const stopMiningResult = await blockchainService.stopMining();
            console.log('Stop mining result:', stopMiningResult);
            
            // Stop blockchain
            console.log('8. Stopping blockchain...');
            const stopResult = await blockchainService.stopBlockchain();
            console.log('Stop result:', stopResult);
            
            console.log('✅ All tests passed!');
        } else {
            console.log('❌ Failed to start blockchain');
        }
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testBlockchain(); 