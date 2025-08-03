import React from 'react';
import {
    Box,
    Container,
    Heading,
    Text,
    Button,
    VStack,
    HStack,
    SimpleGrid,
    Icon,
    Code,
    useClipboard,
    useToast,
    Divider,
    useColorModeValue,
    Link as ChakraLink
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { 
    FaGithub as GitHubIcon,
    FaServer as ServerIcon,
    FaCode as CodeIcon,
    FaBook as BookIcon 
} from 'react-icons/fa';
import { FiActivity, FiDatabase, FiUsers, FiBook } from 'react-icons/fi';

const REPO_URL = 'https://github.com/laplame/luxaeBlockchain.git';

export function LandingPage() {
    const { hasCopied, onCopy } = useClipboard(`git clone ${REPO_URL}`);
    const toast = useToast();
    const bgColor = useColorModeValue('gray.50', 'gray.700');
    const cardBg = useColorModeValue('white', 'gray.800');

    const handleCopy = () => {
        onCopy();
        toast({
            title: 'Comando copiado',
            description: 'El comando de clonación ha sido copiado al portapapeles',
            status: 'success',
            duration: 2000,
        });
    };

    const features = [
        {
            icon: FiActivity,
            title: 'Monitoreo en Tiempo Real',
            description: 'Visualiza el estado de la red, nodos conectados y estadísticas en tiempo real.'
        },
        {
            icon: FiDatabase,
            title: 'Estado de la Blockchain',
            description: 'Consulta bloques, transacciones y el estado de los validadores.'
        },
        {
            icon: FiUsers,
            title: 'Gestión de Red P2P',
            description: 'Administra conexiones P2P y monitorea la salud de la red.'
        },
        {
            icon: FiBook,
            title: 'Documentación Completa',
            description: 'Accede a guías detalladas y documentación técnica del sistema.'
        }
    ];

    return (
        <Box bg={bgColor} minH="100vh">
            <Container maxW="container.xl" py={20}>
                <VStack spacing={10}>
                    {/* Hero Section */}
                    <Box textAlign="center" mb={10}>
                        <Heading as="h1" size="2xl" mb={4}>
                            Luxae Dashboard
                        </Heading>
                        <Text fontSize="xl" mb={8}>
                            Panel de control para monitorear y administrar tu nodo Luxae
                        </Text>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="100%" maxW="400px" mx="auto">
                            <Button
                                as={RouterLink}
                                to="/dashboard"
                                colorScheme="blue"
                                size="lg"
                            >
                                Ir al Dashboard
                            </Button>
                            <Button
                                as={RouterLink}
                                to="/docs"
                                colorScheme="gray"
                                size="lg"
                                leftIcon={<FiBook />}
                            >
                                Documentación
                            </Button>
                        </SimpleGrid>
                    </Box>

                    {/* Features Grid */}
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8} width="100%">
                        {features.map((feature, index) => (
                            <Box
                                key={index}
                                bg={cardBg}
                                p={6}
                                borderRadius="lg"
                                shadow="md"
                                textAlign="center"
                            >
                                <Icon
                                    as={feature.icon}
                                    w={10}
                                    h={10}
                                    mb={4}
                                    color="blue.500"
                                />
                                <Heading size="md" mb={2}>
                                    {feature.title}
                                </Heading>
                                <Text color="gray.500">
                                    {feature.description}
                                </Text>
                            </Box>
                        ))}
                    </SimpleGrid>

                    {/* Quick Start Section */}
                    <Box textAlign="center" mt={16}>
                        <Heading as="h2" size="lg" mb={4}>
                            Inicio Rápido
                        </Heading>
                        <Text mb={4}>
                            Inicia todo el sistema con un solo comando:
                        </Text>
                        <Box
                            bg={cardBg}
                            p={4}
                            borderRadius="md"
                            maxW="600px"
                            mx="auto"
                            fontFamily="mono"
                        >
                            ./start-all.sh
                        </Box>
                        <Text mt={4}>
                            Para más detalles, consulta la{' '}
                            <ChakraLink as={RouterLink} to="/docs" color="blue.500">
                                documentación completa
                            </ChakraLink>
                        </Text>
                    </Box>
                </VStack>
            </Container>
        </Box>
    );
}

function Feature({ icon, title, text }) {
    return (
        <VStack spacing={4} align="center" textAlign="center">
            <Icon as={icon} w={10} h={10} color="teal.500" />
            <Heading size="md">{title}</Heading>
            <Text>{text}</Text>
        </VStack>
    );
}

function DocSection({ title, items }) {
    return (
        <Box>
            <Heading size="md" mb={4}>{title}</Heading>
            <VStack align="stretch" spacing={2}>
                {items.map((item, index) => (
                    <Text key={index}>{item}</Text>
                ))}
            </VStack>
        </Box>
    );
} 