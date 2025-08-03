import { useState, useEffect, useCallback } from 'react';
import { blockchainAPI } from '../services/api';

export const useBlockchain = () => {
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [validators, setValidators] = useState([]);
  const [networkStatus, setNetworkStatus] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBlockchainInfo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await blockchainAPI.getBlockchainInfo();
      setBlockchainInfo(response.data);
      setError(null);
    } catch (err) {
      setError('Error fetching blockchain info');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLatestBlocks = useCallback(async (limit = 10) => {
    try {
      setLoading(true);
      const response = await blockchainAPI.getLatestBlocks(limit);
      setBlocks(response.data);
      setError(null);
    } catch (err) {
      setError('Error fetching blocks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (limit = 20) => {
    try {
      setLoading(true);
      const response = await blockchainAPI.getTransactions(limit);
      setTransactions(response.data);
      setError(null);
    } catch (err) {
      setError('Error fetching transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchValidators = useCallback(async () => {
    try {
      setLoading(true);
      const response = await blockchainAPI.getValidators();
      setValidators(response.data);
      setError(null);
    } catch (err) {
      setError('Error fetching validators');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNetworkStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await blockchainAPI.getNetworkStatus();
      setNetworkStatus(response.data);
      setError(null);
    } catch (err) {
      setError('Error fetching network status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await blockchainAPI.getContracts();
      setContracts(response.data);
      setError(null);
    } catch (err) {
      setError('Error fetching contracts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNodes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await blockchainAPI.getNodes();
      setNodes(response.data);
      setError(null);
    } catch (err) {
      setError('Error fetching nodes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTransaction = useCallback(async (transactionData) => {
    try {
      setLoading(true);
      const response = await blockchainAPI.createTransaction(transactionData);
      setError(null);
      return response.data;
    } catch (err) {
      setError('Error creating transaction');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deployContract = useCallback(async (contractData) => {
    try {
      setLoading(true);
      const response = await blockchainAPI.deployContract(contractData);
      setError(null);
      return response.data;
    } catch (err) {
      setError('Error deploying contract');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const callContract = useCallback(async (callData) => {
    try {
      setLoading(true);
      const response = await blockchainAPI.callContract(callData);
      setError(null);
      return response.data;
    } catch (err) {
      setError('Error calling contract');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBlockchainInfo();
      fetchLatestBlocks();
      fetchTransactions();
      fetchValidators();
      fetchNetworkStatus();
      fetchContracts();
      fetchNodes();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchBlockchainInfo, fetchLatestBlocks, fetchTransactions, fetchValidators, fetchNetworkStatus, fetchContracts, fetchNodes]);

  return {
    blockchainInfo,
    blocks,
    transactions,
    validators,
    networkStatus,
    contracts,
    nodes,
    loading,
    error,
    fetchBlockchainInfo,
    fetchLatestBlocks,
    fetchTransactions,
    fetchValidators,
    fetchNetworkStatus,
    fetchContracts,
    fetchNodes,
    createTransaction,
    deployContract,
    callContract,
  };
}; 