class Participants {
    constructor() {
        this.nodes = new Map();
        this.accounts = new Map();
    }

    addNode(address, data = {}) {
        this.nodes.set(address, {
            address,
            lastSeen: Date.now(),
            status: 'active',
            stake: data.stake || 0,
            blocksValidated: data.blocksValidated || 0,
            ...data
        });
    }

    removeNode(address) {
        this.nodes.delete(address);
    }

    updateNodeStatus(address, status) {
        if (this.nodes.has(address)) {
            const node = this.nodes.get(address);
            node.status = status;
            node.lastSeen = Date.now();
            this.nodes.set(address, node);
        }
    }

    getActiveNodes() {
        const activeNodes = [];
        for (const [address, node] of this.nodes) {
            if (node.status === 'active' && 
                Date.now() - node.lastSeen < 300000) { // 5 minutos
                activeNodes.push(node);
            }
        }
        return activeNodes;
    }

    addAccount(address, balance = 0) {
        this.accounts.set(address, {
            address,
            balance,
            transactions: [],
            lastActivity: Date.now()
        });
    }

    getNodeInfo(address) {
        return this.nodes.get(address);
    }

    getAllNodes() {
        return Array.from(this.nodes.values());
    }

    getAllAccounts() {
        return Array.from(this.accounts.values());
    }
}

export default Participants;