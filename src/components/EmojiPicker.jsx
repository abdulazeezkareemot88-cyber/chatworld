import React, { useState } from 'react';
import { Smile, Heart, ThumbsUp, Flame, Star, Coffee, Sparkles, X } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys & Emotion',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸',
      '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️',
      '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
      '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
      '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄',
      '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵',
    ],
  },
  {
    name: 'Gestures & People',
    icon: ThumbsUp,
    emojis: [
      '👍', '👎', '👌', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈',
      '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖',
      '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '👂',
    ],
  },
  {
    name: 'Hearts & Symbols',
    icon: Heart,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
      '✝️', '☯️', '☸️', '✡️', '🔯', '🕎', '☣️', '☢️', '💯', '✨',
    ],
  },
  {
    name: 'Objects & Food',
    icon: Coffee,
    emojis: [
      '🔥', '⭐', '🌟', '🎉', '🎊', '🎁', '🎈', '🏆', '🥇', '💻',
      '📱', '📸', '☕', '🍕', '🍔', '🍟', '🍣', '🍦', '🍰', '🍻',
    ],
  },
];

export const EmojiPicker = ({ onSelectEmoji, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');

  const filteredEmojis = search
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis)
    : EMOJI_CATEGORIES[activeTab].emojis;

  return (
    <div className="emoji-picker-container" onClick={(e) => e.stopPropagation()}>
      <div className="emoji-picker-header">
        <div className="emoji-picker-tabs">
          {EMOJI_CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                type="button"
                className={`emoji-tab-btn ${activeTab === idx && !search ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(idx);
                  setSearch('');
                }}
                title={cat.name}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
        <button type="button" className="emoji-close-btn" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="emoji-search-box">
        <input
          type="text"
          placeholder="Search emojis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="emoji-grid">
        {filteredEmojis.map((emoji, index) => (
          <button
            key={index}
            type="button"
            className="emoji-item"
            onClick={() => onSelectEmoji(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
