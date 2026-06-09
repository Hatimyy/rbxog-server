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

  // Roblox info
  robloxId: {
    type: String,
    default: null
  },
  avatarUrl: {
    type: String,
    default: null
  },

  // Balance
  coins: {
    type: Number,
    default: 0,
    min: 0
  },
  totalEarned: {
    type: Number,
    default: 0
  },

  // Stats
  offersCompleted: {
    type: Number,
    default: 0
  },
  offersPending: [{
    offerId: String,
    offerName: String,
    reward: Number,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    clickedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date
  }],

  // Streak system
  streak: {
    type: Number,
    default: 1
  },
  lastOfferDate: {
    type: Date,
    default: null
  },

  // Level system
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },

  // Promo codes
  usedCodes: [{
    type: String
  }],

  // Security
  ip: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },

  // Withdrawals
  withdrawals: [{
    amount: Number,
    method: {
      type: String,
      enum: ['roblox_group', 'gamepass', 'giftcard']
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: Date
  }],

  // Referral
  referralCode: {
    type: String,
    unique: true
  },
  referredBy: {
    type: String,
    default: null
  },
  referrals: {
    type: Number,
    default: 0
  }
});

// Update level based on XP before saving
userSchema.pre('save', function(next) {
  this.level = Math.floor(this.totalEarned / 100) + 1;
  this.xp = this.totalEarned % 100;
  next();
});

module.exports = mongoose.model('User', userSchema);