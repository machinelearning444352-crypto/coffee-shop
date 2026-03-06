const { getEngine } = require('../_shared');

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { cardNumber } = req.body || {};
    if (!cardNumber) return res.status(400).json({ error: 'Missing cardNumber' });

    const { engine } = getEngine();
    const result = engine.getBalance(cardNumber);
    return res.status(result.success ? 200 : 404).json(result);
};
