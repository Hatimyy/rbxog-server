const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

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

router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ coins: user.coins, totalEarned: user.totalEarned, level: user.level });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/promo', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.userId);
    const codes = { 'ROBLOX2026': 50, 'FREERBX': 25, 'BONUS50': 50, 'STARTER': 10, 'WELCOME': 15 };
    const upperCode = code.toUpperCase();
    
    if (!codes[upperCode]) return res.status(400).json({ error: 'Invalid code' });
    if (user.usedCodes.includes(upperCode)) return res.status(400).json({ error: 'Code used' });
    
    user.coins += codes[upperCode];
    user.totalEarned += codes[upperCode];
    user.usedCodes.push(upperCode);
    await user.save();
    
    res.json({ success: true, reward: codes[upperCode], newBalance: user.coins });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
