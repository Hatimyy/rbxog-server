const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_this';
const MIN_WITHDRAWAL = 100; // Minimum 100 R$

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

// POST /api/withdraw/request - Request withdrawal
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { amount, method, robloxUsername } = req.body;
    const user = await User.findById(req.userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Validation
    if (!amount || amount < MIN_WITHDRAWAL) {
      return res.status(400).json({ 
        error: `Minimum withdrawal is ${MIN_WITHDRAWAL} R$` 
      });
    }

    if (user.coins < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Check pending withdrawals
    const pendingWithdrawals = user.withdrawals.filter(w => w.status === 'pending');
    if (pendingWithdrawals.length >= 3) {
      return res.status(400).json({ error: 'Maximum 3 pending withdrawals allowed' });
    }

    // Deduct coins
    user.coins -= amount;

    // Add withdrawal record
    user.withdrawals.push({
      amount,
      method: method || 'roblox_group',
      status: 'pending',
      requestedAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: 'Withdrawal request submitted!',
      newBalance: user.coins,
      withdrawalId: user.withdrawals[user.withdrawals.length - 1]._id
    });

  } catch (error) {
    res.status(500).json({ error: 'Withdrawal failed' });
  }
});

// GET /api/withdraw/history - Get withdrawal history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('withdrawals coins');

    res.json({
      success: true,
      balance: user.coins,
      withdrawals: user.withdrawals.sort((a, b) => b.requestedAt - a.requestedAt)
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to get history' });
  }
});

module.exports = router;