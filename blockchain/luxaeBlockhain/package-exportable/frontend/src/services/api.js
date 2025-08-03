import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const blockchainAPI = {
  // Blockchain info
  getBlockchainInfo: () => api.get('/api/v2/blockchain'),
  getLatestBlocks: (limit = 10) => api.get(`/api/v2/blockchain/blocks?limit=${limit}`),
  getBlockByHash: (hash) => api.get(`/api/v2/blockchain/blocks/${hash}`),
  
  // Transactions
  getTransactions: (limit = 20) => api.get(`/api/v2/transactions?limit=${limit}`),
  getTransactionByHash: (hash) => api.get(`/api/v2/transactions/${hash}`),
  createTransaction: (transaction) => api.post('/api/v2/transactions', transaction),
  
  // Validators
  getValidators: () => api.get('/api/v2/validators'),
  getValidatorInfo: (address) => api.get(`/api/v2/validators/${address}`),
  
  // Network
  getNetworkStatus: () => api.get('/api/v2/network/status'),
  getPeers: () => api.get('/api/v2/network/peers'),
  getNodes: () => api.get('/api/v2/network/nodes'),
  
  // Status
  getNodeStatus: () => api.get('/api/v2/status'),
  getHealth: () => api.get('/health'),
  
  // Contracts
  getContracts: () => api.get('/api/v2/contracts'),
  getContractInfo: (address) => api.get(`/api/v2/contracts/${address}`),
  deployContract: (contract) => api.post('/api/v2/contracts', contract),
  callContract: (callData) => api.post('/api/v2/contracts/call', callData),
};

export const websocketAPI = {
  // WebSocket connection for real-time updates
  connect: () => {
    const ws = new WebSocket(`ws://localhost:3001/ws`);
    return ws;
  }
};

export default api; 