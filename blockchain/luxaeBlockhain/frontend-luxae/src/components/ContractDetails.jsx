import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ContractDetails = () => {
    const { contractAddress } = useParams();
    const navigate = useNavigate();
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [participatingNodes, setParticipatingNodes] = useState([]);
    const [luxaeGenerated, setLuxaeGenerated] = useState(0);
    const [promotions, setPromotions] = useState([]);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        loadContractDetails();
    }, [contractAddress]);

    const loadContractDetails = async () => {
        try {
            setLoading(true);
            
            // Cargar detalles del contrato
            const contractResponse = await fetch(`http://localhost:3000/api/contracts/${contractAddress}`);
            const contractData = await contractResponse.json();
            
            if (contractData.success) {
                setContract(contractData.data);
                
                // Cargar nodos participantes
                const nodesResponse = await fetch(`http://localhost:3000/api/contracts/${contractAddress}/nodes`);
                const nodesData = await nodesResponse.json();
                if (nodesData.success) {
                    setParticipatingNodes(nodesData.data || []);
                }
                
                // Cargar Luxae generados
                const luxaeResponse = await fetch(`http://localhost:3000/api/contracts/${contractAddress}/luxae`);
                const luxaeData = await luxaeResponse.json();
                if (luxaeData.success) {
                    setLuxaeGenerated(luxaeData.data?.total || 0);
                }
                
                // Cargar promociones
                const promotionsResponse = await fetch(`http://localhost:3000/api/contracts/${contractAddress}/promotions`);
                const promotionsData = await promotionsResponse.json();
                if (promotionsData.success) {
                    setPromotions(promotionsData.data || []);
                }
                
                // Cargar transacciones
                const transactionsResponse = await fetch(`http://localhost:3000/api/contracts/${contractAddress}/transactions`);
                const transactionsData = await transactionsResponse.json();
                if (transactionsData.success) {
                    setTransactions(transactionsData.data || []);
                }
            }
        } catch (error) {
            console.error('Error cargando detalles del contrato:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Contrato no encontrado</h2>
                    <button
                        onClick={() => navigate('/contracts')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Volver a Contratos
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <button
                            onClick={() => navigate('/contracts')}
                            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
                        >
                            ← Volver a Contratos
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            📋 Detalles del Contrato
                        </h1>
                        <p className="text-gray-600">{contract.name}</p>
                    </div>
                    <div className="text-right">
                        <span className={`px-3 py-1 text-sm rounded-full ${
                            contract.status === 'deployed' ? 'bg-green-100 text-green-800' :
                            contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                            {contract.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Información General */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Información General</h3>
                    <div className="space-y-3">
                        <div>
                            <span className="text-sm font-medium text-gray-500">Dirección:</span>
                            <p className="text-sm text-gray-900 font-mono break-all">{contract.address}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500">Tipo:</span>
                            <p className="text-sm text-gray-900">{contract.type}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500">Fecha de Creación:</span>
                            <p className="text-sm text-gray-900">{new Date(contract.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500">Propietario:</span>
                            <p className="text-sm text-gray-900 font-mono">{contract.owner}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🪙 Luxae Generados</h3>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                            {luxaeGenerated.toLocaleString()} LUX
                        </div>
                        <p className="text-sm text-gray-600">Total generado por este contrato</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🎁 Promociones</h3>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-2">
                            {promotions.length}
                        </div>
                        <p className="text-sm text-gray-600">Promociones activas</p>
                    </div>
                </div>
            </div>

            {/* Nodos Participantes */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🖥️ Nodos Participantes</h3>
                {participatingNodes.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nodo ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Dirección
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Luxae Contribuidos
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Última Actividad
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {participatingNodes.map((node) => (
                                    <tr key={node.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{node.id}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-mono">
                                                {node.address.substring(0, 10)}...
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                node.status === 'active' ? 'bg-green-100 text-green-800' :
                                                node.status === 'inactive' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {node.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {node.luxaeContributed?.toLocaleString() || 0} LUX
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(node.lastActivity).toLocaleDateString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="text-gray-500 mb-4">
                            <div className="text-4xl mb-4">🖥️</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay nodos participantes</h3>
                            <p className="text-gray-600">Este contrato aún no tiene nodos participando.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Promociones */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎁 Promociones del Contrato</h3>
                {promotions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {promotions.map((promotion) => (
                            <div key={promotion.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-lg font-semibold text-gray-900">{promotion.name}</h4>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        promotion.status === 'active' ? 'bg-green-100 text-green-800' :
                                        promotion.status === 'expired' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {promotion.status}
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm mb-3">{promotion.description}</p>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Recompensa:</span>
                                        <span className="font-medium">{promotion.rewardAmount} LUX</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Participantes:</span>
                                        <span className="font-medium">{promotion.participantsCount}/{promotion.maxParticipants}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Fecha Inicio:</span>
                                        <span className="font-medium">{new Date(promotion.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Fecha Fin:</span>
                                        <span className="font-medium">{new Date(promotion.endDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="text-gray-500 mb-4">
                            <div className="text-4xl mb-4">🎁</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay promociones</h3>
                            <p className="text-gray-600">Este contrato no tiene promociones activas.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Transacciones Recientes */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Transacciones Recientes</h3>
                {transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Hash
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Método
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        De
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Valor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transactions.map((tx) => (
                                    <tr key={tx.hash} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-mono">
                                                {tx.hash.substring(0, 10)}...
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{tx.method}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-mono">
                                                {tx.from.substring(0, 10)}...
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {tx.value ? `${tx.value} LUX` : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                tx.status === 'success' ? 'bg-green-100 text-green-800' :
                                                tx.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(tx.timestamp).toLocaleString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="text-gray-500 mb-4">
                            <div className="text-4xl mb-4">📝</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay transacciones</h3>
                            <p className="text-gray-600">Este contrato aún no tiene transacciones registradas.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContractDetails; 