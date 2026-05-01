import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  createCoupon,
  validateCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon
} from '../controllers/couponController.js';

const router = express.Router();

// User coupon routes
router.post('/validate', authMiddleware, validateCoupon);

// Admin coupon routes
router.post('/', authMiddleware, createCoupon);
router.get('/', authMiddleware, getAllCoupons);
router.put('/:couponId', authMiddleware, updateCoupon);
router.delete('/:couponId', authMiddleware, deleteCoupon);

export default router;
