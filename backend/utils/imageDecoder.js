/**
 * Keerti Couture — Production Image Decoder, Sanitizer & Dimension Validator
 *
 * Employs dual-layer image security:
 * Layer 1: Fast binary header inspection and magic-byte structural verification
 * Layer 2: Full raster pixel decoding, total pixel bounds enforcement, and safe re-encoding via Sharp / libvips
 *
 * Security Controls:
 * 1. Rejects tracking pixels and corrupt blobs (min: 100x100)
 * 2. Rejects pixel flood attacks & decompression bombs (max: 5000x5000, max 16,000,000 total pixels)
 * 3. Re-encodes validated images into safe sanitized buffers, stripping malicious polyglots,
 *    embedded executable payloads, and corrupted EXIF metadata chunks.
 */

const sharp = require('sharp');

const MIN_DIMENSION = 100;
const MAX_DIMENSION = 5000;
const MAX_TOTAL_PIXELS = 16000000; // 16 Megapixels (e.g. 4000x4000)

/**
 * Fast synchronous binary header decoding (Layer 1)
 */
function decodePNGHeader(buffer) {
  if (buffer.length < 24) throw new Error('PNG buffer too small to contain valid IHDR header');
  const isPng =
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a;
  if (!isPng) throw new Error('Invalid PNG header signature');
  if (buffer.toString('ascii', 12, 16) !== 'IHDR') throw new Error('First PNG chunk must be IHDR');
  return { format: 'png', width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function decodeJPEGHeader(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new Error('Invalid JPEG SOI signature');
  }
  let offset = 2;
  const len = buffer.length;
  while (offset < len) {
    if (buffer[offset] !== 0xff) { offset++; continue; }
    while (offset < len && buffer[offset] === 0xff) offset++;
    if (offset >= len) break;
    const marker = buffer[offset++];
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) continue;
    if (offset + 2 > len) break;
    const segmentLength = buffer.readUInt16BE(offset);
    const isSOF = (marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) ||
                  (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf);
    if (isSOF) {
      if (offset + 7 > len) throw new Error('Truncated JPEG SOF segment');
      return { format: 'jpeg', height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    }
    offset += segmentLength;
  }
  throw new Error('No valid SOF marker found in JPEG buffer');
}

function decodeWEBPHeader(buffer) {
  if (buffer.length < 16) throw new Error('WebP buffer too small');
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('Invalid WebP RIFF/WEBP header');
  }
  const chunkHeader = buffer.toString('ascii', 12, 16);
  if (chunkHeader === 'VP8 ') {
    if (buffer.length < 30) throw new Error('Truncated VP8 chunk');
    if (buffer[23] !== 0x9d || buffer[24] !== 0x01 || buffer[25] !== 0x2a) throw new Error('Invalid VP8 sync code');
    return { format: 'webp', width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (chunkHeader === 'VP8L') {
    if (buffer.length < 25 || buffer[20] !== 0x2f) throw new Error('Invalid VP8L chunk');
    const width = 1 + (((buffer[22] & 0x3f) << 8) | buffer[21]);
    const height = 1 + (((buffer[24] & 0x0f) << 10) | (buffer[23] << 2) | ((buffer[22] & 0xc0) >> 6));
    return { format: 'webp', width, height };
  }
  if (chunkHeader === 'VP8X') {
    if (buffer.length < 30) throw new Error('Truncated VP8X chunk');
    return { format: 'webp', width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  }
  throw new Error(`Unsupported WebP chunk type: ${chunkHeader}`);
}

/**
 * Layer 1 Synchronous Header Dimension Validator
 */
function validateImageDimensions(buffer, options = {}) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Valid image buffer is required');
  }

  const minW = options.minWidth || MIN_DIMENSION;
  const minH = options.minHeight || MIN_DIMENSION;
  const maxW = options.maxWidth || MAX_DIMENSION;
  const maxH = options.maxHeight || MAX_DIMENSION;

  let decoded;
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    decoded = decodePNGHeader(buffer);
  } else if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    decoded = decodeJPEGHeader(buffer);
  } else if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    decoded = decodeWEBPHeader(buffer);
  } else {
    throw new Error('Unsupported image format. Allowed formats: PNG, JPEG, WEBP.');
  }

  const { width, height, format } = decoded;

  if (width < minW || height < minH) {
    throw new Error(`Image dimensions (${width}x${height}) are too small. Minimum required: ${minW}x${minH} pixels.`);
  }

  if (width > maxW || height > maxH) {
    throw new Error(`Image dimensions (${width}x${height}) exceed maximum allowed bounds of ${maxW}x${maxH} pixels.`);
  }

  return { valid: true, format, width, height };
}

