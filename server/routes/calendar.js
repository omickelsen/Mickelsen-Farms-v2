const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const dotenv = require('dotenv');

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage' // For token verification
);

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

const ADMIN_EMAILS = ['omickelsen@gmail.com', 'mickelsenfamilyfarms@gmail.com'];

router.use((req, res, next) => {
  const idToken = req.headers.authorization?.replace('Bearer ', '');
  if (!idToken) return res.status(401).send('No token provided');
  oauth2Client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
    .then(ticket => {
      const payload = ticket.getPayload();
      if (!ADMIN_EMAILS.includes(payload.email)) return res.status(403).send('Access denied');
      req.user = payload;
      next();
    })
    .catch(err => res.status(401).send('Invalid token: ' + err.message));
});

router.get('/events', async (req, res) => {
  try {
    const response = await calendar.events.list({
      calendarId: 'mickelsenfamilyfarms@gmail.com',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });
    res.json(response.data.items);
  } catch (err) {
    res.status(500).send('Error fetching events: ' + err.message);
  }
});

router.post('/events', async (req, res) => {
  try {
    const event = {
      summary: req.body.summary || 'New Event',
      start: { dateTime: req.body.start || new Date().toISOString() },
      end: { dateTime: req.body.end || new Date(Date.now() + 3600000).toISOString() },
    };
    const response = await calendar.events.insert({
      calendarId: 'mickelsenfamilyfarms@gmail.com',
      requestBody: event,
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).send('Error creating event: ' + err.message);
  }
});

router.put('/events/:eventId', async (req, res) => {
  try {
    const response = await calendar.events.update({
      calendarId: 'mickelsenfamilyfarms@gmail.com',
      eventId: req.params.eventId,
      requestBody: req.body,
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).send('Error updating event: ' + err.message);
  }
});

router.delete('/events/:eventId', async (req, res) => {
  try {
    await calendar.events.delete({
      calendarId: 'mickelsenfamilyfarms@gmail.com',
      eventId: req.params.eventId,
    });
    res.send('Event deleted successfully');
  } catch (err) {
    res.status(500).send('Error deleting event: ' + err.message);
  }
});

module.exports = router;