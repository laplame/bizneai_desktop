import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useNavigate } from 'react-router-dom';

const SmartContracts = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        deployed: 0,
        verified: 0,
        pending: 0
    });
    const [showDeployModal, setShowDeployModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [deployForm, setDeployForm] = useState({
        name: '',
        symbol: '',
        totalSupply: '',
        description: '',
        ownerAddress: ''
    });

    const navigate = useNavigate();

    // WebSocket para actualizaciones en tiempo real
    const { isConnected: wsConnected } = useWebSocket(
        'ws://localhost:3000/ws',
        { maxReconnectAttempts: 10, reconnectInterval: 2000 }
    );

    // Plantillas de contratos
    const contractTemplates = [
        {
            id: 'erc20',
            name: 'ERC-20 Token',
            description: 'Contrato estándar para tokens fungibles con funcionalidades básicas de transferencia.',
            icon: '🪙',
            fields: [
                { name: 'name', label: 'Nombre del Token', type: 'text', required: true },
                { name: 'symbol', label: 'Símbolo', type: 'text', required: true },
                { name: 'totalSupply', label: 'Supply Total', type: 'number', required: true },
                { name: 'description', label: 'Descripción', type: 'textarea', required: false }
            ]
        },
        {
            id: 'erc721',
            name: 'ERC-721 NFT',
            description: 'Contrato para tokens no fungibles (NFTs) con metadatos únicos.',
            icon: '🖼️',
            fields: [
                { name: 'name', label: 'Nombre de la Colección', type: 'text', required: true },
                { name: 'symbol', label: 'Símbolo', type: 'text', required: true },
                { name: 'description', label: 'Descripción', type: 'textarea', required: false }
            ]
        },
        {
            id: 'crowdfunding',
            name: 'Crowdfunding',
            description: 'Contrato para campañas de crowdfunding con objetivos y recompensas.',
            icon: '💰',
            fields: [
                { name: 'name', label: 'Nombre del Proyecto', type: 'text', required: true },
                { name: 'targetAmount', label: 'Meta de Financiamiento', type: 'number', required: true },
                { name: 'description', label: 'Descripción del Proyecto', type: 'textarea', required: true }
            ]
        },
        {
            id: 'promotion',
            name: 'Promoción Luxae',
            description: 'Contrato para gestionar promociones y generar tokens LUX.',
            icon: '🎁',
            fields: [
                { name: 'name', label: 'Nombre de la Promoción', type: 'text', required: true },
                { name: 'rewardAmount', label: 'Recompensa (LUX)', type: 'number', required: true },
                { name: 'maxParticipants', label: 'Máximo Participantes', type: 'number', required: true },
                { name: 'description', label: 'Descripción', type: 'textarea', required: true }
            ]
        }
    ];

    // Cargar contratos
    const loadContracts = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/contracts/list');
            const data = await response.json();
            if (data.success) {
                setContracts(data.data || []);
                updateStats(data.data || []);
            }
        } catch (error) {
            console.error('Error cargando contratos:', error);
        }
    };

    // Actualizar estadísticas
    const updateStats = (contractsList) => {
        const stats = {
            total: contractsList.length,
            deployed: contractsList.filter(c => c.status === 'deployed').length,
            verified: contractsList.filter(c => c.verified).length,
            pending: contractsList.filter(c => c.status === 'pending').length
        };
        setStats(stats);
    };

    // Desplegar contrato
    const deployContract = async () => {
        if (!selectedTemplate) return;

        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/contracts/deploy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    template: selectedTemplate.id,
                    ...deployForm
                })
            });

            const data = await response.json();
            if (data.success) {
                alert('Contrato desplegado exitosamente');
                setShowDeployModal(false);
                setDeployForm({ name: '', symbol: '', totalSupply: '', description: '', ownerAddress: '' });
                setSelectedTemplate(null);
                loadContracts();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error desplegando contrato:', error);
            alert('Error al desplegar el contrato');
        } finally {
            setLoading(false);
        }
    };

    // Ejecutar método del contrato
    const executeMethod = async (contractAddress, methodName, params = {}) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/contracts/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contractAddress,
                    method: methodName,
                    params
                })
            });

            const data = await response.json();
            if (data.success) {
                alert(`Método ${methodName} ejecutado exitosamente`);
                loadContracts();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error ejecutando método:', error);
            alert('Error al ejecutar el método');
        } finally {
            setLoading(false);
        }
    };

    // Verificar contrato
    const verifyContract = async (contractAddress) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/contracts/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ contractAddress })
            });

            const data = await response.json();
            if (data.success) {
                alert('Contrato verificado exitosamente');
                loadContracts();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error verificando contrato:', error);
            alert('Error al verificar el contrato');
        } finally {
            setLoading(false);
        }
    };

    // Seleccionar plantilla
    const selectTemplate = (template) => {
        setSelectedTemplate(template);
        setShowDeployModal(true);
        setDeployForm({ name: '', symbol: '', totalSupply: '', description: '', ownerAddress: '' });
    };

    useEffect(() => {
        loadContracts();
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    🔧 Smart Contracts
                </h1>
                <p className="text-gray-600">
                    Gestiona y ejecuta contratos inteligentes en la blockchain Luxae
                </p>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-blue-600">Total Contratos</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.deployed}</div>
                    <div className="text-sm text-green-600">Desplegados</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats.verified}</div>
                    <div className="text-sm text-purple-600">Verificados</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                    <div className="text-sm text-orange-600">Pendientes</div>
                </div>
            </div>

            {/* Plantillas de Contratos */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Plantillas de Contratos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {contractTemplates.map((template) => (
                        <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="text-3xl mb-2">{template.icon}</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                            <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                            <button
                                onClick={() => selectTemplate(template)}
                                className="w-full bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Usar Plantilla
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lista de Contratos */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Contratos Inteligentes</h2>
                    <button
                        onClick={() => setShowDeployModal(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                        Desplegar Contrato
                    </button>
                </div>

                {contracts.length > 0 ? (
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
                                {contracts.map((contract) => (
                                    <tr key={contract.address} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{contract.name}</div>
                                            <div className="text-sm text-gray-500">{contract.type}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-mono">
                                                {contract.address.substring(0, 10)}...
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                contract.status === 'deployed' ? 'bg-green-100 text-green-800' :
                                                contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {contract.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{contract.methods?.length || 0} métodos</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(contract.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => executeMethod(contract.address, 'balanceOf')}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Ejecutar
                                                </button>
                                                {!contract.verified && (
                                                    <button
                                                        onClick={() => verifyContract(contract.address)}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        Verificar
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => navigate(`/contract/${contract.address}`)}
                                                    className="text-purple-600 hover:text-purple-900"
                                                >
                                                    Ver Detalles
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
                            <div className="text-6xl mb-4">📄</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay contratos</h3>
                            <p className="text-gray-600">Comienza desplegando tu primer smart contract.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Despliegue */}
            {showDeployModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Desplegar {selectedTemplate?.name}
                            </h3>
                            
                            <form onSubmit={(e) => { e.preventDefault(); deployContract(); }}>
                                {selectedTemplate?.fields.map((field) => (
                                    <div key={field.name} className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {field.label}
                                        </label>
                                        {field.type === 'textarea' ? (
                                            <textarea
                                                value={deployForm[field.name] || ''}
                                                onChange={(e) => setDeployForm({...deployForm, [field.name]: e.target.value})}
                                                required={field.required}
                                                rows="3"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        ) : (
                                            <input
                                                type={field.type}
                                                value={deployForm[field.name] || ''}
                                                onChange={(e) => setDeployForm({...deployForm, [field.name]: e.target.value})}
                                                required={field.required}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        )}
                                    </div>
                                ))}
                                
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeployModal(false)}
                                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {loading ? 'Desplegando...' : 'Desplegar'}
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

export default SmartContracts; 