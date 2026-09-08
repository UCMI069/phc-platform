import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Search, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import './Transfer.css';

const Transfer = () => {
  const [accounts, setAccounts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fromAccount: '',
    toAccount: '',
    accountName: '',
    bankName: '',
    amount: '',
    reference: ''
  });
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data?.user) return;

      const user = data.user;
      const { data: profData } = await supabase
        .from('profiles')
        .select('is_inactive')
        .eq('id', user.id)
        .single();
      setProfile(profData || null);

      const { data: accData } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);
      
      setAccounts(accData || []);
      if (accData?.length > 0) {
        setFormData(prev => ({ ...prev, fromAccount: accData[0].id }));
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (profile?.is_inactive) {
      setError('Your account is inactive. Transfers are disabled.');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    const sourceAccount = accounts.find(a => a.id === formData.fromAccount);
    if (sourceAccount && parseFloat(formData.amount) > sourceAccount.balance) {
      setError("Insufficient funds in the selected account");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (profile?.is_inactive) {
      setError('Your account is inactive. Transfers are disabled.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Create debit transaction with recipient details
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_id: formData.fromAccount,
          amount: parseFloat(formData.amount),
          direction: 'debit',
          description: `Transfer to ${formData.accountName}`,
          status: 'pending_transfer',
          recipient_name: formData.accountName,
          recipient_account: formData.toAccount,
          recipient_bank: formData.bankName,
          recipient_reference: formData.reference
        });

      if (txError) throw txError;

      // 2. Update account balance immediately (Standard banking practice)
      const sourceAccount = accounts.find(a => a.id === formData.fromAccount);
      const newBalance = sourceAccount.balance - parseFloat(formData.amount);
      
      const { error: accError } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', formData.fromAccount);

      if (accError) throw accError;

      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading accounts...</div>;

  return (
    <div className="transfer-container">
      <div className="transfer-header">
        <h2>Make a Transfer</h2>
        <p>Send money to other PHC accounts or other banks securely.</p>
      </div>

      <div className="transfer-card">
        {profile?.is_inactive && (
          <div className="error-message">
            <AlertCircle size={16} /> Your account is inactive. You can view your dashboard, but you cannot perform transfers.
          </div>
        )}
        {step === 1 && (
          <form onSubmit={handleNext} className="transfer-form">
            <div className="form-section">
              <h3>Source Account</h3>
              <div className="form-group">
                <label>Transfer from</label>
                <select 
                  name="fromAccount" 
                  value={formData.fromAccount} 
                  onChange={handleChange}
                  required
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.type.toUpperCase()} (****{acc.id.slice(-4)}) - Â£{acc.balance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-section">
              <h3>Recipient Details</h3>
              <div className="form-group">
                <label>Account Holder Name</label>
                <input 
                  type="text" 
                  name="accountName" 
                  placeholder="Enter recipient's full name"
                  value={formData.accountName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Account Number / IBAN</label>
                <input 
                  type="text" 
                  name="toAccount" 
                  placeholder="Enter account number"
                  value={formData.toAccount}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Bank Name</label>
                <input 
                  type="text" 
                  name="bankName" 
                  placeholder="Enter bank name"
                  value={formData.bankName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Payment Details</h3>
              <div className="form-group">
                <label>Amount (Â£)</label>
                <input 
                  type="number" 
                  name="amount" 
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  className="no-symbol-input"
                />
              </div>
              <div className="form-group">
                <label>Reference (Optional)</label>
                <input 
                  type="text" 
                  name="reference" 
                  placeholder="e.g. Rent, Gift"
                  value={formData.reference}
                  onChange={handleChange}
                />
              </div>
            </div>

            {error && <div className="error-message"><AlertCircle size={16} /> {error}</div>}

            <button type="submit" className="next-btn" disabled={submitting || profile?.is_inactive}>
              Continue to Review <ArrowRight size={18} />
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="review-section">
            <h3>Review Transfer</h3>
            <div className="review-grid">
              <div className="review-item">
                <span>From</span>
                <strong>{accounts.find(a => a.id === formData.fromAccount)?.type.toUpperCase()} (****{formData.fromAccount.slice(-4)})</strong>
              </div>
              <div className="review-item">
                <span>To</span>
                <strong>{formData.accountName}</strong>
              </div>
              <div className="review-item">
                <span>Bank</span>
                <strong>{formData.bankName}</strong>
              </div>
              <div className="review-item">
                <span>Account Number</span>
                <strong>{formData.toAccount}</strong>
              </div>
              <div className="review-item highlight">
                <span>Amount</span>
                <strong>Â£{parseFloat(formData.amount).toLocaleString()}</strong>
              </div>
              <div className="review-item">
                <span>Reference</span>
                <strong>{formData.reference || 'N/A'}</strong>
              </div>
            </div>

            <div className="security-notice">
              <ShieldCheck size={20} />
              <p>This transfer is protected by PHC Secure. Please ensure recipient details are correct.</p>
            </div>

            <div className="action-buttons">
              <button onClick={() => setStep(1)} className="back-btn" disabled={submitting}>Back</button>
              <button onClick={handleSubmit} className="confirm-btn" disabled={submitting || profile?.is_inactive}>
                {submitting ? 'Processing...' : 'Confirm and Send'}
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        )}

        {step === 3 && (
          <div className="success-section">
            <div className="success-icon">
              <ShieldCheck size={64} />
            </div>
            <h3>Transfer Successful</h3>
            <p>Your payment of <strong>Â£{parseFloat(formData.amount).toLocaleString()}</strong> to <strong>{formData.accountName}</strong> has been initiated.</p>
            <div className="tx-ref">Transaction Reference: {Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
            <button onClick={() => window.location.href = '/dashboard/transactions'} className="finish-btn">
              View Transactions
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transfer;
