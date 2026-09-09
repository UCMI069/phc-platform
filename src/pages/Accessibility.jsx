import React from 'react';
import './Legal.css';

const Accessibility = () => {
  return (
    <main className="legal-page">
      <div className="legal-hero">
        <h1>Accessibility</h1>
        <p className="legal-updated">Last updated: January 2026</p>
      </div>

      <div className="legal-content">
        <section className="legal-card">
          <h2>Our Commitment</h2>
          <p>PHC Platform is committed to making our website accessible to everyone, including people with disabilities. We follow recognised accessibility standards and continuously work to improve the user experience for all visitors.</p>
        </section>

        <section className="legal-card">
          <h2>What We Do</h2>
          <ul>
            <li><strong>Screen reader support</strong> — our site works with JAWS, NVDA, and VoiceOver</li>
            <li><strong>Keyboard navigation</strong> — every feature is accessible using only a keyboard</li>
            <li><strong>Text resizing</strong> — content remains usable at up to 200% zoom</li>
            <li><strong>Colour contrast</strong> — we meet WCAG 2.1 AA contrast requirements</li>
            <li><strong>Image descriptions</strong> — all meaningful images include alt text</li>
            <li><strong>Clear headings</strong> — consistent heading structure throughout the site</li>
          </ul>
        </section>

        <section className="legal-card">
          <h2>WCAG 2.1 Level AA</h2>
          <p>Our website aims to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA. These guidelines ensure content is:</p>
          <ul>
            <li><strong>Perceivable</strong> — information can be presented in ways all users can understand</li>
            <li><strong>Operable</strong> — navigation and controls work for everyone</li>
            <li><strong>Understandable</strong> — content and interface are easy to comprehend</li>
            <li><strong>Robust</strong> — compatible with current and future assistive technologies</li>
          </ul>
        </section>

        <section className="legal-card">
          <h2>Get in Touch</h2>
          <p>If you experience any difficulty accessing our website or have suggestions for improvement, please let us know:</p>
          <ul>
            <li>Email: <a href="mailto:accessibility@phcplatform.org">accessibility@phcplatform.org</a></li>
            <li>Phone: <a href="tel:+18005551234">+1-800-555-1234</a></li>
          </ul>
          <p>We aim to respond to all accessibility feedback within 5 working days.</p>
        </section>
      </div>
    </main>
  );
};

export default Accessibility;
