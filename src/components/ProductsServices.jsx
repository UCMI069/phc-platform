import React from 'react';
import './ProductsServices.css';

const ProductsServices = () => {
  return (
    <section className="products-services">
      <div className="container">
        <h2 className="section-title">Explore our products and services</h2>
        
        <div className="services-grid">
          <div className="service-column">
            <h3>Our products</h3>
            <ul>
              <li>Current Accounts</li>
              <li>Savings</li>
              <li>Investing</li>
              <li>Mortgages</li>
              <li>Credit Cards</li>
              <li>Loans</li>
              <li>Overdrafts</li>
              <li>Home Insurance</li>
              <li>Life insurance</li>
            </ul>
          </div>
          
          <div className="service-column">
            <h3>Help and Support</h3>
            <ul>
              <li>Struggling financially</li>
              <li>Bank of England base rate changes</li>
              <li>Get a Financial Health-check</li>
              <li>Bereavement support</li>
              <li>Ways to bank with us</li>
              <li>Manage my debt</li>
              <li>Help avoiding scams</li>
              <li>Our commitment to accessibility</li>
              <li>Support Centre</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductsServices;
