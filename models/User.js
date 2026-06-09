const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  robloxId: { type: String, default: null },
  avatarUrl: { type: String, default: null },
  coins: { type: Number, default: 0, min: 0 },
  totalEarned: { type: Number, default: 0 },
  offersCompleted: { type: Number, default: 0 },
  offersPending: [{
    offerId: String,
    offerName: String,
    reward: Number,
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    clickedAt: { type: Date, default: Date.now },
    completedAt: Date
  }],
  streak: { type: Number, default: 1 },
  lastOfferDate: { type: Date, default: null },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  usedCodes: [{ type: String }],
  ip: { type: String, default: null },
  userAgent: { type: String, default: null },
  lastLogin: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  withdrawals: [{
    amount: Number,
    method: { type: String, enum: ['roblox_group', 'gamepass', 'giftcard'] },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'rejected'], default: 'pending' },
    requestedAt: { type: Date, default: Date.now },
    processedAt: Date
  }],
  referralCode: { type: String, unique: true },
  referredBy: { type: String, default: null },
  referrals: { type: Number, default: 0 }
});

userSchema.pre('save', function(next) {
  this.level = Math.floor(this.totalEarned / 100) + 1;
  this.xp = this.totalEarned % 100;
  next();
});

module.exports = mongoose.model('User', userSchema);
