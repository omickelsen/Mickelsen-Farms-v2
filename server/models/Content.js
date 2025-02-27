const mongoose = require('mongoose');
const contentSchema = new mongoose.Schema({
  page: { type: String, required: true, unique: true },
  content: { type: String, required: true },
});
module.exports = mongoose.model('Content', contentSchema);