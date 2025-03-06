// server/models/PdfAssets.js
const mongoose = require('mongoose');

const pdfAssetSchema = new mongoose.Schema({
  page: { type: String, required: true },
  pdfs: [
    {
      url: { type: String, required: true },
      originalName: { type: String, required: true }, // Store the original filename
      section: { type: String, required: true } // Add section field
    }
  ]
});

module.exports = mongoose.model('PdfAsset', pdfAssetSchema);