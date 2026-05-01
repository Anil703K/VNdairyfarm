import React, { useState, useEffect } from 'react';
import './Header.css';
import logo from '../assets/logo.png';
import { Menu, User, X } from 'lucide-react'; 
import { useCart } from '../context/CartContext';
import { useLocation } from 'react-router-dom';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('/');
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const { cartCount } = useCart();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const setActivePage = () => {
      const path = location.pathname;
      if (path === '/' || path === '') setActiveLink('home');
      else if (path === '/MilkList') setActiveLink('products');
      else if (path === '/About') setActiveLink('about');
      else if (path === '/Contact') setActiveLink('contact');
      else if (path === '/orders') setActiveLink('orders');
      else if (path === '/cart') setActiveLink('cart');
      else if (path === '/profile') setActiveLink('profile');
      else setActiveLink('home');
    };

    handleScroll();
    setActivePage();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const navigateWithRefresh = (path) => {
    setMenuOpen(false);
    window.location.href = path;
  };

  return (
    <div className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="logo-img">
        <img src={logo} alt="VN DAIRY" />
      </div>

      <button className="menu-btn" onClick={toggleMenu}>
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`navmenu ${menuOpen ? 'open' : ''}`}>
        <ul className="nav-list">
          <li><button type="button" onClick={() => navigateWithRefresh('/')} className={`nav-link-btn ${activeLink === 'home' ? 'active' : ''}`}>Home</button></li>
          <li><button type="button" onClick={() => navigateWithRefresh('/MilkList')} className={`nav-link-btn ${activeLink === 'products' ? 'active' : ''}`}>Products</button></li>
          <li><button type="button" onClick={() => navigateWithRefresh('/About')} className={`nav-link-btn ${activeLink === 'about' ? 'active' : ''}`}>About us</button></li>
          <li><button type="button" onClick={() => navigateWithRefresh('/Contact')} className={`nav-link-btn ${activeLink === 'contact' ? 'active' : ''}`}>Contact us</button></li>
          <li>
            <button type="button" onClick={() => navigateWithRefresh('/orders')} className={`nav-link-btn orders-link-btn ${activeLink === 'orders' ? 'active' : ''}`}>
              Orders
            </button>
          </li>
          <li>
            <button type="button" onClick={() => navigateWithRefresh('/cart')} className={`nav-link-btn cart-link-btn ${activeLink === 'cart' ? 'active' : ''}`}>
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
            <button type="button" className={`profile-pill ${activeLink === 'profile' ? 'active' : ''}`} onClick={() => navigateWithRefresh('/profile')}>
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
