/* =============================================
   EMBER & BREW — BACKEND SERVER
   Built 100% From Scratch — No Libraries
   
   Features:
   - HTTP server (Node.js built-in http module)
   - Custom payment engine with real balance tracking
   - Raw SMTP email client (Node.js built-in net/tls)
   - JSON file database
   - CORS handling
   - Request routing
   ============================================= */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const tls = require('tls');
const net = require('net');
const crypto = require('crypto');

const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// ==========================================
// JSON FILE DATABASE — From Scratch
// ==========================================
class Database {
    constructor(filePath) {
        this.filePath = filePath;
        this.data = this.load();
    }

    load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const raw = fs.readFileSync(this.filePath, 'utf8');
                return JSON.parse(raw);
            }
        } catch (e) {
            console.log('[DB] Creating fresh database');
        }
        // Default structure
        const defaults = {
            accounts: [],
            transactions: [],
            orders: [],
            emailLog: []
        };
        this.save(defaults);
        return defaults;
    }

    save(data) {
        if (data) this.data = data;
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    }

    // Account operations
    findAccount(cardNumber) {
        const normalized = cardNumber.replace(/\s/g, '');
        return this.data.accounts.find(a => a.cardNumber === normalized);
    }

    createAccount(account) {
        this.data.accounts.push(account);
        this.save();
        return account;
    }

    updateAccountBalance(cardNumber, newBalance) {
        const account = this.findAccount(cardNumber);
        if (account) {
            account.balance = newBalance;
            account.updatedAt = new Date().toISOString();
            this.save();
        }
        return account;
    }

    // Transaction operations
    addTransaction(transaction) {
        this.data.transactions.push(transaction);
        this.save();
        return transaction;
    }

    // Order operations
    addOrder(order) {
        this.data.orders.push(order);
        this.save();
        return order;
    }

    // Email log
    logEmail(log) {
        this.data.emailLog.push(log);
        this.save();
        return log;
    }
}

// ==========================================
// PAYMENT ENGINE — From Scratch
// ==========================================
class PaymentEngine {
    constructor(db) {
        this.db = db;
    }

    // Luhn algorithm for card validation
    luhnCheck(number) {
        const digits = number.replace(/\D/g, '');
        let sum = 0, alternate = false;
        for (let i = digits.length - 1; i >= 0; i--) {
            let n = parseInt(digits[i], 10);
            if (alternate) { n *= 2; if (n > 9) n -= 9; }
            sum += n;
            alternate = !alternate;
        }
        return sum % 10 === 0;
    }

    // Detect card network
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

    // Validate expiry
    validateExpiry(expiry) {
        const parts = expiry.split('/');
        if (parts.length !== 2) return { valid: false, error: 'Invalid format' };
        const month = parseInt(parts[0]), year = parseInt('20' + parts[1]);
        if (month < 1 || month > 12) return { valid: false, error: 'Invalid month' };
        const exp = new Date(year, month);
        if (exp <= new Date()) return { valid: false, error: 'Card expired' };
        return { valid: true };
    }

