import React from 'react';
import PageTemplate from './PageTemplate';

const Security = () => {
  return (
    <PageTemplate 
      title="Security and Fraud" 
      description="Protecting you and your finances from fraud and cyber threats."
      content={
        <div className="security-page">
          <section className="security-sections">
            <div className="section-card">
              <h3>Fraud Prevention</h3>
              <p>Learn how to stay safe from common scams and fraud attempts.</p>
            </div>
            <div className="section-card">
              <h3>Secure Online Banking</h3>
              <p>Discover our security features and how to protect your personal information.</p>
            </div>
            <div className="section-card">
              <h3>Reporting Fraud</h3>
              <p>Find out what to do if you suspect fraud on your account.</p>
            </div>
          </section>
        </div>
      }
    />
  );
};

export default Security;
