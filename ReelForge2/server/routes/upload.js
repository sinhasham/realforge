const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const SECRET = process.env.JWT_SECRET || 'reelforge_secret_change_in_prod';

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { uuid, type } = req.params;
    const folderMap = { image: 'images', video: 'clips', audio: 'music' };
    cb(null, path.join(__dirname, '..', 'uploads', uuid, folderMap[type] || 'images'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname));
  }
});

const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

router.post('/:uuid/:type', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const db = req.app.locals.db;
  const { uuid, type } = req.params;
  const count = db.get('media_files').filter({ project_uuid: uuid }).value().length;
  const fileRecord = { id: Date.now(), project_uuid: uuid, filename: req.file.filename, original_name: req.file.originalname, type, size: req.file.size, sort_order: count, created_at: new Date().toISOString() };
  db.get('media_files').push(fileRecord).write();
  db.get('projects').find({ uuid }).assign({ updated_at: new Date().toISOString() }).write();
  res.json(fileRecord);
});

router.delete('/:uuid/file/:fileId', auth, (req, res) => {
  const db = req.app.locals.db;
  const file = db.get('media_files').find({ id: Number(req.params.fileId), project_uuid: req.params.uuid }).value();
  if (!file) return res.status(404).json({ error: 'File not found' });
  const folderMap = { image: 'images', video: 'clips', audio: 'music' };
  const filePath = path.join(__dirname, '..', 'uploads', req.params.uuid, folderMap[file.type] || 'images', file.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  db.get('media_files').remove({ id: Number(req.params.fileId) }).write();
  res.json({ ok: true });
});

module.exports = router;
