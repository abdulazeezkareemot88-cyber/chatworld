import React, { useState, useRef, useEffect } from 'react';
import {
  Smile,
  Paperclip,
  Mic,
  Send,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  X,
  Trash2,
  Check,
  StopCircle,
  Loader2,
} from 'lucide-react';
import EmojiPicker from './EmojiPicker';

export const MessageInput = ({
  onSendText,
  onSendMedia,
  onSendAudio,
  replyingTo,
  onCancelReply,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);

  const mediaInputRef = useRef(null);
  const docInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Focus textarea when replying
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  // Handle typing & send
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!text.trim() || disabled || isUploading) return;
    onSendText(text.trim(), replyingTo?.id || null);
    setText('');
    setShowEmojiPicker(false);
    if (onCancelReply) onCancelReply();
  };

  // Emoji selection
  const handleEmojiSelect = (emoji) => {
    setText((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // File attachments (Images, Videos, Documents from phone or PC)
  const handleFileChange = async (e, forcedType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let detectedType = forcedType;
    if (file.type.startsWith('video/')) {
      detectedType = 'video';
    } else if (file.type.startsWith('image/')) {
      detectedType = 'image';
    } else if (file.type.startsWith('audio/')) {
      detectedType = 'audio';
    } else {
      detectedType = 'document';
    }

    setIsUploading(true);
    setShowAttachMenu(false);

    try {
      await onSendMedia(file, detectedType, file.name, replyingTo?.id || null);
      if (onCancelReply) onCancelReply();
    } catch (err) {
      console.error('Failed to send file:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Voice note recording with Web MediaRecorder API
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      recordTimerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission denied or not available:', err);
      alert('Microphone access is needed to record voice notes.');
    }
  };

  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      setIsUploading(true);
      try {
        await onSendAudio(audioBlob, replyingTo?.id || null);
        if (onCancelReply) onCancelReply();
      } finally {
        setIsUploading(false);
      }
      mediaRecorderRef.current.stream?.getTracks().forEach((track) => track.stop());
    };

    mediaRecorderRef.current.stop();
    clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordDuration(0);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach((track) => track.stop());
    }
    clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordDuration(0);
    audioChunksRef.current = [];
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="message-input-wrapper">
      {/* Uploading progress indicator */}
      {isUploading && (
        <div className="upload-progress-banner">
          <Loader2 size={16} className="animate-spin" />
          <span>Uploading media from your device...</span>
        </div>
      )}

      {/* Reply Banner */}
      {replyingTo && (
        <div className="reply-preview-bar">
          <div className="reply-preview-border" />
          <div className="reply-preview-info">
            <span className="reply-preview-sender">
              Replying to {replyingTo.sender?.display_name || 'Contact'}
            </span>
            <p className="reply-preview-text">
              {replyingTo.message_type === 'audio'
                ? '🎙️ Voice note'
                : replyingTo.message_type === 'image'
                ? '📷 Photo'
                : replyingTo.message_type === 'video'
                ? '🎥 Video'
                : replyingTo.message_type === 'document'
                ? '📄 Document'
                : replyingTo.content}
            </p>
          </div>
          <button
            type="button"
            className="reply-preview-close"
            onClick={onCancelReply}
            title="Cancel reply"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="emoji-picker-popover">
          <EmojiPicker
            onSelectEmoji={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Attachments Menu Popover */}
      {showAttachMenu && (
        <div className="attach-menu-popover">
          <button
            type="button"
            className="attach-item"
            onClick={() => mediaInputRef.current?.click()}
          >
            <span className="attach-icon attach-photo">
              <ImageIcon size={20} />
            </span>
            <span>Photos &amp; Videos</span>
          </button>
          <button
            type="button"
            className="attach-item"
            onClick={() => docInputRef.current?.click()}
          >
            <span className="attach-icon attach-doc">
              <FileText size={20} />
            </span>
            <span>Document</span>
          </button>
        </div>
      )}

      {/* Hidden file inputs with mobile camera/gallery support */}
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(e, 'image')}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.zip,.csv,.xlsx,.pptx"
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(e, 'document')}
      />

      {/* Input controls or Active Recording bar */}
      {isRecording ? (
        <div className="recording-active-bar">
          <button
            type="button"
            className="record-cancel-btn"
            onClick={cancelRecording}
            title="Cancel voice recording"
          >
            <Trash2 size={20} />
          </button>
          <div className="record-pulse-container">
            <span className="record-pulse-dot" />
            <span className="record-timer">{formatTimer(recordDuration)}</span>
            <span className="record-status-label">Recording voice note...</span>
          </div>
          <button
            type="button"
            className="record-send-btn"
            onClick={stopAndSendRecording}
            title="Send voice note"
          >
            <Send size={18} />
          </button>
        </div>
      ) : (
        <div className="input-row">
          {/* Emoji Toggle */}
          <button
            type="button"
            className={`input-icon-btn ${showEmojiPicker ? 'active' : ''}`}
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowAttachMenu(false);
            }}
            title="Emojis"
          >
            <Smile size={22} />
          </button>

          {/* Attachment Toggle */}
          <button
            type="button"
            className={`input-icon-btn ${showAttachMenu ? 'active' : ''}`}
            onClick={() => {
              setShowAttachMenu(!showAttachMenu);
              setShowEmojiPicker(false);
            }}
            title="Attach photo, video, or document"
          >
            <Paperclip size={22} />
          </button>

          {/* Text Input */}
          <div className="input-field-wrap">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Type a message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || isUploading}
            />
          </div>

          {/* Send or Voice Note Button */}
          {text.trim().length > 0 ? (
            <button
              type="button"
              className="send-action-btn"
              onClick={handleSubmit}
              disabled={disabled || isUploading}
              title="Send message"
            >
              <Send size={20} />
            </button>
          ) : (
            <button
              type="button"
              className="mic-action-btn"
              onClick={startRecording}
              disabled={disabled || isUploading}
              title="Hold to record voice note"
            >
              <Mic size={22} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageInput;
