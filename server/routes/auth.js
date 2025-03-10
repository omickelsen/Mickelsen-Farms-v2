const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { OAuth2Client } = require('google-auth-library');

dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

const ADMIN_EMAILS = ['omickelsen@gmail.com', 'mickelsenfamilyfarms@gmail.com', 'nikmickelsen@gmail.com'];

// Redirect to Google for authentication
router.get('/google', (req, res) => {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const redirectUri = `${protocol}://${req.headers.host}/auth/google/callback`;
  const redirectUrl = oauth2Client.generateAuthUrl({
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
    redirect_uri: redirectUri,
  });
  console.log('Redirecting to Google with URL:', redirectUrl);
  res.redirect(redirectUrl);
});

// Callback route to handle Google response
router.get('/google/callback', async (req, res) => {
  const code = req.query.code;
  try {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const redirectUri = `${protocol}://${req.headers.host}/auth/google/callback`;
    const { tokens } = await oauth2Client.getToken({
      code,
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

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not set in environment variables');
    }
    const token = jwt.sign({ email: userEmail, isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated JWT:', token);

    const host = req.headers.host;
    console.log('Request host:', host); // Debug log
    const validHosts = ['mickelsen-family-farms.herokuapp.com', 'mickelsenfamilyfarms.com', 'www.mickelsenfamilyfarms.com'];
    let baseUrl;

    if (process.env.NODE_ENV !== 'production') {
      baseUrl = 'http://localhost:3000';
    } else {
      // Prioritize custom domain
      baseUrl = 'https://www.mickelsenfamilyfarms.com';
      if (validHosts.includes(host) && host !== 'mickelsen-family-farms.herokuapp.com') {
        baseUrl = `${protocol}://${host}`;
      }
      console.log('Redirecting to baseUrl:', baseUrl); // Debug log
    }

    res.redirect(`${baseUrl}/auth/success?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('Error in Google callback:', err.message);
    res.status(500).send('Authentication failed: ' + err.message);
  }
});

module.exports = router;