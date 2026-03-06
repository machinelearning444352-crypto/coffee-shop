const { getEngine } = require('../_shared');

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { cardNumber, cvv, amount, order } = req.body || {};
    if (!cardNumber || !cvv || !amount) return res.status(400).json({ error: 'Missing required fields' });

    const { engine, db } = getEngine();
    const result = engine.processPayment(cardNumber, cvv, amount, order);

    if (result.success && order) {
        const fullOrder = { ...order, transactionId: result.transaction.id, cardLast4: result.transaction.cardLast4, cardNetwork: result.transaction.network, processedAt: result.transaction.timestamp };
        db.addOrder(fullOrder);
    }

    // Email not supported on Vercel serverless without external service
    result.emailSent = false;
    result.emailError = 'Email delivery requires SMTP configuration';

    return res.status(result.success ? 200 : 400).json(result);
};
