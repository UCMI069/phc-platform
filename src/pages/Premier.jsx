import React from 'react';
import { ChevronRight, ArrowRight, Star, Shield, Smartphone, Headphones, MapPin, ExternalLink } from 'lucide-react';
import './Premier.css';

const Premier = () => {
  return (
    <div className="premier-page">
      {/* Hero Section */}
      <section className="premier-hero">
        <div className="container">
          <div className="hero-content">
            <span className="badge">Premier</span>
            <h1>The switch worth making</h1>
            <p className="hero-lead">You could get up to Â£1,000 when you switch to PHC Premier.</p>
            <p className="hero-detail">Thatâ€™s Â£250 for switching to a Premier account, plus Â£750 in interest if you deposit Â£100k into a new Flexible Saver account.</p>
            <div className="hero-actions">
              <button className="btn-primary">View accounts</button>
            </div>
            <p className="legal-disclaimer">Premier criteria, T&Cs and restrictions apply. Limited availability.</p>
          </div>
        </div>
      </section>

      {/* Criteria Section */}
      <section className="premier-criteria">
        <div className="container">
          <h2>To join Premier youâ€™ll need one or more of the following:</h2>
          <div className="criteria-grid">
            <div className="criteria-card">
              <div className="criteria-icon">ðŸ’°</div>
              <p>Minimum of Â£100k sole income or Â£120k joint income paid into your PHC account.</p>
            </div>
            <div className="criteria-card">
              <div className="criteria-icon">ðŸ“ˆ</div>
              <p>Minimum of Â£100k savings or investments held with PHC.</p>
            </div>
            <div className="criteria-card">
              <div className="criteria-icon">ðŸ </div>
              <p>Minimum Â£500k mortgage with PHC.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="premier-benefits">
        <div className="container">
          <h2 className="section-title">Our Premier banking members get more</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon"><Star size={32} /></div>
              <h3>Financial planning</h3>
              <p>Investment advice and support to make big financial decisions. Helping you and your family realise your life dreams. All our investment solutions are delivered and managed by Coutts.</p>
              <a href="#planning" className="benefit-link">Financial planning & advice <ChevronRight size={16} /></a>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon"><Shield size={32} /></div>
              <h3>Exclusive support</h3>
              <p>A team of real people on hand to guide you. Get access to expert help for any questions you have and support to reach your goals.</p>
              <a href="#manager" className="benefit-link">Premier banking manager <ChevronRight size={16} /></a>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon"><Smartphone size={32} /></div>
              <h3>Everyday banking</h3>
              <p>Rewards designed for you and your family on things that matter, from airport lounge access and worldwide travel insurance to mobile phone cover.</p>
              <a href="#compare" className="benefit-link">Compare Premier accounts <ChevronRight size={16} /></a>
            </div>
          </div>
          <p className="legal-disclaimer-small">Specific eligibility and fees apply for this service. Eligibility criteria and fees apply. Please contact customer service for details.</p>
        </div>
      </section>

      {/* Account Options Section */}
      <section className="account-options">
        <div className="container">
          <div className="option-card featured">
            <div className="option-header">
              <h3>Premier Select</h3>
              <span className="price">Â£0 <small>a month</small></span>
            </div>
            <p className="option-tag">Eligible for our Premier Switch offer. T&Cs apply.</p>
            <p>Get 24/7 support from Premier 24 and help to invest in your future.</p>
            <ul className="option-benefits">
              <li><ArrowRight size={16} /> No non-Sterling transaction fee when you make a payment outside the UK or in a foreign currency.</li>
              <li><ArrowRight size={16} /> Arranged overdraft with Â£500 interest-free buffer available (subject to status).</li>
            </ul>
            <button className="btn-outline">Go to Premier Select</button>
          </div>

          <div className="option-card highlight">
            <div className="option-header">
              <h3>Premier Reward</h3>
              <span className="price">Â£2 <small>a month</small></span>
            </div>
            <p className="option-tag">Eligible for our Premier Switch offer. T&Cs apply.</p>
            <p>Get 24/7 support from Premier 24 and help to invest in your future.</p>
            <ul className="option-benefits">
              <li><ArrowRight size={16} /> Â£9 a month back in Rewards for 2 Direct Debits.</li>
              <li><ArrowRight size={16} /> Â£1 a month in Rewards just for logging into our mobile app.</li>
              <li><ArrowRight size={16} /> Earn at least 1% at partner retailers.</li>
            </ul>
            <button className="btn-primary">Go to Premier Reward</button>
          </div>

          <div className="option-card dark">
            <div className="option-header">
              <h3>Premier Reward Black</h3>
              <span className="price">Â£36 <small>a month</small></span>
            </div>
            <p>All the features of our Select and Reward accounts plus exclusive travel and lifestyle benefits.</p>
            <ul className="option-benefits">
              <li><ArrowRight size={16} /> 24/7 Concierge Service for VIP access.</li>
              <li><ArrowRight size={16} /> Worldwide family travel insurance & Airport lounge access.</li>
              <li><ArrowRight size={16} /> UK and European car breakdown cover.</li>
            </ul>
            <button className="btn-outline-white">Go to Premier Reward Black</button>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="premier-support">
        <div className="container">
          <div className="support-grid">
            <div className="support-info">
              <h2>We're ready to help you</h2>
              <p>Chat to us to arrange an appointment with a Premier Manager or get help with your banking.</p>
            </div>
            <div className="support-actions">
              <button className="btn-chat" onClick={() => window.openTawkChat?.()}><MessageCircle size={20} /> Chat to us via Webchat</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Premier;
