import Order from "../models/Order.js";
import User from "../models/User.js";

import {
	sendOrderNotifications,
	sendAdminOrderNotification,
	scheduleProductReminders,
	normalizePhoneNumber,
} from "../services/notificationService.js";
const otpStore = {};

export const createOrder = async (req, res) => {
try {
const userId = req.user && req.user.id;
if (!userId) return res.status(401).json({ message: "Not authorized" });

// Get user details for phone number
const user = await User.findById(userId);
if (!user) return res.status(404).json({ message: "User not found" });

// Accept either { items: [...] } or single-item fields (productId/productName/quantity/price)
let { items, customerName, customerPhone, deliveryAddress } = req.body;

// compatibility: if items not provided, try single item payload
if (!items) {
	const { productId, productName, quantity = 1, price } = req.body;
	if (productId) {
		items = [{ productId, productName, quantity, price }];
	}
}

if (!items || !Array.isArray(items) || items.length === 0) {
	return res.status(400).json({ message: "Order must contain at least one item" });
}

// Use provided customer details or fall back to user info
const finalCustomerName = customerName || user.name || "Customer";
const finalCustomerPhone = customerPhone || user.phone;
const finalDeliveryAddress = deliveryAddress || user.address || "";
const normalizedCustomerPhone = normalizePhoneNumber(finalCustomerPhone);

// compute total server-side
const totalPrice = items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 0)), 0);

const normalizedItems = items.map((it) => ({
productId: it.productId || "",
name: it.productName || it.name || "Milk Product",
quantity: Number(it.quantity || 1),
price: Number(it.price || 0),
}));

// Create order with all data
const order = await Order.create({
user: userId,
items: normalizedItems,
totalPrice,
customerName: finalCustomerName,
customerPhone: finalCustomerPhone,
deliveryAddress: finalDeliveryAddress,
});

let customerNotificationStatus = { sms: "skipped" };
let adminNotificationStatus = { sms: "skipped", recipients: 0 };

if (normalizedCustomerPhone) {
	customerNotificationStatus = await sendOrderNotifications(normalizedCustomerPhone, {
		_id: order._id,
		customerName: finalCustomerName,
		items: normalizedItems,
		totalPrice,
	}).catch((err) => {
		console.error("Notification error:", err);
		return { sms: "error" };
	});
	
	scheduleProductReminders(normalizedCustomerPhone, {
		_id: order._id,
		items: normalizedItems,
	}).catch((err) => console.error("Reminder scheduling error:", err));
}

adminNotificationStatus = await sendAdminOrderNotification({
	_id: order._id,
	customerName: finalCustomerName,
	customerPhone: normalizedCustomerPhone || "Not provided",
	deliveryAddress: finalDeliveryAddress,
	items: normalizedItems,
	totalPrice,
}).catch((err) => {
	console.error("Admin notification error:", err);
	return { sms: "error", recipients: 0 };
});

return res.status(200).json({
	...order.toObject(),
	message: "Order placed successfully",
	notificationStatus: {
		customer: customerNotificationStatus,
		admin: adminNotificationStatus,
	},
});
} catch (err) {
console.error(err);
return res.status(500).json({ message: "Server error" });
}
};


export const getOrdersByUser = async (req, res) => {
try {
const userId = req.params.userId;
if (!userId) return res.status(400).json({ message: "Missing userId" });


// ensure only owner can view
if (req.user.id !== userId) {
return res.status(403).json({ message: "Forbidden" });
}


const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
return res.json(orders);
} catch (err) {
console.error(err);
return res.status(500).json({ message: "Server error" });
}
};
