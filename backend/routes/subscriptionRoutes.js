import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  createSubscription,
  getUserSubscriptions,
  updateSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  generateSubscriptionOrders
} from '../controllers/subscriptionController.js';

const router = express.Router();

// User subscription routes
router.post('/', authMiddleware, createSubscription);
router.get('/', authMiddleware, getUserSubscriptions);
router.put('/:subscriptionId', authMiddleware, updateSubscription);
router.patch('/:subscriptionId/pause', authMiddleware, pauseSubscription);
router.patch('/:subscriptionId/resume', authMiddleware, resumeSubscription);
router.patch('/:subscriptionId/cancel', authMiddleware, cancelSubscription);

// Admin route for generating subscription orders (should be called by cron job)
router.post('/generate-orders', generateSubscriptionOrders);

export default router;
