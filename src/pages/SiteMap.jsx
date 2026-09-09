import React from 'react';
import { Link } from 'react-router-dom';
import './Legal.css';

const SiteMap = () => {
  return (
    <main className="legal-page">
      <div className="legal-hero">
        <h1>Site Map</h1>
        <p className="legal-updated">Find your way around our website.</p>
      </div>

      <div className="legal-content">
        <div className="sitemap-grid">
          <section className="sitemap-card">
            <h2>Banking</h2>
            <ul>
              <li><Link to="/personal">Personal Banking</Link></li>
              <li><Link to="/business">Business Banking</Link></li>
              <li><Link to="/products">Products & Services</Link></li>
              <li><Link to="/money">Managing Your Money</Link></li>
            </ul>
          </section>

          <section className="sitemap-card">
            <h2>Accounts</h2>
            <ul>
              <li><Link to="/products">Bank Accounts</Link></li>
              <li><Link to="/products">Savings</Link></li>
              <li><Link to="/products">Credit Cards</Link></li>
              <li><Link to="/products">Loans</Link></li>
              <li><Link to="/products">Mortgages</Link></li>
              <li><Link to="/products">Investments</Link></li>
            </ul>
          </section>

          <section className="sitemap-card">
            <h2>Online Banking</h2>
            <ul>
              <li><Link to="/login">Online Banking Login</Link></li>
              <li><Link to="/register">Register</Link></li>
              <li><Link to="/help">Help & Support</Link></li>
              <li><Link to="/about">About Us</Link></li>
            </ul>
          </section>

          <section className="sitemap-card">
            <h2>Legal</h2>
            <ul>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms & Conditions</Link></li>
              <li><Link to="/accessibility">Accessibility</Link></li>
              <li><Link to="/careers">Careers</Link></li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
};

export default SiteMap;
