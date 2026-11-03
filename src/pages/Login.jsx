import React, { useState } from 'react';
import { Globe, Phone, Lock, Loader2, ArrowRight, UserPlus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = ({ onNavigateSignup, onNavigateForgot }) => {
  const { signIn } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setError('');
    try {
      await signIn(identifier.trim(), password.trim());
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Account not found. Please create an account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-brand-header">
          <div className="auth-logo-badge">
            <Globe size={32} />
          </div>
          <h1 className="auth-title">Welcome to ChatWorld</h1>
          <p className="auth-subtitle">
            WhatsApp-style messaging, stories, and file sharing on phone &amp; PC
          </p>
        </div>

        {/* Error Alert */}
        {error && <div className="auth-error-alert">{error}</div>}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label>Phone Number or Username</label>
            <div className="auth-input-field">
              <Phone size={18} className="auth-field-icon" />
              <input
                type="text"
                placeholder="+1 234 567 8900 or @username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label>PIN / Password (if set)</label>
            <div className="auth-input-field">
              <Lock size={18} className="auth-field-icon" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Signing In...
              </>
            ) : (
              <>
                Sign In to ChatWorld <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Create Account Action */}
        <div className="auth-secondary-action-box">
          <p>New to ChatWorld?</p>
          <button
            type="button"
            className="auth-secondary-btn"
            onClick={onNavigateSignup}
          >
            <UserPlus size={16} /> Create New Account
          </button>
        </div>

        {/* Footer Navigation */}
        <div className="auth-card-footer">
          <span>End-to-end encrypted • Works on Phone &amp; PC</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
