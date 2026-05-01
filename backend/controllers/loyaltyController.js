import LoyaltyPoints from '../models/LoyaltyPoints.js';
import { createNotification } from '../services/notificationService.js';

export const getLoyaltyPoints = async (req, res) => {
  try {
    const userId = req.user.id;
    const loyaltyData = await LoyaltyPoints.findOne({ userId })
      .populate('transactions.orderId', '_id totalPrice status')
      .populate('transactions.subscriptionId', '_id productName frequency');

    if (!loyaltyData) {
      // Create loyalty account if it doesn't exist
      const newLoyaltyData = await LoyaltyPoints.create({
        userId,
        totalPoints: 0,
        pointsEarned: 0,
        pointsRedeemed: 0,
        transactions: [],
        tier: 'bronze'
      });
      return res.json(newLoyaltyData);
    }

    res.json(loyaltyData);
  } catch (error) {
    console.error("Get loyalty points error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const earnPoints = async (userId, points, description, orderId = null) => {
  try {
    let loyaltyData = await LoyaltyPoints.findOne({ userId });
    if (!loyaltyData) {
      loyaltyData = await LoyaltyPoints.create({
        userId,
        totalPoints: 0,
        pointsEarned: 0,
        pointsRedeemed: 0,
        transactions: [],
        tier: 'bronze'
      });
    }

    // Add transaction
    const transaction = {
      type: 'earned',
      points,
      description,
      orderId
    };

    loyaltyData.transactions.push(transaction);
    loyaltyData.totalPoints += points;
    loyaltyData.pointsEarned += points;
    loyaltyData.lastTransactionDate = new Date();
    
    // Update tier
    loyaltyData.tier = loyaltyData.calculateTier();

    await loyaltyData.save();

    // Create notification
    await createNotification(
      userId,
      `You earned ${points} loyalty points! Total: ${loyaltyData.totalPoints} points`,
      'general',
      orderId,
      {},
      null
    );

    return loyaltyData;
  } catch (error) {
    console.error("Earn points error:", error);
    throw error;
  }
};

export const redeemPoints = async (req, res) => {
  try {
    const userId = req.user.id;
    const { points, description, orderId } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({ message: "Invalid points amount" });
    }

    const loyaltyData = await LoyaltyPoints.findOne({ userId });
    if (!loyaltyData) {
      return res.status(404).json({ message: "Loyalty account not found" });
    }

    if (loyaltyData.totalPoints < points) {
      return res.status(400).json({ message: "Insufficient points" });
    }

    // Calculate redemption value (1 point = ₹1)
    const redemptionValue = points;

    // Add transaction
    const transaction = {
      type: 'redeemed',
      points,
      description,
      orderId,
      redemptionValue
    };

    loyaltyData.transactions.push(transaction);
    loyaltyData.totalPoints -= points;
    loyaltyData.pointsRedeemed += points;
    loyaltyData.lastTransactionDate = new Date();
    
    // Update tier
    loyaltyData.tier = loyaltyData.calculateTier();

    await loyaltyData.save();

    // Create notification
    await createNotification(
      userId,
      `${points} points redeemed for ₹${redemptionValue} discount`,
      'general',
      orderId,
      {},
      req.user.phone
    );

    res.json({
      message: "Points redeemed successfully",
      redemptionValue,
      loyaltyData,
      transaction
    });
  } catch (error) {
    console.error("Redeem points error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPointsHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;

    const loyaltyData = await LoyaltyPoints.findOne({ userId });
    if (!loyaltyData) {
      return res.json({ transactions: [], totalPages: 0 });
    }

    let transactions = loyaltyData.transactions;

    // Filter by type if specified
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    res.json({
      transactions: paginatedTransactions,
      totalPages: Math.ceil(transactions.length / limit),
      currentPage: parseInt(page),
      totalTransactions: transactions.length
    });
  } catch (error) {
    console.error("Get points history error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const calculatePointsForOrder = async (orderTotal) => {
  try {
    // Calculate points: 1 point for every ₹10 spent
    const points = Math.floor(orderTotal / 10);
    return points;
  } catch (error) {
    console.error("Calculate points error:", error);
    return 0;
  }
};

export const getUserTier = async (userId) => {
  try {
    const loyaltyData = await LoyaltyPoints.findOne({ userId });
    return loyaltyData ? loyaltyData.tier : 'bronze';
  } catch (error) {
    console.error("Get user tier error:", error);
    return 'bronze';
  }
};
