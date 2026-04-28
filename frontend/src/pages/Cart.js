import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCartOrder, createRazorpayPaymentOrder, verifyRazorpayPayment } from "../services/apiClient";
import { useCart } from "../context/CartContext";
import "./Cart.css";

const Cart = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    cartTotal,
    updateCartQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");
  const [checkout, setCheckout] = useState({
    customerName: "",
    customerPhone: "",
    deliveryAddress: "",
    paymentMethod: "cod",
    cardNumber: "",
    cardHolder: "",
    upiId: "",
  });

  const handleCheckoutFieldChange = (field, value) => {
    setCheckout((prev) => ({ ...prev, [field]: value }));
  };

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const validateCheckout = () => {
    if (!checkout.customerName.trim()) return "Please enter your name";
    if (!checkout.customerPhone.trim() || checkout.customerPhone.trim().length < 10) {
      return "Please enter a valid phone number";
    }
    if (!checkout.deliveryAddress.trim() || checkout.deliveryAddress.trim().length < 10) {
      return "Please enter a complete delivery address";
    }
    if (checkout.paymentMethod === "upi" && !checkout.upiId.trim()) {
      return "Please enter your UPI ID";
    }
    if (checkout.paymentMethod === "card") {
      if (!checkout.cardHolder.trim()) return "Please enter card holder name";
      if (checkout.cardNumber.replace(/\s/g, "").length < 12) return "Please enter a valid card number";
    }
    return "";
  };

  const handleCheckout = async () => {
    const validationError = validateCheckout();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setPlacing(true);
    setMessage("");
    try {
      let paymentReference = "";
      let paymentStatus = "pending";

      if (checkout.paymentMethod !== "cod") {
        const scriptReady = await loadRazorpayScript();
        if (!scriptReady) {
          throw new Error("Unable to load Razorpay checkout. Check internet and try again.");
        }

        const rpOrder = await createRazorpayPaymentOrder(cartTotal);
        paymentReference = await new Promise((resolve, reject) => {
          const razorpay = new window.Razorpay({
            key: rpOrder.key,
            amount: rpOrder.amount,
            currency: rpOrder.currency || "INR",
            name: "VN Dairy",
            description: "Milk order payment",
            order_id: rpOrder.orderId,
            prefill: {
              name: checkout.customerName.trim(),
              contact: checkout.customerPhone.trim(),
            },
            notes: {
              deliveryAddress: checkout.deliveryAddress.trim(),
            },
            handler: async (response) => {
              try {
                const verify = await verifyRazorpayPayment(response);
                if (!verify.verified) {
                  reject(new Error("Payment verification failed"));
                  return;
                }
                resolve(verify.paymentReference || response.razorpay_payment_id);
              } catch (err) {
                reject(new Error(err.message || "Payment verification failed"));
              }
            },
            modal: {
              ondismiss: () => reject(new Error("Payment was cancelled")),
            },
          });
          razorpay.open();
        });
        paymentStatus = "paid";
      }

      const order = await createCartOrder({
        items: cartItems,
        checkout: {
          customerName: checkout.customerName.trim(),
          customerPhone: checkout.customerPhone.trim(),
          deliveryAddress: checkout.deliveryAddress.trim(),
          paymentMethod: checkout.paymentMethod,
          paymentStatus,
          paymentReference,
        },
      });
      clearCart();
      setMessage("Order placed successfully.");
      setTimeout(() => navigate(`/order-tracking/${order._id}`), 700);
    } catch (error) {
      setMessage(error.message || "Could not place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="cart-page">
      <h1>Your Cart</h1>
      {!cartItems.length && <p className="cart-empty">Your cart is empty.</p>}

      {cartItems.length > 0 && (
        <>
          <div className="cart-list">
            {cartItems.map((item) => {
              const key = item._id || item.id;
              return (
                <div className="cart-item" key={key}>
                  <div>
                    <h3>{item.name}</h3>
                    <p>Price: Rs {item.price}</p>
                  </div>

                  <div className="cart-actions">
                    <button type="button" onClick={() => updateCartQuantity(key, item.quantity - 1)}>
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => updateCartQuantity(key, item.quantity + 1)}>
                      +
                    </button>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeFromCart(key)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-summary">
            <h2>Total: Rs {cartTotal}</h2>
            <div className="checkout-form">
              <h3>Delivery Details</h3>
              <input
                type="text"
                placeholder="Full Name"
                value={checkout.customerName}
                onChange={(e) => handleCheckoutFieldChange("customerName", e.target.value)}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={checkout.customerPhone}
                onChange={(e) => handleCheckoutFieldChange("customerPhone", e.target.value)}
              />
              <textarea
                rows={3}
                placeholder="Complete Delivery Address"
                value={checkout.deliveryAddress}
                onChange={(e) => handleCheckoutFieldChange("deliveryAddress", e.target.value)}
              />

              <h3>Payment Method</h3>
              <div className="payment-methods">
                <label>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={checkout.paymentMethod === "cod"}
                    onChange={() => handleCheckoutFieldChange("paymentMethod", "cod")}
                  />
                  Cash on Delivery
                </label>
                <label>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={checkout.paymentMethod === "upi"}
                    onChange={() => handleCheckoutFieldChange("paymentMethod", "upi")}
                  />
                  UPI
                </label>
                <label>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={checkout.paymentMethod === "card"}
                    onChange={() => handleCheckoutFieldChange("paymentMethod", "card")}
                  />
                  Card
                </label>
              </div>

              {checkout.paymentMethod === "upi" && (
                <input
                  type="text"
                  placeholder="UPI ID (example@upi)"
                  value={checkout.upiId}
                  onChange={(e) => handleCheckoutFieldChange("upiId", e.target.value)}
                />
              )}
              {checkout.paymentMethod === "card" && (
                <>
                  <input
                    type="text"
                    placeholder="Card Holder Name"
                    value={checkout.cardHolder}
                    onChange={(e) => handleCheckoutFieldChange("cardHolder", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Card Number"
                    value={checkout.cardNumber}
                    onChange={(e) => handleCheckoutFieldChange("cardNumber", e.target.value)}
                  />
                </>
              )}
            </div>
            <div className="cart-summary-actions">
              <button type="button" className="clear-btn" onClick={clearCart}>
                Clear Cart
              </button>
              <button type="button" className="checkout-btn" onClick={handleCheckout} disabled={placing}>
                {placing ? "Placing..." : "Checkout"}
              </button>
            </div>
            {message && <p className="cart-message">{message}</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
