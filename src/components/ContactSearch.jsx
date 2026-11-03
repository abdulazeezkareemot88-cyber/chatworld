import React, { useState, useEffect } from 'react';
import { Search, X, Users, UserPlus, Check, Loader2 } from 'lucide-react';
import { searchUsers } from '../services/chatService';

export const ContactSearch = ({
  currentUserId,
  onStartChat,
  onCreateGroup,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' | 'group'
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Group creation state
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Load contacts and search debouncing
  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const users = await searchUsers(query.trim(), currentUserId);
        if (isMounted) setResults(users);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, query.trim() ? 200 : 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, currentUserId]);

  const toggleSelectMember = (user) => {
    if (selectedMembers.some((m) => m.id === user.id)) {
      setSelectedMembers((prev) => prev.filter((m) => m.id !== user.id));
    } else {
      setSelectedMembers((prev) => [...prev, user]);
    }
  };

  const handleCreateGroupSubmit = (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMembers.length === 0) return;
    onCreateGroup(
      groupName.trim(),
      selectedMembers.map((m) => m.id)
    );
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window contact-search-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h3>New Chat</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'direct' ? 'active' : ''}`}
            onClick={() => setActiveTab('direct')}
          >
            <UserPlus size={16} /> New Direct Chat
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'group' ? 'active' : ''}`}
            onClick={() => setActiveTab('group')}
          >
            <Users size={16} /> Create Group
          </button>
        </div>

        {/* Group Name input if in group tab */}
        {activeTab === 'group' && (
          <div className="group-setup-inputs">
            <input
              type="text"
              placeholder="Enter Group Name (e.g. Design Team)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="modal-text-input"
            />
            {selectedMembers.length > 0 && (
              <div className="selected-members-chips">
                {selectedMembers.map((m) => (
                  <span key={m.id} className="member-chip">
                    {m.display_name}
                    <button
                      type="button"
                      onClick={() => toggleSelectMember(m)}
                      className="chip-remove"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Input */}
        <div className="modal-search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search registered users by name or @username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {loading && <Loader2 size={18} className="animate-spin search-loader" />}
        </div>

        {/* Search Results list */}
        <div className="modal-results-list">
          {results.length === 0 && !loading ? (
            <div className="modal-empty-hint">
              {query.trim()
                ? `No users found matching "${query}"`
                : 'No other registered contacts yet. Tell your friends to create an account to start chatting!'}
            </div>
          ) : (
            results.map((user) => {
              const isSelected = selectedMembers.some((m) => m.id === user.id);
              return (
                <div
                  key={user.id}
                  className={`search-user-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (activeTab === 'direct') {
                      onStartChat(user);
                      onClose();
                    } else {
                      toggleSelectMember(user);
                    }
                  }}
                >
                  <img
                    src={
                      user.avatar_url ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || user.id}`
                    }
                    alt={user.display_name}
                    className="user-avatar"
                  />
                  <div className="user-details">
                    <span className="user-name">{user.display_name}</span>
                    <span className="user-handle">@{user.username}</span>
                    <p className="user-bio">{user.status_message}</p>
                  </div>
                  {activeTab === 'group' && (
                    <div className={`checkbox-circle ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <Check size={14} />}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Group Submit Button */}
        {activeTab === 'group' && (
          <div className="modal-footer">
            <button
              type="button"
              className="btn-primary"
              disabled={!groupName.trim() || selectedMembers.length === 0}
              onClick={handleCreateGroupSubmit}
            >
              Create Group ({selectedMembers.length} selected)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactSearch;
