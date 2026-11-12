/**
 * ==============================================================================
 * KEERTI COUTURE — DEMO SEED SAFETY VALIDATOR
 * ==============================================================================
 * Enforces strict, fail-closed validation on database connection parameters
 * before allowing any destructive clearing or re-seeding operations.
 *
 * Rules:
 *   1. Strictly rejects production environments (NODE_ENV=production).
 *   2. Requires explicit demo authorization (ALLOW_DEMO_SEED=true or DEMO_MODE=true).
 *   3. Rejects remote cloud clusters (mongodb+srv:// or non-local hosts).
 *   4. Restricts host to loopback interfaces (localhost, 127.0.0.1, ::1).
 *   5. Enforces approved demo database naming convention (*_demo or *-demo).
 * ==============================================================================
 */

'use strict';

/**
 * Validates connection and environment parameters for demo data seeding.
 * @param {Object} options Configuration overrides
 * @returns {{ safe: boolean, reason?: string, hostname?: string, dbName?: string, port?: number }}
 */
function validateDemoSeedConfig(options = {}) {
  const env = (options.nodeEnv || process.env.NODE_ENV || 'development').toLowerCase().trim();
  const uri = options.mongoUri || process.env.MONGO_URI;
  const allowSeed = options.allowDemoSeed !== undefined
    ? Boolean(options.allowDemoSeed)
    : (process.env.ALLOW_DEMO_SEED === 'true' || process.env.DEMO_MODE === 'true');

  // 1. Production environment strictly prohibited
  if (env === 'production') {
    return {
      safe: false,
      reason: 'CRITICAL: Demo seeding is strictly forbidden in production mode (NODE_ENV=production).'
    };
  }

  // 2. Explicit demo authorization required (except during automated testing)
  if (!allowSeed && env !== 'test') {
    return {
      safe: false,
      reason: 'AUTHORIZATION ERROR: Demo seeding requires explicit authorization. Set ALLOW_DEMO_SEED=true or DEMO_MODE=true in environment.'
    };
  }

  // 3. URI must be provided as a string
  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    return {
      safe: false,
      reason: 'CONFIG ERROR: MONGO_URI must be a non-empty string.'
    };
  }

  // 4. Remote Atlas/cloud clusters prohibited
  if (uri.startsWith('mongodb+srv://')) {
    return {
      safe: false,
      reason: 'SAFETY GUARD: mongodb+srv:// indicates a remote cloud database cluster. Demo seeding is restricted to local standalone instances.'
    };
  }

  // 5. Robust URI parsing
  let parsedUrl;
  try {
    const normalized = uri.replace(/^mongodb:\/\//, 'http://');
    parsedUrl = new URL(normalized);
  } catch (err) {
    return {
      safe: false,
      reason: `PARSE ERROR: Invalid MongoDB connection string format (${err.message}).`
    };
  }

  // 6. Host validation: host must be strictly loopback
  const allowedHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
  const hostname = parsedUrl.hostname.toLowerCase();
  if (!allowedHosts.has(hostname)) {
    return {
      safe: false,
      reason: `SAFETY GUARD: Remote host "${hostname}" is prohibited for demo seeding. Host must be strictly localhost or 127.0.0.1.`
    };
  }

  // 7. Database Name validation
  const dbName = parsedUrl.pathname ? parsedUrl.pathname.replace(/^\//, '').split('?')[0].trim() : '';
  if (!dbName) {
    return {
      safe: false,
      reason: 'CONFIG ERROR: Connection URI must explicitly include a database name.'
    };
  }

  // Approved demo database name policy: must end with _demo, -demo, or match approved demo identifiers
  const isApprovedDbName = /^(keerti_couture_demo|tailor_shop_demo|[a-z0-9_-]+_demo|[a-z0-9_-]+-demo)$/i.test(dbName);
  if (!isApprovedDbName) {
    return {
      safe: false,
      reason: `DATABASE NAME MISMATCH: Database name "${dbName}" does not satisfy demo naming policy (*_demo or *-demo). Refusing to wipe non-demo database.`
    };
  }

  return {
    safe: true,
    hostname,
    dbName,
    port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 27017
  };
}

module.exports = { validateDemoSeedConfig };
