import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const PromotionDashboard = () => {
    const [promotions, setPromotions] = useState([]);
    const [userAddress, setUserAddress] = useState('');
    const [userBalance, setUserBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [newPromotion, setNewPromotion] = useState({
        name: '',
        description: '',
        rewardAmount: 100,
        maxParticipants: 1000
    });

    // WebSocket para actualizaciones en tiempo real
    const { isConnected: wsConnected } = useWebSocket(
        'ws://localhost:3000/ws',
        { maxReconnectAttempts: 10, reconnectInterval: 2000 }
    );

    // Cargar promociones
    const loadPromotions = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/promotions/list');
            const data = await response.json();
            if (data.success) {
                setPromotions(data.data);
            }
        } catch (error) {
            console.error('Error cargando promociones:', error);
        }
    };

    // Cargar estadísticas
    const loadStats = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/promotions/stats');
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    };

    // Cargar balance del usuario
    const loadUserBalance = async (address) => {
        if (!address) return;
        
        try {
            const response = await fetch(`http://localhost:3000/api/promotions/balance/${address}`);
            const data = await response.json();
            if (data.success) {
                setUserBalance(data.data.balance);
            }
        } catch (error) {
            console.error('Error cargando balance:', error);
        }
    };

    // Participar en promoción
    const participateInPromotion = async (promotionId) => {
        if (!userAddress) {
            alert('Por favor ingresa tu dirección de wallet');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/promotions/participate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    promotionId,
                    userAddress,
                    userData: {
                        address: userAddress,
                        referralCode: 'LUXAE2024',
                        socialMediaVerified: true,
                        kycVerified: true
                    }
                })
            });

            const data = await response.json();
            if (data.success) {
                alert(`¡Participación exitosa! Recompensa: ${data.data.reward.amount} LUX`);
                loadUserBalance(userAddress);
                loadPromotions();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error participando:', error);
            alert('Error al participar en la promoción');
        } finally {
            setLoading(false);
        }
    };

    // Crear nueva promoción
    const createPromotion = async () => {
        if (!newPromotion.name || !newPromotion.description) {
            alert('Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/promotions/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newPromotion)
            });

            const data = await response.json();
            if (data.success) {
                alert('Promoción creada exitosamente');
                setNewPromotion({ name: '', description: '', rewardAmount: 100, maxParticipants: 1000 });
                loadPromotions();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error creando promoción:', error);
            alert('Error al crear la promoción');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPromotions();
        loadStats();
    }, []);

    useEffect(() => {
        if (userAddress) {
            loadUserBalance(userAddress);
        }
    }, [userAddress]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    🎁 Dashboard de Promociones Luxae
                </h1>
                <p className="text-gray-600">
                    Participa en promociones y gana tokens LUX
                </p>
            </div>

            {/* Estadísticas */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalPromotions}</div>
                        <div className="text-sm text-blue-600">Promociones Activas</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{stats.totalUsers}</div>
                        <div className="text-sm text-green-600">Usuarios Participando</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{stats.circulatingSupply}</div>
                        <div className="text-sm text-purple-600">LUX en Circulación</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{stats.totalRewardsGenerated}</div>
                        <div className="text-sm text-orange-600">Recompensas Generadas</div>
                    </div>
                </div>
            )}

            {/* Configuración de Usuario */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">👤 Configuración de Usuario</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dirección de Wallet
                        </label>
                        <input
                            type="text"
                            value={userAddress}
                            onChange={(e) => setUserAddress(e.target.value)}
                            placeholder="0x..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Balance LUX
                        </label>
                        <div className="text-2xl font-bold text-green-600">
                            {userBalance} LUX
                        </div>
                    </div>
                </div>
            </div>

            {/* Crear Promoción */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">➕ Crear Nueva Promoción</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre de la Promoción
                        </label>
                        <input
                            type="text"
                            value={newPromotion.name}
                            onChange={(e) => setNewPromotion({...newPromotion, name: e.target.value})}
                            placeholder="Ej: Promoción de Bienvenida"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Recompensa (LUX)
                        </label>
                        <input
                            type="number"
                            value={newPromotion.rewardAmount}
                            onChange={(e) => setNewPromotion({...newPromotion, rewardAmount: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción
                        </label>
                        <textarea
                            value={newPromotion.description}
                            onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
                            placeholder="Describe la promoción..."
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Máximo de Participantes
                        </label>
                        <input
                            type="number"
                            value={newPromotion.maxParticipants}
                            onChange={(e) => setNewPromotion({...newPromotion, maxParticipants: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={createPromotion}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Creando...' : 'Crear Promoción'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de Promociones */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">🎁 Promociones Disponibles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {promotions.map((promotion) => (
                        <div key={promotion.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{promotion.name}</h3>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                    promotion.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {promotion.status}
                                </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">{promotion.description}</p>
                            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                                <div>
                                    <span className="text-gray-500">Recompensa:</span>
                                    <div className="font-semibold text-green-600">{promotion.rewardAmount} LUX</div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Participantes:</span>
                                    <div className="font-semibold">{promotion.currentParticipants}/{promotion.maxParticipants}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => participateInPromotion(promotion.id)}
                                disabled={loading || promotion.status !== 'active' || promotion.currentParticipants >= promotion.maxParticipants}
                                className="w-full bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Participando...' : 'Participar'}
                            </button>
                        </div>
                    ))}
                </div>
                {promotions.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        No hay promociones disponibles
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromotionDashboard; 