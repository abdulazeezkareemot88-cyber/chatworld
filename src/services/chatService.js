// ChatWorld Service Layer (Cross-Device Real-Time Backend API + Supabase fallback)

const API_BASE = ''; // relative path connects to current host (phone or PC)

// Helper for API fetch
async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

// ==========================================
// User Search & Discovery
// ==========================================
export const searchUsers = async (query, currentUserId) => {
  try {
    const data = await apiFetch(`/api/users?q=${encodeURIComponent(query || '')}&exclude=${currentUserId || ''}`);
    return data || [];
  } catch (err) {
    console.warn('Search fallback to local:', err);
    return [];
  }
};

// ==========================================
// Conversations
// ==========================================
export const getConversations = async (currentUserId) => {
  if (!currentUserId) return [];
  try {
    const data = await apiFetch(`/api/conversations?userId=${encodeURIComponent(currentUserId)}`);
    return data || [];
  } catch (err) {
    console.error('getConversations error:', err);
    return [];
  }
};

export const getOrCreateDirectConversation = async (currentUserId, targetUser) => {
  try {
    const data = await apiFetch('/api/conversations/direct', {
      method: 'POST',
      body: JSON.stringify({
        userId: currentUserId,
        targetUserId: targetUser.id,
      }),
    });
    return data;
  } catch (err) {
    console.error('getOrCreateDirectConversation error:', err);
    throw err;
  }
};

export const createGroupConversation = async (creatorId, groupName, memberIds, avatarUrl = '') => {
  try {
    const data = await apiFetch('/api/conversations/group', {
      method: 'POST',
      body: JSON.stringify({
        creatorId,
        name: groupName,
        memberIds,
        avatar_url: avatarUrl,
      }),
    });
    return data;
  } catch (err) {
    console.error('createGroupConversation error:', err);
    throw err;
  }
};

// ==========================================
// Messages
// ==========================================
export const getMessages = async (conversationId) => {
  if (!conversationId) return [];
  try {
    const data = await apiFetch(`/api/messages?conversationId=${encodeURIComponent(conversationId)}`);
    return data || [];
  } catch (err) {
    console.error('getMessages error:', err);
    return [];
  }
};

export const sendMessage = async ({
  conversationId,
  senderId,
  content,
  messageType = 'text',
  mediaUrl = null,
  replyToId = null,
}) => {
  try {
    const data = await apiFetch('/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        senderId,
        content,
        messageType,
        mediaUrl,
        replyToId,
      }),
    });
    return data;
  } catch (err) {
    console.error('sendMessage error:', err);
    throw err;
  }
};

export const deleteMessage = async (messageId, currentUserId, forEveryone = true, conversationId = null) => {
  try {
    const data = await apiFetch('/api/messages/delete', {
      method: 'POST',
      body: JSON.stringify({
        messageId,
        userId: currentUserId,
        forEveryone,
        conversationId,
      }),
    });
    return data;
  } catch (err) {
    console.error('deleteMessage error:', err);
    throw err;
  }
};

export const markConversationAsRead = async (conversationId, currentUserId) => {
  if (!conversationId || !currentUserId) return;
  try {
    await fetch(`/api/conversations/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, userId: currentUserId }),
    }).catch(() => {});
  } catch (e) {}
};

// ==========================================
// File / Attachment Upload (Photos, Videos, Audio, Docs)
// Works seamlessly from phone or PC!
// ==========================================
export const uploadAttachment = async (file, currentUserId) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', currentUserId);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Upload failed');
    }

    const data = await res.json();
    return data.url; // Returns /uploads/... which is served by the host
  } catch (err) {
    console.error('uploadAttachment error:', err);
    throw err;
  }
};

// ==========================================
// STATUSES / STORIES (WhatsApp Style)
// ==========================================
export const getStatuses = async (currentUserId) => {
  try {
    const data = await apiFetch(`/api/statuses?userId=${encodeURIComponent(currentUserId || '')}`);
    return data || { myStatus: null, recentUpdates: [] };
  } catch (err) {
    console.error('getStatuses error:', err);
    return { myStatus: null, recentUpdates: [] };
  }
};

export const postStatus = async ({ userId, type, content, caption, bg, font }) => {
  try {
    const data = await apiFetch('/api/statuses', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        type,
        content,
        caption,
        bg,
        font,
      }),
    });
    return data;
  } catch (err) {
    console.error('postStatus error:', err);
    throw err;
  }
};

export const likeStatus = async ({ statusItemId, userId, reaction = '❤️' }) => {
  try {
    const data = await apiFetch('/api/statuses/like', {
      method: 'POST',
      body: JSON.stringify({ statusItemId, userId, reaction }),
    });
    return data;
  } catch (err) {
    console.error('likeStatus error:', err);
    throw err;
  }
};

export const commentStatus = async ({ statusItemId, userId, content }) => {
  try {
    const data = await apiFetch('/api/statuses/comment', {
      method: 'POST',
      body: JSON.stringify({ statusItemId, userId, content }),
    });
    return data;
  } catch (err) {
    console.error('commentStatus error:', err);
    throw err;
  }
};

export const viewStatus = async ({ statusItemId, userId }) => {
  try {
    const data = await apiFetch('/api/statuses/view', {
      method: 'POST',
      body: JSON.stringify({ statusItemId, userId }),
    });
    return data;
  } catch (err) {
    // Non-critical
    return null;
  }
};

export const deleteStatus = async (statusItemId, userId) => {
  try {
    const data = await apiFetch(`/api/statuses/${encodeURIComponent(statusItemId)}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
    return data;
  } catch (err) {
    console.error('deleteStatus error:', err);
    throw err;
  }
};

// ==========================================
// Real-time EventSource Subscription
// Synchronizes all connected phones and PCs!
// ==========================================
let activeEventSource = null;
const eventListeners = new Set();

export const subscribeToRealtime = (onEvent) => {
  eventListeners.add(onEvent);

  if (!activeEventSource) {
    try {
      activeEventSource = new EventSource('/api/realtime');

      activeEventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          for (const listener of eventListeners) {
            listener(payload);
          }
        } catch (e) {
          // Keepalive or parse error
        }
      };

      activeEventSource.onerror = () => {
        // EventSource will auto-reconnect
      };
    } catch (err) {
      console.warn('Realtime SSE not available, using poll fallback:', err);
    }
  }

  return () => {
    eventListeners.delete(onEvent);
    if (eventListeners.size === 0 && activeEventSource) {
      activeEventSource.close();
      activeEventSource = null;
    }
  };
};

export const subscribeToMessages = (conversationId, onNewMessage, onUpdatedMessage) => {
  return subscribeToRealtime((event) => {
    if (event.type === 'new_message' && event.data?.message?.conversation_id === conversationId) {
      onNewMessage(event.data.message);
    }
    if (event.type === 'message_deleted' && event.data?.conversationId === conversationId) {
      onUpdatedMessage({ id: event.data.messageId, is_deleted: true, content: 'This message was deleted' });
    }
  });
};

export const subscribeToConversations = (currentUserId, onUpdate) => {
  return subscribeToRealtime((event) => {
    if (
      event.type === 'new_message' ||
      event.type === 'conversation_created' ||
      event.type === 'user_registered'
    ) {
      onUpdate();
    }
  });
};
