# 🌐 ChatWorld — Real-Time Messaging Application

**ChatWorld** is a modern, responsive, full-stack real-time messaging web application inspired by WhatsApp Web. Built with React (Vite) and powered by Supabase for authentication, PostgreSQL storage, real-time messaging, and media attachments.

---

## ✨ Features

- **WhatsApp-Inspired Interface:**
  - Classic emerald green and crisp white theme with dark mode toggle.
  - Authentic message bubbles (green for sent, white for received).
  - Sent single ticks, delivered double grey ticks, and read double blue ticks.
  - End-to-end encryption notices and date separator pills.
- **Real-Time Messaging:**
  - One-on-one direct messages and group conversations.
  - Instant message delivery with Supabase Realtime subscriptions.
  - Message replies (quoted context) and message deletion.
- **Audio & Media Features:**
  - **Live Voice Notes:** Record and send real audio notes directly from your microphone using the HTML5 MediaRecorder API.
  - **Audio Player:** In-bubble waveform progress bar, play/pause, and duration tracking.
  - **Photo & Document Attachments:** Upload and preview images and file attachments via Supabase Storage.
- **Interactive Calling Screen:**
  - Simulated Voice and Video calls with ringing state, connected timer, mute toggle, and video feed.
- **Status / Stories:**
  - WhatsApp-style 24h stories viewer with 5-second progress bars and status updates.
- **User Discovery & Profiles:**
  - Search registered users across the platform by `@username` or display name.
  - Edit profile picture, username, display name, and bio / status message.
- **Dual Mode (Production & Sandbox):**
  - **Production:** Fully connected to Supabase Auth, PostgreSQL, Realtime, and Storage.
  - **Sandbox / Demo Mode:** Built-in instant testing mode with seeded demo contacts and simulated smart auto-replies if Supabase keys are not yet configured.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite 8, Lucide React icons
- **Backend / Database:** Supabase PostgreSQL, Supabase Auth, Supabase Realtime, Supabase Storage
- **Deployment:** Vercel ready

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase Dashboard.
3. Copy and run the entire SQL script from [`supabase/schema.sql`](./supabase/schema.sql). This will automatically set up:
   - `profiles`, `conversations`, `conversation_members`, and `messages` tables.
   - Row Level Security (RLS) policies.
   - Automatic user profile triggers on sign-up.
   - Realtime publication subscriptions.
   - Storage buckets for attachments and avatars.
4. Go to **Project Settings &rarr; API** and copy your **Project URL** and **anon public key**.

### 3. Set Up Environment Variables

Create or update `.env` in the root folder:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

*(Note: If you run the app without setting these keys, ChatWorld automatically launches in interactive sandbox mode so you can test all features immediately!)*

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

### 5. Build for Production

```bash
npm run build
```

---

## 📁 Project Structure

```
ChatWorld/
├── supabase/
│   └── schema.sql             # Complete PostgreSQL DDL, RLS policies, triggers & realtime
├── public/
│   └── favicon.svg            # Custom ChatWorld logo favicon
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx        # Navigation, search, filter pills, chat list
│   │   ├── ChatList.jsx       # Conversation previews, timestamps, unread counts
│   │   ├── ChatWindow.jsx     # Main chat canvas, message list, headers & calls
│   │   ├── MessageBubble.jsx  # Bubbles with text, images, voice notes & status ticks
│   │   ├── MessageInput.jsx   # Input bar with mic recording, emoji & attachments
│   │   ├── ContactSearch.jsx  # Modal for new 1-on-1 chats and group creation
│   │   ├── ProfileModal.jsx   # Profile editing, avatar upload, and logout
│   │   ├── CallModal.jsx      # Voice and video call simulator
│   │   ├── StatusModal.jsx    # WhatsApp stories viewer with timer bars
│   │   ├── ConfigBanner.jsx   # Sandbox switch and setup helper
│   │   └── EmojiPicker.jsx    # Categorized WhatsApp emoji picker
│   ├── context/
│   │   ├── AuthContext.jsx    # Supabase authentication and demo user state
│   │   └── ThemeContext.jsx   # Dark / Light theme switcher
│   ├── hooks/
│   │   ├── useAuth.js         # Authentication hook
│   │   └── useMessages.js     # Realtime message stream hook
│   ├── lib/
│   │   └── supabase.js        # Supabase client initialization
│   ├── services/
│   │   └── chatService.js     # Database operations and realtime subscriptions
│   ├── pages/
│   │   ├── Login.jsx          # Login view
│   │   ├── Signup.jsx         # User registration
│   │   ├── ForgotPassword.jsx # Password reset
│   │   └── ChatDashboard.jsx  # Primary chat application view
│   ├── App.jsx                # Application root
│   ├── App.css                # WhatsApp styles, layout & responsive styling
│   ├── index.css              # Theme CSS variables & typography
│   └── main.jsx               # Entry point
├── .env.example
├── package.json
└── vite.config.js
```

---

## 🌐 Deploy to Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. In Project Settings &rarr; **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy! Your ChatWorld web app will be live with full real-time messaging.
