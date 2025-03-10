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
  const code = req.query.code;
  try {
    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri: process.env.NODE_ENV === 'production'
        ? 'https://mickelsen-family-farms.herokuapp.com/auth/google/callback'
        : 'http://localhost:5000/auth/google/callback',
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

   // Dynamically determine the baseUrl from the request host
   const host = req.headers.host;
   const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
   const validHosts = ['mickelsen-family-farms.herokuapp.com', 'mickelsenfamilyfarms.com', 'www.mickelsenfamilyfarms.com'];
   let baseUrl;

   if (process.env.NODE_ENV !== 'production') {
     baseUrl = 'http://localhost:3000';
   } else if (validHosts.includes(host)) {
     baseUrl = `${protocol}://${host}`;
   } else {
     // Fallback to a default if the host isn't recognized
     baseUrl = 'https://www.mickelsenfamilyfarms.com';
   }

   res.redirect(`${baseUrl}/auth/success?token=${encodeURIComponent(token)}`);
 } catch (err) {
   console.error('Error in Google callback:', err.message);
   res.status(500).send('Authentication failed: ' + err.message);
   console.log('Redirecting to:', `${baseUrl}/auth/success?token=${encodeURIComponent(token)}`);
 }
});

module.exports = router;