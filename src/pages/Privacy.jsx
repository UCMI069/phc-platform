import React from 'react';
import { Link } from 'react-router-dom';
import './Legal.css';

const Privacy = () => {
  return (
    <main className="legal-page">
      <div className="legal-hero">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: January 2026</p>
      </div>

      <div className="legal-content">
        <section className="legal-card">
          <h2>Introduction</h2>
          <p>PHC Platform is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information when you use our website and services.</p>
          <p>By using phcplatform.org, you agree to the collection and use of information in accordance with this policy.</p>
        </section>

        <section className="legal-card">
          <h2>What We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul>
            <li><strong>Personal details</strong> — name, email address, phone number</li>
            <li><strong>Account information</strong> — username, password, preferences</li>
            <li><strong>Usage data</strong> — pages visited, time spent, links clicked</li>
            <li><strong>Technical data</strong> — IP address, browser type, device info</li>
            <li><strong>Cookies</strong> — tracking technologies used to improve your experience</li>
          </ul>
        </section>

        <section className="legal-card">
          <h2>How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul>
            <li>To provide and improve our website and services</li>
            <li>To process transactions and manage your account</li>
            <li>To send important updates about your account</li>
            <li>To detect and prevent fraud or unauthorised access</li>
            <li>To personalise your experience and content</li>
            <li>To meet legal and regulatory requirements</li>
          </ul>
        </section>

        <section className="legal-card">
          <h2>Sharing Your Information</h2>
          <p>We may share your data with trusted third parties who help us operate our services, including:</p>
          <ul>
            <li>Service providers who support our website and operations</li>
            <li>Regulatory bodies when required by law</li>
            <li>Partners where you have given us explicit consent</li>
          </ul>
          <p>We never sell your personal data to third parties.</p>
        </section>

        <section className="legal-card">
          <h2>How Long We Keep Your Data</h2>
          <p>We retain your personal information only for as long as necessary to fulfil the purposes described in this policy, or as required by law.</p>
        </section>

        <section className="legal-card">
          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
            <li><strong>Correct</strong> — ask us to fix any inaccurate or incomplete data</li>
            <li><strong>Delete</strong> — request that we erase your personal data</li>
            <li><strong>Restrict</strong> — ask us to limit how we process your data</li>
            <li><strong>Portability</strong> — receive your data in a structured, machine-readable format</li>
            <li><strong>Object</strong> — object to us processing your personal data</li>
          </ul>
        </section>

        <section className="legal-card">
          <h2>Cookies</h2>
          <p>We use cookies to improve your browsing experience. You can control cookies through your browser settings. For full details, see our <Link to="/cookies">Cookies Policy</Link>.</p>
        </section>

        <section className="legal-card">
          <h2>Changes to This Policy</h2>
          <p>We may update this policy from time to time. Any changes will be posted on this page. We encourage you to review this page periodically.</p>
        </section>

        <div className="legal-contact">
          <p>Questions? Email us at <a href="mailto:privacy@phcplatform.org">privacy@phcplatform.org</a></p>
        </div>
      </div>
    </main>
  );
};

export default Privacy;
