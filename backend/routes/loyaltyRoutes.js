import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getLoyaltyPoints,
  redeemPoints,
  getPointsHistory
} from '../controllers/loyaltyController.js';

const router = express.Router();

// User loyalty routes
router.get('/', authMiddleware, getLoyaltyPoints);
router.post('/redeem', authMiddleware, redeemPoints);
router.get('/history', authMiddleware, getPointsHistory);

export default router;
