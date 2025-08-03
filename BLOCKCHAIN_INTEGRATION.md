# 🚀 BizneAI Blockchain Integration

This document explains the integration of the Luxae Blockchain with the BizneAI POS system, providing mining capabilities and blockchain functionality within the Electron desktop application.

## 📋 Overview

The BizneAI POS system now includes a complete blockchain integration with the following features:

- **Luxae Blockchain Node**: Full blockchain node with Proof of Stake (PoS) consensus
- **Mining Operations**: Start/stop mining with real-time statistics
- **Wallet Management**: View wallet balances and transaction history
- **Blockchain Explorer**: Real-time blockchain data and statistics
- **API Integration**: RESTful API for blockchain operations

## 🏗️ Architecture

```
BizneAI POS (Electron App)
├── Main Process (electron/main.js)
│   ├── Blockchain Service (electron/blockchain-service.js)
│   └── IPC Communication
├── Renderer Process (React App)
│   ├── BlockchainMining Component
│   └── Blockchain API Integration
└── Blockchain Node (blockchain/luxaeBlockhain/)
    ├── Validator Node
    ├── API Server
    └── P2P Network
```

## 🚀 Quick Start

### 1. Setup Blockchain

```bash
# Run the blockchain setup script
./scripts/setup-blockchain.sh
```

This script will:
- Install blockchain dependencies
- Initialize the blockchain
- Generate validator keys
- Deploy genesis block
- Create startup/stop scripts

### 2. Start the Application

```bash
# Start everything (POS + Blockchain)
npm run start:all

# Or start components individually
npm run dev                    # Start POS frontend
npm run blockchain:start       # Start blockchain node
npm run blockchain:api         # Start blockchain API
npm run electron:dev           # Start Electron app
```

### 3. Access Mining Interface

1. Open the BizneAI POS application
2. Navigate to the "Minería" (Mining) section in the sidebar
3. Use the blockchain controls to start/stop the node and mining operations

## 🔧 Blockchain Features

### Node Management
- **Start Node**: Initialize the blockchain validator node
- **Stop Node**: Gracefully shut down the blockchain node
- **Status Monitoring**: Real-time node status and health checks

### Mining Operations
- **Start Mining**: Begin mining operations with PoS consensus
- **Stop Mining**: Stop mining operations
- **Mining Statistics**: Real-time hash rate, difficulty, and block information
- **Mining Rewards**: Earn LXA tokens for successful block validation

### Wallet Features
- **Balance Check**: View wallet balances in LXA tokens
- **Transaction History**: View past transactions
- **Address Management**: Manage multiple wallet addresses

### Blockchain Data
- **Chain Length**: Current blockchain length
- **Pending Transactions**: Number of transactions in the mempool
- **Block Information**: Latest block details and statistics

## 📊 API Endpoints

The blockchain API runs on `http://localhost:3001` and provides:

### Health & Status
- `GET /health` - API health check
- `GET /api/v2/blockchain/status` - Blockchain status

### Mining Operations
- `GET /api/v2/mining/status` - Mining status
- `POST /api/v2/mining/start` - Start mining
- `POST /api/v2/mining/stop` - Stop mining

### Wallet Operations
- `GET /api/v2/wallet/{address}` - Get wallet information
- `POST /api/v2/transactions` - Send transaction

### Documentation
- `GET /api-docs` - Interactive API documentation

## 🛠️ Development

### Project Structure

```
├── electron/
│   ├── main.js                 # Electron main process
│   ├── preload.js              # Preload script for IPC
│   └── blockchain-service.js    # Blockchain service
├── src/
│   ├── components/
│   │   └── BlockchainMining.tsx # Mining interface
│   └── types/
│       └── blockchain.d.ts     # TypeScript declarations
├── blockchain/
│   └── luxaeBlockhain/         # Blockchain node code
└── scripts/
    └── setup-blockchain.sh     # Setup script
```

### Available Scripts

```bash
# Blockchain Management
npm run blockchain:start        # Start blockchain node
npm run blockchain:api          # Start blockchain API
npm run blockchain:stop         # Stop blockchain services
npm run blockchain:status       # Check blockchain status
npm run blockchain:keys         # Generate new keys
npm run blockchain:monitor      # Monitor network
npm run blockchain:info         # Get node information

# Development
npm run blockchain:dev          # Start blockchain in development mode
npm run start:all              # Start everything (POS + Blockchain)

# Electron
npm run electron:dev           # Start Electron with blockchain
npm run electron:build         # Build Electron app with blockchain
```

## 🔐 Security Features

- **Context Isolation**: Electron security with isolated renderer process
- **IPC Communication**: Secure communication between main and renderer processes
- **Process Management**: Graceful startup and shutdown of blockchain services
- **Error Handling**: Comprehensive error handling and recovery

## 📈 Monitoring

### Real-time Statistics
- Blockchain node status
- Mining operations status
- Hash rate and difficulty
- Transaction count and pending transactions
- Wallet balances

### Logs
- Blockchain node logs: `blockchain/luxaeBlockhain/logs/`
- API server logs: Available through the API
- Electron logs: Console output

## 🚨 Troubleshooting

### Common Issues

1. **Blockchain won't start**
   ```bash
   # Check if ports are available
   lsof -i :3001
   lsof -i :30303
   
   # Restart blockchain
   npm run blockchain:stop
   npm run blockchain:start
   ```

2. **API not responding**
   ```bash
   # Check API health
   curl http://localhost:3001/health
   
   # Check blockchain status
   ./blockchain-status.sh
   ```

3. **Mining not working**
   ```bash
   # Check mining status
   curl http://localhost:3001/api/v2/mining/status
   
   # Restart mining
   curl -X POST http://localhost:3001/api/v2/mining/stop
   curl -X POST http://localhost:3001/api/v2/mining/start
   ```

### Debug Mode

```bash
# Start with debug logging
DEBUG=* npm run blockchain:start

# Check detailed logs
tail -f blockchain/luxaeBlockhain/logs/node.log
```

## 🔄 Updates

### Updating Blockchain
```bash
# Pull latest blockchain code
git pull origin main

# Reinstall dependencies
npm install

# Restart blockchain
npm run blockchain:stop
npm run blockchain:start
```

### Updating POS System
```bash
# Update POS dependencies
npm install

# Rebuild application
npm run build
npm run electron:build
```

## 📚 Additional Resources

- [Luxae Blockchain Documentation](blockchain/luxaeBlockhain/README.md)
- [API Documentation](http://localhost:3001/api-docs) (when running)
- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://reactjs.org/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the blockchain integration
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: The blockchain functionality is only available in the Electron desktop application. The web version will show a message indicating that blockchain features are desktop-only. 