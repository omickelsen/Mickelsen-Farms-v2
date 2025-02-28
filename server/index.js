const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRouter = require('./routes/auth');
const calendarRouter = require('./routes/calendar');
const contentRouter = require('./routes/content');
const { calendarClient } = require('./config/googleCalendar'); // Import from new file

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
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
    return res.status(401).send('Authentication required for this action');
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
      if (req.method !== 'GET') return res.status(401).send('Invalid token: ' + err.message);
    }
  }
  next();
};

app.use('/api/calendar', authenticateToken);
app.use('/api/content', authenticateToken);

app.use('/auth', authRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/content', contentRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));