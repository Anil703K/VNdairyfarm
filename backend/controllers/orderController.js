import Order from "../models/Order.js";
import User from "../models/User.js";
import crypto from "crypto";
import Razorpay from "razorpay";

import {
	sendOrderNotifications,
	sendAdminOrderNotification,
	scheduleProductReminders,
	normalizePhoneNumber,
} from "../services/notificationService.js";
const otpStore = {};
const getRazorpayClient = () =>
	new Razorpay({
		key_id: process.env.RAZORPAY_KEY_ID || "",
		key_secret: process.env.RAZORPAY_KEY_SECRET || "",
	});

const buildPaymentDetails = ({ paymentMethod, paymentStatus, paymentReference }) => {
const normalizedMethod = ["cod", "upi", "card"].includes(String(paymentMethod || "").toLowerCase())
	? String(paymentMethod).toLowerCase()
	: "cod";
const isDigitalMethod = normalizedMethod === "upi" || normalizedMethod === "card";
const finalPaymentStatus = isDigitalMethod
	? (paymentStatus === "failed" ? "failed" : "paid")
	: "pending";
return {
	paymentMethod: normalizedMethod,
	paymentStatus: finalPaymentStatus,
	paymentReference:
		paymentReference && String(paymentReference).trim()
			? String(paymentReference).trim()
			: isDigitalMethod
			? `TXN-${Date.now()}`
			: "",
};
};

export const createOrder = async (req, res) => {
try {
const userId = req.user && req.user.id;
if (!userId) return res.status(401).json({ message: "Not authorized" });

// Get user details for phone number
const user = await User.findById(userId);
if (!user) return res.status(404).json({ message: "User not found" });

// Accept either { items: [...] } or single-item fields (productId/productName/quantity/price)
let { items, customerName, customerPhone, deliveryAddress, paymentMethod, paymentStatus, paymentReference } = req.body;

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
unit: it.unit || 'L',
size: it.size || 1,
price: Number(it.price || 0),
basePrice: Number(it.price || 0) * Number(it.quantity || 1),
}));

const paymentDetails = buildPaymentDetails({ paymentMethod, paymentStatus, paymentReference });

// Set default delivery date (tomorrow) and time (morning)
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(9, 0, 0, 0); // Default to 9 AM

// Create order with all required fields
const order = await Order.create({
user: userId,
items: normalizedItems,
totalPrice,
basePrice: totalPrice,
finalPrice: totalPrice,
discountAmount: 0,
status: paymentDetails.paymentMethod === "cod" || paymentDetails.paymentStatus === "paid" ? "confirmed" : "pending",
customerName: finalCustomerName,
customerPhone: finalCustomerPhone,
deliveryAddress: finalDeliveryAddress,
deliveryDate: tomorrow,
deliveryTime: "morning",
paymentMethod: paymentDetails.paymentMethod,
paymentStatus: paymentDetails.paymentStatus,
paymentReference: paymentDetails.paymentReference,
});

let customerNotificationStatus = { sms: "skipped" };
let adminNotificationStatus = { sms: "skipped", recipients: 0 };

