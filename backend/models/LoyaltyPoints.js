import mongoose from 'mongoose';

const loyaltyTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['earned', 'redeemed'],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 200
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  redemptionValue: {
    type: Number,
    required: false,
    min: 0
  }
}, {
  timestamps: true
});

const loyaltyPointsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  totalPoints: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  pointsRedeemed: {
    type: Number,
    default: 0
  },
  transactions: [loyaltyTransactionSchema],
  lastTransactionDate: {
    type: Date
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
loyaltyPointsSchema.index({ userId: 1 });
loyaltyPointsSchema.index({ 'transactions.createdAt': -1 });

// Calculate tier based on total points
loyaltyPointsSchema.methods.calculateTier = function() {
  if (this.totalPoints >= 10000) return 'platinum';
  if (this.totalPoints >= 5000) return 'gold';
  if (this.totalPoints >= 2000) return 'silver';
  return 'bronze';
};

export default mongoose.model('LoyaltyPoints', loyaltyPointsSchema);
