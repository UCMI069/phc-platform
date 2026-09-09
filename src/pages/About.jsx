import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <header className="about-header">
        <div className="container">
          <div className="header-content">
            <div className="logo-section">
              <h2>PHC Platform</h2>
              <p className="logo-subtitle">Your trusted banking partner</p>
            </div>
            <nav className="header-nav">
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <main className="about-main">
        <div className="container">
          <div className="about-intro">
            <h1>About PHC Platform</h1>
            <p className="tagline">Modern banking for the digital age</p>
          </div>

          <div className="about-grid">
            <div className="about-card">
              <h3>Our Mission</h3>
              <p>To provide a transparent, secure, and user-friendly banking experience for everyone. We believe finance should be accessible, understandable, and safe.</p>
            </div>
            <div className="about-card">
              <h3>Our Values</h3>
              <ul>
                <li><strong>Security</strong> - Your data and finances are protected with industry-leading measures</li>
                <li><strong>Transparency</strong> - Clear terms, no hidden fees, open communication</li>
                <li><strong>Accessibility</strong> - Platform works seamlessly across all devices</li>
                <li><strong>Innovation</strong> - Continuous improvement based on customer feedback</li>
              </ul>
            </div>
            <div className="about-card">
              <h3>Our Story</h3>
              <p>PHC Platform was built to bridge the gap between traditional banking and modern technology. We started with a simple mission: to create a banking experience that puts people first, without the complexity of traditional banks.</p>
            </div>
          </div>

          <div className="about-cta">
            <h3>Get Started Today</h3>
            <p>Join thousands of customers who are already managing their finances with PHC Platform.</p>
            <div className="cta-buttons">
              <Link to="/login" className="btn-primary">Login to Your Account</Link>
              <Link to="/register" className="btn-secondary">Create an Account</Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="about-footer">
        <div className="container">
          <p>2024 PHC Platform. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;