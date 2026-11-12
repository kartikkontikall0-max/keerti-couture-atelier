'use strict';

/**
 * ==============================================================================
 * KEERTI COUTURE — PRODUCTION ENVIRONMENT VALIDATOR
 * ==============================================================================
 * Validates essential environment configurations on server bootstrap.
 * Distinguishes mandatory runtime requirements from optional integrations
 * (Cloudinary, SMTP, Razorpay) with clear, actionable operational logs.
 */

const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';
  const errors = [];
  const warnings = [];

  // 1. Mandatory Core Variables
  if (!process.env.MONGO_URI && !process.env.USE_MEMORY_DB) {
    errors.push('MONGO_URI is missing. A valid MongoDB connection string is required.');
  }

  if (isProduction && process.env.MONGO_URI && process.env.MONGO_URI.includes('memory')) {
    errors.push('Production environment cannot use an in-memory database. A persistent MongoDB URI is required.');
  }

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required for authentication cookie signing.');
  } else if (isProduction && (process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes('replace_with') || process.env.JWT_SECRET === 'secret')) {
    errors.push('Production JWT_SECRET must be a cryptographically strong secret of at least 32 characters.');
  }

  // 2. Integration Status Checks (Non-blocking with clear status reporting)
  const cloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name' &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== 'your_cloudinary_api_key' &&
    process.env.CLOUDINARY_API_KEY !== 'your_api_key'
  );

  const smtpConfigured = Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_HOST !== 'smtp.your-email-provider.com' &&
    process.env.SMTP_USER &&
    process.env.SMTP_USER !== 'your_smtp_username'
  );

  const razorpayConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id' &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret'
  );

  // 3. Operational Telemetry Logging
  if (!isTest) {
    console.log('────────────────────────────────────────────────────────────');
    console.log('  KEERTI COUTURE — ATELIER SYSTEM CONFIGURATION AUDIT       ');
    console.log('────────────────────────────────────────────────────────────');
    console.log(`  Environment Mode      : ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Atelier HTTP Port     : ${process.env.PORT || 5000}`);
    console.log(`  MongoDB Storage       : ${process.env.MONGO_URI ? 'PERSISTENT' : 'IN-MEMORY TEST'}`);
    console.log(`  CORS Origins Whitelist: ${process.env.ALLOWED_ORIGINS || 'Default (localhost:3000, 3001)'}`);
    console.log(`  Cloudinary Storage    : ${cloudinaryConfigured ? 'ACTIVE (Remote Cloud Storage)' : 'FALLBACK (Local Placeholders / 503)'}`);
    console.log(`  Transactional Email   : ${smtpConfigured ? 'ACTIVE (Remote SMTP Host)' : 'DEVELOPMENT / MOCK TRANSPORT'}`);
    console.log(`  Razorpay Payments     : ${razorpayConfigured ? 'ACTIVE (Cryptographic Test/Live)' : 'OPTIONAL / PORTFOLIO DEMO MODE'}`);
    console.log('────────────────────────────────────────────────────────────');
  }

  if (errors.length > 0) {
    console.error('\n[Fatal Environment Validation Error]');
    errors.forEach(err => console.error(`  ✗ ${err}`));
    throw new Error(`Environment validation failed with ${errors.length} error(s). Server boot aborted.`);
  }

  return {
    isProduction,
    cloudinaryConfigured,
    smtpConfigured,
    razorpayConfigured,
  };
};

module.exports = validateEnv;

