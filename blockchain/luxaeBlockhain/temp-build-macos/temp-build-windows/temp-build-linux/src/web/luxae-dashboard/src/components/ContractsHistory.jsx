import React from 'react';
import {
    Box,
    Container,
    Heading,
    Text,
    Table,
    Tbody,
    Tr,
    Td,
    Badge,
    VStack,
    HStack,
    Card,
    CardHeader,
    CardBody,
    useColorModeValue,
    Link,
    Icon,
    Divider,
    Stack
} from '@chakra-ui/react';
import { FiExternalLink, FiCopy } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import api from '../config/axios';

export function ContractsHistory() {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.400');

    // Genesis message
    const genesisMessage = {
        blockNumber: "0",
        message: "Luxae Blockchain",
        description: "Cuando aceptas dinero en pago por tu esfuerzo, lo haces sólo con el convencimiento de que lo cambiarás por el producto del esfuerzo de otros. No son los mendigos ni los saqueadores los que dan su valor al dinero. Ni un océano de lágrimas ni todas las armas del mundo pueden transformar esos papeles de tu cartera en el pan que necesitarás para sobrevivir mañana. Esos papeles, que deberían haber sido oro, son una prenda de honor – tu derecho a la energía de los hombres que producen. Tu cartera es tu manifestación de esperanza de que en algún lugar del mundo a tu alrededor hay hombres que no transgredirán ese principio moral que es el origen del dinero. ¿Es eso lo que consideras malvado?",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        network: "Luxae Mainnet",
        author: "Equipo Luxae",
        purpose: "Crear una plataforma blockchain más eficiente y sostenible"
    };

    // Query para obtener los contratos de la blockchain
    const { data: contracts, isLoading } = useQuery({
        queryKey: ['contracts'],
        queryFn: async () => {
            const response = await api.get('/api/contracts');
            return response.data;
        }
    });

    const truncateAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <Container maxW="container.xl" py={{ base: 4, md: 8 }}>
            <VStack spacing={{ base: 4, md: 8 }} align="stretch">
                {/* Bloque Génesis */}
                <Card mx={{ base: 4, md: 0 }}>
                    <CardHeader>
                        <Heading size={{ base: "md", md: "lg" }}>Bloque Génesis</Heading>
                    </CardHeader>
                    <CardBody>
                        <Stack spacing={4}>
                            <Text 
                                fontSize={{ base: "md", md: "lg" }} 
                                fontWeight="bold"
                            >
                                {genesisMessage.message}
                            </Text>
                            <Text 
                                color="gray.600" 
                                fontSize={{ base: "sm", md: "md" }}
                            >
                                {genesisMessage.description}
                            </Text>
                            <Badge colorScheme="blue" alignSelf="start">
                                Bloque #{genesisMessage.blockNumber} | {genesisMessage.network}
                            </Badge>
                        </Stack>
                    </CardBody>
                </Card>

                {/* Lista de Contratos */}
                <Box mx={{ base: 4, md: 0 }}>
                    <Heading 
                        size={{ base: "md", md: "lg" }} 
                        mb={{ base: 4, md: 6 }}
                    >
                        Contratos Desplegados
                    </Heading>
                    <VStack spacing={{ base: 3, md: 4 }} align="stretch">
                        {isLoading ? (
                            <Text>Cargando contratos...</Text>
                        ) : contracts?.length > 0 ? (
                            contracts.map((contract) => (
                                <Box
                                    key={contract.address}
                                    bg={bgColor}
                                    p={{ base: 4, md: 6 }}
                                    borderRadius="lg"
                                    shadow="sm"
                                    border="1px"
                                    borderColor={borderColor}
                                >
                                    <VStack align="stretch" spacing={3}>
                                        <HStack 
                                            justify="space-between" 
                                            wrap={{ base: "wrap", md: "nowrap" }}
                                        >
                                            <Heading size="sm">{contract.name}</Heading>
                                            <Badge colorScheme="purple">{contract.type}</Badge>
                                        </HStack>
                                        
                                        <Table variant="simple" size={{ base: "sm", md: "md" }}>
                                            <Tbody>
                                                <Tr>
                                                    <Td 
                                                        fontWeight="bold" 
                                                        width={{ base: "120px", md: "200px" }}
                                                        px={{ base: 2, md: 4 }}
                                                    >
                                                        Dirección
                                                    </Td>
                                                    <Td px={{ base: 2, md: 4 }}>
                                                        <HStack spacing={2}>
                                                            <Text>{truncateAddress(contract.address)}</Text>
                                                            <Icon 
                                                                as={FiCopy} 
                                                                cursor="pointer"
                                                                onClick={() => navigator.clipboard.writeText(contract.address)}
                                                            />
                                                            <Link 
                                                                as={RouterLink} 
                                                                to={`/contracts/${contract.address}`}
                                                            >
                                                                <Icon as={FiExternalLink} cursor="pointer" />
                                                            </Link>
                                                        </HStack>
                                                    </Td>
                                                </Tr>
                                                <Tr>
                                                    <Td fontWeight="bold">Creador</Td>
                                                    <Td>{truncateAddress(contract.creator)}</Td>
                                                </Tr>
                                                <Tr>
                                                    <Td fontWeight="bold">Bloque</Td>
                                                    <Td>#{contract.blockNumber}</Td>
                                                </Tr>
                                                <Tr>
                                                    <Td fontWeight="bold">Transacciones</Td>
                                                    <Td>
                                                        <HStack>
                                                            <Text>{contract.transactions}</Text>
                                                            <Badge colorScheme="blue">Ver Txns</Badge>
                                                        </HStack>
                                                    </Td>
                                                </Tr>
                                            </Tbody>
                                        </Table>
                                    </VStack>
                                </Box>
                            ))
                        ) : (
                            <Text color={textColor}>No hay contratos desplegados aún</Text>
                        )}
                    </VStack>
                </Box>
            </VStack>
        </Container>
    );
}

export default ContractsHistory; 