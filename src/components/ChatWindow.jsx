import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  ArrowLeft,
  Shield,
  Loader2,
  Lock,
  X,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../hooks/useMessages';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

export const ChatWindow = ({
  conversation,
  onBack,
  onStartCall,
  onDeleteConversation,
}) => {
  const { user } = useAuth();
  const {
    messages,
    loading,
    sending,
    sendTextMessage,
    sendMediaMessage,
    sendAudioNote,
    removeMessage,
  } = useMessages(conversation?.id, user?.id);

  const [replyingTo, setReplyingTo] = useState(null);
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Group messages by date for date divider pills
  const formatDividerDate = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return 'TODAY';
      }
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return 'YESTERDAY';
      }
      return date.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return '';
    }
  };

  const filteredMessages = chatSearchQuery.trim()
    ? messages.filter((m) =>
        m.content?.toLowerCase().includes(chatSearchQuery.toLowerCase())
      )
    : messages;

  return (
    <div className="chatworld-window">
      {/* Top Header */}
      <div className="chat-window-header">
        <div className="chat-header-left">
          {/* Mobile Back Button */}
          <button
            type="button"
            className="chat-back-btn"
            onClick={onBack}
            title="Back to chats"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Contact / Group Avatar */}
          <div className="chat-header-avatar-wrap">
            <img
              src={
                conversation?.avatar_url ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${conversation?.name}`
              }
              alt={conversation?.name}
              className="chat-header-avatar"
            />
            {conversation?.type !== 'group' && (
              <span className="online-indicator-dot" />
            )}
          </div>

          {/* Contact Info */}
          <div className="chat-header-info">
            <h3 className="chat-header-name">{conversation?.name}</h3>
            <span className="chat-header-status">
              {conversation?.type === 'group'
                ? 'group conversation'
                : 'online'}
            </span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="chat-header-actions">
          {/* Video Call */}
          <button
            type="button"
            className="chat-header-btn"
            onClick={() => onStartCall(conversation, 'video')}
            title="Video call"
          >
            <Video size={20} />
          </button>

          {/* Voice Call */}
          <button
            type="button"
            className="chat-header-btn"
            onClick={() => onStartCall(conversation, 'audio')}
            title="Voice call"
          >
            <Phone size={19} />
          </button>

          {/* Search inside chat */}
          <button
            type="button"
            className={`chat-header-btn ${showInChatSearch ? 'active' : ''}`}
            onClick={() => setShowInChatSearch(!showInChatSearch)}
            title="Search messages"
          >
            <Search size={19} />
          </button>

          {/* Menu Dropdown */}
          <div className="chat-header-menu-wrap">
            <button
              type="button"
              className="chat-header-btn"
              onClick={() => setShowMenu(!showMenu)}
              title="More options"
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div
                className="chat-header-dropdown"
                onClick={() => setShowMenu(false)}
              >
                <button
                  type="button"
                  className="menu-danger"
                  onClick={() => onDeleteConversation(conversation.id)}
                >
                  <Trash2 size={16} /> Delete Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* In-Chat Search Bar */}
      {showInChatSearch && (
        <div className="in-chat-search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search messages in this chat..."
            value={chatSearchQuery}
            onChange={(e) => setChatSearchQuery(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            className="search-close-btn"
            onClick={() => {
              setShowInChatSearch(false);
              setChatSearchQuery('');
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Messages Canvas */}
      <div className="chat-messages-canvas">
        {/* End-to-End Encryption Banner */}
        <div className="encryption-notice">
          <Lock size={12} />
          <span>Messages and calls are end-to-end encrypted. No one outside of this chat can read them.</span>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="messages-loading">
            <Loader2 size={28} className="animate-spin" />
            <span>Loading messages...</span>
          </div>
        )}

        {/* Empty Chat State */}
        {!loading && filteredMessages.length === 0 && (
          <div className="chat-empty-state">
            <div className="chat-empty-bubble">
              Say hello to start the conversation! 👋
            </div>
          </div>
        )}

        {/* Message Items with Date Dividers */}
        {!loading &&
          filteredMessages.map((msg, index) => {
            const prevMsg = filteredMessages[index - 1];
            const showDivider =
              !prevMsg ||
              formatDividerDate(prevMsg.created_at) !==
                formatDividerDate(msg.created_at);

            return (
              <React.Fragment key={msg.id}>
                {showDivider && (
                  <div className="date-divider-pill">
                    <span>{formatDividerDate(msg.created_at)}</span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  currentUserId={user?.id}
                  onReply={(targetMsg) => setReplyingTo(targetMsg)}
                  onDelete={removeMessage}
                  allMessages={messages}
                />
              </React.Fragment>
            );
          })}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Footer */}
      <MessageInput
        onSendText={sendTextMessage}
        onSendMedia={sendMediaMessage}
        onSendAudio={sendAudioNote}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        disabled={sending}
      />
    </div>
  );
};

export default ChatWindow;
