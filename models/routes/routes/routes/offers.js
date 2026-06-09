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

const OFFERS = [
  { id: 'survey_1', name: 'Gaming Survey', reward: 20, difficulty: 'easy', time: '2 min', icon: '📋' },
  { id: 'app_1', name: 'Try Mobile Game', reward: 30, difficulty: 'medium', time: '5 min', icon: '🎮' },
  { id: 'trial_1', name: 'Premium Trial', reward: 50, difficulty: 'hard', time: '10 min', icon: '🎁' },
  { id: 'install_1', name: 'Install & Keep App', reward: 75, difficulty: 'expert', time: '15 min', icon: '📱' }
];

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const activeOffers = user.offersPending.filter(o => o.status === 'pending');
    
    res.json({
      success: true,
      offers: OFFERS.map(o => ({
        ...o,
        cpaUrl: `https://your-cpa-network.com/offer/${o.id}?user=${user.username}&subid=${user._id}`
      })),
      activeOffers: activeOffers.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get offers' });
  }
});

router.post('/click', authMiddleware, async (req, res) => {
  try {
    const { offerId } = req.body;
    const user = await User.findById(req.userId);
    
    const offer = OFFERS.find(o => o.id === offerId);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    
    user.offersPending.push({
      offerId: offer.id,
      offerName: offer.name,
      reward: offer.reward,
      status: 'pending',
      clickedAt: new Date()
    });
    
    await user.save();
    
    const cpaUrl = `https://your-cpa-network.com/offer/${offerId}?subid=${user._id}&user=${encodeURIComponent(user.username)}`;
    
    res.json({
      success: true,
      cpaUrl,
      offer: {
        id: offer.id,
        name: offer.name,
        reward: offer.reward
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to track click' });
  }
});

router.post('/complete', async (req, res) => {
  try {
    const { userId, offerId, status } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const pendingOffer = user.offersPending.find(
      o => o.status === 'pending' && o.offerId === offerId
    );
    
    if (!pendingOffer) {
      return res.status(400).json({ error: 'No pending offer found' });
    }
    
    if (status === 'completed') {
      pendingOffer.status = 'completed';
      pendingOffer.completedAt = new Date();
      
      user.coins += pendingOffer.reward;
      user.totalEarned += pendingOffer.reward;
      user.offersCompleted += 1;
      
      const today = new Date().toDateString();
      if (user.lastOfferDate !== today) {
        user.streak += 1;
        user.lastOfferDate = today;
      }
      
      await user.save();
      
      res.json({
        success: true,
        reward: pendingOffer.reward,
        newBalance: user.coins
      });
    } else {
      pendingOffer.status = 'failed';
      await user.save();
      res.json({ success: true, status: 'failed' });
    }
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete offer' });
  }
});

module.exports = router;
