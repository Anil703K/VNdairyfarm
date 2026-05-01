import Subscription from '../models/Subscription.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { createNotification } from '../services/notificationService.js';

export const createSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity, unit, frequency, deliveryTime, deliveryAddress, notes } = req.body;

    // Validate required fields
    if (!productId || !quantity || !frequency || !deliveryTime || !deliveryAddress) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Calculate next delivery date based on frequency
    const startDate = new Date();
    let nextDeliveryDate = new Date(startDate);
    
    switch (frequency) {
      case 'daily':
        nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1);
        break;
      case 'alternate':
        nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 2);
        break;
      case 'weekly':
        nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7);
        break;
    }

    // Get user details for phone number
    const user = await req.user.populate('phone name');
    
    // Create subscription
    const subscription = await Subscription.create({
      userId,
      productId,
      productName: product.name,
      quantity,
      unit: unit || 'L',
      price: product.price,
      frequency,
      deliveryTime,
      deliveryAddress,
      customerPhone: user.phone,
      nextDeliveryDate,
      notes
    });

    // Create notification
    await createNotification(
      userId,
      `Subscription created for ${product.name} - ${frequency} delivery`,
      'general',
      null,
      {},
      user.phone
    );

    res.status(201).json({
      message: "Subscription created successfully",
      subscription
    });
  } catch (error) {
    console.error("Subscription creation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptions = await Subscription.find({ userId })
      .populate('productId', 'name price')
      .sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (error) {
    console.error("Get subscriptions error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    if (subscription.userId.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Update subscription
    Object.assign(subscription, updates);
    await subscription.save();

    // Create notification
    await createNotification(
      userId,
      `Subscription updated for ${subscription.productName}`,
      'general',
      subscriptionId,
      {},
      subscription.customerPhone
    );

    res.json({
      message: "Subscription updated successfully",
      subscription
    });
  } catch (error) {
    console.error("Update subscription error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const pauseSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.id;
    const { pauseUntil } = req.body;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    if (subscription.userId.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    subscription.status = 'paused';
    subscription.pausedUntil = pauseUntil;
    await subscription.save();

    // Create notification
    await createNotification(
      userId,
      `Subscription paused for ${subscription.productName}`,
      'general',
      subscriptionId,
      {},
      subscription.customerPhone
    );

    res.json({
      message: "Subscription paused successfully",
      subscription
    });
  } catch (error) {
    console.error("Pause subscription error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const resumeSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.id;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    if (subscription.userId.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    subscription.status = 'active';
    subscription.pausedUntil = null;
    
    // Calculate next delivery date
    const nextDeliveryDate = new Date();
    switch (subscription.frequency) {
      case 'daily':
        nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1);
        break;
      case 'alternate':
        nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 2);
        break;
      case 'weekly':
        nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7);
        break;
    }
    subscription.nextDeliveryDate = nextDeliveryDate;
    
    await subscription.save();

    // Create notification
    await createNotification(
      userId,
      `Subscription resumed for ${subscription.productName}`,
      'general',
      subscriptionId,
      {},
      subscription.customerPhone
    );

    res.json({
      message: "Subscription resumed successfully",
      subscription
    });
  } catch (error) {
    console.error("Resume subscription error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.id;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    if (subscription.userId.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    subscription.status = 'cancelled';
    await subscription.save();

    // Create notification
    await createNotification(
      userId,
      `Subscription cancelled for ${subscription.productName}`,
      'general',
      subscriptionId,
      {},
      subscription.customerPhone
    );

    res.json({
      message: "Subscription cancelled successfully",
      subscription
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const generateSubscriptionOrders = async (req, res) => {
  try {
    // This function should be called by a cron job daily
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find active subscriptions for tomorrow
    const subscriptions = await Subscription.find({
      status: 'active',
      nextDeliveryDate: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('userId');

    const generatedOrders = [];

    for (const subscription of subscriptions) {
      try {
        // Create order from subscription
        const order = await Order.create({
          user: subscription.userId._id,
          items: [{
            productId: subscription.productId,
            name: subscription.productName,
            quantity: subscription.quantity,
            unit: subscription.unit,
            size: subscription.unit === 'L' ? 1 : 0.5,
            price: subscription.price,
            basePrice: subscription.price * subscription.quantity
          }],
          basePrice: subscription.price * subscription.quantity,
          finalPrice: subscription.price * subscription.quantity,
          customerName: subscription.userId.name,
          customerPhone: subscription.customerPhone,
          deliveryAddress: subscription.deliveryAddress,
          deliveryTime: subscription.deliveryTime,
          deliveryDate: subscription.nextDeliveryDate,
          paymentMethod: 'cod',
          orderType: 'subscription',
          isSubscriptionOrder: true,
          subscriptionId: subscription._id,
          status: 'confirmed'
        });

        // Update subscription
        subscription.lastDeliveryDate = subscription.nextDeliveryDate;
        subscription.totalOrders += 1;
        subscription.totalAmount += subscription.price * subscription.quantity;

        // Calculate next delivery date
        let nextDeliveryDate = new Date(subscription.nextDeliveryDate);
        switch (subscription.frequency) {
          case 'daily':
            nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1);
            break;
          case 'alternate':
            nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 2);
            break;
          case 'weekly':
            nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7);
            break;
        }
        subscription.nextDeliveryDate = nextDeliveryDate;

        await subscription.save();

        // Create notification
        await createNotification(
          subscription.userId._id,
          `Your milk will be delivered tomorrow ${subscription.deliveryTime}`,
          'general',
          order._id,
          {},
          subscription.customerPhone
        );

        generatedOrders.push(order);
      } catch (error) {
        console.error(`Error generating order for subscription ${subscription._id}:`, error);
      }
    }

    res.json({
      message: `Generated ${generatedOrders.length} subscription orders`,
      orders: generatedOrders
    });
  } catch (error) {
    console.error("Generate subscription orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
