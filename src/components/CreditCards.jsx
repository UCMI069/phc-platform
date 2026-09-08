import React from 'react';
import { ChevronRight, ArrowRight, Star, ShieldCheck, Gift, Headphones } from 'lucide-react';
import './CreditCards.css';

const features = [
  { icon: <Gift size={32} />, title: 'Earn rewards', desc: 'Get cashback, Rewards points or travel perks just for spending on everyday purchases.', link: 'About Rewards' },
  { icon: <ShieldCheck size={32} />, title: 'Purchase protection', desc: 'Section 75 protection on purchases between £100 and £30,000 when you pay by credit card.', link: 'About Section 75' },
  { icon: <Star size={32} />, title: 'Manage in the app', desc: 'Freeze your card, view your balance, set a PIN and pay your bill — all from the PHC Mobile App.', link: 'Download the app' },
];

const cards = [
  {
    name: 'Reward Credit Card',
    tag: 'Most Popular',
    apr: '24.9% APR (variable)',
    desc: 'Earn Rewards on every purchase and redeem them for cashback, gift cards or travel.',
    benefits: ['0.5% Rewards on everyday spending', '1% Rewards at partner retailers', 'No annual fee', 'Contactless & Apple/Google Pay'],
    cta: 'Apply now',
    highlight: true,
    dark: false,
  },
  {
    name: 'Reward Black Credit Card',
    tag: 'Premium',
    apr: '29.9% APR (variable)',
    desc: 'Our premium card with enhanced Rewards, travel perks and worldwide cover.',
    benefits: ['1% Rewards on all spending', 'Airport lounge access via DragonPass', 'Worldwide travel insurance', 'Concierge service'],
    cta: 'Apply now',
    highlight: false,
    dark: true,
  },
  {
    name: 'Balance Transfer Card',
    tag: null,
    apr: '22.9% APR (variable)',
    desc: 'Move existing balances and pay less interest with our 0% balance transfer offer.',
    benefits: ['0% on balance transfers for 20 months', '3% balance transfer fee applies', 'No annual fee', 'Manage your account in app'],
    cta: 'Apply now',
    highlight: false,
    dark: false,
  },
];

const CreditCards = () => (
  <div className="credit-cards-page">

    <section className="cc-hero">
      <div className="container">
        <div className="hero-content">
          <span className="badge">Credit Cards</span>
          <h1>A credit card that works as hard as you do</h1>
          <p className="hero-lead">Earn Rewards on everyday spending, enjoy purchase protection and manage everything in our award-winning app.</p>
          <p className="hero-detail">Representative example: £1,200 credit limit, 24.9% APR variable.</p>
          <button className="btn-primary">Compare credit cards</button>
          <p className="legal-disclaimer">Credit is subject to status. Terms and conditions apply. PHC is responsible for the credit agreement.</p>
        </div>
        <div className="hero-card-visual">
          <div className="mock-card">
            <div className="mock-card-chip" />
            <div className="mock-card-logo">PHC</div>
            <div className="mock-card-number">•••• •••• •••• 1234</div>
            <div className="mock-card-footer">
              <span>REWARDS</span>
              <span>VALID THRU 12/28</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="cc-features">
      <div className="container">
        <h2 className="section-title">Why choose a PHC credit card?</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <a href="#" className="feature-link">{f.link} <ChevronRight size={16} /></a>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="account-options">
      <div className="container">
        <h2 className="section-title">Choose your card</h2>
        <div className="accounts-grid">
          {cards.map((c, i) => (
            <div key={i} className={`account-card ${c.highlight ? 'highlight' : ''} ${c.dark ? 'dark' : ''}`}>
              <div className="account-header">
                <h3>{c.name}</h3>
              </div>
              {c.tag && <span className="account-tag">{c.tag}</span>}
              <span className="apr-label">{c.apr}</span>
              <p className="account-desc">{c.desc}</p>
              <ul className="account-benefits">
                {c.benefits.map((b, j) => <li key={j}><ArrowRight size={14} /> {b}</li>)}
              </ul>
              <button className={c.dark ? 'btn-outline-white' : c.highlight ? 'btn-primary' : 'btn-outline'}>{c.cta}</button>
            </div>
          ))}
        </div>
        <p className="legal-disclaimer-small">Credit is subject to status. The representative APR shown is the rate at least 51% of those accepted will receive. Your rate may differ.</p>
      </div>
    </section>

    <section className="cc-eligibility">
      <div className="container">
        <h2 className="section-title">Check your eligibility</h2>
        <div className="eligibility-grid">
          {[
            { icon: '✅', title: 'No impact on your credit score', desc: 'Our eligibility checker uses a soft search so it won\'t affect your credit rating.' },
            { icon: '⚡', title: 'Instant results', desc: 'Find out in minutes whether you\'re likely to be approved before you apply.' },
            { icon: '🔒', title: 'Safe and secure', desc: 'Your information is kept completely private and secure.' },
          ].map((e, i) => (
            <div key={i} className="eligibility-card">
              <span className="eligibility-icon">{e.icon}</span>
              <h3>{e.title}</h3>
              <p>{e.desc}</p>
            </div>
          ))}
        </div>
        <div className="eligibility-cta">
          <button className="btn-primary">Check my eligibility</button>
        </div>
      </div>
    </section>

    <section className="cc-support">
      <div className="container">
        <div className="support-grid">
          <div className="support-info">
            <h2>Need help choosing?</h2>
            <p>Our team can help you find the right card for your spending habits and lifestyle.</p>
          </div>
          <div className="support-actions">
            <button className="btn-chat" onClick={() => window.openTawkChat?.()}><Headphones size={20} /> Chat to us via Webchat</button>
          </div>
        </div>
      </div>
    </section>

  </div>
);

export default CreditCards;
