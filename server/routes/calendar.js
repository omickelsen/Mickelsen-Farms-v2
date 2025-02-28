const express = require('express');
const router = express.Router();
const { calendarClient } = require('../config/googleCalendar');
const dotenv = require('dotenv');

dotenv.config();

const ADMIN_EMAILS = ['omickelsen@gmail.com', 'mickelsenfamilyfarms@gmail.com'];

router.get('/events', async (req, res) => {
  try {
    console.log('Fetching calendar events with calendarId:', process.env.CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com');
    const response = await calendarClient.events.list({
      calendarId: process.env.CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });
    console.log('Calendar API response:', response.data); // Log the full response
    res.json(response.data.items || []);
  } catch (err) {
    console.error('Calendar API error:', err.stack);
    res.status(500).send('Error fetching events: ' + err.message);
  }
});

router.post('/events', async (req, res) => {
  if (!req.isAdmin) return res.status(403).send('Admin access required');
  try {
    const event = {
      summary: req.body.summary || 'New Event',
      start: { dateTime: req.body.start || new Date().toISOString() },
      end: { dateTime: req.body.end || new Date(Date.now() + 3600000).toISOString() },
    };
    console.log('Creating event:', event);
    const response = await calendarClient.events.insert({
      calendarId: process.env.CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com',
      requestBody: event,
    });
    res.json(response.data);
  } catch (err) {
    console.error('Calendar API error:', err.stack);
    res.status(500).send('Error creating event: ' + err.message);
  }
});

router.put('/events/:eventId', async (req, res) => {
  if (!req.isAdmin) return res.status(403).send('Admin access required');
  try {
    console.log('Updating event:', req.params.eventId, req.body);
    const response = await calendarClient.events.update({
      calendarId: process.env.CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com',
      eventId: req.params.eventId,
      requestBody: req.body,
    });
    res.json(response.data);
  } catch (err) {
    console.error('Calendar API error:', err.stack);
    res.status(500).send('Error updating event: ' + err.message);
  }
});

router.delete('/events/:eventId', async (req, res) => {
  if (!req.isAdmin) return res.status(403).send('Admin access required');
  try {
    console.log('Deleting event:', req.params.eventId);
    await calendarClient.events.delete({
      calendarId: process.env.CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com',
      eventId: req.params.eventId,
    });
    res.send('Event deleted successfully');
  } catch (err) {
    console.error('Calendar API error:', err.stack);
    res.status(500).send('Error deleting event: ' + err.message);
  }
});

module.exports = router;