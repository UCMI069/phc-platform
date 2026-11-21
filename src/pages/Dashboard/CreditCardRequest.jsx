import React, { useState, useEffect } from 'react';
import { neon as supabase } from '../../lib/neon';
import { CreditCard, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import './CreditCardRequest.css';

const CARD_TIERS = [
  {
    tier: 'starter',
    name: 'Starter Card',
    price: 430,
    description: 'Entry level credit card for everyday spending.',
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
    description: 'Premium credit card with enhanced rewards.',
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
    description: 'High-end credit card with premium benefits.',
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
    description: 'Ultimate prestige credit card with exclusive privileges.',
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
      setSuccess(data);
      fetchUserCards();
    } catch (err) {
      setError(err.message);
    } finally {
      setRequesting(false);
    }
  };

  const getCardStatus = (tier) => {
    const userCard = userCards.find(c => c.card_tier === tier);
    if (!userCard) return 'available';
    return userCard.status;
  };

  if (loading) {
    return (
      <div className="credit-card-request-page">
        <div className="page-header">
          <h1>Credit Cards</h1>
          <p>Request a credit card for your account</p>
        </div>
        <div className="loading-state">
          <Loader2 size={24} className="spin" />
          <p>Loading card options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="credit-card-request-page">
      <div className="page-header">
        <h1>Credit Cards</h1>
        <p>Request a credit card for your account</p>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="success-banner">
          <CheckCircle2 size={20} />
          <span>Request for <strong>{selectedCard?.name}</strong> submitted successfully.</span>
          <button className="close-btn" onClick={() => setSuccess(null)}><X size={16} /></button>
        </div>
      )}

      <div className="cards-list">
        {cards.map((card) => {
          const status = getCardStatus(card.tier);
          return (
            <div key={card.tier} className="card-item">
              <div className="card-header">
                <div className="card-info">
                  <h3>{card.name}</h3>
                  <p className="card-description">{card.description}</p>
                  <span className="card-price">${card.price.toLocaleString()}</span>
                </div>
                <div className="card-actions">
                  {status === 'available' && (
                    <button
                      className="request-btn"
                      onClick={() => handleRequest(card)}
                      disabled={requesting}
                    >
                      {requesting ? <><Loader2 size={16} className="spin" /> Processing...</> : <>Request Card</>}
                    </button>
                  )}
                  {status === 'pending' && (
                    <div className="status-badge pending">
                      <Loader2 size={16} className="spin" /> Pending Review
                    </div>
                  )}
                  {status === 'approved' && (
                    <div className="status-badge approved">
                      <CheckCircle2 size={16} /> Approved
                    </div>
                  )}
                  {status === 'rejected' && (
                    <div className="status-badge rejected">
                      <AlertCircle size={16} /> Rejected
                    </div>
                  )}
                </div>
              </div>
              <div className="card-benefits">
                <h4>Benefits</h4>
                <ul>
                  {card.benefits.map((benefit, i) => (
                    <li key={i}>{benefit}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CreditCardRequest;
