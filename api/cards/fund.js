const { getEngine } = require('../_shared');

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { cardNumber, amount } = req.body || {};
    if (!cardNumber || !amount || amount <= 0) return res.status(400).json({ error: 'Invalid cardNumber or amount' });

    const { engine } = getEngine();
    const result = engine.addFunds(cardNumber, amount);
    return res.status(result.success ? 200 : 404).json(result);
};
