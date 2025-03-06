console.log('Starting server...');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRouter = require('./routes/auth');
const calendarRouter = require('./routes/calendar');
const contentRouter = require('./routes/content');
const assetsRouter = require('./routes/assets'); // Updated route file
const { calendarClient } = require('./config/googleCalendar');
const path = require('path');
const fs = require('fs');
const Content = require('./models/Content');
const jwt = require('jsonwebtoken');

dotenv.config();

// Handle service account key from Heroku config var
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  const tempKeyPath = path.join(__dirname, 'temp-service-account-key.json');
  fs.writeFileSync(tempKeyPath, process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = tempKeyPath;
}

const app = express();
app.use(express.json());

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://mickelsen-family-farms.herokuapp.com' : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'Page', 'Url'],
  optionsSuccessStatus: 200,
}));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const authenticateToken = async (req, res, next) => {
  console.log('Authenticating token for:', req.url, req.method);
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token && (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE')) {
    return res.status(401).json({ error: 'Authentication required for this action' });
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { email: decoded.email };
      req.isAdmin = decoded.isAdmin;
      console.log('Token verified for user:', req.user.email);
    } catch (err) {
      if (req.method !== 'GET') return res.status(401).json({ error: 'Invalid token: ' + err.message });
      console.log('Token verification failed:', err.message);
    }
  }
  next();
};

// Serve uploaded files statically
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, 'uploads', req.path);
  console.log('Serving file:', filePath);
  if (fs.existsSync(filePath) && filePath.endsWith('.pdf')) {
    res.set('Content-Type', 'application/pdf');
    const filename = req.path.split('/').pop(); // Default to generated filename
    res.set('Content-Disposition', `attachment; filename="${filename}"`);
  }
  express.static(path.join(__dirname, 'uploads'))(req, res, next);
});

// Add a health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check endpoint hit');
  res.send('Server is healthy');
});

// Public GET endpoints
app.get('/api/content', async (req, res) => {
  console.log('Fetching content for all pages');
  try {
    const contents = await Content.find();
    res.json(contents);
  } catch (err) {
    console.error('Error fetching content:', err.message);
    res.status(500).send('Error fetching all content: ' + err.message);
  }
});

// Mount routers
app.use('/api/content', contentRouter);
app.use('/api/assets', assetsRouter); // Updated mount point

app.use('/auth', authRouter);
app.use('/api/calendar', calendarRouter);

// Add token verification endpoint to match AuthContext.jsx
app.get('/api/verify-token', authenticateToken, (req, res) => {
  console.log('Verifying token for:', req.user.email);
  if (req.user && req.isAdmin !== undefined) {
    res.json({ email: req.user.email, isAdmin: req.isAdmin });
  } else {
    res.status(401).json({ error: 'Invalid or missing user data' });
  }
});

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
    } else {
      res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
    }
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;