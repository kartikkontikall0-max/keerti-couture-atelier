const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1. Check Authorization Bearer header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2) {
      token = parts[1];
    }
  }

  // 2. Check Cookie fallback (jwt=<token>) if Authorization header was not supplied
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';');
    for (const c of cookies) {
      const [key, val] = c.trim().split('=');
      if (key === 'jwt' && val) {
        token = decodeURIComponent(val);
        break;
      }
    }
  }

  // Handle literal "undefined" or "null" strings from broken frontend states
  if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[Auth] JWT_SECRET is not configured in environment');
      return res.status(500).json({ message: 'Authentication service configuration error' });
    }

    const decoded = jwt.verify(token, secret);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired, please log in again', expired: true });
    }
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin === true) {
    return next();
  }
  return res.status(403).json({ message: 'Not authorized as an administrator' });
};

// Optional authentication: attaches req.user if a valid token is provided, but continues if unauthenticated
const optionalProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2) token = parts[1];
  }

  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';');
    for (const c of cookies) {
      const [key, val] = c.trim().split('=');
      if (key === 'jwt' && val) {
        token = decodeURIComponent(val);
        break;
      }
    }
  }

  if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (secret) {
      const decoded = jwt.verify(token, secret);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch {
    // Ignore invalid/expired token for optional protect
  }

  return next();
};

module.exports = { protect, admin, optionalProtect };
