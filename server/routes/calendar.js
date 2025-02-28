const express = require('express');
const router = express.Router();
const { calendarClient } = require('../config/googleCalendar');
const dotenv = require('dotenv');
const moment = require('moment-timezone');

dotenv.config();

const ADMIN_EMAILS = ['omickelsen@gmail.com', 'mickelsenfamilyfarms@gmail.com'];

router.get('/events', async (req, res) => {
  try {
    console.log('Fetching calendar events with calendarId:', process.env.CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com');
    const response = await calendarClient.events.list({
      calendarId: process.env.CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com',
      timeMin: new Date().toISOString(),
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: 'America/Los_Angeles',
    });
    console.log('Calendar API response:', response.data);
    const events = response.data.items.map(item => ({
      id: item.id,
      summary: item.summary || 'Untitled Event',
      start: item.start,
      end: item.end,
      allDay: !item.start.dateTime && !item.end.dateTime,
      recurrence: item.recurrence ? item.recurrence[0] : 'Does not repeat',
      recurrenceEnd: item.recurrence ? getRecurrenceEnd(item.recurrence[0]) : null,
      seriesId: item.extendedProperties ? item.extendedProperties.private.seriesId : null,
    }));
    res.json(events);
  } catch (err) {
    console.error('Calendar API error (fetch):', err.stack);
    res.status(500).send('Error fetching events: ' + err.message);
  }
});

router.post('/events', async (req, res) => {
  if (!req.isAdmin) return res.status(403).send('Admin access required');
  try {
    const { summary, start, end, allDay = false, recurrence, recurrenceEnd } = req.body;
    console.log('Received event data:', req.body);

    if (!summary || !start || !end) {
      return res.status(400).send('Missing required fields: summary, start, or end');
    }

    const startMoment = moment.tz(start.date || start.dateTime, allDay ? 'YYYY-MM-DD' : 'UTC').tz('America/Los_Angeles');
    const endMoment = moment.tz(end.date || end.dateTime, allDay ? 'YYYY-MM-DD' : 'UTC').tz('America/Los_Angeles');
    const event = {
      summary,
      start: allDay ? { date: startMoment.utc().format('YYYY-MM-DD') } : { dateTime: startMoment.utc().toISOString(), timeZone: 'UTC' },
      end: allDay ? { date: endMoment.utc().format('YYYY-MM-DD') } : { dateTime: endMoment.utc().toISOString(), timeZone: 'UTC' },
    };
    console.log('Creating event with normalized data:', event);

    let response;
    if (recurrence && recurrence !== 'Does not repeat') {
      console.log('Creating instances for recurrence:', recurrence);
      const duration = moment.duration(endMoment.diff(startMoment));
      const instances = [];
      let current = startMoment.clone();
      const endRecur = recurrenceEnd ? moment.tz(recurrenceEnd, 'America/Los_Angeles').utc() : moment.tz('2025-05-14T23:59:59', 'America/Los_Angeles').utc();
      const increment = recurrence === 'Daily' ? 1 : recurrence === 'Weekly' ? 7 : 30;
      while (current.isBefore(endRecur)) {
        const instanceStart = current.utc();
        const instanceEnd = instanceStart.clone().add(duration);
        const insertResponse = await calendarClient.events.insert({
          calendarId: process.env.CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com',
          requestBody: {
            summary: event.summary,
            start: allDay ? { date: instanceStart.format('YYYY-MM-DD') } : { dateTime: instanceStart.toISOString(), timeZone: 'UTC' },
            end: allDay ? { date: instanceEnd.format('YYYY-MM-DD') } : { dateTime: instanceEnd.toISOString(), timeZone: 'UTC' },
            extendedProperties: {
              private: { seriesId: crypto.randomUUID() },
            },
          },
          timeZone: 'America/Los_Angeles',
        });
        instances.push(insertResponse.data);
        console.log('Created instance:', insertResponse.data);
        current.add(increment, 'days');
      }
      response = { data: instances[0] };
    } else {
      response = await calendarClient.events.insert({
        calendarId: process.env.CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com',
        requestBody: event,
        timeZone: 'America/Los_Angeles',
      });
    }

    console.log('Created event (or instances):', response.data);
    res.status(201).json(response.data);
  } catch (err) {
    console.error('Calendar API error (create):', err.stack, 'Details:', err.response ? JSON.stringify(err.response.data, null, 2) : 'No additional details');
    res.status(500).send('Error creating event: ' + err.message);
  }
});

router.put('/events/:eventId', async (req, res) => {
  if (!req.isAdmin) return res.status(403).send('Admin access required');
  try {
    const { summary, start, end, allDay = false, recurrence, recurrenceEnd } = req.body;
    console.log('Updating event:', req.params.eventId, req.body);

    if (!summary || !start || !end) {
      return res.status(400).send('Missing required fields: summary, start, or end');
    }

    const startMoment = moment.tz(start.date || start.dateTime, allDay ? 'YYYY-MM-DD' : 'UTC').tz('America/Los_Angeles');
    const endMoment = moment.tz(end.date || end.dateTime, allDay ? 'YYYY-MM-DD' : 'UTC').tz('America/Los_Angeles');
    const event = {
      summary,
      start: allDay ? { date: startMoment.utc().format('YYYY-MM-DD') } : { dateTime: startMoment.utc().toISOString(), timeZone: 'UTC' },
      end: allDay ? { date: endMoment.utc().format('YYYY-MM-DD') } : { dateTime: endMoment.utc().toISOString(), timeZone: 'UTC' },
    };
    console.log('Updating event with normalized data:', event);

    let response;
    if (recurrence && recurrence !== 'Does not repeat') {
      console.log('Updating with instances for recurrence:', recurrence);
      const existingEvents = await calendarClient.events.list({
        calendarId: process.env.CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com',
        q: summary,
        maxResults: 250,
        singleEvents: true,
        timeZone: 'America/Los_Angeles',
      });
      const seriesId = existingEvents.data.items.find(e => e.id === req.params.eventId)?.extendedProperties?.private?.seriesId || crypto.randomUUID();
      const seriesEvents = existingEvents.data.items.filter(e => e.extendedProperties?.private?.seriesId === seriesId);
      for (const event of seriesEvents) {
        await calendarClient.events.delete({
          calendarId: process.env.CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com',
          eventId: event.id,
        });
      }
      const duration = moment.duration(endMoment.diff(startMoment));
      const instances = [];
      let current = startMoment.clone();
      const endRecur = recurrenceEnd ? moment.tz(recurrenceEnd, 'America/Los_Angeles').utc() : moment.tz('2025-05-14T23:59:59', 'America/Los_Angeles').utc();
      const increment = recurrence === 'Daily' ? 1 : recurrence === 'Weekly' ? 7 : 30;
      while (current.isBefore(endRecur)) {
        const instanceStart = current.utc();
        const instanceEnd = instanceStart.clone().add(duration);
        const insertResponse = await calendarClient.events.insert({
          calendarId: process.env.CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com',
          requestBody: {
            summary: event.summary,
            start: allDay ? { date: instanceStart.format('YYYY-MM-DD') } : { dateTime: instanceStart.toISOString(), timeZone: 'UTC' },
            end: allDay ? { date: instanceEnd.format('YYYY-MM-DD') } : { dateTime: instanceEnd.toISOString(), timeZone: 'UTC' },
            extendedProperties: {
              private: { seriesId },
            },
          },
          timeZone: 'America/Los_Angeles',
        });
        instances.push(insertResponse.data);
        console.log('Created instance:', insertResponse.data);
        current.add(increment, 'days');
      }
      response = { data: instances[0] };
    } else {
      response = await calendarClient.events.update({
        calendarId: process.env.CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com',
        eventId: req.params.eventId,
        requestBody: event,
      });
    }

    console.log('Updated event (or instances):', response.data);
    res.json(response.data);
  } catch (err) {
    console.error('Calendar API error (update):', err.stack, 'Details:', err.response ? JSON.stringify(err.response.data, null, 2) : 'No additional details');
    res.status(500).send('Error updating event: ' + err.message);
  }
});

router.delete('/events/:eventId', async (req, res) => {
  if (!req.isAdmin) return res.status(403).send('Admin access required');
  try {
    console.log('Deleting event:', req.params.eventId);
    const { deleteSeries } = req.body || {};
    const eventResponse = await calendarClient.events.get({
      calendarId: process.env.CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com',
      eventId: req.params.eventId,
    });
    const seriesId = eventResponse.data.extendedProperties?.private?.seriesId;

    if (deleteSeries && seriesId) {
      console.log('Deleting series with seriesId:', seriesId);
      const seriesEventsResponse = await calendarClient.events.list({
        calendarId: process.env.CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com',
        q: eventResponse.data.summary,
        maxResults: 250,
        singleEvents: true,
        timeZone: 'America/Los_Angeles',
      });
      const seriesEvents = seriesEventsResponse.data.items.filter(e => e.extendedProperties?.private?.seriesId === seriesId);
      for (const event of seriesEvents) {
        await calendarClient.events.delete({
          calendarId: process.env.CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com',
          eventId: event.id,
        });
      }
    } else {
      await calendarClient.events.delete({
        calendarId: process.env.CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com',
        eventId: req.params.eventId,
      });
    }
    res.send('Event deleted successfully');
  } catch (err) {
    console.error('Calendar API error (delete):', err.stack);
    res.status(500).send('Error deleting event: ' + err.message);
  }
});

// Helper function to parse recurrence end from rule (if needed)
function getRecurrenceEnd(rule) {
  const untilMatch = rule && rule.match(/UNTIL=(\d{8}T\d{6}Z|\d{8})/);
  return untilMatch ? moment.utc(untilMatch[1], untilMatch[1].length === 8 ? 'YYYYMMDD' : 'YYYYMMDDTHHmmssZ').tz('America/Los_Angeles').toDate() : null;
}

module.exports = router;