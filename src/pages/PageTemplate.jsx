import React from 'react';
import './PageTemplate.css';

const PageTemplate = ({ title, description, content }) => {
  return (
    <div className="page-template">
      <div className="page-header">
        <div className="container">
          <h1>{title}</h1>
          {description && <p className="description">{description}</p>}
        </div>
      </div>
      <div className="page-content container">
        {content ? content : (
          <div className="placeholder-content">
            <p>We are currently updating our {title} page to provide you with the best experience.</p>
            <p>Please check back soon for more information about our services and offerings.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageTemplate;
