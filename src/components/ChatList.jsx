import React from 'react';
import { Check, CheckCheck, Users, MessageSquare } from 'lucide-react';

export const ChatList = ({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  currentUserId,
  searchQuery = '',
  filterTab = 'all',
}) => {
  // Format timestamp
  const formatConvTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  // Filter conversations
  const filtered = conversations.filter((c) => {
    // Search filter
    const matchesSearch =
      !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.last_message?.content?.toLowerCase().includes(searchQuery.toLowerCase());

    // Tab filter
    if (filterTab === 'unread') {
      return matchesSearch && c.unread_count > 0;
    }
    if (filterTab === 'groups') {
      return matchesSearch && c.type === 'group';
    }
    return matchesSearch;
  });

  if (filtered.length === 0) {
    return (
      <div className="chat-list-empty">
        <MessageSquare size={36} className="empty-icon" />
        <p className="empty-title">
          {searchQuery ? 'No chats found' : 'No conversations yet'}
        </p>
        <span className="empty-subtitle">
          {searchQuery
            ? 'Try searching with a different term'
            : 'Click the + button to start a new chat'}
        </span>
      </div>
    );
  }

  return (
    <div className="chat-list-scrollable">
      {filtered.map((conv) => {
        const isActive = conv.id === activeConversationId;
        const lastMsg = conv.last_message;
        const isLastOwn = lastMsg?.sender_id === currentUserId;

        return (
          <div
            key={conv.id}
            className={`chat-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectConversation(conv)}
          >
            {/* Avatar */}
            <div className="chat-avatar-wrapper">
              <img
                src={
                  conv.avatar_url ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${conv.name}`
                }
                alt={conv.name}
                className="chat-avatar"
              />
              {conv.type !== 'group' && <span className="online-indicator-dot" />}
            </div>

            {/* Chat Content Info */}
            <div className="chat-content-wrap">
              <div className="chat-row-top">
                <h4 className="chat-name">{conv.name}</h4>
                <span className={`chat-time ${conv.unread_count > 0 ? 'unread' : ''}`}>
                  {formatConvTime(conv.updated_at || lastMsg?.created_at)}
                </span>
              </div>

              <div className="chat-row-bottom">
                <div className="chat-preview-text">
                  {isLastOwn && lastMsg && (
                    <span className="preview-tick">
                      {lastMsg.status === 'read' ? (
                        <CheckCheck size={14} className="tick-read" />
                      ) : (
                        <Check size={14} />
                      )}
                    </span>
                  )}
                  <span className="preview-snippet">
                    {lastMsg
                      ? lastMsg.message_type === 'audio'
                        ? '🎙️ Voice note'
                        : lastMsg.message_type === 'image'
                        ? '📷 Photo'
                        : lastMsg.message_type === 'document'
                        ? '📄 Document'
                        : lastMsg.content
                      : 'No messages yet'}
                  </span>
                </div>

                {conv.unread_count > 0 && (
                  <span className="unread-badge">{conv.unread_count}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatList;