    // Register a new card with a balance
    registerCard(cardNumber, holderName, expiry, cvv, initialBalance = 100) {
        const normalized = cardNumber.replace(/\s/g, '');

        // Validate card number
        if (!this.luhnCheck(normalized)) {
            return { success: false, error: 'Invalid card number (Luhn check failed)' };
        }

        // Check if already registered
        const existing = this.db.findAccount(normalized);
        if (existing) {
            return {
                success: false, error: 'Card already registered', account: {
                    cardLast4: normalized.slice(-4),
                    balance: existing.balance,
                    network: existing.network
                }
            };
        }

        const account = {
            id: crypto.randomUUID(),
            cardNumber: normalized,
            cardLast4: normalized.slice(-4),
            holderName: holderName.toUpperCase(),
            expiry,
            cvvHash: crypto.createHash('sha256').update(cvv).digest('hex'),
            network: this.detectNetwork(normalized),
            balance: initialBalance,
            currency: 'USD',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.db.createAccount(account);
        return {
            success: true,
            account: {
                id: account.id,
                cardLast4: account.cardLast4,
                network: account.network,
                balance: account.balance
            }
        };
    }

    // Process a payment
    processPayment(cardNumber, cvv, amount, orderDetails) {
        const normalized = cardNumber.replace(/\s/g, '');

        // Step 1: Validate card number format
        if (!this.luhnCheck(normalized)) {
            return {
                success: false,
                stage: 'validation',
                error: 'Invalid card number',
                code: 'INVALID_CARD'
            };
        }

        // Step 2: Look up account
        const account = this.db.findAccount(normalized);
        if (!account) {
            return {
                success: false,
                stage: 'lookup',
                error: 'Card not registered. Please register your card first.',
                code: 'CARD_NOT_FOUND'
            };
        }

        // Step 3: Verify card is active
        if (account.status !== 'active') {
            return {
                success: false,
                stage: 'verification',
                error: 'Card is ' + account.status,
                code: 'CARD_INACTIVE'
            };
        }

        // Step 4: Verify CVV
        const cvvHash = crypto.createHash('sha256').update(cvv).digest('hex');
        if (cvvHash !== account.cvvHash) {
            return {
                success: false,
                stage: 'authentication',
                error: 'Incorrect CVV',
                code: 'CVV_MISMATCH'
            };
        }

        // Step 5: Verify expiry
        const expiryCheck = this.validateExpiry(account.expiry);
        if (!expiryCheck.valid) {
            return {
                success: false,
                stage: 'expiry',
                error: expiryCheck.error,
                code: 'CARD_EXPIRED'
            };
        }

        // Step 6: Check sufficient funds
        if (account.balance < amount) {
            return {
                success: false,
                stage: 'funds',
                error: `Insufficient funds. Card balance: $${account.balance.toFixed(2)}, Order total: $${amount.toFixed(2)}`,
                code: 'INSUFFICIENT_FUNDS'
            };
        }

        // Step 7: Deduct funds
        const newBalance = parseFloat((account.balance - amount).toFixed(2));
        this.db.updateAccountBalance(normalized, newBalance);

        // Step 8: Create transaction record
        const transaction = {
            id: 'TXN-' + crypto.randomUUID().split('-')[0].toUpperCase(),
            accountId: account.id,
            cardLast4: account.cardLast4,
            network: account.network,
            amount: amount,
            currency: 'USD',
            type: 'purchase',
            status: 'completed',
            previousBalance: account.balance,
            newBalance: newBalance,
            timestamp: new Date().toISOString(),
            orderDetails: orderDetails
        };

        this.db.addTransaction(transaction);

        return {
            success: true,
            transaction: {
                id: transaction.id,
                amount: amount,
                cardLast4: account.cardLast4,
                network: account.network,
                newBalance: newBalance,
                timestamp: transaction.timestamp
            }
        };
    }

    // Get account balance (masked info)
    getBalance(cardNumber) {
        const account = this.db.findAccount(cardNumber.replace(/\s/g, ''));
        if (!account) return { success: false, error: 'Card not found' };
        return {
            success: true,
            cardLast4: account.cardLast4,
            network: account.network,
            balance: account.balance,
            status: account.status
        };
    }

    // Add funds to card
    addFunds(cardNumber, amount) {
        const normalized = cardNumber.replace(/\s/g, '');
        const account = this.db.findAccount(normalized);
        if (!account) return { success: false, error: 'Card not found' };

        const newBalance = parseFloat((account.balance + amount).toFixed(2));
        this.db.updateAccountBalance(normalized, newBalance);

        const transaction = {
            id: 'TXN-' + crypto.randomUUID().split('-')[0].toUpperCase(),
            accountId: account.id,
            cardLast4: account.cardLast4,
            amount: amount,
            type: 'deposit',
            status: 'completed',
            previousBalance: account.balance,
            newBalance: newBalance,
            timestamp: new Date().toISOString()
        };
        this.db.addTransaction(transaction);

        return { success: true, newBalance, transactionId: transaction.id };
    }
}

// ==========================================
// RAW SMTP EMAIL CLIENT — From Scratch
// Uses Node.js net/tls modules directly.
// No nodemailer, no libraries.
// ==========================================
class SmtpClient {
    constructor(config) {
        this.host = config.host || '';
        this.port = config.port || 587;
        this.secure = config.secure || false;
        this.user = config.user || '';
        this.pass = config.pass || '';
        this.configured = !!(this.host && this.user && this.pass);
    }

