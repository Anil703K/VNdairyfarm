// src/components/Contact.js
import React, { useState } from 'react';
import './contact.css';

const Contact = () => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required.';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required.';
    else if (!/^\d{10}$/.test(form.phone.trim())) newErrors.phone = 'Enter a valid 10-digit phone number.';
    if (!form.email.trim()) newErrors.email = 'Email is required.';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) newErrors.email = 'Enter a valid email address.';
    if (!form.message.trim()) newErrors.message = 'Message is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setSuccess('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setSuccess('Message sent successfully!');
      setForm({ name: '', phone: '', email: '', message: '' });
      setErrors({});
    }
  };

  return (
    <div className="contact-container">
      <div className="contact-info animate-left">
        <h2>Contact VN Dairy</h2>
        <p className="info-tagline">We are happy to help with delivery, wholesale, and support queries.</p>
        <h3>📍 <u>Corporate Office:</u></h3>
        <p>205, Gaddipally Center, TV Room Rd, Gaddipally, Suryapet, Telangana 508201</p>

        <h3><u>Our Farm:</u></h3>
        <p>Survey no's 181 & 182, Gaddipally Village, Gridepally Mandal, Suryapet, Telangana 508201</p>

        <h3><u>Registered Address:</u></h3>
        <p>H.no 8-2-293/A, Plot no.45/3, Road No.1, Gaddipally,Suryapet, Telangana 508201</p>

        <h3>Email</h3>
        <p>vndairymilk@gmail.com</p>
        <h3>Contact Number</h3>
        <p>+91 7032014861</p>
      </div>

      <div className="contact-form animate-right">
        <form className="form" onSubmit={handleSubmit} noValidate>
          <label>Your Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            value={form.name}
            onChange={handleChange}
          />
          {errors.name && <span className="form-error">{errors.name}</span>}

          <label>Your Phone Number</label>
          <input
            type="text"
            name="phone"
            placeholder="Enter your Phone Number"
            value={form.phone}
            onChange={handleChange}
          />
          {errors.phone && <span className="form-error">{errors.phone}</span>}

          <label>Your Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
          />
          {errors.email && <span className="form-error">{errors.email}</span>}

          <label>Message</label>
          <textarea
            name="message"
            placeholder="Type your message"
            rows="4"
            value={form.message}
            onChange={handleChange}
          ></textarea>
          {errors.message && <span className="form-error">{errors.message}</span>}

          <button type="submit" className="btn">Send Message</button>
          {success && <div className="form-success">{success}</div>}
        </form>
      </div>
    </div>
  );
};

export default Contact;

