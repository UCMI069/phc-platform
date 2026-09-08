import React, { useState } from 'react';
import { ChevronRight, ArrowRight, Home, Calculator, Users, Headphones } from 'lucide-react';
import './Mortgages.css';

const features = [
  {
    icon: <Home size={32} />,
    title: 'First time buyer support',
    desc: 'We guide you through every step of buying your first home, from understanding your budget to getting the keys.',
    link: 'First time buyer guide',
  },
  {
    icon: <Calculator size={32} />,
    title: 'Mortgage calculator',
    desc: 'Use our free calculator to see how much you could borrow and what your monthly repayments might look like.',
    link: 'Try the calculator',
  },
  {
    icon: <Users size={32} />,
    title: 'Expert advisers',
    desc: 'Speak to one of our qualified mortgage advisers — in branch or via video call.',
    link: 'Book an appointment',
  },
];

const products = [
  {
    name: 'Fixed Rate Mortgage',
    tag: 'Most Popular',
    desc: 'Your interest rate stays the same for a set period, so your monthly payments are predictable.',
    benefits: [
      '2, 3 and 5 year fixed terms available',
      'Certainty on monthly repayments',
      'Available for purchase and remortgage',
    ],
    cta: 'View fixed rate deals',
    dark: false,
    highlight: true,
  },
  {
    name: 'Tracker Mortgage',
    tag: null,
    desc: 'Your rate tracks the Bank of England base rate, meaning your payments can go up or down.',
    benefits: [
      'No early repayment charges on some deals',
      'Could benefit from rate cuts',
      'Available for purchase and remortgage',
    ],
    cta: 'View tracker deals',
    dark: false,
    highlight: false,
  },
  {
    name: 'Remortgage',
    tag: 'Save more',
    desc: 'Switching to a new deal could lower your monthly payments or let you release equity from your home.',
    benefits: [
      'Compare your current deal vs new rates',
      'Free standard legal fees on some products',
      'No valuation fee on selected deals',
    ],
    cta: 'Explore remortgage',
    dark: true,
    highlight: false,
  },
];

const faqs = [
  { q: 'How much can I borrow?', a: 'Most lenders offer up to 4.5x your annual income, though this depends on your circumstances, credit score and outgoings.' },
  { q: 'What is a mortgage in principle?', a: 'A mortgage in principle (MIP) is an indication of how much we may lend you. It does not affect your credit score and helps you understand your budget.' },
  { q: 'How long does a mortgage application take?', a: 'Once we receive all the required documents, applications typically take 2–4 weeks to process, depending on complexity.' },
  { q: 'Can I make overpayments?', a: 'Yes — on most of our mortgage products you can overpay up to 10% of the outstanding balance per year without early repayment charges.' },
];

const Mortgages = () => {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="mortgages-page">

      {/* ── Hero ── */}
      <section className="mortgages-hero">
        <div className="container">
          <div className="hero-content">
            <span className="badge">Mortgages</span>
            <h1>Find the mortgage that's right for you</h1>
            <p className="hero-lead">Whether you're buying your first home, moving, or remortgaging — we have competitive rates and expert support every step of the way.</p>
            <p className="hero-detail">Speak to an adviser or use our online tools to explore your options in minutes.</p>
            <div className="hero-actions">
              <button className="btn-primary">Get a mortgage in principle</button>
              <button className="btn-secondary">Use the calculator</button>
            </div>
            <p className="legal-disclaimer">Your home may be repossessed if you do not keep up repayments on your mortgage. Eligibility and lending criteria apply.</p>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <span className="stat-value">4.39%</span>
              <span className="stat-label">2 Year Fixed Rate from</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-card">
              <span className="stat-value">3.94%</span>
              <span className="stat-label">5 Year Fixed Rate from</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-card">
              <span className="stat-value">95%</span>
              <span className="stat-label">Max LTV available</span>
            </div>
            <p className="stat-disclaimer">Rates correct as of March 2026. Subject to eligibility.</p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mortgages-features">
        <div className="container">
          <h2 className="section-title">Why choose PHC for your mortgage?</h2>
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

      {/* ── Products ── */}
      <section className="account-options">
        <div className="container">
          <h2 className="section-title">Explore our mortgage types</h2>
          <div className="accounts-grid">
            {products.map((p, i) => (
              <div key={i} className={`account-card ${p.highlight ? 'highlight' : ''} ${p.dark ? 'dark' : ''}`}>
                <div className="account-header">
                  <h3>{p.name}</h3>
                </div>
                {p.tag && <span className="account-tag">{p.tag}</span>}
                <p className="account-desc">{p.desc}</p>
                <ul className="account-benefits">
                  {p.benefits.map((b, j) => (
                    <li key={j}><ArrowRight size={14} /> {b}</li>
                  ))}
                </ul>
                <button className={p.dark ? 'btn-outline-white' : p.highlight ? 'btn-primary' : 'btn-outline'}>{p.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="mortgage-steps">
        <div className="container">
          <h2 className="section-title">How to apply for a mortgage</h2>
          <div className="steps-grid">
            {[
              { num: '01', title: 'Check your credit score', desc: 'A healthy credit score improves your chances of getting a better rate.' },
              { num: '02', title: 'Get a mortgage in principle', desc: 'Find out how much you could borrow in minutes — no impact on your credit score.' },
              { num: '03', title: 'Find your home', desc: 'Search with confidence knowing your budget upfront.' },
              { num: '04', title: 'Make a full application', desc: 'Our advisers guide you through the paperwork and legal process.' },
            ].map((s, i) => (
              <div key={i} className="step-card">
                <span className="step-num">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mortgage-faq">
        <div className="container">
          <h2 className="section-title">Common questions</h2>
          <div className="faq-list">
            {faqs.map((f, i) => (
              <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="faq-question">
                  <span>{f.q}</span>
                  <ChevronRight size={20} className="faq-chevron" />
                </div>
                {openFaq === i && <p className="faq-answer">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Support ── */}
      <section className="mortgages-support">
        <div className="container">
          <div className="support-grid">
            <div className="support-info">
              <h2>Talk to a mortgage adviser</h2>
              <p>Our advisers are available in branch or via video call to help you find the right deal.</p>
            </div>
            <div className="support-actions">
              <button className="btn-chat" onClick={() => window.openTawkChat?.()}><Headphones size={20} /> Book an appointment</button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Mortgages;
