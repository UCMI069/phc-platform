import React, { useState, useEffect } from 'react';
import { neon as supabase } from '../../lib/neon';
import { CreditCard, ArrowRight, CheckCircle2, AlertCircle, Loader2, X, Info } from 'lucide-react';
import './CreditCardRequest.css';

const CARD_TIERS = [
  {
    tier: 'starter',
    name: 'Starter Card',
    price: 430,
    description: 'Entry level credit card for everyday spending',
    colorScheme: { primary: '#6366f1', secondary: '#818cf8', accent: '#f8fafc' },
    benefits: [
      '1% cashback on all purchases',
      'No annual fee',
      'Fraud protection',
      'Mobile app access'
    ]
  },
  {
    tier: 'premium',
    name: 'Premium Card',
    price: 1800,
    description: 'Premium credit card with enhanced rewards',
    colorScheme: { primary: '#0891b2', secondary: '#06b6d4', accent: '#f0fdfa' },
    benefits: [
      '2% cashback on all purchases',
      'Travel insurance',
      'Airport lounge access (2 visits/year)',
      'Priority support',
      'No foreign transaction fees'
    ]
  },
  {
    tier: 'master',
    name: 'Master Card',
    price: 2350,
    description: 'High-end credit card with premium benefits',
    colorScheme: { primary: '#7c2d12', secondary: '#ea580c', accent: '#fef3f2' },
    benefits: [
      '3% cashback on all purchases',
      'Comprehensive travel insurance',
      'Unlimited airport lounge access',
      'Concierge service',
      'Purchase protection',
      'No foreign transaction fees'
    ]
  },
  {
    tier: 'gold',
    name: 'Gold Card',
    price: 5520,
    description: 'Ultimate prestige credit card with exclusive privileges',
    colorScheme: { primary: '#f59e0b', secondary: '#fbbf24', accent: '#fffbeb' },
    benefits: [
      '5% cashback on all purchases',
      'Premium travel insurance',
      'Unlimited airport lounge access + guest',
      '24/7 dedicated concierge',
      'Purchase protection',
      'Extended warranty',
      'No foreign transaction fees',
      'Exclusive event access'
    ]
  }
];

