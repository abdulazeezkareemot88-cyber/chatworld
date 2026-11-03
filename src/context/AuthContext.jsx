import React, { createContext, useContext, useState, useEffect } from 'react';
import { uploadAttachment } from '../services/chatService';

const AuthContext = createContext();

const STORAGE_KEY = 'chatworld_current_user';

// Safe fetch helper that prevents JSON.parse syntax errors if a host returns HTML 404/500
async function safeFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = res.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  }

  if (!res.ok) {
    if (data && data.error) {
      throw new Error(data.error);
    }
    if (res.status === 404) {
      throw new Error('ChatWorld serverless backend not responding (404). Please ensure vercel.json is deployed.');
    }
    const raw = await res.text().catch(() => '');
    throw new Error(`Server returned status ${res.status}: ${raw.slice(0, 100)}`);
  }

  if (data === null) {
    const raw = await res.text().catch(() => '');
    throw new Error(`Unexpected non-JSON response from server: ${raw.slice(0, 100)}`);
  }

  return data;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session from localStorage on initial load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          setUser({ id: parsed.id, email: parsed.email || `${parsed.username}@chatworld.app` });
          setProfile(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved user:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // WhatsApp-style Sign Up
  const signUp = async ({
    phone,
    username,
    displayName,
    avatarUrl,
    statusMessage = 'Hey there! I am using ChatWorld.',
    password = '',
  }) => {
    setError(null);
    try {
      const cleanUsername = (username || phone || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
      const cleanPhone = (phone || '').trim();

      const data = await safeFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          phone: cleanPhone,
          username: cleanUsername,
          display_name: displayName.trim(),
          avatar_url:
            avatarUrl ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername || displayName}`,
          status_message: statusMessage,
          password,
        }),
      });

      const registeredUser = data.user;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(registeredUser));
      setUser({
        id: registeredUser.id,
        email: `${registeredUser.username}@chatworld.app`,
      });
      setProfile(registeredUser);

      return { user: registeredUser, profile: registeredUser };
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err.message);
      throw err;
    }
  };

  // Sign In (Phone or Username + Password/PIN)
  const signIn = async (identifier, password = '') => {
    setError(null);
    try {
      const data = await safeFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const loggedUser = data.user;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));
      setUser({
        id: loggedUser.id,
        email: `${loggedUser.username}@chatworld.app`,
      });
      setProfile(loggedUser);

      return { user: loggedUser, profile: loggedUser };
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message);
      throw err;
    }
  };

  // Sign Out
  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setProfile(null);
  };

  // Update Profile
  const updateProfile = async (updates) => {
    if (!user) throw new Error('Not authenticated');

    try {
      const data = await safeFetch('/api/auth/update-profile', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          ...updates,
        }),
      });

      const updated = data.user;
      setProfile(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.error('updateProfile error:', err);
      throw err;
    }
  };

  // Upload Avatar
  const uploadAvatar = async (file) => {
    if (!user) throw new Error('Not authenticated');

    try {
      const url = await uploadAttachment(file, user.id);
      await updateProfile({ avatar_url: url });
      return url;
    } catch (err) {
      console.error('uploadAvatar error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        signUp,
        signIn,
        signOut,
        updateProfile,
        uploadAvatar,
        refreshProfile: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
