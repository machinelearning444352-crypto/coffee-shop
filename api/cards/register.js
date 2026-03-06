const { getEngine } = require('../_shared');

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { cardNumber, holderName, expiry, cvv, initialBalance } = req.body || {};
    if (!cardNumber || !holderName || !expiry || !cvv) {
        return res.status(400).json({ error: 'Missing required fields: cardNumber, holderName, expiry, cvv' });
    }

    const { engine } = getEngine();
    const result = engine.registerCard(cardNumber, holderName, expiry, cvv, initialBalance || 100);
    return res.status(result.success ? 201 : 400).json(result);
};
