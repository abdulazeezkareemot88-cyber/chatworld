import React, { useState } from 'react';
import { Globe, Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ForgotPassword = ({ onNavigateLogin }) => {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send password reset email.');
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
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">
            Enter your email address and we will send you a password reset link
          </p>
        </div>

        {/* Error Alert */}
        {error && <div className="auth-error-alert">{error}</div>}

        {submitted ? (
          <div className="auth-success-card">
            <CheckCircle2 size={48} className="success-icon" />
            <h3>Check your inbox</h3>
            <p>
              If an account exists for <strong>{email}</strong>, we have sent instructions to
              reset your password.
            </p>
            <button
              type="button"
              className="auth-submit-btn"
              onClick={onNavigateLogin}
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-input-group">
              <label>Email Address</label>
              <div className="auth-input-field">
                <Mail size={18} className="auth-field-icon" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Sending Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="auth-card-footer">
          <button
            type="button"
            className="auth-link-bold back-link"
            onClick={onNavigateLogin}
          >
            <ArrowLeft size={16} /> Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
