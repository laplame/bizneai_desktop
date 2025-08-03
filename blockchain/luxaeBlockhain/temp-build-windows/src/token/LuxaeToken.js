import { EventEmitter } from 'events';

class LuxaeToken extends EventEmitter {
    constructor() {
        super();
        this._name = 'Luxae';
        this._symbol = 'LXA';
        this._decimals = 18;
        this._totalSupply = BigInt(1000000000) * BigInt(10 ** this._decimals); // 1 billion tokens
        this._balances = new Map();
        this._allowances = new Map();
    }

    // ERC-20 Standard Methods
    name() {
        return this._name;
    }

    symbol() {
        return this._symbol;
    }

    decimals() {
        return this._decimals;
    }

    totalSupply() {
        return this._totalSupply;
    }

    balanceOf(account) {
        return this._balances.get(account) || BigInt(0);
    }

    transfer(from, to, amount) {
        this._transfer(from, to, BigInt(amount));
        return true;
    }

    allowance(owner, spender) {
        return this._allowances.get(`${owner}-${spender}`) || BigInt(0);
    }

    approve(owner, spender, amount) {
        this._approve(owner, spender, BigInt(amount));
        return true;
    }

    transferFrom(spender, from, to, amount) {
        const currentAllowance = this.allowance(from, spender);
        if (currentAllowance < amount) {
            throw new Error('Transfer amount exceeds allowance');
        }
        
        this._transfer(from, to, BigInt(amount));
        this._approve(from, spender, currentAllowance - BigInt(amount));
        return true;
    }

    // Internal methods
    _transfer(from, to, amount) {
        if (!from || !to) {
            throw new Error('Invalid address');
        }

        const fromBalance = this.balanceOf(from);
        if (fromBalance < amount) {
            throw new Error('Insufficient balance');
        }

        this._balances.set(from, fromBalance - amount);
        this._balances.set(to, this.balanceOf(to) + amount);

        this.emit('Transfer', from, to, amount);
    }

    _approve(owner, spender, amount) {
        if (!owner || !spender) {
            throw new Error('Invalid address');
        }

        this._allowances.set(`${owner}-${spender}`, amount);
        this.emit('Approval', owner, spender, amount);
    }

    // Additional methods for the blockchain
    mint(account, amount) {
        if (!account) {
            throw new Error('Invalid address');
        }

        this._totalSupply += BigInt(amount);
        this._balances.set(account, this.balanceOf(account) + BigInt(amount));
        this.emit('Transfer', null, account, amount);
    }

    burn(account, amount) {
        if (!account) {
            throw new Error('Invalid address');
        }

        const accountBalance = this.balanceOf(account);
        if (accountBalance < amount) {
            throw new Error('Burn amount exceeds balance');
        }

        this._balances.set(account, accountBalance - BigInt(amount));
        this._totalSupply -= BigInt(amount);
        this.emit('Transfer', account, null, amount);
    }
}

export default LuxaeToken; 