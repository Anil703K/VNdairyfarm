import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchOrderTracking } from "../services/apiClient";
import "./OrderTracking.css";

const humanizeStatus = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let intervalId;

    const loadTracking = () =>
      fetchOrderTracking(orderId)
        .then((data) => {
          if (!cancelled) {
            setTracking(data);
            setError("");
          }
        })
        .catch((err) => !cancelled && setError(err.message || "Unable to track order"))
        .finally(() => !cancelled && setLoading(false));

    setLoading(true);
    loadTracking();
    intervalId = setInterval(loadTracking, 10000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId]);

  if (loading) return <div className="tracking-page">Loading order tracking...</div>;
  if (error) {
    return (
      <div className="tracking-page">
        <p className="tracking-error">{error}</p>
        <button type="button" onClick={() => navigate("/profile")}>
          Go to Profile
        </button>
      </div>
    );
  }
  if (!tracking) return null;

  return (
    <div className="tracking-page">
      <div className="tracking-card">
        <h1>Order Tracking</h1>
        <p>
          <strong>Order ID:</strong> {tracking.orderId}
        </p>
        <p>
          <strong>Status:</strong> {humanizeStatus(tracking.status)}
        </p>
        <p>
          <strong>Payment:</strong> {humanizeStatus(tracking.paymentMethod)} ({humanizeStatus(tracking.paymentStatus)})
        </p>
        {tracking.paymentReference && (
          <p>
            <strong>Payment Reference:</strong> {tracking.paymentReference}
          </p>
        )}
        <p>
          <strong>Delivery Address:</strong> {tracking.deliveryAddress || "Not provided"}
        </p>
        <p>
          <strong>Total:</strong> Rs {tracking.totalPrice}
        </p>

        <h2>Progress</h2>
        <div className="tracking-timeline">
          {(tracking.timeline || []).map((step) => (
            <div
              key={step.status}
              className={`tracking-step ${step.done ? "done" : ""} ${step.active ? "active" : ""}`}
            >
              <span className="tracking-dot" />
              <span>{humanizeStatus(step.status)}</span>
            </div>
          ))}
        </div>

        <h2>Items</h2>
        <ul className="tracking-items">
          {(tracking.items || []).map((item, index) => (
            <li key={`${item.productId || item.name}-${index}`}>
              {item.name} x{item.quantity} - Rs {item.price}
            </li>
          ))}
        </ul>

        <div className="tracking-actions">
          <button type="button" onClick={() => navigate("/MilkList")}>
            Continue Shopping
          </button>
          <button type="button" onClick={() => navigate("/profile")}>
            View All Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
