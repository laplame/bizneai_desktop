import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  getBlockchainInfo: () => api.get('/api/blockchain'),
  getLatestBlocks: (limit = 10) => api.get(`/api/blockchain/blocks?limit=${limit}`),
  getBlockByHash: (hash) => api.get(`/api/blockchain/blocks/${hash}`),
  
  // Transactions
  getTransactions: (limit = 20) => api.get(`/api/transactions?limit=${limit}`),
  getTransactionByHash: (hash) => api.get(`/api/transactions/${hash}`),
  createTransaction: (transaction) => api.post('/api/transactions', transaction),
  
  // Validators
  getValidators: () => api.get('/api/validators'),
  getValidatorInfo: (address) => api.get(`/api/validators/${address}`),
  
  // Network
  getNetworkStatus: () => api.get('/api/network/status'),
  getPeers: () => api.get('/api/network/peers'),
  getNodes: () => api.get('/api/network/connections'),
  
  // Status
  getNodeStatus: () => api.get('/api/status/status'),
  getHealth: () => api.get('/health'),
  
  // Contracts
  getContracts: () => api.get('/api/contracts'),
  getContractInfo: (address) => api.get(`/api/contracts/${address}`),
  deployContract: (contract) => api.post('/api/contracts', contract),
  callContract: (callData) => api.post('/api/contracts/call', callData),
};

export const websocketAPI = {
  // WebSocket connection for real-time updates
  connect: () => {
    const ws = new WebSocket(`ws://localhost:3000/ws`);
    return ws;
  }
};

export default api; 