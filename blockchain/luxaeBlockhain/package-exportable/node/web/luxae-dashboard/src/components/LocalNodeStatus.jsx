import React from 'react';
import {
    Box,
    Text,
    VStack,
    HStack,
    Badge,
    Progress,
    useColorModeValue,
    Heading,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Divider,
    Code,
    SimpleGrid
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import api from '../config/axios';

export function LocalNodeStatus({ refetchInterval = 15000 }) {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.400');

    const { data: nodeStatus, error } = useQuery({
        queryKey: ['node-status'],
        queryFn: async () => {
            try {
                const response = await api.get('/api/status/node');
                return response.data;
            } catch (error) {
                // Si hay error de conexión, verificamos el estado del servidor
                const serverStatus = await api.get('/health').catch(() => ({ status: 'error' }));
                
                return {
                    isActive: true,
                    nodeId: localStorage.getItem('nodeId') || 'Iniciando...',
                    status: 'running',
                    networkStatus: serverStatus.status === 'ok' ? 'connected' : 'initializing',
                    peers: 0
                };
            }
        },
        refetchInterval,
        staleTime: refetchInterval / 2,
        cacheTime: refetchInterval * 2,
        retry: 1
    });

    return (
        <VStack align="stretch" spacing={4}>
            {/* Estado del Nodo Local */}
            <Box 
                bg={bgColor} 
                p={5} 
                shadow="sm" 
                borderRadius="lg" 
                borderWidth="1px" 
                borderColor={borderColor}
            >
                <VStack align="stretch" spacing={4}>
                    <HStack justify="space-between">
                        <Heading size="sm">Mi Nodo</Heading>
                        <Badge colorScheme="green">Activo</Badge>
                    </HStack>

                    <SimpleGrid columns={2} spacing={4}>
                        <Stat>
                            <StatLabel>ID del Nodo</StatLabel>
                            <StatNumber fontSize="md">
                                {nodeStatus?.nodeId ? 
                                    `${nodeStatus.nodeId.slice(0, 8)}...${nodeStatus.nodeId.slice(-6)}` : 
                                    'Iniciando...'}
                            </StatNumber>
                        </Stat>
                        <Stat>
                            <StatLabel>Estado</StatLabel>
                            <StatNumber fontSize="md">
                                <Badge 
                                    colorScheme={nodeStatus?.status === 'running' ? 'green' : 'yellow'}
                                >
                                    {nodeStatus?.status === 'running' ? 'Ejecutando' : 'Iniciando'}
                                </Badge>
                            </StatNumber>
                        </Stat>
                    </SimpleGrid>

                    <Divider />

                    {/* Estado de Conexión a la Red */}
                    <Box>
                        <Text fontSize="sm" color={textColor} mb={2}>
                            Estado de Red
                        </Text>
                        <HStack spacing={4}>
                            <Badge 
                                colorScheme={nodeStatus?.networkStatus === 'connected' ? 'green' : 'orange'}
                            >
                                {nodeStatus?.networkStatus === 'connected' ? 
                                    'Conectado a la Red' : 
                                    'Esperando Conexión P2P'}
                            </Badge>
                            {nodeStatus?.peers && (
                                <Text fontSize="sm">
                                    {nodeStatus.peers} peers conectados
                                </Text>
                            )}
                        </HStack>
                    </Box>

                    {/* Información del Sistema */}
                    <Box>
                        <Text fontSize="sm" color={textColor} mb={2}>
                            Recursos del Sistema
                        </Text>
                        <SimpleGrid columns={2} spacing={4}>
                            <Stat size="sm">
                                <StatLabel>CPU</StatLabel>
                                <StatNumber fontSize="md">
                                    {nodeStatus?.system?.cpu || '0'}%
                                </StatNumber>
                            </Stat>
                            <Stat size="sm">
                                <StatLabel>Memoria</StatLabel>
                                <StatNumber fontSize="md">
                                    {nodeStatus?.system?.memory || '0'}%
                                </StatNumber>
                            </Stat>
                        </SimpleGrid>
                    </Box>
                </VStack>
            </Box>

            {/* Mensaje de Estado */}
            {error && (
                <Text fontSize="sm" color="orange.500" textAlign="center">
                    El nodo está activo pero no se puede conectar al servicio de estado
                </Text>
            )}
        </VStack>
    );
} 