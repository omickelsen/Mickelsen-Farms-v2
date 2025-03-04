const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  page: { type: String, required: true },
  content: { type: Object, default: {} },
});

// Use a factory function to avoid multiple compilations
module.exports = mongoose.models.Content || mongoose.model('Content', contentSchema, 'contents');