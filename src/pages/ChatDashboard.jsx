import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Lock, Globe, MessageSquarePlus, Laptop } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getConversations,
  getOrCreateDirectConversation,
  createGroupConversation,
  subscribeToConversations,
} from '../services/chatService';

import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ContactSearch from '../components/ContactSearch';
import ProfileModal from '../components/ProfileModal';
import CallModal from '../components/CallModal';
import StatusModal from '../components/StatusModal';
import ConfigBanner from '../components/ConfigBanner';

export const ChatDashboard = () => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [activeCall, setActiveCall] = useState(null); // { contact, callType }

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getConversations(user.id);
      setConversations(data);

      // Keep active conversation reference fresh
      if (activeConversation) {
        const found = data.find((c) => c.id === activeConversation.id);
        if (found) setActiveConversation(found);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [user, activeConversation]);

  useEffect(() => {
    loadConversations();
  }, [user?.id]);

  // Subscribe to real-time conversation updates
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToConversations(user.id, () => {
      loadConversations();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id, loadConversations]);

  // Start 1-on-1 chat
  const handleStartChat = async (targetUser) => {
    try {
      const conv = await getOrCreateDirectConversation(user.id, targetUser);
      await loadConversations();
      setActiveConversation(conv);
    } catch (err) {
      console.error('Failed to start chat:', err);
      alert('Could not start conversation. Please try again.');
    }
  };

  // Create Group chat
  const handleCreateGroup = async (groupName, memberIds) => {
    try {
      const group = await createGroupConversation(user.id, groupName, memberIds);
      await loadConversations();
      setActiveConversation(group);
    } catch (err) {
      console.error('Failed to create group:', err);
      alert('Could not create group. Please try again.');
    }
  };

  // Delete conversation
  const handleDeleteConversation = (conversationId) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
      }
    }
  };

  return (
    <div className="chatworld-dashboard-wrapper">
      {/* Supabase Setup / Sandbox Notification Banner */}
      <ConfigBanner />

      <div className={`chatworld-main-layout ${activeConversation ? 'has-active-chat' : ''}`}>
        {/* Left Sidebar */}
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversation?.id}
          onSelectConversation={(conv) => setActiveConversation(conv)}
          onOpenNewChat={() => setShowNewChatModal(true)}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenStatus={() => setShowStatusModal(true)}
        />

        {/* Right Chat Area or Welcome Screen */}
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            onBack={() => setActiveConversation(null)}
            onStartCall={(contact, callType) =>
              setActiveCall({ contact, callType })
            }
            onDeleteConversation={handleDeleteConversation}
          />
        ) : (
          <div className="chatworld-welcome-screen">
            <div className="welcome-content-card">
              <div className="welcome-logo-circle">
                <Globe size={54} />
              </div>
              <h2 className="welcome-title">ChatWorld Web</h2>
              <p className="welcome-description">
                Send and receive messages in real time. Experience seamless communication
                with end-to-end encryption across all your devices.
              </p>

              <button
                type="button"
                className="welcome-start-btn"
                onClick={() => setShowNewChatModal(true)}
              >
                <MessageSquarePlus size={18} /> Start a New Conversation
              </button>

              <div className="welcome-footer-tag">
                <Lock size={13} />
                <span>End-to-end encrypted</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewChatModal && (
        <ContactSearch
          currentUserId={user?.id}
          onStartChat={handleStartChat}
          onCreateGroup={handleCreateGroup}
          onClose={() => setShowNewChatModal(false)}
        />
      )}

      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}

      {showStatusModal && (
        <StatusModal onClose={() => setShowStatusModal(false)} />
      )}

      {activeCall && (
        <CallModal
          contact={activeCall.contact}
          callType={activeCall.callType}
          onClose={() => setActiveCall(null)}
        />
      )}
    </div>
  );
};

export default ChatDashboard;
