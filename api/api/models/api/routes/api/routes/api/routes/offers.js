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

const OFFERS = [
  { id: 'survey_1', name: 'Gaming Survey', reward: 20, time: '2 min' },
  { id: 'app_1', name: 'Try Mobile Game', reward: 30, time: '5 min' },
  { id: 'trial_1', name: 'Premium Trial', reward: 50, time: '10 min' },
  { id: 'install_1', name: 'Install App', reward: 75, time: '15 min' }
];

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ success: true, offers: OFFERS });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/click', auth, async (req, res) => {
  try {
    const { offerId } = req.body;
    const user = await User.findById(req.userId);
    const offer = OFFERS.find(o => o.id === offerId);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    
    user.offersPending.push({ offerId: offer.id, offerName: offer.name, reward: offer.reward, status: 'pending', clickedAt: new Date() });
    await user.save();
    
    res.json({ success: true, cpaUrl: `https://your-cpa.com/offer/${offerId}?subid=${user._id}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
