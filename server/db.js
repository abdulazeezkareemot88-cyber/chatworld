import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../data/db.json');

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

// Ensure data folder and db file exist
export function initDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
  }
}

export function readDB() {
  initDB();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB, re-initializing:', err);
    fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
    return INITIAL_DB;
  }
}

export function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}
