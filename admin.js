const express = require('express');
const router = express.Router();
const User = require('../models/User');

const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';

// Admin middleware
const adminMiddleware = (req, res, next) => {
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
};

// GET /api/admin/dashboard - Admin stats
router.get('/dashboard', adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEarned = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$totalEarned' } } }
    ]);
    const totalWithdrawals = await User.aggregate([
      { $unwind: '$withdrawals' },
      { $match: { 'withdrawals.status': 'pending' } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$withdrawals.amount' } } }
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('username coins totalEarned createdAt');

    res.json({
      stats: {
        totalUsers,
        totalEarned: totalEarned[0]?.total || 0,
        pendingWithdrawals: totalWithdrawals[0]?.count || 0,
        pendingAmount: totalWithdrawals[0]?.amount || 0
      },
      recentUsers
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

// GET /api/admin/users - All users
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find()
      .sort({ totalEarned: -1 })
      .select('username coins totalEarned offersCompleted level streak createdAt withdrawals');

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// POST /api/admin/withdraw/process - Process withdrawal
router.post('/withdraw/process', adminMiddleware, async (req, res) => {
  try {
    const { userId, withdrawalId, action } = req.body; // action: 'approve' or 'reject'

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const withdrawal = user.withdrawals.id(withdrawalId);
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });

    withdrawal.status = action === 'approve' ? 'completed' : 'rejected';
    withdrawal.processedAt = new Date();

    // If rejected, refund coins
    if (action === 'reject') {
      user.coins += withdrawal.amount;
    }

    await user.save();

    res.json({
      success: true,
      status: withdrawal.status,
      user: user.username,
      amount: withdrawal.amount
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

module.exports = router;