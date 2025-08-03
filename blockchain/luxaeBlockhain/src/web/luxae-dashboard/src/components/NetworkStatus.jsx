import React from 'react';
import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    Heading,
    Text,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    useColorModeValue,
    Spinner,
    Center
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import api from '../config/axios';

// Componente LoadingSpinner
function LoadingSpinner() {
    return (
        <Center p={8}>
            <Spinner 
                thickness='4px'
                speed='0.65s'
                emptyColor='gray.200'
                color='blue.500'
                size='xl'
            />
        </Center>
    );
}

export function NetworkStatus({ refetchInterval = 5000 }) {
    const { data: networkStatus, error } = useQuery({
        queryKey: ['network-status'],
        queryFn: async () => {
            const response = await api.get('/api/status/network');
            return response.data;
        },
        refetchInterval,
        staleTime: refetchInterval / 2,
        cacheTime: refetchInterval * 2,
        retry: 1
    });

    const { data: connections, error: connectionsError } = useQuery({
        queryKey: ['network', 'connections'],
        queryFn: async () => {
            try {
                const response = await api.get('/api/network/connections');
                return response.data;
            } catch (error) {
                console.error('Error fetching connections:', error);
                throw error;
            }
        },
        refetchInterval: 5000
    });

    const { data: stats, error: statsError } = useQuery({
        queryKey: ['network', 'stats'],
        queryFn: async () => {
            try {
                const response = await api.get('/api/network/stats');
                return response.data;
            } catch (error) {
                console.error('Error fetching stats:', error);
                throw error;
            }
        },
        refetchInterval: 5000
    });

    if (connectionsError || statsError) {
        return <div className="error-message">Error conectando con la red</div>;
    }

    if (!connections || !stats) return <LoadingSpinner />;

    return (
        <Box>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
                <StatCard
                    label="Nodos Conectados"
                    value={connections.total}
                    helpText={`${stats.nodeTypes.mobile || 0} móviles, ${stats.nodeTypes.desktop || 0} escritorio`}
                />
                <StatCard
                    label="Salud de la Red"
                    value={stats.networkHealth}
                    helpText={`Latencia promedio: ${stats.networkLatency}ms`}
                />
                <StatCard
                    label="Descubrimiento"
                    value={stats.discoveryEnabled ? "Activo" : "Inactivo"}
                    helpText="Búsqueda automática de nodos"
                />
            </SimpleGrid>

            <Box bg={useColorModeValue('white', 'gray.800')} p={5} shadow="md" borderRadius="lg">
                <Heading size="md" mb={4}>Nodos en la Red</Heading>
                {connections.connections.length > 0 ? (
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th>ID</Th>
                                <Th>Tipo</Th>
                                <Th>Plataforma</Th>
                                <Th>Latencia</Th>
                                <Th>Estado</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {connections.connections.map(node => (
                                <Tr key={node.id}>
                                    <Td>{truncateAddress(node.id)}</Td>
                                    <Td>
                                        <Badge colorScheme={node.deviceType === 'mobile' ? 'purple' : 'blue'}>
                                            {node.deviceType}
                                        </Badge>
                                    </Td>
                                    <Td>{node.platform}</Td>
                                    <Td isNumeric>{node.latency}ms</Td>
                                    <Td>
                                        <Badge colorScheme={node.connected ? 'green' : 'red'}>
                                            {node.connected ? 'Conectado' : 'Desconectado'}
                                        </Badge>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                ) : (
                    <Text color="gray.500" textAlign="center">No hay nodos conectados</Text>
                )}
            </Box>
        </Box>
    );
}

function truncateAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatLastSeen(timestamp) {
    if (!timestamp) return 'Nunca';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds/60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds/3600)}h ago`;
    return `${Math.floor(seconds/86400)}d ago`;
}

function StatCard({ label, value, helpText }) {
    return (
        <Stat p={4} bg={useColorModeValue('white', 'gray.800')} shadow="md" borderRadius="lg">
            <StatLabel>{label}</StatLabel>
            <StatNumber>{value}</StatNumber>
            {helpText && <StatHelpText>{helpText}</StatHelpText>}
        </Stat>
    );
} 