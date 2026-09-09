import React from 'react';
import './Legal.css';

const Terms = () => {
  return (
    <main className="legal-page">
      <div className="legal-hero">
        <h1>Website Terms & Conditions</h1>
        <p className="legal-updated">Last updated: January 2026</p>
      </div>

      <div className="legal-content">
        <section className="legal-card">
          <h2>Agreement to Terms</h2>
          <p>By accessing or using phcplatform.org, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our website.</p>
        </section>

        <section className="legal-card">
          <h2>Acceptable Use</h2>
          <p>When using our website, you must not:</p>
          <ul>
            <li>Use the site for any unlawful or fraudulent purpose</li>
            <li>Attempt to gain unauthorised access to any part of the site</li>
            <li>Interfere with or disrupt the site, servers, or networks</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Transmit any harmful, offensive, or objectionable content</li>
          </ul>
        </section>

        <section className="legal-card">
          <h2>Intellectual Property</h2>
          <p>All content on this website — including text, graphics, logos, images, and software — is the property of PHC Platform and is protected by copyright law.</p>
          <p>You may not copy, modify, distribute, or sell any material from this site without our written permission.</p>
        </section>

        <section className="legal-card">
          <h2>User Content</h2>
          <p>If you post, upload, or submit any content through our website, you are responsible for that content. We reserve the right to remove any content that violates these terms.</p>
        </section>

        <section className="legal-card">
          <h2>Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, PHC Platform is not liable for any indirect, incidental, or consequential damages arising from your use of this website. This includes loss of profits, data, or business opportunities.</p>
        </section>

        <section className="legal-card">
          <h2>Indemnity</h2>
          <p>You agree to indemnify and hold harmless PHC Platform and its officers, directors, and employees from any claims, losses, or expenses arising from your use of the site or violation of these terms.</p>
        </section>

        <section className="legal-card">
          <h2>Governing Law</h2>
          <p>These terms are governed by the laws of the jurisdiction in which PHC Platform operates. Any disputes will be subject to the exclusive jurisdiction of the courts in that jurisdiction.</p>
        </section>

        <div className="legal-contact">
          <p>Questions? Email us at <a href="mailto:legal@phcplatform.org">legal@phcplatform.org</a></p>
        </div>
      </div>
    </main>
  );
};

export default Terms;
