import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createNotification, getUserNotifications } from "../controllers/notificationController.js";

const router = express.Router();

// Create notification
router.post("/", authMiddleware, createNotification);

// Get user notifications
router.get("/user/:userId", authMiddleware, getUserNotifications);

// Mark notification as read
router.patch("/:notificationId/read", authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.params;
    // This would need to be implemented in the controller
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
