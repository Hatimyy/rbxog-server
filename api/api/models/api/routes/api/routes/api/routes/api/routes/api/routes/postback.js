const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/ogads', async (req, res) => {
  try {
    const { subid, offer_id, payout, status } = req.body;
    if (status !== '1') return res.json({ success: true });
    
    const user = await User.findById(subid);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const reward = Math.floor(parseFloat(payout) * 10);
    user.coins += reward;
    user.totalEarned += reward;
    user.offersCompleted += 1;
    await user.save();
    
    res.json({ success: true, reward, newBalance: user.coins });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
