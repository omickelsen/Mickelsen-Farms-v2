const express = require('express');
const router = express.Router();
const Content = require('../models/Content');

router.get('/:page', async (req, res) => {
  console.log(`[Server] Received GET request for /api/content/${req.params.page}`);
  try {
    const content = await Content.findOne({ page: req.params.page });
    console.log(`[Server] Found content for ${req.params.page}:`, content);
    if (content) {
      res.json(content); // Return the full document
    } else {
      console.log(`[Server] No content found for ${req.params.page}, returning default`);
      res.status(404).json({ page: req.params.page, content: {} });
    }
    console.log(`[Server] Sent GET response for /api/content/${req.params.page}`);
  } catch (err) {
    console.error(`[Server] Error fetching content for ${req.params.page}:`, err);
    res.status(500).send('Error fetching content: ' + err.message);
  }
});

router.post('/:page', async (req, res) => {
  console.log(`[Server] Received POST request for /api/content/${req.params.page} with body:`, req.body);
  try {
    const updates = req.body; // Accept any field updates directly
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('No valid content data provided');
    }
    const existingContent = await Content.findOne({ page: req.params.page }) || { page: req.params.page, content: {} };
    console.log(`[Server] Existing content for ${req.params.page}:`, existingContent);
    const updatedContent = await Content.findOneAndUpdate(
      { page: req.params.page },
      { $set: { content: { ...existingContent.content, ...updates } } }, // Merge updates into content object
      { new: true, upsert: true, runValidators: true }
    );
    console.log(`[Server] Updated content for ${req.params.page} in database:`, updatedContent);
    if (!updatedContent || !updatedContent.content) {
      throw new Error('Database update failed to return content');
    }
    res.json(updatedContent); // Return the full updated document
    console.log(`[Server] Sent POST response for /api/content/${req.params.page}`);
  } catch (err) {
    console.error(`[Server] Error updating content for ${req.params.page}:`, err);
    res.status(500).send('Error updating content: ' + err.message);
  }
});

module.exports = router;