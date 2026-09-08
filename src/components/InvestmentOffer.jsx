import React from 'react';
import './InvestmentOffer.css';

const InvestmentOffer = () => {
  return (
    <section className="investment-offer">
      <div className="container">
        <h2 className="offer-title-top">Invest with PHC</h2>
        <div className="offer-grid">
          <div className="offer-image">
            <img src="/images/investment-offer.jpg" alt="Invest with PHC" className="placeholder-img" />
          </div>
          
          <div className="offer-content">
            <h2 className="offer-title">Invest with PHC</h2>
            <div className="offer-description">
              <p>Open a Stocks and Shares ISA with tax-efficient growth potential.</p>
              <p className="risk-warning">When investing your capital is at risk. T&Cs, fees and charges apply.</p>
            </div>
            <button className="offer-btn">See the offer</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InvestmentOffer;
