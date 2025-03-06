const mongoose = require('mongoose');

const pdfAssetSchema = new mongoose.Schema({
  page: { type: String, required: true },
  pdfs: [
    {
      url: { type: String, required: true },
      originalName: { type: String, required: true } // Store the original filename
    }
  ]
});

module.exports = mongoose.model('PdfAsset', pdfAssetSchema);