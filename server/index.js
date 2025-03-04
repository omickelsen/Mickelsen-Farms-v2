const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRouter = require('./routes/auth');
const calendarRouter = require('./routes/calendar');
const contentRouter = require('./routes/content');
const { calendarClient } = require('./config/googleCalendar');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Content = require('./models/Content');

// Function to extract the original filename, removing the timestamp prefix
const getCleanFilename = (url) => {
  const parts = url.substring(url.lastIndexOf('/') + 1).split('-');
  // Remove the timestamp (first part if it’s numeric) and join the rest
  const filenameParts = parts.length > 1 && !isNaN(parts[0]) ? parts.slice(1) : parts;
  return filenameParts.join('-');
};

dotenv.config();

const app = express();
app.use(express.json());

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://your-heroku-app.herokuapp.com' : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'Page', 'Url'],
  optionsSuccessStatus: 200,
}));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('[Server] MongoDB connected'))
  .catch(err => console.error('[Server] MongoDB connection error:', err));

const { OAuth2Client } = require('google-auth-library');
const oauth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'postmessage');

const authenticateToken = async (req, res, next) => {
  console.log('[Server] Checking authentication token:', req.headers.authorization);
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token && (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE')) {
    console.log('[Server] No token, authentication required for', req.method, req.path);
    return res.status(401).json({ error: 'Authentication required for this action' });
  }
  if (token) {
    try {
      const ticket = await oauth2Client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      req.user = ticket.getPayload();
      console.log('[Server] Decoded user:', req.user);
      const ADMIN_EMAILS = ['omickelsen@gmail.com', 'mickelsenfamilyfarms@gmail.com'];
      req.isAdmin = ADMIN_EMAILS.includes(req.user.email);
      console.log('[Server] Is Admin:', req.isAdmin);
    } catch (err) {
      console.error('[Server] Token verification error:', err.message);
      if (req.method !== 'GET') return res.status(401).json({ error: 'Invalid token: ' + err.message });
    }
  }
  console.log('[Server] Authentication check completed for', req.method, req.path);
  next();
};

// MongoDB schema for hero background
const heroBackgroundSchema = new mongoose.Schema({
  url: { type: String },
  urls: [{ type: String }],
  pdfs: [{ type: String }],
  page: { type: String, required: true },
});
const HeroBackground = mongoose.model('HeroBackground', heroBackgroundSchema, 'heroBackgrounds');

mongoose.connection.once('open', async () => {
  console.log('[Server] MongoDB connection opened, initializing pages');
  const pages = ['horse-boarding', 'horse-lessons', 'trail-rides', 'events', 'default', 'carousel'];
  for (const page of pages) {
    const existingBackground = await HeroBackground.findOne({ page });
    if (!existingBackground) {
      await HeroBackground.create({
        url: `/path-to-${page}-image.jpg`,
        urls: [],
        pdfs: [],
        page,
      });
      console.log(`[Server] Created new HeroBackground for page: ${page}`);
    } else if (!existingBackground.urls || !existingBackground.pdfs) {
      await HeroBackground.findOneAndUpdate(
        { page },
        { $set: { urls: existingBackground.url ? [existingBackground.url] : [], pdfs: existingBackground.pdfs || [] } },
        { new: true }
      );
      console.log(`[Server] Updated HeroBackground for page: ${page}`);
    }
    const existingContent = await Content.findOne({ page });
    if (!existingContent) {
      await Content.create({ page, content: {} });
      console.log(`[Server] Initialized empty content for page: ${page}`);
    } else {
      console.log(`[Server] Content already exists for page: ${page}, content:`, existingContent.content);
    }
  }
  console.log('[Server] Initialization complete');
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/content', async (req, res) => {
  console.log('[Server] Received GET request for /api/content');
  try {
    const contents = await Content.find();
    console.log('[Server] Fetched all content from database:', contents);
    res.json(contents);
  } catch (err) {
    console.error('[Server] Error fetching all content:', err);
    res.status(500).send('Error fetching all content: ' + err.message);
  }
  console.log('[Server] Sent GET response for /api/content');
});

