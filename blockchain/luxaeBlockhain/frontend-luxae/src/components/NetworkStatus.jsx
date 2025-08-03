import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const NetworkStatus = () => {
    const [networkData, setNetworkData] = useState({
        nodes: [],
        totalNodes: 0,
        activeConnections: 0,
        lastUpdate: null
    });

    const [isConnected, setIsConnected] = useState(false);

    // WebSocket para actualizaciones en tiempo real
    const { isConnected: wsConnected, lastMessage, error: wsError } = useWebSocket(
        'ws://localhost:3000/ws',
        {
            maxReconnectAttempts: 10,
            reconnectInterval: 2000
        }
    );

    // Escuchar eventos de WebSocket
    useEffect(() => {
        const handleWebSocketMessage = (event) => {
            const data = event.detail;
            
            if (data.type === 'network_update') {
                setNetworkData(prev => ({
                    ...prev,
                    nodes: data.nodes || [],
                    totalNodes: data.totalNodes || 0,
                    activeConnections: data.activeConnections || 0,
                    lastUpdate: new Date().toLocaleTimeString()
                }));
            }
        };

        window.addEventListener('websocket-message', handleWebSocketMessage);
        
        return () => {
            window.removeEventListener('websocket-message', handleWebSocketMessage);
        };
    }, []);

    // Actualizar estado de conexión
    useEffect(() => {
        setIsConnected(wsConnected);
    }, [wsConnected]);

    // Función para obtener el estado de los nodos
    const fetchNetworkStatus = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/status/status');
            const data = await response.json();
            
            setNetworkData(prev => ({
                ...prev,
                nodes: data.network?.peers || [],
                totalNodes: data.network?.connections || 0,
                activeConnections: data.network?.peers?.length || 0,
                lastUpdate: new Date().toLocaleTimeString()
            }));
        } catch (error) {
            console.error('Error fetching network status:', error);
        }
    };

    // Actualizar datos cada 30 segundos si no hay WebSocket
    useEffect(() => {
        if (!wsConnected) {
            fetchNetworkStatus();
            const interval = setInterval(fetchNetworkStatus, 30000);
            return () => clearInterval(interval);
        }
    }, [wsConnected]);

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    🌐 Estado de la Red
                </h3>
                <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                        {isConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                </div>
            </div>

            {wsError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    ⚠️ Error de WebSocket: {wsError}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{networkData.totalNodes}</div>
                    <div className="text-sm text-blue-600">Nodos Totales</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{networkData.activeConnections}</div>
                    <div className="text-sm text-green-600">Conexiones Activas</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{networkData.nodes.length}</div>
                    <div className="text-sm text-purple-600">Peers Conectados</div>
                </div>
            </div>

            {networkData.nodes.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Nodos Conectados:</h4>
                    <div className="space-y-2">
                        {networkData.nodes.map((node, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm font-mono">{node.id}</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                    Latencia: {node.latency || 0}ms
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {networkData.lastUpdate && (
                <div className="mt-4 text-xs text-gray-500 text-center">
                    Última actualización: {networkData.lastUpdate}
                </div>
            )}

            {!isConnected && (
                <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                    ℹ️ Usando actualizaciones HTTP (WebSocket no disponible)
                </div>
            )}
        </div>
    );
};

export default NetworkStatus; 