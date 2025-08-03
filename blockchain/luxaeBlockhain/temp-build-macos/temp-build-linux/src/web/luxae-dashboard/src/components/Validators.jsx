import React from 'react';
import {
    Container,
    VStack,
    Box,
    Heading,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    useColorModeValue,
    Text,
    Spinner,
    Center
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import api from '../config/axios';

export function Validators() {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    const { data: validators, isLoading, error } = useQuery({
        queryKey: ['validators'],
        queryFn: async () => {
            try {
                const response = await api.get('/api/validators');
                if (!response.data || response.data.length === 0) {
                    return { message: 'No hay validadores registrados aún' };
                }
                return response.data;
            } catch (error) {
                console.error('Error fetching validators:', error);
                throw error;
            }
        },
        retry: 1,
        retryDelay: 1000
    });

    if (error) {
        return (
            <Container maxW="container.xl" py={8}>
                <Center>
                    <Text color="orange.500" fontSize="lg">
                        {error.message || 'Error al cargar los validadores'}
                    </Text>
                </Center>
            </Container>
        );
    }

    if (isLoading) {
        return (
            <Container maxW="container.xl" py={8}>
                <Center>
                    <Spinner size="xl" />
                </Center>
            </Container>
        );
    }

    return (
        <Container maxW="container.xl" py={{ base: 4, md: 8 }}>
            <VStack spacing={{ base: 4, md: 8 }} align="stretch">
                <Box
                    bg={bgColor}
                    p={{ base: 4, md: 6 }}
                    borderRadius="lg"
                    border="1px"
                    borderColor={borderColor}
                >
                    <Heading size="md" mb={6}>Validadores Activos</Heading>
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th>Dirección</Th>
                                <Th>Estado</Th>
                                <Th isNumeric>Stake</Th>
                                <Th isNumeric>Bloques Validados</Th>
                                <Th>Última Actividad</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {validators?.length > 0 ? (
                                validators.map((validator) => (
                                    <Tr key={validator.address}>
                                        <Td>{validator.address}</Td>
                                        <Td>
                                            <Badge 
                                                colorScheme={validator.isActive ? 'green' : 'red'}
                                            >
                                                {validator.isActive ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </Td>
                                        <Td isNumeric>{validator.stake} LXA</Td>
                                        <Td isNumeric>{validator.blocksValidated}</Td>
                                        <Td>{new Date(validator.lastActivity).toLocaleString()}</Td>
                                    </Tr>
                                ))
                            ) : (
                                <Tr>
                                    <Td colSpan={5} textAlign="center">
                                        No hay validadores registrados
                                    </Td>
                                </Tr>
                            )}
                        </Tbody>
                    </Table>
                </Box>
            </VStack>
        </Container>
    );
} 