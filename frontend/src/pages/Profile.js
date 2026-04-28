import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import { fetchUserOrders } from '../services/apiClient';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json().then(body => ({ status: res.status, body })))
      .then(({ status, body }) => {
        if (status === 200) {
          setUser(body.user);
          fetchUserOrders(body.user?._id)
            .then((data) => setOrders(Array.isArray(data) ? data : []))
            .catch(() => setOrders([]));
        } else {
          console.error('Profile fetch error', body);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    setUser(null);
    setLoading(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('vn_dairy_cart');
    navigate('/login', { replace: true });
  };

  if (loading) return <div className="profile-empty-state">Loading...</div>;
  if (!user) {
    return (
      <div className="profile-empty-state">
        <p>Please login to view profile.</p>
        <button type="button" className="profile-logout-btn" onClick={() => navigate('/login')}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2>Your Profile</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Joined:</strong> {new Date(user.createdAt || user._id?.getTimestamp?.() || Date.now()).toLocaleString()}</p>
      </div>
      <div className="profile-card">
        <h2>Your Orders</h2>
        {!orders.length && <p>No orders yet.</p>}
        {orders.map((order) => (
          <div key={order._id} className="profile-order-item">
            <p><strong>Order ID:</strong> {order._id}</p>
            <p><strong>Status:</strong> {order.status || 'pending'}</p>
            <p><strong>Total:</strong> Rs {order.totalPrice}</p>
            <p><strong>Payment:</strong> {order.paymentMethod || 'cod'} ({order.paymentStatus || 'pending'})</p>
            <p><strong>Items:</strong> {order.items?.map((item) => `${item.name} x${item.quantity}`).join(', ')}</p>
            <button type="button" className="profile-logout-btn" onClick={() => navigate(`/order-tracking/${order._id}`)}>
              Track Order
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="profile-logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default Profile;
