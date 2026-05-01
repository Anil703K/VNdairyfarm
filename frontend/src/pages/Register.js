import React, { useState } from 'react';
import './Registeration.css';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5002';

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: ''
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = 'Name is required';

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // optional: basic phone validation
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required for order notifications';
    } else if (!/^\+?[0-9\-\s]{7,15}$/.test(form.phone)) {
      newErrors.phone = 'Phone number looks invalid';
    }

    // password strength rules (for display too)
    if (form.password && !/[A-Z]/.test(form.password)) {
      newErrors.password = newErrors.password || 'Password should include at least one uppercase letter';
    }
    if (form.password && !/[0-9]/.test(form.password)) {
      newErrors.password = newErrors.password || 'Password should include at least one number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // live-validate single field
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: '' }));
    // quick field checks
    if (name === 'email') {
      if (value && !/\S+@\S+\.\S+/.test(value)) setErrors(prev => ({ ...prev, email: 'Invalid email format' }));
    }
    if (name === 'password') {
      if (value && value.length < 6) setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
    }
    if (name === 'confirmPassword') {
      if (value && value !== form.password) setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    }
  };

  const passwordStrength = (pw) => {
    if (!pw) return '';
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return 'weak';
    if (score === 2 || score === 3) return 'medium';
    return 'strong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, phone: form.phone, address: form.address })
      });

      let body = null;
      try { body = await res.json(); } catch (jsonErr) { /* ignore parse error */ }

      if (!(res.status === 200 || res.status === 201)) {
        const msg = (body && (body.message || body.error)) || `Registration failed (status ${res.status})`;
        console.error('Register error response:', res.status, body);
        alert(msg);
        setLoading(false);
        return;
      }

      // success
      localStorage.setItem('token', body.token);
      localStorage.setItem('user', JSON.stringify(body.user));
      setForm({ name: '', email: '', password: '', confirmPassword: '', phone: '', address: '' });
      setErrors({});
      alert('Registration Successful!');
      navigate('/profile');
    } catch (err) {
      console.error('Register network error:', err);
      alert('Network or server error: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit} noValidate>
        <h2>Register</h2>

        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
          />
          {errors.name && <span className="error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
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
          />
          {errors.password && <span className="error">{errors.password}</span>}
          {form.password && (
            <div className={`pw-strength ${passwordStrength(form.password)}`}>
              Strength: {passwordStrength(form.password)}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Confirm Password:</label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
          />
          {errors.confirmPassword && (
            <span className="error">{errors.confirmPassword}</span>
          )}
        </div>

        <div className="form-group">
          <label>Phone:</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />
          {errors.phone && <span className="error">{errors.phone}</span>}
        </div>

        <div className="form-group">
          <label>Address:</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="register-btn" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>

        <div className="login-link">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </form>
    </div>
  );
};

export default Register;
