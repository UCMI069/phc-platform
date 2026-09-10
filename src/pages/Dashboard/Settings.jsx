import React, { useState, useEffect } from 'react';
import { neon as supabase, proxiedStorageUrl } from '../../lib/neon';
import { User, Mail, Phone, MapPin, Globe, Camera, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
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

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
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

      // Upload to 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
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
        </div>

        <div className="settings-sidebar">
          <div className="settings-card info-card">
            <h3>Security & Privacy</h3>
            <ul className="settings-info-list">
              <li>
                <div className="info-icon-box"><Save size={16} /></div>
                <div>
                  <strong>Two-Factor Auth</strong>
                  <p>Enhance your security by enabling 2FA.</p>
                </div>
              </li>
              <li>
                <div className="info-icon-box"><Globe size={16} /></div>
                <div>
                  <strong>Session Management</strong>
                  <p>View and manage your active login sessions.</p>
                </div>
              </li>
            </ul>
            <button className="secondary-btn">Manage Security</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
