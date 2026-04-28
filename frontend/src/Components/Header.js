import React, { useState } from 'react';
import './Header.css';
import logo from '../assets/logo.png';
import { Menu, User, X } from 'lucide-react'; 
import { useCart } from '../context/CartContext';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const { cartCount } = useCart();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const navigateWithRefresh = (path) => {
    setMenuOpen(false);
    window.location.href = path;
  };

  return (
    <div className="header">
      <div className="logo-img">
        <img src={logo} alt="VN DAIRY" />
      </div>

      <button className="menu-btn" onClick={toggleMenu}>
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`navmenu ${menuOpen ? 'open' : ''}`}>
        <ul className="nav-list">
          <li><button type="button" onClick={() => navigateWithRefresh('/')} className="nav-link-btn">Home</button></li>
          <li><button type="button" onClick={() => navigateWithRefresh('/MilkList')} className="nav-link-btn">Products</button></li>
          <li><button type="button" onClick={() => navigateWithRefresh('/About')} className="nav-link-btn">About us</button></li>
          <li><button type="button" onClick={() => navigateWithRefresh('/Contact')} className="nav-link-btn">Contact us</button></li>
          <li>
            <button type="button" onClick={() => navigateWithRefresh('/orders')} className="nav-link-btn orders-link-btn">
              Orders
            </button>
          </li>
          <li>
            <button type="button" onClick={() => navigateWithRefresh('/cart')} className="nav-link-btn cart-link-btn">
              Cart ({cartCount})
            </button>
          </li>
        </ul>
        <div className="auth-actions">
          {!token && (
              <button className="btn" onClick={() => navigateWithRefresh('/login')}>
                Login
              </button>
          )}
          {token && user?.name && (
            <button type="button" className="profile-pill" onClick={() => navigateWithRefresh('/profile')}>
              <User size={16} />
              <span>{user.name}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;
