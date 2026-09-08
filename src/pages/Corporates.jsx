import React from 'react';
import PageTemplate from './PageTemplate';

const Corporates = () => {
  return (
    <PageTemplate 
      title="Corporates & Institutions" 
      description="Tailored financial solutions for complex corporate needs and institutional clients."
      content={
        <div className="corporates-page">
          <section className="corporate-sections">
            <div className="section-card">
              <h3>Financing and Risk Management</h3>
              <p>Innovative financing solutions and risk management expertise.</p>
            </div>
            <div className="section-card">
              <h3>Investment Banking</h3>
              <p>Specialised investment banking services and advisory.</p>
            </div>
            <div className="section-card">
              <h3>Transaction Banking</h3>
              <p>Comprehensive cash management and trade solutions.</p>
            </div>
          </section>
        </div>
      }
    />
  );
};

export default Corporates;
