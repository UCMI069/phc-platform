import React from 'react';
import './MobileApp.css';

const MobileApp = () => {
  return (
    <section className="mobile-app">
      <div className="container">
        <h2 className="section-title">Join millions on our Mobile App</h2>
        <p className="section-description">Did you know that over 10 million customers now use the PHC Mobile App to access their account every day? Take a look at some of our handy features below.</p>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="card-top">
              <img src="/images/mobile-spending-insights.jpg" alt="Spending Insights" className="placeholder-img" />
            </div>
            <div className="card-body">
              <h3>Spending Insights</h3>
              <p>Take control of your finances with tips and personalised coaching plans to help you manage your financial well being. Eligibility criteria may apply.</p>
            </div>
            <div className="card-footer">
              <a href="#insights">More about Insights</a>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="card-top">
              <img src="/images/mobile-payments-hub.jpg" alt="Payments Hub" className="placeholder-img" />
              <div className="notification-bubble">
                <span className="check">✓</span> You sent £40.00 to Adam
              </div>
            </div>
            <div className="card-body">
              <h3>Payments Hub</h3>
              <p>Our Payments hub brings payments to the front and centre of our app. Send, request and manage your money all at the tap of a button. Eligibility criteria and limits apply.</p>
            </div>
            <div className="card-footer">
              <a href="#payments">More about payments</a>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="card-top">
              <div className="credit-gauge">
                <div className="score">650</div>
                <div className="label">Fair &gt;</div>
                <div className="provider">Data provided by TransUnion</div>
              </div>
            </div>
            <div className="card-body">
              <h3>Credit Score</h3>
              <p>Check your free credit score in the app today, so you know where you stand. Credit score is available once you opt in and provided by TransUnion. Eligibility criteria apply.</p>
            </div>
            <div className="card-footer">
              <a href="#credit-score">More about Credit Score</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileApp;