/**
 * Layer 2: Complete Pixel Raster Decoding, Bounds Verification & Safe Re-Encoding
 *
 * Uses sharp (libvips) to:
 * 1. Fully decode image pixel raster data
 * 2. Enforce total pixel limit (preventing memory exhaustion)
 * 3. Re-encode into sanitized output format (stripping polyglots and comments)
 *
 * @param {Buffer} buffer - Untrusted input image buffer
 * @param {Object} options - Custom validation bounds
 * @returns {Promise<{ valid: boolean, format: string, width: number, height: number, totalPixels: number, sanitizedBuffer: Buffer, decoder: string }>}
 */
async function decodeAndSanitizeImage(buffer, options = {}) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 12) {
    throw new Error('Invalid or empty image buffer');
  }

  const minDim = options.minDimension || MIN_DIMENSION;
  const maxDim = options.maxDimension || MAX_DIMENSION;
  const maxPixels = options.maxTotalPixels || MAX_TOTAL_PIXELS;

  // First fast header pre-check
  validateImageDimensions(buffer, { minWidth: minDim, minHeight: minDim, maxWidth: maxDim, maxHeight: maxDim });

  // Full raster decode via sharp with hard memory limit on total input pixels
  let imageInstance;
  let metadata;
  try {
    imageInstance = sharp(buffer, {
      failOnError: true,
      limitInputPixels: maxPixels,
    });
    metadata = await imageInstance.metadata();
  } catch (decodeErr) {
    throw new Error(`Image decoding failed: ${decodeErr.message}`);
  }

  const allowedFormats = ['jpeg', 'png', 'webp'];
  if (!allowedFormats.includes(metadata.format)) {
    throw new Error(`Decoded format "${metadata.format}" is not allowed. Only JPEG, PNG, and WebP are supported.`);
  }

  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const totalPixels = width * height;

  if (width < minDim || height < minDim) {
    throw new Error(`Image dimensions (${width}x${height}) are below required minimum ${minDim}x${minDim} px`);
  }

  if (width > maxDim || height > maxDim) {
    throw new Error(`Image dimensions (${width}x${height}) exceed maximum allowed ${maxDim}x${maxDim} px`);
  }

  if (totalPixels > maxPixels) {
    throw new Error(`Total pixel count (${totalPixels.toLocaleString()} px) exceeds maximum limit of ${maxPixels.toLocaleString()} px`);
  }

  // Safe Re-encoding: strips all embedded comments, arbitrary metadata chunks, and polyglot code
  let sanitizedBuffer;
  try {
    if (metadata.format === 'png') {
      sanitizedBuffer = await sharp(buffer)
        .png({ compressionLevel: 8 })
        .toBuffer();
    } else if (metadata.format === 'webp') {
      sanitizedBuffer = await sharp(buffer)
        .webp({ quality: 85 })
        .toBuffer();
    } else {
      sanitizedBuffer = await sharp(buffer)
        .rotate() // Normalize EXIF orientation
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
    }
  } catch (reEncodeErr) {
    throw new Error(`Image sanitization and re-encoding failed: ${reEncodeErr.message}`);
  }

  return {
    valid: true,
    format: metadata.format,
    width,
    height,
    totalPixels,
    sanitizedBuffer,
    decoder: `sharp (libvips ${sharp.versions.vips})`,
  };
}

module.exports = {
  validateImageDimensions,
  decodeAndSanitizeImage,
  decodePNG: decodePNGHeader,
  decodeJPEG: decodeJPEGHeader,
  decodeWEBP: decodeWEBPHeader,
  MIN_DIMENSION,
  MAX_DIMENSION,
  MAX_TOTAL_PIXELS,
};
