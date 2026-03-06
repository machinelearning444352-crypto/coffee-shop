/* =============================================
   PAYMENT SYSTEM — Frontend Integration
   Connects to the real backend server for:
   - Card registration with balance
   - Real balance checking & fund deduction
   - Email receipt via raw SMTP
   ============================================= */

'use strict';

const Payment = {
    currentStep: 1,
    orderType: 'pickup',
    customerData: {},
    cardData: {},
    rawCardNumber: '',
    rawCvv: '',

    processingStages: [
        'Encrypting card data...',
        'Verifying card number...',
        'Checking available funds...',
        'Processing transaction...',
        'Generating confirmation...'
    ],

    cardPatterns: [
        { type: 'visa', pattern: /^4/, emoji: '💳', name: 'Visa', cvvLength: 3, lengths: [13, 16, 19] },
        { type: 'mastercard', pattern: /^(5[1-5]|2[2-7])/, emoji: '💳', name: 'Mastercard', cvvLength: 3, lengths: [16] },
        { type: 'amex', pattern: /^3[47]/, emoji: '💳', name: 'Amex', cvvLength: 4, lengths: [15] },
        { type: 'discover', pattern: /^(6011|65|64[4-9])/, emoji: '💳', name: 'Discover', cvvLength: 3, lengths: [16, 17, 18, 19] },
        { type: 'diners', pattern: /^(30[0-5]|36|38)/, emoji: '💳', name: 'Diners Club', cvvLength: 3, lengths: [14, 15, 16] },
        { type: 'jcb', pattern: /^35(28|29|[3-8])/, emoji: '💳', name: 'JCB', cvvLength: 3, lengths: [15, 16, 17, 18, 19] },
        { type: 'unionpay', pattern: /^62/, emoji: '💳', name: 'UnionPay', cvvLength: 3, lengths: [16, 17, 18, 19] },
    ],

    // ==========================================
    // API HELPER
    // ==========================================
    async api(endpoint, data) {
        try {
            const res = await fetch('/api' + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        } catch (err) {
            return { success: false, error: 'Server connection failed. Is the server running?' };
        }
    },

    // ==========================================
    // INITIALIZATION
    // ==========================================
    init() {
        this.bindEvents();
        this.bindCardInputs();
        this.initCardRegistration();
        this.checkEmailStatus();
    },

    bindEvents() {
        Utils.on('#payment-close', 'click', () => this.close());
        Utils.on('#step1-next', 'click', () => this.validateStep1());
        Utils.on('#step2-next', 'click', () => this.validateStep2());
        Utils.on('#step2-back', 'click', () => this.goToStep(1));
        Utils.on('#step3-back', 'click', () => this.goToStep(2));
        Utils.on('#place-order-btn', 'click', () => this.processPayment());
        Utils.on('#new-order-btn', 'click', () => this.startNewOrder());

        Utils.$$('.order-type').forEach(btn => {
            btn.addEventListener('click', () => {
                Utils.$$('.order-type').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.orderType = btn.getAttribute('data-type');
            });
        });

        Utils.on('#payment-modal', 'click', (e) => {
            if (e.target === e.currentTarget) this.close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
                this.closeCardRegistration();
            }
        });
    },

    // ==========================================
    // CARD INPUT HANDLING
    // ==========================================
    bindCardInputs() {
        Utils.on('#card-number', 'input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            const cardType = this.detectCardType(value);
            this.updateCardTypeDisplay(cardType);

            if (cardType && cardType.type === 'amex') {
                value = value.substring(0, 15);
                const parts = [value.substring(0, 4), value.substring(4, 10), value.substring(10, 15)];
                e.target.value = parts.filter(Boolean).join(' ');
            } else {
                value = value.substring(0, 16);
                e.target.value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            }

            this.rawCardNumber = value;
            Utils.$('#card-number-display').textContent = e.target.value || '•••• •••• •••• ••••';
            Utils.$('#card-number-error').textContent = '';
        });

        Utils.on('#card-expiry', 'input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                const month = parseInt(value.substring(0, 2));
                if (month > 12) value = '12' + value.substring(2);
                if (month === 0) value = '01' + value.substring(2);
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
            Utils.$('#card-expiry-display').textContent = value || 'MM/YY';
            Utils.$('#card-expiry-error').textContent = '';
        });

        Utils.on('#card-cvv', 'input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
            this.rawCvv = e.target.value;
            Utils.$('#card-cvv-error').textContent = '';
        });

        Utils.on('#card-name', 'input', (e) => {
            e.target.value = e.target.value.toUpperCase();
            Utils.$('#card-holder-display').textContent = e.target.value || 'YOUR NAME';
        });

        Utils.on('#pay-phone', 'input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 6) value = `(${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6, 10)}`;
            else if (value.length >= 3) value = `(${value.substring(0, 3)}) ${value.substring(3)}`;
            e.target.value = value;
        });
    },

    detectCardType(number) {
        for (const card of this.cardPatterns) {
            if (card.pattern.test(number)) return card;
        }
        return null;
    },

    updateCardTypeDisplay(cardType) {
        const icon = Utils.$('#card-type-icon');
        const display = Utils.$('#card-type-display');
        if (cardType) {
            icon.textContent = cardType.emoji;
            display.textContent = cardType.name;
            const gradients = {
                visa: 'linear-gradient(135deg, #1a1f71, #0d47a1)',
                mastercard: 'linear-gradient(135deg, #eb001b, #f79e1b)',
                amex: 'linear-gradient(135deg, #006fcf, #00aeef)',
                discover: 'linear-gradient(135deg, #ff6600, #d4531c)',
            };
            Utils.$('.card-front').style.background = gradients[cardType.type] || '';
        } else {
            icon.textContent = '';
            display.textContent = '';
            Utils.$('.card-front').style.background = '';
        }
    },

    luhnCheck(number) {
        const digits = number.replace(/\D/g, '');
        if (!digits.length) return false;
        let sum = 0, alt = false;
        for (let i = digits.length - 1; i >= 0; i--) {
            let n = parseInt(digits[i], 10);
            if (alt) { n *= 2; if (n > 9) n -= 9; }
            sum += n;
            alt = !alt;
        }
        return sum % 10 === 0;
    },

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // ==========================================
    // CARD REGISTRATION SYSTEM
    // ==========================================
    initCardRegistration() {
        // Open/close register modal
        Utils.on('#open-register-card', 'click', () => this.openCardRegistration());
        Utils.on('#register-card-close', 'click', () => this.closeCardRegistration());
        Utils.on('#register-card-modal', 'click', (e) => {
            if (e.target === e.currentTarget) this.closeCardRegistration();
        });

        // Register form submit
        Utils.on('#register-card-btn', 'click', () => this.registerCard());

        // Format register card number
        Utils.on('#reg-card-number', 'input', (e) => {
            let v = e.target.value.replace(/\D/g, '').substring(0, 16);
            e.target.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
        });

        Utils.on('#reg-card-expiry', 'input', (e) => {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length >= 2) {
                let m = parseInt(v.substring(0, 2));
                if (m > 12) v = '12' + v.substring(2);
                if (m === 0) v = '01' + v.substring(2);
                v = v.substring(0, 2) + '/' + v.substring(2, 4);
            }
            e.target.value = v;
        });

        Utils.on('#reg-card-cvv', 'input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
        });

        Utils.on('#reg-card-name', 'input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });

        // Check balance button
        Utils.on('#check-balance-btn', 'click', () => this.checkBalance());
        Utils.on('#balance-card-number', 'input', (e) => {
            let v = e.target.value.replace(/\D/g, '').substring(0, 16);
            e.target.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
        });

        // Add funds button
        Utils.on('#add-funds-btn', 'click', () => this.addFunds());
        Utils.on('#fund-card-number', 'input', (e) => {
            let v = e.target.value.replace(/\D/g, '').substring(0, 16);
            e.target.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
        });
    },

    openCardRegistration() {
        Utils.$('#register-card-modal').classList.add('show');
        document.body.style.overflow = 'hidden';
    },

    closeCardRegistration() {
        Utils.$('#register-card-modal')?.classList.remove('show');
        document.body.style.overflow = '';
    },

    async registerCard() {
        const cardNumber = Utils.$('#reg-card-number').value.replace(/\s/g, '');
        const holderName = Utils.$('#reg-card-name').value.trim();
        const expiry = Utils.$('#reg-card-expiry').value;
        const cvv = Utils.$('#reg-card-cvv').value;
        const balance = parseFloat(Utils.$('#reg-card-balance').value) || 100;

        if (!cardNumber || !holderName || !expiry || !cvv) {
            Toast.error('Please fill in all fields');
            return;
        }

        if (!this.luhnCheck(cardNumber)) {
            Toast.error('Invalid card number (Luhn check failed)');
            return;
        }

        const btn = Utils.$('#register-card-btn');
        btn.disabled = true;
        btn.textContent = 'Registering...';

        const result = await this.api('/cards/register', {
            cardNumber, holderName, expiry, cvv, initialBalance: balance
        });

        btn.disabled = false;
        btn.textContent = 'Register Card';

        if (result.success) {
            Toast.success(`Card registered! Balance: $${result.account.balance.toFixed(2)}`);
            Utils.$('#reg-card-number').value = '';
            Utils.$('#reg-card-name').value = '';
            Utils.$('#reg-card-expiry').value = '';
            Utils.$('#reg-card-cvv').value = '';
            Utils.$('#reg-card-balance').value = '100';
            this.closeCardRegistration();
        } else {
            Toast.error(result.error);
        }
    },

    async checkBalance() {
        const cardNumber = Utils.$('#balance-card-number').value;
        if (!cardNumber) { Toast.error('Enter a card number'); return; }

        const result = await this.api('/cards/balance', { cardNumber });
        const display = Utils.$('#balance-result');

        if (result.success) {
            display.innerHTML = `
                <div style="padding:16px;background:var(--bg-glass-light);border:1px solid var(--border-color);border-radius:var(--radius-md);margin-top:12px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span style="color:var(--text-muted);">${result.network} •••• ${result.cardLast4}</span>
                        <span style="color:${result.status === 'active' ? '#22c55e' : '#ef4444'};font-size:0.8rem;text-transform:uppercase;">${result.status}</span>
                    </div>
                    <div style="font-family:var(--font-display);font-size:2rem;font-weight:700;color:var(--color-primary);">$${result.balance.toFixed(2)}</div>
                    <div style="color:var(--text-muted);font-size:0.8rem;">Available Balance</div>
                </div>
            `;
        } else {
            display.innerHTML = `<p style="color:#ef4444;margin-top:12px;font-size:0.9rem;">❌ ${result.error}</p>`;
        }
    },

    async addFunds() {
        const cardNumber = Utils.$('#fund-card-number').value;
        const amount = parseFloat(Utils.$('#fund-amount').value);

        if (!cardNumber) { Toast.error('Enter card number'); return; }
        if (!amount || amount <= 0) { Toast.error('Enter a valid amount'); return; }

        const result = await this.api('/cards/fund', { cardNumber, amount });
        const display = Utils.$('#fund-result');

        if (result.success) {
            display.innerHTML = `<p style="color:#22c55e;margin-top:12px;font-size:0.9rem;">✅ Funds added! New balance: <strong>$${result.newBalance.toFixed(2)}</strong></p>`;
            Toast.success(`$${amount.toFixed(2)} added to card!`);
        } else {
            display.innerHTML = `<p style="color:#ef4444;margin-top:12px;font-size:0.9rem;">❌ ${result.error}</p>`;
        }
    },

    async checkEmailStatus() {
        try {
            const res = await fetch('/api/email/status');
            const data = await res.json();
            this.emailConfigured = data.configured;
        } catch {
            this.emailConfigured = false;
        }
    },

    // ==========================================
    // STEP VALIDATION
    // ==========================================
    validateStep1() {
        const name = Utils.$('#pay-name').value.trim();
        const email = Utils.$('#pay-email').value.trim();
        const phone = Utils.$('#pay-phone').value.trim();

        if (!name) { Toast.error('Please enter your name'); Utils.$('#pay-name').focus(); return; }
        if (!email || !this.validateEmail(email)) { Toast.error('Please enter a valid email'); Utils.$('#pay-email').focus(); return; }
        if (!phone || phone.replace(/\D/g, '').length < 10) { Toast.error('Please enter a valid phone number'); Utils.$('#pay-phone').focus(); return; }

        this.customerData = { name, email, phone, orderType: this.orderType };
        this.goToStep(2);
    },

    validateStep2() {
        const cardNumber = Utils.$('#card-number').value;
        const expiry = Utils.$('#card-expiry').value;
        const cvv = Utils.$('#card-cvv').value;
        const cardName = Utils.$('#card-name').value.trim();
        const rawNumber = cardNumber.replace(/\s/g, '');

        let hasErrors = false;
        const cardType = this.detectCardType(rawNumber);

        if (!rawNumber) {
            Utils.$('#card-number-error').textContent = 'Card number is required';
            hasErrors = true;
        } else if (!this.luhnCheck(rawNumber)) {
            Utils.$('#card-number-error').textContent = 'Invalid card number (checksum failed)';
            hasErrors = true;
        }

        if (!expiry || expiry.length < 5) {
            Utils.$('#card-expiry-error').textContent = 'Expiry date required';
            hasErrors = true;
        }

        const cvvLen = cardType ? cardType.cvvLength : 3;
        if (!cvv || cvv.length !== cvvLen) {
            Utils.$('#card-cvv-error').textContent = `CVV must be ${cvvLen} digits`;
            hasErrors = true;
        }

        if (!cardName) {
            Toast.error('Please enter the name on your card');
            hasErrors = true;
        }

        if (hasErrors) return;

        this.rawCardNumber = rawNumber;
        this.rawCvv = cvv;
        this.cardData = {
            type: cardType,
            lastFour: rawNumber.slice(-4),
            holderName: cardName,
            expiry: expiry
        };

        this.goToStep(3);
        this.renderOrderReview();
    },

    // ==========================================
    // STEP NAVIGATION
    // ==========================================
    goToStep(step) {
        this.currentStep = step;
        Utils.$$('.step-indicator').forEach((ind, i) => {
            ind.classList.remove('active', 'completed');
            if (i + 1 < step) ind.classList.add('completed');
            if (i + 1 === step) ind.classList.add('active');
        });
        Utils.$$('.step-connector').forEach((conn, i) => {
            conn.classList.toggle('active', i + 1 < step);
        });
        Utils.$$('.payment-step').forEach(s => s.classList.remove('active'));
        Utils.$(`#step-${step}`).classList.add('active');
    },

    // ==========================================
    // ORDER REVIEW
    // ==========================================
    renderOrderReview() {
        const reviewContainer = Utils.$('#order-review');
        const discount = this.calculateRewardsDiscount();
        const subtotal = Cart.getSubtotal();
        const tax = Cart.getTax();

        let html = '';
        AppState.cart.forEach(item => {
            html += `
                <div class="review-item">
                    <div class="review-item-info">
                        <span class="review-item-emoji">${item.emoji}</span>
                        <div>
                            <div class="review-item-name">${item.name}</div>
                            <div class="review-item-size">${item.size}</div>
                        </div>
                    </div>
                    <span class="review-item-qty">x${item.quantity}</span>
                    <span class="review-item-price">${Utils.formatCurrency(item.price * item.quantity)}</span>
                </div>
            `;
        });

        reviewContainer.innerHTML = html;
        Utils.$('#review-subtotal').textContent = Utils.formatCurrency(subtotal);
        Utils.$('#review-tax').textContent = Utils.formatCurrency(tax);
        Utils.$('#review-discount').textContent = '-' + Utils.formatCurrency(discount);
        Utils.$('#review-total').textContent = Utils.formatCurrency(subtotal + tax - discount);
    },

    calculateRewardsDiscount() {
        if (!AppState.rewardsMember) return 0;
        const points = AppState.rewardsPoints;
        if (points >= 500) return Cart.getSubtotal() * 0.10;
        if (points >= 200) return Cart.getSubtotal() * 0.05;
        return 0;
    },

    // ==========================================
    // REAL PAYMENT PROCESSING — Calls Backend
    // ==========================================
    async processPayment() {
        const placeBtn = Utils.$('#place-order-btn');
        const btnText = placeBtn.querySelector('.btn-text');
        const btnSpinner = placeBtn.querySelector('.btn-spinner');

        placeBtn.disabled = true;
        btnText.style.display = 'none';
        btnSpinner.style.display = 'inline-block';

        // Processing overlay with animated stages
        const overlay = document.createElement('div');
        overlay.className = 'processing-overlay';
        overlay.innerHTML = `
            <div class="processing-spinner"></div>
            <div class="processing-steps" id="processing-steps">
                ${this.processingStages.map((stage, i) => `
                    <div class="processing-step" data-stage="${i}">${stage}</div>
                `).join('')}
            </div>
        `;
        Utils.$('.payment-modal-content').appendChild(overlay);

        // Animate stages while the real API call happens
        const stageAnimation = this.animateStages(overlay);

        // Build order data
        const discount = this.calculateRewardsDiscount();
        const subtotal = Cart.getSubtotal();
        const tax = Cart.getTax();
        const total = parseFloat((subtotal + tax - discount).toFixed(2));

        const orderId = 'EB-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();

        const orderData = {
            id: orderId,
            items: [...AppState.cart],
            customer: { ...this.customerData },
            subtotal, tax, discount, total,
            orderType: this.orderType,
            date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };

        // Call the REAL backend payment API
        const result = await this.api('/payment/process', {
            cardNumber: this.rawCardNumber,
            cvv: this.rawCvv,
            amount: total,
            order: orderData
        });

        // Wait for animation to finish
        await stageAnimation;
        await this.delay(400);

        // Remove overlay
        overlay.remove();
        placeBtn.disabled = false;
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';

        if (result.success) {
            this.onPaymentSuccess(orderData, result);
        } else {
            this.onPaymentFailure(result);
        }
    },

    async animateStages(overlay) {
        for (let i = 0; i < this.processingStages.length; i++) {
            await this.delay(600 + Math.random() * 400);
            const steps = overlay.querySelectorAll('.processing-step');
            steps.forEach((step, j) => {
                if (j < i) {
                    step.classList.remove('active');
                    step.classList.add('done');
                    if (!step.textContent.startsWith('✓')) {
                        step.innerHTML = `<span class="step-check">✓</span> ${step.textContent}`;
                    }
                } else if (j === i) {
                    step.classList.add('active');
                }
            });
        }
    },

    onPaymentSuccess(order, result) {
        // Save order locally too
        AppState.orderHistory.push(order);
        Utils.saveToStorage('eb-orders', AppState.orderHistory);

        // Award rewards
        if (AppState.rewardsMember) {
            const earned = Math.floor(order.total * 10);
            AppState.rewardsPoints += earned;
            Utils.saveToStorage('eb-points', AppState.rewardsPoints);
            if (typeof Rewards !== 'undefined') Rewards.updateCard();
        }

        // Show success step
        this.goToStep(4);
        Utils.$('#order-id').textContent = order.id;
        Utils.$('#receipt-email').textContent = this.customerData.email;

        const etaMin = 8 + Math.floor(Math.random() * 8);
        Utils.$('#order-eta').textContent = `${etaMin}-${etaMin + 5} min`;

        // Email status message
        const emailMsg = Utils.$('#email-status-msg');
        if (emailMsg) {
            if (result.emailSent) {
                emailMsg.innerHTML = `<span style="color:#22c55e;">✅ Receipt emailed to ${this.customerData.email}</span>`;
            } else {
                emailMsg.innerHTML = `<span style="color:var(--text-muted);">📧 ${result.emailError || 'Email not configured'} — receipt shown below</span>`;
            }
        }

        // Show remaining balance
        const balanceMsg = Utils.$('#balance-after-msg');
        if (balanceMsg && result.transaction) {
            balanceMsg.innerHTML = `<span style="color:var(--text-secondary);">💳 Card balance remaining: <strong style="color:var(--color-primary);">$${result.transaction.newBalance.toFixed(2)}</strong></span>`;
        }

        this.generateReceipt(order, result);
        Cart.clear();
        Toast.success('Payment successful! Your order has been placed.');
    },

    onPaymentFailure(result) {
        // Show specific error from backend
        const errorMessages = {
            'INVALID_CARD': '❌ Invalid card number',
            'CARD_NOT_FOUND': '❌ Card not registered. Register your card first using the "Register Card" button.',
            'CARD_INACTIVE': '❌ This card is not active',
            'CVV_MISMATCH': '❌ Incorrect CVV. Please check and try again.',
            'CARD_EXPIRED': '❌ This card has expired',
            'INSUFFICIENT_FUNDS': '❌ ' + result.error,
        };

        const msg = errorMessages[result.code] || result.error || 'Payment failed';
        Toast.error(msg);

        // Shake card
        const card = Utils.$('.card-front');
        card.style.animation = 'shake 0.5s ease';
        setTimeout(() => card.style.animation = '', 500);

        if (!document.getElementById('shake-keyframes')) {
            const style = document.createElement('style');
            style.id = 'shake-keyframes';
            style.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-10px)}80%{transform:translateX(10px)}}`;
            document.head.appendChild(style);
        }
    },

    // ==========================================
    // RECEIPT GENERATION
    // ==========================================
    generateReceipt(order, result) {
        const container = Utils.$('#receipt-container');
        const itemsHtml = order.items.map(item => `
            <div class="receipt-item">
                <span>${item.name} (${item.size}) x${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');

        const txnId = result.transaction ? result.transaction.id : 'N/A';
        const network = result.transaction ? result.transaction.network : (this.cardData.type?.name || 'Card');
        const last4 = result.transaction ? result.transaction.cardLast4 : this.cardData.lastFour;

        container.innerHTML = `
            <div class="receipt-header">
                <h4>☕ Ember & Brew</h4>
                <p>742 Evergreen Terrace, Portland, OR 97201</p>
                <p>(503) 555-BREW</p>
            </div>
            <div style="text-align:center;margin-bottom:12px;font-size:0.75rem;color:#666;">
                <div>Order #${order.id}</div>
                <div>Transaction: ${txnId}</div>
                <div>${order.date} at ${order.time}</div>
                <div>Type: ${order.orderType === 'pickup' ? '🏪 Pickup' : '🍽️ Dine In'}</div>
            </div>
            <div class="receipt-items">${itemsHtml}</div>
            <div class="receipt-totals">
                <div class="receipt-total-row"><span>Subtotal</span><span>$${order.subtotal.toFixed(2)}</span></div>
                <div class="receipt-total-row"><span>Tax (8.5%)</span><span>$${order.tax.toFixed(2)}</span></div>
                ${order.discount > 0 ? `<div class="receipt-total-row"><span>Rewards Discount</span><span>-$${order.discount.toFixed(2)}</span></div>` : ''}
                <div class="receipt-total-row grand"><span>TOTAL</span><span>$${order.total.toFixed(2)}</span></div>
            </div>
            <div style="text-align:center;margin-bottom:12px;font-size:0.75rem;color:#666;">
                <div>Paid with ${network} ending in ${last4}</div>
                <div>Customer: ${order.customer.name}</div>
            </div>
            <div class="receipt-footer">
                <p>Thank you for choosing Ember & Brew!</p>
                <div class="receipt-barcode"></div>
            </div>
        `;
    },

    // ==========================================
    // MODAL CONTROL
    // ==========================================
    open() {
        if (AppState.cart.length === 0) {
            Toast.warning('Your cart is empty. Add some items first!');
            return;
        }
        Utils.$('#payment-modal').classList.add('show');
        document.body.style.overflow = 'hidden';
        this.goToStep(1);
        this.resetForm();
    },

    close() {
        Utils.$('#payment-modal').classList.remove('show');
        document.body.style.overflow = '';
    },

    resetForm() {
        ['#pay-name', '#pay-email', '#pay-phone', '#card-number', '#card-expiry', '#card-cvv', '#card-name'].forEach(id => {
            const el = Utils.$(id);
            if (el) el.value = '';
        });
        Utils.$('#card-number-display').textContent = '•••• •••• •••• ••••';
        Utils.$('#card-holder-display').textContent = 'YOUR NAME';
        Utils.$('#card-expiry-display').textContent = 'MM/YY';
        Utils.$('#card-type-display').textContent = '';
        Utils.$('#card-type-icon').textContent = '';
        Utils.$('#card-number-error').textContent = '';
        Utils.$('#card-expiry-error').textContent = '';
        Utils.$('#card-cvv-error').textContent = '';
        Utils.$('.card-front').style.background = '';
    },

    startNewOrder() {
        this.close();
        document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Payment.init();
});
