const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const SECRET = process.env.JWT_SECRET || 'reelforge_secret_change_in_prod';

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields required' });

  const db = req.app.locals.db;
  const existing = db.get('users').find({ email }).value();
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(password, 10);
  const id = Date.now();
  db.get('users').push({ id, name, email, password: hash, created_at: new Date().toISOString() }).write();
  const token = jwt.sign({ id, name, email }, SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id, name, email } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const db = req.app.locals.db;
  const user = db.get('users').find({ email }).value();
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

module.exports = router;
