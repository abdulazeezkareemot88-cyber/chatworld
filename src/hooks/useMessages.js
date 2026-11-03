import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getMessages,
  sendMessage,
  deleteMessage,
  markConversationAsRead,
  uploadAttachment,
  subscribeToMessages,
} from '../services/chatService';

export const useMessages = (conversationId, currentUserId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Load message history
  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getMessages(conversationId);
      setMessages(data);
      if (currentUserId) {
        await markConversationAsRead(conversationId, currentUserId);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Subscribe to real-time message changes
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToMessages(
      conversationId,
      (newMsg) => {
        setMessages((prev) => {
          // Avoid duplicate messages if already present
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
        if (currentUserId && newMsg.sender_id !== currentUserId) {
          markConversationAsRead(conversationId, currentUserId);
        }
      },
      (updatedMsg) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
        );
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [conversationId, currentUserId]);

  // Send Text Message
  const sendTextMessage = async (content, replyToId = null) => {
    if (!content.trim() || !conversationId || !currentUserId) return;
    setSending(true);
    try {
      const msg = await sendMessage({
        conversationId,
        senderId: currentUserId,
        content: content.trim(),
        messageType: 'text',
        replyToId,
      });

      // Optimistic update for sandbox / instant UI response
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      return msg;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    } finally {
      setSending(false);
    }
  };

  // Send Media Message (Image or File)
  const sendMediaMessage = async (file, type = 'image', caption = '', replyToId = null) => {
    if (!file || !conversationId || !currentUserId) return;
    setSending(true);
    try {
      const mediaUrl = await uploadAttachment(file, currentUserId);
      const msg = await sendMessage({
        conversationId,
        senderId: currentUserId,
        content: caption || '',
        messageType: type,
        mediaUrl,
        replyToId,
      });

      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      return msg;
    } catch (err) {
      console.error('Error sending media:', err);
      throw err;
    } finally {
      setSending(false);
    }
  };

  // Send Audio Note (recorded via microphone)
  const sendAudioNote = async (audioBlob, replyToId = null) => {
    if (!audioBlob || !conversationId || !currentUserId) return;
    setSending(true);
    try {
      const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
        type: 'audio/webm',
      });
      const mediaUrl = await uploadAttachment(audioFile, currentUserId);

      const msg = await sendMessage({
        conversationId,
        senderId: currentUserId,
        content: 'Voice note',
        messageType: 'audio',
        mediaUrl,
        replyToId,
      });

      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      return msg;
    } catch (err) {
      console.error('Error sending voice note:', err);
      throw err;
    } finally {
      setSending(false);
    }
  };

  // Delete message
  const removeMessage = async (messageId, forEveryone = true) => {
    try {
      await deleteMessage(messageId, currentUserId, forEveryone);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, is_deleted: true, content: 'This message was deleted' }
            : m
        )
      );
    } catch (err) {
      console.error('Error deleting message:', err);
      throw err;
    }
  };

  return {
    messages,
    loading,
    sending,
    error,
    sendTextMessage,
    sendMediaMessage,
    sendAudioNote,
    removeMessage,
    refreshMessages: loadMessages,
  };
};

export default useMessages;
