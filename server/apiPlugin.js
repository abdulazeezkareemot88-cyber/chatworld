import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { readDB, writeDB } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '../public/uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const unique = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for videos and docs
});

// SSE active clients
const sseClients = new Set();

export function broadcastEvent(type, data) {
  const payload = `data: ${JSON.stringify({ type, data })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// Helper: parse JSON body from request stream
function parseJsonBody(req) {
  return new Promise((resolve) => {
    if (req.body) return resolve(req.body);
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

export function apiPlugin() {
  return {
    name: 'chatworld-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlObj = new URL(req.url, 'http://localhost');
        const pathname = urlObj.pathname;

        // CORS preflight
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          return res.end();
        }

        // Only handle /api and static /uploads requests
        if (!pathname.startsWith('/api') && !pathname.startsWith('/uploads')) {
          return next();
        }

        // Serve static uploads
        if (pathname.startsWith('/uploads')) {
          const filePath = path.join(UPLOAD_DIR, pathname.replace(/^\/uploads/, ''));
          if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = {
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.webp': 'image/webp',
              '.gif': 'image/gif',
              '.mp4': 'video/mp4',
              '.webm': 'video/webm',
              '.mov': 'video/quicktime',
              '.pdf': 'application/pdf',
              '.txt': 'text/plain',
              '.zip': 'application/zip',
              '.doc': 'application/msword',
              '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            };
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return fs.createReadStream(filePath).pipe(res);
          }
          res.statusCode = 404;
          return res.end('File not found');
        }

        try {
          // SSE Real-time Endpoint
          if (pathname === '/api/realtime' && req.method === 'GET') {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'Access-Control-Allow-Origin': '*',
            });
            res.write(': keepalive\n\n');
            sseClients.add(res);

            const interval = setInterval(() => {
              try {
                res.write(': keepalive\n\n');
              } catch (err) {
                clearInterval(interval);
              }
            }, 15000);

            req.on('close', () => {
              clearInterval(interval);
              sseClients.delete(res);
            });
            return;
          }

          // File Upload Endpoint
          if (pathname === '/api/upload' && req.method === 'POST') {
            upload.single('file')(req, res, (err) => {
              if (err) {
                return sendJson(res, 400, { error: err.message || 'Upload failed' });
              }
              if (!req.file) {
                return sendJson(res, 400, { error: 'No file uploaded' });
              }
              const fileUrl = `/uploads/${req.file.filename}`;
              return sendJson(res, 200, {
                url: fileUrl,
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype,
              });
            });
            return;
          }

          const db = readDB();

          // 1. User Registration (WhatsApp style)
          if (pathname === '/api/auth/register' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const displayName = (body.display_name || body.displayName || '').trim();
            const phone = (body.phone || '').trim();
            const username = (body.username || '').trim();
            const avatarUrl = body.avatar_url || body.avatarUrl || '';
            const statusMessage = body.status_message || body.statusMessage || 'Hey there! I am using ChatWorld.';
            const password = body.password || '';

            if (!displayName || (!phone && !username)) {
              return sendJson(res, 400, { error: 'Phone or username and name are required' });
            }

            const cleanUsername = (username || phone || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
            const cleanPhone = phone;

            // Check if user already exists
            const existing = db.users.find(
              (u) =>
                (cleanUsername && u.username === cleanUsername) ||
                (cleanPhone && u.phone && u.phone === cleanPhone)
            );

            if (existing) {
              return sendJson(res, 400, {
                error: 'An account with this phone number or username already exists. Please sign in.',
              });
            }

            const newUser = {
              id: 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              username: cleanUsername || `user_${Date.now().toString().slice(-4)}`,
              display_name: displayName,
              phone: cleanPhone,
              avatar_url:
                avatarUrl ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername || displayName}`,
              status_message: statusMessage,
              password: password || '',
              created_at: new Date().toISOString(),
              last_seen: new Date().toISOString(),
            };

            db.users.push(newUser);

            // Automatically add Welcome chat with Support
            const welcomeConvId = 'conv-welcome-' + newUser.id;
            const welcomeConv = {
              id: welcomeConvId,
              type: 'direct',
              name: 'ChatWorld Support',
              avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=support_bot',
              members: [newUser.id, 'support-team'],
              last_message: {
                id: 'msg-w-' + Date.now(),
                conversation_id: welcomeConvId,
                sender_id: 'support-team',
                content: `👋 Welcome to ChatWorld, ${newUser.display_name}! You can chat, upload videos & photos, and share status updates.`,
                message_type: 'text',
                created_at: new Date().toISOString(),
                status: 'read',
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            db.conversations.unshift(welcomeConv);
            db.messages[welcomeConvId] = [welcomeConv.last_message];

            writeDB(db);
            broadcastEvent('user_registered', { user: newUser });

            return sendJson(res, 200, { user: newUser });
          }

          // 2. User Login
          if (pathname === '/api/auth/login' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const { identifier, password } = body;

            if (!identifier) {
              return sendJson(res, 400, { error: 'Please enter your phone number or username' });
            }

            const cleanId = identifier.trim().toLowerCase();
            const user = db.users.find(
              (u) =>
                u.username.toLowerCase() === cleanId ||
                (u.phone && u.phone.toLowerCase() === cleanId) ||
                (u.email && u.email.toLowerCase() === cleanId)
            );

            if (!user) {
              return sendJson(res, 404, {
                error: 'Account not found. Please create an account to start chatting!',
              });
            }

            // Check password if set on user
            if (user.password && password && user.password !== password) {
              return sendJson(res, 401, { error: 'Incorrect PIN or password.' });
            }

            user.last_seen = new Date().toISOString();
            writeDB(db);

            return sendJson(res, 200, { user });
          }

          // 3. Update Profile
          if (pathname === '/api/auth/update-profile' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const { userId, display_name, username, avatar_url, status_message, phone } = body;

            const user = db.users.find((u) => u.id === userId);
            if (!user) {
              return sendJson(res, 404, { error: 'User not found' });
            }

            if (display_name) user.display_name = display_name;
            if (username) user.username = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
            if (avatar_url) user.avatar_url = avatar_url;
            if (status_message !== undefined) user.status_message = status_message;
            if (phone !== undefined) user.phone = phone;
            user.last_seen = new Date().toISOString();

            writeDB(db);
            broadcastEvent('user_updated', { user });
            return sendJson(res, 200, { user });
          }

          // 4. Search Users
          if (pathname === '/api/users' && req.method === 'GET') {
            const query = (urlObj.searchParams.get('q') || '').toLowerCase().trim();
            const exclude = urlObj.searchParams.get('exclude');

            let users = db.users.filter((u) => u.id !== exclude);
            if (query) {
              users = users.filter(
                (u) =>
                  u.display_name.toLowerCase().includes(query) ||
                  u.username.toLowerCase().includes(query) ||
                  (u.phone && u.phone.includes(query))
              );
            }

            return sendJson(
              res,
              200,
              users.map((u) => ({
                id: u.id,
                username: u.username,
                display_name: u.display_name,
                avatar_url: u.avatar_url,
                phone: u.phone,
                status_message: u.status_message,
                last_seen: u.last_seen,
              }))
            );
          }

          // 5. Get Conversations for User
          if (pathname === '/api/conversations' && req.method === 'GET') {
            const userId = urlObj.searchParams.get('userId');
            if (!userId) {
              return sendJson(res, 200, []);
            }

            const userConvs = db.conversations.filter(
              (c) => Array.isArray(c.members) && c.members.includes(userId)
            );

            // Format with other user's info
            const formatted = userConvs.map((conv) => {
              let otherUser = null;
              if (conv.type === 'direct') {
                const otherId = conv.members.find((id) => id !== userId) || userId;
                otherUser = db.users.find((u) => u.id === otherId) || {
                  id: otherId,
                  display_name: conv.name,
                  avatar_url: conv.avatar_url,
                };
              }

              return {
                id: conv.id,
                type: conv.type,
                name: conv.type === 'group' ? conv.name : otherUser?.display_name || conv.name,
                avatar_url:
                  conv.type === 'group' ? conv.avatar_url : otherUser?.avatar_url || conv.avatar_url,
                other_user: otherUser,
                last_message: conv.last_message || null,
                unread_count: conv.unread_count?.[userId] || 0,
                updated_at: conv.updated_at,
              };
            });

            // Sort by updated_at descending
            formatted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

            return sendJson(res, 200, formatted);
          }

          // 6. Direct Conversation: Find or Create
          if (pathname === '/api/conversations/direct' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const userId = body.userId || body.user_id;
            const targetUserId = body.targetUserId || body.target_user_id;

            if (!userId || !targetUserId) {
              return sendJson(res, 400, { error: 'Both user IDs required' });
            }

            let conv = db.conversations.find(
              (c) =>
                c.type === 'direct' &&
                c.members.includes(userId) &&
                c.members.includes(targetUserId)
            );

            const targetUser = db.users.find((u) => u.id === targetUserId);

            if (!conv) {
              conv = {
                id: 'conv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                type: 'direct',
                name: targetUser?.display_name || 'Direct Chat',
                avatar_url: targetUser?.avatar_url || '',
                members: [userId, targetUserId],
                last_message: null,
                unread_count: { [userId]: 0, [targetUserId]: 0 },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              db.conversations.unshift(conv);
              db.messages[conv.id] = [];
              writeDB(db);
              broadcastEvent('conversation_created', { conversation: conv });
            }

            return sendJson(res, 200, {
              id: conv.id,
              type: conv.type,
              name: targetUser?.display_name || conv.name,
              avatar_url: targetUser?.avatar_url || conv.avatar_url,
              other_user: targetUser,
              last_message: conv.last_message,
              unread_count: 0,
              updated_at: conv.updated_at,
            });
          }

          // 7. Create Group Conversation
          if (pathname === '/api/conversations/group' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const { creatorId, name, memberIds, avatar_url } = body;

            const allMembers = Array.from(new Set([creatorId, ...memberIds]));
            const newGroup = {
              id: 'group-' + Date.now(),
              type: 'group',
              name: name || 'New Group',
              avatar_url:
                avatar_url ||
                `https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80`,
              members: allMembers,
              last_message: null,
              unread_count: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            db.conversations.unshift(newGroup);
            db.messages[newGroup.id] = [];
            writeDB(db);
            broadcastEvent('conversation_created', { conversation: newGroup });

            return sendJson(res, 200, newGroup);
          }

          // 8. Get Messages for Conversation
          if (pathname === '/api/messages' && req.method === 'GET') {
            const conversationId = urlObj.searchParams.get('conversationId');
            if (!conversationId) return sendJson(res, 200, []);

            const msgs = db.messages[conversationId] || [];
            // Join sender info
            const enriched = msgs.map((m) => {
              const sender = db.users.find((u) => u.id === m.sender_id);
              return {
                ...m,
                sender: sender
                  ? {
                      id: sender.id,
                      username: sender.username,
                      display_name: sender.display_name,
                      avatar_url: sender.avatar_url,
                    }
                  : null,
              };
            });

            return sendJson(res, 200, enriched);
          }

          // 9. Send Message
          if (pathname === '/api/messages' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const conversationId = body.conversationId || body.conversation_id;
            const senderId = body.senderId || body.sender_id;
            const content = body.content || '';
            const messageType = body.messageType || body.message_type || 'text';
            const mediaUrl = body.mediaUrl || body.media_url || null;
            const replyToId = body.replyToId || body.reply_to_id || null;

            if (!conversationId || !senderId) {
              return sendJson(res, 400, { error: 'Missing conversationId or senderId' });
            }

            const sender = db.users.find((u) => u.id === senderId);
            const newMsg = {
              id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              conversation_id: conversationId,
              sender_id: senderId,
              content: content || '',
              message_type: messageType || 'text',
              media_url: mediaUrl || null,
              reply_to_id: replyToId || null,
              status: 'sent',
              reactions: {},
              is_deleted: false,
              created_at: new Date().toISOString(),
            };

            if (!db.messages[conversationId]) {
              db.messages[conversationId] = [];
            }
            db.messages[conversationId].push(newMsg);

            // Update conversation last_message and bump to top
            const convIdx = db.conversations.findIndex((c) => c.id === conversationId);
            if (convIdx !== -1) {
              db.conversations[convIdx].last_message = newMsg;
              db.conversations[convIdx].updated_at = newMsg.created_at;
              const [c] = db.conversations.splice(convIdx, 1);
              db.conversations.unshift(c);
            }

            writeDB(db);

            const enrichedMsg = {
              ...newMsg,
              sender: sender
                ? {
                    id: sender.id,
                    username: sender.username,
                    display_name: sender.display_name,
                    avatar_url: sender.avatar_url,
                  }
                : null,
            };

            broadcastEvent('new_message', { message: enrichedMsg });

            return sendJson(res, 200, enrichedMsg);
          }

          // 10. Delete Message
          if (pathname === '/api/messages/delete' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const { messageId, conversationId } = body;

            if (conversationId && db.messages[conversationId]) {
              const msg = db.messages[conversationId].find((m) => m.id === messageId);
              if (msg) {
                msg.is_deleted = true;
                msg.content = 'This message was deleted';
                writeDB(db);
                broadcastEvent('message_deleted', { messageId, conversationId });
                return sendJson(res, 200, { success: true });
              }
            }
            return sendJson(res, 404, { error: 'Message not found' });
          }

          // ==========================================
          // STATUSES (WhatsApp Stories) API
          // ==========================================

          // 11. Get All Active Statuses
          if (pathname === '/api/statuses' && req.method === 'GET') {
            const currentUserId = urlObj.searchParams.get('userId');

            // Find current user's status record
            const myStatusRecord = db.statuses.find((s) => s.user_id === currentUserId);
            const myStatus = myStatusRecord || null;

            // Other users' statuses
            const recentUpdates = db.statuses.filter(
              (s) => s.user_id !== currentUserId && s.items && s.items.length > 0
            );

            return sendJson(res, 200, {
              myStatus,
              recentUpdates,
            });
          }

          // 12. Post New Status
          if (pathname === '/api/statuses' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const { userId, type, content, caption, bg, font } = body;

            if (!userId) {
              return sendJson(res, 400, { error: 'User ID is required' });
            }

            const author = db.users.find((u) => u.id === userId);
            if (!author) {
              return sendJson(res, 404, { error: 'User not found' });
            }

            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const newItem = {
              id: 'status-item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              type: type || 'text', // 'text' | 'image' | 'video' | 'document'
              content: content || '',
              caption: caption || '',
              bg: bg || '#075e54',
              font: font || 'sans-serif',
              timestamp: timeStr,
              created_at: now.toISOString(),
              views: [],
              likes: [],
              comments: [],
            };

            let statusRecord = db.statuses.find((s) => s.user_id === userId);
            if (!statusRecord) {
              statusRecord = {
                id: 'status-' + userId,
                user_id: userId,
                user: {
                  id: author.id,
                  name: author.display_name,
                  username: author.username,
                  avatar: author.avatar_url,
                },
                updated_at: 'Just now',
                items: [newItem],
              };
              db.statuses.unshift(statusRecord);
            } else {
              statusRecord.user = {
                id: author.id,
                name: author.display_name,
                username: author.username,
                avatar: author.avatar_url,
              };
              statusRecord.updated_at = 'Just now';
              statusRecord.items.push(newItem);
            }

            writeDB(db);
            broadcastEvent('status_updated', { statusRecord, newItem });

            return sendJson(res, 200, statusRecord);
          }

          // 13. Like / React to Status Item
          if (pathname === '/api/statuses/like' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const statusItemId = body.statusItemId || body.status_item_id;
            const userId = body.userId || body.user_id;
            const reaction = body.reaction || '❤️';

            const reactor = db.users.find((u) => u.id === userId);
            let targetItem = null;
            let targetStatus = null;

            for (const s of db.statuses) {
              const item = s.items.find((i) => i.id === statusItemId);
              if (item) {
                targetItem = item;
                targetStatus = s;
                break;
              }
            }

            if (!targetItem) {
              return sendJson(res, 404, { error: 'Status item not found' });
            }

            if (!Array.isArray(targetItem.likes)) {
              targetItem.likes = [];
            }

            const existingLikeIdx = targetItem.likes.findIndex((l) => l.userId === userId);
            let action = 'liked';

            if (existingLikeIdx !== -1) {
              if (targetItem.likes[existingLikeIdx].reaction === reaction) {
                // Toggle off
                targetItem.likes.splice(existingLikeIdx, 1);
                action = 'unliked';
              } else {
                // Change reaction
                targetItem.likes[existingLikeIdx].reaction = reaction;
                action = 'updated';
              }
            } else {
              targetItem.likes.push({
                userId,
                userName: reactor?.display_name || 'Someone',
                userAvatar: reactor?.avatar_url || '',
                reaction,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              });
            }

            writeDB(db);
            broadcastEvent('status_liked', { statusItemId, likes: targetItem.likes, action });

            return sendJson(res, 200, {
              success: true,
              likes: targetItem.likes,
              action,
            });
          }

          // 14. Comment / Reply to Status Item (like WhatsApp)
          if (pathname === '/api/statuses/comment' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const statusItemId = body.statusItemId || body.status_item_id;
            const userId = body.userId || body.user_id;
            const content = body.content;

            if (!content || !content.trim()) {
              return sendJson(res, 400, { error: 'Comment cannot be empty' });
            }

            const commenter = db.users.find((u) => u.id === userId);
            let targetItem = null;
            let targetStatus = null;

            for (const s of db.statuses) {
              const item = s.items.find((i) => i.id === statusItemId);
              if (item) {
                targetItem = item;
                targetStatus = s;
                break;
              }
            }

            if (!targetItem || !targetStatus) {
              return sendJson(res, 404, { error: 'Status item not found' });
            }

            if (!Array.isArray(targetItem.comments)) {
              targetItem.comments = [];
            }

            const now = new Date();
            const newComment = {
              id: 'comment-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              userId,
              userName: commenter?.display_name || 'Someone',
              userAvatar: commenter?.avatar_url || '',
              content: content.trim(),
              timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              created_at: now.toISOString(),
            };

            targetItem.comments.push(newComment);

            // WhatsApp Behavior: Send a direct chat message from the commenter to the status owner!
            if (targetStatus.user_id !== userId) {
              // Find or create direct conversation between commenter and status author
              let conv = db.conversations.find(
                (c) =>
                  c.type === 'direct' &&
                  c.members.includes(userId) &&
                  c.members.includes(targetStatus.user_id)
              );

              if (!conv) {
                conv = {
                  id: 'conv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                  type: 'direct',
                  name: targetStatus.user.name,
                  avatar_url: targetStatus.user.avatar,
                  members: [userId, targetStatus.user_id],
                  last_message: null,
                  unread_count: { [userId]: 0, [targetStatus.user_id]: 1 },
                  created_at: now.toISOString(),
                  updated_at: now.toISOString(),
                };
                db.conversations.unshift(conv);
                db.messages[conv.id] = [];
              }

              const statusSnippet =
                targetItem.type === 'image'
                  ? `📷 Status Photo: "${targetItem.caption || 'Photo'}"`
                  : targetItem.type === 'video'
                  ? `🎥 Status Video: "${targetItem.caption || 'Video'}"`
                  : `💬 Status: "${targetItem.content.slice(0, 40)}..."`;

              const statusReplyMsg = {
                id: 'msg-reply-' + Date.now(),
                conversation_id: conv.id,
                sender_id: userId,
                content: `[Replying to Status: ${statusSnippet}]\n${content.trim()}`,
                message_type: 'text',
                media_url: targetItem.type !== 'text' ? targetItem.content : null,
                reply_to_id: null,
                status: 'delivered',
                reactions: {},
                is_deleted: false,
                created_at: now.toISOString(),
              };

              if (!db.messages[conv.id]) db.messages[conv.id] = [];
              db.messages[conv.id].push(statusReplyMsg);
              conv.last_message = statusReplyMsg;
              conv.updated_at = statusReplyMsg.created_at;

              broadcastEvent('new_message', {
                message: {
                  ...statusReplyMsg,
                  sender: {
                    id: commenter.id,
                    username: commenter.username,
                    display_name: commenter.display_name,
                    avatar_url: commenter.avatar_url,
                  },
                },
              });
            }

            writeDB(db);
            broadcastEvent('status_commented', {
              statusItemId,
              comments: targetItem.comments,
              newComment,
            });

            return sendJson(res, 200, {
              success: true,
              comment: newComment,
              comments: targetItem.comments,
            });
          }

          // 15. View Status Item (track views)
          if (pathname === '/api/statuses/view' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const statusItemId = body.statusItemId || body.status_item_id;
            const userId = body.userId || body.user_id;

            if (!statusItemId || !userId) {
              return sendJson(res, 400, { error: 'statusItemId and userId required' });
            }

            const viewer = db.users.find((u) => u.id === userId);
            for (const s of db.statuses) {
              const item = s.items.find((i) => i.id === statusItemId);
              if (item) {
                if (!Array.isArray(item.views)) item.views = [];
                if (!item.views.some((v) => v.userId === userId)) {
                  item.views.push({
                    userId,
                    userName: viewer?.display_name || 'Someone',
                    userAvatar: viewer?.avatar_url || '',
                    viewedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  });
                  writeDB(db);
                  broadcastEvent('status_viewed', { statusItemId, views: item.views });
                }
                return sendJson(res, 200, { views: item.views });
              }
            }
            return sendJson(res, 404, { error: 'Status item not found' });
          }

          // 16. Delete Status Item
          if (pathname.startsWith('/api/statuses/') && req.method === 'DELETE') {
            const statusItemId = pathname.replace('/api/statuses/', '');
            const body = await parseJsonBody(req);
            const userId = body.userId || urlObj.searchParams.get('userId');

            for (let sIdx = 0; sIdx < db.statuses.length; sIdx++) {
              const statusRecord = db.statuses[sIdx];
              if (statusRecord.user_id === userId) {
                const itemIdx = statusRecord.items.findIndex((i) => i.id === statusItemId);
                if (itemIdx !== -1) {
                  statusRecord.items.splice(itemIdx, 1);
                  if (statusRecord.items.length === 0) {
                    db.statuses.splice(sIdx, 1);
                  }
                  writeDB(db);
                  broadcastEvent('status_deleted', { statusItemId, userId });
                  return sendJson(res, 200, { success: true });
                }
              }
            }
            return sendJson(res, 404, { error: 'Status item not found or unauthorized' });
          }

          // Fallthrough for unmatched /api
          return sendJson(res, 404, { error: 'Endpoint not found' });
        } catch (err) {
          console.error('API Error:', err);
          return sendJson(res, 500, { error: err.message || 'Internal server error' });
        }
      });
    },
  };
}
