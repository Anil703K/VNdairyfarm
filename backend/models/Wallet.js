import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
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
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: false
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'cod', 'wallet'],
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  }
}, {
  timestamps: true
});

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  transactions: [walletTransactionSchema],
  totalCredits: {
    type: Number,
    default: 0
  },
  totalDebits: {
    type: Number,
    default: 0
  },
  lastTransactionDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
walletSchema.index({ userId: 1 });
walletSchema.index({ 'transactions.createdAt': -1 });

export default mongoose.model('Wallet', walletSchema);
