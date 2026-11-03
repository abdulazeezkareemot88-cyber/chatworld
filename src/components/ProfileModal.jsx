import React, { useState, useRef } from 'react';
import { X, Camera, Save, User, AtSign, Info, Phone, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfileModal = ({ onClose }) => {
  const { user, profile, updateProfile, uploadAvatar, signOut } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [statusMessage, setStatusMessage] = useState(
    profile?.status_message || 'Hey there! I am using ChatWorld.'
  );
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setErrorMsg('');
    try {
      await uploadAvatar(file);
      setSuccessMsg('Profile picture updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Avatar upload error:', err);
      setErrorMsg('Failed to upload image. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await updateProfile({
        display_name: displayName.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        phone: phone.trim(),
        status_message: statusMessage.trim(),
      });
      setSuccessMsg('Profile saved successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Update profile error:', err);
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window profile-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h3>Profile &amp; Settings</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSave} className="profile-form">
          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper">
              <img
                src={
                  profile?.avatar_url ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.username || user?.id}`
                }
                alt="Avatar"
                className="profile-avatar-large"
              />
              <button
                type="button"
                className="avatar-change-badge"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                title="Change Profile Picture"
              >
                {uploadingAvatar ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>
            <p className="avatar-hint">Click the camera icon to upload a photo</p>
          </div>

          {/* Feedback messages */}
          {successMsg && <div className="form-alert success">{successMsg}</div>}
          {errorMsg && <div className="form-alert error">{errorMsg}</div>}

          {/* Form Fields */}
          <div className="form-field-group">
            <label>
              <User size={16} /> Your Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="Display name"
            />
          </div>

          <div className="form-field-group">
            <label>
              <AtSign size={16} /> Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="username"
            />
          </div>

          <div className="form-field-group">
            <label>
              <Phone size={16} /> Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234 567 8900"
            />
          </div>

          <div className="form-field-group">
            <label>
              <Info size={16} /> About / Status
            </label>
            <input
              type="text"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="Hey there! I am using ChatWorld."
            />
          </div>

          {/* Actions */}
          <div className="profile-actions-row">
            <button
              type="button"
              className="btn-danger-outline"
              onClick={handleLogout}
            >
              <LogOut size={16} /> Log Out
            </button>

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
