const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { decodeAndSanitizeImage, validateImageDimensions } = require('../utils/imageDecoder');

const router = express.Router();

// ─── Cloudinary config (lazy) ───────────────────────────────────────────────
let cloudinaryConfigured = false;
const configureCloudinary = () => {
  if (!cloudinaryConfigured && process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name') {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    cloudinaryConfigured = true;
  }
};

// ─── Multer – memory storage with 10 MB limit ───────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, JPG and WEBP are allowed.'));
    }
  },
});

// ─── Magic byte inspection (file content verification) ──────────────────────
const validateImageMagicBytes = (buffer) => {
  if (!buffer || buffer.length < 12) return false;

  // JPEG / JPG: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true;
  }

  // WEBP: 'RIFF' at 0..3 and 'WEBP' at 8..11
  const riff = buffer.toString('ascii', 0, 4);
  const webp = buffer.toString('ascii', 8, 12);
  if (riff === 'RIFF' && webp === 'WEBP') {
    return true;
  }

  return false;
};

// ─── Shared upload handler ───────────────────────────────────────────────────
const handleUpload = async (req, res) => {
  configureCloudinary();
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Verify true file content via magic bytes (prevents extension/MIME spoofing)
    if (!validateImageMagicBytes(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or corrupted image content. Magic byte verification failed.',
      });
    }

    // Full raster pixel decoding, bounds verification & safe re-encoding via Sharp
    let processedImage;
    try {
      processedImage = await decodeAndSanitizeImage(req.file.buffer);
    } catch (dimErr) {
      return res.status(400).json({
        success: false,
        message: dimErr.message,
      });
    }

    // If Cloudinary is configured, upload sanitized buffer; otherwise respond with an error
    if (cloudinaryConfigured) {
      const b64 = processedImage.sanitizedBuffer.toString('base64');
      const dataURI = `data:image/${processedImage.format};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'tailor_shop',
      });

      return res.json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        imageUrl: result.secure_url,   // extra alias for frontend convenience
        width: processedImage.width,
        height: processedImage.height,
        format: processedImage.format,
        sanitized: true,
      });
    } else {
      // Cloudinary not configured – return a helpful error
      return res.status(503).json({
        message: 'Image storage is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in your .env file.',
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message || 'Image upload failed' });
  }
};

// ─── Routes ──────────────────────────────────────────────────────────────────

// Admin-only upload (for design portfolio images)
router.post('/', protect, admin, uploadLimiter, upload.single('image'), handleUpload);

// Authenticated user upload (for customer reference images at checkout)
router.post('/user', protect, uploadLimiter, upload.single('image'), handleUpload);

// Secure asset deletion to clean up replaced or orphaned images
router.delete('/:publicId(*)', protect, async (req, res) => {
  configureCloudinary();
  try {
    const publicId = req.params.publicId;
    if (!publicId || !publicId.trim()) {
      return res.status(400).json({ success: false, message: 'Public ID is required' });
    }

    // Safety guard: only allow deleting assets residing inside the boutique folder
    if (!publicId.startsWith('tailor_shop/')) {
      return res.status(403).json({ success: false, message: 'Unauthorized asset scope' });
    }

    if (cloudinaryConfigured) {
      const result = await cloudinary.uploader.destroy(publicId);
      return res.json({ success: true, result });
    } else {
      return res.json({ success: true, message: 'Simulated asset deletion' });
    }
  } catch (error) {
    console.error('Delete asset error:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete asset' });
  }
});

// Multer error handler (file size / type errors)
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

module.exports = router;
