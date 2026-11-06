/**
 * Keerti Couture — Defense-in-Depth CSRF Protection Middleware
 *
 * Protects cookie-authenticated state-changing operations (POST, PUT, PATCH, DELETE)
 * against Cross-Site Request Forgery (CSRF).
 *
 * Policy:
 * 1. Safe methods (GET, HEAD, OPTIONS) pass through.
 * 2. Requests authenticated explicitly via 'Authorization: Bearer' header pass through
 *    (Bearer tokens cannot be ambiently attached by cross-site forms or scripts).
 * 3. Webhook endpoints (e.g., Razorpay webhook) with HMAC signatures pass through.
 * 4. Unauthenticated public requests pass through.
 * 5. For requests relying on ambient 'jwt' cookies:
 *    - Rejects if Sec-Fetch-Site is 'cross-site'.
 *    - Rejects if Origin does not match allowed CORS origins.
 *    - Requires standard anti-CSRF custom headers ('X-Requested-With' or 'X-CSRF-Protection').
 */

const csrfProtection = (allowedOrigins = []) => {
  return (req, res, next) => {
    // 1. Safe methods are idempotent and cannot cause state mutation
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // 2. Webhook endpoints have dedicated cryptographic HMAC signatures
    if (req.originalUrl && req.originalUrl.includes('/webhook')) {
      return next();
    }

    // 3. Requests with explicit Authorization Bearer header are immune to ambient CSRF
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return next();
    }

    // 4. Check if the request contains an ambient auth cookie
    const hasAuthCookie = req.headers.cookie && req.headers.cookie.includes('jwt=');

    // If there is no auth cookie and no Bearer token, the request is anonymous
    if (!hasAuthCookie) {
      return next();
    }

    // 5. Ambient Cookie Request Inspection (CSRF Attack Surface)
    const secFetchSite = req.headers['sec-fetch-site'];
    if (secFetchSite === 'cross-site') {
      console.warn(`[CSRF] Blocked cross-site mutation to ${req.originalUrl}`);
      return res.status(403).json({
        success: false,
        message: 'Cross-site request blocked by CSRF policy',
      });
    }

    // Check Origin header if present
    const origin = req.headers.origin;
    if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
      console.warn(`[CSRF] Blocked request from disallowed origin: ${origin}`);
      return res.status(403).json({
        success: false,
        message: 'Origin not allowed by CSRF policy',
      });
    }

    // Custom Header Verification:
    // Browsers cannot set custom headers on cross-origin HTML forms or simple requests
    const customHeader = req.headers['x-requested-with'] || req.headers['x-csrf-protection'];
    if (!customHeader && !req.headers.origin) {
      // In browser contexts with cookies, either Origin or custom header must be present
      return res.status(403).json({
        success: false,
        message: 'Missing required anti-CSRF header for cookie-authenticated request',
      });
    }

    return next();
  };
};

module.exports = csrfProtection;

