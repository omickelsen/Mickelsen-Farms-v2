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
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const { OAuth2Client } = require('google-auth-library');
const oauth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'postmessage');

const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  console.log('Received token on server:', token);
  if (!token && (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE')) {
    return res.status(401).json({ error: 'Authentication required for this action' });
  }
  if (token) {
    try {
      const ticket = await oauth2Client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      req.user = ticket.getPayload();
      console.log('Decoded user on server:', req.user);
      const ADMIN_EMAILS = ['omickelsen@gmail.com', 'mickelsenfamilyfarms@gmail.com'];
      req.isAdmin = ADMIN_EMAILS.includes(req.user.email);
      console.log('Is Admin:', req.isAdmin);
    } catch (err) {
      console.error('Token verification error on server:', err.message);
      if (req.method !== 'GET') return res.status(401).json({ error: 'Invalid token: ' + err.message });
    }
  }
  next();
};

// MongoDB schema for hero background
const heroBackgroundSchema = new mongoose.Schema({
  url: { type: String }, // Single image URL for backward compatibility
  urls: [{ type: String }], // Array of image URLs for carousel and pages
  pdfs: [{ type: String }], // Array of PDF URLs
  page: { type: String, required: true },
});
const HeroBackground = mongoose.model('HeroBackground', heroBackgroundSchema, 'heroBackgrounds');

mongoose.connection.once('open', async () => {
  const pages = ['horse-boarding', 'horse-lessons', 'trail-rides', 'events', 'default', 'carousel'];
  for (const page of pages) {
    const existing = await HeroBackground.findOne({ page });
    if (!existing) {
      await HeroBackground.create({
        url: `/path-to-${page}-image.jpg`,
        urls: [],
        pdfs: [],
        page,
      });
    } else if (!existing.urls || !existing.pdfs) {
      await HeroBackground.findOneAndUpdate(
        { page },
        {
          $set: {
            urls: existing.url ? [existing.url] : [],
            pdfs: existing.pdfs || [],
          },
        },
        { new: true }
      );
    }
  }
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

app.use('/api/calendar', authenticateToken);
app.use('/api/content', authenticateToken);
app.use('/api/images', (req, res, next) => {
  if (req.method === 'POST' || req.method === 'DELETE') return authenticateToken(req, res, next);
  next();
});
app.use('/api/hero-background', authenticateToken);
app.use('/api/pdfs', authenticateToken);

app.use('/auth', authRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/content', contentRouter);

// Image endpoints
app.post('/api/images', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (!req.file || !req.file.filename) {
    return res.status(400).json({ error: 'No valid image provided' });
  }
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  const page = req.headers['page'] || 'default';

  const background = await HeroBackground.findOne({ page });
  if (background) {
    await HeroBackground.findOneAndUpdate(
      { page },
      { $push: { urls: url } },
      { new: true }
    );
  } else {
    await HeroBackground.create({ url: '', urls: [url], pdfs: [], page });
  }
  console.log('Uploaded image URL:', url);
  res.json({ url });
});

app.get('/api/images', async (req, res) => {
  const page = req.query.page || 'default';
  try {
    const background = await HeroBackground.findOne({ page });
    const images = background ? (background.urls.length > 0 ? background.urls : [background.url || '']) : [];
    res.json({ images });
  } catch (err) {
    console.error('Error querying HeroBackground:', err);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

app.delete('/api/images', authenticateToken, async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const page = req.headers['page'] || 'default';
  const urlToRemove = req.headers['url'];

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
      res.json({ message: 'Image removed successfully' });
    } else {
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (err) {
    console.error('Error removing image:', err);
    res.status(500).json({ error: 'Failed to remove image' });
  }
});

// PDF endpoints
app.post('/api/pdfs', authenticateToken, upload.single('pdf'), async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (!req.file || !req.file.filename || !req.file.mimetype.startsWith('application/pdf')) {
    return res.status(400).json({ error: 'No valid PDF provided' });
  }
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  const page = req.headers['page'] || 'default';

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
  console.log('Uploaded PDF URL:', url);
  res.json({ url });
});

app.get('/api/pdfs', async (req, res) => {
  const page = req.query.page || 'default';
  try {
    const background = await HeroBackground.findOne({ page });
    const pdfs = background ? background.pdfs : [];
    res.json({ pdfs });
  } catch (err) {
    console.error('Error querying HeroBackground for PDFs:', err);
    res.status(500).json({ error: 'Failed to fetch PDFs' });
  }
});

app.delete('/api/pdfs', authenticateToken, async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const page = req.headers['page'] || 'default';
  const urlToRemove = req.headers['url'];

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
      res.json({ message: 'PDF removed successfully' });
    } else {
      res.status(404).json({ error: 'PDF not found' });
    }
  } catch (err) {
    console.error('Error removing PDF:', err);
    res.status(500).json({ error: 'Failed to remove PDF' });
  }
});

app.get('/api/hero-background', async (req, res) => {
  try {
    const background = await HeroBackground.findOne({ page: 'default' });
    const url = background ? (background.urls[0] || background.url || '/path-to-farm-image.jpg') : '/path-to-farm-image.jpg';
    res.json({ url });
  } catch (err) {
    console.error('Error fetching hero background:', err);
    res.status(500).json({ error: 'Failed to fetch hero background' });
  }
});

app.post('/api/hero-background', async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    await HeroBackground.findOneAndUpdate({ page: 'default' }, { $set: { urls: [url], url: url } }, { upsert: true, new: true });
    res.json({ url });
  } catch (err) {
    console.error('Error updating hero background:', err);
    res.status(500).json({ error: 'Failed to update hero background' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;