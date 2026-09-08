import React from 'react';
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
            <button className="cta-btn">See tax-efficient ISAs</button>
          </div>
          
          <div className="hero-rates-card">
            <div className="rate-item">
              <span className="balance">Balances £1,000-£24,999</span>
              <span className="rate">4.05% <small>AER</small></span>
            </div>
            <div className="rate-divider"></div>
            <div className="rate-item">
              <span className="balance">Balances £25,000+</span>
              <span className="rate">4.30% <small>AER</small></span>
            </div>
            <p className="disclaimer">
              AER/Tax Free p.a. (fixed) with our 2 year Fixed Rate ISA<br />
              1 year fixed rate options available
            </p>
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
