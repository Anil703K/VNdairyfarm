import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getWallet,
  addMoneyToWallet,
  getTransactionHistory
} from '../controllers/walletController.js';

const router = express.Router();

// User wallet routes
router.get('/', authMiddleware, getWallet);
router.post('/add-money', authMiddleware, addMoneyToWallet);
router.get('/transactions', authMiddleware, getTransactionHistory);

export default router;
