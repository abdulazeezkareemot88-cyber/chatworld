import React, { useState } from 'react';
import {
  MessageSquarePlus,
  CircleDot,
  Sun,
  Moon,
  MoreVertical,
  Search,
  X,
  User,
  LogOut,
  Globe,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ChatList from './ChatList';

export const Sidebar = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenNewChat,
  onOpenProfile,
  onOpenStatus,
}) => {
  const { user, profile, signOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread' | 'groups'
  const [showMenu, setShowMenu] = useState(false);

  return (
    <aside className="chatworld-sidebar">
      {/* Sidebar Top Header */}
      <div className="sidebar-header">
        {/* Brand / Current User Avatar */}
        <div className="sidebar-user-section" onClick={onOpenProfile} title="View Profile">
          <img
            src={
              profile?.avatar_url ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.username || user?.id}`
            }
            alt="My Profile"
            className="sidebar-user-avatar"
          />
          <div className="sidebar-brand-title">
            <span className="brand-logo-icon">
              <Globe size={18} />
            </span>
            <span className="brand-name">ChatWorld</span>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="sidebar-header-actions">
          {/* Status / Stories */}
          <button
            type="button"
            className="sidebar-action-btn"
            onClick={onOpenStatus}
            title="Status updates"
          >
            <CircleDot size={20} />
          </button>

          {/* New Chat */}
          <button
            type="button"
            className="sidebar-action-btn"
            onClick={onOpenNewChat}
            title="New Chat / Contact"
          >
            <MessageSquarePlus size={20} />
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            className="sidebar-action-btn"
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Menu Dropdown */}
          <div className="sidebar-menu-wrapper">
            <button
              type="button"
              className="sidebar-action-btn"
              onClick={() => setShowMenu(!showMenu)}
              title="Menu"
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div className="sidebar-dropdown-menu" onClick={() => setShowMenu(false)}>
                <button type="button" onClick={onOpenProfile}>
                  <User size={16} /> Profile & Settings
                </button>
                <button type="button" onClick={onOpenNewChat}>
                  <MessageSquarePlus size={16} /> New Chat / Group
                </button>
                <div className="menu-divider" />
                <button type="button" className="menu-danger" onClick={signOut}>
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="sidebar-search-area">
        <div className="sidebar-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="sidebar-filter-pills">
          <button
            type="button"
            className={`pill-btn ${filterTab === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`pill-btn ${filterTab === 'unread' ? 'active' : ''}`}
            onClick={() => setFilterTab('unread')}
          >
            Unread
          </button>
          <button
            type="button"
            className={`pill-btn ${filterTab === 'groups' ? 'active' : ''}`}
            onClick={() => setFilterTab('groups')}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <ChatList
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        currentUserId={user?.id}
        searchQuery={searchQuery}
        filterTab={filterTab}
      />
    </aside>
  );
};

export default Sidebar;
