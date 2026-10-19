import React, { useState } from 'react';
import { X, Shield } from 'lucide-react';
import './TOTPModal.css';

const TOTPModal = ({ isOpen, onClose, onVerify, userId, title = 'Two-Factor Authentication' }) => {
  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setVerifying(true);
    try {
      const result = await onVerify(userId, token);
      if (result?.error) {
        setError(result.error);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="totp-overlay">
      <div className="totp-modal">
        <div className="totp-header">
          <h3>{title}</h3>
          <button className="totp-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="totp-form">
          <p>Enter the 6-digit code from your authenticator app to continue.</p>
          <div className="totp-input-group">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="------"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              autoFocus
            />
          </div>
          {error && <div className="totp-error">{error}</div>}
          <button type="submit" className="totp-verify-btn" disabled={verifying || token.length < 6}>
            {verifying ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TOTPModal;
