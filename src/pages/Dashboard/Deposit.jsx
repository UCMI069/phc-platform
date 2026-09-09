import React, { useState, useEffect } from 'react';
import { neon as supabase } from '../../lib/neon';
import { ArrowDownCircle, ShieldCheck, Wallet, History, AlertCircle, CheckCircle2, Bitcoin } from 'lucide-react';
import './Deposit.css';

const Deposit = () => {
  const [accounts, setAccounts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [cryptoDepositDetails, setCryptoDepositDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    toAccount: '',
    amount: '',
    method: 'bank_transfer',
    cryptoDetailId: ''
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
      
      // Fetch profile
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profData);

      // Fetch crypto deposit details
      const { data: cryptoRows } = await supabase
        .from('crypto_deposit_details')
        .select('*')
        .order('currency', { ascending: true });
      setCryptoDepositDetails(cryptoRows || []);

      // Fetch accounts
      const { data: accData } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);
      
      setAccounts(accData || []);
      setFormData((prev) => ({
        ...prev,
        toAccount: accData?.[0]?.id || prev.toAccount,
        cryptoDetailId: cryptoRows?.[0]?.id || prev.cryptoDetailId
      }));
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (profile?.is_inactive) {
      setError('Your account is inactive. Deposits are disabled.');
      return;
    }
    if (formData.method === 'crypto') {
      const selected = cryptoDepositDetails.find((d) => d.id === formData.cryptoDetailId);
      if (!selected) {
        setError('Crypto deposit is unavailable right now. Please try again later or contact support.');
        return;
      }
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleConfirmDeposit = async () => {
    if (profile?.is_inactive) {
      setError('Your account is inactive. Deposits are disabled.');
      return;
    }

    if (formData.method === 'crypto') {
      const selected = cryptoDepositDetails.find((d) => d.id === formData.cryptoDetailId);
      if (!selected) {
        setError('Crypto deposit is unavailable right now. Please try again later or contact support.');
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData?.user) throw new Error("Authentication failed");

      const user = userData.user;
      
      const selectedCrypto = formData.method === 'crypto'
        ? cryptoDepositDetails.find((d) => d.id === formData.cryptoDetailId)
        : null;

      const depositDescription = formData.method === 'crypto'
        ? `Crypto Deposit (${String(selectedCrypto?.currency || '').toUpperCase()}${selectedCrypto?.network ? ` - ${selectedCrypto.network}` : ''})`
        : `Deposit via ${formData.method.toUpperCase()}`;

      // Create a pending transaction
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: user.id,
        account_id: formData.toAccount,
        amount: parseFloat(formData.amount),
        direction: 'credit',
        description: depositDescription,
        status: 'pending'
      });

      if (txError) throw txError;

      // Update account balance
      const { data: acc } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', formData.toAccount)
        .single();

      const newBalance = (parseFloat(acc?.balance) || 0) + parseFloat(formData.amount);
      await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', formData.toAccount);
      
      setStep(3); // Move to success step
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading accounts...</div>;

  return (
    <div className="deposit-container">
      <div className="deposit-header">
        <h2>Deposit Funds</h2>
        <p>Add money to your PHC accounts using your preferred method.</p>
      </div>

      <div className="deposit-grid">
        <div className="deposit-form-card">
          {profile?.is_inactive && (
            <div className="error-message">
              <AlertCircle size={16} /> Your account is inactive. You can view your dashboard, but you cannot perform deposits.
            </div>
          )}
          {step === 1 && (
            <form onSubmit={handleSubmit} className="deposit-form">
              <div className="form-group">
                <label>Deposit to Account</label>
                <select 
                  name="toAccount" 
                  value={formData.toAccount} 
                  onChange={handleChange}
                  required
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.type.toUpperCase()} (****{acc.id.slice(-4)}) - £{acc.balance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Amount (£)</label>
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
                <label>Deposit Method</label>
                <div className="method-options">
                  <label className={`method-option ${formData.method === 'bank_transfer' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="method" 
                      value="bank_transfer" 
                      checked={formData.method === 'bank_transfer'}
                      onChange={handleChange}
                    />
                    <div className="method-content">
                      <Wallet size={20} />
                      <div className="method-info">
                        <strong>Bank Transfer</strong>
                        <span>Transfer from another bank</span>
                      </div>
                    </div>
                  </label>
                  <label className={`method-option ${formData.method === 'crypto' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="method" 
                      value="crypto" 
                      checked={formData.method === 'crypto'}
                      onChange={handleChange}
                    />
                    <div className="method-content">
                      <Bitcoin size={20} />
                      <div className="method-info">
                        <strong>Crypto Deposit</strong>
                        <span>Send crypto to our wallet</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {formData.method === 'crypto' && (
                <div className="form-group">
                  <label>Crypto Currency</label>
                  <select
                    name="cryptoDetailId"
                    value={formData.cryptoDetailId}
                    onChange={handleChange}
                    required
                  >
                    {cryptoDepositDetails.length === 0 && (
                      <option value="">No crypto options available</option>
                    )}
                    {cryptoDepositDetails.map((d) => (
                      <option key={d.id} value={d.id}>
                        {String(d.currency || '').toUpperCase()}{d.network ? ` (${d.network})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && <div className="error-message"><AlertCircle size={16} /> {error}</div>}

              <button type="submit" className="deposit-btn" disabled={profile?.is_inactive}>
                Generate Deposit Details
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="deposit-instructions">
              {formData.method === 'bank_transfer' ? (
                profile?.deposit_bank_name ? (
                <>
                  <div className="instruction-header">
                    <CheckCircle2 size={48} className="success-icon" />
                    <h3>Bank Transfer Details</h3>
                    <p>Please use the details below to complete your transfer from your other bank.</p>
                  </div>

                  <div className="details-card">
                    <div className="detail-item">
                      <span>Bank Name</span>
                      <strong>{profile.deposit_bank_name}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Account Holder</span>
                      <strong>{profile.deposit_recipient_name || 'PHC Bank'}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Account Number</span>
                      <strong>{profile.deposit_account_number}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Sort Code</span>
                      <strong>{profile.deposit_sort_code}</strong>
                    </div>
                    <div className="detail-item highlight">
                      <span>Reference (Required)</span>
                      <strong>DEP-{formData.toAccount.slice(0, 8).toUpperCase()}</strong>
                    </div>
                  </div>

                  <div className="notice-box">
                    <AlertCircle size={20} />
                    <p>Funds will be credited to your account automatically once the transfer is confirmed (usually within 2 hours).</p>
                  </div>

                  {error && <div className="error-message"><AlertCircle size={16} /> {error}</div>}

                  <div className="deposit-actions">
                    <button onClick={() => setStep(1)} className="back-btn">
                      Back
                    </button>
                    <button 
                      onClick={handleConfirmDeposit} 
                      className="deposit-btn"
                      disabled={submitting || profile?.is_inactive}
                    >
                      {submitting ? 'Processing...' : 'Confirm Deposit'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="no-account-error">
                  <AlertCircle size={64} className="error-icon" />
                  <h3>Deposit Unavailable</h3>
                  <p>No available account to deposit to bank. Please contact support or your account manager for assistance.</p>
                  <button onClick={() => setStep(1)} className="deposit-btn" style={{marginTop: '20px'}}>
                    Back to Deposit
                  </button>
                </div>
              )
              ) : (
                (() => {
                  const selected = cryptoDepositDetails.find((d) => d.id === formData.cryptoDetailId);
                  if (!selected) {
                    return (
                      <div className="no-account-error">
                        <AlertCircle size={64} className="error-icon" />
                        <h3>Crypto Deposit Unavailable</h3>
                        <p>No crypto deposit details are currently configured. Please contact support.</p>
                        <button onClick={() => setStep(1)} className="deposit-btn" style={{ marginTop: '20px' }}>
                          Back to Deposit
                        </button>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="instruction-header">
                        <Bitcoin size={48} className="success-icon" />
                        <h3>Crypto Deposit Details</h3>
                        <p>Send the exact crypto currency to the wallet below. Network must match.</p>
                      </div>

                      <div className="details-card">
                        <div className="detail-item">
                          <span>Currency</span>
                          <strong>{String(selected.currency || '').toUpperCase()}</strong>
                        </div>
                        <div className="detail-item">
                          <span>Network</span>
                          <strong>{selected.network || 'N/A'}</strong>
                        </div>
                        <div className="detail-item">
                          <span>Wallet Address</span>
                          <strong style={{ wordBreak: 'break-all' }}>{selected.wallet_address}</strong>
                        </div>
                        {selected.qr_image_url && (
                          <div className="detail-item highlight">
                            <span>QR Code</span>
                            <div className="crypto-qr-box">
                              <img src={selected.qr_image_url} alt="Crypto QR" />
                            </div>
                          </div>
                        )}
                        {selected.instructions && (
                          <div className="detail-item">
                            <span>Instructions</span>
                            <strong style={{ fontWeight: 600 }}>{selected.instructions}</strong>
                          </div>
                        )}
                      </div>

                      <div className="notice-box">
                        <AlertCircle size={20} />
                        <p>Only send {String(selected.currency || '').toUpperCase()} using the correct network. Sending the wrong coin/network may result in loss of funds.</p>
                      </div>

                      {error && <div className="error-message"><AlertCircle size={16} /> {error}</div>}

                      <div className="deposit-actions">
                        <button onClick={() => setStep(1)} className="back-btn">
                          Back
                        </button>
                        <button
                          onClick={handleConfirmDeposit}
                          className="deposit-btn"
                          disabled={submitting || profile?.is_inactive}
                        >
                          {submitting ? 'Processing...' : 'Confirm Deposit'}
                        </button>
                      </div>
                    </>
                  );
                })()
              )}
            </div>
          )}

          {step === 3 && (
            <div className="deposit-instructions success">
              <div className="instruction-header">
                <CheckCircle2 size={64} className="success-icon" />
                <h3>Deposit Confirmed</h3>
                <p>Your deposit request has been submitted successfully.</p>
              </div>
              
              <div className="status-box">
                <p>Status: <strong>Confirmed (Pending Approval)</strong></p>
                <p>Amount: <strong>£{parseFloat(formData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></p>
              </div>

              <div className="notice-box">
                <ShieldCheck size={20} />
                <p>An administrator will review your deposit and credit your account shortly.</p>
              </div>

              <button onClick={() => {
                setStep(1);
                setFormData(prev => ({ ...prev, amount: '' }));
              }} className="deposit-btn">
                Make Another Deposit
              </button>
            </div>
          )}
        </div>

        <div className="deposit-info-card">
          <h3>Why deposit with us?</h3>
          <ul className="info-list">
            <li>
              <ShieldCheck size={20} className="info-icon" />
              <div>
                <strong>Secure Payments</strong>
                <p>All deposits are protected by industry-leading encryption.</p>
              </div>
            </li>
            <li>
              <ArrowDownCircle size={20} className="info-icon" />
              <div>
                <strong>Secure Processing</strong>
                <p>All deposits are reviewed by our team for your security.</p>
              </div>
            </li>
            <li>
              <CheckCircle2 size={20} className="info-icon" />
              <div>
                <strong>Regulated Platform</strong>
                <p>All transactions are processed securely through our platform.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Deposit;
