import React, { useEffect, useState } from 'react';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
const INITIAL_FORM_STATE = { email: '', password: '' };

const Login = () => {
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reset fields whenever login page opens.
    setForm(INITIAL_FORM_STATE);
    setErrors({});
    setLoading(false);
  }, []);

  const validate = () => {
    const newErrors = {};

    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    const { name, value } = e.target;
    if (name === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
      setErrors(prev => ({ ...prev, email: 'Email is invalid' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      });

      let body = null;
      try { body = await res.json(); } catch (jsonErr) {}

      if (!res.ok) {
        const msg = (body && (body.message || body.error)) || `Login failed (status ${res.status})`;
        console.error('Login error response:', res.status, body);
        alert(msg);
        setLoading(false);
        return;
      }

      localStorage.setItem('token', body.token);
      localStorage.setItem('user', JSON.stringify(body.user));
      setForm(INITIAL_FORM_STATE);
      alert('Login Successful!');
      navigate('/profile');
    } catch (err) {
      console.error('Login network error:', err);
      alert('Network or server error: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit} noValidate autoComplete="off">
        <h2>Login</h2>

        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="off"
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </div>

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="registration-link">
          Don’t have an account? <Link to="/register">Register</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
