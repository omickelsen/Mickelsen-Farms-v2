const express = require('express');
const router = express.Router();
const Content = require('../models/Content');

router.get('/:page', async (req, res) => {
  
  try {
    const content = await Content.findOne({ page: req.params.page });
    
    if (content) {
      res.json(content); // Return the full document
    } else {
     
      res.status(404).json({ page: req.params.page, content: {} });
    }
    
  } catch (err) {
    console.error(`[Server] Error fetching content for ${req.params.page}:`, err);
    res.status(500).send('Error fetching content: ' + err.message);
  }
});

router.post('/:page', async (req, res) => {
  
  try {
    const updates = req.body.content || {}; // Ensure we get the content object
    if (Object.keys(updates).length === 0) {
      throw new Error('No valid content data provided');
    }
    const existingContent = await Content.findOne({ page: req.params.page }) || { page: req.params.page, content: {} };
    
    const updatedContent = await Content.findOneAndUpdate(
      { page: req.params.page },
      { $set: { content: { ...existingContent.content, ...updates } } }, // Merge updates
      { new: true, upsert: true, runValidators: true }
    );
    
    if (!updatedContent || !updatedContent.content) {
      throw new Error('Database update failed to return content');
    }
    res.json(updatedContent); // Return the full updated document
  } catch (err) {
    console.error(`[Server] Error updating content for ${req.params.page}:`, err);
    res.status(500).send('Error updating content: ' + err.message);
  }
});

module.exports = router;