    // Send raw SMTP commands and read responses
    sendCommand(socket, command) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('SMTP timeout')), 10000);
            socket.once('data', (data) => {
                clearTimeout(timeout);
                resolve(data.toString());
            });
            if (command) socket.write(command + '\r\n');
        });
    }

    // Wait for server greeting
    waitForGreeting(socket) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
            socket.once('data', (data) => {
                clearTimeout(timeout);
                resolve(data.toString());
            });
        });
    }

    // Upgrade connection to TLS
    upgradeToTls(socket) {
        return new Promise((resolve, reject) => {
            const tlsSocket = tls.connect({
                socket: socket,
                host: this.host,
                rejectUnauthorized: false
            }, () => {
                resolve(tlsSocket);
            });
            tlsSocket.on('error', reject);
        });
    }

    // Build email body with MIME
    buildEmail(from, to, subject, htmlBody, textBody) {
        const boundary = '----=_Part_' + crypto.randomBytes(12).toString('hex');
        const date = new Date().toUTCString();
        const messageId = `<${crypto.randomBytes(16).toString('hex')}@emberandbrew.local>`;

        let email = '';
        email += `From: "Ember & Brew" <${from}>\r\n`;
        email += `To: ${to}\r\n`;
        email += `Subject: ${subject}\r\n`;
        email += `Date: ${date}\r\n`;
        email += `Message-ID: ${messageId}\r\n`;
        email += `MIME-Version: 1.0\r\n`;
        email += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n`;
        email += `\r\n`;

        // Plain text part
        email += `--${boundary}\r\n`;
        email += `Content-Type: text/plain; charset=UTF-8\r\n`;
        email += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
        email += textBody + '\r\n\r\n';

        // HTML part
        email += `--${boundary}\r\n`;
        email += `Content-Type: text/html; charset=UTF-8\r\n`;
        email += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
        email += htmlBody + '\r\n\r\n';

        email += `--${boundary}--\r\n`;
        return email;
    }

    // Send email via raw SMTP
    async sendEmail(to, subject, htmlBody, textBody) {
        if (!this.configured) {
            return {
                success: false,
                error: 'SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in email.config.json'
            };
        }

        return new Promise(async (resolve) => {
            try {
                // Step 1: Connect to SMTP server
                let socket = net.createConnection(this.port, this.host);

                socket.on('error', (err) => {
                    resolve({ success: false, error: 'Connection failed: ' + err.message });
                });

                // Step 2: Wait for greeting
                const greeting = await this.waitForGreeting(socket);
                if (!greeting.startsWith('220')) {
                    socket.destroy();
                    return resolve({ success: false, error: 'Bad greeting: ' + greeting.trim() });
                }

                // Step 3: EHLO
                let response = await this.sendCommand(socket, `EHLO emberandbrew.local`);
                if (!response.startsWith('250')) {
                    socket.destroy();
                    return resolve({ success: false, error: 'EHLO failed' });
                }

                // Step 4: STARTTLS if port 587
                if (this.port === 587) {
                    response = await this.sendCommand(socket, 'STARTTLS');
                    if (response.startsWith('220')) {
                        socket = await this.upgradeToTls(socket);
                        // Re-EHLO after TLS
                        response = await this.sendCommand(socket, `EHLO emberandbrew.local`);
                    }
                }

                // Step 5: AUTH LOGIN
                response = await this.sendCommand(socket, 'AUTH LOGIN');
                if (response.startsWith('334')) {
                    response = await this.sendCommand(socket, Buffer.from(this.user).toString('base64'));
                    if (response.startsWith('334')) {
                        response = await this.sendCommand(socket, Buffer.from(this.pass).toString('base64'));
                        if (!response.startsWith('235')) {
                            socket.destroy();
                            return resolve({ success: false, error: 'Authentication failed' });
                        }
                    }
                }

                // Step 6: MAIL FROM
                response = await this.sendCommand(socket, `MAIL FROM:<${this.user}>`);
                if (!response.startsWith('250')) {
                    socket.destroy();
                    return resolve({ success: false, error: 'MAIL FROM rejected' });
                }

                // Step 7: RCPT TO
                response = await this.sendCommand(socket, `RCPT TO:<${to}>`);
                if (!response.startsWith('250')) {
                    socket.destroy();
                    return resolve({ success: false, error: 'RCPT TO rejected' });
                }

                // Step 8: DATA
                response = await this.sendCommand(socket, 'DATA');
                if (!response.startsWith('354')) {
                    socket.destroy();
                    return resolve({ success: false, error: 'DATA rejected' });
                }

                // Step 9: Send email body
                const emailBody = this.buildEmail(this.user, to, subject, htmlBody, textBody);
                response = await this.sendCommand(socket, emailBody + '\r\n.');

                if (response.startsWith('250')) {
                    // Step 10: QUIT
                    await this.sendCommand(socket, 'QUIT');
                    socket.destroy();
                    resolve({ success: true, message: 'Email sent successfully' });
                } else {
                    socket.destroy();
                    resolve({ success: false, error: 'Message rejected: ' + response.trim() });
                }
            } catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }

    // Build receipt HTML email
    buildReceiptHtml(order) {
        const itemRows = order.items.map(item => `
            <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.name} (${item.size})</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">x${item.quantity}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        return `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family:Arial,sans-serif;background:#f5f0eb;padding:20px;">
            <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
                <div style="background:linear-gradient(135deg,#3c2415,#6b4226);padding:32px;text-align:center;color:#fff;">
                    <h1 style="margin:0;font-size:24px;">☕ Ember & Brew</h1>
                    <p style="margin:8px 0 0;opacity:0.8;font-size:14px;">Order Confirmation</p>
                </div>
                <div style="padding:28px;">
                    <p style="color:#333;font-size:16px;">Hi ${order.customer.name},</p>
                    <p style="color:#666;font-size:14px;">Thank you for your order! Here's your receipt:</p>
                    <div style="background:#f9f6f2;border-radius:8px;padding:4px 0;margin:20px 0;">
                        <table style="width:100%;border-collapse:collapse;font-size:14px;">
                            <thead>
                                <tr style="color:#8b6f47;">
                                    <th style="padding:12px;text-align:left;">Item</th>
                                    <th style="padding:12px;text-align:center;">Qty</th>
                                    <th style="padding:12px;text-align:right;">Price</th>
                                </tr>
                            </thead>
                            <tbody>${itemRows}</tbody>
                        </table>
                    </div>
                    <div style="border-top:2px solid #eee;padding-top:16px;font-size:14px;">
                        <div style="display:flex;justify-content:space-between;margin:4px 0;"><span style="color:#666;">Subtotal</span><span>$${order.subtotal.toFixed(2)}</span></div>
                        <div style="display:flex;justify-content:space-between;margin:4px 0;"><span style="color:#666;">Tax (8.5%)</span><span>$${order.tax.toFixed(2)}</span></div>
                        ${order.discount > 0 ? `<div style="display:flex;justify-content:space-between;margin:4px 0;"><span style="color:#22c55e;">Rewards Discount</span><span style="color:#22c55e;">-$${order.discount.toFixed(2)}</span></div>` : ''}
                        <div style="display:flex;justify-content:space-between;margin:12px 0 0;font-size:18px;font-weight:700;"><span>Total</span><span style="color:#c8915a;">$${order.total.toFixed(2)}</span></div>
                    </div>
                    <div style="margin-top:20px;padding:16px;background:#f0ebe4;border-radius:8px;font-size:13px;color:#6b5d4f;">
                        <p style="margin:0 0 4px;"><strong>Order ID:</strong> ${order.id}</p>
                        <p style="margin:0 0 4px;"><strong>Type:</strong> ${order.orderType === 'pickup' ? '🏪 Pickup' : '🍽️ Dine In'}</p>
                        <p style="margin:0 0 4px;"><strong>Payment:</strong> ${order.cardNetwork} ending in ${order.cardLast4}</p>
                        <p style="margin:0;"><strong>Date:</strong> ${order.date} at ${order.time}</p>
                    </div>
                </div>
                <div style="padding:20px;text-align:center;background:#f9f6f2;color:#999;font-size:12px;">
                    <p style="margin:0;">742 Evergreen Terrace, Portland, OR 97201</p>
                    <p style="margin:4px 0 0;">(503) 555-BREW | hello@emberandbrew.com</p>
                </div>
            </div>
        </body>
        </html>`;
    }

    buildReceiptText(order) {
        const items = order.items.map(i => `  ${i.name} (${i.size}) x${i.quantity} - $${(i.price * i.quantity).toFixed(2)}`).join('\n');
        return `EMBER & BREW - ORDER RECEIPT\n${'='.repeat(40)}\nOrder #${order.id}\n${order.date} at ${order.time}\n\nItems:\n${items}\n\nSubtotal: $${order.subtotal.toFixed(2)}\nTax: $${order.tax.toFixed(2)}\nTotal: $${order.total.toFixed(2)}\n\nPaid with ${order.cardNetwork} ending in ${order.cardLast4}\n\nThank you for choosing Ember & Brew!`;
    }
}

