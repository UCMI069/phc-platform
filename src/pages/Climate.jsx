import React from 'react';
import PageTemplate from './PageTemplate';

const Climate = () => {
  return (
    <PageTemplate 
      title="Climate" 
      description="Our commitment to environmental sustainability and climate action."
      content={
        <div className="climate-page">
          <section className="climate-sections">
            <div className="section-card">
              <h3>Our Climate Strategy</h3>
              <p>Learn about our goals and initiatives to reduce our environmental impact.</p>
            </div>
            <div className="section-card">
              <h3>Sustainable Finance</h3>
              <p>Find out how we support sustainable businesses and projects.</p>
            </div>
            <div className="section-card">
              <h3>Greener Home and Transport</h3>
              <p>Discover our range of greener financial products and tools.</p>
            </div>
          </section>
        </div>
      }
    />
  );
};

export default Climate;
