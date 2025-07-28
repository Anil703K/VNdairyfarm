import React, { useState } from 'react';
import './Header.css';
import logo from '../assets/logo.png';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react'; 

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

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
          <Link to="/" onClick={() => setMenuOpen(false)}><li>Home</li></Link>
          <Link to="/MilkList" onClick={() => setMenuOpen(false)}><li>Products</li></Link>
          <Link to="/About" onClick={() => setMenuOpen(false)}><li>About us</li></Link>
          <Link to="/Contact" onClick={() => setMenuOpen(false)}><li>Contact us</li></Link>
        </ul>
        <Link to="/login">
          <button className="btn" onClick={() => setMenuOpen(false)}>Register/Login</button>
        </Link>
      </div>
    </div>
  );
}

export default Header;