// ==========================================
// HTTP SERVER — From Scratch
// ==========================================
const db = new Database(DB_PATH);
const paymentEngine = new PaymentEngine(db);

// Load SMTP config
let smtpConfig = {};
const smtpConfigPath = path.join(__dirname, 'email.config.json');
if (fs.existsSync(smtpConfigPath)) {
    try { smtpConfig = JSON.parse(fs.readFileSync(smtpConfigPath, 'utf8')); }
    catch (e) { console.log('[SMTP] Invalid email.config.json'); }
}
const smtpClient = new SmtpClient(smtpConfig);

// MIME types for static file serving
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
};

// Parse JSON body from request
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}); }
            catch { reject(new Error('Invalid JSON')); }
        });
    });
}

// Send JSON response
function jsonResponse(res, status, data) {
    const body = JSON.stringify(data);
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(body);
}

// Serve static files
function serveStatic(req, res) {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath.split('?')[0]);

    const ext = path.extname(filePath);
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(data);
    });
}

// ==========================================
// API ROUTES
// ==========================================
async function handleApi(req, res) {
    const url = req.url.split('?')[0];
    const method = req.method;

    try {
        // ---- Register Card ----
        if (url === '/api/cards/register' && method === 'POST') {
            const body = await parseBody(req);
            const { cardNumber, holderName, expiry, cvv, initialBalance } = body;

            if (!cardNumber || !holderName || !expiry || !cvv) {
                return jsonResponse(res, 400, { error: 'Missing required fields: cardNumber, holderName, expiry, cvv' });
            }

            const result = paymentEngine.registerCard(cardNumber, holderName, expiry, cvv, initialBalance || 100);
            return jsonResponse(res, result.success ? 201 : 400, result);
        }

        // ---- Check Balance ----
        if (url === '/api/cards/balance' && method === 'POST') {
            const body = await parseBody(req);
            const result = paymentEngine.getBalance(body.cardNumber);
            return jsonResponse(res, result.success ? 200 : 404, result);
        }

        // ---- Add Funds ----
        if (url === '/api/cards/fund' && method === 'POST') {
            const body = await parseBody(req);
            const { cardNumber, amount } = body;
            if (!cardNumber || !amount || amount <= 0) {
                return jsonResponse(res, 400, { error: 'Invalid cardNumber or amount' });
            }
            const result = paymentEngine.addFunds(cardNumber, amount);
            return jsonResponse(res, result.success ? 200 : 404, result);
        }

        // ---- Process Payment ----
        if (url === '/api/payment/process' && method === 'POST') {
            const body = await parseBody(req);
            const { cardNumber, cvv, amount, order } = body;

            if (!cardNumber || !cvv || !amount) {
                return jsonResponse(res, 400, { error: 'Missing required fields' });
            }

            const result = paymentEngine.processPayment(cardNumber, cvv, amount, order);

            if (result.success) {
                // Save order
                const fullOrder = {
                    ...order,
                    transactionId: result.transaction.id,
                    cardLast4: result.transaction.cardLast4,
                    cardNetwork: result.transaction.network,
                    processedAt: result.transaction.timestamp
                };
                db.addOrder(fullOrder);

                // Try to send receipt email
                if (smtpClient.configured && order.customer && order.customer.email) {
                    const htmlReceipt = smtpClient.buildReceiptHtml(fullOrder);
                    const textReceipt = smtpClient.buildReceiptText(fullOrder);
                    const emailResult = await smtpClient.sendEmail(
                        order.customer.email,
                        `Your Ember & Brew Receipt — Order #${order.id}`,
                        htmlReceipt,
                        textReceipt
                    );

                    db.logEmail({
                        to: order.customer.email,
                        orderId: order.id,
                        status: emailResult.success ? 'sent' : 'failed',
                        error: emailResult.error || null,
                        timestamp: new Date().toISOString()
                    });

                    result.emailSent = emailResult.success;
                    result.emailError = emailResult.error || null;
                } else {
                    result.emailSent = false;
                    result.emailError = smtpClient.configured ? 'No customer email' : 'SMTP not configured';
                }
            }

            return jsonResponse(res, result.success ? 200 : 400, result);
        }

        // ---- Send Receipt Email (manual) ----
        if (url === '/api/email/send-receipt' && method === 'POST') {
            const body = await parseBody(req);
            if (!smtpClient.configured) {
                return jsonResponse(res, 400, { success: false, error: 'SMTP not configured. Create email.config.json' });
            }

            const htmlReceipt = smtpClient.buildReceiptHtml(body.order);
            const textReceipt = smtpClient.buildReceiptText(body.order);
            const result = await smtpClient.sendEmail(
                body.to,
                `Your Ember & Brew Receipt — Order #${body.order.id}`,
                htmlReceipt,
                textReceipt
            );
            return jsonResponse(res, result.success ? 200 : 500, result);
        }

        // ---- SMTP Status ----
        if (url === '/api/email/status' && method === 'GET') {
            return jsonResponse(res, 200, {
                configured: smtpClient.configured,
                host: smtpConfig.host || null
            });
        }

        // ---- Get all transactions ----
        if (url === '/api/transactions' && method === 'GET') {
            return jsonResponse(res, 200, { transactions: db.data.transactions.slice(-50) });
        }

        // ---- Get all orders ----
        if (url === '/api/orders' && method === 'GET') {
            return jsonResponse(res, 200, { orders: db.data.orders.slice(-50) });
        }

        // ---- 404 ----
        jsonResponse(res, 404, { error: 'API endpoint not found' });

    } catch (err) {
        console.error('[API Error]', err);
        jsonResponse(res, 500, { error: 'Internal server error: ' + err.message });
    }
}

