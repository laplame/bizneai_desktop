import React from 'react';
import {
    Box,
    Container,
    Heading,
    VStack,
    HStack,
    Text,
    Badge,
    Divider,
    Center
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import api from '../config/axios';

const API_URL = 'http://localhost:3000/api';

export function Transactions() {
    const { data: pendingTransactions, isLoading, error } = useQuery({
        queryKey: ['transactions', 'pending'],
        queryFn: async () => {
            try {
                const response = await api.get('/api/transactions/pending');
                if (!response.data || response.data.length === 0) {
                    return { message: 'No hay transacciones pendientes' };
                }
                return response.data;
            } catch (error) {
                console.error('Error fetching transactions:', error);
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
                        {error.message || 'Error al cargar las transacciones'}
                    </Text>
                </Center>
            </Container>
        );
    }

    return (
        <Container maxW="container.xl" py={5}>
            <Heading mb={5}>Transacciones Pendientes</Heading>
            
            <VStack spacing={4} align="stretch">
                {pendingTransactions?.map((tx) => (
                    <Box 
                        key={tx.hash}
                        p={4}
                        borderWidth="1px"
                        borderRadius="lg"
                        shadow="sm"
                    >
                        <HStack justify="space-between" mb={2}>
                            <Text fontSize="sm" color="gray.500">
                                Hash: {truncateHash(tx.hash)}
                            </Text>
                            <Badge colorScheme="yellow">Pendiente</Badge>
                        </HStack>
                        <Divider my={2} />
                        <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                                <Text fontSize="sm">De: {truncateAddress(tx.fromAddress)}</Text>
                                <Text fontSize="sm">A: {truncateAddress(tx.toAddress)}</Text>
                            </VStack>
                            <Text fontWeight="bold">
                                {formatNumber(tx.amount)} LXA
                            </Text>
                        </HStack>
                    </Box>
                ))}
            </VStack>
        </Container>
    );
}

function truncateHash(hash) {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function truncateAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
} 