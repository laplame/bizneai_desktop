import { contextBridge, ipcRenderer } from 'electron';

// Expose blockchain API to renderer process
contextBridge.exposeInMainWorld('blockchainAPI', {
  // Blockchain management
  start: () => ipcRenderer.invoke('blockchain:start'),
  stop: () => ipcRenderer.invoke('blockchain:stop'),
  getStatus: () => ipcRenderer.invoke('blockchain:status'),
  
  // Mining operations
  getMiningStatus: () => ipcRenderer.invoke('blockchain:mining:status'),
  startMining: () => ipcRenderer.invoke('blockchain:mining:start'),
  stopMining: () => ipcRenderer.invoke('blockchain:mining:stop'),
  
  // Discrete mining operations
  startDiscreteMining: () => ipcRenderer.invoke('blockchain:mining:discrete:start'),
  stopDiscreteMining: () => ipcRenderer.invoke('blockchain:mining:discrete:stop'),
  
  // Blockchain data
  getBlockchainData: () => ipcRenderer.invoke('blockchain:data'),
  
  // Network operations
  getNetworkStatus: () => ipcRenderer.invoke('blockchain:network:status'),
  getNetworkNodes: () => ipcRenderer.invoke('blockchain:network:nodes'),
  
  // Wallet operations
  getWalletInfo: (address) => ipcRenderer.invoke('blockchain:wallet:info', address),
  sendTransaction: (fromAddress, toAddress, amount) => 
    ipcRenderer.invoke('blockchain:transaction:send', { fromAddress, toAddress, amount }),
  
  // POS operations
  sendPosTransaction: (saleId, amount, items) => 
    ipcRenderer.invoke('blockchain:pos:transaction', { saleId, amount, items }),
  
  // Utility functions
  isElectron: true,
  platform: process.platform
});

// Expose a simple API for development
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    versions: process.versions
  });
} 