// ==========================================
// CREATE & START SERVER
// ==========================================
const server = http.createServer((req, res) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        });
        return res.end();
    }

    // Route API requests
    if (req.url.startsWith('/api/')) {
        return handleApi(req, res);
    }

    // Serve static files
    serveStatic(req, res);
});

server.listen(PORT, () => {
    console.log('');
    console.log('  ☕ ═══════════════════════════════════════');
    console.log('  ☕  EMBER & BREW — Server Running');
    console.log(`  ☕  http://localhost:${PORT}`);
    console.log('  ☕ ═══════════════════════════════════════');
    console.log('');
    console.log(`  📦 Database: ${DB_PATH}`);
    console.log(`  📧 SMTP: ${smtpClient.configured ? 'Configured (' + smtpConfig.host + ')' : 'Not configured (create email.config.json)'}`);
    console.log('');
    console.log('  API Endpoints:');
    console.log('    POST /api/cards/register  — Register a card with balance');
    console.log('    POST /api/cards/balance   — Check card balance');
    console.log('    POST /api/cards/fund      — Add funds to card');
    console.log('    POST /api/payment/process — Process a payment');
    console.log('    GET  /api/email/status    — Check SMTP config');
    console.log('    GET  /api/transactions    — View transactions');
    console.log('    GET  /api/orders          — View orders');
    console.log('');
});
