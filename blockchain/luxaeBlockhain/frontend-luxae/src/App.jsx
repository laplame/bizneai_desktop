import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import BlockchainPage from './pages/BlockchainPage';
import TransactionsPage from './pages/TransactionsPage';
import ValidatorsPage from './pages/ValidatorsPage';
import NetworkPage from './pages/NetworkPage';
import SettingsPage from './pages/SettingsPage';
import GenesisPage from './pages/GenesisPage';
import ContractsPage from './pages/ContractsPage';
import ContractDetailsPage from './pages/ContractDetailsPage';
import InfluencerContractsPage from './pages/InfluencerContractsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/blockchain" element={<BlockchainPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/validators" element={<ValidatorsPage />} />
            <Route path="/network" element={<NetworkPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/genesis" element={<GenesisPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/contract/:contractAddress" element={<ContractDetailsPage />} />
            <Route path="/influencer-contracts" element={<InfluencerContractsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
