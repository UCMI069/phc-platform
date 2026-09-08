import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="gcu-footer">
      {/* Main Footer Content */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* Products Column */}
            <div className="footer-column">
              <h3>Products</h3>
              <ul>
                <li>Bank accounts</li>
                <li>Savings</li>
                <li>Investments</li>
                <li>Credit cards</li>
                <li>Loans</li>
                <li>Overdrafts</li>
                <li>Mortgages</li>
                <li>Insurance</li>
                <li>Reward accounts and cards</li>
              </ul>
            </div>

            {/* Life Moments Column */}
            <div className="footer-column">
              <h3>Life Moments</h3>
              <ul>
                <li>View all Life moments</li>
                <li>Managing your money</li>
                <li>Struggling financially</li>
                <li>Bereavement</li>
                <li>Financial Health Check</li>
                <li>First time buyer guide</li>
                <li>Travel Guide</li>
                <li>Financial abuse</li>
              </ul>
            </div>

            {/* Help and Support Column */}
            <div className="footer-column">
              <h3>Help and support</h3>
              <ul>
                <li>Support</li>
                <li>Security</li>
                <li>Service status</li>
                <li>PHC app</li>
                <li>Online Banking</li>
                <li>Home Energy Hub</li>
              </ul>
            </div>

            {/* More from PHC Column */}
            <div className="footer-column">
              <h3>More from PHC</h3>
              <ul>
                <li>Detecting and preventing financial crime</li>
                <li>Access to cash</li>
                <li>Modern Slavery Act (PDF 6MB)</li>
                <li>FSCS.org.uk</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Links */}
      <div className="footer-bottom">
        <div className="container">
          <ul className="legal-links">
            <li>Privacy & Cookies</li>
            <li>Website T&Cs</li>
            <li>Accessibility</li>
            <li>Careers</li>
            <li>Site Map</li>
          </ul>
          
          <div className="copyright-info">
            <p>Copyright Â© PHC Platform 2026. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
