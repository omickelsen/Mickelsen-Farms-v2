const express = require('express');
const router = express.Router();
const ImageAssets = require('../models/ImageAssets');
const PdfAssets = require('../models/PdfAssets');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const authenticateToken = async (req, res, next) => {
  console.log('Authenticating token for:', req.url, req.method);
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token && (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE')) {
    return res.status(401).json({ error: 'Authentication required for this action' });
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { email: decoded.email };
      req.isAdmin = decoded.isAdmin;
      console.log('Token verified for user:', req.user.email);
    } catch (err) {
      if (req.method !== 'GET') return res.status(401).json({ error: 'Invalid token: ' + err.message });
      console.log('Token verification failed:', err.message);
    }
  }
  next();
};

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Helper function to extract filename
const getCleanFilename = (url) => {
  const parts = url.substring(url.lastIndexOf('/') + 1).split('-');
  const filenameParts = parts.length > 1 && !isNaN(parts[0]) ? parts.slice(1) : parts;
  return filenameParts.join('-');
};

// Initial data setup
const initializeAssets = async () => {
  const pages = ['horse-boarding', 'horse-lessons', 'trail-rides', 'events', 'default', 'carousel'];
  for (const page of pages) {
    const existingImageAsset = await ImageAssets.findOne({ page });
    if (!existingImageAsset) {
      await ImageAssets.create({
        url: `/path-to-${page}-image.jpg`,
        urls: [],
        page,
      });
    } else if (!existingImageAsset.urls || existingImageAsset.urls.length === 0) {
      await ImageAssets.findOneAndUpdate(
        { page },
        { $set: { urls: existingImageAsset.url ? [existingImageAsset.url] : [] } },
        { new: true }
      );
    }

    const existingPdfAsset = await PdfAssets.findOne({ page });
    if (!existingPdfAsset) {
      await PdfAssets.create({
        pdfs: [],
        page,
      });
    }
  }
  console.log('Initial assets data setup completed');
};

// Run initial setup once on module load
initializeAssets().catch(err => console.error('Initial setup error:', err));

// Image-related routes (unchanged)
router.get('/images', async (req, res) => {
  console.log('Fetching images for page:', req.query.page);
  const page = req.query.page || 'default';
  try {
    const imageAsset = await ImageAssets.findOne({ page });
    const images = imageAsset ? (imageAsset.urls.length > 0 ? imageAsset.urls : [imageAsset.url || '']) : [];
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json({ images: images });
  } catch (err) {
    console.error('Error fetching images:', err.message);
    res.status(500).json({ error: 'Failed to fetch images', details: err.message });
  }
});

router.post('/images', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.isAdmin) {
    console.log('Unauthorized image upload attempt by:', req.user?.email);
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (!req.file || !req.file.filename) {
    console.log('Invalid image upload attempt:', req.file);
    return res.status(400).json({ error: 'No valid image provided' });
  }
  const url = `/uploads/${req.file.filename}`;
  const page = req.headers.page || 'default';
  console.log('Uploading image for page:', page, 'URL:', url);

  try {
    const imageAsset = await ImageAssets.findOne({ page });
    if (imageAsset) {
      await ImageAssets.findOneAndUpdate(
        { page },
        { $push: { urls: url }, $set: { url: url } },
        { new: true, runValidators: true }
      );
      console.log('Updated ImageAssets with new image:', url);
    } else {
      await ImageAssets.create({ url: url, urls: [url], page });
      console.log('Created new ImageAssets with image:', url);
    }
    res.json({ url });
  } catch (err) {
    console.error('Error uploading image:', err.message);
    res.status(500).json({ error: 'Failed to upload image: ' + err.message });
  }
});

