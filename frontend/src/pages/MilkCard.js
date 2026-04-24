import React, { useEffect, useMemo, useState } from "react";
import "./MilkCard.css";
import { createOrder } from "../services/apiClient";

const MilkCard = ({ milk }) => {
  const [status, setStatus] = useState("initial");
  const [quantity, setQuantity] = useState(1);
  const [isPlacing, setIsPlacing] = useState(false);
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(null);

  const handleOrderClick = () => {
    if (milk.available) {
      setStatus("form");
      setMessage("");
      setNotificationStatus(null);
      setIsModalOpen(true);
    } else {
      setStatus("unavailable");
    }
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
      const response = await createOrder({ product: milk, quantity });
      setStatus("success");
      setMessage("Order placed successfully and saved to MongoDB.");
      setNotificationStatus(response.notificationStatus || null);
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
    const timer = setTimeout(() => setShowToast(false), 2400);
    return () => clearTimeout(timer);
  }, [showToast]);

  const formatChannelStatus = (value) => {
    if (!value) return "Unknown";
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  return (
    <>
      {showToast && (
        <div className="order-toast" role="status" aria-live="polite">
          Thank you for your feedback! Your order is confirmed.
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
          <button className="Addbtn" onClick={handleOrderClick}>Order</button>
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
                <p className="total-amount">Total: ₹{totalPrice}</p>
                <button type="submit" className="submit-btn" disabled={isPlacing}>
                  {isPlacing ? "Placing..." : "Order Now"}
                </button>
              </form>
            )}

            {status === "success" && (
              <>
                <div className="success-msg">
                  {message || "Order completed successfully"}
                </div>
                {notificationStatus && (
                  <div className="notification-status">
                    <p><strong>Customer SMS:</strong> {formatChannelStatus(notificationStatus.customer?.sms)}</p>
                    <p><strong>Admin SMS:</strong> {formatChannelStatus(notificationStatus.admin?.sms)}</p>
                    <p><strong>Admins Notified:</strong> {notificationStatus.admin?.recipients ?? 0}</p>
                  </div>
                )}
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
