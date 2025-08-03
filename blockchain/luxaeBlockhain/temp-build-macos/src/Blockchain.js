import Block from './Block.js';
import Transaction from './Transaction.js';
import ProofOfWork from '../consensus/proof-of-work.js';
import ProofOfStake from '../consensus/proof-of-stake.js';
import ProofOfAuthority from '../consensus/proof-of-authority.js';
import Participants from './Participants.js';

class Blockchain {
    constructor(consensus) {
        this.consensus = consensus;
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
        this.participants = new Participants();
        this.miningReward = 100;
    }

    createGenesisBlock() {
        return new Block("01/01/2010","GenesisBlock","0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    generateBlock(minerAddress, difficulty = 2) { 
        let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        
        if (['pow','pos'].includes(this.consensus)){
            
            if (this.consensus == 'pow') {
                let algorithm = new ProofOfWork(block);
                block = algorithm.generateBlock(difficulty);
            } else if (this.consensus == 'pos') {
                let algorithm = new ProofOfStake(block);
                block.validator = minerAddress;
                block = algorithm.generateBlock();
            }

            block.block = this.chain.length;
            this.chain.push(block);
            this.pendingTransactions = [
                new Transaction(null, minerAddress, this.miningReward)
            ]
        } else if (this.consensus == 'poa'){ 
            let algorithm = new ProofOfAuthority(block);
            block.validator = minerAddress;
            block = algorithm.generateBlock();
            block.block = this.chain.length;
            this.chain.push(block);
            this.pendingTransactions = [];
        }
    }

    createTransaction(transaction) {
        this.pendingTransactions.push(transaction);
    }

    registerParticipant({ address, balance, type = 'node', data = {} }) {
        if (type === 'node') {
            this.participants.addNode(address, {
                balance: balance || 0,
                stake: balance || 0,
                ...data
            });
            console.log('Registered node:', address);
        } else {
            this.participants.addAccount(address, balance);
            console.log('Registered account:', address);
        }
    }

    getActiveValidators() {
        return this.participants.getActiveNodes().filter(node => 
            node.stake >= this.getMinimumStake()
        );
    }

    getMinimumStake() {
        return 1000; // 1000 LXA mínimo para ser validador
    }

    updateParticipantStatus(address, status) {
        this.participants.updateNodeStatus(address, status);
    }

    getParticipantInfo(address) {
        return {
            node: this.participants.getNodeInfo(address),
            balance: this.getBalanceOfAddress(address)
        };
    }

    getBalanceOfAddress(address) {
        let balance = 0;

        for(const block of this.chain) {
            for(const trans of block.transactions) {
                if(trans.fromAddress === address) {
                    balance -= trans.amount;
                }
                if(trans.toAddress === address) {
                    balance += trans.amount;
                }
            }
        }

        return balance;
    }

    validationCheck() {
        let consensusAlgorithm = null;
        let validChain = true;
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            const copiedBlock = Object.assign({}, currentBlock);
            
            switch (this.consensus) {
                default: case 'pow':
                    consensusAlgorithm = new ProofOfWork(copiedBlock);
                    break;
                case 'pos':
                    consensusAlgorithm = new ProofOfStake(copiedBlock);
                    break;
                case 'poa':
                    consensusAlgorithm = new ProofOfAuthority(copiedBlock);
                    break;
            } 

            if(currentBlock.hash !== consensusAlgorithm.calculateHash()) {
                console.log("Block "+ currentBlock.block + " is invalid!");
                validChain = false;
            }
            if (currentBlock.previousHash !== previousBlock.hash) {
                console.log("Block "+ currentBlock.block + " is invalid!");
                validChain = false;
            }
        }
        if(validChain){
            console.log("Blockchain is valid.");
        }
    }

}

export default Blockchain;