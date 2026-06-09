const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const MIN_WITHDRAWAL = 100;

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/request', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.userId);
    if (!amount || amount < MIN_WITHDRAWAL) return res.status(400).json({ error: `Min ${MIN_WITHDRAWAL} R$` });
    if (user.coins < amount) return res.status(400).json({ error: 'Insufficient balance' });
    
    user.coins -= amount;
    user.withdrawals.push({ amount, status: 'pending', requestedAt: new Date() });
    await user.save();
    
    res.json({ success: true, newBalance: user.coins });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
