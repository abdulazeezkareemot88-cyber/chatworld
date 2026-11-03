import React, { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, Shield } from 'lucide-react';

export const CallModal = ({ contact, callType = 'audio', onClose }) => {
  const [callStatus, setCallStatus] = useState('Ringing...'); // 'Ringing...' | 'Connected'
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');

  const timerRef = useRef(null);
  const localVideoRef = useRef(null);

  // Connect after 2.5s
  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setCallStatus('Connected');
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }, 2500);

    return () => {
      clearTimeout(connectTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Format call duration
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="call-modal-overlay">
      <div className={`call-container ${isVideoEnabled ? 'video-mode' : 'audio-mode'}`}>
        {/* Top Status */}
        <div className="call-top-bar">
          <div className="call-encryption-badge">
            <Shield size={14} /> End-to-end encrypted
          </div>
          <h4 className="call-contact-name">{contact?.name || 'Contact'}</h4>
          <span className="call-status-label">
            {callStatus === 'Connected' ? formatTime(callDuration) : callStatus}
          </span>
        </div>

        {/* Call Visuals */}
        <div className="call-body">
          {isVideoEnabled ? (
            <div className="call-video-grid">
              <div className="remote-video-placeholder">
                <img
                  src={
                    contact?.avatar_url ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${contact?.name || 'user'}`
                  }
                  alt={contact?.name}
                  className="remote-video-avatar"
                />
                <span className="remote-label">{contact?.name}</span>
              </div>
              <div className="local-video-preview">
                <div className="local-video-feed">
                  <span>You</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="call-audio-visual">
              <div className="call-avatar-pulse">
                <img
                  src={
                    contact?.avatar_url ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${contact?.name || 'user'}`
                  }
                  alt={contact?.name}
                  className="call-avatar-img"
                />
                {callStatus === 'Ringing...' && <div className="pulse-ring" />}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls Bar */}
        <div className="call-controls-bar">
          <button
            type="button"
            className={`call-action-btn ${isMuted ? 'muted' : ''}`}
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          <button
            type="button"
            className={`call-action-btn ${!isVideoEnabled ? 'disabled' : ''}`}
            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isVideoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
          </button>

          <button
            type="button"
            className="call-end-btn"
            onClick={onClose}
            title="End Call"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
