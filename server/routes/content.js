const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const dotenv = require('dotenv');

dotenv.config();

router.use((req, res, next) => {
  if (!req.isAdmin) return res.status(403).send('Access denied');
  next();
});

router.get('/:page', async (req, res) => {
  try {
    const content = await Content.findOne({ page: req.params.page });
    res.json(content || { content: '' });
  } catch (err) {
    res.status(500).send('Error fetching content: ' + err.message);
  }
});

router.post('/:page', async (req, res) => {
  try {
    const { content } = req.body;
    await Content.findOneAndUpdate(
      { page: req.params.page },
      { content },
      { upsert: true, new: true }
    );
    res.send('Content updated');
  } catch (err) {
    res.status(500).send('Error updating content: ' + err.message);
  }
});

module.exports = router;