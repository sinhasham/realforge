const path = require('path');

// ✅ GENERATE REEL (dummy for now)
router.post('/:uuid/generate', auth, (req, res) => {
  const db = req.app.locals.db;
  const { uuid } = req.params;

  const project = db.get('projects').find({ uuid }).value();
  if (!project) return res.status(404).json({ error: 'Project not found' });

  // fake output file (you can replace with real ffmpeg later)
  const outputFile = `reel-${uuid}.mp4`;
  const outputPath = path.join(__dirname, '..', 'uploads', outputFile);

  // create dummy file
  fs.writeFileSync(outputPath, 'dummy video content');

  // save in DB
  db.get('projects')
    .find({ uuid })
    .assign({ output: `/uploads/${outputFile}`, status: 'done' })
    .write();

  res.json({ success: true });
});

// ✅ DOWNLOAD API
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