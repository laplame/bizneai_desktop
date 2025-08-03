import SHA256 from 'crypto-js/sha256.js'

class Block {
    constructor(timestamp, transactions, previousHash = '') {
        this.block = 0;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash() {
        return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
    }
}

export default Block;