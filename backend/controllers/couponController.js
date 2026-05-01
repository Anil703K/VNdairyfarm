import Coupon from '../models/Coupon.js';
import { createNotification } from '../services/notificationService.js';

export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      userUsageLimit,
      endDate,
      description
    } = req.body;

    // Validate required fields
    if (!code || !type || !value || !minOrderAmount || !usageLimit || !endDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    // Create coupon
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      type,
      value,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      userUsageLimit: userUsageLimit || 1,
      endDate,
      description,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: "Coupon created successfully",
      coupon
    });
  } catch (error) {
    console.error("Create coupon error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code, userId, orderAmount } = req.body;

    if (!code || !userId || !orderAmount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }

    // Check if coupon is valid
    if (!coupon.isValid()) {
      return res.status(400).json({ message: "Coupon is expired or inactive" });
    }

    // Check if user can use this coupon
    if (!coupon.canUserUse(userId)) {
      return res.status(400).json({ message: "Coupon not applicable for this user" });
    }

    // Check minimum order amount
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ 
        message: `Minimum order amount is ₹${coupon.minOrderAmount}` 
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (orderAmount * coupon.value) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.value;
    }

    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount);

    res.json({
      message: "Coupon is valid",
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount,
        finalAmount: orderAmount - discountAmount
      }
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const applyCoupon = async (userId, code, orderAmount, orderId) => {
  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      throw new Error("Invalid coupon code");
    }

    // Check if coupon is valid
    if (!coupon.isValid()) {
      throw new Error("Coupon is expired or inactive");
    }

    // Check if user can use this coupon
    if (!coupon.canUserUse(userId)) {
      throw new Error("Coupon not applicable for this user");
    }

    // Check minimum order amount
    if (orderAmount < coupon.minOrderAmount) {
      throw new Error(`Minimum order amount is ₹${coupon.minOrderAmount}`);
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (orderAmount * coupon.value) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.value;
    }

    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount);

    // Update coupon usage
    coupon.usedCount += 1;
    await coupon.save();

    // Create notification
    await createNotification(
      userId,
      `Coupon ${code} applied! You saved ₹${discountAmount}`,
      'general',
      orderId,
      {},
      null
    );

    return {
      coupon,
      discountAmount,
      finalAmount: orderAmount - discountAmount
    };
  } catch (error) {
    console.error("Apply coupon error:", error);
    throw error;
  }
};

export const getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};

    // Filter by status
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const coupons = await Coupon.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Coupon.countDocuments(query);

    res.json({
      coupons,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error("Get all coupons error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const updates = req.body;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // Update coupon
    Object.assign(coupon, updates);
    await coupon.save();

    res.json({
      message: "Coupon updated successfully",
      coupon
    });
  } catch (error) {
    console.error("Update coupon error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    await Coupon.findByIdAndDelete(couponId);

    res.json({
      message: "Coupon deleted successfully"
    });
  } catch (error) {
    console.error("Delete coupon error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
