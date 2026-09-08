import React from 'react';
import PageTemplate from './PageTemplate';

const Banking = () => {
  return (
    <PageTemplate 
      title="Banking With Us" 
      description="Experience seamless and convenient banking with PHC."
      content={
        <div className="banking-page">
          <section className="banking-sections">
            <div className="section-card">
              <h3>Online Banking</h3>
              <p>Manage your accounts anytime, anywhere with our secure online platform.</p>
            </div>
            <div className="section-card">
              <h3>Mobile Banking App</h3>
              <p>Download our app for easy access to your finances on the go.</p>
            </div>
            <div className="section-card">
              <h3>Our Branches and ATMs</h3>
              <p>Find a branch or ATM near you for in-person banking needs.</p>
            </div>
          </section>
        </div>
      }
    />
  );
};

export default Banking;
