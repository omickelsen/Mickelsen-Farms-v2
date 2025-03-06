const mongoose = require('mongoose');

const imageAssetsSchema = new mongoose.Schema({
  url: { type: String }, // Primary image (e.g., HeroSection)
  urls: [{ type: String }], // Gallery images
  page: { type: String, required: true }, // Page context (e.g., 'default', 'horse-lessons')
});

module.exports = mongoose.model('ImageAssets', imageAssetsSchema, 'imageAssets');