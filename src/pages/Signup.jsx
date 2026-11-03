import React, { useState, useRef } from 'react';
import {
  Globe,
  Phone,
  User,
  AtSign,
  Camera,
  Lock,
  ArrowRight,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadAttachment } from '../services/chatService';

export const Signup = ({ onNavigateLogin }) => {
  const { signUp } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [phoneOrUsername, setPhoneOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('Hey there! I am using ChatWorld.');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  // Handle local avatar photo upload
  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim() || !phoneOrUsername.trim()) {
      setError('Please provide your name and phone number or username.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let uploadedAvatarUrl = avatarPreview;
      if (avatarFile) {
        setUploadingAvatar(true);
        try {
          uploadedAvatarUrl = await uploadAttachment(avatarFile, 'new-user');
        } catch (err) {
          console.warn('Avatar upload fallback to seed:', err);
        } finally {
          setUploadingAvatar(false);
        }
      }

      const isPhone = /^\+?[0-9\s\-()]{7,}$/.test(phoneOrUsername.trim());
      const cleanVal = phoneOrUsername.trim();

      await signUp({
        phone: isPhone ? cleanVal : '',
        username: !isPhone
          ? cleanVal.toLowerCase().replace(/[^a-z0-9_]/g, '')
          : `user_${cleanVal.replace(/[^0-9]/g, '').slice(-6)}`,
        displayName: displayName.trim(),
        avatarUrl:
          uploadedAvatarUrl ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanVal || displayName}`,
        statusMessage: statusMessage.trim() || 'Hey there! I am using ChatWorld.',
        password: password.trim(),
      });
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err.message || 'Failed to create account.');
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
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            Sign up like WhatsApp — connect from your phone or PC with no barriers!
          </p>
        </div>

        {/* Error Alert */}
        {error && <div className="auth-error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Avatar Photo Selection */}
          <div className="auth-avatar-picker-wrap">
            <div
              className="auth-avatar-bubble"
              onClick={() => fileInputRef.current?.click()}
              title="Upload profile picture"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile preview" className="auth-avatar-img" />
              ) : (
                <div className="auth-avatar-placeholder">
                  <Camera size={26} />
                  <span>Add Photo</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarFile}
            />
            <span className="auth-avatar-hint">
              Tap to upload a picture from phone or PC (optional)
            </span>
          </div>

          {/* Full Name */}
          <div className="auth-input-group">
            <label>Full Name</label>
            <div className="auth-input-field">
              <User size={18} className="auth-field-icon" />
              <input
                type="text"
                placeholder="e.g. Alex Rivera or Maria"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Phone Number or Username */}
          <div className="auth-input-group">
            <label>Phone Number or Username</label>
            <div className="auth-input-field">
              <Phone size={18} className="auth-field-icon" />
              <input
                type="text"
                placeholder="+1 234 567 8900 or @alex"
                value={phoneOrUsername}
                onChange={(e) => setPhoneOrUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* About / Status */}
          <div className="auth-input-group">
            <label>About / Status</label>
            <div className="auth-input-field">
              <Info size={18} className="auth-field-icon" />
              <input
                type="text"
                placeholder="Hey there! I am using ChatWorld."
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
              />
            </div>
          </div>

          {/* Password / PIN */}
          <div className="auth-input-group">
            <label>PIN / Password (for easy login later)</label>
            <div className="auth-input-field">
              <Lock size={18} className="auth-field-icon" />
              <input
                type="password"
                placeholder="4-6 digit PIN or password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || uploadingAvatar}
          >
            {loading || uploadingAvatar ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Creating Account...
              </>
            ) : (
              <>
                Agree &amp; Start Chatting <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="auth-card-footer">
          <span>Already have an account?</span>
          <button type="button" className="auth-link-btn" onClick={onNavigateLogin}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
