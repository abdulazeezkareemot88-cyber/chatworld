import React, { useState } from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ChatDashboard from './pages/ChatDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import './App.css';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup' | 'forgot'

  if (loading) {
    return (
      <div className="chatworld-splash-screen">
        <div className="splash-logo-wrap">
          <Globe size={64} className="splash-logo" />
        </div>
        <h1 className="splash-title">ChatWorld</h1>
        <div className="splash-progress-track">
          <div className="splash-progress-bar" />
        </div>
        <p className="splash-subtitle">End-to-end encrypted messaging</p>
      </div>
    );
  }

  if (!user) {
    if (authView === 'signup') {
      return <Signup onNavigateLogin={() => setAuthView('login')} />;
    }
    if (authView === 'forgot') {
      return <ForgotPassword onNavigateLogin={() => setAuthView('login')} />;
    }
    return (
      <Login
        onNavigateSignup={() => setAuthView('signup')}
        onNavigateForgot={() => setAuthView('forgot')}
      />
    );
  }

  return <ChatDashboard />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}