// Merkle Tree utilities for sales history

export interface Transaction {
  id: string;
  saleId: number;
  action: 'create' | 'update' | 'delete' | 'restore';
  timestamp: string;
  data: any;
  previousData?: any;
  hash: string;
}

export interface MerkleProof {
  transactionHash: string;
  merkleRoot: string;
  proof: string[];
  leafIndex: number;
}

export interface DailyBlock {
  id: string;
  date: string;
  transactions: Transaction[];
  merkleRoot: string;
  previousBlockHash: string | null;
  blockHash: string;
  createdAt: string;
}

// Simple hash function (SHA-256 simulation)
const hash = async (data: string): Promise<string> => {
  // In a real implementation, use crypto.subtle.digest
  // For now, we'll use a simple hash simulation
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Generate transaction hash
export const generateTransactionHash = async (transaction: Omit<Transaction, 'hash'>): Promise<string> => {
  const dataString = JSON.stringify({
    id: transaction.id,
    saleId: transaction.saleId,
    action: transaction.action,
    timestamp: transaction.timestamp,
    data: transaction.data,
    previousData: transaction.previousData
  });
  return await hash(dataString);
};

// Build Merkle Tree from transactions
export const buildMerkleTree = async (transactions: Transaction[]): Promise<{
  root: string;
  tree: string[][];
}> => {
  if (transactions.length === 0) {
    return { root: '', tree: [] };
  }

  // Get all transaction hashes
  let level = transactions.map(tx => tx.hash);
  const tree: string[][] = [level];

  // Build tree bottom-up
  while (level.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 < level.length) {
        // Hash pair of nodes
        const combined = level[i] + level[i + 1];
        const parentHash = await hash(combined);
        nextLevel.push(parentHash);
      } else {
        // Odd number of nodes, duplicate the last one
        const combined = level[i] + level[i];
        const parentHash = await hash(combined);
        nextLevel.push(parentHash);
      }
    }
    tree.push(nextLevel);
    level = nextLevel;
  }

  return {
    root: level[0],
    tree
  };
};

// Generate Merkle proof for a transaction
export const generateMerkleProof = (
  transactionHash: string,
  transactions: Transaction[],
  tree: string[][]
): MerkleProof => {
  const leafIndex = transactions.findIndex(tx => tx.hash === transactionHash);
  if (leafIndex === -1) {
    throw new Error('Transaction not found in tree');
  }

  const proof: string[] = [];
  let currentIndex = leafIndex;
  let currentLevel = 0;

  // Traverse up the tree
  while (currentLevel < tree.length - 1) {
    const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
    
    if (siblingIndex < tree[currentLevel].length) {
      proof.push(tree[currentLevel][siblingIndex]);
    } else {
      // If no sibling, duplicate the node
      proof.push(tree[currentLevel][currentIndex]);
    }

    currentIndex = Math.floor(currentIndex / 2);
    currentLevel++;
  }

  return {
    transactionHash,
    merkleRoot: tree[tree.length - 1][0],
    proof,
    leafIndex
  };
};

// Verify Merkle proof
export const verifyMerkleProof = async (proof: MerkleProof): Promise<boolean> => {
  let currentHash = proof.transactionHash;

  for (const siblingHash of proof.proof) {
    const combined = proof.leafIndex % 2 === 0 
      ? currentHash + siblingHash 
      : siblingHash + currentHash;
    currentHash = await hash(combined);
  }

  return currentHash === proof.merkleRoot;
};

// Generate block hash
export const generateBlockHash = async (block: Omit<DailyBlock, 'blockHash'>): Promise<string> => {
  const dataString = JSON.stringify({
    id: block.id,
    date: block.date,
    merkleRoot: block.merkleRoot,
    previousBlockHash: block.previousBlockHash,
    createdAt: block.createdAt,
    transactionCount: block.transactions.length
  });
  return await hash(dataString);
};

// Create daily block from transactions
export const createDailyBlock = async (
  date: string,
  transactions: Transaction[],
  previousBlockHash: string | null = null
): Promise<DailyBlock> => {
  if (transactions.length === 0) {
    throw new Error('Cannot create block with no transactions');
  }

  // Build Merkle tree
  const { root: merkleRoot } = await buildMerkleTree(transactions);

  // Create block
  const block: Omit<DailyBlock, 'blockHash'> = {
    id: `block_${date.replace(/-/g, '')}_${Date.now()}`,
    date,
    transactions,
    merkleRoot,
    previousBlockHash,
    createdAt: new Date().toISOString()
  };

  // Generate block hash
  const blockHash = await generateBlockHash(block);

  return {
    ...block,
    blockHash
  };
};

// Verify block integrity
export const verifyBlockIntegrity = async (block: DailyBlock): Promise<{
  valid: boolean;
  errors: string[];
}> => {
  const errors: string[] = [];

  // Verify Merkle root
  const { root } = await buildMerkleTree(block.transactions);
  if (root !== block.merkleRoot) {
    errors.push('Merkle root mismatch');
  }

  // Verify block hash
  const expectedHash = await generateBlockHash(block);
  if (expectedHash !== block.blockHash) {
    errors.push('Block hash mismatch');
  }

  // Verify all transaction hashes
  for (const transaction of block.transactions) {
    const expectedTxHash = await generateTransactionHash(transaction);
    if (expectedTxHash !== transaction.hash) {
      errors.push(`Transaction ${transaction.id} hash mismatch`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Verify chain integrity
export const verifyChainIntegrity = async (blocks: DailyBlock[]): Promise<{
  valid: boolean;
  errors: string[];
}> => {
  const errors: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Verify block integrity
    const blockVerification = await verifyBlockIntegrity(block);
    if (!blockVerification.valid) {
      errors.push(`Block ${block.id}: ${blockVerification.errors.join(', ')}`);
    }

    // Verify chain linkage
    if (i > 0) {
      const previousBlock = blocks[i - 1];
      if (block.previousBlockHash !== previousBlock.blockHash) {
        errors.push(`Block ${block.id}: Previous block hash mismatch`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};







