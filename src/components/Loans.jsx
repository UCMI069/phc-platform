import React, { useState } from 'react';
import { ChevronRight, ArrowRight, Zap, Clock, Lock, Headphones } from 'lucide-react';
import './Loans.css';

const features = [
  { icon: <Zap size={32} />, title: 'Fast decisions', desc: 'Get a decision in minutes with no impact on your credit score when you check your eligibility.', link: 'Check eligibility' },
  { icon: <Clock size={32} />, title: 'Flexible terms', desc: 'Borrow from £1,000 to £50,000 and choose a repayment term between 1 and 8 years.', link: 'Use the loan calculator' },
  { icon: <Lock size={32} />, title: 'Fixed monthly payments', desc: 'Know exactly what you\'ll pay each month — your rate is fixed for the life of the loan.', link: 'How loans work' },
];

const loanTypes = [
  {
    name: 'Personal Loan',
    tag: 'Most Popular',
    rate: '6.9% APR',
    rateNote: 'representative (variable)',
    desc: 'Borrow for almost anything — from a new car to home improvements or a dream holiday.',
    benefits: ['Borrow £1,000–£50,000', 'Terms from 1–8 years', 'Fixed monthly repayments', 'No early repayment fees on some products'],
    cta: 'Apply for a personal loan',
    highlight: true,
    dark: false,
  },
  {
    name: 'Debt Consolidation Loan',
    tag: null,
    rate: '6.9% APR',
    rateNote: 'representative (variable)',
    desc: 'Combine multiple debts into one manageable monthly payment at a lower rate.',
    benefits: ['Simplify your finances', 'One fixed monthly payment', 'Could reduce your monthly outgoings', 'Borrow £1,000–£50,000'],
    cta: 'Explore consolidation',
    highlight: false,
    dark: false,
  },
  {
    name: 'Home Improvement Loan',
    tag: 'Great for renovations',
    rate: '6.9% APR',
    rateNote: 'representative (variable)',
    desc: 'Add value to your home with a loan designed for renovations and improvements.',
    benefits: ['No security needed — unsecured loan', 'Quick application process', 'Borrow up to £50,000', 'Funds in your account fast'],
    cta: 'Explore home loans',
    highlight: false,
    dark: true,
  },
];

const Loans = () => {
  const [amount, setAmount] = useState(10000);
  const [term, setTerm] = useState(3);
  const rate = 6.9;
  const monthly = ((amount * (rate / 100 / 12)) / (1 - Math.pow(1 + rate / 100 / 12, -(term * 12)))).toFixed(2);
  const total = (monthly * term * 12).toFixed(2);

  return (
    <div className="loans-page">

      <section className="loans-hero">
        <div className="container">
          <div className="hero-content">
            <span className="badge">Loans</span>
            <h1>Borrow with confidence at a rate that works for you</h1>
            <p className="hero-lead">From <strong>6.9% APR representative</strong> — borrow up to £50,000 with fixed monthly payments and fast decisions.</p>
            <p className="hero-detail">Checking your eligibility won't affect your credit score.</p>
            <button className="btn-primary">Check my eligibility</button>
            <p className="legal-disclaimer">6.9% APR representative variable. The actual rate you receive depends on your circumstances. Loans are subject to status.</p>
          </div>

          <div className="loan-calculator">
            <p className="calc-label">Loan calculator</p>
            <div className="calc-field">
              <label>How much do you want to borrow?</label>
              <div className="range-value">£{amount.toLocaleString()}</div>
              <input type="range" min={1000} max={50000} step={500} value={amount} onChange={e => setAmount(Number(e.target.value))} />
              <div className="range-bounds"><span>£1,000</span><span>£50,000</span></div>
            </div>
            <div className="calc-field">
              <label>Over how many years?</label>
              <div className="range-value">{term} year{term > 1 ? 's' : ''}</div>
              <input type="range" min={1} max={8} step={1} value={term} onChange={e => setTerm(Number(e.target.value))} />
              <div className="range-bounds"><span>1 yr</span><span>8 yrs</span></div>
            </div>
            <div className="calc-result">
              <div className="result-item">
                <span className="result-label">Monthly repayment</span>
                <span className="result-value">£{monthly}</span>
              </div>
              <div className="result-divider" />
              <div className="result-item">
                <span className="result-label">Total repayable</span>
                <span className="result-value secondary">£{Number(total).toLocaleString()}</span>
              </div>
            </div>
            <p className="calc-disclaimer">This is an illustration only at 6.9% APR. Your actual rate may differ.</p>
          </div>
        </div>
      </section>

      <section className="loans-features">
        <div className="container">
          <h2 className="section-title">Why choose a PHC loan?</h2>
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
          <h2 className="section-title">Find the right loan for you</h2>
          <div className="accounts-grid">
            {loanTypes.map((l, i) => (
              <div key={i} className={`account-card ${l.highlight ? 'highlight' : ''} ${l.dark ? 'dark' : ''}`}>
                <div className="account-header"><h3>{l.name}</h3></div>
                {l.tag && <span className="account-tag">{l.tag}</span>}
                <div className="loan-rate">{l.rate} <small>{l.rateNote}</small></div>
                <p className="account-desc">{l.desc}</p>
                <ul className="account-benefits">
                  {l.benefits.map((b, j) => <li key={j}><ArrowRight size={14} /> {b}</li>)}
                </ul>
                <button className={l.dark ? 'btn-outline-white' : l.highlight ? 'btn-primary' : 'btn-outline'}>{l.cta}</button>
              </div>
            ))}
          </div>
          <p className="legal-disclaimer-small">Representative example: Borrow £10,000 over 3 years at 6.9% APR (fixed). Monthly repayment £308.42. Total amount repayable £11,103.12.</p>
        </div>
      </section>

      <section className="loans-support">
        <div className="container">
          <div className="support-grid">
            <div className="support-info">
              <h2>Have a question about loans?</h2>
              <p>Our team is here to help you understand your options and find the right loan for your needs.</p>
            </div>
            <div className="support-actions">
              <button className="btn-chat" onClick={() => window.openTawkChat?.()}><Headphones size={20} /> Chat to us via Webchat</button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Loans;
