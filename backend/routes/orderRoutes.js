import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  cancelOrder,
  createOrder,
  createCartOrder,
  createRazorpayOrder,
  getOrderTracking,
  getOrdersByUser,
  verifyRazorpayPayment,
} from "../controllers/orderController.js";


const router = express.Router();


router.post("/", authMiddleware, createOrder);
router.post("/cart", authMiddleware, createCartOrder);
router.post("/payments/razorpay/order", authMiddleware, createRazorpayOrder);
router.post("/payments/razorpay/verify", authMiddleware, verifyRazorpayPayment);
router.get("/track/:orderId", authMiddleware, getOrderTracking);
router.get("/:userId", authMiddleware, getOrdersByUser);
router.patch("/:orderId/cancel", authMiddleware, cancelOrder);


export default router;