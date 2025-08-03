import { useState, useEffect } from 'react';
import { useBlockchain } from '../hooks/useBlockchain';
import { 
  CurrencyDollarIcon, 
  PlusIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const TransactionsPage = () => {
  const {
    transactions,
    loading,
    error,
    fetchTransactions,
    createTransaction,
  } = useBlockchain();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    from: '',
    to: '',
    amount: '',
    data: ''
  });

  useEffect(() => {
    fetchTransactions(50);
  }, [fetchTransactions]);

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    try {
      await createTransaction(newTransaction);
      setNewTransaction({ from: '', to: '', amount: '', data: '' });
      setShowCreateForm(false);
      fetchTransactions(50); // Refresh the list
    } catch (err) {
      console.error('Error creating transaction:', err);
    }
  };

  const formatHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 12)}...${hash.substring(hash.length - 12)}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const getTransactionStatus = (transaction) => {
    if (transaction.blockHash) {
      return { status: 'confirmed', icon: CheckCircleIcon, color: 'text-green-600' };
    } else if (transaction.pending) {
      return { status: 'pending', icon: ClockIcon, color: 'text-yellow-600' };
    } else {
      return { status: 'failed', icon: ExclamationTriangleIcon, color: 'text-red-600' };
    }
  };

  if (loading && !transactions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-luxae-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
              <p className="mt-2 text-gray-600">
                Gestiona y monitorea las transacciones de la blockchain
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nueva Transacción
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Create Transaction Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Nueva Transacción</h3>
                <form onSubmit={handleCreateTransaction}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Desde</label>
                      <input
                        type="text"
                        value={newTransaction.from}
                        onChange={(e) => setNewTransaction({...newTransaction, from: e.target.value})}
                        className="input-field"
                        placeholder="0x..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hacia</label>
                      <input
                        type="text"
                        value={newTransaction.to}
                        onChange={(e) => setNewTransaction({...newTransaction, to: e.target.value})}
                        className="input-field"
                        placeholder="0x..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                      <input
                        type="number"
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                        className="input-field"
                        placeholder="0.0"
                        step="0.000001"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Datos (opcional)</label>
                      <textarea
                        value={newTransaction.data}
                        onChange={(e) => setNewTransaction({...newTransaction, data: e.target.value})}
                        className="input-field"
                        placeholder="Datos adicionales..."
                        rows="3"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Creando...' : 'Crear Transacción'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Transacciones Recientes</h2>
            <div className="text-sm text-gray-500">
              Mostrando {transactions.length} transacciones
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Desde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hacia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((tx, index) => {
                  const statusInfo = getTransactionStatus(tx);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {formatHash(tx.hash)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {formatHash(tx.from)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {formatHash(tx.to)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.amount} LXA
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StatusIcon className={`h-4 w-4 mr-2 ${statusInfo.color}`} />
                          <span className={`text-sm font-medium ${statusInfo.color}`}>
                            {statusInfo.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(tx.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {transactions.length === 0 && (
            <div className="text-center py-12">
              <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay transacciones</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza creando una nueva transacción.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage; 