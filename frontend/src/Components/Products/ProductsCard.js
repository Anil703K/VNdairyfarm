import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProductCard.css";
import { createOrder } from "../../services/apiClient";
import { useCart } from "../../context/CartContext";

const ProductsCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [status, setStatus] = useState("initial");
  const [quantity, setQuantity] = useState(1);
  const [isPlacing, setIsPlacing] = useState(false);
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showCartToast, setShowCartToast] = useState(false);

  const handleOrderClick = () => {
    if (product.available) {
      // Redirect to payment page with product and quantity
      navigate('/payment', { 
        state: { 
          product, 
          quantity 
        } 
      });
    } else {
      setStatus("unavailable");
    }
  };
  const handleAddToCart = () => {
    if (!product.available) return;
    addToCart(product, 1);
    setMessage("");
    setStatus("initial");
    setShowCartToast(true);
  };

  const totalPrice = useMemo(() => Number(product.price) * quantity, [product.price, quantity]);
  const rating = useMemo(() => {
    if (product.rating) return Number(product.rating).toFixed(1);
    return product.available ? "4.8" : "4.2";
  }, [product.rating, product.available]);

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
      await createOrder({ product: product, quantity });
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
          Thank you! Your order is confirmed.
        </div>
      )}
      {showCartToast && (
        <div className="cart-toast" role="status" aria-live="polite">
          <span>Added to cart.</span>
          <button type="button" onClick={() => { setShowCartToast(false); window.location.href = "/cart"; }}>
            Go to Cart
          </button>
        </div>
      )}
      <div className={`product-card ${!product.available ? "unavailable" : ""}`}>
        <div className="satisfaction-row">
          <span className="rating-badge">★ {rating}</span>
          <span className="satisfaction-badge">Customer Satisfaction</span>
        </div>
        <img src={product.image} alt={product.name} />
        <h3>{product.name}</h3>
        <p><strong>Category:</strong> {product.category || "Dairy"}</p>
        <p><strong>Quantity:</strong> {product.quantityLabel || product.quantity}</p>
        <p><strong>Price:</strong> ₹{product.price}</p>

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
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <div className="modal-rating-row">
              <span className="rating-badge">★ {rating}</span>
              <span className="satisfaction-badge">Trusted by customers</span>
            </div>
            <p><strong>Category:</strong> {product.category || "Dairy"}</p>
            <p><strong>Quantity:</strong> {product.quantityLabel || product.quantity}</p>
            <p><strong>Price:</strong> ₹{product.price}</p>

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
              </>
            )}

            {message && status !== "success" && <div className="out-of-stock">{message}</div>}
          </div>
        </div>
      )}
    </>
  );
};

export default ProductsCard;
