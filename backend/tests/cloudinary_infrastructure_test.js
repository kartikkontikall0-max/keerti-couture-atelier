'use strict';

/**
 * ==============================================================================
 * KEERTI COUTURE — CLOUDINARY INFRASTRUCTURE & UPLOAD DEFENSE VERIFICATION SUITE
 * ==============================================================================
 * Validates the complete image infrastructure:
 * 1. Valid JPEG upload & Sharp raster processing
 * 2. Valid PNG upload & Sharp raster processing
 * 3. Oversized file rejection (> 10MB)
 * 4. Invalid MIME type rejection
 * 5. Executable file rejection (.exe, .sh, scripts)
 * 6. MIME / magic-byte spoofing rejection
 * 7. Unauthorized upload rejection (401 Unauthorized)
 * 8. Missing Cloudinary credentials fallback (honest 503 with metadata)
 * 9. Signed upload authorization (/api/upload/signature)
 * 10. Database persistence of Cloudinary image metadata & frontend retrieval compatibility
 */

process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'test_jwt_secret_cloudinary_32_chars';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3001';

const http = require('http');
const sharp = require('sharp');
const mongoose = require('mongoose');
const { app } = require('../server');
const connectDB = require('../config/db');
const { disconnectDB } = require('../config/db');
const User = require('../models/User');
const Design = require('../models/Design');
const generateToken = require('../utils/generateToken');

let server;
let baseUrl;
let adminToken;
let customerToken;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ [FAIL] ${testName} - ${details}`);
    failures.push({ testName, details });
  }
}

// Multipart form builder helper for native http.request
function createMultipartPayload(fieldName, filename, mimetype, fileBuffer, extraFields = {}) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const crlf = '\r\n';
  const parts = [];

  // Extra text fields
  for (const [key, val] of Object.entries(extraFields)) {
    parts.push(
      `--${boundary}${crlf}` +
      `Content-Disposition: form-data; name="${key}"${crlf}${crlf}` +
      `${val}${crlf}`
    );
  }

  // File field
  const fileHeader =
    `--${boundary}${crlf}` +
    `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"${crlf}` +
    `Content-Type: ${mimetype}${crlf}${crlf}`;

  const footer = `${crlf}--${boundary}--${crlf}`;

  const bodyBuffer = Buffer.concat([
    Buffer.from(parts.join(''), 'utf8'),
    Buffer.from(fileHeader, 'utf8'),
    fileBuffer,
    Buffer.from(footer, 'utf8'),
  ]);

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: bodyBuffer,
  };
}

function sendRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders = { ...headers };

    if (body && !reqHeaders['Content-Length']) {
      reqHeaders['Content-Length'] = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body);
    }

    const req = http.request(url, { method, headers: reqHeaders }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = raw;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runCloudinarySuite() {
  console.log('============================================================');
  console.log('  KEERTI COUTURE — CLOUDINARY & IMAGE INFRASTRUCTURE TESTS  ');
  console.log('============================================================\n');

  try {
    await connectDB();
    server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    baseUrl = `http://localhost:${server.address().port}`;

    // Seed test users
    await User.deleteMany({});
    const adminUser = await User.create({
      name: 'Atelier Creative Director',
      email: 'director@keerticouture.com',
      password: 'StrongP@ssw0rd2026',
      isAdmin: true,
    });
    const customerUser = await User.create({
      name: 'Bridal Patron',
      email: 'patron@example.com',
      password: 'StrongP@ssw0rd2026',
      isAdmin: false,
    });

    adminToken = generateToken(adminUser._id);
    customerToken = generateToken(customerUser._id);

    console.log('--- SUITE 1: Image Decoding, Raster Validation & Cloudinary Fallback ---');

    // 1. Valid JPEG buffer creation via Sharp
    const validJpegBuffer = await sharp({
      create: {
        width: 600,
        height: 800,
        channels: 3,
        background: { r: 139, g: 34, b: 56 }, // Couture Rosewood #8B2238
      },
    }).jpeg().toBuffer();

    const jpegPayload = createMultipartPayload('image', 'blouse_design.jpg', 'image/jpeg', validJpegBuffer);
    const jpegRes = await sendRequest('POST', '/api/upload', {
      'Content-Type': jpegPayload.contentType,
      Authorization: `Bearer ${adminToken}`,
    }, jpegPayload.body);

    // In environment without real credentials, returns structured 503 with sanitized metadata
    assert(
      jpegRes.status === 503 || jpegRes.status === 200,
      'Valid JPEG image processed cleanly without 400 Bad Request or crash',
      `Got status ${jpegRes.status}`
    );
    if (jpegRes.status === 503) {
      assert(
        jpegRes.body.sanitizedMetadata && jpegRes.body.sanitizedMetadata.width === 600,
        'Full raster decoder verified geometry (600x800px) and sanitized JPEG'
      );
    }

    // 2. Valid PNG buffer creation via Sharp
    const validPngBuffer = await sharp({
      create: {
        width: 500,
        height: 500,
        channels: 4,
        background: { r: 197, g: 160, b: 89, alpha: 1 }, // Antique Gold #C5A059
      },
    }).png().toBuffer();

    const pngPayload = createMultipartPayload('image', 'embroidery_sample.png', 'image/png', validPngBuffer);
    const pngRes = await sendRequest('POST', '/api/upload', {
      'Content-Type': pngPayload.contentType,
      Authorization: `Bearer ${adminToken}`,
    }, pngPayload.body);

    assert(
      pngRes.status === 503 || pngRes.status === 200,
      'Valid PNG image processed cleanly without 400 rejection',
      `Got status ${pngRes.status}`
    );

    // 3. Oversized file rejection (> 10MB)
    console.log('\n--- SUITE 2: Security Boundaries & Attack Prevention ---');
    const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB dummy buffer
    const oversizedPayload = createMultipartPayload('image', 'oversized.jpg', 'image/jpeg', oversizedBuffer);
    const oversizedRes = await sendRequest('POST', '/api/upload', {
      'Content-Type': oversizedPayload.contentType,
      Authorization: `Bearer ${adminToken}`,
    }, oversizedPayload.body);

    assert(
      oversizedRes.status === 400 && oversizedRes.body.message.includes('File too large'),
      'Oversized file (>10MB) strictly rejected with 400 Bad Request'
    );

    // 4. Invalid MIME rejection (PDF document)
    const pdfBuffer = Buffer.from('%PDF-1.4 Fake PDF file content here');
    const pdfPayload = createMultipartPayload('image', 'document.pdf', 'application/pdf', pdfBuffer);
    const pdfRes = await sendRequest('POST', '/api/upload', {
      'Content-Type': pdfPayload.contentType,
      Authorization: `Bearer ${adminToken}`,
    }, pdfPayload.body);

    assert(
      pdfRes.status === 400 && pdfRes.body.message.includes('Only JPEG, PNG, JPG, and WEBP'),
      'Invalid MIME type (application/pdf) rejected with 400 Bad Request'
    );

    // 5. Executable file rejection (.exe)
    const exeBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00Windows Executable Header');
    const exePayload = createMultipartPayload('image', 'payload.exe', 'application/octet-stream', exeBuffer);
    const exeRes = await sendRequest('POST', '/api/upload', {
      'Content-Type': exePayload.contentType,
      Authorization: `Bearer ${adminToken}`,
    }, exePayload.body);

    assert(
      exeRes.status === 400,
      'Executable file (.exe) strictly rejected at multer filter boundary'
    );

    // 6. MIME spoofing rejection (Text file disguised as .jpg with image/jpeg header)
    const fakeImageBuffer = Buffer.from('<html><script>alert("xss")</script></html>');
    const spoofPayload = createMultipartPayload('image', 'malicious.jpg', 'image/jpeg', fakeImageBuffer);
    const spoofRes = await sendRequest('POST', '/api/upload', {
      'Content-Type': spoofPayload.contentType,
      Authorization: `Bearer ${adminToken}`,
    }, spoofPayload.body);

    assert(
      spoofRes.status === 400 && spoofRes.body.message.includes('Magic byte verification failed'),
      'MIME spoofing attack caught and rejected by magic byte inspection'
    );

    // 7. Unauthorized upload rejection
    const unauthPayload = createMultipartPayload('image', 'unauth.jpg', 'image/jpeg', validJpegBuffer);
    const unauthRes = await sendRequest('POST', '/api/upload', {
      'Content-Type': unauthPayload.contentType,
    }, unauthPayload.body);

    assert(
      unauthRes.status === 401,
      'Unauthenticated upload rejected with 401 Unauthorized'
    );

    // Customer trying to upload to admin endpoint
    const nonAdminRes = await sendRequest('POST', '/api/upload', {
      'Content-Type': unauthPayload.contentType,
      Authorization: `Bearer ${customerToken}`,
    }, unauthPayload.body);

    assert(
      nonAdminRes.status === 403,
      'Non-admin patron upload to admin catalog rejected with 403 Forbidden'
    );

    // Customer can upload to /api/upload/user
    const customerUploadRes = await sendRequest('POST', '/api/upload/user', {
      'Content-Type': unauthPayload.contentType,
      Authorization: `Bearer ${customerToken}`,
    }, unauthPayload.body);

    assert(
      customerUploadRes.status === 503 || customerUploadRes.status === 200,
      'Customer reference image upload route (/api/upload/user) functions cleanly'
    );

    // 8. Signed upload authorization (/api/upload/signature)
    console.log('\n--- SUITE 3: Signed Upload Authorization & Scope Guards ---');
    const sigRes = await sendRequest('GET', '/api/upload/signature', {
      Authorization: `Bearer ${adminToken}`,
    });

    assert(
      sigRes.status === 503 || sigRes.status === 200,
      'Signature endpoint returns structured response without crash'
    );
    if (sigRes.status === 503) {
      assert(
        sigRes.body.configured === false && sigRes.body.message.includes('Cloudinary storage is not configured'),
        'Signature endpoint gracefully reports unconfigured state when credentials missing'
      );
    }

    // Asset deletion scope protection
    const badDeleteRes = await sendRequest('DELETE', '/api/upload/other_folder/hack.jpg', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(
      badDeleteRes.status === 403 && badDeleteRes.body.message.includes('Unauthorized asset scope'),
      'Asset deletion strictly blocked for paths outside boutique scope tailor_shop/ (403 Forbidden)'
    );

    // 9. Database persistence with Cloudinary metadata & frontend compatibility
    console.log('\n--- SUITE 4: Database Persistence & Frontend Retrieval ---');
    await Design.deleteMany({});
    const designWithCloudinary = await Design.create({
      name: 'Kanjivaram Silk Cloudinary Asset',
      category: 'Silk Blouse',
      price: 3400,
      description: 'Handwoven pure silk blouse with zardosi needlework',
      images: [
        {
          url: 'https://res.cloudinary.com/demo/image/upload/v1/tailor_shop/kanjivaram_sample.jpg',
          public_id: 'tailor_shop/kanjivaram_sample',
          width: 800,
          height: 1000,
        },
      ],
      neckStyle: 'Sweetheart',
      sleeveType: 'Elbow Length',
      backDesign: 'Deep U with Dori',
    });

    assert(
      designWithCloudinary._id && designWithCloudinary.images[0].public_id === 'tailor_shop/kanjivaram_sample',
      'Design record successfully persisted with Cloudinary public_id and secure URL'
    );

    const fetchedDesign = await Design.findById(designWithCloudinary._id);
    assert(
      fetchedDesign.images[0].url.startsWith('https://res.cloudinary.com'),
      'Retrieved design exposes legitimate Cloudinary secure image URL for frontend rendering'
    );

    console.log('\n============================================================');
    console.log(`  CLOUDINARY TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${failedTests} FAILED)`);
    console.log('============================================================\n');

    if (failedTests > 0) {
      console.error('Failures detected:', failures);
      process.exitCode = 1;
    }
  } finally {
    if (server) server.close();
    await disconnectDB();
  }
}

runCloudinarySuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

