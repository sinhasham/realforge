# ReelForge — Reel Generator App

A full-stack reel generator web application with UUID-based project folders, media upload, reel generation, and user authentication.

## Tech Stack
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite (via better-sqlite3) — swap to PostgreSQL for production
- **Auth**: JWT (jsonwebtoken + bcrypt)
- **File storage**: Local filesystem with UUID folder structure

## Project Structure
```
ReelForge/
├── client/          # React frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Editor.jsx
│   │   │   └── Uploads.jsx
│   │   └── index.css
│   ├── index.html
│   └── vite.config.js
├── server/          # Express backend
│   ├── index.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   └── upload.js
│   └── uploads/     # UUID project folders created here
├── package.json
└── README.md
```

## Setup Instructions

### 1. Install dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Run development servers
```bash
# Terminal 1 — Backend (port 3001)
cd server
node index.js

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

### 3. Open in browser
```
http://localhost:5173
```

## How UUID folders work
Every new project creates:
```
server/uploads/{uuid}/
  ├── images/
  ├── clips/
  ├── music/
  └── output/
```

## Deploy
- **Frontend**: Deploy `client/` to Vercel (free)
- **Backend**: Deploy `server/` to Render (free)
- Set `VITE_API_URL` in Vercel env to your Render backend URL
