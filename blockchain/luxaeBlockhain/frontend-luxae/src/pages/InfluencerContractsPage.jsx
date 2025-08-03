import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const InfluencerContractsPage = () => {
    const [contracts, setContracts] = useState([]);
    const [influencers, setInfluencers] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedBlockchain, setSelectedBlockchain] = useState('ethereum');
    const [selectedToken, setSelectedToken] = useState('luxae');
    
    const [contractForm, setContractForm] = useState({
        title: '',
        description: '',
        influencerId: '',
        nodeIds: [],
        rewardAmount: '',
        rewardToken: 'luxae',
        duration: '',
        requirements: '',
        blockchain: 'ethereum',
        contractType: 'promotion',
        startDate: '',
        endDate: '',
        minFollowers: '',
        engagementRate: '',
        contentType: '',
        deliverables: ''
    });

    // WebSocket para actualizaciones en tiempo real
    const { isConnected: wsConnected } = useWebSocket(
        'ws://localhost:3000/ws',
        { maxReconnectAttempts: 10, reconnectInterval: 2000 }
    );

    // Tipos de contratos disponibles
    const contractTypes = [
        {
            id: 'promotion',
            name: 'Promoción de Producto',
            description: 'Contrato para promocionar productos o servicios específicos',
            icon: '📢',
            requirements: ['Contenido en redes sociales', 'Menciones del producto', 'Métricas de engagement']
        },
        {
            id: 'campaign',
            name: 'Campaña de Marketing',
            description: 'Campaña completa de marketing digital',
            icon: '🎯',
            requirements: ['Estrategia de contenido', 'Análisis de audiencia', 'Reportes de resultados']
        },
        {
            id: 'partnership',
            name: 'Alianza Estratégica',
            description: 'Alianza a largo plazo entre influencer y nodo',
            icon: '🤝',
            requirements: ['Contenido regular', 'Branding consistente', 'Colaboración continua']
        },
        {
            id: 'event',
            name: 'Evento Especial',
            description: 'Contrato para eventos específicos o lanzamientos',
            icon: '🎪',
            requirements: ['Cobertura del evento', 'Contenido en vivo', 'Post-event content']
        }
    ];

    // Tokens disponibles
    const availableTokens = [
        { id: 'luxae', name: 'Luxae (LUX)', symbol: 'LUX', blockchain: 'luxae' },
        { id: 'ethereum', name: 'Ethereum (ETH)', symbol: 'ETH', blockchain: 'ethereum' },
        { id: 'usdt', name: 'Tether (USDT)', symbol: 'USDT', blockchain: 'ethereum' },
        { id: 'usdc', name: 'USD Coin (USDC)', symbol: 'USDC', blockchain: 'ethereum' },
        { id: 'dai', name: 'Dai (DAI)', symbol: 'DAI', blockchain: 'ethereum' },
        { id: 'wbtc', name: 'Wrapped Bitcoin (WBTC)', symbol: 'WBTC', blockchain: 'ethereum' }
    ];

    // Blockchains soportadas
    const blockchains = [
        { id: 'ethereum', name: 'Ethereum', icon: '🔷' },
        { id: 'luxae', name: 'Luxae Blockchain', icon: '💎' },
        { id: 'polygon', name: 'Polygon', icon: '🟣' },
        { id: 'bsc', name: 'Binance Smart Chain', icon: '🟡' }
    ];

    // Cargar datos iniciales
    useEffect(() => {
        loadInfluencers();
        loadNodes();
        loadContracts();
    }, []);

    const loadInfluencers = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/influencers/list');
            const data = await response.json();
            if (data.success) {
                setInfluencers(data.data || []);
            }
        } catch (error) {
            console.error('Error cargando influencers:', error);
        }
    };

    const loadNodes = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/nodes/list');
            const data = await response.json();
            if (data.success) {
                setNodes(data.data || []);
            }
        } catch (error) {
            console.error('Error cargando nodos:', error);
        }
    };

    const loadContracts = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/influencer-contracts/list');
            const data = await response.json();
            if (data.success) {
                setContracts(data.data || []);
            }
        } catch (error) {
            console.error('Error cargando contratos:', error);
        }
    };

    const createContract = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/influencer-contracts/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contractForm)
            });

            const data = await response.json();
            if (data.success) {
                alert('Contrato creado exitosamente');
                setShowCreateModal(false);
                resetForm();
                loadContracts();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error creando contrato:', error);
            alert('Error al crear el contrato');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setContractForm({
            title: '',
            description: '',
            influencerId: '',
            nodeIds: [],
            rewardAmount: '',
            rewardToken: 'luxae',
            duration: '',
            requirements: '',
            blockchain: 'ethereum',
            contractType: 'promotion',
            startDate: '',
            endDate: '',
            minFollowers: '',
            engagementRate: '',
            contentType: '',
            deliverables: ''
        });
    };

    const handleTokenChange = (tokenId) => {
        const token = availableTokens.find(t => t.id === tokenId);
        setSelectedToken(tokenId);
        setContractForm({
            ...contractForm,
            rewardToken: tokenId,
            blockchain: token?.blockchain || 'ethereum'
        });
    };

    const handleBlockchainChange = (blockchainId) => {
        setSelectedBlockchain(blockchainId);
        setContractForm({
            ...contractForm,
            blockchain: blockchainId
        });
    };

    const getTokenByBlockchain = (blockchainId) => {
        return availableTokens.filter(token => token.blockchain === blockchainId);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    🤝 Contratos Influencer-Nodo
                </h1>
                <p className="text-gray-600">
                    Crea y gestiona contratos inteligentes entre influencers y nodos de la red Luxae
                </p>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{contracts.length}</div>
                    <div className="text-sm text-blue-600">Contratos Activos</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{influencers.length}</div>
                    <div className="text-sm text-green-600">Influencers</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{nodes.length}</div>
                    <div className="text-sm text-purple-600">Nodos Disponibles</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                        {contracts.filter(c => c.status === 'completed').length}
                    </div>
                    <div className="text-sm text-orange-600">Completados</div>
                </div>
            </div>

            {/* Botón Crear Contrato */}
            <div className="mb-8">
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
                >
                    ✨ Crear Nuevo Contrato
                </button>
            </div>

            {/* Lista de Contratos */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Contratos Activos</h2>
                {contracts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contrato
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Influencer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nodos
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Recompensa
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
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
                                {contracts.map((contract) => (
                                    <tr key={contract.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{contract.title}</div>
                                            <div className="text-sm text-gray-500">{contract.contractType}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{contract.influencer?.name}</div>
                                            <div className="text-sm text-gray-500">{contract.influencer?.followers} seguidores</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {contract.nodes?.length || 0} nodos
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {contract.rewardAmount} {contract.rewardToken}
                                            </div>
                                            <div className="text-sm text-gray-500">{contract.blockchain}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                contract.status === 'active' ? 'bg-green-100 text-green-800' :
                                                contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                contract.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {contract.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(contract.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button className="text-blue-600 hover:text-blue-900">
                                                    Ver Detalles
                                                </button>
                                                <button className="text-green-600 hover:text-green-900">
                                                    Ejecutar
                                                </button>
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
                            <div className="text-6xl mb-4">🤝</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay contratos</h3>
                            <p className="text-gray-600">Comienza creando tu primer contrato entre influencer y nodo.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Creación de Contrato */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">
                                ✨ Crear Contrato Influencer-Nodo
                            </h3>
                            
                            <form onSubmit={(e) => { e.preventDefault(); createContract(); }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Información Básica */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">📋 Información Básica</h4>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Título del Contrato *
                                            </label>
                                            <input
                                                type="text"
                                                value={contractForm.title}
                                                onChange={(e) => setContractForm({...contractForm, title: e.target.value})}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Ej: Promoción de Producto Luxae"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Descripción *
                                            </label>
                                            <textarea
                                                value={contractForm.description}
                                                onChange={(e) => setContractForm({...contractForm, description: e.target.value})}
                                                required
                                                rows="3"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Describe los detalles del contrato..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tipo de Contrato *
                                            </label>
                                            <select
                                                value={contractForm.contractType}
                                                onChange={(e) => setContractForm({...contractForm, contractType: e.target.value})}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {contractTypes.map((type) => (
                                                    <option key={type.id} value={type.id}>
                                                        {type.icon} {type.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Influencer *
                                            </label>
                                            <select
                                                value={contractForm.influencerId}
                                                onChange={(e) => setContractForm({...contractForm, influencerId: e.target.value})}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar influencer...</option>
                                                {influencers.map((influencer) => (
                                                    <option key={influencer.id} value={influencer.id}>
                                                        {influencer.name} ({influencer.followers} seguidores)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Configuración de Recompensa */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">💰 Configuración de Recompensa</h4>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Blockchain *
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {blockchains.map((blockchain) => (
                                                    <button
                                                        key={blockchain.id}
                                                        type="button"
                                                        onClick={() => handleBlockchainChange(blockchain.id)}
                                                        className={`p-3 border rounded-lg text-center ${
                                                            selectedBlockchain === blockchain.id
                                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                : 'border-gray-300 hover:border-gray-400'
                                                        }`}
                                                    >
                                                        <div className="text-2xl mb-1">{blockchain.icon}</div>
                                                        <div className="text-sm font-medium">{blockchain.name}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Token de Recompensa *
                                            </label>
                                            <select
                                                value={selectedToken}
                                                onChange={(e) => handleTokenChange(e.target.value)}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {getTokenByBlockchain(selectedBlockchain).map((token) => (
                                                    <option key={token.id} value={token.id}>
                                                        {token.name} ({token.symbol})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Cantidad de Recompensa *
                                            </label>
                                            <input
                                                type="number"
                                                value={contractForm.rewardAmount}
                                                onChange={(e) => setContractForm({...contractForm, rewardAmount: e.target.value})}
                                                required
                                                min="0"
                                                step="0.01"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Fecha de Inicio *
                                                </label>
                                                <input
                                                    type="date"
                                                    value={contractForm.startDate}
                                                    onChange={(e) => setContractForm({...contractForm, startDate: e.target.value})}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Fecha de Fin *
                                                </label>
                                                <input
                                                    type="date"
                                                    value={contractForm.endDate}
                                                    onChange={(e) => setContractForm({...contractForm, endDate: e.target.value})}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Requisitos y Entregables */}
                                <div className="mt-6 space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">📋 Requisitos y Entregables</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Requisitos Mínimos
                                            </label>
                                            <textarea
                                                value={contractForm.requirements}
                                                onChange={(e) => setContractForm({...contractForm, requirements: e.target.value})}
                                                rows="4"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Describe los requisitos mínimos para el influencer..."
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Entregables Esperados
                                            </label>
                                            <textarea
                                                value={contractForm.deliverables}
                                                onChange={(e) => setContractForm({...contractForm, deliverables: e.target.value})}
                                                rows="4"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Describe los entregables esperados..."
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Mínimo de Seguidores
                                            </label>
                                            <input
                                                type="number"
                                                value={contractForm.minFollowers}
                                                onChange={(e) => setContractForm({...contractForm, minFollowers: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="1000"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tasa de Engagement (%)
                                            </label>
                                            <input
                                                type="number"
                                                value={contractForm.engagementRate}
                                                onChange={(e) => setContractForm({...contractForm, engagementRate: e.target.value})}
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="2.5"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tipo de Contenido
                                            </label>
                                            <input
                                                type="text"
                                                value={contractForm.contentType}
                                                onChange={(e) => setContractForm({...contractForm, contentType: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Posts, Stories, Videos..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Nodos Participantes */}
                                <div className="mt-6">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">🖥️ Nodos Participantes</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-48 overflow-y-auto">
                                        {nodes.map((node) => (
                                            <label key={node.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={contractForm.nodeIds.includes(node.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setContractForm({
                                                                ...contractForm,
                                                                nodeIds: [...contractForm.nodeIds, node.id]
                                                            });
                                                        } else {
                                                            setContractForm({
                                                                ...contractForm,
                                                                nodeIds: contractForm.nodeIds.filter(id => id !== node.id)
                                                            });
                                                        }
                                                    }}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{node.name}</div>
                                                    <div className="text-sm text-gray-500">{node.address.substring(0, 10)}...</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Botones de Acción */}
                                <div className="flex justify-end space-x-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                                    >
                                        {loading ? 'Creando...' : 'Crear Contrato'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InfluencerContractsPage; 