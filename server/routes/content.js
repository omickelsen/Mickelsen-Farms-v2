const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const dotenv = require('dotenv');

dotenv.config();

const ADMIN_EMAILS = ['omickelsen@gmail.com', 'mickelsenfamilyfarms@gmail.com'];

router.use((req, res, next) => {
  const idToken = req.headers.authorization?.replace('Bearer ', '');
  if (!idToken) return res.status(401).send('No token provided');
  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
    .then(ticket => {
      const payload = ticket.getPayload();
      if (!ADMIN_EMAILS.includes(payload.email)) return res.status(403).send('Access denied');
      req.user = payload;
      next();
    })
    .catch(err => res.status(401).send('Invalid token: ' + err.message));
});

router.get('/:page', async (req, res) => {
  const content = await Content.findOne({ page: req.params.page });
  res.json(content || { content: '' });
});

router.post('/:page', async (req, res) => {
  const { content } = req.body;
  await Content.findOneAndUpdate(
    { page: req.params.page },
    { content },
    { upsert: true, new: true }
  );
  res.send('Content updated');
});

module.exports = router;