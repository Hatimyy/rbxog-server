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
    
    const validPattern = /^[a-zA-Z0-9_]+$/;
    if (!validPattern.test(username)) {
      return res.status(400).json({ error: 'Only letters, numbers, and underscores' });
    }
    
    let user = await User.findOne({ username });
    if (user) {
      user.lastLogin = new Date();
      user.ip = req.ip;
      user.userAgent = req.headers['user-agent'];
      await user.save();
      
      const token = generateToken(user._id);
      return res.json({
        success: true,
        token,
        user: {
          username: user.username,
          coins: user.coins,
          totalEarned: user.totalEarned,
          level: user.level,
          streak: user.streak,
          offersCompleted: user.offersCompleted
        }
      });
    }
    
    const referralCode = uuidv4().substring(0, 8).toUpperCase();
    
    user = new User({
      username,
      robloxId: robloxId || null,
      avatarUrl: avatarUrl || null,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referralCode
    });
    
    await user.save();
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        username: user.username,
        coins: user.coins,
        totalEarned: user.totalEarned,
        level: user.level,
        streak: user.streak,
        offersCompleted: user.offersCompleted
      }
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.lastLogin = new Date();
    user.ip = req.ip;
    user.userAgent = req.headers['user-agent'];
    await user.save();
    
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      token,
      user: {
        username: user.username,
        coins: user.coins,
        totalEarned: user.totalEarned,
        level: user.level,
        xp: user.xp,
        streak: user.streak,
        offersCompleted: user.offersCompleted,
        avatarUrl: user.avatarUrl,
        usedCodes: user.usedCodes
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-ip -userAgent');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: {
        username: user.username,
        coins: user.coins,
        totalEarned: user.totalEarned,
        level: user.level,
        xp: user.xp,
        streak: user.streak,
        offersCompleted: user.offersCompleted,
        avatarUrl: user.avatarUrl,
        usedCodes: user.usedCodes,
        referrals: user.referrals,
        referralCode: user.referralCode
      }
    });
    
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
