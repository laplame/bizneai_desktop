# 🚀 BizneAI POS System with Blockchain Integration

A modern Point of Sale (POS) system with integrated blockchain mining capabilities, built with React, TypeScript, and Electron.

## ✨ Features

### 🛍️ POS System
- **Modern UI**: Clean, responsive interface with real-time updates
- **Product Management**: Add, edit, and manage products with categories
- **Barcode Scanning**: Integrated barcode scanner for quick product lookup
- **Customer Management**: Track customer information and purchase history
- **Sales Reports**: Comprehensive reporting and analytics
- **Virtual Tickets**: Digital receipts and ticket management
- **Settings Management**: Configurable system settings

### ⛏️ Blockchain Integration
- **Luxae Blockchain**: Integrated Proof of Stake (PoS) blockchain
- **Mining Operations**: Start/stop mining with real-time statistics
- **Wallet Management**: View balances and transaction history
- **Blockchain Explorer**: Real-time blockchain data and statistics
- **API Integration**: RESTful API for blockchain operations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BizneAi
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start the application**
   ```bash
   # Start everything (POS + Blockchain)
   npm run start:all
   
   # Or start components individually
   npm run dev                    # Start POS frontend
   npm run blockchain:start       # Start blockchain node
   npm run electron:dev           # Start Electron app
   ```

## 🏗️ Architecture

```
BizneAI POS (Electron App)
├── Main Process (electron/main.js)
│   ├── Simple Blockchain Service
│   └── IPC Communication
├── Renderer Process (React App)
│   ├── BlockchainMining Component
│   └── Blockchain API Integration
└── Blockchain Node
    ├── Validator Node
    ├── API Server
    └── Mining Operations
```

## 🔧 Available Scripts

### Development
```bash
npm run dev                    # Start development server
npm run build                  # Build for production
npm run electron:dev          # Start Electron with blockchain
npm run start:all             # Start everything (POS + Blockchain)
```

### Blockchain Management
```bash
npm run blockchain:start       # Start blockchain node
npm run blockchain:api         # Start blockchain API
npm run blockchain:status      # Check blockchain status
npm run blockchain:keys        # Generate new keys
npm run blockchain:monitor     # Monitor network
npm run blockchain:info        # Get node information
```

### Build & Distribution
```bash
npm run electron:build         # Build Electron app
npm run dist                   # Build distribution packages
npm run dist:mac              # Build for macOS
npm run dist:win              # Build for Windows
npm run dist:linux            # Build for Linux
```

## 🎯 Usage

### POS System
1. **Start the application**: Run `npm run start:all`
2. **Add products**: Use the product management interface
3. **Process sales**: Scan barcodes or select products
4. **Generate reports**: View sales analytics and reports
5. **Manage customers**: Track customer information

### Blockchain Mining
1. **Access mining interface**: Navigate to "Minería" in the sidebar
2. **Start blockchain node**: Click "Start Node" to initialize
3. **Begin mining**: Click "Start Mining" to begin operations
4. **Monitor statistics**: View real-time mining data
5. **Manage wallet**: Check balances and transaction history

## 📊 Blockchain Features

### Node Management
- **Start/Stop Node**: Initialize and manage blockchain node
- **Status Monitoring**: Real-time node health checks
- **API Integration**: RESTful API for blockchain operations

### Mining Operations
- **Proof of Stake**: PoS consensus mechanism
- **Real-time Statistics**: Hash rate, difficulty, block information
- **Mining Rewards**: Earn tokens for successful validation
- **Automatic Mining**: Continuous mining simulation

### Wallet Features
- **Balance Check**: View wallet balances in LXA tokens
- **Transaction History**: Track past transactions
- **Address Management**: Manage multiple wallet addresses

## 🔐 Security Features

- **Context Isolation**: Electron security with isolated renderer process
- **IPC Communication**: Secure communication between processes
- **Process Management**: Graceful startup and shutdown
- **Error Handling**: Comprehensive error handling and recovery

## 📈 Monitoring

### Real-time Statistics
- Blockchain node status
- Mining operations status
- Hash rate and difficulty
- Transaction count and pending transactions
- Wallet balances

### API Endpoints
- `GET /health` - API health check
- `GET /api/v2/blockchain/status` - Blockchain status
- `GET /api/v2/mining/status` - Mining status
- `POST /api/v2/mining/start` - Start mining
- `POST /api/v2/mining/stop` - Stop mining
- `GET /api/v2/wallet/{address}` - Get wallet information
- `POST /api/v2/transactions` - Send transaction

## 🚨 Troubleshooting

### Common Issues

1. **Blockchain won't start**
   ```bash
   # Check if ports are available
   lsof -i :3001
   
   # Restart blockchain
   npm run blockchain:stop
   npm run blockchain:start
   ```

2. **API not responding**
   ```bash
   # Check API health
   curl http://localhost:3001/health
   ```

3. **Mining not working**
   ```bash
   # Check mining status
   curl http://localhost:3001/api/v2/mining/status
   ```

### Debug Mode
```bash
# Start with debug logging
DEBUG=* npm run blockchain:start
```

## 📚 Documentation

- [Blockchain Integration Guide](BLOCKCHAIN_INTEGRATION.md)
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
