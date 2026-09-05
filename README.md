# 🧠 Smriti — AI Memory & Context Timeline

> A private space to preserve not just what happened, but why it mattered.

Smriti is an AI-powered personal memory platform designed to help users capture important memories, decisions, and experiences **along with the context behind them**.

---

## 💡 The Problem

Traditional notes help us remember **what happened**, but important context is often lost over time.

We may remember:

- What decision we made
- What happened during an event

But forget:

- Why we made that decision
- What circumstances influenced us
- What we were thinking or feeling
- How our perspective has changed

Smriti focuses on preserving the **context and meaning behind memories**, not just storing information.

---

## ✨ What Makes Smriti Different

Smriti follows a simple memory journey:

**Event → Memory → Context → Meaning → Reflection**

Instead of acting like a traditional notes application, Smriti helps users revisit memories and understand the circumstances, reasoning, and personal growth connected to them.

---

## 🚀 Key Features

### 📝 Record Memories

Capture important experiences, events, and decisions.

### 🗓️ Memory Timeline

Explore memories chronologically and revisit different moments over time.

### 🔍 Context Recovery

Reconnect with the circumstances and reasoning behind past memories.

### 🔄 Then vs Now

Reflect on how perspectives and decisions have changed over time.

### 🤖 AI-Powered Interaction

Uses Gemini AI to support intelligent memory and context exploration.

### 🔐 Personal Memory Space

Authentication and backend services support a more personal and structured experience.

---

## 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Vite
- CSS

### Backend

- Node.js
- TypeScript

### AI

- Google Gemini API

### Backend Services

- Firebase
- Firebase Authentication
- Firestore

### Development & Deployment

- Google AI Studio
- Google Cloud / Cloud Run
- GitHub

---

## 📂 Project Structure

```text
smriti-memory-context-timeline/
│
├── public/                 # Static files and assets
│
├── server/                 # Backend services
│   ├── auth.ts             # Authentication logic
│   └── gemini.ts           # Gemini AI integration
│
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── LandingPage.tsx
│   │   ├── RecordMemoryView.tsx
│   │   ├── TimelineView.tsx
│   │   ├── MemoryDetailModal.tsx
│   │   ├── ContextRecoveryView.tsx
│   │   ├── ThenVsNowView.tsx
│   │   └── SmritiLogo.tsx
│   │
│   ├── services/
│   │   └── api.ts          # API communication
│   │
│   ├── firebase.ts         # Firebase configuration
│   ├── types.ts            # TypeScript types
│   ├── App.tsx             # Main application
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styling
│
├── server.ts               # Server entry point
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
└── .env.example            # Environment variable example
```

---

## ⚙️ Getting Started

### Clone the repository

```bash
git clone https://github.com/Dhyeya29/smriti-memory-context-timeline.git
```

### Open the project

```bash
cd smriti-memory-context-timeline
```

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env` file using `.env.example` as a reference:

```env
GEMINI_API_KEY=your_gemini_api_key
APP_URL=your_application_url
```

> Never commit your real API keys or secrets to GitHub.

### Run the project

```bash
npm run dev
```

---

## 🎯 Core Idea

Smriti is not designed to simply store memories.

It is designed to preserve the **context that gives memories meaning** — helping users revisit important experiences and understand not only **what happened**, but also **why it mattered**.

---

## 👩‍💻 Author

**Dhyeya Reddy**

Built as an exploration of how AI can help preserve not only memories, but the context, reasoning, and meaning behind them.
