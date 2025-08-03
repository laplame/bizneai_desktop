import { useEffect } from 'react';
import { useBlockchain } from '../hooks/useBlockchain';
import { 
  CubeIcon, 
  ClockIcon,
  FingerPrintIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const GenesisPage = () => {
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
    fetchLatestBlocks(1); // Solo necesitamos el primer bloque
  }, [fetchBlockchainInfo, fetchLatestBlocks]);

  const genesisBlock = blocks?.[0] || blockchainInfo?.chain?.[0];

  // Handle genesis block transactions (string vs array)
  const genesisTransactions = genesisBlock?.transactions 
    ? (typeof genesisBlock.transactions === 'string' 
        ? [{ 
            hash: genesisBlock.hash,
            from: 'Genesis',
            to: 'Genesis',
            amount: 0,
            type: 'genesis'
          }]
        : genesisBlock.transactions)
    : [];

  // Genesis block text from legacy code
  const genesisText = `Cuando aceptas dinero en pago por tu esfuerzo, lo haces sólo con el convencimiento de que lo cambiarás por el producto del esfuerzo de otros. No son los mendigos ni los saqueadores los que dan su valor al dinero. Ni un océano de lágrimas ni todas las armas del mundo pueden transformar esos papeles de tu cartera en el pan que necesitarás para sobrevivir mañana. Esos papeles, que deberían haber sido oro, son una prenda de honor – tu derecho a la energía de los hombres que producen. Tu cartera es tu manifestación de esperanza de que en algún lugar del mundo a tu alrededor hay hombres que no transgredirán ese principio moral que es el origen del dinero.`;

  const formatHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 12)}...${hash.substring(hash.length - 12)}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const formatData = (data) => {
    if (!data) return 'N/A';
    try {
      return JSON.stringify(JSON.parse(data), null, 2);
    } catch {
      return data;
    }
  };

  if (loading && !genesisBlock) {
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
          <div className="flex items-center">
            <CubeIcon className="h-12 w-12 text-luxae-600 mr-4" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bloque Génesis</h1>
              <p className="mt-2 text-gray-600">
                El primer bloque de la blockchain Luxae
              </p>
            </div>
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

        {genesisBlock ? (
          <>
            {/* Genesis Block Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <div className="flex items-center">
                  <CubeIcon className="h-8 w-8 text-luxae-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Número de Bloque</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {genesisBlock.block || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Timestamp</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatTimestamp(genesisBlock.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center">
                  <FingerPrintIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Consenso</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {blockchainInfo?.consensus || 'PoS'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Transacciones</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {genesisBlock.transactions?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Genesis Block Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Block Information */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CubeIcon className="h-5 w-5 mr-2 text-luxae-600" />
                  Información del Bloque
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hash del Bloque:</span>
                    <span className="text-sm font-mono text-gray-900">
                      {formatHash(genesisBlock.hash)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hash Anterior:</span>
                    <span className="text-sm font-mono text-gray-900">
                      {genesisBlock.previousHash || '0000000000000000000000000000000000000000000000000000000000000000'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Nonce:</span>
                    <span className="text-sm text-gray-900">
                      {genesisBlock.nonce || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Dificultad:</span>
                    <span className="text-sm text-gray-900">
                      {genesisBlock.difficulty || 1}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Validador:</span>
                    <span className="text-sm font-mono text-gray-900">
                      {formatHash(genesisBlock.validator)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Recompensa:</span>
                    <span className="text-sm text-gray-900">
                      {genesisBlock.reward || 0} LXA
                    </span>
                  </div>
                </div>
              </div>

              {/* Blockchain Info */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                  Estado de la Blockchain
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total de Bloques:</span>
                    <span className="text-sm text-gray-900">
                      {blockchainInfo?.chain?.length || 1}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Transacciones Pendientes:</span>
                    <span className="text-sm text-gray-900">
                      {blockchainInfo?.pendingTransactions?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Algoritmo de Consenso:</span>
                    <span className="text-sm text-gray-900">
                      {blockchainInfo?.consensus || 'Proof of Stake'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Versión:</span>
                    <span className="text-sm text-gray-900">
                      v2.0.0
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Estado:</span>
                    <span className="text-sm text-green-600 font-medium">
                      Operativa
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Genesis Block Text */}
            <div className="card mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-purple-600" />
                Mensaje del Génesis
              </h3>
              <div className="bg-gradient-to-r from-luxae-50 to-purple-50 rounded-lg p-6 border-l-4 border-luxae-500">
                <blockquote className="text-lg text-gray-800 leading-relaxed italic">
                  "{genesisText}"
                </blockquote>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Autor:</span>
                    <span className="text-sm font-medium text-gray-900">Ayn Rand</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Fuente:</span>
                    <span className="text-sm font-medium text-gray-900">Atlas Shrugged</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Genesis Transactions */}
            {genesisTransactions.length > 0 && (
              <div className="card mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Transacciones del Génesis
                </h3>
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
                          Tipo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {genesisTransactions.map((tx, index) => (
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
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Génesis
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Genesis Data */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-purple-600" />
                Datos del Génesis
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                  {formatData(genesisBlock.data)}
                </pre>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Bloque génesis no encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se pudo cargar la información del bloque génesis.
            </p>
          </div>
        )}

        {/* Genesis Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Importancia del Génesis</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span>Establece el estado inicial de la blockchain</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span>Define los parámetros de consenso</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span>Distribuye los tokens iniciales</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span>Sienta las bases para la validación</span>
              </li>
            </ul>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Características Técnicas</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <FingerPrintIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                <span>Hash anterior: 64 ceros</span>
              </li>
              <li className="flex items-start">
                <ClockIcon className="h-4 w-4 text-purple-600 mr-2 mt-0.5" />
                <span>Timestamp de creación</span>
              </li>
              <li className="flex items-start">
                <CubeIcon className="h-4 w-4 text-luxae-600 mr-2 mt-0.5" />
                <span>Número de bloque: 0</span>
              </li>
              <li className="flex items-start">
                <DocumentTextIcon className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span>Datos de configuración</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenesisPage; 