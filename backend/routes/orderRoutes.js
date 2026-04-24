import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createOrder, getOrdersByUser } from "../controllers/orderController.js";


const router = express.Router();


router.post("/orders", authMiddleware, createOrder);
router.get("/orders/:userId", authMiddleware, getOrdersByUser);


export default router;