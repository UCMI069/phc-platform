import React from 'react';
import PageTemplate from './PageTemplate';

const Group = () => {
  return (
    <PageTemplate 
      title="PHC Group" 
      description="About PHC Group, our history, our purpose, and our commitment to our customers and society."
      content={
        <div className="group-page">
          <section className="group-sections">
            <div className="section-card">
              <h3>Our Purpose</h3>
              <p>We are a relationship bank for a digital world.</p>
            </div>
            <div className="section-card">
              <h3>Investors</h3>
              <p>Find the latest financial results, reports, and investor information.</p>
            </div>
            <div className="section-card">
              <h3>Careers</h3>
              <p>Join our team and help us build a better bank for the future.</p>
            </div>
          </section>
        </div>
      }
    />
  );
};

export default Group;
