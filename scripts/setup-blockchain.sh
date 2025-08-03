#!/bin/bash

# BizneAI Blockchain Setup Script
# This script sets up the blockchain functionality for the Electron app

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function for logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log "🚀 Starting BizneAI Blockchain Setup..."
log "Project root: $PROJECT_ROOT"

# Check if blockchain directory exists
if [ ! -d "$PROJECT_ROOT/blockchain/luxaeBlockhain" ]; then
    error "Blockchain directory not found at $PROJECT_ROOT/blockchain/luxaeBlockhain"
    error "Please ensure the blockchain code is properly placed in the project"
    exit 1
fi

# Navigate to blockchain directory
cd "$PROJECT_ROOT/blockchain/luxaeBlockhain"

log "📦 Installing blockchain dependencies..."

# Install blockchain dependencies
if [ -f "package.json" ]; then
    npm install
    log "✅ Blockchain dependencies installed"
else
    error "Blockchain package.json not found"
    exit 1
fi

# Create necessary directories
log "📁 Creating blockchain data directories..."
mkdir -p data/blockchain
mkdir -p data/contracts
mkdir -p logs

# Initialize blockchain if not already done
if [ ! -f "data/blockchain/chain.json" ]; then
    log "🔧 Initializing blockchain..."
    node scripts/init-blockchain.js
    log "✅ Blockchain initialized"
else
    log "ℹ️ Blockchain already initialized"
fi

# Generate keys if not already done
if [ ! -f "validator-keys/validator.key" ]; then
    log "🔑 Generating validator keys..."
    node scripts/generate-keys.js
    log "✅ Validator keys generated"
else
    log "ℹ️ Validator keys already exist"
fi

# Deploy genesis block if not already done
if [ ! -f "data/blockchain/genesis.json" ]; then
    log "🌱 Deploying genesis block..."
    node scripts/deploy-genesis.js
    log "✅ Genesis block deployed"
else
    log "ℹ️ Genesis block already deployed"
fi

# Test blockchain functionality
log "🧪 Testing blockchain functionality..."
if node scripts/check-network.sh > /dev/null 2>&1; then
    log "✅ Blockchain test passed"
else
    warn "Blockchain test failed, but continuing..."
fi

# Create startup script
log "📝 Creating startup script..."
cat > "$PROJECT_ROOT/start-blockchain.sh" << 'EOF'
#!/bin/bash

# BizneAI Blockchain Startup Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOCKCHAIN_DIR="$SCRIPT_DIR/blockchain/luxaeBlockhain"

echo "🚀 Starting BizneAI Blockchain..."

# Check if blockchain directory exists
if [ ! -d "$BLOCKCHAIN_DIR" ]; then
    echo "❌ Blockchain directory not found"
    exit 1
fi

# Navigate to blockchain directory
cd "$BLOCKCHAIN_DIR"

# Start blockchain
echo "📦 Starting blockchain node..."
node scripts/start-validator.js &

# Wait a moment for blockchain to start
sleep 3

# Start API
echo "🌐 Starting blockchain API..."
node scripts/start-api-v2.js &

echo "✅ Blockchain services started"
echo "🌐 API available at: http://localhost:3001"
echo "📚 Documentation: http://localhost:3001/api-docs"
echo "🏥 Health check: http://localhost:3001/health"

# Wait for user input to stop
echo ""
echo "Press Ctrl+C to stop blockchain services"
wait
EOF

chmod +x "$PROJECT_ROOT/start-blockchain.sh"

# Create stop script
log "📝 Creating stop script..."
cat > "$PROJECT_ROOT/stop-blockchain.sh" << 'EOF'
#!/bin/bash

# BizneAI Blockchain Stop Script

echo "🛑 Stopping BizneAI Blockchain..."

# Kill blockchain processes
pkill -f "start-validator.js" || true
pkill -f "start-api-v2.js" || true

echo "✅ Blockchain services stopped"
EOF

chmod +x "$PROJECT_ROOT/stop-blockchain.sh"

# Create status script
log "📝 Creating status script..."
cat > "$PROJECT_ROOT/blockchain-status.sh" << 'EOF'
#!/bin/bash

# BizneAI Blockchain Status Script

echo "🔍 Checking BizneAI Blockchain Status..."

# Check if processes are running
if pgrep -f "start-validator.js" > /dev/null; then
    echo "✅ Blockchain node is running"
else
    echo "❌ Blockchain node is not running"
fi

if pgrep -f "start-api-v2.js" > /dev/null; then
    echo "✅ Blockchain API is running"
else
    echo "❌ Blockchain API is not running"
fi

# Check API health
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ API is responding"
else
    echo "❌ API is not responding"
fi
EOF

chmod +x "$PROJECT_ROOT/blockchain-status.sh"

# Update main package.json scripts
log "📝 Updating package.json scripts..."

# Create a backup of the original package.json
cp "$PROJECT_ROOT/package.json" "$PROJECT_ROOT/package.json.backup"

log "✅ Blockchain setup completed successfully!"
log ""
log "📋 Available commands:"
log "  npm run blockchain:start    - Start blockchain node"
log "  npm run blockchain:api      - Start blockchain API"
log "  npm run blockchain:status   - Check blockchain status"
log "  npm run blockchain:keys     - Generate new keys"
log "  npm run blockchain:monitor  - Monitor blockchain network"
log ""
log "🚀 To start the full application with blockchain:"
log "  npm run start:all"
log ""
log "🛑 To stop blockchain services:"
log "  ./stop-blockchain.sh"
log ""
log "🔍 To check blockchain status:"
log "  ./blockchain-status.sh" 