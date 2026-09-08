import React, { useState } from 'react';
import { Lock, Search, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Header.css';
import logo from '../assets/phc-logo.png';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isPremierPage = location.pathname === '/premier';

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <header className="gcu-header">
      {/* Main Navigation Bar */}
      <div className="main-nav-bar">
        <div className="container">
          <div className="logo-container">
            <Link to="/">
              <img 
                src={logo} 
                alt="PHC Logo" 
                className="logo"
              />
            </Link>
          </div>
          
          <nav className={`main-nav ${isMenuOpen ? 'open' : ''}`}>
            <ul>
              {isPremierPage ? (
                <>
                  <li><Link to="/products">Accounts</Link></li>
                  <li><Link to="/products">Products and services</Link></li>
                  <li><Link to="/help">Support</Link></li>
                  <li><Link to="/security">Security and fraud</Link></li>
                  <li><Link to="/insights">Insights</Link></li>
                  <li><Link to="/login">Existing customers</Link></li>
                </>
              ) : (
                <>
                  <li className="mobile-only"><Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link></li>
                  <li className="mobile-only"><Link to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link></li>
                  <li className="mobile-only"><Link to="/register" onClick={() => setIsMenuOpen(false)}>Register</Link></li>
                  <li className="mobile-only"><Link to="/about" onClick={() => setIsMenuOpen(false)}>About</Link></li>
                  <li className="desktop-only"><Link to="/products">Products</Link></li>
                  <li className="desktop-only"><Link to="/help">Help and support</Link></li>
                  <li className="desktop-only"><Link to="/money">You and your money</Link></li>
                  <li className="desktop-only"><Link to="/banking">Banking with us</Link></li>
                  <li className="desktop-only"><Link to="/security">Security and fraud</Link></li>
                  <li className="desktop-only"><Link to="/climate">Climate</Link></li>
                </>
              )}
            </ul>
          </nav>

          <div className="header-right">
            <div className="search-container">
              <input type="text" placeholder="Search" />
              <button className="search-btn">
                <Search size={20} />
              </button>
            </div>
            
            <button className="login-btn-header" onClick={handleLoginClick}>
              <Lock size={16} className="lock-icon" /> <span>Log in</span>
            </button>

            <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
