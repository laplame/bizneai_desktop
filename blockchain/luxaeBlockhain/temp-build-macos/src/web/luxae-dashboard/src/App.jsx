import React from 'react';
import { ChakraProvider, Box } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { Validators } from './components/Validators';
import { Transactions } from './components/Transactions';
import { Navigation } from './components/Navigation';
import { LandingPage } from './components/LandingPage';
import ContractsHistory from './components/ContractsHistory';
import { Docs } from './components/Docs';
import { ContractDetails } from './components/ContractDetails';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ChakraProvider>
                <Router>
                    <Box minH="100vh">
                        <Navigation />
                        <Routes>
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/validators" element={<Validators />} />
                            <Route path="/transactions" element={<Transactions />} />
                            <Route path="/contracts" element={<ContractsHistory />} />
                            <Route path="/contracts/:address" element={<ContractDetails />} />
                            <Route path="/docs" element={<Docs />} />
                        </Routes>
                    </Box>
                </Router>
            </ChakraProvider>
        </QueryClientProvider>
    );
}

export default App; 