import React from 'react';
import './MoreFromGCU.css';

const MoreFromGCU = () => {
  return (
    <section className="more-from-gcu">
      <div className="container">
        <h3>More from PHC</h3>
        
        <div className="more-grid">
          <div className="more-card">
            <div className="card-image">
              <img src="/images/team-gb-partner.jpg" alt="Team GB Partnership" className="placeholder-img" />
            </div>
            <div className="card-content">
              <h3>We're proud to partner with Team GB</h3>
              <p>Find out more about our partnership with Team GB and how we're supporting athletes.</p>
            </div>
          </div>
          
          <div className="more-card">
            <div className="card-image">
              <img src="/images/cost-of-living.jpg" alt="Cost of Living Support" className="placeholder-img" />
            </div>
            <div className="card-content">
              <h3>Help with the cost of living</h3>
              <p>The cost of living has increased in recent months. Find out what help and support is available for you.</p>
            </div>
          </div>
          
          <div className="more-card">
            <div className="card-image">
              <img src="/images/energy-efficiency.jpg" alt="Energy Efficiency" className="placeholder-img" />
            </div>
            <div className="card-content">
              <h3>Support with energy efficiency</h3>
              <p>Improving your home's energy efficiency could help you save money on your bills.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MoreFromGCU;
