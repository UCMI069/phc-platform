import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { neon as supabase } from '../lib/neon';
import { Eye, EyeOff } from 'lucide-react';
import TOTPModal from '../components/TOTPModal';
import './Auth.css';
import logo from '../assets/phc-logo.png';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [show2FAModal, setShow2FAModal] = useState(false);

  const handleLogin = async () => {
    if (pendingUser?.requires2FA) {
      try {
        const { data: prof, error: profError } = await supabase
          .from('profiles')
          .select('is_2fa_enabled, totp_secret')
          .eq('id', pendingUser.user.id)
          .single();

        if (profError) throw profError;
        if (!prof?.is_2fa_enabled) {
          setPendingUser(null);
          setShow2FAModal(false);
          return;
        }
      } catch (err) {
        console.error('2FA profile check error:', err);
      }
      setShow2FAModal(true);
      return;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      if (data?.user) {
        if (data.requires2FA) {
          setPendingUser({ user: data.user, requires2FA: true });
          setShow2FAModal(true);
          return;
        }

        const { data: prof } = await supabase
          .from('profiles')
          .select('blocked')
          .eq('id', data.user.id)
          .single();

        if (prof?.blocked) {
          await supabase.auth.signOut();
          throw new Error('Your account has been locked. Please contact support.');
        }

        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTOTP = async (userId, token) => {
    try {
      const { data, error: totpError } = await supabase.auth.verifyTOTP({
        userId,
        token,
        purpose: 'auth',
      });

      if (totpError) throw totpError;
      if (!data?.verified) throw new Error('Invalid verification code');

      setShow2FAModal(false);
      setPendingUser(null);

      if (pendingUser?.user?.id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('blocked')
          .eq('id', pendingUser.user.id)
          .single();

        if (prof?.blocked) {
          await supabase.auth.signOut();
          setError('Your account has been locked. Please contact support.');
          return;
        }
      }

      navigate('/dashboard');
    } catch (err) {
      return { error: err.message };
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img 
            src={logo} 
            alt="PHC Banking Logo" 
            className="auth-logo"
          />
          <h2>Log in to Online Banking</h2>
          <p>Securely access your accounts and manage your finances.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email or Customer Number</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
          <p><Link to="/forgot-password">Forgotten your login details?</Link></p>
        </div>
      </div>

      {pendingUser && (
        <TOTPModal
          isOpen={show2FAModal}
          onClose={() => setShow2FAModal(false)}
          onVerify={(userId, token) => handleVerifyTOTP(userId, token)}
          userId={pendingUser.user.id}
          title="Two-Factor Authentication"
        />
      )}
    </div>
  );
};

export default Login;
