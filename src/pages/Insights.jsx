import React from 'react';
import PageTemplate from './PageTemplate';

const Insights = () => {
  return (
    <PageTemplate 
      title="Insights" 
      description="Financial insights and trends to help you make informed decisions."
      content={
        <div className="insights-page">
          <section className="insight-sections">
            <div className="section-card">
              <h3>Market Trends</h3>
              <p>Discover the latest market trends and how they may affect you.</p>
            </div>
            <div className="section-card">
              <h3>Expert Analysis</h3>
              <p>Get expert analysis and insights on various financial topics.</p>
            </div>
            <div className="section-card">
              <h3>Future Outlook</h3>
              <p>Learn about our outlook for the future of banking and finance.</p>
            </div>
          </section>
        </div>
      }
    />
  );
};

export default Insights;
