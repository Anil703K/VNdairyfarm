import Notification from "../models/Notification.js";

export const createNotification = async (req, res) => {
  try {
    const { userId, message, type, orderId, metadata } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ message: "userId and message are required" });
    }

    const notification = await Notification.create({
      userId,
      message,
      type: type || 'general',
      orderId: orderId || null,
      metadata: metadata || {},
      read: false
    });

    res.status(201).json({
      message: "Notification created successfully",
      notification
    });
  } catch (error) {
    console.error("Notification creation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Ensure user can only access their own notifications
    if (req.user.id !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 notifications

    res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    if (!notificationId) {
      return res.status(400).json({ message: "notificationId is required" });
    }

    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Ensure user can only mark their own notifications
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    notification.read = true;
    await notification.save();

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
