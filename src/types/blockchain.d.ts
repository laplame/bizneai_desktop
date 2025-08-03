declare global {
  interface Window {
    blockchainAPI?: {
      // Blockchain management
      start: () => Promise<{ success: boolean; error?: string }>;
      stop: () => Promise<{ success: boolean; error?: string }>;
      getStatus: () => Promise<{
        status: 'running' | 'stopped' | 'error';
        api?: any;
        blockchain: boolean;
        error?: string;
      }>;
      getBlockchainStatus: () => Promise<{
        status: 'running' | 'stopped' | 'error';
        api?: any;
        blockchain: boolean;
        error?: string;
      }>;
      
      // Mining operations
      getMiningStatus: () => Promise<{
        isMining: boolean;
        currentBlock: number;
        difficulty: number;
        hashrate: number;
        isDiscreteMining: boolean;
        error?: string;
      }>;
      getMiningInfo: () => Promise<{
        isMining: boolean;
        currentBlock: number;
        difficulty: number;
        hashrate: number;
        isDiscreteMining: boolean;
        error?: string;
      }>;
      startMining: () => Promise<{ success: boolean; message?: string; error?: string }>;
      stopMining: () => Promise<{ success: boolean; message?: string; error?: string }>;
      
      // Discrete mining operations
      startDiscreteMining: () => Promise<{ success: boolean; message?: string; error?: string }>;
      stopDiscreteMining: () => Promise<{ success: boolean; message?: string; error?: string }>;
      
      // Blockchain data
      getBlockchainData: () => Promise<{
        chainLength: number;
        lastBlock: any;
        pendingTransactions: number;
        totalTransactions: number;
        networkHashrate: number;
        averageBlockTime: number;
        error?: string;
      }>;
      
      // Network operations
      getNetworkStatus: () => Promise<{
        totalNodes: number;
        onlineNodes: number;
        totalStake: number;
        averageBlockTime: number;
        networkHashrate: number;
        consensus: 'active' | 'inactive';
        error?: string;
      }>;
      getNetworkNodes: () => Promise<Array<{
        id: string;
        address: string;
        status: 'online' | 'offline' | 'syncing';
        lastSeen: string;
        version: string;
        isValidator: boolean;
        stake: number;
      }>>;
      
      // Wallet operations
      getWalletInfo: (address: string) => Promise<{
        address: string;
        balance: number;
        transactions: any[];
        stakedAmount: number;
        rewards: number;
        error?: string;
      }>;
      sendTransaction: (fromAddress: string, toAddress: string, amount: number) => Promise<{
        success: boolean;
        message?: string;
        error?: string;
      }>;
      
      // POS operations
      sendPosTransaction: (saleId: string, amount: number, items: any[]) => Promise<{
        success: boolean;
        message?: string;
        error?: string;
      }>;
      
      // Utility functions
      isElectron: boolean;
      platform: string;
    };
    
    electronAPI?: {
      platform: string;
      versions: NodeJS.ProcessVersions;
    };
  }
}

export {}; 