# 🌐 ChatWorld — Real-Time Messaging Application

**ChatWorld** is a modern, responsive, full-stack real-time messaging web application inspired by WhatsApp Web. Built with React (Vite) and powered by serverless APIs and Supabase for authentication, storage, and real-time messaging.

---

## ✨ Features

- **WhatsApp-Inspired Interface:**
  - Classic emerald green and crisp white theme with dark mode toggle.
  - Authentic message bubbles (green for sent, white for received).
  - Sent single ticks, delivered double grey ticks, and read double blue ticks.
  - End-to-end encryption notices and date separator pills.
- **WhatsApp-Style Account Creation:**
  - Anyone can sign up directly with **Name**, **Phone Number or Username**, **Profile Photo**, and **PIN/Password**.
  - No email verification hurdles — instant onboarding on phone or PC.
- **Multi-Device Media Uploads:**
  - **Photos & Videos:** Upload and view images and inline video players with playback controls.
  - **Documents:** Upload PDFs, Word documents, Excel, ZIP files with direct download buttons.
  - **Voice Notes:** Record live voice notes with waveform audio player.
- **WhatsApp Status / Stories:**
  - Post text statuses with custom WhatsApp background colors and fonts.
  - Post photo and video statuses with captions.
  - View "My Status" with viewer tracking (`👁️ X views`) and delete slide options.
  - View contacts' statuses with auto-advancing 5-second progress bars.
  - Quick emoji reactions (❤️, 👍, 😂, 🔥, 😮, 🙏).
  - Replying/commenting on a status sends a direct WhatsApp-style chat message with the quoted status snippet.
- **Vercel Serverless Ready:**
  - Built-in Vercel serverless function (`/api/index.js`) and `vercel.json` routing.
  - Zero-config deployment on Vercel without 404 API errors.

---

## 🚀 Getting Started Locally

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` on your PC, or open `http://<your-lan-ip>:5173` on your phone!

---

## 🌐 Deploying to Vercel

1. Commit and push the updated repository to GitHub:
   ```bash
   git add .
   git commit -m "Fix Vercel serverless API and routing"
   git push origin main
   ```
2. In your [Vercel Dashboard](https://vercel.com):
   - Your project will automatically redeploy upon pushing to GitHub.
   - All `/api/*` routes are handled by Vercel Serverless Functions (`api/index.js` configured in `vercel.json`).
3. (Optional) For live PostgreSQL and cloud storage across multiple devices:
   - In Supabase, unpause or create your project.
   - In Vercel Project Settings &rarr; **Environment Variables**, add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Run `supabase/schema.sql` in your Supabase SQL Editor.