app.use('/api/calendar', authenticateToken);
app.use('/api/content', (req, res, next) => {
  console.log('[Server] Middleware hit for /api/content, method:', req.method, 'path:', req.path);
  if (req.method === 'GET') {
    console.log('[Server] Bypassing authentication for GET /api/content');
    return next();
  }
  authenticateToken(req, res, next);
});
app.use('/api/content', contentRouter);
app.use('/api/images', (req, res, next) => {
  if (req.method === 'POST' || req.method === 'DELETE') return authenticateToken(req, res, next);
  next();
});
app.use('/api/hero-background', authenticateToken);
app.use('/api/pdfs', authenticateToken);

app.use('/auth', authRouter);
app.use('/api/calendar', calendarRouter);

// Image endpoints (unchanged)
app.post('/api/images', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (!req.file || !req.file.filename) {
    return res.status(400).json({ error: 'No valid image provided' });
  }
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  const page = req.headers['page'] || 'default';
  console.log(`[Server] Uploading image for page: ${page}, URL: ${url}`);

  try {
    const background = await HeroBackground.findOne({ page });
    if (background) {
      const updatedBackground = await HeroBackground.findOneAndUpdate(
        { page },
        { $push: { urls: url }, $set: { url: url } },
        { new: true, runValidators: true }
      );
      console.log('[Server] Updated HeroBackground:', updatedBackground);
    } else {
      await HeroBackground.create({ url: url, urls: [url], pdfs: [], page });
      console.log('[Server] Created new HeroBackground for page:', page);
    }
    console.log('[Server] Uploaded image URL:', url);
    res.json({ url });
  } catch (err) {
    console.error('[Server] Error updating HeroBackground:', err);
    res.status(500).json({ error: 'Failed to upload image: ' + err.message });
  }
});

