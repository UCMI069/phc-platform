import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { neon as supabase } from '../../lib/neon';
import { Wallet, Landmark, Calculator, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import './Loan.css';

const LOAN_TYPES = [
  { id: 'personal', name: 'Personal Loan', rate: '6.9%', max: 50000 },
  { id: 'business', name: 'Business Loan', rate: '8.5%', max: 250000 },
  { id: 'mortgage', name: 'Mortgage', rate: '4.2%', max: 1000000 },
];

const Loan = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    loanType: 'personal',
    amount: '',
    duration: '12',
    reason: '',
    toAccount: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);

  React.useEffect(() => {
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
        setFormData(prev => ({ ...prev, toAccount: accData[0].id }));
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

  const calculateMonthly = () => {
    const type = LOAN_TYPES.find(t => t.id === formData.loanType);
    const rate = parseFloat(type.rate) / 100 / 12;
    const amount = parseFloat(formData.amount) || 0;
    const months = parseInt(formData.duration);
    
    if (!amount) return 0;
    const monthly = (amount * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    return monthly.toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (profile?.is_inactive) {
      setError('Your account is inactive. Loan requests are disabled.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // In a real bank, this would go to a 'loans' table
      // For now, we'll record it as a pending transaction or just a success state
      const { error: loanError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_id: formData.toAccount,
          amount: parseFloat(formData.amount),
          direction: 'credit',
          description: `Loan Application (${LOAN_TYPES.find(t => t.id === formData.loanType).name})`,
          status: 'pending'
        });

      if (loanError) throw loanError;

      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="loan-container">
      <div className="loan-header">
        <h2>Loan Applications</h2>
        <p>Apply for a loan with PHC. Get a decision in minutes.</p>
      </div>

      <div className="loan-grid">
        <div className="loan-main">
          {profile?.is_inactive && (
            <div className="error-message">
              <AlertCircle size={16} /> Your account is inactive. You can view your dashboard, but you cannot request loans.
            </div>
          )}
          {step === 1 && (
            <div className="loan-card">
              <h3>Calculate Your Loan</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (profile?.is_inactive) {
                  setError('Your account is inactive. Loan requests are disabled.');
                  return;
                }
                setError(null);
                setStep(2);
              }} className="loan-form">
                <div className="form-group">
                  <label>Loan Type</label>
                  <select name="loanType" value={formData.loanType} onChange={handleChange}>
                    {LOAN_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.name} (from {t.rate} APR)</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Deposit Loan to Account</label>
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
                  <label>How much do you need? (Max £{LOAN_TYPES.find(t => t.id === formData.loanType).max.toLocaleString()})</label>
                  <input 
                    type="number" 
                    name="amount" 
                    placeholder="0.00" 
                    value={formData.amount} 
                    onChange={handleChange} 
                    required 
                    className="no-symbol-input"
                  />
                </div>

                <div className="form-group">
                  <label>Repayment Period (Months)</label>
                  <select name="duration" value={formData.duration} onChange={handleChange}>
                    <option value="12">12 Months (1 Year)</option>
                    <option value="24">24 Months (2 Years)</option>
                    <option value="36">36 Months (3 Years)</option>
                    <option value="48">48 Months (4 Years)</option>
                    <option value="60">60 Months (5 Years)</option>
                  </select>
                </div>

                <div className="loan-preview">
                  <div className="monthly-est">
                    <span>Estimated Monthly Repayment</span>
                    <strong>£{calculateMonthly()}</strong>
                  </div>
                  <div className="preview-details">
                    <div className="detail">
                      <span>Interest Rate</span>
                      <strong>{LOAN_TYPES.find(t => t.id === formData.loanType).rate} Fixed</strong>
                    </div>
                    <div className="detail">
                      <span>Total Repayable</span>
                      <strong>£{(calculateMonthly() * formData.duration).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                <button type="submit" className="loan-btn" disabled={profile?.is_inactive}>
                  Continue Application <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="loan-card">
              <h3>Finalize Application</h3>
              <form onSubmit={handleSubmit} className="loan-form">
                <div className="form-group">
                  <label>Purpose of Loan</label>
                  <textarea 
                    name="reason" 
                    rows="4" 
                    placeholder="Briefly describe what you'll use this loan for..."
                    value={formData.reason}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <div className="security-notice">
                  <ShieldCheck size={20} />
                  <p>By clicking "Submit", you agree to our terms and conditions. We will perform a soft credit check which won't affect your score.</p>
                </div>

                {error && <div className="error-message"><AlertCircle size={16} /> {error}</div>}

                <div className="action-buttons">
                  <button type="button" onClick={() => setStep(1)} className="back-btn" disabled={submitting}>Back</button>
                  <button type="submit" className="confirm-btn" disabled={submitting || profile?.is_inactive}>
                    {submitting ? 'Processing...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="loan-card success-card">
              <div className="success-icon">
                <ShieldCheck size={64} />
              </div>
              <h3>Application Submitted!</h3>
              <p>Your application for a <strong>£{parseFloat(formData.amount).toLocaleString()} {LOAN_TYPES.find(t => t.id === formData.loanType).name}</strong> has been received.</p>
              <p className="status-note">Our loan officers are reviewing your request. You will see this as a "Pending" transaction in your dashboard.</p>
              <button onClick={() => navigate('/dashboard')} className="finish-btn">
                Back to Dashboard
              </button>
            </div>
          )}
        </div>

        <div className="loan-sidebar">
          <div className="loan-card info-sidebar-card">
            <h3>Why choose PHC?</h3>
            <ul className="loan-info-list">
              <li>
                <Landmark size={20} className="info-icon" />
                <div>
                  <strong>Competitive Rates</strong>
                  <p>Fixed rates so you always know your monthly cost.</p>
                </div>
              </li>
              <li>
                <Calculator size={20} className="info-icon" />
                <div>
                  <strong>No Hidden Fees</strong>
                  <p>No arrangement fees or early repayment charges.</p>
                </div>
              </li>
              <li>
                <Wallet size={20} className="info-icon" />
                <div>
                  <strong>Fast Funding</strong>
                  <p>Funds usually arrive within 24 hours of approval.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loan;
