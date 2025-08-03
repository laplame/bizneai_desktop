import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Container,
    VStack,
    Box,
    Heading,
    Text,
    Table,
    Tbody,
    Tr,
    Td,
    Badge,
    HStack,
    Link,
    Icon,
    useColorModeValue
} from '@chakra-ui/react';
import api from '../config/axios';

export function ContractDetails() {
    const { address } = useParams();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.400');

    const { data: contract } = useQuery(['contract', address], async () => {
        const response = await api.get(`/api/contracts/${address}`);
        return response.data;
    });

    const { data: auditTrail } = useQuery(['contract', address, 'audit'], async () => {
        const response = await api.get(`/api/contracts/${address}/audit`);
        return response.data;
    });

    const { data: metrics } = useQuery(['contract', address, 'metrics'], async () => {
        const response = await api.get(`/api/contracts/${address}/metrics`);
        return response.data;
    });

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                {/* Genesis Block Card */}
                <Box>
                    <Heading size="md" mb={6}>Detalles del Contrato</Heading>
                    <Table variant="simple">
                        <Tbody>
                            <Tr>
                                <Td fontWeight="bold" width="200px">Dirección</Td>
                                <Td>
                                    <HStack>
                                        <Text>{contract?.address}</Text>
                                    </HStack>
                                </Td>
                            </Tr>
                            <Tr>
                                <Td fontWeight="bold">Creador</Td>
                                <Td>{contract?.creator}</Td>
                            </Tr>
                            <Tr>
                                <Td fontWeight="bold">Bloque</Td>
                                <Td>#{contract?.blockNumber}</Td>
                            </Tr>
                            <Tr>
                                <Td fontWeight="bold">Transacciones</Td>
                                <Td>
                                    <HStack>
                                        <Text>{contract?.transactions}</Text>
                                    </HStack>
                                </Td>
                            </Tr>
                        </Tbody>
                    </Table>
                </Box>
            </VStack>
        </Container>
    );
} 