import { useState, useEffect } from 'react';
import { useBlockchain } from '../hooks/useBlockchain';
import { 
  DocumentTextIcon, 
  PlusIcon,
  CodeBracketIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

const ContractsPage = () => {
  const {
    contracts,
    loading,
    error,
    fetchContracts,
    deployContract,
    callContract,
  } = useBlockchain();

  const [showDeployForm, setShowDeployForm] = useState(false);
  const [showCallForm, setShowCallForm] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [newContract, setNewContract] = useState({
    name: '',
    source: '',
    abi: '',
    bytecode: ''
  });
  const [contractCall, setContractCall] = useState({
    contractAddress: '',
    method: '',
    params: '',
    value: '0'
  });

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleDeployContract = async (e) => {
    e.preventDefault();
    try {
      await deployContract(newContract);
      setNewContract({ name: '', source: '', abi: '', bytecode: '' });
      setShowDeployForm(false);
      fetchContracts();
    } catch (err) {
      console.error('Error deploying contract:', err);
    }
  };

  const handleCallContract = async (e) => {
    e.preventDefault();
    try {
      await callContract(contractCall);
      setContractCall({ contractAddress: '', method: '', params: '', value: '0' });
      setShowCallForm(false);
    } catch (err) {
      console.error('Error calling contract:', err);
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 12)}...${address.substring(address.length - 12)}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const getContractStatus = (contract) => {
    if (contract.deployed) {
      return { status: 'Desplegado', color: 'text-green-600', bgColor: 'bg-green-50' };
    } else if (contract.verified) {
      return { status: 'Verificado', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    } else {
      return { status: 'Pendiente', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    }
  };

  if (loading && !contracts) {
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
              <h1 className="text-3xl font-bold text-gray-900">Smart Contracts</h1>
              <p className="mt-2 text-gray-600">
                Gestiona y ejecuta contratos inteligentes en la blockchain Luxae
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCallForm(true)}
                className="btn-secondary flex items-center"
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                Ejecutar
              </button>
              <button
                onClick={() => setShowDeployForm(true)}
                className="btn-primary flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Desplegar Contrato
              </button>
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

        {/* Contracts Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-luxae-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Contratos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contracts?.length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Desplegados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contracts?.filter(c => c.deployed)?.length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <CodeBracketIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verificados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contracts?.filter(c => c.verified)?.length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contracts?.filter(c => !c.deployed)?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contracts Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Contratos Inteligentes</h2>
            <div className="text-sm text-gray-500">
              Mostrando {contracts?.length || 0} contratos
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Métodos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contracts?.map((contract, index) => {
                  const statusInfo = getContractStatus(contract);
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CodeBracketIcon className="h-5 w-5 text-luxae-600 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{contract.name}</div>
                            <div className="text-sm text-gray-500">{contract.version || 'v1.0'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {formatAddress(contract.address)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                          {statusInfo.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contract.methods?.length || 0} métodos
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(contract.deployedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedContract(contract);
                              setContractCall({
                                ...contractCall,
                                contractAddress: contract.address
                              });
                              setShowCallForm(true);
                            }}
                            className="text-luxae-600 hover:text-luxae-900"
                          >
                            <PlayIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setSelectedContract(contract)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(!contracts || contracts.length === 0) && (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay contratos</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza desplegando tu primer smart contract.
              </p>
            </div>
          )}
        </div>

        {/* Contract Templates */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ERC-20 Token</h3>
            <p className="text-sm text-gray-600 mb-4">
              Contrato estándar para tokens fungibles con funcionalidades básicas de transferencia.
            </p>
            <button className="btn-secondary w-full">
              Usar Plantilla
            </button>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ERC-721 NFT</h3>
            <p className="text-sm text-gray-600 mb-4">
              Contrato para tokens no fungibles (NFTs) con metadatos únicos.
            </p>
            <button className="btn-secondary w-full">
              Usar Plantilla
            </button>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Crowdfunding</h3>
            <p className="text-sm text-gray-600 mb-4">
              Contrato para campañas de crowdfunding con objetivos y recompensas.
            </p>
            <button className="btn-secondary w-full">
              Usar Plantilla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractsPage; 