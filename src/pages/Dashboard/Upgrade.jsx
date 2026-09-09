import React, { useEffect, useMemo, useState } from 'react';
import { neon as supabase } from '../../lib/neon';
import { useNotification } from '../../context/NotificationContext';
import { Crown, Star, Shield, Sparkles, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import './Upgrade.css';

const TIERS = [
  {
    id: 'starter',
    name: 'Starter Account',
    icon: Shield,
    accent: 'starter',
    perks: ['Everyday banking', 'Standard transfers', 'Basic support']
  },
  {
    id: 'vip',
    name: 'VIP Account',
    icon: Sparkles,
    accent: 'vip',
    perks: ['Priority transfers', 'Enhanced support', 'Exclusive offers']
  },
  {
    id: 'gold',
    name: 'Gold Account',
    icon: Star,
    accent: 'gold',
    perks: ['Higher limits', 'Dedicated support', 'Faster processing']
  },
  {
    id: 'platinum',
    name: 'Platinum Account',
    icon: Crown,
    accent: 'platinum',
    perks: ['Premium limits', 'Concierge support', 'Top-tier benefits']
  }
];

const tierRank = (tier) => {
  const idx = TIERS.findIndex((t) => t.id === tier);
  return idx === -1 ? 0 : idx;
};

const formatMoney = (value, currency = 'GBP') => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol'
  }).format(amount);
};

const Upgrade = () => {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [prices, setPrices] = useState({});
  const [requests, setRequests] = useState([]);

  const currentTier = (profile?.account_level || 'starter').toLowerCase();
  const isInactive = Boolean(profile?.is_inactive);
  const pendingRequest = useMemo(
    () => requests.find((r) => r.status === 'pending'),
    [requests]
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('id, currency, is_inactive, account_level')
        .eq('id', user.id)
        .single();
      if (profError) throw profError;
      setProfile(prof);

      const { data: priceRows, error: priceError } = await supabase
        .from('account_upgrade_prices')
        .select('tier, price');
      if (priceError) throw priceError;
      const nextPrices = {};
      (priceRows || []).forEach((row) => {
        nextPrices[String(row.tier || '').toLowerCase()] = row.price;
      });
      setPrices(nextPrices);

      const { data: reqRows, error: reqError } = await supabase
        .from('account_upgrade_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (reqError) throw reqError;
      setRequests(reqRows || []);
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const requestUpgrade = async (tier) => {
    if (submitting) return;
    if (isInactive) {
      addNotification('Your account is inactive. Upgrade requests are disabled.', 'error');
      return;
    }
    if (pendingRequest) {
      addNotification('You already have a pending upgrade request.', 'info');
      return;
    }
    if (tierRank(tier) <= tierRank(currentTier)) {
      addNotification('This tier is already active (or lower than your current tier).', 'info');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const requestedPrice = prices[tier] ?? null;
      const { error } = await supabase
        .from('account_upgrade_requests')
        .insert({
          user_id: user.id,
          requested_tier: tier,
          requested_price: requestedPrice,
          status: 'pending'
        });
      if (error) throw error;

      addNotification('Upgrade request submitted. You will be notified once reviewed.', 'success');
      fetchData();
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading upgrade options...</div>;

  return (
    <div className="upgrade-container">
      <div className="upgrade-header">
        <div className="upgrade-title">
          <h2>Account Upgrade</h2>
          <p>Request an upgrade and get access to higher limits and enhanced support.</p>
        </div>
        <div className="upgrade-current">
          <span className={`tier-pill ${currentTier}`}>Current: {currentTier.toUpperCase()}</span>
          {isInactive && (
            <span className="inactive-pill">
              <AlertCircle size={14} /> Inactive
            </span>
          )}
        </div>
      </div>

      {pendingRequest && (
        <div className="upgrade-banner pending">
          <Clock size={18} />
          <div>
            <strong>Pending request:</strong> {String(pendingRequest.requested_tier).toUpperCase()}
            {typeof pendingRequest.requested_price === 'number' && profile?.currency && (
              <> • Requested price: {formatMoney(pendingRequest.requested_price, profile.currency)}</>
            )}
          </div>
        </div>
      )}

      {requests.find((r) => r.status === 'approved') && (
        <div className="upgrade-banner success">
          <CheckCircle2 size={18} />
          <div>Your latest upgrade decision has been applied to your account level.</div>
        </div>
      )}

      <div className="tiers-grid">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          const price = prices[tier.id];
          const isCurrent = tier.id === currentTier;
          const isLowerOrEqual = tierRank(tier.id) <= tierRank(currentTier);
          const disabled = submitting || isInactive || Boolean(pendingRequest) || isLowerOrEqual;

          return (
            <div key={tier.id} className={`tier-card ${tier.accent} ${isCurrent ? 'current' : ''}`}>
              <div className="tier-top">
                <div className="tier-icon">
                  <Icon size={22} />
                </div>
                <div className="tier-name">
                  <h3>{tier.name}</h3>
                  <div className="tier-price">
                    {profile?.currency ? formatMoney(price, profile.currency) : formatMoney(price, 'GBP')}
                  </div>
                </div>
              </div>

              <ul className="tier-perks">
                {tier.perks.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>

              <button
                className="tier-action"
                disabled={disabled}
                onClick={() => requestUpgrade(tier.id)}
              >
                {isCurrent ? 'Current Plan' : (isLowerOrEqual ? 'Unavailable' : 'Request Upgrade')}
              </button>
            </div>
          );
        })}
      </div>

      <div className="upgrade-history">
        <h3>Upgrade History</h3>
        {requests.length === 0 ? (
          <div className="empty-upgrade">No upgrade requests yet.</div>
        ) : (
          <div className="upgrade-list">
            {requests.map((r) => (
              <div key={r.id} className={`upgrade-row ${r.status}`}>
                <div className="upgrade-row-main">
                  <strong>{String(r.requested_tier).toUpperCase()}</strong>
                  <span className={`status ${r.status}`}>{String(r.status).toUpperCase()}</span>
                </div>
                <div className="upgrade-row-meta">
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                  {typeof r.approved_price === 'number' && profile?.currency && (
                    <span>Approved: {formatMoney(r.approved_price, profile.currency)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Upgrade;
