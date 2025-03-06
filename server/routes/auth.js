const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { OAuth2Client } = require('google-auth-library');

dotenv.config();

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

const ADMIN_EMAILS = ['omickelsen@gmail.com', 'mickelsenfamilyfarms@gmail.com'];

// Redirect to Google for authentication
router.get('/google', (req, res) => {
  const redirectUri = process.env.NODE_ENV === 'production'
    ? 'https://mickelsen-family-farms.herokuapp.com/auth/google/callback'
    : 'http://localhost:5000/auth/google/callback';
  const redirectUrl = oauth2Client.generateAuthUrl({
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
    redirect_uri: redirectUri,
  });
  console.log('Redirecting to Google with URL:', redirectUrl);
  res.redirect(redirectUrl);
});

// Callback route to handle Google response
router.get('/google/callback', async (req, res) => {
  console.log('Callback received with query:', req.query);
  const code = req.query.code;
  const redirectUri = process.env.NODE_ENV === 'production'
    ? 'https://mickelsen-family-farms.herokuapp.com/auth/google/callback'
    : 'http://localhost:5000/auth/google/callback';
  try {
    const { tokens } = await oauth2Client.getToken({
      code: code,
      redirect_uri: redirectUri,
    });
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userEmail = payload.email;
    const isAdmin = ADMIN_EMAILS.includes(userEmail);

    const token = jwt.sign({ email: userEmail, isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated JWT:', token);

    // Redirect with token in URL
    const frontendRedirect = process.env.NODE_ENV === 'production'
      ? 'https://mickelsen-family-farms.herokuapp.com/auth/success'
      : 'http://localhost:3000/auth/success';
    res.redirect(`${frontendRedirect}?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('Error in Google callback:', err);
    res.status(500).send('Authentication failed');
  }
});

module.exports = router;