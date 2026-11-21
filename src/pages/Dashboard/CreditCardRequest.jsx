import React, { useState, useEffect } from 'react';
import { neon as supabase } from '../../lib/neon';
import { CreditCard, ArrowRight, CheckCircle2, AlertCircle, Loader2, X, Info, CheckCircle2 as CheckCircle2Icon } from 'lucide-react';
import './CreditCardRequest.css';

const CARD_TIERS = [
  {
    tier: 'starter',
    name: 'Starter Card',
    price: 430,
    description: 'Entry level credit card for everyday spending',
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
      const res = await fetch('/api/kyc/prices');
      const data = await res.json();
      if (data.prices) {
        setCards(data.prices.map(p => ({
          tier: p.tier,
          name: p.name,
          price: Number(p.price),
          description: p.description,
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

      const res = await fetch(`/api/kyc/requests?user_id=${user.id}`);
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

      const res = await fetch('/api/kyc/requests', {
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
    
    const statusConfig = {
      available: { label: 'Request Card', color: '#10b981', icon: <ArrowRight size={18} /> },
      pending: { label: 'Pending Review', color: '#f59e0b', icon: <Loader2 size={18} className="spin" /> },
      approved: { label: 'Approved', color: '#10b981', icon: <CheckCircle2Icon size={18} /> },
      rejected: { label: 'Rejected', color: '#ef4444', icon: <AlertCircle size={18} /> }
    };

    const statusInfo = statusConfig[status];

    return (
      <div className="card-info">
        <div className="card-header">
          <div className="card-title-row">
            <h3 className="card-name">{card.name}</h3>
            <span className="card-price">${card.price.toLocaleString()}</span>
          </div>
          <p className="card-description">{card.description}</p>
        </div>

        <div className="card-benefits">
          <h4>Benefits</h4>
          <ul>
            {card.benefits.map((benefit, i) => (
              <li key={i}>
                <CheckCircle2Icon size={16} className="benefit-check" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="card-status-section">
          {status === 'available' && (
            <button 
              className="request-btn"
              onClick={() => handleRequest(card)}
              disabled={requesting}
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
            <div className="status-badge pending">
              <Loader2 size={18} className="spin" />
              <span>Pending Review</span>
            </div>
          )}

          {status === 'approved' && (
            <div className="status-badge approved">
              <CheckCircle2Icon size={18} />
              <span>Approved - Card Issued</span>
            </div>
          )}

          {status === 'rejected' && (
            <div className="status-badge rejected">
              <AlertCircle size={18} />
              <span>Request Rejected</span>
            </div>
          )}
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
              <CheckCircle2Icon size={48} />
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
    </div>
  );
};

export default CreditCardRequest;