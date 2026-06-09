const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const authMiddleware = async (req, res, next) => {
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

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      coins: user.coins,
      totalEarned: user.totalEarned,
      level: user.level,
      xp: user.xp,
      streak: user.streak,
      offersCompleted: user.offersCompleted,
      pendingOffers: user.offersPending.filter(o => o.status === 'pending').length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

router.post('/promo', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const codes = {
      'ROBLOX2026': 50,
      'FREERBX': 25,
      'BONUS50': 50,
      'STARTER': 10,
      'WELCOME': 15,
      'OGUSER': 100
    };
    
    const upperCode = code.toUpperCase();
    
    if (!codes[upperCode]) {
      return res.status(400).json({ error: 'Invalid promo code' });
    }
    
    if (user.usedCodes.includes(upperCode)) {
      return res.status(400).json({ error: 'Code already used' });
    }
    
    const reward = codes[upperCode];
    user.coins += reward;
    user.totalEarned += reward;
    user.usedCodes.push(upperCode);
    await user.save();
    
    res.json({
      success: true,
      reward,
      newBalance: user.coins,
      message: `+${reward} R$ added!`
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to redeem code' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await User.find()
      .sort({ totalEarned: -1 })
      .limit(10)
      .select('username totalEarned level avatarUrl');
    
    res.json({
      success: true,
      leaderboard: topUsers.map((u, i) => ({
        rank: i + 1,
        username: u.username,
        totalEarned: u.totalEarned,
        level: u.level,
        avatarUrl: u.avatarUrl
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

module.exports = router;
