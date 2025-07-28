import React, { useState } from 'react';
import './MilkCard.css';

const MilkCard = ({ milk }) => {
  const [status, setStatus] = useState('initial'); // initial, form, success, unavailable
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: ''
  });

  const handleAddClick = () => {
    if (milk.available) {
      setStatus('form');
    } else {
      setStatus('unavailable');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, phone, location } = formData;

    if (name && phone && location) {
      setStatus('success');
    } else {
      alert('Please fill in all fields.');
    }
  };

  return (
    <div className={`product-card ${!milk.available ? 'unavailable' : ''}`}>
      <img src={milk.image} alt={milk.name} />
      <h3>{milk.name}</h3>
      <p><strong>Quantity:</strong> {milk.quantity}</p>
      <p><strong>Price:</strong> ₹{milk.price}</p>

      {status === 'initial' && (
        <button className="Addbtn" onClick={handleAddClick}>ADD</button>
      )}

      {status === 'unavailable' && (
        <div className="out-of-stock">❌ Out of Stock</div>
      )}

      {status === 'form' && (
        <form className="order-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <textarea
            name="location"
            placeholder="Delivery Location"
            value={formData.location}
            onChange={handleChange}
            required
          ></textarea>
          <button type="submit" className="submit-btn">Place Order</button>
        </form>
      )}

      {status === 'success' && (
        <div className="success-msg">✅ Order Completed Successfully!</div>
      )}
    </div>
  );
};

export default MilkCard;
