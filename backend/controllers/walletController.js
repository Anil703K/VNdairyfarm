import Wallet from '../models/Wallet.js';
import { createNotification } from '../services/notificationService.js';

export const getWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await Wallet.findOne({ userId })
      .populate('transactions.orderId', '_id totalPrice status')
      .populate('transactions.subscriptionId', '_id productName frequency');

    if (!wallet) {
      // Create wallet if it doesn't exist
      const newWallet = await Wallet.create({
        userId,
        balance: 0,
        transactions: [],
        totalCredits: 0,
        totalDebits: 0
      });
      return res.json(newWallet);
    }

    res.json(wallet);
  } catch (error) {
    console.error("Get wallet error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addMoneyToWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, paymentMethod, paymentReference } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({
        userId,
        balance: 0,
        transactions: [],
        totalCredits: 0,
        totalDebits: 0
      });
    }

    // Add transaction
    const transaction = {
      type: 'credit',
      amount,
      description: `Wallet top-up of ₹${amount}`,
      paymentMethod,
      paymentReference,
      status: 'completed'
    };

    wallet.transactions.push(transaction);
    wallet.balance += amount;
    wallet.totalCredits += amount;
    wallet.lastTransactionDate = new Date();

    await wallet.save();

    // Create notification
    await createNotification(
      userId,
      `₹${amount} added to your wallet successfully`,
      'general',
      null,
      {},
      req.user.phone
    );

    res.json({
      message: "Money added to wallet successfully",
      wallet,
      transaction
    });
  } catch (error) {
    console.error("Add money to wallet error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deductFromWallet = async (userId, amount, description, orderId = null, subscriptionId = null) => {
  try {
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (wallet.balance < amount) {
      throw new Error("Insufficient wallet balance");
    }

    // Add transaction
    const transaction = {
      type: 'debit',
      amount,
      description,
      orderId,
      subscriptionId,
      status: 'completed'
    };

    wallet.transactions.push(transaction);
    wallet.balance -= amount;
    wallet.totalDebits += amount;
    wallet.lastTransactionDate = new Date();

    await wallet.save();

    // Create notification
    await createNotification(
      userId,
      `₹${amount} deducted from wallet for ${description}`,
      'general',
      orderId || subscriptionId,
      {},
      null
    );

    return wallet;
  } catch (error) {
    console.error("Deduct from wallet error:", error);
    throw error;
  }
};

export const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.json({ transactions: [], totalPages: 0 });
    }

    let transactions = wallet.transactions;

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
    console.error("Get transaction history error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getWalletBalance = async (userId) => {
  try {
    const wallet = await Wallet.findOne({ userId });
    return wallet ? wallet.balance : 0;
  } catch (error) {
    console.error("Get wallet balance error:", error);
    return 0;
  }
};
