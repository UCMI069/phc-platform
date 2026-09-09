import React from 'react';
import { ChevronRight, ArrowRight, TrendingUp, ShieldCheck, BarChart2, Headphones } from 'lucide-react';
import './Investments.css';

const features = [
  { icon: <TrendingUp size={32} />, title: 'Grow your wealth', desc: 'Investing gives your money the potential to grow faster than a standard savings account over the long term.', link: 'Why invest?' },
  { icon: <ShieldCheck size={32} />, title: 'Managed by experts', desc: 'Our investment solutions are delivered and managed by Coutts.', link: 'About Coutts' },
  { icon: <BarChart2 size={32} />, title: 'Transparent fees', desc: 'No hidden charges — we clearly show you all costs before you invest so you always know where you stand.', link: 'Our charges' },
];

const products = [
  {
    name: 'Stocks & Shares ISA',
    tag: 'Tax-efficient',
    desc: 'Invest up to £20,000 per tax year and keep all your returns free from UK tax.',
    benefits: ['No UK income or capital gains tax', 'Choose from ready-made or self-select funds', 'Flexible — withdraw anytime', 'From £50/month or £500 lump sum'],
    cta: 'Open a Stocks & Shares ISA',
    highlight: true,
    dark: false,
  },
  {
    name: 'General Investment Account',
    tag: null,
    desc: 'Invest without the ISA limit — ideal if you\'ve used your annual allowance.',
    benefits: ['No contribution limit', 'Wide range of funds and shares', 'Full control over your portfolio', 'Transfer your ISA in easily'],
    cta: 'Open an investment account',
    highlight: false,
    dark: false,
  },
  {
    name: 'Ready-Made Investments',
    tag: 'Great for beginners',
    desc: 'Let our experts do the hard work. Choose a risk level and we\'ll manage a diversified portfolio for you.',
    benefits: ['Choose Cautious, Balanced or Adventurous', 'Managed by Coutts investment experts', 'Start from £500 lump sum', 'Automatic rebalancing'],
    cta: 'Explore ready-made',
    highlight: false,
    dark: true,
  },
];

const riskLevels = [
  { level: 'Cautious', color: '#3fbc4c', desc: 'Lower potential returns, lower risk of loss. Suits shorter time horizons.' },
  { level: 'Balanced', color: '#ff6a00', desc: 'A mix of growth and stability. Suits medium-term investors.' },
  { level: 'Adventurous', color: '#1E3A8A', desc: 'Higher potential returns with greater risk. Suits long-term investors.' },
];

const Investments = () => (
  <div className="investments-page">

    <section className="investments-hero">
      <div className="container">
        <div className="hero-content">
          <span className="badge">Investments</span>
          <h1>Start investing and build your financial future</h1>
          <p className="hero-lead">Put your money to work with our range of ISAs and investment accounts — managed by experts at Coutts.</p>
          <p className="hero-detail">Whether you're a first-time investor or experienced, we have an option for you.</p>
          <button className="btn-primary">Explore investment options</button>
          <p className="legal-disclaimer">When investing, your capital is at risk. The value of investments can go down as well as up, and you may get back less than you invest. T&Cs, fees and charges apply.</p>
        </div>
        <div className="hero-risk-panel">
          <p className="panel-label">Choose your risk level</p>
          {riskLevels.map((r, i) => (
            <div key={i} className="risk-row">
              <div className="risk-dot" style={{ backgroundColor: r.color }} />
              <div className="risk-text">
                <span className="risk-level">{r.level}</span>
                <span className="risk-desc">{r.desc}</span>
              </div>
            </div>
          ))}
          <div className="risk-bar">
            <div className="risk-bar-fill" />
            <div className="risk-labels">
              <span>Lower risk</span>
              <span>Higher risk</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="investments-features">
      <div className="container">
        <h2 className="section-title">Why invest with PHC?</h2>
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
        <h2 className="section-title">Our investment products</h2>
        <div className="accounts-grid">
          {products.map((p, i) => (
            <div key={i} className={`account-card ${p.highlight ? 'highlight' : ''} ${p.dark ? 'dark' : ''}`}>
              <div className="account-header"><h3>{p.name}</h3></div>
              {p.tag && <span className="account-tag">{p.tag}</span>}
              <p className="account-desc">{p.desc}</p>
              <ul className="account-benefits">
                {p.benefits.map((b, j) => <li key={j}><ArrowRight size={14} /> {b}</li>)}
              </ul>
              <button className={p.dark ? 'btn-outline-white' : p.highlight ? 'btn-primary' : 'btn-outline'}>{p.cta}</button>
            </div>
          ))}
        </div>
        <p className="legal-disclaimer-small">When investing, your capital is at risk. Investment values can fall as well as rise. Past performance is not a guide to future performance. Fees apply.</p>
      </div>
    </section>

    <section className="investments-support">
      <div className="container">
        <div className="support-grid">
          <div className="support-info">
            <h2>Talk to an investment specialist</h2>
            <p>Our Coutts-backed advisers can help you build a strategy aligned to your goals and risk appetite.</p>
          </div>
          <div className="support-actions">
            <button className="btn-chat" onClick={() => window.openTawkChat?.()}><Headphones size={20} /> Chat to us via Webchat</button>
          </div>
        </div>
      </div>
    </section>

  </div>
);

export default Investments;
