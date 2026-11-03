import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On Vercel, the app root is read-only. Only /tmp is writable.
const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'chatworld_db.json')
  : path.resolve(__dirname, '../data/db.json');

const INITIAL_DB = {
  users: [
    {
      id: 'support-team',
      username: 'support',
      display_name: 'ChatWorld Support',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=support_bot',
      phone: '+18005550199',
      status_message: 'Welcome to ChatWorld! Feel free to say hello 👋',
      password: '',
      created_at: new Date().toISOString(),
    },
  ],
  conversations: [
    {
      id: 'conv-support',
      type: 'direct',
      name: 'ChatWorld Support',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=support_bot',
      members: ['support-team'],
      last_message: {
        id: 'msg-welcome',
        conversation_id: 'conv-support',
        sender_id: 'support-team',
        content: 'Welcome to ChatWorld! You can send text, voice notes, photos, videos, and documents here.',
        message_type: 'text',
        created_at: new Date().toISOString(),
        status: 'read',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  messages: {
    'conv-support': [
      {
        id: 'msg-welcome',
        conversation_id: 'conv-support',
        sender_id: 'support-team',
        content: 'Welcome to ChatWorld! You can send text, voice notes, photos, videos, and documents here.',
        message_type: 'text',
        created_at: new Date().toISOString(),
        status: 'read',
      },
    ],
  },
  statuses: [],
};

// In-memory cache to guarantee fast access and avoid read-only FS errors
let inMemoryDB = null;

export function initDB() {
  if (inMemoryDB) return inMemoryDB;

  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (e) {
        // Ignored if read-only
      }
    }

    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      inMemoryDB = JSON.parse(raw);
      return inMemoryDB;
    } else {
      inMemoryDB = JSON.parse(JSON.stringify(INITIAL_DB));
      try {
        fs.writeFileSync(DB_PATH, JSON.stringify(inMemoryDB, null, 2), 'utf-8');
      } catch (e) {
        // In-memory will still hold data
      }
      return inMemoryDB;
    }
  } catch (err) {
    inMemoryDB = JSON.parse(JSON.stringify(INITIAL_DB));
    return inMemoryDB;
  }
}

export function readDB() {
  if (!inMemoryDB) {
    return initDB();
  }
  return inMemoryDB;
}

export function writeDB(data) {
  inMemoryDB = data;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // If running in a read-only serverless environment, in-memory state persists for the container
    console.warn('writeDB disk save note (using memory):', err.message);
  }
}
