import React from 'react';
import './Reviews.css';

const reviews = [
  {
    name: 'Mark',
    image: '/mark.jpg',
    rating: 5,
    text: 'PHC has been my go-to for managing my account. Checking balances, paying bills, and downloading statements without any hassle. Optimized for security and convenience.',
  },
  {
    name: 'David',
    image: '/david.jpg',
    rating: 5,
    text: 'The app and website are responsive and customer service is helpful. Setting up direct debits and savings goals was straightforward. A solid, no-nonsense banking platform.',
  },
  {
    name: 'Victor',
    image: '/victor.jpg',
    rating: 5,
    text: 'Managing my account is simple. Transfers, card controls, and spending insights are all in one place. Enabled fraud alerts and mobile notifications. Zero technical issues.',
  },
  {
    name: 'Moses',
    image: '/moses.jpg',
    rating: 5,
    text: 'PHC handles everything from balance checks to standing orders smoothly. Linked it with other financial tools. Now my primary bank for daily use.',
  },
];

const Reviews = () => {
  return (
    <section className="reviews-section">
      <div className="container">
        <h2 className="reviews-title">What our customers say</h2>
        <p className="reviews-subtitle">Trusted by millions for everyday banking</p>
      </div>

      <div className="reviews-scroll-container">
        <div className="reviews-track">
          {reviews.map((review) => (
            <div key={review.name} className="review-card">
              <div className="review-header">
                <img
                  src={review.image}
                  alt={review.name}
                  className="review-avatar"
                />
                <div className="review-meta">
                  <p className="review-name">{review.name}</p>
                  <div className="review-stars">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <span key={i} className="star">&#9733;</span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="review-text">{review.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
