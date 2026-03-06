module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ configured: false, host: null });
};
