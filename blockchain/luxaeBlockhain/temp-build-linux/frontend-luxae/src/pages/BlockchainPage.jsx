import { useEffect } from 'react';
import { useBlockchain } from '../hooks/useBlockchain';
import { CubeIcon, ClockIcon, FingerPrintIcon } from '@heroicons/react/24/outline';

const BlockchainPage = () => {
  const {
    blockchainInfo,
    blocks,
    loading,
    error,
    fetchBlockchainInfo,
    fetchLatestBlocks,
  } = useBlockchain();

  useEffect(() => {
    fetchBlockchainInfo();
    fetchLatestBlocks(20);
  }, [fetchBlockchainInfo, fetchLatestBlocks]);

  const formatHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 12)}...${hash.substring(hash.length - 12)}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  if (loading && !blockchainInfo) {
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
          <h1 className="text-3xl font-bold text-gray-900">Blockchain Explorer</h1>
          <p className="mt-2 text-gray-600">
            Explorador detallado de la blockchain Luxae
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Blockchain Info */}
        {blockchainInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center">
                <CubeIcon className="h-8 w-8 text-luxae-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Blocks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {blockchainInfo.chain?.length || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {blockchainInfo.pendingTransactions?.length || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <FingerPrintIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Consensus</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {blockchainInfo.consensus || 'PoS'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blocks Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Latest Blocks</h2>
            <div className="text-sm text-gray-500">
              Showing {blocks.length} blocks
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Block #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Previous Hash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Validator
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {blocks.map((block, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {block.block}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {formatHash(block.hash)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {formatHash(block.previousHash)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {block.transactions?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(block.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {formatHash(block.validator)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {blocks.length === 0 && (
            <div className="text-center py-12">
              <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No blocks found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new block.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockchainPage; 