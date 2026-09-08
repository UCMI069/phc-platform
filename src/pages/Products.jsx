import React from 'react';
import PageTemplate from './PageTemplate';

const Products = () => {
  return (
    <PageTemplate 
      title="Products and Services" 
      description="Find the perfect financial products for your personal and business needs."
      content={
        <div className="products-page">
          <section className="product-sections">
            <div className="section-card">
              <h3>Current Accounts</h3>
              <p>Explore our range of accounts for everyday banking.</p>
            </div>
            <div className="section-card">
              <h3>Savings and Investments</h3>
              <p>Start your savings journey or grow your wealth.</p>
            </div>
            <div className="section-card">
              <h3>Loans and Mortgages</h3>
              <p>Financing solutions to help you achieve your goals.</p>
            </div>
            <div className="section-card">
              <h3>Credit Cards</h3>
              <p>Find the right card for your lifestyle and needs.</p>
            </div>
          </section>
        </div>
      }
    />
  );
};

export default Products;
