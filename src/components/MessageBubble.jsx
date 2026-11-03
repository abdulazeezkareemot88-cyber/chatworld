import React, { useState, useRef } from 'react';
import {
  Check,
  CheckCheck,
  Play,
  Pause,
  FileText,
  Download,
  CornerUpLeft,
  Copy,
  Trash2,
  MoreVertical,
  Volume2,
  Film,
} from 'lucide-react';

export const MessageBubble = ({
  message,
  currentUserId,
  onReply,
  onDelete,
  allMessages = [],
}) => {
  const isOwn = message.sender_id === currentUserId;
  const isDeleted = message.is_deleted;

  const [showMenu, setShowMenu] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState('0:00');
  const [audioCurrentTime, setAudioCurrentTime] = useState('0:00');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const audioRef = useRef(null);

  // Find quoted/replied message if any
  const replyMessage = message.reply_to_id
    ? allMessages.find((m) => m.id === message.reply_to_id)
    : null;

  // Format timestamp (e.g., 10:45 AM)
  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Audio note controls
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const formatAudioTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(formatAudioTime(audioRef.current.duration));
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      setAudioCurrentTime(formatAudioTime(current));
      if (duration > 0) {
        setAudioProgress((current / duration) * 100);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioProgress(0);
    setAudioCurrentTime('0:00');
  };

  const copyText = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      setShowMenu(false);
    }
  };

  return (
    <div className={`message-bubble-row ${isOwn ? 'outgoing' : 'incoming'}`}>
      <div className={`message-bubble ${isOwn ? 'own-bubble' : 'other-bubble'}`}>
        {/* Reply Quote Banner */}
        {replyMessage && (
          <div className="quoted-message-preview">
            <div className="quoted-indicator" />
            <div className="quoted-content">
              <span className="quoted-sender">
                {replyMessage.sender_id === currentUserId
                  ? 'You'
                  : replyMessage.sender?.display_name || 'Contact'}
              </span>
              <p className="quoted-text">
                {replyMessage.is_deleted
                  ? 'This message was deleted'
                  : replyMessage.message_type === 'audio'
                  ? '🎙️ Voice note'
                  : replyMessage.message_type === 'image'
                  ? '📷 Photo'
                  : replyMessage.message_type === 'video'
                  ? '🎥 Video'
                  : replyMessage.message_type === 'document'
                  ? '📄 Document'
                  : replyMessage.content}
              </p>
            </div>
          </div>
        )}

        {/* Deleted Message */}
        {isDeleted ? (
          <div className="deleted-message-body">
            <span className="deleted-icon">🚫</span>
            <span className="deleted-text">This message was deleted</span>
          </div>
        ) : (
          <>
            {/* Image Message */}
            {message.message_type === 'image' && message.media_url && (
              <div className="message-image-container">
                <img
                  src={message.media_url}
                  alt="Attachment"
                  className="message-image"
                  onClick={() => setLightboxOpen(true)}
                  loading="lazy"
                />
              </div>
            )}

            {/* Video Message */}
            {message.message_type === 'video' && message.media_url && (
              <div className="message-video-container">
                <video
                  src={message.media_url}
                  controls
                  playsInline
                  className="message-video-player"
                  preload="metadata"
                />
              </div>
            )}

            {/* Audio Voice Note Message */}
            {message.message_type === 'audio' && message.media_url && (
              <div className="voice-note-player">
                <audio
                  ref={audioRef}
                  src={message.media_url}
                  onLoadedMetadata={handleAudioLoadedMetadata}
                  onTimeUpdate={handleAudioTimeUpdate}
                  onEnded={handleAudioEnded}
                  preload="metadata"
                />
                <button
                  type="button"
                  className="voice-play-btn"
                  onClick={togglePlayAudio}
                  title={isPlayingAudio ? 'Pause' : 'Play Voice Note'}
                >
                  {isPlayingAudio ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <div className="voice-waveform-wrap">
                  <div className="voice-waveform-bar">
                    <div
                      className="voice-waveform-fill"
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>
                  <div className="voice-timing">
                    <span>{isPlayingAudio ? audioCurrentTime : audioDuration}</span>
                    <span className="voice-mic-badge">
                      <Volume2 size={12} />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Document Message */}
            {message.message_type === 'document' && message.media_url && (
              <div className="document-message-card">
                <div className="document-icon-wrapper">
                  <FileText size={24} />
                </div>
                <div className="document-info">
                  <span className="document-title">
                    {message.content || 'Attached Document'}
                  </span>
                  <a
                    href={message.media_url}
                    target="_blank"
                    rel="noreferrer"
                    className="document-download-btn"
                    download
                  >
                    <Download size={14} /> Download
                  </a>
                </div>
              </div>
            )}

            {/* Regular Text Message / Caption Content */}
            {message.content &&
              message.message_type !== 'document' &&
              (message.message_type !== 'audio' || message.content !== 'Voice note') && (
                <div className="message-text">{message.content}</div>
              )}
          </>
        )}

        {/* Message Meta (Time + Delivery Ticks + Dropdown trigger) */}
        <div className="message-meta">
          <span className="message-time">{formatTime(message.created_at)}</span>
          {isOwn && !isDeleted && (
            <span className="message-status-tick">
              {message.status === 'read' ? (
                <CheckCheck size={16} className="tick-read" />
              ) : message.status === 'delivered' ? (
                <CheckCheck size={16} className="tick-delivered" />
              ) : (
                <Check size={16} className="tick-sent" />
              )}
            </span>
          )}

          {/* Action Menu Trigger Button */}
          <button
            type="button"
            className="message-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreVertical size={14} />
          </button>
        </div>

        {/* Context Menu Popup */}
        {showMenu && (
          <div className="message-context-menu" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                onReply(message);
                setShowMenu(false);
              }}
            >
              <CornerUpLeft size={14} /> Reply
            </button>
            {message.content && !isDeleted && (
              <button type="button" onClick={copyText}>
                <Copy size={14} /> Copy text
              </button>
            )}
            {isOwn && !isDeleted && (
              <button
                type="button"
                className="delete-action"
                onClick={() => {
                  onDelete(message.id, true);
                  setShowMenu(false);
                }}
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox for Images */}
      {lightboxOpen && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <div className="lightbox-content">
            <img src={message.media_url} alt="Full preview" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