if (normalizedCustomerPhone) {
	customerNotificationStatus = await sendOrderNotifications(userId, {
		_id: order._id,
		customerName: finalCustomerName,
		customerPhone: normalizedCustomerPhone,
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

export const getOrderTracking = async (req, res) => {
try {
const { orderId } = req.params;
if (!orderId) return res.status(400).json({ message: "Missing orderId" });

const order = await Order.findById(orderId);
if (!order) return res.status(404).json({ message: "Order not found" });
if (String(order.user) !== String(req.user.id)) {
	return res.status(403).json({ message: "Forbidden" });
}

const statuses = ["pending", "confirmed", "packed", "out_for_delivery", "delivered"];
let currentStatus = statuses.includes(order.status) ? order.status : "confirmed";
if (order.paymentStatus === "paid" && currentStatus !== "delivered") {
	const elapsedMinutes = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
	if (elapsedMinutes >= 6) currentStatus = "delivered";
	else if (elapsedMinutes >= 4) currentStatus = "out_for_delivery";
	else if (elapsedMinutes >= 2) currentStatus = "packed";
	else currentStatus = "confirmed";
}
const currentIndex = statuses.indexOf(currentStatus);
const timeline = statuses.map((status, index) => ({
	status,
	done: index <= currentIndex,
	active: index === currentIndex,
}));

return res.json({
	orderId: order._id,
	status: currentStatus,
	paymentMethod: order.paymentMethod || "cod",
	paymentStatus: order.paymentStatus || "pending",
	paymentReference: order.paymentReference || "",
	totalPrice: order.totalPrice,
	deliveryAddress: order.deliveryAddress || "",
	items: order.items || [],
	createdAt: order.createdAt,
	timeline,
});
} catch (err) {
console.error(err);
return res.status(500).json({ message: "Server error" });
}
};

export const cancelOrder = async (req, res) => {
try {
	const { orderId } = req.params;
	if (!orderId) return res.status(400).json({ message: "Missing orderId" });

	const order = await Order.findById(orderId);
	if (!order) return res.status(404).json({ message: "Order not found" });
	if (String(order.user) !== String(req.user.id)) {
		return res.status(403).json({ message: "Forbidden" });
	}

	const nonCancelableStatuses = ["delivered", "cancelled", "out_for_delivery"];
	if (nonCancelableStatuses.includes(String(order.status))) {
		return res.status(400).json({ message: "This order can no longer be cancelled" });
	}

	order.status = "cancelled";
	await order.save();
	return res.json({ message: "Order cancelled successfully", order });
} catch (err) {
	console.error(err);
	return res.status(500).json({ message: "Server error" });
}
};

export const createRazorpayOrder = async (req, res) => {
try {
	const { amount } = req.body || {};
	const amountInPaise = Math.round(Number(amount || 0) * 100);
	if (!amountInPaise || amountInPaise < 100) {
		return res.status(400).json({ message: "Invalid payment amount" });
	}
	if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
		return res.status(400).json({ message: "Razorpay keys are missing in backend env" });
	}
	const razorpay = getRazorpayClient();

	const rpOrder = await razorpay.orders.create({
		amount: amountInPaise,
		currency: "INR",
		receipt: `rcpt_${Date.now()}`,
		payment_capture: 1,
	});

	return res.json({
		key: process.env.RAZORPAY_KEY_ID,
		orderId: rpOrder.id,
		amount: rpOrder.amount,
		currency: rpOrder.currency,
	});
} catch (err) {
	console.error(err);
	return res.status(500).json({ message: "Unable to create Razorpay order" });
}
};

export const verifyRazorpayPayment = async (req, res) => {
try {
	const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
	if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
		return res.status(400).json({ message: "Missing Razorpay verification fields" });
	}
	if (!process.env.RAZORPAY_KEY_SECRET) {
		return res.status(400).json({ message: "Razorpay secret is missing in backend env" });
	}

	const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
	hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
	const generatedSignature = hmac.digest("hex");
	const isValid = generatedSignature === razorpay_signature;
	if (!isValid) {
		return res.status(400).json({ message: "Payment signature verification failed" });
	}

	return res.json({
		verified: true,
		paymentReference: razorpay_payment_id,
	});
} catch (err) {
	console.error(err);
	return res.status(500).json({ message: "Payment verification failed" });
}
};

export const createCartOrder = async (req, res) => {
	try {
		const userId = req.user && req.user.id;
		if (!userId) return res.status(401).json({ message: "Not authorized" });

		const { items, checkout } = req.body || {};
		if (!items || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ message: "Cart items are required" });
		}

		// Calculate total price
		const totalPrice = items.reduce((sum, item) => {
			const price = Number(item.price || 0);
			const quantity = Number(item.quantity || 1);
			return sum + (price * quantity);
		}, 0);

		if (totalPrice <= 0) {
			return res.status(400).json({ message: "Invalid total price" });
		}

		// Get user details for phone number
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const normalizedCustomerPhone = normalizePhoneNumber(user.phone);
		const finalCustomerName = user.name || "Customer";

		// Set default delivery date (tomorrow) and time (morning)
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(9, 0, 0, 0); // Default to 9 AM

		// Create order
		const order = await Order.create({
			user: userId,
			items: items.map(item => ({
				productId: item.productId || item._id || "",
				name: item.name || item.productName || "Product",
				quantity: Number(item.quantity || 1),
				unit: item.unit || 'L',
				size: item.size || 1,
				price: Number(item.price || 0),
				basePrice: Number(item.price || 0) * Number(item.quantity || 1),
			})),
			totalPrice,
			basePrice: totalPrice,
			finalPrice: totalPrice,
			discountAmount: 0,
			customerName: finalCustomerName,
			customerPhone: normalizedCustomerPhone,
			deliveryAddress: user.address || "",
			deliveryDate: tomorrow,
			deliveryTime: "morning",
			...buildPaymentDetails(checkout || {}),
		});

		// Create notification
		let customerNotificationStatus = { sms: "skipped" };
		let adminNotificationStatus = { sms: "skipped", recipients: 0 };

		if (normalizedCustomerPhone) {
			customerNotificationStatus = await sendOrderNotifications(userId, {
				_id: order._id,
				customerName: finalCustomerName,
				customerPhone: normalizedCustomerPhone,
				items: items.map(item => ({
					name: item.name || item.productName || "Product",
					quantity: item.quantity || 1
				})),
				totalPrice,
			}).catch((err) => {
				console.error("Notification error:", err);
				return { sms: "error" };
			});
		}

		adminNotificationStatus = await sendAdminOrderNotification({
			_id: order._id,
			customerName: finalCustomerName,
			totalPrice,
		}).catch((err) => {
			console.error("Admin notification error:", err);
			return { sms: "error", recipients: 0 };
		});

		return res.status(201).json({
			message: "Order created successfully",
			order,
			notifications: {
				customer: customerNotificationStatus,
				admin: adminNotificationStatus,
			},
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: "Server error" });
	}
};
