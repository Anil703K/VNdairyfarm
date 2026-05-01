import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cancelOrder, fetchUserOrders } from "../services/apiClient";
import "./Orders.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5002";

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState("");

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login to view your orders.");
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json().then((body) => ({ status: res.status, body })))
      .then(async ({ status, body }) => {
        if (status !== 200 || !body?.user?._id) {
          throw new Error("Unable to fetch account details");
        }
        const list = await fetchUserOrders(body.user._id);
        if (!cancelled) {
          setOrders(Array.isArray(list) ? list : []);
          setError("");
        }
      })
      .catch((err) => !cancelled && setError(err.message || "Failed to load orders"))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmCancel) return;

    setCancellingOrderId(orderId);
    try {
      const response = await cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? response.order || { ...order, status: "cancelled" } : order))
      );
    } catch (err) {
      window.alert(err.message || "Failed to cancel order");
    } finally {
      setCancellingOrderId("");
    }
  };

  return (
    <div className="orders-page">
      <div className="orders-card">
        <h1>Your Orders</h1>
        {loading && <p>Loading orders...</p>}
        {error && <p className="orders-error">{error}</p>}
        {!loading && !error && orders.length === 0 && <p>No orders yet.</p>}
        {!loading &&
          !error &&
          orders.map((order) => (
            <div key={order._id} className="orders-item">
              <p><strong>Order ID:</strong> {order._id}</p>
              <p><strong>Status:</strong> {order.status || "pending"}</p>
              <p><strong>Total:</strong> Rs {order.totalPrice}</p>
              <p><strong>Payment:</strong> {order.paymentMethod || "cod"} ({order.paymentStatus || "pending"})</p>
              <p><strong>Items:</strong> {order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ")}</p>
              <div className="orders-item-actions">
                <button type="button" onClick={() => navigate(`/order-tracking/${order._id}`)}>
                  Track Order
                </button>
                {order.status !== "cancelled" && order.status !== "delivered" && order.status !== "out_for_delivery" && (
                  <button
                    type="button"
                    className="cancel-order-btn"
                    onClick={() => handleCancelOrder(order._id)}
                    disabled={cancellingOrderId === order._id}
                  >
                    {cancellingOrderId === order._id ? "Cancelling..." : "Cancel Order"}
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Orders;
