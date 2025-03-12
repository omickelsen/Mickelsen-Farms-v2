const express = require('express');
const router = express.Router();
const ImageAssets = require('../models/ImageAssets');
const PdfAssets = require('../models/PdfAssets');
const multer = require('multer');
const path = require('path');
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const authenticateToken = async (req, res, next) => {
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token && (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE')) {
    return res.status(401).json({ error: 'Authentication required for this action' });
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { email: decoded.email };
      req.isAdmin = decoded.isAdmin;
      
    } catch (err) {
      if (req.method !== 'GET') return res.status(401).json({ error: 'Invalid token: ' + err.message });
      
    }
  }
  next();
};

// Configure AWS S3
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const s3 = new AWS.S3();
const bucketName = process.env.AWS_BUCKET_NAME;

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function
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
};

initializeAssets().catch(err => console.error('Initial setup error:', err));

// Image-related routes
router.get('/images', async (req, res) => {
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

router.post('/images', authenticateToken, upload.array('images'), async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No valid images provided' });
  }
  const page = req.headers.page || 'default';

  const uploadPromises = req.files.map(async (file) => {
    const url = `/uploads/${file.originalname}-${Date.now()}`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: url.replace('/uploads/', ''),
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    
    const s3Response = await s3.upload(params).promise();
    return s3Response.Location;
  });

  try {
    const uploadedUrls = await Promise.all(uploadPromises);
    const imageAsset = await ImageAssets.findOne({ page });
    if (imageAsset) {
      await ImageAssets.findOneAndUpdate(
        { page },
        { $push: { urls: { $each: uploadedUrls } }, $set: { url: uploadedUrls[0] } },
        { new: true, runValidators: true }
      );
      
    } else {
      await ImageAssets.create({ url: uploadedUrls[0], urls: uploadedUrls, page });
    
    }
    res.json({ urls: uploadedUrls });
  } catch (err) {
    console.error('Error during image upload:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to upload images: ' + err.message });
  }
});

router.delete('/images', authenticateToken, async (req, res) => {
  if (!req.isAdmin) {
    
    return res.status(403).json({ error: 'Admin access required' });
  }
  const page = req.headers.page || 'default';
  const urlToRemove = req.headers.url;

  if (!urlToRemove) {
    
    return res.status(400).json({ error: 'URL to remove is required' });
  }

  
  try {
    const imageAsset = await ImageAssets.findOne({ page });
    if (!imageAsset) {
      
      return res.status(404).json({ error: 'ImageAsset not found' });
    }

    const key = urlToRemove.replace(`https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/`, '');
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    await s3.deleteObject(params).promise();
    

    let updated = false;
    if (imageAsset.url === urlToRemove) {
      await ImageAssets.findOneAndUpdate(
        { page },
        { $unset: { url: 1 }, $pull: { urls: urlToRemove } },
        { new: true }
      );
      updated = true;
      
    } else if (imageAsset.urls && imageAsset.urls.includes(urlToRemove)) {
      await ImageAssets.findOneAndUpdate(
        { page },
        { $pull: { urls: urlToRemove } },
        { new: true }
      );
      updated = true;
      
    }

    if (!updated) {
      
      return res.status(404).json({ error: 'Image not found' });
    }

    const updatedAsset = await ImageAssets.findOne({ page });
    if (updatedAsset && updatedAsset.urls.length > 0) {
      await ImageAssets.findOneAndUpdate(
        { page },
        { $set: { url: updatedAsset.urls[0] } },
        { new: true }
      );
      
    } else {
      await ImageAssets.findOneAndUpdate(
        { page },
        { $unset: { url: 1 } },
        { new: true }
      );
      
    }

    res.json({ message: 'Image removed successfully' });
  } catch (err) {
    console.error('Error removing image:', err.message);
    res.status(500).json({ error: 'Failed to remove image' });
  }
});

// PDF-related routes
router.get('/pdfs', async (req, res) => {
 
  const page = req.query.page || 'default';
  try {
    const pdfAsset = await PdfAssets.findOne({ page });
    
    const pdfs = pdfAsset ? pdfAsset.pdfs.map(p => ({ url: p.url, originalName: p.originalName || getCleanFilename(p.url), section: p.section })) : [];
    const cleanFilenames = pdfs.map(p => p.originalName);
    
    res.json({ pdfs, filenames: cleanFilenames });
  } catch (err) {
    console.error('Error fetching PDFs:', err.message);
    res.status(500).json({ error: 'Failed to fetch PDFs' });
  }
});

router.post('/pdfs', authenticateToken, upload.array('pdfs'), async (req, res) => {
  if (!req.isAdmin) {
    
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (!req.files || req.files.length === 0) {
    
    return res.status(400).json({ error: 'No files provided' });
  }

  const page = req.headers.page || 'default';
  const section = req.headers.section || 'default';
  

  try {
    const uploadPromises = req.files.map(async (file) => {
      const isValidPdf = file.mimetype.startsWith('application/pdf') || file.originalname.toLowerCase().endsWith('.pdf');
      if (!isValidPdf) {
       
        throw new Error('No valid PDF provided');
      }

      const url = `/uploads/${file.originalname}-${Date.now()}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: url.replace('/uploads/', ''),
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      
      const s3Response = await s3.upload(params).promise();
      

      const pdfAsset = await PdfAssets.findOne({ page });
      if (pdfAsset) {
        await PdfAssets.findOneAndUpdate(
          { page },
          { $push: { pdfs: { url: s3Response.Location, originalName: file.originalname, section } } },
          { new: true, runValidators: true }
        );
        
      } else {
        await PdfAssets.create({ pdfs: [{ url: s3Response.Location, originalName: file.originalname, section }], page });
        
      }
      return s3Response.Location;
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    res.json({ urls: uploadedUrls });
  } catch (err) {
    console.error('Error during PDF upload:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to upload PDFs: ' + err.message });
  }
});

router.delete('/pdfs', authenticateToken, async (req, res) => {
  if (!req.isAdmin) {
    
    return res.status(403).json({ error: 'Admin access required' });
  }
  const page = req.headers.page || 'default';
  const urlToRemove = req.headers.url;

  if (!urlToRemove) {
    
    return res.status(400).json({ error: 'URL to remove is required' });
  }

 
  try {
    const pdfAsset = await PdfAssets.findOne({ page });
    if (!pdfAsset) {
      
      return res.status(404).json({ error: 'PdfAsset not found' });
    }

    const key = urlToRemove.replace(`https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/`, '');
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    await s3.deleteObject(params).promise();
    

    if (pdfAsset.pdfs.some(p => p.url === urlToRemove)) {
      await PdfAssets.findOneAndUpdate(
        { page },
        { $pull: { pdfs: { url: urlToRemove } } },
        { new: true }
      );
      
    } else {
      
      return res.status(404).json({ error: 'PDF not found' });
    }

    res.json({ message: 'PDF removed successfully' });
  } catch (err) {
    console.error('Error removing PDF:', err.message);
    res.status(500).json({ error: 'Failed to remove PDF' });
  }
});

module.exports = router;