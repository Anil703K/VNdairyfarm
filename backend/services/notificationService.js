import axios from "axios";

/**
 * Normalize phone number (India)
 * Converts any format → 10 digit number
 */
export const normalizePhoneNumber = (phone) => {
  if (!phone) return "";
  return phone.replace(/\D/g, "").slice(-10);
};

/**
 * Send SMS to customer using Fast2SMS
 */
export const sendSMSNotification = async (phoneNumber, orderData) => {
  try {
    const phone = normalizePhoneNumber(phoneNumber);

    if (!phone) {
      console.log("Invalid phone number");
      return { status: "failed" };
    }

const message = `Hello ${orderData.customerName},

Thank you for ordering from VN Dairy Farm 🐄

Your order has been placed successfully.

Order ID: ${orderData._id}
Total Amount: ₹${orderData.totalPrice}

We will deliver your order soon.

Thank you!`;
    console.log("Sending SMS to:", phone);

    const response = await axios.post(
      "https://fast2sms.com/dev/bulkV2",
      {
        route: "v3",
        message: message,
        language: "english",
        numbers: phone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Fast2SMS Response:", response.data);

    if (response.data.return === true) {
      return { status: "sent" };
    } else {
      return { status: "failed", error: response.data };
    }

  } catch (error) {
    console.log("SMS Error:", error.response?.data || error.message);
    return { status: "error" };
  }
};

/**
 * Send order notification (customer)
 */
export const sendOrderNotifications = async (phoneNumber, orderData) => {
  try {
    const smsResult = await sendSMSNotification(phoneNumber, orderData);

    return {
      sms: smsResult?.status || "skipped",
    };
  } catch (err) {
    console.error("Notification error:", err);
    return {
      sms: "error",
    };
  }
};

/**
 * Send admin notification SMS
 */
export const sendAdminOrderNotification = async (orderData) => {
  try {
    const admins = (process.env.ADMIN_PHONE_NUMBERS || "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    let sentCount = 0;

    for (const admin of admins) {
      const result = await sendSMSNotification(admin, orderData);

      if (result.status === "sent") {
        sentCount++;
      }
    }

    return {
      sms: sentCount > 0 ? "sent" : "failed",
      recipients: admins.length,
    };

  } catch (err) {
    console.error("Admin SMS error:", err);
    return {
      sms: "error",
      recipients: 0,
    };
  }
};

/**
 * Schedule product reminders
 */
export const scheduleProductReminders = async (phoneNumber, orderData) => {
  try {
    const phone = normalizePhoneNumber(phoneNumber);

    if (!phone) return;

    console.log("Scheduling reminders for:", phone);

    // 🔹 Test reminder (10 seconds)
    setTimeout(async () => {
      await sendSMSNotification(phone, {
        customerName: "Reminder",
        totalPrice: orderData.totalPrice || 0,
      });
      console.log("Reminder SMS sent");
    }, 10000);

    // 🔹 Example real use (1 hour)
    // setTimeout(() => { ... }, 60 * 60 * 1000);

  } catch (error) {
    console.error("Reminder error:", error);
  }
};

