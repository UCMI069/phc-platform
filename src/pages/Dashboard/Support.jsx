import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../context/NotificationContext';
import { 
  MessageCircle, 
  Mail, 
  Clock, 
  Send, 
  AlertCircle, 
  CheckCircle2,
  ChevronRight,
  LifeBuoy
} from 'lucide-react';
import './Support.css';

const FAQ_ITEMS = [
  {
    question: "How do I reset my transaction PIN?",
    answer: "You can reset your PIN through the 'Security' section in your account settings. For security reasons, you'll need to verify your identity via email."
  },
  {
    question: "What is the maximum daily transfer limit?",
    answer: "The standard daily limit for transfers is £25,000. You can request a limit increase by contacting our support team."
  },
  {
    question: "How long do international transfers take?",
    answer: "International transfers typically take 1-3 business days to reach the recipient's account, depending on the destination country and bank."
  }
];

const Support = () => {
  const { addNotification } = useNotification();
  const [profile, setProfile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    category: 'general',
    subject: '',
    message: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('profiles')
          .select('is_inactive')
          .eq('id', user.id)
          .single();
        setProfile(data || null);
      } catch {
        setProfile(null);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (profile?.is_inactive) {
      addNotification('Your account is inactive. Support requests are disabled.', 'error');
      return;
    }
    setSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('support_messages')
        .insert({
          user_id: user.id,
          category: formData.category,
          subject: formData.subject,
          message: formData.message,
          status: 'pending'
        });

      if (error) throw error;

      setSubmitted(true);
      setFormData({ subject: '', message: '', category: 'general' });
      addNotification("Your message has been sent successfully.", "success");
    } catch (err) {
      addNotification(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="support-container">
      <div className="support-header">
        <div className="header-icon"><LifeBuoy size={32} /></div>
        <h2>Help & Support</h2>
        <p>How can we help you today? Our team is available to assist with any questions.</p>
      </div>

      <div className="support-grid">
        <div className="support-main">
          {/* Support Form */}
          <div className="support-card form-card">
            <h3>Send us a message</h3>
            {profile?.is_inactive && (
              <div className="error-message">
                <AlertCircle size={16} /> Your account is inactive. You can view your dashboard, but you cannot submit support messages.
              </div>
            )}
            {submitted ? (
              <div className="success-state">
                <div className="success-icon"><CheckCircle2 size={48} /></div>
                <h4>Message Sent!</h4>
                <p>We've received your inquiry and will get back to you within 24 hours.</p>
                <button className="btn-outline" onClick={() => setSubmitted(false)}>Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="support-form">
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" value={formData.category} onChange={handleChange}>
                    <option value="general">General Inquiry</option>
                    <option value="transaction">Transaction Issue</option>
                    <option value="security">Security Concern</option>
                    <option value="loan">Loan Application</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input 
                    type="text" 
                    name="subject" 
                    placeholder="Brief summary of your issue"
                    value={formData.subject}
                    onChange={handleChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea 
                    name="message" 
                    rows="5" 
                    placeholder="Tell us more about how we can help..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="submit-support-btn" disabled={submitting || profile?.is_inactive}>
                  {submitting ? 'Sending...' : (
                    <>
                      <Send size={18} /> Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* FAQs */}
          <div className="support-card faq-card">
            <h3>Frequently Asked Questions</h3>
            <div className="faq-list">
              {FAQ_ITEMS.map((item, index) => (
                <div key={index} className="faq-item">
                  <div className="faq-question">
                    <span>{item.question}</span>
                    <ChevronRight size={16} />
                  </div>
                  <div className="faq-answer">{item.answer}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="support-sidebar">
          {/* Quick Contact */}
          <div className="support-card contact-card purple-theme">
            <h3>Quick Contact</h3>
            <div className="contact-list">
              <div className="contact-item chat-trigger" onClick={() => window.openTawkChat?.()} style={{ cursor: 'pointer' }}>
                <div className="contact-icon"><MessageCircle size={20} /></div>
                <div className="contact-info">
                  <strong>Live Chat</strong>
                  <p>Available in app</p>
                  <span>Mon-Fri, 9am-5pm</span>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon"><Mail size={20} /></div>
                <div className="contact-info">
                  <strong>Email Support</strong>
                  <p>support@gcuplatform.com</p>
                  <span>Response within 24h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="support-card status-card purple-theme">
            <div className="status-indicator online"></div>
            <div>
              <strong>System Status</strong>
              <p>All systems operational</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
