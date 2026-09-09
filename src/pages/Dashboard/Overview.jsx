import React, { useEffect, useState } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  Star,
  Shield,
  CreditCard,
  User
} from 'lucide-react';
import { neon as supabase } from '../../lib/neon';
import './Overview.css';

const Overview = () => {
  const [profile, setProfile] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showBalance, setShowBalance] = useState(false);
  const [loading, setLoading] = useState(true);

  const [rates, setRates] = useState({
    USD: 1.27,
    EUR: 1.18,
    CAD: 1.74,
    AUD: 1.95,
    JPY: 195.42,
    CHF: 1.14,
    CNY: 9.15
  });

  useEffect(() => {
    fetchDashboardData();
    // In a real app, you would fetch live rates here
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data?.user) return;

      const user = data.user;
      // Fetch Profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(prof);

      // Fetch Accounts
      const { data: accs } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);
      setAccounts(accs || []);

      // Fetch Recent Transactions (no limit — summary needs all of them)
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setTransactions(txs || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce((acc, curr) => acc + (parseFloat(curr.balance) || 0), 0);
  const accountStatusLabel = profile?.is_inactive ? 'Inactive' : 'Active';
  const accountStatusClass = profile?.is_inactive ? 'status-dot-inactive' : 'status-dot-active';
  const accountLevel = String(profile?.account_level || 'starter').toLowerCase();
  
  const convertAmount = (amount, targetCurrency) => {
    if (!targetCurrency || targetCurrency === 'GBP') return amount;
    const rate = rates[targetCurrency] || 1;
    return amount * rate;
  };

  const formatCurrency = (amount, currencyCode, shouldConvert = true) => {
    const currency = currencyCode || profile?.currency || 'GBP';
    const convertedAmount = shouldConvert ? convertAmount(amount, currency) : amount;
    
    // Custom formatting for simplified symbols
    const options = { 
      style: 'currency', 
      currency: currency,
      currencyDisplay: 'narrowSymbol' // Force narrow symbol (e.g. $ instead of US$)
    };
    
    return new Intl.NumberFormat('en-GB', options).format(convertedAmount);
  };

  const bankingTips = [
    {
      icon: <Zap size={20} />,
      title: "Smart Savings",
      desc: "Set up an automatic transfer to your savings account every payday."
    },
    {
      icon: <ShieldCheck size={20} />,
      title: "Stay Secure",
      desc: "Never share your PIN or login credentials with anyone, even bank staff."
    },
    {
      icon: <Star size={20} />,
      title: "Credit Health",
      desc: "Paying your bills on time is the best way to improve your credit score."
    }
  ];

  if (loading) return <div className="loading-spinner">Loading dashboard...</div>;

  return (
    <div className="overview-container">
      {/* User Welcome Header */}
      <div className="user-welcome-header">
        <div className="profile-ring">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="user-avatar" />
          ) : (
            <div className="user-avatar-placeholder">
              <User size={32} />
            </div>
          )}
        </div>
        <div className="welcome-text">
          <h2>Hi, {profile?.first_name || 'User'}</h2>
          <p>Welcome back to your secure banking dashboard.</p>
        </div>
      </div>

      {/* Main Balance Card - Extended with Gradient */}
      <div className="balance-hero-container">
        <div className="balance-hero-card">
          <div className="balance-hero-content">
            <div className="balance-label-row">
              <div className="label-with-icon">
                <Shield size={16} />
                <span>Total Available Balance</span>
              </div>
              <button onClick={() => setShowBalance(!showBalance)} className="toggle-balance-btn">
                {showBalance ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <h1 className="hero-balance-amount">
              {showBalance ? formatCurrency(totalBalance) : '****'}
            </h1>
            <div className="hero-account-meta">
              <span>Main Account: **** {accounts[0]?.id?.slice(-4) || '0000'}</span>
              <div className={accountStatusClass}>{accountStatusLabel}</div>
              <div className={`account-tier-pill ${accountLevel}`}>{accountLevel.toUpperCase()}</div>
            </div>
          </div>
          <div className="balance-hero-visual">
            <CreditCard size={120} className="floating-card-icon" />
          </div>
        </div>
      </div>

      <div className="dashboard-main-grid">
        {/* Simplified Debit & Credit Fields Section */}
        <section className="dashboard-content-section">
          <div className="section-header-minimal">
            <h3>Recent Activity</h3>
            <p>Summary of your latest credit and debit movements.</p>
          </div>
          
          <div className="activity-summary-grid">
            <div className="activity-card credit">
              <div className="activity-icon">
                <ArrowDownLeft size={20} />
              </div>
              <div className="activity-info">
                <span className="label">Total Credit</span>
                <span className="value">+{formatCurrency(transactions.filter(t => t.direction === 'credit').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0))}</span>
              </div>
            </div>
            <div className="activity-card debit">
              <div className="activity-icon">
                <ArrowUpRight size={20} />
              </div>
              <div className="activity-info">
                <span className="label">Total Debit</span>
                <span className="value">-{formatCurrency(transactions.filter(t => t.direction === 'debit').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0))}</span>
              </div>
            </div>
          </div>

          <div className="simple-transactions-list">
            {transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="simple-tx-item">
                <div className="tx-main">
                  <span className="tx-title">{tx.description || 'Bank Transfer'}</span>
                  <span className="tx-sub">{new Date(tx.created_at).toLocaleDateString()}</span>
                </div>
                <div className="tx-side">
                  <span className={`tx-amt ${tx.direction}`}>
                    {tx.direction === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                  {tx.status === 'pending' && <span className="mini-status">Incoming</span>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Banking Tips Section */}
        <aside className="dashboard-sidebar-section">
          <div className="section-header-minimal">
            <h3>Financial Insights</h3>
          </div>
          <div className="banking-tips-container">
            {bankingTips.map((tip, index) => (
              <div key={index} className="banking-tip-card">
                <div className="tip-icon-box">{tip.icon}</div>
                <div className="tip-content">
                  <h4>{tip.title}</h4>
                  <p>{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="promo-banner">
            <div className="promo-content">
              <h4>Exchange Rates (vs GBP)</h4>
              <div className="rates-ticker">
                <div className="rate-item"><span>USD</span> <strong>{rates.USD.toFixed(2)}</strong></div>
                <div className="rate-item"><span>EUR</span> <strong>{rates.EUR.toFixed(2)}</strong></div>
                <div className="rate-item"><span>JPY</span> <strong>{rates.JPY.toFixed(1)}</strong></div>
                <div className="rate-item"><span>CAD</span> <strong>{rates.CAD.toFixed(2)}</strong></div>
              </div>
              <button className="promo-btn" style={{marginTop: '12px'}}>Live Market Data</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Overview;
