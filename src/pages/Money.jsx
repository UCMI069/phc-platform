import React from 'react';
import PageTemplate from './PageTemplate';

const Money = () => {
  return (
    <PageTemplate 
      title="You and Your Money" 
      description="Financial education, tools, and resources to help you manage your money effectively."
      content={
        <div className="money-page">
          <section className="money-sections">
            <div className="section-card">
              <h3>Budgeting and Savings</h3>
              <p>Master your finances with our budgeting tools and saving tips.</p>
            </div>
            <div className="section-card">
              <h3>Investing for Your Future</h3>
              <p>Learn about investing and how to build a diversified portfolio.</p>
            </div>
            <div className="section-card">
              <h3>Managing Your Debt</h3>
              <p>Get advice on how to manage your debt and improve your credit score.</p>
            </div>
          </section>
        </div>
      }
    />
  );
};

export default Money;
