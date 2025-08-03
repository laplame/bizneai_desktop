import { useEffect } from 'react';
import { useBlockchain } from '../hooks/useBlockchain';
import { 
  CubeIcon, 
  CurrencyDollarIcon, 
  UsersIcon, 
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const {
    blockchainInfo,
    blocks,
    transactions,
    validators,
    networkStatus,
    nodes,
    loading,
    error,
    fetchBlockchainInfo,
    fetchLatestBlocks,
    fetchTransactions,
    fetchValidators,
    fetchNetworkStatus,
    fetchNodes,
  } = useBlockchain();

  useEffect(() => {
    fetchBlockchainInfo();
    fetchLatestBlocks();
    fetchTransactions();
    fetchValidators();
    fetchNetworkStatus();
    fetchNodes();
  }, [fetchBlockchainInfo, fetchLatestBlocks, fetchTransactions, fetchValidators, fetchNetworkStatus, fetchNodes]);

  // Use real nodes from API, fallback to simulated data if empty
  const onlineNodes = nodes.length > 0 ? nodes : [
    {
      id: networkStatus?.nodeId || '12D3KooWBhntvNK4vkyx14fpv2KyrHQsp5tNBXWuAPknJYXo5cKL',
      name: 'Nodo Principal',
      type: 'Validator',
      status: 'online',
      uptime: '2h 15m',
      location: 'Local',
      isOwn: true,
      version: 'v2.0.0',
      lastSeen: new Date().toISOString(),
      blocksMined: blockchainInfo?.chain?.length || 1,
      stake: '10,000 LXA'
    },
    {
      id: '12D3KooWRFBiXHLJm8uGxaHpb2PZqidTGf4hmKLE9zTP1wPDXnVg',
      name: 'Nodo Validator #1',
      type: 'Validator',
      status: 'online',
      uptime: '1h 45m',
      location: 'Madrid, ES',
      isOwn: false,
      version: 'v2.0.0',
      lastSeen: new Date(Date.now() - 30000).toISOString(),
      blocksMined: 15,
      stake: '8,500 LXA'
    },
    {
      id: '12D3KooWQmJdQpJdQpJdQpJdQpJdQpJdQpJdQpJdQpJdQpJdQp',
      name: 'Nodo Full #1',
      type: 'Full Node',
      status: 'online',
      uptime: '45m',
      location: 'Barcelona, ES',
      isOwn: false,
      version: 'v2.0.0',
      lastSeen: new Date(Date.now() - 60000).toISOString(),
      blocksMined: 0,
      stake: '0 LXA'
    }
  ];

  const stats = [
    {
      name: 'Total Blocks',
      value: blockchainInfo?.chain?.length || 0,
      icon: CubeIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Pending Transactions',
      value: blockchainInfo?.pendingTransactions?.length || 0,
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Active Validators',
      value: validators?.length || 0,
      icon: UsersIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Online Nodes',
      value: onlineNodes.length,
      icon: SignalIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const formatHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
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
          <h1 className="text-3xl font-bold text-gray-900">Luxae Blockchain Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Monitorización en tiempo real de la red blockchain Luxae
          </p>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Latest Blocks and Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Latest Blocks */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Latest Blocks</h2>
              <ClockIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {blocks.slice(0, 5).map((block, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Block #{block.block}</p>
                    <p className="text-xs text-gray-500">
                      Hash: {formatHash(block.hash)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(block.timestamp)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {block.transactions?.length || 0} txs
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Latest Transactions */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Latest Transactions</h2>
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {tx.amount} LXA
                    </p>
                    <p className="text-xs text-gray-500">
                      From: {formatHash(tx.fromAddress)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      To: {formatHash(tx.toAddress)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTimestamp(tx.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Network Status */}
        {networkStatus && (
          <div className="mt-8 card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Network Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-luxae-600">
                  {networkStatus.isConnected ? 'Online' : 'Offline'}
                </p>
                <p className="text-sm text-gray-600">Connection Status</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-luxae-600">
                  {networkStatus.peers?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Connected Peers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-luxae-600">
                  {networkStatus.uptime || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Uptime</p>
              </div>
            </div>
          </div>
        )}

        {/* Online Nodes */}
        <div className="mt-8 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Online Nodes</h2>
            <div className="flex items-center space-x-2">
              <SignalIcon className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-600 font-medium">{onlineNodes.length} nodes online</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {onlineNodes.map((node) => (
              <div key={node.id} className={`relative bg-white p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
                node.isOwn ? 'border-luxae-500 bg-luxae-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                {node.isOwn && (
                  <div className="absolute -top-2 -right-2">
                    <span className="bg-luxae-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      Tu Nodo
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-bold text-gray-900">{node.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    node.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {node.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <ComputerDesktopIcon className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="font-medium">{node.type}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <SignalIcon className="h-4 w-4 mr-2 text-green-500" />
                    <span>Uptime: {node.uptime}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CubeIcon className="h-4 w-4 mr-2 text-purple-500" />
                    <span>Blocks: {node.blocksMined}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2 text-orange-500" />
                    <span>Stake: {node.stake}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <span>v{node.version}</span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Last seen: {new Date(node.lastSeen).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {node.id.substring(0, 12)}...{node.id.substring(node.id.length - 12)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 