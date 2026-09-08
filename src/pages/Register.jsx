import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useNotification } from '../context/NotificationContext';
import { Eye, EyeOff } from 'lucide-react';
import './Auth.css';
import logo from '../assets/phc-logo.png';

const Register = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'checkings'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            account_type: formData.accountType
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data?.user) {
        const user = data.user;
        
        // 1. Manually create the profile (bypass trigger issues)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            username: formData.email,
            currency: 'GBP'
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }

        // 2. Manually create the initial account
        const { error: accountError } = await supabase
          .from('accounts')
          .insert({
            user_id: user.id,
            type: formData.accountType,
            balance: 0.00,
            active: true,
            tier: 'Standard'
          });

        if (accountError) {
          console.error("Account creation error:", accountError);
        }

        addNotification("Registration successful! You can now log in to your account.", "success");
        navigate('/login');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          <h2>Register for Online Banking</h2>
          <p>Join millions of customers managing their money securely.</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              placeholder="Enter your first name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              placeholder="Enter your last name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="accountType">Account Type</label>
            <select
              id="accountType"
              value={formData.accountType}
              onChange={handleChange}
              required
            >
              <option value="savings">savings Account</option>
              <option value="Stocks">Stocks Account</option>
              <option value="checkings">checkings Account</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
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
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Log in here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
