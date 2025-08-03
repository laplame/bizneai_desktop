import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (url, options = {}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [error, setError] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = options.maxReconnectAttempts || 5;
    const reconnectInterval = options.reconnectInterval || 3000;

    const connect = useCallback(() => {
        try {
            wsRef.current = new WebSocket(url);
            
            wsRef.current.onopen = () => {
                console.log('🔗 WebSocket conectado:', url);
                setIsConnected(true);
                setError(null);
                reconnectAttempts.current = 0;
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setLastMessage(data);
                    
                    // Emitir evento personalizado para que otros componentes puedan escuchar
                    window.dispatchEvent(new CustomEvent('websocket-message', { detail: data }));
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            wsRef.current.onclose = (event) => {
                console.log('🔌 WebSocket desconectado:', event.code, event.reason);
                setIsConnected(false);
                
                // Intentar reconectar si no fue un cierre intencional
                if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectAttempts.current++;
                    console.log(`🔄 Intentando reconectar... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, reconnectInterval);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('❌ Error en WebSocket:', error);
                setError('Error de conexión WebSocket');
            };

        } catch (error) {
            console.error('Error creando WebSocket:', error);
            setError('No se pudo crear la conexión WebSocket');
        }
    }, [url, maxReconnectAttempts, reconnectInterval]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close(1000, 'Cierre intencional');
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        setIsConnected(false);
    }, []);

    const sendMessage = useCallback((message) => {
        if (wsRef.current && isConnected) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket no está conectado');
        }
    }, [isConnected]);

    useEffect(() => {
        connect();
        
        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected,
        lastMessage,
        error,
        sendMessage,
        connect,
        disconnect
    };
}; 