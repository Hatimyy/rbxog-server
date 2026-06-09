const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

router.post('/register', async (req, res) => {
  try {
    const { username, robloxId, avatarUrl } = req.body;
    
    if (!username || username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 3-20 characters' });
    }
    
    let user = await User.findOne({ username });
    if (user) {
      user.lastLogin = new Date();
      await user.save();
      const token = generateToken(user._id);
      return res.json({ success: true, token, user: { username: user.username, coins: user.coins } });
    }
    
    const referralCode = uuidv4().substring(0, 8).toUpperCase();
    user = new User({ username, robloxId: robloxId || null, avatarUrl: avatarUrl || null, referralCode });
    await user.save();
    const token = generateToken(user._id);
    
    res.status(201).json({ success: true, token, user: { username: user.username, coins: 0 } });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken(user._id);
    
    res.json({ success: true, token, user: { username: user.username, coins: user.coins } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ success: true, user: { username: user.username, coins: user.coins, totalEarned: user.totalEarned } });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
