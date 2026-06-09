const express = require('express');
const router = express.Router();
const User = require('../models/User');

const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';

const admin = (req, res, next) => {
  if (req.headers['x-admin-key'] !== ADMIN_KEY) return res.status(403).json({ error: 'Unauthorized' });
  next();
};

router.get('/dashboard', admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEarned = await User.aggregate([{ $group: { _id: null, total: { $sum: '$totalEarned' } } }]);
    res.json({ stats: { totalUsers, totalEarned: totalEarned[0]?.total || 0 } });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
