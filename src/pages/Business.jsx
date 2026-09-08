import React from 'react';
import PageTemplate from './PageTemplate';

const Business = () => {
  return (
    <PageTemplate 
      title="Business Banking" 
      description="Helping you and your business thrive. Explore our range of business accounts, loans, and financial tools."
      content={
        <div className="business-page">
          <section className="business-sections">
            <div className="section-card">
              <h3>Start a Business</h3>
              <p>Everything you need to get your new venture off the ground.</p>
            </div>
            <div className="section-card">
              <h3>Grow Your Business</h3>
              <p>Financing and expertise to help you take the next step.</p>
            </div>
            <div className="section-card">
              <h3>Corporate Banking</h3>
              <p>Specialised solutions for large businesses and institutions.</p>
            </div>
          </section>
        </div>
      }
    />
  );
};

export default Business;
