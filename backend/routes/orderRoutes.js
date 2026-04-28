import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  cancelOrder,
  createOrder,
  createRazorpayOrder,
  getOrderTracking,
  getOrdersByUser,
  verifyRazorpayPayment,
} from "../controllers/orderController.js";


const router = express.Router();


router.post("/orders", authMiddleware, createOrder);
router.post("/payments/razorpay/order", authMiddleware, createRazorpayOrder);
router.post("/payments/razorpay/verify", authMiddleware, verifyRazorpayPayment);
router.get("/orders/:userId", authMiddleware, getOrdersByUser);
router.get("/orders/track/:orderId", authMiddleware, getOrderTracking);
router.patch("/orders/:orderId/cancel", authMiddleware, cancelOrder);


export default router;