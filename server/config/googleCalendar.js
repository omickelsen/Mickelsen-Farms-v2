const { google } = require('googleapis');
const dotenv = require('dotenv');

dotenv.config();

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendarClient = google.calendar({ version: 'v3', auth });

module.exports = { calendarClient };