const CreditCardRequest = () => {
  const [cards, setCards] = useState(CARD_TIERS);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userCards, setUserCards] = useState([]);

  useEffect(() => {
    fetchCards();
    fetchUserCards();
  }, []);

  const fetchCards = async () => {
    try {
      const res = await fetch('/api/admin/credit-card-prices');
      const data = await res.json();
      if (data.prices) {
        setCards(data.prices.map(p => ({
          tier: p.tier,
          name: p.name,
          price: Number(p.price),
          description: p.description,
          colorScheme: typeof p.color_scheme === 'string' ? JSON.parse(p.color_scheme) : p.color_scheme,
          benefits: p.benefits || []
        })));
      }
    } catch (err) {
      console.error('Failed to fetch card prices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(`/api/credit-card-requests?user_id=${user.id}`);
      const data = await res.json();
      if (data.requests) {
        setUserCards(data.requests);
      }
    } catch (err) {
      console.error('Failed to fetch user cards:', err);
    }
  };

  const handleRequest = async (card) => {
    setRequesting(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in to request a card');

      const res = await fetch('/api/credit-card-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, card_tier: card.tier })
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to request card');
      
      setSelectedCard(card);
      setShowSuccessModal(true);
      fetchUserCards();
    } catch (err) {
      setError(err.message);
    } finally {
      setRequesting(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSelectedCard(null);
  };

  const getCardStatus = (tier) => {
    const userCard = userCards.find(c => c.card_tier === tier);
    if (!userCard) return 'available';
    if (userCard.status === 'pending') return 'pending';
    if (userCard.status === 'approved') return 'approved';
    if (userCard.status === 'rejected') return 'rejected';
    return 'available';
  };

  const renderCard = (card) => {
    const status = getCardStatus(card.tier);
    const { primary, secondary, accent } = card.colorScheme;
    
    const cardStyle = {
      background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
      border: 'none',
      borderRadius: '20px',
      padding: '32px',
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: `0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1)`,
      minHeight: '240px',
      width: '100%',
      maxWidth: '380px'
    };

    const chipStyle = {
      width: '56px',
      height: '36px',
      borderRadius: '6px',
      background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: '700',
      letterSpacing: '2px',
      color: '#374151',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(255,255,255,0.3)'
    };

    const statusConfig = {
      available: { label: 'Request Card', color: '#10b981', icon: <ArrowRight size={18} /> },
      pending: { label: 'Pending Review', color: '#f59e0b', icon: <Loader2 size={18} className="spin" /> },
      approved: { label: 'Approved', color: '#10b981', icon: <CheckCircle2 size={18} /> },
      rejected: { label: 'Rejected', color: '#ef4444', icon: <AlertCircle size={18} /> }
    };

    const statusInfo = statusConfig[status];

    return (
      <div className="credit-card-wrapper" style={{ perspective: '1000px' }}>
        <div 
          className="credit-card" 
          style={{ 
            ...cardStyle,
            transform: `rotateY(0deg)`,
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            cursor: status === 'available' ? 'pointer' : 'default'
          }}
          onClick={() => status === 'available' && handleRequest(card)}
        >
          {/* Card background pattern */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)`,
            pointerEvents: 'none'
          }} />
          
          {/* Card brand */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '2px',
              opacity: 0.9,
              textTransform: 'uppercase'
            }}>
              PHC Platform
            </div>
            <div style={{
              width: '48px',
              height: '30px',
              borderRadius: '4px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '1px'
            }}>
              VISA
            </div>
          </div>

          {/* Chip */}
          <div style={chipStyle}>CHIP</div>

          {/* Card number placeholder */}
          <div style={{
            marginTop: '32px',
            fontSize: '22px',
            fontWeight: '500',
            letterSpacing: '4px',
            fontFamily: '"Courier New", monospace',
            opacity: 0.95
          }}>
            •••• •••• •••• ••••
          </div>

          {/* Card holder & expiry */}
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '10px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>
                CARDHOLDER
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', textTransform: 'uppercase', marginTop: '4px' }}>
                YOUR NAME
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>
                EXPIRES
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', marginTop: '4px' }}>
                12/28
              </div>
            </div>
          </div>

          {/* Card tier badge */}
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '24px',
            right: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              {card.name.toUpperCase()}
            </span>
            <span style={{
              fontSize: '24px',
              fontWeight: '800'
            }}>
              ${card.price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Status / Action button */}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          {status === 'available' && (
            <button 
              className="request-btn"
              onClick={(e) => { e.stopPropagation(); handleRequest(card); }}
              disabled={requesting}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                width: '100%',
                maxWidth: '380px'
              }}
            >
              {requesting ? (
                <>
                  <Loader2 size={20} className="spin" style={{ marginRight: '8px' }} />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={20} style={{ marginRight: '8px' }} />
                  Request ${card.name} - ${card.price.toLocaleString()}
                </>
              )}
            </button>
          )}

          {status === 'pending' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '16px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              color: '#f59e0b',
              maxWidth: '380px',
              margin: '0 auto'
            }}>
              <Loader2 size={20} className="spin" />
              <span style={{ fontWeight: '600' }}>Pending Review</span>
            </div>
          )}

          {status === 'approved' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '16px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              color: '#10b981',
              maxWidth: '380px',
              margin: '0 auto'
            }}>
              <CheckCircle2 size={20} />
              <span style={{ fontWeight: '600' }}>Approved - Card Issued</span>
            </div>
          )}

          {status === 'rejected' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              color: '#ef4444',
              maxWidth: '380px',
              margin: '0 auto'
            }}>
              <AlertCircle size={20} />
              <span style={{ fontWeight: '600' }}>Request Rejected</span>
            </div>
          )}
        </div>

        {/* Benefits */}
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
            Benefits
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {card.benefits.map((benefit, i) => (
              <li key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '8px 0',
                color: '#4b5563',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="credit-card-request-page">
        <div className="page-header">
          <h1>Credit Cards</h1>
          <p>Choose the perfect card for your lifestyle</p>
        </div>
        <div className="cards-grid loading">
          {CARD_TIERS.map(() => (
            <div key={Math.random()} className="card-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="credit-card-request-page">
      <div className="page-header">
        <h1>Credit Cards</h1>
        <p>Choose the perfect card for your lifestyle</p>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="cards-grid">
        {cards.map((card) => renderCard(card))}
      </div>

      {/* Success Modal */}
      {showSuccessModal && selectedCard && (
        <div className="modal-overlay" onClick={closeSuccessModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon success">
              <CheckCircle2 size={48} />
            </div>
            <h2>Order Placed Successfully!</h2>
            <p>Your <strong>{selectedCard.name}</strong> request has been submitted.</p>
            <p className="modal-note">Our team will review your application and get back to you within 1-2 business days.</p>
            <button className="modal-close-btn" onClick={closeSuccessModal}>
              Continue Browsing
            </button>
          </div>
        </div>
      )}
    {/* eslint-disable-next-line react/no-unknown-property */}
    <style jsx>{`
        .credit-card-request-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }
        
        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .page-header h1 {
          font-size: 36px;
          font-weight: 800;
          color: #1e3a8a;
          margin-bottom: 8px;
        }
        
        .page-header p {
          font-size: 18px;
          color: #64748b;
        }
        
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 24px;
        }
        
        .credit-card-wrapper {
          perspective: 1000px;
        }
        
        .credit-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .credit-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 28px 56px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.15) !important;
        }
        
        .request-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.5) !important;
        }
        
        .request-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .error-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          color: #ef4444;
          margin-bottom: 24px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .card-skeleton {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 20px;
          height: 480px;
        }
        
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .modal-content {
          background: white;
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15);
          animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .modal-icon.success {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: white;
        }
        
        .modal-content h2 {
          font-size: 24px;
          font-weight: 700;
          color: #1e3a8a;
          margin-bottom: 12px;
        }
        
        .modal-content p {
          font-size: 16px;
          color: #4b5563;
          margin-bottom: 8px;
          line-height: 1.6;
        }
        
        .modal-note {
          font-size: 14px !important;
          color: #6b7280 !important;
        }
        
        .modal-close-btn {
          margin-top: 24px;
          padding: 14px 32px;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .modal-close-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(30, 58, 138, 0.4);
        }
        
        @media (max-width: 768px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }
          
          .credit-card-request-page {
            padding: 16px;
          }
          
          .page-header h1 {
            font-size: 28px;
          }
        }
      `}
    </style>
  </div>
  );
};

export default CreditCardRequest;