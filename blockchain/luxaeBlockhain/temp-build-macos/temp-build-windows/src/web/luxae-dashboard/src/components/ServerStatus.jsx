import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Badge,
    Tooltip,
    HStack,
    Text,
    Box,
    Spinner
} from '@chakra-ui/react';
import api from '../config/axios';

export function ServerStatus() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['server-health'],
        queryFn: async () => {
            try {
                const response = await api.get('/health');
                return response.data;
            } catch (error) {
                console.error('Error checking health:', error);
                return { 
                    status: 'error',
                    error: error.message 
                };
            }
        },
        refetchInterval: 10000 // Verificar cada 10 segundos
    });

    if (isLoading) {
        return (
            <HStack spacing={2}>
                <Spinner size="xs" />
                <Text>Verificando estado...</Text>
            </HStack>
        );
    }

    // Determinar el estado de conexión
    const getConnectionStatus = () => {
        if (!data) return { color: 'gray', text: 'Desconocido' };
        
        if (data.status === 'ok') {
            return { color: 'green', text: 'Conectado' };
        }
        
        if (data.status === 'partial') {
            return { color: 'yellow', text: 'Parcial' };
        }
        
        return { color: 'red', text: 'Desconectado' };
    };

    const status = getConnectionStatus();

    return (
        <HStack spacing={2}>
            <Tooltip 
                label={`API: ${data?.services?.api ? '✓' : '✗'} | 
                        Blockchain: ${data?.services?.blockchain ? '✓' : '✗'} | 
                        P2P: ${data?.services?.p2p ? '✓' : '✗'}`}
            >
                <Badge colorScheme={status.color} variant="subtle">
                    {status.text}
                </Badge>
            </Tooltip>
            {data?.node && (
                <Box fontSize="sm">
                    <Text>
                        {data.node.type === 'main' ? 'Nodo Principal' : 'Validador'} | 
                        Peers: {data.node.peers}
                    </Text>
                </Box>
            )}
        </HStack>
    );
} 