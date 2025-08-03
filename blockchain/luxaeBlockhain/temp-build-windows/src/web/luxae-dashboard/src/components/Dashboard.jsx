import React from 'react';
import {
    Container,
    SimpleGrid,
    Box,
    Heading,
    Stack,
    useColorModeValue,
    Divider,
    VStack
} from '@chakra-ui/react';
import { NetworkStatus } from './NetworkStatus';
import { LocalNodeStatus } from './LocalNodeStatus';
import { useQuery } from '@tanstack/react-query';

export function Dashboard() {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    // Configuración de refresco diferente para cada componente
    const networkRefetchInterval = 5000;  // Estado de red cada 5 segundos
    const localNodeRefetchInterval = 15000; // Estado local cada 15 segundos

    return (
        <Container maxW="container.xl" py={{ base: 4, md: 8 }}>
            <VStack spacing={{ base: 4, md: 8 }} align="stretch">
                {/* Encabezado */}
                <Heading 
                    as="h1" 
                    size={{ base: "lg", md: "xl" }}
                    px={{ base: 4, md: 0 }}
                >
                    Dashboard
                </Heading>

                {/* Grid Principal */}
                <SimpleGrid 
                    columns={{ base: 1, lg: 2 }} 
                    spacing={{ base: 4, md: 8 }}
                    px={{ base: 4, md: 0 }}
                >
                    {/* Estado de la Red */}
                    <Box
                        bg={bgColor}
                        p={{ base: 4, md: 6 }}
                        borderRadius="lg"
                        border="1px"
                        borderColor={borderColor}
                        height="fit-content"
                        transition="all 0.2s"
                    >
                        <Heading size="md" mb={{ base: 3, md: 4 }}>
                            Estado de la Red
                        </Heading>
                        <NetworkStatus refetchInterval={networkRefetchInterval} />
                    </Box>

                    {/* Estado del Nodo Local */}
                    <Box
                        bg={bgColor}
                        p={{ base: 4, md: 6 }}
                        borderRadius="lg"
                        border="1px"
                        borderColor={borderColor}
                        height="fit-content"
                        transition="all 0.2s"
                    >
                        <Heading size="md" mb={{ base: 3, md: 4 }}>
                            Estado del Nodo Local
                        </Heading>
                        <LocalNodeStatus refetchInterval={localNodeRefetchInterval} />
                    </Box>
                </SimpleGrid>

                <Divider />

                {/* Sección de Estadísticas Detalladas */}
                <Box
                    bg={bgColor}
                    p={{ base: 4, md: 6 }}
                    borderRadius="lg"
                    border="1px"
                    borderColor={borderColor}
                    mx={{ base: 4, md: 0 }}
                >
                    <Stack spacing={4}>
                        <Heading size="md">Estadísticas Detalladas</Heading>
                        <SimpleGrid 
                            columns={{ base: 1, md: 2, lg: 4 }} 
                            spacing={{ base: 4, md: 6 }}
                        >
                            {/* Aquí puedes agregar más componentes de estadísticas */}
                        </SimpleGrid>
                    </Stack>
                </Box>
            </VStack>
        </Container>
    );
} 