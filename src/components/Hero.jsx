import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-main">
        <div className="container">
          <div className="hero-content">
            <h1>
              Grow your savings tax-efficiently with a <span className="highlight">2 year</span> Fixed Rate ISA or explore investing options
            </h1>
            <Link to="/products" className="cta-btn">See tax-efficient ISAs</Link>
          </div>
          
          <div className="hero-features">
            <h3>Savings Options</h3>
            <ul>
              <li>Cash ISAs available</li>
              <li>Easy access savings</li>
              <li>Fixed term options</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="hero-bottom-bar">
        <div className="container">
          <p>Limits and criteria apply. Early closure charges may apply and interest is paid annually and at maturity. Limited availability, can be withdrawn at any time.</p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
