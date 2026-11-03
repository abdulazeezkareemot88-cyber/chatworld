import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Send,
  Camera,
  Trash2,
  Heart,
  Eye,
  MessageCircle,
  Palette,
  Type,
  Loader2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Smile,
  Video as VideoIcon,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getStatuses,
  postStatus,
  likeStatus,
  commentStatus,
  viewStatus,
  deleteStatus,
  uploadAttachment,
  subscribeToRealtime,
} from '../services/chatService';

const BG_COLORS = [
  '#075e54', // Classic WhatsApp Teal
  '#00a884', // Vibrant Emerald
  '#6b38a6', // Deep Purple
  '#d6531c', // Coral Orange
  '#1f3c88', // Royal Navy
  '#c2185b', // Berry Pink
  '#1e293b', // Modern Dark
];

const FONTS = [
  { name: 'Sans', value: 'system-ui, -apple-system, sans-serif' },
  { name: 'Serif', value: 'Georgia, serif' },
  { name: 'Script', value: 'cursive, "Brush Script MT"' },
  { name: 'Mono', value: '"Courier New", monospace' },
];

const QUICK_REACTIONS = ['❤️', '👍', '😂', '🔥', '😮', '🙏'];

export const StatusModal = ({ onClose }) => {
  const { user, profile } = useAuth();

  const [myStatus, setMyStatus] = useState(null);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active viewing state
  const [viewingStoryUser, setViewingStoryUser] = useState(null); // 'my' or user object
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showViewersDrawer, setShowViewersDrawer] = useState(false);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);

  // Add Status state
  const [isCreating, setIsCreating] = useState(false);
  const [createMode, setCreateMode] = useState('text'); // 'text' | 'media'
  const [textStatus, setTextStatus] = useState('');
  const [selectedBg, setSelectedBg] = useState(BG_COLORS[0]);
  const [selectedFont, setSelectedFont] = useState(FONTS[0].value);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);

  // Status interaction
  const [replyText, setReplyText] = useState('');
  const [replyFeedback, setReplyFeedback] = useState('');

  const mediaInputRef = useRef(null);
  const videoPlayerRef = useRef(null);

  // Load all statuses
  const loadStatuses = async () => {
    if (!user) return;
    try {
      const data = await getStatuses(user.id);
      setMyStatus(data.myStatus);
      setRecentUpdates(data.recentUpdates || []);
    } catch (err) {
      console.error('Failed to load statuses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, [user?.id]);

  // Subscribe to real-time status events
  useEffect(() => {
    const unsubscribe = subscribeToRealtime((event) => {
      if (
        event.type === 'status_updated' ||
        event.type === 'status_liked' ||
        event.type === 'status_commented' ||
        event.type === 'status_viewed' ||
        event.type === 'status_deleted'
      ) {
        loadStatuses();
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Determine current story and item being viewed
  let currentStory = null;
  if (viewingStoryUser === 'my') {
    currentStory = myStatus;
  } else if (viewingStoryUser) {
    currentStory = recentUpdates.find((s) => s.user_id === viewingStoryUser.user_id);
  }

  const currentItem = currentStory?.items?.[activeItemIndex] || null;

  // Record view when opening an item
  useEffect(() => {
    if (currentItem && user && viewingStoryUser !== 'my') {
      viewStatus({ statusItemId: currentItem.id, userId: user.id });
    }
  }, [currentItem?.id, user?.id, viewingStoryUser]);

  // Progress Bar timer for Story playback (5s per slide)
  useEffect(() => {
    if (!currentItem || isCreating || isPaused) return;

    setProgress(0);
    const intervalTime = 50;
    const totalTime = currentItem.type === 'video' ? 10000 : 5000;
    const step = (intervalTime / totalTime) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          // Advance to next slide in story
          if (activeItemIndex + 1 < currentStory.items.length) {
            setActiveItemIndex((i) => i + 1);
            return 0;
          } else {
            // Check if there is next story in recentUpdates
            if (viewingStoryUser === 'my' && recentUpdates.length > 0) {
              setViewingStoryUser(recentUpdates[0]);
              setActiveItemIndex(0);
              return 0;
            } else if (viewingStoryUser !== 'my') {
              const currentIdx = recentUpdates.findIndex(
                (s) => s.user_id === viewingStoryUser.user_id
              );
              if (currentIdx !== -1 && currentIdx + 1 < recentUpdates.length) {
                setViewingStoryUser(recentUpdates[currentIdx + 1]);
                setActiveItemIndex(0);
                return 0;
              }
            }
            // Done viewing
            clearInterval(timer);
            setViewingStoryUser(null);
            return 100;
          }
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [currentItem, isCreating, isPaused, activeItemIndex, currentStory, viewingStoryUser, recentUpdates]);

  // Handle media selection (Photo or Video from Phone or PC)
  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);

    if (file.type.startsWith('video/')) {
      setMediaType('video');
    } else {
      setMediaType('image');
    }
    setCreateMode('media');
  };

  // Cycle background colors for text status
  const cycleBg = () => {
    const idx = BG_COLORS.indexOf(selectedBg);
    const nextIdx = (idx + 1) % BG_COLORS.length;
    setSelectedBg(BG_COLORS[nextIdx]);
  };

  // Cycle fonts for text status
  const cycleFont = () => {
    const idx = FONTS.findIndex((f) => f.value === selectedFont);
    const nextIdx = (idx + 1) % FONTS.length;
    setSelectedFont(FONTS[nextIdx].value);
  };

  // Post New Status
  const handlePostStatus = async (e) => {
    e.preventDefault();
    if (!user) return;

    setPosting(true);
    try {
      if (createMode === 'text') {
        if (!textStatus.trim()) return;
        await postStatus({
          userId: user.id,
          type: 'text',
          content: textStatus.trim(),
          bg: selectedBg,
          font: selectedFont,
        });
      } else {
        if (!mediaFile) return;
        // Upload photo or video to backend
        const uploadedUrl = await uploadAttachment(mediaFile, user.id);
        await postStatus({
          userId: user.id,
          type: mediaType,
          content: uploadedUrl,
          caption: caption.trim(),
        });
      }

      // Reset composer
      setTextStatus('');
      setMediaFile(null);
      setMediaPreview('');
      setCaption('');
      setIsCreating(false);

      // Refresh statuses and open user's newly posted status!
      await loadStatuses();
      setViewingStoryUser('my');
      setActiveItemIndex(0);
    } catch (err) {
      console.error('Failed to post status:', err);
      alert('Failed to post status. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  // Like / React to status
  const handleLike = async (reaction = '❤️') => {
    if (!currentItem || !user) return;
    try {
      await likeStatus({
        statusItemId: currentItem.id,
        userId: user.id,
        reaction,
      });
      loadStatuses();
    } catch (err) {
      console.error('Failed to like status:', err);
    }
  };

  // Send Comment / Reply
  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !currentItem || !user) return;

    const text = replyText.trim();
    setReplyText('');
    try {
      await commentStatus({
        statusItemId: currentItem.id,
        userId: user.id,
        content: text,
      });
      setReplyFeedback('Reply sent to chat! ✓');
      setTimeout(() => setReplyFeedback(''), 2500);
      loadStatuses();
    } catch (err) {
      console.error('Failed to send comment:', err);
    }
  };

  // Delete Status Slide (author only)
  const handleDeleteSlide = async () => {
    if (!currentItem || !user) return;
    if (confirm('Delete this status update for everyone?')) {
      try {
        await deleteStatus(currentItem.id, user.id);
        await loadStatuses();
        if (myStatus?.items?.length <= 1) {
          setViewingStoryUser(null);
        } else {
          setActiveItemIndex((i) => Math.max(0, i - 1));
        }
      } catch (err) {
        console.error('Failed to delete status:', err);
      }
    }
  };

  const isLikedByMe = (reaction = '❤️') => {
    return currentItem?.likes?.some((l) => l.userId === user?.id && l.reaction === reaction);
  };

  return (
    <div className="status-modal-overlay">
      <div className="status-container">
        {/* Left Sidebar: Status List */}
        <div className="status-sidebar">
          <div className="status-sidebar-header">
            <h3>Status</h3>
            <button type="button" className="status-close-btn" onClick={onClose} title="Close">
              <X size={20} />
            </button>
          </div>

          {/* My Status Section */}
          <div
            className={`status-my-section ${viewingStoryUser === 'my' && !isCreating ? 'active' : ''}`}
            onClick={() => {
              if (myStatus && myStatus.items?.length > 0) {
                setViewingStoryUser('my');
                setActiveItemIndex(0);
                setIsCreating(false);
              } else {
                setIsCreating(true);
              }
            }}
          >
            <div className="status-my-avatar-wrap">
              <img
                src={
                  profile?.avatar_url ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.username || user?.id}`
                }
                alt="My Status"
                className={`status-avatar ${myStatus?.items?.length ? 'has-status-ring' : ''}`}
              />
              <button
                type="button"
                className="status-add-badge"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreating(true);
                  setViewingStoryUser(null);
                }}
                title="Add status update"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="status-meta">
              <h4>My status</h4>
              <p>
                {myStatus?.items?.length > 0
                  ? `${myStatus.items.length} update(s) • Tap to view`
                  : 'Tap + to add status update'}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="status-divider-title">
            <span>Recent updates</span>
          </div>

          {/* Recent Updates List */}
          <div className="status-items-list">
            {recentUpdates.length === 0 ? (
              <div className="status-empty-hint">
                No recent status updates from friends yet. Be the first to post!
              </div>
            ) : (
              recentUpdates.map((story) => (
                <div
                  key={story.id}
                  className={`status-list-item ${
                    viewingStoryUser?.user_id === story.user_id && !isCreating ? 'active' : ''
                  }`}
                  onClick={() => {
                    setViewingStoryUser(story);
                    setActiveItemIndex(0);
                    setIsCreating(false);
                  }}
                >
                  <div className="status-ring-avatar">
                    <img src={story.user.avatar} alt={story.user.name} />
                  </div>
                  <div className="status-list-info">
                    <h4>{story.user.name}</h4>
                    <p>{story.updated_at || `${story.items?.length || 1} update(s)`}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Area: Status Viewer OR Creator */}
        <div className="status-viewer">
          {/* 1. CREATING STATUS */}
          {isCreating ? (
            <div className="status-create-view">
              <div className="status-create-header">
                <h3>Post to Status</h3>
                <div className="status-create-modes">
                  <button
                    type="button"
                    className={`mode-btn ${createMode === 'text' ? 'active' : ''}`}
                    onClick={() => setCreateMode('text')}
                  >
                    <Type size={16} /> Text Status
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${createMode === 'media' ? 'active' : ''}`}
                    onClick={() => mediaInputRef.current?.click()}
                  >
                    <Camera size={16} /> Photo &amp; Video
                  </button>
                </div>
                <button
                  type="button"
                  className="status-top-close"
                  onClick={() => setIsCreating(false)}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Hidden Media Input */}
              <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={handleMediaSelect}
              />

              {createMode === 'text' ? (
                /* Text Status Composer */
                <form onSubmit={handlePostStatus} className="text-status-composer">
                  <div className="text-status-canvas" style={{ background: selectedBg }}>
                    <textarea
                      rows={4}
                      placeholder="Type a status update..."
                      value={textStatus}
                      onChange={(e) => setTextStatus(e.target.value)}
                      style={{ fontFamily: selectedFont }}
                      autoFocus
                      required
                    />

                    {/* Canvas Floating Style Buttons */}
                    <div className="canvas-floating-controls">
                      <button
                        type="button"
                        className="canvas-ctrl-btn"
                        onClick={cycleBg}
                        title="Change Background Color"
                      >
                        <Palette size={18} />
                      </button>
                      <button
                        type="button"
                        className="canvas-ctrl-btn"
                        onClick={cycleFont}
                        title="Change Font"
                      >
                        <Type size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="status-composer-footer">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setIsCreating(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={posting || !textStatus.trim()}
                    >
                      {posting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Posting...
                        </>
                      ) : (
                        <>
                          <Send size={16} /> Post Status
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Media (Photo / Video) Composer */
                <form onSubmit={handlePostStatus} className="media-status-composer">
                  <div className="media-status-canvas">
                    {mediaType === 'video' ? (
                      <video src={mediaPreview} controls playsInline className="media-preview-box" />
                    ) : (
                      <img src={mediaPreview} alt="Preview" className="media-preview-box" />
                    )}

                    <div className="media-caption-input-wrap">
                      <input
                        type="text"
                        placeholder="Add a caption..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="status-composer-footer">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setMediaFile(null);
                        setMediaPreview('');
                        setCreateMode('text');
                      }}
                    >
                      Change File
                    </button>
                    <button type="submit" className="btn-primary" disabled={posting || !mediaFile}>
                      {posting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Uploading &amp; Posting...
                        </>
                      ) : (
                        <>
                          <Send size={16} /> Post Status
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : currentItem ? (
            /* 2. VIEWING STATUS (WhatsApp Story Player) */
            <div
              className="status-story-card"
              style={{ background: currentItem.bg || '#111b21' }}
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              {/* Progress Bars */}
              <div className="story-progress-bars">
                {currentStory.items.map((_, i) => (
                  <div key={i} className="story-progress-track">
                    <div
                      className="story-progress-fill"
                      style={{
                        width:
                          i < activeItemIndex
                            ? '100%'
                            : i === activeItemIndex
                            ? `${progress}%`
                            : '0%',
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Story Header */}
              <div className="story-header">
                <div className="story-header-left">
                  <img
                    src={currentStory.user.avatar}
                    alt={currentStory.user.name}
                    className="story-avatar"
                  />
                  <div className="story-header-text">
                    <h4>{viewingStoryUser === 'my' ? 'My Status' : currentStory.user.name}</h4>
                    <span>{currentItem.timestamp}</span>
                  </div>
                </div>

                <div className="story-header-actions">
                  {/* Delete button for author */}
                  {viewingStoryUser === 'my' && (
                    <button
                      type="button"
                      className="story-action-icon-btn"
                      onClick={handleDeleteSlide}
                      title="Delete this update"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}

                  {/* Sound toggle for video */}
                  {currentItem.type === 'video' && (
                    <button
                      type="button"
                      className="story-action-icon-btn"
                      onClick={() => setIsMuted(!isMuted)}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                  )}

                  {/* Close Modal */}
                  <button type="button" className="story-top-close" onClick={onClose} title="Close">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Navigation click zones (left to go back, right to advance) */}
              <button
                type="button"
                className="story-nav-btn prev"
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeItemIndex > 0) setActiveItemIndex((i) => i - 1);
                }}
                title="Previous slide"
              >
                <ChevronLeft size={28} />
              </button>

              <button
                type="button"
                className="story-nav-btn next"
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeItemIndex + 1 < currentStory.items.length) {
                    setActiveItemIndex((i) => i + 1);
                  }
                }}
                title="Next slide"
              >
                <ChevronRight size={28} />
              </button>

              {/* Story Main Content */}
              <div className="story-main-body">
                {currentItem.type === 'text' ? (
                  <div
                    className="story-text-content"
                    style={{ fontFamily: currentItem.font || 'sans-serif' }}
                  >
                    {currentItem.content}
                  </div>
                ) : currentItem.type === 'video' ? (
                  <div className="story-video-content">
                    <video
                      ref={videoPlayerRef}
                      src={currentItem.content}
                      autoPlay
                      playsInline
                      muted={isMuted}
                      loop
                      className="story-media"
                    />
                    {currentItem.caption && (
                      <div className="story-caption">{currentItem.caption}</div>
                    )}
                  </div>
                ) : (
                  <div className="story-image-content">
                    <img src={currentItem.content} alt="Story" className="story-media" />
                    {currentItem.caption && (
                      <div className="story-caption">{currentItem.caption}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Likes & Reactions Badge Pill */}
              <div className="story-reactions-summary">
                {currentItem.likes?.length > 0 && (
                  <div
                    className="story-likes-badge"
                    onClick={() => setShowCommentsDrawer(!showCommentsDrawer)}
                  >
                    <span className="likes-icons">
                      {Array.from(new Set(currentItem.likes.map((l) => l.reaction))).join(' ')}
                    </span>
                    <span className="likes-count">
                      {currentItem.likes.length} {currentItem.likes.length === 1 ? 'like' : 'likes'}
                    </span>
                  </div>
                )}

                {/* Viewers Pill for Status Author */}
                {viewingStoryUser === 'my' && (
                  <button
                    type="button"
                    className="story-views-pill"
                    onClick={() => setShowViewersDrawer(!showViewersDrawer)}
                  >
                    <Eye size={15} />
                    <span>{currentItem.views?.length || 0} views</span>
                  </button>
                )}
              </div>

              {/* Feedback toast */}
              {replyFeedback && <div className="story-feedback-toast">{replyFeedback}</div>}

              {/* Story Interaction Footer */}
              <div className="story-reply-footer">
                {/* Quick Reaction Bar */}
                <div className="quick-reactions-bar">
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`reaction-bubble-btn ${isLikedByMe(emoji) ? 'active' : ''}`}
                      onClick={() => handleLike(emoji)}
                      title={`React ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Text Reply Form (WhatsApp Style) */}
                <form onSubmit={handleSendComment} className="story-reply-form">
                  <input
                    type="text"
                    placeholder={`Reply to ${currentStory.user.name}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                  />
                  <button
                    type="submit"
                    className="story-reply-send"
                    disabled={!replyText.trim()}
                    title="Send reply"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>

              {/* Viewers Drawer (Author Only) */}
              {showViewersDrawer && (
                <div className="story-drawer-overlay" onClick={() => setShowViewersDrawer(false)}>
                  <div className="story-drawer" onClick={(e) => e.stopPropagation()}>
                    <div className="drawer-header">
                      <h4>Viewed by ({currentItem.views?.length || 0})</h4>
                      <button
                        type="button"
                        className="drawer-close"
                        onClick={() => setShowViewersDrawer(false)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="drawer-body">
                      {(!currentItem.views || currentItem.views.length === 0) ? (
                        <p className="drawer-empty">No views yet.</p>
                      ) : (
                        currentItem.views.map((v, idx) => (
                          <div key={idx} className="drawer-user-row">
                            <img
                              src={
                                v.userAvatar ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${v.userId}`
                              }
                              alt={v.userName}
                              className="drawer-avatar"
                            />
                            <div className="drawer-user-meta">
                              <span className="drawer-user-name">{v.userName}</span>
                              <span className="drawer-user-time">{v.viewedAt}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Comments & Likes Drawer */}
              {showCommentsDrawer && (
                <div className="story-drawer-overlay" onClick={() => setShowCommentsDrawer(false)}>
                  <div className="story-drawer" onClick={(e) => e.stopPropagation()}>
                    <div className="drawer-header">
                      <h4>Reactions &amp; Replies</h4>
                      <button
                        type="button"
                        className="drawer-close"
                        onClick={() => setShowCommentsDrawer(false)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="drawer-body">
                      {/* Likes section */}
                      <div className="drawer-section">
                        <h5>Likes ({currentItem.likes?.length || 0})</h5>
                        {(!currentItem.likes || currentItem.likes.length === 0) ? (
                          <p className="drawer-empty">No reactions yet.</p>
                        ) : (
                          currentItem.likes.map((l, idx) => (
                            <div key={idx} className="drawer-user-row">
                              <img
                                src={
                                  l.userAvatar ||
                                  `https://api.dicebear.com/7.x/bottts/svg?seed=${l.userId}`
                                }
                                alt={l.userName}
                                className="drawer-avatar"
                              />
                              <div className="drawer-user-meta">
                                <span className="drawer-user-name">{l.userName}</span>
                                <span className="drawer-user-time">{l.timestamp}</span>
                              </div>
                              <span className="drawer-reaction-badge">{l.reaction}</span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Comments section */}
                      <div className="drawer-section">
                        <h5>Comments ({currentItem.comments?.length || 0})</h5>
                        {(!currentItem.comments || currentItem.comments.length === 0) ? (
                          <p className="drawer-empty">No comments yet.</p>
                        ) : (
                          currentItem.comments.map((c) => (
                            <div key={c.id} className="drawer-comment-card">
                              <img
                                src={
                                  c.userAvatar ||
                                  `https://api.dicebear.com/7.x/bottts/svg?seed=${c.userId}`
                                }
                                alt={c.userName}
                                className="drawer-avatar"
                              />
                              <div className="drawer-comment-content">
                                <div className="drawer-comment-header">
                                  <strong>{c.userName}</strong>
                                  <span>{c.timestamp}</span>
                                </div>
                                <p>{c.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 3. EMPTY STATE */
            <div className="status-empty-view">
              <Camera size={48} className="empty-status-icon" />
              <h3>Select a status to view</h3>
              <p>Click on any contact on the left or tap &ldquo;+&rdquo; on My Status to share an update</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsCreating(true)}
              >
                <Plus size={16} /> Create Status Update
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusModal;
