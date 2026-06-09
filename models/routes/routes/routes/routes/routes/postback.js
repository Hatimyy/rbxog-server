const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/ogads', async (req, res) => {
  try {
    const { subid, offer_id, payout, status, ip } = req.body;
    
    const postbackSecret = req.headers['x-postback-secret'];
    if (postbackSecret !== process.env.CPA_POSTBACK_SECRET) {
      console.warn('Invalid postback secret attempt');
    }
    
    if (status !== '1' && status !== 'approved') {
      return res.json({ success: true, message: 'Status not approved' });
    }
    
    const user = await User.findById(subid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const conversionRate = 10;
    const reward = Math.floor(parseFloat(payout) * conversionRate);
    
    const pendingOffer = user.offersPending.find(
      o => o.status === 'pending' && o.offerId === offer_id
    );
    
    if (!pendingOffer) {
      user.offersPending.push({
        offerId: offer_id,
        offerName: 'External Offer',
        reward: reward,
        status: 'completed',
        clickedAt: new Date(),
        completedAt: new Date()
      });
    } else {
      pendingOffer.status = 'completed';
      pendingOffer.completedAt = new Date();
      pendingOffer.reward = reward;
    }
    
    user.coins += reward;
    user.totalEarned += reward;
    user.offersCompleted += 1;
    
    const today = new Date().toDateString();
    if (user.lastOfferDate !== today) {
      user.streak += 1;
      user.lastOfferDate = today;
    }
    
    await user.save();
    
    console.log(`Postback: ${user.username} earned ${reward} R$ from offer ${offer_id}`);
    
    res.json({
      success: true,
      user: user.username,
      reward,
      newBalance: user.coins
    });
    
  } catch (error) {
    console.error('Postback error:', error);
    res.status(500).json({ error: 'Postback processing failed' });
  }
});

router.get('/cpagrip', async (req, res) => {
  try {
    const { subid, offer_id, payout, status } = req.query;
    
    if (status !== '1') {
      return res.send('Status not approved');
    }
    
    const user = await User.findById(subid);
    if (!user) {
      return res.status(404).send('User not found');
    }
    
    const conversionRate = 10;
    const reward = Math.floor(parseFloat(payout) * conversionRate);
    
    user.coins += reward;
    user.totalEarned += reward;
    user.offersCompleted += 1;
    
    await user.save();
    
    console.log(`CPAGrip Postback: ${user.username} +${reward} R$`);
    
    res.send('1');
    
  } catch (error) {
    console.error('CPAGrip postback error:', error);
    res.status(500).send('0');
  }
});

module.exports = router;