app.get('/api/images', async (req, res) => {
  const page = req.query.page || 'default';
  console.log(`[Server] Received GET request for /api/images?page=${page}`);
  try {
    const background = await HeroBackground.findOne({ page });
    const images = background ? (background.urls.length > 0 ? background.urls : [background.url || '']) : [];
    console.log(`[Server] Fetched images for page ${page}:`, images);
    res.json({ images });
  } catch (err) {
    console.error('[Server] Error querying HeroBackground:', err);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
  console.log(`[Server] Sent GET response for /api/images?page=${page}`);
});

app.delete('/api/images', authenticateToken, async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const page = req.headers['page'] || 'default';
  const urlToRemove = req.headers['url'];
  console.log(`[Server] Received DELETE request for /api/images, page: ${page}, url: ${urlToRemove}`);

  if (!urlToRemove) {
    return res.status(400).json({ error: 'URL to remove is required' });
  }

  try {
    const background = await HeroBackground.findOne({ page });
    if (background && background.urls.includes(urlToRemove)) {
      await HeroBackground.findOneAndUpdate(
        { page },
        { $pull: { urls: urlToRemove } },
        { new: true }
      );
      console.log(`[Server] Removed image ${urlToRemove} from page ${page}`);
      res.json({ message: 'Image removed successfully' });
    } else {
      console.log(`[Server] Image ${urlToRemove} not found for page ${page}`);
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (err) {
    console.error('[Server] Error removing image:', err);
    res.status(500).json({ error: 'Failed to remove image' });
  }
  console.log(`[Server] Sent DELETE response for /api/images`);
});

// PDF endpoints (unchanged, with filename cleaning)
app.post('/api/pdfs', authenticateToken, upload.single('pdf'), async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (!req.file || !req.file.filename || !req.file.mimetype.startsWith('application/pdf')) {
    return res.status(400).json({ error: 'No valid PDF provided' });
  }
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  const page = req.headers['page'] || 'default';
  console.log(`[Server] Uploading PDF for page: ${page}, URL: ${url}`);

  try {
    const background = await HeroBackground.findOne({ page });
    if (background) {
      await HeroBackground.findOneAndUpdate(
        { page },
        { $push: { pdfs: url } },
        { new: true }
      );
    } else {
      await HeroBackground.create({ url: '', urls: [], pdfs: [url], page });
    }
    console.log('[Server] Uploaded PDF URL:', url);
    res.json({ url });
  } catch (err) {
    console.error('[Server] Error updating HeroBackground:', err);
    res.status(500).json({ error: 'Failed to upload PDF: ' + err.message });
  }
});

app.get('/api/pdfs', async (req, res) => {
  const page = req.query.page || 'default';
  console.log(`[Server] Received GET request for /api/pdfs?page=${page}`);
  try {
    const background = await HeroBackground.findOne({ page });
    const pdfs = background ? background.pdfs : [];
    const cleanFilenames = pdfs.map(pdfUrl => getCleanFilename(pdfUrl)); // Return clean filenames
    console.log(`[Server] Fetched clean filenames for page ${page}:`, cleanFilenames);
    res.json({ pdfs: cleanFilenames }); // Send array of filenames instead of URLs
  } catch (err) {
    console.error('[Server] Error querying HeroBackground for PDFs:', err);
    res.status(500).json({ error: 'Failed to fetch PDFs' });
  }
  console.log(`[Server] Sent GET response for /api/pdfs?page=${page}`);
});

app.delete('/api/pdfs', authenticateToken, async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const page = req.headers['page'] || 'default';
  const urlToRemove = req.headers['url'];
  console.log(`[Server] Received DELETE request for /api/pdfs, page: ${page}, url: ${urlToRemove}`);

  if (!urlToRemove) {
    return res.status(400).json({ error: 'URL to remove is required' });
  }

  try {
    const background = await HeroBackground.findOne({ page });
    if (background && background.pdfs.includes(urlToRemove)) {
      await HeroBackground.findOneAndUpdate(
        { page },
        { $pull: { pdfs: urlToRemove } },
        { new: true }
      );
      console.log(`[Server] Removed PDF ${urlToRemove} from page ${page}`);
      res.json({ message: 'PDF removed successfully' });
    } else {
      console.log(`[Server] PDF ${urlToRemove} not found for page ${page}`);
      res.status(404).json({ error: 'PDF not found' });
    }
  } catch (err) {
    console.error('[Server] Error removing PDF:', err);
    res.status(500).json({ error: 'Failed to remove PDF' });
  }
  console.log(`[Server] Sent DELETE response for /api/pdfs`);
});

app.get('/api/hero-background', async (req, res) => {
  console.log('[Server] Received GET request for /api/hero-background');
  try {
    const background = await HeroBackground.findOne({ page: 'default' });
    const url = background ? (background.urls[0] || background.url || '/path-to-farm-image.jpg') : '/path-to-farm-image.jpg';
    console.log('[Server] Fetched hero background URL:', url);
    res.json({ url });
  } catch (err) {
    console.error('[Server] Error fetching hero background:', err);
    res.status(500).json({ error: 'Failed to fetch hero background' });
  }
  console.log('[Server] Sent GET response for /api/hero-background');
});

app.post('/api/hero-background', async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  console.log('[Server] Received POST request for /api/hero-background with body:', req.body);
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    const updatedBackground = await HeroBackground.findOneAndUpdate(
      { page: 'default' },
      { $set: { urls: [url], url: url } },
      { upsert: true, new: true }
    );
    console.log('[Server] Updated hero background:', updatedBackground);
    res.json({ url });
  } catch (err) {
    console.error('[Server] Error updating hero background:', err);
    res.status(500).json({ error: 'Failed to update hero background' });
  }
  console.log('[Server] Sent POST response for /api/hero-background');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('[Server] Server running on port', PORT));

module.exports = app;