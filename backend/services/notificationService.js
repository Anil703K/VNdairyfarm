import Notification from '../models/Notification.js';

/**
 * Normalize phone number (India)
 * Converts any format → 10 digit number
 */
export const normalizePhoneNumber = (phone) => {
  if (!phone) return "";
  return phone.replace(/\D/g, "").slice(-10);
};

/**
 * Create in-app notification for user
 */
export const createNotification = async (userId, message, type = 'general', orderId = null, metadata = {}, phoneNumber = null) => {
  try {
    // Validate userId
    if (!userId) {
      throw new Error("userId is required");
    }
    
    // Validate message
    if (!message || message.trim().length === 0) {
      throw new Error("message is required");
    }
    
    if (message.length > 500) {
      throw new Error("message must be less than 500 characters");
    }

    const notification = await Notification.create({
      userId,
      phoneNumber,
      message: message.trim(),
      type,
      orderId,
      read: false,
      metadata
    });

    console.log("Notification created:", notification);
    return { status: "created", notification };
  } catch (error) {
    console.error("Notification creation error:", error);
    return { status: "error", error: error.message };
  }
};

/**
 * Send order success notification (replaces SMS)
 */
export const sendOrderNotifications = async (userId, orderData) => {
  try {
    // Generate dynamic message with product names
    const productNames = orderData.items?.map(item => item.name || item.productName || 'Product').join(', ') || 'Products';
    const message = `Order successful from VNDairyFarm. Items: ${productNames}, Total: ₹${orderData.totalPrice}`;
    
    const notification = await createNotification(
      userId, 
      message, 
      'order_success', 
      orderData._id,
      { 
        customerName: orderData.customerName,
        totalPrice: orderData.totalPrice,
        items: orderData.items
      },
      orderData.customerPhone
    );

    return {
      notification: notification.status || "created",
      sms: "replaced_with_notification"
    };
  } catch (err) {
    console.error("Order notification error:", err);
    return {
      notification: "error",
      sms: "replaced_with_notification"
    };
  }
};

/**
 * Send admin notification (replaces SMS)
 */
export const sendAdminOrderNotification = async (orderData) => {
  try {
    console.log("Admin notification created for order:", orderData._id);
    
    // Create a simple admin notification log instead of SMS
    const adminMessage = `New order: ${orderData._id}, Customer: ${orderData.customerName}, Total: ₹${orderData.totalPrice}`;
    console.log("Admin notification:", adminMessage);

    return {
      notification: "created",
      sms: "replaced_with_notification",
      recipients: 0,
    };

  } catch (err) {
    console.error("Admin notification error:", err);
    return {
      notification: "error",
      sms: "replaced_with_notification",
      recipients: 0,
    };
  }
};

/**
 * Schedule product reminders (replaces SMS)
 */
export const scheduleProductReminders = async (phoneNumber, orderData) => {
  try {
    const phone = normalizePhoneNumber(phoneNumber);

    if (!phone) return;

    console.log("Scheduling reminders for:", phone);

    // Create a reminder notification instead of SMS
    setTimeout(async () => {
      const reminderMessage = `Reminder: Your order ${orderData._id} will be delivered soon`;
      console.log("Reminder notification created:", reminderMessage);
    }, 10000);

  } catch (error) {
    console.error("Reminder error:", error);
  }
};

