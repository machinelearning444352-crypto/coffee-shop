/* Shared database & payment engine for Vercel serverless functions */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join('/tmp', 'eb-db.json');

class Database {
    constructor() { this.data = this.load(); }

    load() {
        try {
            if (fs.existsSync(DB_PATH)) return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        } catch (e) { }
        const defaults = { accounts: [], transactions: [], orders: [], emailLog: [] };
        this.save(defaults);
        return defaults;
    }

    save(data) {
        if (data) this.data = data;
        fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf8');
    }

    findAccount(cardNumber) {
        return this.data.accounts.find(a => a.cardNumber === cardNumber.replace(/\s/g, ''));
    }

    createAccount(account) {
        this.data.accounts.push(account);
        this.save();
        return account;
    }

    updateAccountBalance(cardNumber, newBalance) {
        const account = this.findAccount(cardNumber);
        if (account) { account.balance = newBalance; account.updatedAt = new Date().toISOString(); this.save(); }
        return account;
    }

    addTransaction(txn) { this.data.transactions.push(txn); this.save(); return txn; }
    addOrder(order) { this.data.orders.push(order); this.save(); return order; }
    logEmail(log) { this.data.emailLog.push(log); this.save(); return log; }
}

class PaymentEngine {
    constructor(db) { this.db = db; }

    luhnCheck(number) {
        const digits = number.replace(/\D/g, '');
        let sum = 0, alt = false;
        for (let i = digits.length - 1; i >= 0; i--) {
            let n = parseInt(digits[i], 10);
            if (alt) { n *= 2; if (n > 9) n -= 9; }
            sum += n; alt = !alt;
        }
        return sum % 10 === 0;
    }

    detectNetwork(number) {
        const n = number.replace(/\D/g, '');
        if (/^4/.test(n)) return 'Visa';
        if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard';
        if (/^3[47]/.test(n)) return 'Amex';
        if (/^(6011|65|64[4-9])/.test(n)) return 'Discover';
        if (/^35(28|29|[3-8])/.test(n)) return 'JCB';
        if (/^(30[0-5]|36|38)/.test(n)) return 'Diners Club';
        if (/^62/.test(n)) return 'UnionPay';
        return 'Unknown';
    }

    validateExpiry(expiry) {
        const parts = expiry.split('/');
        if (parts.length !== 2) return { valid: false, error: 'Invalid format' };
        const month = parseInt(parts[0]), year = parseInt('20' + parts[1]);
        if (month < 1 || month > 12) return { valid: false, error: 'Invalid month' };
        if (new Date(year, month) <= new Date()) return { valid: false, error: 'Card expired' };
        return { valid: true };
    }

    registerCard(cardNumber, holderName, expiry, cvv, initialBalance = 100) {
        const normalized = cardNumber.replace(/\s/g, '');
        if (!this.luhnCheck(normalized)) return { success: false, error: 'Invalid card number (Luhn check failed)' };
        const existing = this.db.findAccount(normalized);
        if (existing) return { success: false, error: 'Card already registered', account: { cardLast4: normalized.slice(-4), balance: existing.balance, network: existing.network } };

        const account = {
            id: crypto.randomUUID(), cardNumber: normalized, cardLast4: normalized.slice(-4),
            holderName: holderName.toUpperCase(), expiry, cvvHash: crypto.createHash('sha256').update(cvv).digest('hex'),
            network: this.detectNetwork(normalized), balance: initialBalance, currency: 'USD',
            status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        };
        this.db.createAccount(account);
        return { success: true, account: { id: account.id, cardLast4: account.cardLast4, network: account.network, balance: account.balance } };
    }

    processPayment(cardNumber, cvv, amount, orderDetails) {
        const normalized = cardNumber.replace(/\s/g, '');
        if (!this.luhnCheck(normalized)) return { success: false, stage: 'validation', error: 'Invalid card number', code: 'INVALID_CARD' };
        const account = this.db.findAccount(normalized);
        if (!account) return { success: false, stage: 'lookup', error: 'Card not registered. Please register your card first.', code: 'CARD_NOT_FOUND' };
        if (account.status !== 'active') return { success: false, stage: 'verification', error: 'Card is ' + account.status, code: 'CARD_INACTIVE' };
        const cvvHash = crypto.createHash('sha256').update(cvv).digest('hex');
        if (cvvHash !== account.cvvHash) return { success: false, stage: 'authentication', error: 'Incorrect CVV', code: 'CVV_MISMATCH' };
        const expiryCheck = this.validateExpiry(account.expiry);
        if (!expiryCheck.valid) return { success: false, stage: 'expiry', error: expiryCheck.error, code: 'CARD_EXPIRED' };
        if (account.balance < amount) return { success: false, stage: 'funds', error: `Insufficient funds. Balance: $${account.balance.toFixed(2)}, Order: $${amount.toFixed(2)}`, code: 'INSUFFICIENT_FUNDS' };

        const newBalance = parseFloat((account.balance - amount).toFixed(2));
        this.db.updateAccountBalance(normalized, newBalance);

        const txn = {
            id: 'TXN-' + crypto.randomUUID().split('-')[0].toUpperCase(),
            accountId: account.id, cardLast4: account.cardLast4, network: account.network,
            amount, currency: 'USD', type: 'purchase', status: 'completed',
            previousBalance: account.balance, newBalance, timestamp: new Date().toISOString(), orderDetails
        };
        this.db.addTransaction(txn);
        return { success: true, transaction: { id: txn.id, amount, cardLast4: account.cardLast4, network: account.network, newBalance, timestamp: txn.timestamp } };
    }

    getBalance(cardNumber) {
        const account = this.db.findAccount(cardNumber.replace(/\s/g, ''));
        if (!account) return { success: false, error: 'Card not found' };
        return { success: true, cardLast4: account.cardLast4, network: account.network, balance: account.balance, status: account.status };
    }

    addFunds(cardNumber, amount) {
        const normalized = cardNumber.replace(/\s/g, '');
        const account = this.db.findAccount(normalized);
        if (!account) return { success: false, error: 'Card not found' };
        const newBalance = parseFloat((account.balance + amount).toFixed(2));
        this.db.updateAccountBalance(normalized, newBalance);
        const txn = { id: 'TXN-' + crypto.randomUUID().split('-')[0].toUpperCase(), accountId: account.id, cardLast4: account.cardLast4, amount, type: 'deposit', status: 'completed', previousBalance: account.balance, newBalance, timestamp: new Date().toISOString() };
        this.db.addTransaction(txn);
        return { success: true, newBalance, transactionId: txn.id };
    }
}

function getEngine() {
    const db = new Database();
    return { db, engine: new PaymentEngine(db) };
}

module.exports = { getEngine };
