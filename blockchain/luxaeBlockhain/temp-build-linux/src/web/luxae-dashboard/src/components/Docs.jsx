import React from 'react';
import {
    Box,
    Container,
    Heading,
    Text,
    Code,
    VStack,
    UnorderedList,
    ListItem,
    Divider,
    useColorModeValue,
    OrderedList,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td
} from '@chakra-ui/react';

export function Docs() {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                <Heading as="h1" size="xl">Documentación de Luxae Blockchain</Heading>

                {/* Instalación */}
                <Box>
                    <Heading size="lg" mb={4}>Instalación</Heading>
                    <VStack align="stretch" spacing={4} bg={bgColor} p={6} borderRadius="lg" borderWidth="1px">
                        <Text>Requisitos previos:</Text>
                        <UnorderedList pl={4}>
                            <ListItem>Node.js ≥ 16.0.0</ListItem>
                            <ListItem>pnpm (recomendado) o npm</ListItem>
                            <ListItem>Git</ListItem>
                        </UnorderedList>

                        <Text>Pasos de instalación:</Text>
                        <OrderedList pl={4} spacing={2}>
                            <ListItem>
                                Clonar el repositorio:
                                <Code display="block" p={2} mt={2}>
                                    git clone https://github.com/tu-usuario/luxae.git
                                </Code>
                            </ListItem>
                            <ListItem>
                                Instalar dependencias:
                                <Code display="block" p={2} mt={2}>
                                    cd luxae
                                    pnpm install
                                </Code>
                            </ListItem>
                            <ListItem>
                                Configurar variables de entorno:
                                <Code display="block" p={2} mt={2}>
                                    cp .env.example .env
                                </Code>
                            </ListItem>
                            <ListItem>
                                Iniciar el sistema:
                                <Code display="block" p={2} mt={2}>
                                    ./start-all.sh
                                </Code>
                            </ListItem>
                        </OrderedList>
                    </VStack>
                </Box>

                {/* API Reference */}
                <Box>
                    <Heading size="lg" mb={4}>API Reference</Heading>
                    <Tabs>
                        <TabList>
                            <Tab>Blockchain</Tab>
                            <Tab>Contratos</Tab>
                            <Tab>Validadores</Tab>
                            <Tab>Red P2P</Tab>
                        </TabList>

                        <TabPanels>
                            <TabPanel>
                                <VStack align="stretch" spacing={4}>
                                    <Heading size="md">Endpoints Blockchain</Heading>
                                    <Table variant="simple">
                                        <Thead>
                                            <Tr>
                                                <Th>Endpoint</Th>
                                                <Th>Método</Th>
                                                <Th>Descripción</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            <Tr>
                                                <Td><Code>/api/status</Code></Td>
                                                <Td>GET</Td>
                                                <Td>Estado actual de la blockchain</Td>
                                            </Tr>
                                            <Tr>
                                                <Td><Code>/api/blocks</Code></Td>
                                                <Td>GET</Td>
                                                <Td>Lista de bloques</Td>
                                            </Tr>
                                        </Tbody>
                                    </Table>

                                    <Text>Ejemplo de uso:</Text>
                                    <Code display="block" p={4}>
                                        {`
// Obtener estado de la blockchain
const response = await axios.get('http://localhost:3000/api/status');
const blockchainStatus = response.data;
                                        `}
                                    </Code>
                                </VStack>
                            </TabPanel>

                            <TabPanel>
                                <VStack align="stretch" spacing={4}>
                                    <Heading size="md">API de Contratos</Heading>
                                    <Table variant="simple">
                                        <Thead>
                                            <Tr>
                                                <Th>Endpoint</Th>
                                                <Th>Método</Th>
                                                <Th>Descripción</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            <Tr>
                                                <Td><Code>/api/contracts</Code></Td>
                                                <Td>GET</Td>
                                                <Td>Lista de contratos desplegados</Td>
                                            </Tr>
                                            <Tr>
                                                <Td><Code>/api/contracts/:address</Code></Td>
                                                <Td>GET</Td>
                                                <Td>Detalles de un contrato específico</Td>
                                            </Tr>
                                            <Tr>
                                                <Td><Code>/api/contracts/deploy</Code></Td>
                                                <Td>POST</Td>
                                                <Td>Desplegar un nuevo contrato</Td>
                                            </Tr>
                                        </Tbody>
                                    </Table>

                                    <Text>Ejemplo de despliegue de contrato:</Text>
                                    <Code display="block" p={4}>
                                        {`
// Desplegar un contrato
const contractData = {
    name: 'MiContrato',
    bytecode: '0x...',
    abi: [...],
    args: []
};

const response = await axios.post('http://localhost:3000/api/contracts/deploy', contractData);
const deployedContract = response.data;
                                        `}
                                    </Code>
                                </VStack>
                            </TabPanel>

                            {/* ... otros tabs ... */}
                        </TabPanels>
                    </Tabs>
                </Box>

                {/* Integración con Aplicaciones Web */}
                <Box>
                    <Heading size="lg" mb={4}>Integración con Aplicaciones Web</Heading>
                    <VStack align="stretch" spacing={4} bg={bgColor} p={6} borderRadius="lg" borderWidth="1px">
                        <Text>Para integrar Luxae en tu aplicación web:</Text>
                        
                        <OrderedList spacing={4}>
                            <ListItem>
                                Instalar dependencias necesarias:
                                <Code display="block" p={2} mt={2}>
                                    npm install axios @tanstack/react-query
                                </Code>
                            </ListItem>

                            <ListItem>
                                Configurar cliente API:
                                <Code display="block" p={2} mt={2}>
                                    {`
// api.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;
                                    `}
                                </Code>
                            </ListItem>

                            <ListItem>
                                Ejemplo de uso en React:
                                <Code display="block" p={2} mt={2}>
                                    {`
import { useQuery } from '@tanstack/react-query';
import api from './api';

function BlockchainStatus() {
    const { data, isLoading } = useQuery({
        queryKey: ['blockchain-status'],
        queryFn: async () => {
            const response = await api.get('/api/status');
            return response.data;
        }
    });

    if (isLoading) return 'Cargando...';
    
    return (
        <div>
            <h2>Estado de la Blockchain</h2>
            <p>Altura: {data.height}</p>
            <p>Nodos: {data.nodes}</p>
        </div>
    );
}
                                    `}
                                </Code>
                            </ListItem>
                        </OrderedList>
                    </VStack>
                </Box>
            </VStack>
        </Container>
    );
} 