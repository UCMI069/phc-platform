import React from 'react';
import PageTemplate from './PageTemplate';

const Help = () => {
  return (
    <PageTemplate 
      title="Help and Support" 
      description="Find the help you need, from account queries to technical support."
      content={
        <div className="help-page">
          <section className="help-sections">
            <div className="section-card">
              <h3>Frequently Asked Questions</h3>
              <p>Find quick answers to common banking questions.</p>
            </div>
            <div className="section-card">
              <h3>Contact Us</h3>
              <p>Get in touch with our support team via chat or email.</p>
            </div>
            <div className="section-card">
              <h3>Security and Fraud Support</h3>
              <p>Report fraud or get advice on staying safe online.</p>
            </div>
          </section>
        </div>
      }
    />
  );
};

export default Help;
