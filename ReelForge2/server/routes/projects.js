const express = require('express');
const { v4: uuidv4 } = require('uuid');
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

// ✅ APPLY AUTH ONLY WHERE NEEDED
router.get('/', auth, (req, res) => {
  const db = req.app.locals.db;
  const projects = db.get('projects')
    .filter({ user_id: req.user.id })
    .orderBy('created_at', 'desc')
    .value();

  const result = projects.map(p => {
    const files = db.get('media_files').filter({ project_uuid: p.uuid }).value();
    return { ...p, files };
  });

  res.json(result);
});

router.post('/', auth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });

  const db = req.app.locals.db;
  const uuid = uuidv4();

  ['images', 'clips', 'music', 'output'].forEach(d => {
    fs.mkdirSync(path.join(__dirname, '..', 'uploads', uuid, d), { recursive: true });
  });

  const project = {
    uuid,
    name,
    user_id: req.user.id,
    status: 'draft',
    clip_duration: 3,
    transition: 'fade',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.get('projects').push(project).write();
  res.json(project);
});

router.put('/:uuid', auth, (req, res) => {
  const db = req.app.locals.db;
  const { name, status, clip_duration, transition } = req.body;

  db.get('projects')
    .find({ uuid: req.params.uuid, user_id: req.user.id })
    .assign({
      ...(name && { name }),
      ...(status && { status }),
      ...(clip_duration && { clip_duration }),
      ...(transition && { transition }),
      updated_at: new Date().toISOString()
    }).write();

  res.json(db.get('projects').find({ uuid: req.params.uuid }).value());
});

router.delete('/:uuid', auth, (req, res) => {
  const db = req.app.locals.db;
  const project = db.get('projects')
    .find({ uuid: req.params.uuid, user_id: req.user.id })
    .value();

  if (!project) return res.status(404).json({ error: 'Not found' });

  const dir = path.join(__dirname, '..', 'uploads', req.params.uuid);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });

  db.get('media_files').remove({ project_uuid: req.params.uuid }).write();
  db.get('projects').remove({ uuid: req.params.uuid }).write();

  res.json({ ok: true });
});


// ✅ GENERATE (CREATE FILE)
router.post('/:uuid/generate', auth, (req, res) => {
  const db = req.app.locals.db;
  const { uuid } = req.params;

  const outputFile = `reel-${uuid}.mp4`;
  const outputPath = path.join(__dirname, '..', 'uploads', outputFile);

  // create dummy file
  fs.writeFileSync(outputPath, 'dummy video content');

  db.get('projects')
    .find({ uuid, user_id: req.user.id })
    .assign({
      status: 'done',
      output: `/uploads/${outputFile}`,
      updated_at: new Date().toISOString()
    })
    .write();

  res.json({ ok: true });
});


// ✅ DOWNLOAD (NO AUTH)
router.get('/:uuid/download', (req, res) => {
  const db = req.app.locals.db;
  const { uuid } = req.params;

  const project = db.get('projects').find({ uuid }).value();

  if (!project || !project.output) {
    return res.status(404).send("No file found");
  }

  const filePath = path.join(__dirname, '..', project.output);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File missing");
  }

  res.download(filePath);
});

module.exports = router;