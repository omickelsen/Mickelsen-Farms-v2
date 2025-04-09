const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRouter = require('./routes/auth');
const calendarRouter = require('./routes/calendar');
const contentRouter = require('./routes/content');
const instructorsRouter = require('./routes/instructors');
const assetsRouter = require('./routes/assets');
const { calendarClient } = require('./config/googleCalendar');
const path = require('path');
const fs = require('fs');
const Content = require('./models/Content');
const jwt = require('jsonwebtoken');

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });


const app = express();
app.use(express.json());

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://mickelsen-family-farms.herokuapp.com', 'https://mickelsenfamilyfarms.com', 'https://www.mickelsenfamilyfarms.com']
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'Page', 'Url', 'Section'],
  optionsSuccessStatus: 200,
}));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  console.log(`Processing ${req.method} request for path: ${req.originalUrl}, base path: ${req.path}`);
  
  // Allow GET requests without authentication for most endpoints, including instructors
  if (req.method === 'GET') {
    // For instructor endpoints, attach isAdmin=false for non-authenticated users
    if (req.path.includes('/instructors') && !token) {
      req.isAdmin = false;
    }
    return next();
  }
  
  // Require auth for all non-GET methods (POST, PUT, DELETE)
  if (!token) {
    console.log(`Authentication required for ${req.method} ${req.path}`);
    return res.status(401).json({ error: 'Authentication required for this action' });
  }
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { email: decoded.email };
      req.isAdmin = decoded.isAdmin;
      
      // All instructor modification endpoints require admin privileges
      if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') && 
          req.path.includes('/instructors') && !req.isAdmin) {
        return res.status(403).json({ error: 'Admin privileges required for instructor management' });
      }
    } catch (err) {
      console.error(`Token verification failed: ${err.message}`);
      return res.status(401).json({ error: 'Invalid token: ' + err.message });
    }
  }
  
  next();
};

// Serve uploaded files statically with debugging
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') {
      res.set('Content-Type', 'application/pdf');
      const filename = path.basename(filePath);
      res.set('Content-Disposition', `attachment; filename="${filename}"`);
    } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      res.set('Content-Type', `image/${ext.replace('.', '')}`);
    }
  },
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.send('Server is healthy');
});

// Public GET endpoint
app.get('/api/content', async (req, res) => {
  try {
    const contents = await Content.find();
    res.json(contents);
  } catch (err) {
    console.error('Error fetching content:', err.message);
    res.status(500).send('Error fetching all content: ' + err.message);
  }
});

// Mount routers
app.use('/api/content', authenticateToken, contentRouter);
app.use('/api/instructors', authenticateToken, instructorsRouter);
app.use('/api/assets', assetsRouter);
app.use('/auth', authRouter);
app.use('/api/calendar', calendarRouter);

// Token verification endpoint
app.get('/api/verify-token', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  console.log('Token verification endpoint accessed');
  
  if (!token) {
    console.log('No token provided to verify-token endpoint');
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    // Check if token exists and is valid format first
    if (!token || token === 'null' || token === 'undefined') {
      console.log('Invalid token format provided');
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if decoded token contains the necessary fields
    if (!decoded || !decoded.email) {
      console.log('Token missing required fields');
      return res.status(401).json({ error: 'Token missing required fields' });
    }
    
    const user = { email: decoded.email };
    const isAdmin = !!decoded.isAdmin; // Ensure boolean
    
    console.log(`Successfully verified token for ${user.email}, isAdmin: ${isAdmin}`);
    res.json({ email: user.email, isAdmin: isAdmin });
  } catch (err) {
    console.error(`Token verification failed in endpoint: ${err.message}`);
    res.status(401).json({ error: `Token verification failed: ${err.message}` });
  }
});

// Serve React build
const clientDistPath = path.join(__dirname, '../client/dist');

if (fs.existsSync(clientDistPath)) {
 
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('Error serving index.html:', err);
          res.status(500).send('Server Error: Failed to serve index.html');
        }
      });
    } else {
      console.error('index.html not found at:', indexPath);
      res.status(404).send('Not Found - index.html missing in client/dist');
    }
  });
} else {
  console.warn('Client dist directory not found at:', clientDistPath);
  app.get('*', (req, res) => {
    res.status(404).send('Not Found - Please build the client app with "NODE_ENV=production npm run build" in the client directory.');
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;