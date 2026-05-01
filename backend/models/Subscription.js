import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    enum: ['ml', 'L'],
    default: 'L'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  frequency: {
    type: String,
    enum: ['daily', 'alternate', 'weekly'],
    required: true
  },
  deliveryTime: {
    type: String,
    enum: ['morning', 'evening'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled'],
    default: 'active'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  nextDeliveryDate: {
    type: Date,
    required: true
  },
  lastDeliveryDate: {
    type: Date
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  pausedUntil: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ nextDeliveryDate: 1, status: 1 });
subscriptionSchema.index({ frequency: 1, deliveryTime: 1 });

export default mongoose.model('Subscription', subscriptionSchema);