router.delete('/images', authenticateToken, async (req, res) => {
  if (!req.isAdmin) {
    console.log('Unauthorized image delete attempt by:', req.user?.email);
    return res.status(403).json({ error: 'Admin access required' });
  }
  const page = req.headers.page || 'default';
  const urlToRemove = req.headers.url;

  if (!urlToRemove) {
    console.log('Missing URL in image delete request');
    return res.status(400).json({ error: 'URL to remove is required' });
  }

  console.log('Deleting image for page:', page, 'URL:', urlToRemove);
  try {
    const imageAsset = await ImageAssets.findOne({ page });
    if (!imageAsset) {
      console.log('ImageAsset not found for page:', page);
      return res.status(404).json({ error: 'ImageAsset not found' });
    }

    const fileName = urlToRemove.split('/').pop();
    const filePath = path.join(__dirname, '../uploads', fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file from uploads folder: ${filePath}`);
    } else {
      console.warn(`File not found in uploads folder: ${filePath}`);
    }

    let updated = false;
    if (imageAsset.url === urlToRemove) {
      await ImageAssets.findOneAndUpdate(
        { page },
        { $unset: { url: 1 }, $pull: { urls: urlToRemove } },
        { new: true }
      );
      updated = true;
      console.log('Removed image from url field:', urlToRemove);
    } else if (imageAsset.urls && imageAsset.urls.includes(urlToRemove)) {
      await ImageAssets.findOneAndUpdate(
        { page },
        { $pull: { urls: urlToRemove } },
        { new: true }
      );
      updated = true;
      console.log('Removed image from urls array:', urlToRemove);
    }

    if (!updated) {
      console.log('Image not found in database:', urlToRemove);
      return res.status(404).json({ error: 'Image not found' });
    }

    const updatedAsset = await ImageAssets.findOne({ page });
    if (updatedAsset && updatedAsset.urls.length > 0) {
      await ImageAssets.findOneAndUpdate(
        { page },
        { $set: { url: updatedAsset.urls[0] } },
        { new: true }
      );
      console.log('Updated url to:', updatedAsset.urls[0]);
    } else {
      await ImageAssets.findOneAndUpdate(
        { page },
        { $unset: { url: 1 } },
        { new: true }
      );
      console.log('Cleared url field as urls is empty');
    }

    res.json({ message: 'Image removed successfully' });
  } catch (err) {
    console.error('Error removing image:', err.message);
    res.status(500).json({ error: 'Failed to remove image' });
  }
});

// PDF-related routes
router.get('/pdfs', async (req, res) => {
  console.log('Fetching PDFs for page:', req.query.page);
  const page = req.query.page || 'default';
  try {
    const pdfAsset = await PdfAssets.findOne({ page });
    console.log('Found PdfAssets document:', pdfAsset);
    const pdfs = pdfAsset ? pdfAsset.pdfs.map(p => ({ url: p.url, originalName: p.originalName || getCleanFilename(p.url), section: p.section })) : [];
    const cleanFilenames = pdfs.map(p => p.originalName);
    console.log('Returning PDFs:', pdfs, 'Filenames:', cleanFilenames);
    res.json({ pdfs, filenames: cleanFilenames });
  } catch (err) {
    console.error('Error fetching PDFs:', err.message);
    res.status(500).json({ error: 'Failed to fetch PDFs' });
  }
});

router.post('/pdfs', authenticateToken, upload.single('pdf'), async (req, res) => {
  if (!req.isAdmin) {
    console.log('Unauthorized PDF upload attempt by:', req.user?.email);
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (!req.file || !req.file.filename || !req.file.mimetype.startsWith('application/pdf')) {
    console.log('Invalid PDF upload attempt:', req.file);
    return res.status(400).json({ error: 'No valid PDF provided' });
  }
  const url = `/uploads/${req.file.filename}`;
  const originalName = req.file.originalname;
  const page = req.headers.page || 'default';
  const section = req.headers.section || 'dayCamp'; // Default to 'dayCamp' if not provided
  console.log('Uploading PDF for page:', page, 'URL:', url, 'Original Name:', originalName, 'Section:', section);

  try {
    const pdfAsset = await PdfAssets.findOne({ page });
    if (pdfAsset) {
      await PdfAssets.findOneAndUpdate(
        { page },
        { $push: { pdfs: { url, originalName, section } } },
        { new: true, runValidators: true }
      );
      console.log('Updated PdfAssets with new PDF:', url);
    } else {
      await PdfAssets.create({ pdfs: [{ url, originalName, section }], page });
      console.log('Created new PdfAssets with PDF:', url);
    }
    res.json({ url, section }); // Return section with the response
  } catch (err) {
    console.error('Error uploading PDF:', err.message);
    res.status(500).json({ error: 'Failed to upload PDF: ' + err.message });
  }
});

router.delete('/pdfs', authenticateToken, async (req, res) => {
  if (!req.isAdmin) {
    console.log('Unauthorized PDF delete attempt by:', req.user?.email);
    return res.status(403).json({ error: 'Admin access required' });
  }
  const page = req.headers.page || 'default';
  const urlToRemove = req.headers.url;

  if (!urlToRemove) {
    console.log('Missing URL in PDF delete request');
    return res.status(400).json({ error: 'URL to remove is required' });
  }

  console.log('Deleting PDF for page:', page, 'URL:', urlToRemove);
  try {
    const pdfAsset = await PdfAssets.findOne({ page });
    if (!pdfAsset) {
      console.log('PdfAsset not found for page:', page);
      return res.status(404).json({ error: 'PdfAsset not found' });
    }

    const fileName = urlToRemove.split('/').pop();
    const filePath = path.join(__dirname, '../uploads', fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file from uploads folder: ${filePath}`);
    } else {
      console.warn(`File not found in uploads folder: ${filePath}`);
    }

    if (pdfAsset.pdfs.some(p => p.url === urlToRemove)) {
      await PdfAssets.findOneAndUpdate(
        { page },
        { $pull: { pdfs: { url: urlToRemove } } },
        { new: true }
      );
      console.log('Successfully removed PDF from pdfs array:', urlToRemove);
      res.json({ message: 'PDF removed successfully' });
    } else {
      console.log('PDF not found in pdfs array:', urlToRemove);
      res.json({ message: 'PDF removed successfully' });
    }
  } catch (err) {
    console.error('Error removing PDF:', err.message);
    res.status(500).json({ error: 'Failed to remove PDF' });
  }
});

module.exports = router;