import React, { useState, useEffect } from 'react';
import { neon as supabase, proxiedStorageUrl } from '../../lib/neon';
import { User, Mail, Phone, MapPin, Globe, Camera, Save, AlertCircle, CheckCircle2, Shield, QrCode, Key, Trash2, Copy, Check, FileText, Upload, CheckCircle2 as CheckCircle2Icon, XCircle, X, Eye, Loader2 } from 'lucide-react';
import './Settings.css';

const CURRENCIES = [
  { code: 'GBP', name: 'British Pound (£)', symbol: '£' },
  { code: 'USD', name: 'Dollar ($)', symbol: '$' },
  { code: 'EUR', name: 'Euro (€)', symbol: '€' },
  { code: 'CAD', name: 'Dollar ($)', symbol: '$' },
  { code: 'AUD', name: 'Dollar ($)', symbol: '$' },
  { code: 'JPY', name: 'Yen (¥)', symbol: '¥' },
  { code: 'CHF', name: 'Franc (CHF)', symbol: 'Fr' },
  { code: 'CNY', name: 'Yuan (¥)', symbol: '¥' },
];

const Settings = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
    currency: 'GBP',
    avatarUrl: ''
  });

  const [twoFactor, setTwoFactor] = useState({
    enabled: false,
    settingUp: false,
    secret: null,
    qrCode: null,
    verificationCode: '',
    setupLoading: false,
  });
  const [copiedSecret, setCopiedSecret] = useState(false);

  // KYC State
  const [kyc, setKyc] = useState({
    status: 'none', // none, pending, approved, rejected
    documentFront: null,
    documentBack: null,
    uploading: false,
    error: null,
    success: null
  });

  useEffect(() => {
    fetchProfile();
    fetchKYCStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*, is_2fa_enabled, kyc_verified, credit_card_tier, credit_card_status')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        setTwoFactor(prev => ({ ...prev, enabled: data.is_2fa_enabled || false }));
        setFormData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          phone: data.phone || '',
          country: data.country || '',
          currency: data.currency || 'GBP',
          avatarUrl: data.avatar_url || ''
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKYCStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(`/api/kyc-requests?user_id=${user.id}`);
      const data = await res.json();
      if (data.request) {
        setKyc(prev => ({ 
          ...prev, 
          status: data.request.status,
          documentFront: data.request.document_front_url,
          documentBack: data.request.document_back_url
        }));
      } else if (profile?.kyc_verified) {
        setKyc(prev => ({ ...prev, status: 'approved' }));
      }
    } catch (err) {
      console.error('Failed to fetch KYC status:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (profile?.is_inactive) {
      setError('Your account is inactive. Profile updates are disabled.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
      setSuccess("Profile picture uploaded! Don't forget to save changes.");
    } catch (err) {
      setError("Upload failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (profile?.is_inactive) {
      setError('Your account is inactive. Profile updates are disabled.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          country: formData.country,
          currency: formData.currency,
          avatar_url: formData.avatarUrl,
          updated_at: new Date()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess("Profile updated successfully!");
      fetchProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // KYC Functions
  const handleKYCFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      setKyc(prev => ({ ...prev, error: 'File size must be less than 10MB' }));
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setKyc(prev => ({ ...prev, error: 'Only JPG, PNG, or PDF files are allowed' }));
      return;
    }

    setKyc(prev => ({ ...prev, error: null }));
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setKyc(prev => ({ 
        ...prev, 
        [type === 'front' ? 'documentFront' : 'documentBack']: reader.result 
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleKYCUpload = async () => {
    if (!kyc.documentFront) {
      setKyc(prev => ({ ...prev, error: 'Front document is required' }));
      return;
    }

    setKyc(prev => ({ ...prev, uploading: true, error: null, success: null }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Upload files to storage (using the upload API)
      const uploadFile = async (dataUrl, suffix) => {
        const response = await fetch('/api/upload-kyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bucket: 'kyc-documents',
            path: `${user.id}/${Date.now()}-${suffix}`,
            contentType: 'image/jpeg',
            data: dataUrl
          })
        });
        const data = await response.json();
        return data.url;
      };

      const frontUrl = await uploadFile(kyc.documentFront, 'front');
      const backUrl = kyc.documentBack ? await uploadFile(kyc.documentBack, 'back') : null;

      // Submit KYC request
      const res = await fetch('/api/kyc-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.id, 
          document_front_url: frontUrl, 
          document_back_url: backUrl 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit KYC');

      setKyc(prev => ({ 
        ...prev, 
        status: 'pending', 
        uploading: false, 
        success: 'KYC documents submitted for review!'
      }));
      fetchKYCStatus();
    } catch (err) {
      setKyc(prev => ({ ...prev, uploading: false, error: err.message }));
    }
  };

  const removeKYCFile = (type) => {
    setKyc(prev => ({ 
      ...prev, 
      [type === 'front' ? 'documentFront' : 'documentBack']: null 
    }));
  };

  const copySecret = () => {
    navigator.clipboard.writeText(twoFactor.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleSetup2FA = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setTwoFactor(prev => ({ ...prev, setupLoading: true, settingUp: true }));
    try {
      const { data, error: setupError } = await supabase.auth.setup2FA(user.id);
      if (setupError) throw setupError;
      setTwoFactor(prev => ({
        ...prev,
        secret: data.secret,
        qrCode: data.qrCode,
        verificationCode: '',
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setTwoFactor(prev => ({ ...prev, setupLoading: false }));
    }
  };

  const handleEnable2FA = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setTwoFactor(prev => ({ ...prev, setupLoading: true }));
    setError(null);
    setSuccess(null);

    try {
      const { data, error: enableError } = await supabase.auth.configure2FA({
        userId: user.id,
        enable: true,
        token: twoFactor.verificationCode,
        secret: twoFactor.secret,
      });
       if (enableError) throw enableError;

      setSuccess('Two-factor authentication enabled successfully!');
      setTwoFactor({
        enabled: true, settingUp: false, secret: null, qrCode: null,
        verificationCode: '', setupLoading: false,
      });
      fetchProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setTwoFactor(prev => ({ ...prev, setupLoading: false }));
    }
  };

  const handleDisable2FA = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!window.confirm('Are you sure you want to disable two-factor authentication?')) return;

    setError(null);
    setSuccess(null);
    try {
      const { data, error: disableError } = await supabase.auth.configure2FA({
        userId: user.id,
        enable: false,
      });
      if (disableError) throw disableError;

      setSuccess('Two-factor authentication disabled.');
      setTwoFactor({
        enabled: false, settingUp: false, secret: null, qrCode: null,
        verificationCode: '', setupLoading: false,
      });
      fetchProfile();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading-spinner">Loading settings...</div>;

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Account Settings</h2>
        <p>Manage your profile information, preferences, and security.</p>
      </div>

      {profile?.is_inactive && (
        <div className="error-message" style={{ marginBottom: '16px' }}>
          <AlertCircle size={16} /> Your account is inactive. You can view settings, but updates are disabled.
        </div>
      )}

      <div className="settings-grid">
        <div className="settings-main">
          <div className="settings-card profile-card">
            <div className="avatar-section">
              <div className="avatar-wrapper">
                {formData.avatarUrl ? (
                  <img src={proxiedStorageUrl(formData.avatarUrl)} alt="Profile" className="profile-avatar" />
                ) : (
                  <div className="profile-avatar-placeholder">
                    {formData.firstName?.[0]}{formData.lastName?.[0]}
                  </div>
                )}
                <label htmlFor="avatar-input" className="avatar-upload-btn">
                  <Camera size={18} />
                </label>
                <input 
                  type="file" 
                  id="avatar-input" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  disabled={submitting || profile?.is_inactive}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="avatar-info">
                <h3>{formData.firstName} {formData.lastName}</h3>
                <p>{profile?.email}</p>
                {profile?.kyc_verified && (
                  <span className="kyc-badge verified">
                    <CheckCircle2Icon size={14} /> KYC Verified
                  </span>
                )}
                {kyc.status === 'pending' && (
                  <span className="kyc-badge pending">
                    <Loader2 size={14} className="spin" /> KYC Under Review
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="settings-form">
              <div className="form-row">
                <div className="form-group">
                  <label><User size={14} /> First Name</label>
                  <input 
                    type="text" 
                    name="firstName" 
                    value={formData.firstName} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label><User size={14} /> Last Name</label>
                  <input 
                    type="text" 
                    name="lastName" 
                    value={formData.lastName} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label><Phone size={14} /> Phone Number</label>
                <input 
                  type="tel" 
                  name="phone" 
                  placeholder="+44 7700 900000"
                  value={formData.phone} 
                  onChange={handleChange} 
                />
              </div>

              <div className="form-group">
                <label><MapPin size={14} /> Country</label>
                <input 
                  type="text" 
                  name="country" 
                  placeholder="United Kingdom"
                  value={formData.country} 
                  onChange={handleChange} 
                />
              </div>

              <div className="form-group">
                <label><Globe size={14} /> Preferred Currency</label>
                <select name="currency" value={formData.currency} onChange={handleChange}>
                  {CURRENCIES.map(curr => (
                    <option key={curr.code} value={curr.code}>{curr.name}</option>
                  ))}
                </select>
                <p className="form-help">This will change how your balances are displayed across the dashboard.</p>
              </div>

              {error && <div className="error-message"><AlertCircle size={16} /> {error}</div>}
              {success && <div className="success-message"><CheckCircle2 size={16} /> {success}</div>}

              <button type="submit" className="save-settings-btn" disabled={submitting || profile?.is_inactive}>
                <Save size={18} /> {submitting ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>

            {/* KYC Verification Section */}
            <div className="settings-card kyc-card">
              <div className="card-header">
                <h3><FileText size={18} /> KYC Verification</h3>
                <p className="card-description">Verify your identity to unlock higher limits and premium features</p>
              </div>

              {kyc.status === 'approved' && (
                <div className="kyc-status approved">
                  <div className="kyc-status-icon success">
                    <CheckCircle2Icon size={24} />
                  </div>
                  <div className="kyc-status-text">
                    <h4>KYC Verified</h4>
                    <p>Your identity has been verified successfully.</p>
                  </div>
                </div>
              )}

              {kyc.status === 'pending' && (
                <div className="kyc-status pending">
                  <div className="kyc-status-icon pending">
                    <Loader2 size={24} className="spin" />
                  </div>
                  <div className="kyc-status-text">
                    <h4>Under Review</h4>
                    <p>Your documents are being reviewed by our team. This usually takes 1-2 business days.</p>
                  </div>
                </div>
              )}

              {kyc.status === 'rejected' && (
                <div className="kyc-status rejected">
                  <div className="kyc-status-icon rejected">
                    <XCircle size={24} />
                  </div>
                  <div className="kyc-status-text">
                    <h4>Verification Rejected</h4>
                    <p>Your documents were not approved. Please try again with clearer images.</p>
                  </div>
                </div>
              )}

              {kyc.status !== 'approved' && (
                <div className="kyc-upload-section">
                  <div className="upload-grid">
                    <div className="upload-box" onClick={() => document.getElementById('kyc-front-input')?.click()}>
                      <input 
                        id="kyc-front-input"
                        type="file" 
                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                        onChange={(e) => handleKYCFileChange(e, 'front')}
                        style={{ display: 'none' }}
                      />
                      {kyc.documentFront ? (
                        <div className="upload-preview">
                          <img src={kyc.documentFront} alt="Front" />
                          <button type="button" className="remove-btn" onClick={(e) => { e.stopPropagation(); removeKYCFile('front'); }}>
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          <Upload size={32} />
                          <span>Upload Front of ID</span>
                          <p className="upload-hint">Company ID, Passport, or Driver's License</p>
                        </div>
                      )}
                    </div>

                    <div className="upload-box" onClick={() => document.getElementById('kyc-back-input')?.click()}>
                      <input 
                        id="kyc-back-input"
                        type="file" 
                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                        onChange={(e) => handleKYCFileChange(e, 'back')}
                        style={{ display: 'none' }}
                      />
                      {kyc.documentBack ? (
                        <div className="upload-preview">
                          <img src={kyc.documentBack} alt="Back" />
                          <button type="button" className="remove-btn" onClick={(e) => { e.stopPropagation(); removeKYCFile('back'); }}>
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          <Upload size={32} />
                          <span>Upload Back of ID</span>
                          <p className="upload-hint">Back side of the document</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {kyc.error && <div className="error-message"><AlertCircle size={16} /> {kyc.error}</div>}
                  {kyc.success && <div className="success-message"><CheckCircle2 size={16} /> {kyc.success}</div>}

                  <button 
                    type="button" 
                    className="kyc-submit-btn" 
                    onClick={handleKYCUpload}
                    disabled={kyc.uploading || !kyc.documentFront || kyc.status === 'approved' || kyc.status === 'pending'}
                  >
                    {kyc.uploading ? (
                      <>
                        <Loader2 size={18} className="spin" style={{ marginRight: '8px' }} />
                        Submitting...
                      </>
                    ) : kyc.status === 'pending' ? (
                      'Under Review'
                    ) : kyc.status === 'approved' ? (
                      'Verified'
                    ) : (
                      'Submit for Verification'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="settings-sidebar">
          <div className="settings-card info-card">
            <h3>Security & Privacy</h3>

            {twoFactor.enabled ? (
              <div className="twofa-status enabled">
                <div className="twofa-status-row">
                  <Shield size={16} />
                  <span>Two-Factor Authentication: <strong>Enabled</strong></span>
                </div>
                <p>Requires a 6-digit code from your authenticator app for login and transfers.</p>
                <button className="disable-2fa-btn" onClick={handleDisable2FA}>
                  <Trash2 size={14} /> Disable 2FA
                </button>
              </div>
            ) : (
              <div className="twofa-status">
                <div className="twofa-status-row">
                  <Shield size={16} />
                  <span>Two-Factor Authentication: <strong>Disabled</strong></span>
                </div>
                <p>Add an extra layer of security to your account by enabling 2FA with Google Authenticator.</p>
                <button className="enable-2fa-btn" onClick={handleSetup2FA} disabled={twoFactor.setupLoading}>
                  <Key size={14} /> {twoFactor.setupLoading ? 'Setting up...' : 'Set Up 2FA'}
                </button>
              </div>
            )}

            {twoFactor.settingUp && twoFactor.qrCode && (
              <div className="twofa-setup">
                <h4>Scan QR Code with Google Authenticator</h4>
                <img src={twoFactor.qrCode} alt="2FA QR Code" className="qr-code" />
                <p className="setup-help">Enter this code manually in your authenticator app:</p><div className="manual-secret-wrapper"><div className="manual-secret" title="{twoFactor.secret}">{twoFactor.secret}</div><button type="button" className="copy-secret-btn" onClick={copySecret} title="Copy secret"><span>{copiedSecret ? <Check size={14} /> : <Copy size={14} />}</span></button></div>

                <form onSubmit={handleEnable2FA} className="twofa-verify-form">
                  <div className="form-group">
                    <label htmlFor="verificationCode">Verification Code</label>
                    <input
                      type="text"
                      id="verificationCode"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="------"
                      value={twoFactor.verificationCode}
                      onChange={(e) => setTwoFactor(prev => ({ ...prev, verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      required
                    />
                  </div>
                  <button type="submit" className="confirm-2fa-btn" disabled={twoFactor.setupLoading || twoFactor.verificationCode.length < 6}>
                    {twoFactor.setupLoading ? 'Verifying...' : 'Confirm & Enable'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;