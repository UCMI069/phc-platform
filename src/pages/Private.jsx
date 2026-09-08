import React from 'react';
import PageTemplate from './PageTemplate';

const Private = () => {
  return (
    <PageTemplate 
      title="Private Banking" 
      description="Exclusive banking and wealth management for private clients."
      content={
        <div className="private-page">
          <section className="private-sections">
            <div className="section-card">
              <h3>Private Relationship Managers</h3>
              <p>Personalised advice and dedicated support for your financial goals.</p>
            </div>
            <div className="section-card">
              <h3>Wealth Management</h3>
              <p>Tailored investment strategies and wealth preservation solutions.</p>
            </div>
            <div className="section-card">
              <h3>Private Credit and Lending</h3>
              <p>Specialised credit solutions for complex financial needs.</p>
            </div>
          </section>
        </div>
      }
    />
  );
};

export default Private;
