import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MilkCard.css";
import { createOrder, createRazorpayPaymentOrder, verifyRazorpayPayment } from "../services/apiClient";
import { useCart } from "../context/CartContext";

const MilkCard = ({ milk }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [status, setStatus] = useState("initial");
  const [quantity, setQuantity] = useState(1);
  const [isPlacing, setIsPlacing] = useState(false);
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showCartToast, setShowCartToast] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleOrderClick = () => {
    if (milk.available) {
      setPaymentMethod("cod");
      setStatus("form");
      setMessage("");
      setIsModalOpen(true);
    } else {
      setStatus("unavailable");
    }
  };
  const handleAddToCart = () => {
    if (!milk.available) return;
    addToCart(milk, 1);
    setMessage("");
    setStatus("initial");
    setShowCartToast(true);
    window.alert(`${milk.name} added to cart`);
  };

  const totalPrice = useMemo(() => Number(milk.price) * quantity, [milk.price, quantity]);
  const rating = useMemo(() => {
    if (milk.rating) return Number(milk.rating).toFixed(1);
    return milk.available ? "4.8" : "4.2";
  }, [milk.rating, milk.available]);

  const closeModal = () => {
    if (isPlacing) return;
    setIsModalOpen(false);
    if (status === "form") {
      setStatus("initial");
    }
  };

  const triggerHapticAndSound = () => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([120, 40, 120]);
    }

    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const audioCtx = new AudioCtx();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.22);
      oscillator.onended = () => audioCtx.close();
    } catch (err) {
      // Ignore audio feedback issues to avoid blocking the order flow.
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPlacing(true);
    try {
      let paymentReference = "";
      let paymentStatus = "pending";

      if (paymentMethod !== "cod") {
        const scriptReady = await loadRazorpayScript();
        if (!scriptReady) {
          throw new Error("Unable to load Razorpay checkout. Check internet and try again.");
        }

        const amount = Number(milk.price) * Number(quantity || 1);
        const rpOrder = await createRazorpayPaymentOrder(amount);
        paymentReference = await new Promise((resolve, reject) => {
          const razorpay = new window.Razorpay({
            key: rpOrder.key,
            amount: rpOrder.amount,
            currency: rpOrder.currency || "INR",
            name: "VN Dairy",
            description: `${milk.name} order payment`,
            order_id: rpOrder.orderId,
            handler: async (response) => {
              try {
                const verify = await verifyRazorpayPayment(response);
                if (!verify.verified) {
                  reject(new Error("Payment verification failed"));
                  return;
                }
                resolve(verify.paymentReference || response.razorpay_payment_id);
              } catch (error) {
                reject(new Error(error.message || "Payment verification failed"));
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

      await createOrder({
        product: milk,
        quantity,
        checkout: {
          paymentMethod,
          paymentStatus,
          paymentReference,
        },
      });
      setStatus("success");
      setMessage("Order placed successfully.");
      setShowToast(true);
      triggerHapticAndSound();
    } catch (err) {
      setMessage(err.message || "Could not place order");
    } finally {
      setIsPlacing(false);
    }
  };

  useEffect(() => {
    if (!showToast) return undefined;
    const timer = setTimeout(() => setShowToast(false), 1200);
    return () => clearTimeout(timer);
  }, [showToast]);

  useEffect(() => {
    if (!showCartToast) return undefined;
    const timer = setTimeout(() => setShowCartToast(false), 2200);
    return () => clearTimeout(timer);
  }, [showCartToast]);

  return (
    <>
      {showToast && (
        <div className="order-toast" role="status" aria-live="polite">
          Thank you for your feedback! Your order is confirmed.
        </div>
      )}
      {showCartToast && (
        <div className="cart-toast" role="status" aria-live="polite">
          <span>Added to cart.</span>
          <button
            type="button"
            onClick={() => {
              setShowCartToast(false);
              navigate("/cart");
            }}
          >
            Go to Cart
          </button>
        </div>
      )}
      <div className={`product-card ${!milk.available ? "unavailable" : ""}`}>
        <div className="satisfaction-row">
          <span className="rating-badge">★ {rating}</span>
          <span className="satisfaction-badge">Customer Satisfaction</span>
        </div>
        <img src={milk.image} alt={milk.name} />
        <h3>{milk.name}</h3>
        <p><strong>Category:</strong> {milk.category || "Dairy"}</p>
        <p><strong>Quantity:</strong> {milk.quantityLabel || milk.quantity}</p>
        <p><strong>Price:</strong> ₹{milk.price}</p>

        {status === "initial" && (
          <div className="card-actions">
            <button className="Addbtn" onClick={handleOrderClick}>Order</button>
            <button className="cart-btn" onClick={handleAddToCart}>Add to Cart</button>
          </div>
        )}

        {status === "unavailable" && (
          <div className="out-of-stock">Out of stock</div>
        )}

        {status === "success" && !isModalOpen && (
          <div className="success-msg">Order completed successfully</div>
        )}
        {message && status !== "success" && !isModalOpen && <div className="out-of-stock">{message}</div>}
      </div>

      {isModalOpen && (
        <div className="order-modal-overlay" onClick={closeModal}>
          <div className="order-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal} aria-label="Close">
              x
            </button>
            <img src={milk.image} alt={milk.name} />
            <h3>{milk.name}</h3>
            <div className="modal-rating-row">
              <span className="rating-badge">★ {rating}</span>
              <span className="satisfaction-badge">Trusted by customers</span>
            </div>
            <p><strong>Category:</strong> {milk.category || "Dairy"}</p>
            <p><strong>Quantity:</strong> {milk.quantityLabel || milk.quantity}</p>
            <p><strong>Price:</strong> ₹{milk.price}</p>

            {status === "form" && (
              <form className="order-form" onSubmit={handleSubmit}>
                <div className="quantity-wrap">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => setQuantity((q) => q + 1)}>+</button>
                </div>
                <div className="payment-methods">
                  <label>
                    <input
                      type="radio"
                      name={`payment-${milk._id || milk.id || milk.name}`}
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                    />
                    Cash on Delivery
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`payment-${milk._id || milk.id || milk.name}`}
                      checked={paymentMethod === "upi"}
                      onChange={() => setPaymentMethod("upi")}
                    />
                    Razorpay (UPI/Card)
                  </label>
                </div>
                <p className="total-amount">Total: ₹{totalPrice}</p>
                <button type="submit" className="submit-btn" disabled={isPlacing}>
                  {isPlacing ? "Processing..." : paymentMethod === "cod" ? "Order Now" : "Pay & Order"}
                </button>
              </form>
            )}

            {status === "success" && (
              <>
                <div className="success-msg">
                  {message || "Order completed successfully"}
                </div>
              </>
            )}

            {message && status !== "success" && <div className="out-of-stock">{message}</div>}
          </div>
        </div>
      )}
    </>
  );
};

export default MilkCard;
