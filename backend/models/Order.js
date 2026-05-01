import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and string
    ref: "Product",
    required: false 
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, enum: ['ml', 'L'], default: 'L' },
  size: { type: Number, default: 1 }, // 500ml = 0.5, 1L = 1, 2L = 2
  price: { type: Number, required: true, min: 0 },
  basePrice: { type: Number, required: true, min: 0 },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [itemSchema],
  totalPrice: { type: Number, required: true },
  basePrice: { type: Number, required: true }, // Before discounts
  discountAmount: { type: Number, default: 0 },
  finalPrice: { type: Number, required: true }, // After discounts
  
  // Order Status Tracking
  status: { 
    type: String, 
    enum: ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"],
    default: "pending" 
  },
  statusHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String, maxlength: 200 }
  }],
  
  // Delivery Information
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  deliveryTime: { type: String, enum: ["morning", "evening"], required: true },
  deliveryDate: { type: Date, required: true },
  deliveryInstructions: { type: String, maxlength: 300 },
  
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ["cod", "upi", "card", "wallet"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },
  paymentReference: { type: String },
  paidAmount: { type: Number, default: 0 },
  
  // Business Features
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
  isSubscriptionOrder: { type: Boolean, default: false },
  couponCode: { type: String },
  couponDiscount: { type: Number, default: 0 },
  loyaltyPointsEarned: { type: Number, default: 0 },
  loyaltyPointsUsed: { type: Number, default: 0 },
  walletAmountUsed: { type: Number, default: 0 },
  
  // Order Type
  orderType: {
    type: String,
    enum: ["regular", "subscription", "repeat"],
    default: "regular"
  },
  
  // Priority and Special Instructions
  priority: { type: String, enum: ["normal", "high", "urgent"], default: "normal" },
  specialInstructions: { type: String, maxlength: 500 },
  
  // Notification Status
  notificationStatus: {
    sms: { type: String, default: "pending" },
    whatsapp: { type: String, default: "pending" },
    email: { type: String, default: "pending" },
  },
  
  // Delivery Partner Information
  deliveryPartner: { type: String },
  estimatedDeliveryTime: { type: Date },
  actualDeliveryTime: { type: Date },
  
  // Feedback and Rating
  customerRating: { type: Number, min: 1, max: 5 },
  customerFeedback: { type: String, maxlength: 500 },
  
  // Admin Notes
  adminNotes: { type: String, maxlength: 500 }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for remaining amount to be paid (for COD orders)
orderSchema.virtual('remainingAmount').get(function() {
  if (this.paymentMethod === 'cod' && this.paymentStatus !== 'paid') {
    return this.finalPrice - this.paidAmount;
  }
  return 0;
});

// Virtual for order age in hours
orderSchema.virtual('orderAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    notes
  });
  
  if (newStatus === 'delivered') {
    this.actualDeliveryTime = new Date();
    this.paymentStatus = 'paid';
    this.paidAmount = this.finalPrice;
  }
  
  return this.save();
};

// Method to apply discount
orderSchema.methods.applyDiscount = function(discountAmount) {
  this.discountAmount = discountAmount;
  this.finalPrice = this.basePrice - discountAmount;
  return this.save();
};

// Indexes for efficient queries
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ deliveryDate: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ subscriptionId: 1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;