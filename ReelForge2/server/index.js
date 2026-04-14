const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ FIXED CORS (important)
app.use(cors({ origin: "*" }));

app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db = low(adapter);
db.defaults({ users: [], projects: [], media_files: [] }).write();

app.locals.db = db;

app.use('/uploads', express.static(uploadsDir));
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/upload', uploadRoutes);

// ✅ health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ✅ optional root route (so no "Cannot GET /")
app.get('/', (req, res) => {
  res.send('ReelForge Backend is Running 🚀');
});

app.listen(PORT, () => console.log(`ReelForge server running on port ${PORT}`));