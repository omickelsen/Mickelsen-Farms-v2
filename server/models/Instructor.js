const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, default: 'Available' },
  page: { type: String, required: true }, // To associate with a specific page
  createdAt: { type: Date, default: Date.now }
});

// Use a factory function to avoid multiple compilations
module.exports = mongoose.models.Instructor || mongoose.model('Instructor', instructorSchema, 'instructors'); 