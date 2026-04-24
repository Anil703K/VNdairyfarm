import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
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
        } else {
          console.error('Profile fetch error', body);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) return <div className="profile-empty-state">Loading...</div>;
  if (!user) return <div className="profile-empty-state">Please login to view profile.</div>;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2>Your Profile</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Joined:</strong> {new Date(user.createdAt || user._id?.getTimestamp?.() || Date.now()).toLocaleString()}</p>
      </div>
      <button type="button" className="profile-logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default Profile;
